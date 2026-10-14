/**
 * Express HTTP API and Minimal Workflow UI Server.
 * Exposes real endpoints for Student, Teacher, and Admin workflows.
 * Source of truth: docs/06_API_AND_WORKFLOWS.md, docs/09_IMPLEMENTATION_SEQUENCE.md
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { TimetableRepository, populateRealisticUniversityData } from '../data/repository.js';
import {
  AuthService,
  AuthSession,
  AuthenticatedUser,
  createAuthMiddleware,
  requireAuth,
  requireRole,
} from '../services/authService.js';
import { RegularClassService } from '../services/regularClassService.js';
import { ExtraClassService } from '../services/extraClassService.js';
import { StudentTransferService } from '../services/studentTransferService.js';
import { GeneratorAdapterService } from '../services/generatorAdapter.js';
import { DraftImportService } from '../services/draftImportService.js';
import { PublicationService } from '../services/publicationService.js';
import {
  AcademicTerm,
  Section,
  Batch,
  Course,
  CourseOffering,
  Room,
  Teacher,
} from '../domain/types.js';
import { renderHtmlUI } from './ui.js';
import { persistOccurrenceToDb, persistExtraClassToDb, persistNotificationToDb } from '../data/dbSync.js';

export function createApp(initialRepo?: TimetableRepository) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  const repo = initialRepo || new TimetableRepository();
  const authService = new AuthService(repo);
  const regularService = new RegularClassService(repo);
  const extraService = new ExtraClassService(repo);
  const transferService = new StudentTransferService(repo);
  const genAdapter = new GeneratorAdapterService(repo);
  const importService = new DraftImportService(repo);
  const pubService = new PublicationService(repo);

  // Apply authentication & session verification middleware
  app.use(createAuthMiddleware(authService));

  // Seed sample initial data if repository is empty
  seedInitialData(repo);

  // Background replication listener for authoritative database synchronization
  repo.onPostCommit((event) => {
    if (event.type === 'NOTIFICATIONS_DISPATCHED') {
      const notices = event.payload as any[];
      for (const notice of notices) {
        persistNotificationToDb(notice).catch((e) =>
          console.warn('[Supabase DB] Failed to persist notification:', e.message)
        );
      }
    }
  });

  // Authentication helper: uses verified req.user when present, defaults to zero-trust student
  function getSession(req: Request): AuthSession {
    const user = (req as any).user as AuthenticatedUser | undefined;
    if (user) {
      return {
        userId: user.id,
        email: user.email,
        role: user.role,
        linkedId: user.entityId || (user.role === 'teacher' ? 't-1' : (user.role === 'student' ? 'stud-1' : undefined)),
      };
    }

    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.APP_ENV === 'test';
    if (isTestEnv) {
      const roleHeader = req.headers['x-user-role'] as string;
      const userIdHeader = req.headers['x-user-id'] as string;
      const linkedIdHeader = req.headers['x-linked-id'] as string;

      if (roleHeader) {
        return {
          userId: userIdHeader || 'test-user-id',
          email: `${userIdHeader || 'test-user'}@university.edu`,
          role: (roleHeader as any),
          linkedId: linkedIdHeader || (roleHeader === 'teacher' ? 't-1' : (roleHeader === 'student' ? 'stud-1' : undefined)),
        };
      }
    }

    // Zero-trust default: anonymous unauthenticated requests receive read-only student context
    return {
      userId: 'anonymous',
      email: 'anonymous@university.edu',
      role: 'student',
      linkedId: 'stud-1',
    };
  }


  // --------------------------------------------------------------------------
  // 0. Supabase Authentication & User Provisioning Endpoints
  // --------------------------------------------------------------------------
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Email and password are required.' });
      }
      const { token, user } = await authService.login(email, password);
      res.json({ success: true, token, user });
    } catch (err: any) {
      if (err.message.includes('AUTH_SERVICE_UNCONFIGURED')) {
        return res.status(503).json({ success: false, error: 'AUTH_SERVICE_UNCONFIGURED', message: err.message });
      }
      res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Invalid email or password.' });
    }
  });

  app.post('/api/auth/admin/provision-user', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const actor = (req as any).user as AuthenticatedUser;
      const { email, name, role, entityId, password, studentDetails } = req.body;
      if (!email || !name || !role) {
        return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Email, name, and role are required.' });
      }

      // If provisioning a student with academic details, create authoritative student records
      let resolvedEntityId = entityId;
      if (role === 'student' && studentDetails) {
        const rollNumber = String(studentDetails.rollNumber || entityId || `2025BTECH${Math.floor(100 + Math.random() * 900)}`).trim();
        const sectionId = studentDetails.sectionId ? String(studentDetails.sectionId).trim() : undefined;
        const batchId = studentDetails.batchId ? String(studentDetails.batchId).trim() : undefined;
        const electiveGroupId = studentDetails.electiveGroupId ? String(studentDetails.electiveGroupId).trim() : undefined;

        await repo.runTransaction(async (tx) => {
          // Check if student with this roll or id exists
          let student = Array.from(tx.students.values()).find(
            (s) => s.rollNumber === rollNumber || s.id === entityId || s.email.toLowerCase() === email.toLowerCase()
          );

          const studentId = student ? student.id : (entityId && !entityId.startsWith('2025') ? entityId : `stud-${Date.now().toString(36)}`);
          resolvedEntityId = rollNumber;

          if (!student) {
            student = {
              id: studentId,
              rollNumber,
              name,
              email: email.toLowerCase().trim(),
              active: true,
            };
            tx.students.set(studentId, student);
          } else {
            student.rollNumber = rollNumber;
            student.name = name;
            student.email = email.toLowerCase().trim();
          }

          const effectiveDate = new Date().toISOString().split('T')[0];

          // Enroll into Section
          if (sectionId) {
            const secMemId = `sgm-${studentId}-sec-${Date.now().toString(36)}`;
            tx.studentGroupMemberships.set(secMemId, {
              id: secMemId,
              studentId,
              groupId: sectionId,
              groupType: 'section',
              effectiveStartDate: effectiveDate,
            });
          }

          // Enroll into Batch
          if (batchId) {
            const batchMemId = `sgm-${studentId}-batch-${Date.now().toString(36)}`;
            tx.studentGroupMemberships.set(batchMemId, {
              id: batchMemId,
              studentId,
              groupId: batchId,
              groupType: 'batch',
              effectiveStartDate: effectiveDate,
            });
          }

          // Enroll into Elective
          if (electiveGroupId) {
            const eaId = `ea-${studentId}-${Date.now().toString(36)}`;
            tx.electiveAssignments.set(eaId, {
              id: eaId,
              studentId,
              electiveGroupId,
              assignedBy: actor.id,
              assignedAt: new Date().toISOString(),
              status: 'active',
            });
          }
        });
      }

      const provisioned = await authService.provisionUser(actor.role, {
        email,
        name,
        role,
        entityId: resolvedEntityId,
        password,
      });
      res.json({ success: true, user: provisioned });
    } catch (err: any) {
      if (err.message.startsWith('FORBIDDEN') || err.message.startsWith('ERR_FORBIDDEN')) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: err.message });
      }
      res.status(400).json({ success: false, error: 'PROVISIONING_FAILED', message: err.message });
    }
  });

  app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const result = await authService.requestPasswordRecovery(email);
      res.json({ success: true, message: result.message });
    } catch {
      res.json({ success: true, message: 'If the email exists, a reset link has been dispatched' });
    }
  });

  app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
    res.json({ success: true, user: (req as any).user });
  });

  app.post('/api/auth/change-password', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthenticatedUser;
      const { newPassword } = req.body;
      const result = await authService.changePassword(user.id, newPassword);
      res.json(result);
    } catch (err: any) {
      if (err.message.startsWith('INVALID_PASSWORD')) {
        return res.status(400).json({ success: false, error: 'INVALID_PASSWORD', message: err.message });
      }
      res.status(400).json({ success: false, error: 'PASSWORD_UPDATE_FAILED', message: err.message });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    res.json({ success: true, message: 'Logged out successfully.' });
  });

  // --------------------------------------------------------------------------
  // 1. Reference Data Endpoints
  // --------------------------------------------------------------------------
  app.get('/api/state', (req: Request, res: Response) => {
    const state = repo.getState();
    res.json({
      academicTerms: Array.from(state.academicTerms.values()),
      rooms: Array.from(state.rooms.values()),
      teachers: Array.from(state.teachers.values()),
      teacherAvailabilities: Array.from(state.teacherAvailabilities.values()),
      sections: Array.from(state.sections.values()),
      batches: Array.from(state.batches.values()),
      students: Array.from(state.students.values()),
      studentGroupMemberships: Array.from(state.studentGroupMemberships.values()),
      electiveGroups: Array.from(state.electiveGroups.values()),
      electiveAssignments: Array.from(state.electiveAssignments.values()),
      courses: Array.from(state.courses.values()),
      courseOfferings: Array.from(state.courseOfferings.values()),
      timetableVersions: Array.from(state.timetableVersions.values()),
      scheduledClasses: Array.from(state.scheduledClasses.values()),
      classOccurrences: Array.from(state.classOccurrences.values()),
      gridConfig: state.gridConfig,
      auditEvents: state.auditEvents.slice(-50),
      notifications: state.notificationOutbox,
    });
  });

  // --------------------------------------------------------------------------
  // 1.1 Modular Entity Management: Academic Hierarchy
  // --------------------------------------------------------------------------
  app.post('/api/academic/terms', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const { id, yearLabel, semesterNumber, startDate, endDate, cycle, status, gridConfig } = req.body;
      if (!yearLabel || !semesterNumber || !startDate || !endDate) {
        return res.status(400).json({ success: false, error: 'Missing required term fields (yearLabel, semesterNumber, startDate, endDate).' });
      }
      const termId = id || `term-${semesterNumber}`;
      const term: AcademicTerm = {
        id: termId,
        yearLabel: String(yearLabel),
        semesterNumber: Number(semesterNumber),
        startDate: String(startDate),
        endDate: String(endDate),
        cycle: cycle === 'even' ? 'even' : 'odd',
        status: (status || 'active') as any,
      };

      await repo.runTransaction(async (tx) => {
        tx.academicTerms.set(termId, term);
        if (gridConfig) {
          if (Array.isArray(gridConfig.days)) tx.gridConfig.days = gridConfig.days;
          if (typeof gridConfig.slotsPerDay === 'number') tx.gridConfig.slotsPerDay = gridConfig.slotsPerDay;
        }
      });
      repo.logAudit(session.userId, 'CREATE_OR_UPDATE_TERM', 'academic_terms', termId, 'success', { term });
      res.json({ success: true, term });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/academic/sections', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const { id, termId, name, expectedCount } = req.body;
      if (!termId || !name) {
        return res.status(400).json({ success: false, error: 'Missing required section fields (termId, name).' });
      }
      const count = Number(expectedCount || 0);
      if (count <= 0) {
        return res.status(400).json({ success: false, error: 'Cohort student size must be greater than zero.' });
      }
      const state = repo.getState();
      if (!state.academicTerms.has(termId)) {
        return res.status(400).json({ success: false, error: `Academic term ${termId} does not exist.` });
      }

      const secId = id || `sec-${String(name).trim().replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
      const section: Section = {
        id: secId,
        termId: String(termId),
        name: String(name),
        expectedCount: count,
        active: true,
      };

      await repo.runTransaction(async (tx) => {
        tx.sections.set(secId, section);
      });
      repo.logAudit(session.userId, 'CREATE_SECTION', 'sections', secId, 'success', { section });
      res.json({ success: true, section });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/academic/batches', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const { id, sectionId, name, expectedCount } = req.body;

      if (!sectionId || !name) {
        return res.status(400).json({ success: false, error: 'Missing required batch fields (sectionId, name).' });
      }
      const count = Number(expectedCount || 0);
      if (count <= 0) {
        return res.status(400).json({ success: false, error: 'Batch student count must be greater than zero.' });
      }
      const state = repo.getState();
      const parentSection = state.sections.get(sectionId);
      if (!parentSection) {
        return res.status(400).json({ success: false, error: `Parent section ${sectionId} does not exist.` });
      }

      const batchId = id || `batch-${parentSection.name.replace(/[^a-zA-Z0-9]/g, '')}-${String(name).trim().replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
      const batch: Batch = {
        id: batchId,
        sectionId: String(sectionId),
        name: String(name),
        expectedCount: count,
        active: true,
      };

      await repo.runTransaction(async (tx) => {
        tx.batches.set(batchId, batch);
      });
      repo.logAudit(session.userId, 'CREATE_BATCH', 'batches', batchId, 'success', { batch });
      res.json({ success: true, batch });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // 1.2 Modular Entity Management: Course Catalog & Offerings
  // --------------------------------------------------------------------------
  app.post('/api/catalog/courses', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const { id, code, name, termId, department, lectureHours, tutorialHours, practicalHours, requiredRoomType } = req.body;
      if (!code || !name || !termId) {
        return res.status(400).json({ success: false, error: 'Missing required course fields (code, name, termId).' });
      }

      const lHours = Math.max(0, Number(lectureHours || 0));
      const tHours = Math.max(0, Number(tutorialHours || 0));
      const pHours = Math.max(0, Number(practicalHours || 0));

      // Strict Form Guardrail (D07/D44): Practical hours must be an even integer
      if (pHours % 2 !== 0) {
        return res.status(400).json({
          success: false,
          code: 'ERR_ODD_P_HOURS',
          error: 'ERR_ODD_P_HOURS: Practical hours must be an even integer (2 consecutive slots per session). Rounding or conversion is prohibited.',
        });
      }

      const roomType = requiredRoomType === 'P' ? 'P' : 'LT';
      const state = repo.getState();
      if (!state.academicTerms.has(termId)) {
        return res.status(400).json({ success: false, error: `Academic term ${termId} does not exist.` });
      }

      const courseId = id || `c-${String(code).toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
      const course: Course = {
        id: courseId,
        code: String(code),
        name: String(name),
        termId: String(termId),
        lectureHours: lHours,
        tutorialHours: tHours,
        practicalHours: pHours,
        requiredRoomType: roomType,
        department: department ? String(department) : undefined,
      };

      await repo.runTransaction(async (tx) => {
        tx.courses.set(courseId, course);
      });
      repo.logAudit(session.userId, 'CREATE_COURSE', 'courses', courseId, 'success', { course });
      res.json({ success: true, course });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/catalog/offerings', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const { id, courseId, termId: reqTermId, teacherId, targetType, targetId, component } = req.body;
      if (!courseId || !teacherId || !targetType || !targetId) {
        return res.status(400).json({ success: false, error: 'Missing required offering fields (courseId, teacherId, targetType, targetId).' });
      }

      if (component && !['L', 'T', 'P'].includes(component)) {
        return res.status(400).json({ success: false, error: 'Invalid component. Allowed values are L (Lecture), T (Tutorial), or P (Practical).' });
      }

      const state = repo.getState();
      const course = state.courses.get(courseId);
      if (!course) {
        return res.status(400).json({ success: false, error: `Course ${courseId} does not exist.` });
      }
      if (!state.teachers.has(teacherId)) {
        return res.status(400).json({ success: false, error: `Teacher ${teacherId} does not exist.` });
      }

      const termId = reqTermId || course.termId;

      if (targetType === 'section' && !state.sections.has(targetId)) {
        return res.status(400).json({ success: false, error: `Target section ${targetId} does not exist.` });
      } else if (targetType === 'batch' && !state.batches.has(targetId)) {
        return res.status(400).json({ success: false, error: `Target batch ${targetId} does not exist.` });
      } else if (targetType === 'elective_group' && !state.electiveGroups.has(targetId)) {
        return res.status(400).json({ success: false, error: `Target elective group ${targetId} does not exist.` });
      }

      const compSuffix = component ? `-${component.toLowerCase()}` : '';
      const offeringId = id || `off-${course.code.toLowerCase().replace(/[^a-z0-9]/g, '')}-${targetId.replace(/[^a-zA-Z0-9]/g, '')}${compSuffix}-${Date.now().toString().slice(-4)}`;
      const offering: CourseOffering = {
        id: offeringId,
        courseId: String(courseId),
        termId: String(termId),
        teacherId: String(teacherId),
        targetType: targetType as any,
        targetId: String(targetId),
        ...(component ? { component } : {}),
      };

      await repo.runTransaction(async (tx) => {
        tx.courseOfferings.set(offeringId, offering);
      });
      repo.logAudit(session.userId, 'CREATE_COURSE_OFFERING', 'course_offerings', offeringId, 'success', { offering });
      res.json({ success: true, offering });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // 1.3 Modular Entity Management: Venues & Faculty
  // --------------------------------------------------------------------------
  app.post('/api/resources/rooms', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const { id, roomNumber, building, floor, capacity, roomType, active } = req.body;
      if (!roomNumber || !building) {
        return res.status(400).json({ success: false, error: 'Missing required room fields (roomNumber, building).' });
      }
      const cap = Number(capacity || 0);
      if (cap <= 0) {
        return res.status(400).json({ success: false, error: 'Room capacity must be greater than zero.' });
      }

      const rType = roomType === 'P' ? 'P' : 'LT';
      const roomId = id || `r-${String(roomNumber).toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
      const room: Room = {
        id: roomId,
        roomNumber: String(roomNumber),
        building: String(building),
        floor: Number(floor || 1),
        capacity: cap,
        roomType: rType,
        active: active !== false,
      };

      await repo.runTransaction(async (tx) => {
        tx.rooms.set(roomId, room);
      });
      repo.logAudit(session.userId, 'CREATE_ROOM', 'rooms', roomId, 'success', { room });
      res.json({ success: true, room });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/resources/teachers', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const { id, empId, name, email, department, active } = req.body;
      if (!empId || !name || !email) {
        return res.status(400).json({ success: false, error: 'Missing required teacher fields (empId, name, email).' });
      }

      const teacherId = id || `t-${String(empId).toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
      const teacher: Teacher = {
        id: teacherId,
        empId: String(empId),
        name: String(name),
        email: String(email),
        department: department ? String(department) : undefined,
        active: active !== false,
      };

      await repo.runTransaction(async (tx) => {
        tx.teachers.set(teacherId, teacher);
      });
      repo.logAudit(session.userId, 'CREATE_TEACHER', 'teachers', teacherId, 'success', { teacher });
      res.json({ success: true, teacher });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/resources/teachers/:id/availability', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const teacherId = String(req.params.id);
      const { dayOfWeek, slotIndex, isAvailable } = req.body;
      const dow = Number(dayOfWeek);
      const sIdx = Number(slotIndex);
      const avail = Boolean(isAvailable);

      const state = repo.getState();
      if (!state.teachers.has(teacherId)) {
        return res.status(400).json({ success: false, error: `Teacher ${teacherId} does not exist.` });
      }

      const availKey = `ta-${teacherId}-${dow}-${sIdx}`;
      await repo.runTransaction(async (tx) => {
        if (!avail) {
          tx.teacherAvailabilities.set(availKey, {
            id: availKey,
            teacherId,
            dayOfWeek: dow,
            slotIndex: sIdx,
            isAvailable: false,
          });
        } else {
          tx.teacherAvailabilities.delete(availKey);
        }
      });
      repo.logAudit(session.userId, 'SET_TEACHER_AVAILABILITY', 'teacher_availabilities', availKey, 'success', {
        teacherId,
        dayOfWeek: dow,
        slotIndex: sIdx,
        isAvailable: avail,
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });


  // --------------------------------------------------------------------------
  // 2. Regular Class Endpoints
  // --------------------------------------------------------------------------
  app.post('/api/classes/occurrences/:id/cancel', requireRole(['teacher', 'admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const { reason } = req.body;
      const occ = await regularService.cancelOccurrence(session, String(req.params.id), reason);
      repo.emitPostCommit('OCCURRENCE_MUTATED', occ);
      persistOccurrenceToDb(occ).catch((e) => console.warn('[Supabase DB] Failed to persist cancellation:', e.message));
      res.json({ success: true, occurrence: occ });
    } catch (err: any) {
      if (err.message.includes('ERR_FORBIDDEN') || err.message.includes('FORBIDDEN') || err.message.includes('Teachers can only') || err.message.includes('Only teachers or admins')) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: err.message });
      }
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/classes/occurrences/:id/reschedule', requireRole(['teacher', 'admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const { date, dayOfWeek, startSlot, roomId } = req.body;
      const occ = await regularService.rescheduleOccurrence(session, String(req.params.id), {
        date,
        dayOfWeek: Number(dayOfWeek),
        startSlot: Number(startSlot),
        roomId,
      });
      repo.emitPostCommit('OCCURRENCE_MUTATED', occ);
      persistOccurrenceToDb(occ).catch((e) => console.warn('[Supabase DB] Failed to persist reschedule:', e.message));
      res.json({ success: true, occurrence: occ });
    } catch (err: any) {
      if (err.message.includes('ERR_FORBIDDEN') || err.message.includes('FORBIDDEN') || err.message.includes('Teachers can only') || err.message.includes('Only teachers or admins')) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: err.message });
      }
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // 3. Extra Class Endpoints
  // --------------------------------------------------------------------------
  app.get('/api/classes/extra/available-slots', (req: Request, res: Response) => {
    try {
      const { date, dayOfWeek, activityType, teacherId, targetType, targetId, expectedGroupSize } = req.query;
      const slots = extraService.queryAvailableSlots({
        date: String(date),
        dayOfWeek: Number(dayOfWeek),
        activityType: (activityType as any) || 'L',
        teacherId: String(teacherId),
        targetType: (targetType as any) || 'section',
        targetId: String(targetId),
        expectedGroupSize: expectedGroupSize ? Number(expectedGroupSize) : undefined,
      });
      res.json({ success: true, slots });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/classes/extra/book', requireRole(['teacher', 'admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const occ = await extraService.bookExtraClass(session, {
        date: req.body.date,
        dayOfWeek: Number(req.body.dayOfWeek),
        startSlot: Number(req.body.startSlot),
        activityType: req.body.activityType || 'L',
        courseOfferingId: req.body.courseOfferingId,
        termId: req.body.termId,
        roomId: req.body.roomId,
        targetType: req.body.targetType,
        targetId: req.body.targetId,
        expectedGroupSize: req.body.expectedGroupSize ? Number(req.body.expectedGroupSize) : undefined,
      });
      repo.emitPostCommit('OCCURRENCE_MUTATED', occ);
      persistOccurrenceToDb(occ).catch((e) => console.warn('[Supabase DB] Failed to persist extra class occurrence:', e.message));
      persistExtraClassToDb({
        id: occ.id,
        date: occ.date,
        courseOfferingId: occ.courseOfferingId,
        activityType: occ.activityType,
        teacherId: occ.teacherId,
        roomId: occ.roomId,
        startSlot: occ.startSlot,
        duration: occ.duration,
        targetType: occ.targetType,
        targetId: occ.targetId,
        status: occ.status,
      }).catch((e) => console.warn('[Supabase DB] Failed to persist extra class:', e.message));
      res.json({ success: true, occurrence: occ });
    } catch (err: any) {
      if (err.message.includes('ERR_FORBIDDEN') || err.message.includes('FORBIDDEN') || err.message.includes('Only teachers or admins')) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: err.message });
      }
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/classes/extra/:id/cancel', requireRole(['teacher', 'admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const occ = await extraService.cancelExtraClass(session, String(req.params.id), req.body.reason);
      repo.emitPostCommit('OCCURRENCE_MUTATED', occ);
      persistOccurrenceToDb(occ).catch((e) => console.warn('[Supabase DB] Failed to persist extra class cancellation:', e.message));
      res.json({ success: true, occurrence: occ });
    } catch (err: any) {
      if (err.message.includes('ERR_FORBIDDEN') || err.message.includes('FORBIDDEN') || err.message.includes('Teachers can only') || err.message.includes('Insufficient permissions')) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: err.message });
      }
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // 4. Teacher Unavailability Endpoints
  // --------------------------------------------------------------------------
  app.post('/api/teachers/unavailability/request', requireRole(['teacher', 'admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const result = await extraService.submitUnavailabilityRequest(session, {
        date: req.body.date,
        startSlot: Number(req.body.startSlot),
        endSlot: Number(req.body.endSlot),
        reason: req.body.reason,
      });
      res.json({ success: true, request: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/teachers/unavailability/:id/confirm', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const result = await extraService.confirmUnavailabilityRequest(session, String(req.params.id));
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // 5. Student Transfer Endpoints
  // --------------------------------------------------------------------------
  app.post('/api/students/transfer', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const result = await transferService.transferStudentGroup(session, {
        studentId: req.body.studentId,
        newGroupId: req.body.newGroupId,
        newGroupType: req.body.newGroupType,
        effectiveDate: req.body.effectiveDate,
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });


  // --------------------------------------------------------------------------
  // 6. Generation Contract & Fallback Endpoints
  // --------------------------------------------------------------------------
  app.post('/api/generation/compile-package', requireRole(['admin']), (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const { termIds, scope } = req.body;
      const { package: pkg, runId } = genAdapter.exportGenerationInputPackage(session, termIds, scope);

      const state = repo.getState();
      const selectedOfferings = pkg.courseOfferings as any[];
      let totalSlotsRequired = 0;
      const warnings: string[] = [];

      const coursesMap = new Map((pkg.courses as any[]).map((c: any) => [c.id, c]));
      const teachersMap = new Map((pkg.teachers as any[]).map((t: any) => [t.id, t]));
      const roomsList = pkg.rooms as any[];

      for (const off of selectedOfferings) {
        const c = coursesMap.get(off.courseId);
        if (c) {
          totalSlotsRequired += (Number(c.lectureHours || 0) + Number(c.tutorialHours || 0) + Number(c.practicalHours || 0));
          if (Number(c.practicalHours || 0) % 2 !== 0) {
            warnings.push(`Course ${c.code} (${c.name}) has odd practical hours (${c.practicalHours}), violating ERR_ODD_P_HOURS.`);
          }
        }
        if (!teachersMap.has(off.teacherId)) {
          warnings.push(`Offering ${off.id} references teacher ${off.teacherId} who is not included in active scope.`);
        }
      }

      // Teaching periods per week (non-lunch slots across active days)
      const nonBreakSlotsPerDay = state.gridConfig.slots.filter((s) => s.dayOfWeek === 1 && !s.isBreak).length || 7;
      const teachingDaysPerWeek = state.gridConfig.days.length || 5;
      const slotsPerRoomWeek = nonBreakSlotsPerDay * teachingDaysPerWeek;
      const totalCapacity = roomsList.length * slotsPerRoomWeek;

      const hasLabRooms = roomsList.some((r) => r.roomType === 'P');
      const hasLtRooms = roomsList.some((r) => r.roomType === 'LT');

      for (const c of coursesMap.values() as any) {
        if (c.practicalHours > 0 && !hasLabRooms) {
          warnings.push(`Course ${c.code} requires practical lab venue ('P'), but no lab rooms are selected in scope.`);
        }
        if ((c.lectureHours > 0 || c.tutorialHours > 0) && !hasLtRooms) {
          warnings.push(`Course ${c.code} requires lecture venue ('LT'), but no lecture halls are selected in scope.`);
        }
      }

      if (totalSlotsRequired > totalCapacity) {
        warnings.push(`Pre-flight Capacity Deficit: Required contact hours (${totalSlotsRequired}) exceed available room-period capacity (${totalCapacity}).`);
      }

      res.json({
        success: true,
        package: pkg,
        runId,
        stats: {
          totalSlotsRequired,
          totalCapacity,
          slotsPerRoomWeek,
          roomCount: roomsList.length,
          teacherCount: pkg.teachers.length,
          offeringCount: selectedOfferings.length,
          cohortCount: (pkg.sections as any[]).length + (pkg.batches as any[]).length,
          isFeasible: totalSlotsRequired <= totalCapacity,
          warnings,
        },
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/generation/request', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const result = await genAdapter.requestGeneration(session, req.body.termIds, req.body.scope);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/generation/package/download', requireRole(['admin']), (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const termIds = req.query.termIds ? String(req.query.termIds).split(',').filter(Boolean) : undefined;
      const roomIds = req.query.roomIds ? String(req.query.roomIds).split(',').filter(Boolean) : undefined;
      const teacherIds = req.query.teacherIds ? String(req.query.teacherIds).split(',').filter(Boolean) : undefined;
      const courseOfferingIds = req.query.offeringIds ? String(req.query.offeringIds).split(',').filter(Boolean) : undefined;
      const sectionIds = req.query.sectionIds ? String(req.query.sectionIds).split(',').filter(Boolean) : undefined;

      const scope = (roomIds || teacherIds || courseOfferingIds || sectionIds) ? {
        roomIds,
        teacherIds,
        courseOfferingIds,
        sectionIds,
      } : undefined;

      const { package: pkg } = genAdapter.exportGenerationInputPackage(session, termIds, scope);
      res.setHeader('Content-Disposition', `attachment; filename="${pkg.packageId}.json"`);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(pkg, null, 2));
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/generation/draft/upload', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const result = await importService.uploadGeneratedDraft(session, req.body.draft, {
        allowStaleOverride: Boolean(req.body.allowStaleOverride),
        staleOverrideReason: req.body.staleOverrideReason,
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      if (err.message.includes('ERR_FORBIDDEN') || err.message.includes('FORBIDDEN')) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: err.message });
      }
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // 7. Publication & Version Recovery Endpoints
  // --------------------------------------------------------------------------
  app.post('/api/timetable/versions/:id/publish', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const result = await pubService.publishDraft(session, String(req.params.id));
      repo.emitPostCommit('TIMETABLE_PUBLISHED', result);
      res.json({ success: true, ...result });
    } catch (err: any) {
      if (err.message.includes('ERR_FORBIDDEN') || err.message.includes('FORBIDDEN') || err.message.includes('Only administrators')) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: err.message });
      }
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/timetable/versions/:id/restore', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const result = await pubService.restoreVersion(session, String(req.params.id));
      repo.emitPostCommit('TIMETABLE_PUBLISHED', result);
      res.json({ success: true, version: result });
    } catch (err: any) {
      if (err.message.includes('ERR_FORBIDDEN') || err.message.includes('FORBIDDEN') || err.message.includes('Only administrators')) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: err.message });
      }
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // 8. Notifications Endpoints
  // --------------------------------------------------------------------------
  app.get('/api/notifications/inbox', (req: Request, res: Response) => {
    const session = getSession(req);
    let studentId = req.query.studentId as string;
    if (session.role === 'student') {
      studentId = session.linkedId || 'stud-1';
    } else {
      studentId = studentId || 'stud-1';
    }
    const notices = repo.getState().notificationOutbox.filter((n) => n.recipientStudentId === studentId);
    res.json({ notices });
  });

  // --------------------------------------------------------------------------
  // 9. Real-Time Subscriptions SSE Stream (Post-Commit Invariant)
  // --------------------------------------------------------------------------
  app.get('/api/realtime/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Handshake
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

    const unsubscribe = repo.onPostCommit((event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    const keepAlive = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 20000);

    req.on('close', () => {
      clearInterval(keepAlive);
      unsubscribe();
    });
  });

  // --------------------------------------------------------------------------
  // 10. Demo Setup & Seeding Helper (Phase Zero UI Verification)
  // --------------------------------------------------------------------------
  app.post('/api/demo/seed-and-publish', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const { package: pkg } = genAdapter.exportGenerationInputPackage(session);

      const demoDraft = {
        schemaVersion: '1.0.0',
        packageId: pkg.packageId,
        inputRevision: pkg.inputRevision,
        status: 'succeeded' as const,
        termIds: ['term-3'],
        classes: [
          {
            courseOfferingId: 'off-ds-lec',
            termId: 'term-3',
            dayOfWeek: 1, // Monday
            startSlot: 1, // Period 1: 09:00 - 10:00
            duration: 1,
            activityType: 'L' as const,
            teacherId: 't-1',
            roomId: 'r-101',
            targetType: 'section' as const,
            targetId: 'sec-A',
          },
          {
            courseOfferingId: 'off-ds-lec',
            termId: 'term-3',
            dayOfWeek: 2, // Tuesday
            startSlot: 2, // Period 2: 10:00 - 11:00
            duration: 1,
            activityType: 'L' as const,
            teacherId: 't-1',
            roomId: 'r-101',
            targetType: 'section' as const,
            targetId: 'sec-A',
          },
          {
            courseOfferingId: 'off-ds-lec',
            termId: 'term-3',
            dayOfWeek: 3, // Wednesday
            startSlot: 5, // Period 5: 13:00 - 15:00 (spans Period 5 & 6 per D44)
            duration: 2,
            activityType: 'P' as const,
            teacherId: 't-1',
            roomId: 'r-lab1',
            targetType: 'section' as const,
            targetId: 'sec-A',
          },
        ],
      };

      const uploadResult = await importService.uploadGeneratedDraft(session, demoDraft as any, {
        allowStaleOverride: true,
        staleOverrideReason: 'Phase Zero demo initialization',
      });

      const publishResult = await pubService.publishDraft(session, uploadResult.version.id);

      // Add a one-off extra class on Friday (Day 5) slot 2 for completeness
      try {
        await extraService.bookExtraClass(session, {
          date: '2026-09-11',
          dayOfWeek: 5,
          startSlot: 2,
          activityType: 'L',
          courseOfferingId: 'off-ds-lec',
          termId: 'term-3',
          roomId: 'r-102',
          targetType: 'section',
          targetId: 'sec-A',
        });
      } catch {
        // Ignored if duplicate or not applicable
      }

      repo.emitPostCommit('TIMETABLE_PUBLISHED', { versionId: publishResult.publishedVersion.id });

      res.json({
        success: true,
        version: publishResult.publishedVersion,
        instantiatedOccurrences: publishResult.instantiatedOccurrences,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/demo/reset-to-simple', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      await repo.resetToSimpleMockData();
      repo.emitPostCommit('STATE_RESET', { type: 'SIMPLE_MOCK_DATA' });
      res.json({
        success: true,
        message: 'University data removed and reset to simple, clean mock dataset with 0 published timetables. Ready for Solver execution!',
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Minimal SPA UI serving
  app.get('/', (req: Request, res: Response) => {
    res.send(renderHtmlUI({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    }));
  });


  // Centralized Error Handling & Sanitization Middleware
  // Invariant: Never leak raw database stack traces or internal errors to clients
  app.use((err: any, req: Request, res: Response, _next: any) => {
    const status = typeof err.status === 'number' ? err.status : 500;
    const cleanMessage = err.message ? String(err.message).replace(/\n.*$/s, '') : 'An internal server error occurred.';
    res.status(status).json({
      success: false,
      error: cleanMessage,
    });
  });

  return app;
}

/**
 * Seed initial realistic university engineering curriculum fixtures for ₹0 prototyping.
 * Populates Semester 1, Semester 3, and Semester 5 with published Version 1 schedule.
 */
function seedInitialData(repo: TimetableRepository) {
  repo.runTransaction(async (tx) => {
    populateRealisticUniversityData(tx);
  });
}

