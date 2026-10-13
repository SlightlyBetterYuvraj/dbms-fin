/**
 * Express HTTP API and Minimal Workflow UI Server.
 * Exposes real endpoints for Student, Teacher, and Admin workflows.
 * Source of truth: docs/06_API_AND_WORKFLOWS.md, docs/09_IMPLEMENTATION_SEQUENCE.md
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { TimetableRepository } from '../data/repository.js';
import { AuthService, AuthSession } from '../services/authService.js';
import { RegularClassService } from '../services/regularClassService.js';
import { ExtraClassService } from '../services/extraClassService.js';
import { StudentTransferService } from '../services/studentTransferService.js';
import { GeneratorAdapterService } from '../services/generatorAdapter.js';
import { DraftImportService } from '../services/draftImportService.js';
import { PublicationService } from '../services/publicationService.js';

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

  // Seed sample initial data if repository is empty
  seedInitialData(repo);

  // Authentication helper middleware
  function getSession(req: Request): AuthSession {
    const roleHeader = (req.headers['x-user-role'] as string) || 'admin';
    const userIdHeader = (req.headers['x-user-id'] as string) || 'admin-1';
    const linkedIdHeader = req.headers['x-linked-id'] as string;

    return {
      userId: userIdHeader,
      email: `${userIdHeader}@university.edu`,
      role: (roleHeader as any) || 'admin',
      linkedId: linkedIdHeader || (roleHeader === 'teacher' ? 't-1' : undefined),
    };
  }

  // --------------------------------------------------------------------------
  // 1. Reference Data Endpoints
  // --------------------------------------------------------------------------
  app.get('/api/state', (req: Request, res: Response) => {
    const state = repo.getState();
    res.json({
      academicTerms: Array.from(state.academicTerms.values()),
      rooms: Array.from(state.rooms.values()),
      teachers: Array.from(state.teachers.values()),
      sections: Array.from(state.sections.values()),
      batches: Array.from(state.batches.values()),
      courses: Array.from(state.courses.values()),
      courseOfferings: Array.from(state.courseOfferings.values()),
      timetableVersions: Array.from(state.timetableVersions.values()),
      scheduledClasses: Array.from(state.scheduledClasses.values()),
      classOccurrences: Array.from(state.classOccurrences.values()),
      auditEvents: state.auditEvents.slice(-50),
      notifications: state.notificationOutbox,
    });
  });

  // --------------------------------------------------------------------------
  // 2. Regular Class Endpoints
  // --------------------------------------------------------------------------
  app.post('/api/classes/occurrences/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = getSession(req);
      const { reason } = req.body;
      const occ = await regularService.cancelOccurrence(session, String(req.params.id), reason);
      res.json({ success: true, occurrence: occ });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/classes/occurrences/:id/reschedule', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = getSession(req);
      const { date, dayOfWeek, startSlot, roomId } = req.body;
      const occ = await regularService.rescheduleOccurrence(session, String(req.params.id), {
        date,
        dayOfWeek: Number(dayOfWeek),
        startSlot: Number(startSlot),
        roomId,
      });
      res.json({ success: true, occurrence: occ });
    } catch (err: any) {
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

  app.post('/api/classes/extra/book', async (req: Request, res: Response) => {
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
      res.json({ success: true, occurrence: occ });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/classes/extra/:id/cancel', async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const occ = await extraService.cancelExtraClass(session, String(req.params.id), req.body.reason);
      res.json({ success: true, occurrence: occ });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // 4. Teacher Unavailability Endpoints
  // --------------------------------------------------------------------------
  app.post('/api/teachers/unavailability/request', async (req: Request, res: Response) => {
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

  app.post('/api/teachers/unavailability/:id/confirm', async (req: Request, res: Response) => {
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
  app.post('/api/students/transfer', async (req: Request, res: Response) => {
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
  app.post('/api/generation/request', async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const result = await genAdapter.requestGeneration(session, req.body.termIds);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/generation/package/download', (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const { package: pkg } = genAdapter.exportGenerationInputPackage(session);
      res.setHeader('Content-Disposition', `attachment; filename="${pkg.packageId}.json"`);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(pkg, null, 2));
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/generation/draft/upload', async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const result = await importService.uploadGeneratedDraft(session, req.body.draft, {
        allowStaleOverride: Boolean(req.body.allowStaleOverride),
        staleOverrideReason: req.body.staleOverrideReason,
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // 7. Publication & Version Recovery Endpoints
  // --------------------------------------------------------------------------
  app.post('/api/timetable/versions/:id/publish', async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const result = await pubService.publishDraft(session, String(req.params.id));
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/timetable/versions/:id/restore', async (req: Request, res: Response) => {
    try {
      const session = getSession(req);
      const result = await pubService.restoreVersion(session, String(req.params.id));
      res.json({ success: true, version: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // 8. Notifications Endpoints
  // --------------------------------------------------------------------------
  app.get('/api/notifications/inbox', (req: Request, res: Response) => {
    const studentId = (req.query.studentId as string) || 'stud-1';
    const notices = repo.getState().notificationOutbox.filter((n) => n.recipientStudentId === studentId);
    res.json({ notices });
  });

  // Minimal SPA UI serving
  app.use((req: Request, res: Response) => {
    res.send(renderHtmlUI());
  });

  return app;
}

/**
 * Seed initial sample dummy university data for ₹0 prototyping.
 */
function seedInitialData(repo: TimetableRepository) {
  repo.runTransaction(async (tx) => {
    if (tx.academicTerms.size > 0) return;

    tx.academicTerms.set('term-3', {
      id: 'term-3',
      yearLabel: '2026-2027',
      semesterNumber: 3,
      startDate: '2026-09-01',
      endDate: '2026-12-20',
      cycle: 'odd',
      status: 'active',
    });

    tx.rooms.set('r-101', {
      id: 'r-101',
      roomNumber: '101',
      building: 'Engineering Block',
      floor: 1,
      capacity: 60,
      roomType: 'LT',
      active: true,
    });
    tx.rooms.set('r-102', {
      id: 'r-102',
      roomNumber: '102',
      building: 'Engineering Block',
      floor: 1,
      capacity: 60,
      roomType: 'LT',
      active: true,
    });
    tx.rooms.set('r-lab1', {
      id: 'r-lab1',
      roomNumber: 'Lab-A',
      building: 'CS Block',
      floor: 2,
      capacity: 35,
      roomType: 'P',
      active: true,
    });

    tx.teachers.set('t-1', {
      id: 't-1',
      empId: 'EMP-101',
      name: 'Dr. Alice Smith',
      email: 'alice@uni.edu',
      active: true,
    });
    tx.teachers.set('t-2', {
      id: 't-2',
      empId: 'EMP-102',
      name: 'Dr. Bob Jones',
      email: 'bob@uni.edu',
      active: true,
    });

    tx.sections.set('sec-A', {
      id: 'sec-A',
      termId: 'term-3',
      name: 'Section A',
      expectedCount: 50,
      active: true,
    });
    tx.batches.set('batch-A1', {
      id: 'batch-A1',
      sectionId: 'sec-A',
      name: 'Batch A1',
      expectedCount: 25,
      active: true,
    });

    tx.students.set('stud-1', {
      id: 'stud-1',
      rollNumber: 'CS2026-001',
      name: 'Charlie Brown',
      email: 'charlie@uni.edu',
      active: true,
    });
    tx.studentGroupMemberships.set('sgm-1', {
      id: 'sgm-1',
      studentId: 'stud-1',
      groupId: 'sec-A',
      groupType: 'section',
      effectiveStartDate: '2026-08-01',
    });

    tx.courses.set('c-ds', {
      id: 'c-ds',
      code: 'CS201',
      name: 'Data Structures',
      termId: 'term-3',
      lectureHours: 2,
      tutorialHours: 0,
      practicalHours: 2,
      requiredRoomType: 'LT',
    });

    tx.courseOfferings.set('off-ds-lec', {
      id: 'off-ds-lec',
      courseId: 'c-ds',
      termId: 'term-3',
      teacherId: 't-1',
      targetType: 'section',
      targetId: 'sec-A',
    });
  });
}

/**
 * Minimal Workflow UI HTML/CSS/JS (Phase 7: strictly functional, no decorative distraction)
 */
function renderHtmlUI(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>University Timetable Management System</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --danger: #ef4444;
      --success: #10b981;
      --warning: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 20px; }
    header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 15px; margin-bottom: 20px; }
    .role-badge { background: var(--border); padding: 5px 12px; border-radius: 6px; font-size: 14px; }
    .role-selector select { background: var(--card); color: var(--text); border: 1px solid var(--border); padding: 6px 12px; border-radius: 6px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 18px; }
    h2 { font-size: 18px; margin-bottom: 14px; color: var(--primary); }
    h3 { font-size: 15px; margin: 12px 0 6px 0; color: var(--text); }
    p, li { font-size: 14px; color: var(--text-muted); line-height: 1.5; }
    button { background: var(--primary); color: #000; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 8px; }
    button:hover { opacity: 0.9; }
    button.danger { background: var(--danger); color: #fff; }
    button.warning { background: var(--warning); color: #000; }
    input, select, textarea { width: 100%; background: #0b1120; border: 1px solid var(--border); color: var(--text); padding: 8px; border-radius: 6px; margin: 6px 0 10px 0; font-size: 13px; }
    .status-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .status-scheduled { background: #064e3b; color: #34d399; }
    .status-cancelled { background: #7f1d1d; color: #f87171; }
    .status-draft { background: #78350f; color: #fbbf24; }
    .status-published { background: #064e3b; color: #34d399; }
    .error-box { background: rgba(239, 68, 68, 0.15); border: 1px solid var(--danger); color: #fca5a5; padding: 10px; border-radius: 6px; margin-top: 10px; font-size: 13px; display: none; }
    .success-box { background: rgba(16, 185, 129, 0.15); border: 1px solid var(--success); color: #6ee7b7; padding: 10px; border-radius: 6px; margin-top: 10px; font-size: 13px; display: none; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
    th, td { border: 1px solid var(--border); padding: 8px; text-align: left; }
    th { background: #131c2e; color: var(--text); }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>University Timetable Management System</h1>
      <p>Authoritative Backend & Verification Prototype</p>
    </div>
    <div class="role-selector">
      <label>Active Role: </label>
      <select id="roleSelect" onchange="switchRole()">
        <option value="admin">Administrator</option>
        <option value="teacher">Teacher (Dr. Alice Smith)</option>
        <option value="student">Student (Charlie Brown)</option>
      </select>
    </div>
  </header>

  <div id="alertBox" class="error-box"></div>
  <div id="infoBox" class="success-box"></div>

  <!-- ADMIN VIEW -->
  <div id="adminView" class="view-section">
    <div class="grid">
      <div class="card">
        <h2>Semester Timetable Generation</h2>
        <p>Generates global timetable for all active semesters. Attempts hosted generator or provides download package for local OR-Tools solver.</p>
        <button onclick="requestGeneration()">Trigger Timetable Generation</button>
        <button onclick="downloadPackage()" style="background:#475569; color:#fff;">Download Input Package JSON</button>
        <div id="generationStatus" style="margin-top:12px; font-size:13px;"></div>
      </div>

      <div class="card">
        <h2>Import Generated Draft</h2>
        <p>Upload a structured draft JSON from local/remote solver. Validates all mandatory constraints and checks for stale package revision.</p>
        <textarea id="draftJsonInput" rows="4" placeholder="Paste draft output JSON here..."></textarea>
        <label><input type="checkbox" id="overrideStaleCheck" style="width:auto;"> Allow audited stale package override</label>
        <input type="text" id="staleReasonInput" placeholder="Override reason (audit record)...">
        <button onclick="uploadDraft()">Validate & Import Draft</button>
      </div>

      <div class="card">
        <h2>Timetable Versions & Publication</h2>
        <p>Draft versions remain unpublished until explicitly published. Atomic switch preserves prior versions.</p>
        <div id="versionsList">Loading versions...</div>
      </div>

      <div class="card">
        <h2>Teacher Unavailability Review</h2>
        <p>Review submitted unavailability requests. Confirmation lists affected class occurrences for explicit resolution.</p>
        <div id="unavailabilityList">Loading requests...</div>
      </div>

      <div class="card">
        <h2>Student Section Transfer</h2>
        <p>Transfer student to a new section/batch with effective date. Past classes remain unchanged; electives preserved.</p>
        <label>Student ID:</label>
        <input type="text" id="transferStudentId" value="stud-1">
        <label>New Group ID:</label>
        <input type="text" id="transferGroupId" value="sec-B">
        <label>Effective Date:</label>
        <input type="date" id="transferDate" value="2026-10-01">
        <button onclick="transferStudent()">Execute Transfer</button>
      </div>
    </div>
  </div>

  <!-- TEACHER VIEW -->
  <div id="teacherView" class="view-section" style="display:none;">
    <div class="grid">
      <div class="card">
        <h2>Book One-Off Extra Class</h2>
        <p>Discovers free periods (cancellation-freed ranked first). Validates room capacity and type server-side.</p>
        <label>Date:</label>
        <input type="date" id="extraDate" value="2026-09-08">
        <label>Day of Week (1-5):</label>
        <input type="number" id="extraDay" min="1" max="5" value="2">
        <label>Activity Type:</label>
        <select id="extraActivity">
          <option value="L">Lecture (1 hour)</option>
          <option value="P">Practical / Lab (2 consecutive hours)</option>
        </select>
        <button onclick="queryFreeSlots()">Query Free Slots</button>
        <div id="slotsResults" style="margin-top:10px;"></div>
      </div>

      <div class="card">
        <h2>Teacher Unavailability Request</h2>
        <p>Submit date and slot ranges. Unconfirmed requests do not block scheduling until confirmed by an admin.</p>
        <label>Date:</label>
        <input type="date" id="unavailDate" value="2026-09-15">
        <label>Start Slot:</label>
        <input type="number" id="unavailStart" value="1" min="1" max="8">
        <label>End Slot:</label>
        <input type="number" id="unavailEnd" value="3" min="1" max="8">
        <label>Reason:</label>
        <input type="text" id="unavailReason" placeholder="Conference, illness...">
        <button onclick="submitUnavailability()">Submit Request</button>
      </div>
    </div>
  </div>

  <!-- STUDENT VIEW -->
  <div id="studentView" class="view-section" style="display:none;">
    <div class="grid">
      <div class="card">
        <h2>My Schedule & Venue Location</h2>
        <p>Displays applicable section, batch, and elective classes with Room number, Building, and Floor.</p>
        <div id="studentSchedule">Loading schedule...</div>
      </div>

      <div class="card">
        <h2>Persistent Inbox Notifications</h2>
        <p>Post-commit notifications for cancellations, reschedules, and extra classes.</p>
        <div id="studentInbox">Loading inbox...</div>
      </div>
    </div>
  </div>

  <!-- ACTIVE TIMETABLE DISPLAY -->
  <div class="card" style="margin-top:20px;">
    <h2>Current Timetable Occurrences & Day-to-Day Operations</h2>
    <div id="occurrencesTableContainer">Loading occurrences...</div>
  </div>

  <script>
    let currentRole = 'admin';
    let currentState = {};

    function switchRole() {
      currentRole = document.getElementById('roleSelect').value;
      document.getElementById('adminView').style.display = currentRole === 'admin' ? 'block' : 'none';
      document.getElementById('teacherView').style.display = currentRole === 'teacher' ? 'block' : 'none';
      document.getElementById('studentView').style.display = currentRole === 'student' ? 'block' : 'none';
      loadState();
    }

    function showMsg(text, isError = false) {
      const errBox = document.getElementById('alertBox');
      const infoBox = document.getElementById('infoBox');
      if (isError) {
        errBox.textContent = text;
        errBox.style.display = 'block';
        infoBox.style.display = 'none';
      } else {
        infoBox.textContent = text;
        infoBox.style.display = 'block';
        errBox.style.display = 'none';
      }
      setTimeout(() => { errBox.style.display = 'none'; infoBox.style.display = 'none'; }, 6000);
    }

    async function api(path, options = {}) {
      options.headers = {
        'Content-Type': 'application/json',
        'x-user-role': currentRole,
        'x-user-id': currentRole === 'teacher' ? 't-1' : (currentRole === 'student' ? 'stud-1' : 'admin-1'),
        'x-linked-id': currentRole === 'teacher' ? 't-1' : undefined,
        ...(options.headers || {})
      };
      const res = await fetch(path, options);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.message || 'Request failed');
      }
      return data;
    }

    async function loadState() {
      try {
        const res = await fetch('/api/state');
        currentState = await res.json();
        renderOccurrences();
        renderVersions();
        renderUnavailability();
        if (currentRole === 'student') renderStudentInbox();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    function renderOccurrences() {
      const occs = currentState.classOccurrences || [];
      const roomsMap = new Map((currentState.rooms || []).map(r => [r.id, r]));
      
      let html = '<table><thead><tr><th>Date</th><th>Slot</th><th>Type</th><th>Room / Venue</th><th>Teacher</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
      if (occs.length === 0) {
        html += '<tr><td colspan="7" style="text-align:center;">No active occurrences scheduled yet.</td></tr>';
      }
      occs.forEach(o => {
        const r = roomsMap.get(o.roomId) || { roomNumber: o.roomId, building: '-', floor: '-' };
        const statusClass = o.status === 'cancelled' ? 'status-cancelled' : 'status-scheduled';
        html += '<tr>';
        html += '<td>' + o.date + '</td>';
        html += '<td>Slot ' + o.startSlot + ' (' + o.duration + 'h)</td>';
        html += '<td>' + o.activityType + '</td>';
        html += '<td>Room ' + r.roomNumber + ', ' + r.building + ' (Fl ' + r.floor + ')</td>';
        html += '<td>' + o.teacherId + '</td>';
        html += '<td><span class="status-tag ' + statusClass + '">' + o.status + '</span></td>';
        html += '<td>';
        if (o.status !== 'cancelled' && (currentRole === 'teacher' || currentRole === 'admin')) {
          html += '<button class="danger" style="padding:4px 8px; font-size:12px; margin-right:4px;" onclick="cancelOcc(\\'' + o.id + '\\')">Cancel</button>';
          html += '<button style="padding:4px 8px; font-size:12px;" onclick="promptReschedule(\\'' + o.id + '\\')">Reschedule</button>';
        } else {
          html += '-';
        }
        html += '</td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
      document.getElementById('occurrencesTableContainer').innerHTML = html;
      if (currentRole === 'student') document.getElementById('studentSchedule').innerHTML = html;
    }

    function renderVersions() {
      const versions = currentState.timetableVersions || [];
      let html = '<ul>';
      if (versions.length === 0) html += '<li>No draft or published versions yet.</li>';
      versions.forEach(v => {
        html += '<li style="margin-bottom:8px;">Version ' + v.versionNumber + ' (' + v.termId + ') — <span class="status-tag status-' + v.status + '">' + v.status + '</span>';
        if (v.status === 'draft' && currentRole === 'admin') {
          html += ' <button style="padding:3px 8px; font-size:12px;" onclick="publishVersion(\\'' + v.id + '\\')">Publish Version</button>';
        } else if (v.status === 'superseded' && currentRole === 'admin') {
          html += ' <button class="warning" style="padding:3px 8px; font-size:12px;" onclick="restoreVersion(\\'' + v.id + '\\')">Restore Version</button>';
        }
        html += '</li>';
      });
      html += '</ul>';
      document.getElementById('versionsList').innerHTML = html;
    }

    function renderUnavailability() {
      const list = document.getElementById('unavailabilityList');
      if (!list) return;
      const reqs = (currentState.auditEvents || []).filter(a => a.action === 'SUBMIT_UNAVAILABILITY');
      list.innerHTML = reqs.length === 0 ? '<p>No pending unavailability requests.</p>' : '<p>' + reqs.length + ' request(s) recorded in audit log.</p>';
    }

    async function renderStudentInbox() {
      const data = await api('/api/notifications/inbox?studentId=stud-1');
      const inboxEl = document.getElementById('studentInbox');
      if (!inboxEl) return;
      if (data.notices.length === 0) {
        inboxEl.innerHTML = '<p>No notifications yet.</p>';
        return;
      }
      let html = '<ul>';
      data.notices.forEach(n => {
        html += '<li style="margin-bottom:8px;"><strong>' + n.title + '</strong>: ' + n.message + ' <br><small>' + n.createdAt + '</small></li>';
      });
      html += '</ul>';
      inboxEl.innerHTML = html;
    }

    async function cancelOcc(id) {
      const reason = prompt('Optional cancellation reason:');
      try {
        await api('/api/classes/occurrences/' + id + '/cancel', {
          method: 'POST',
          body: JSON.stringify({ reason })
        });
        showMsg('Class occurrence cancelled successfully.');
        loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function promptReschedule(id) {
      const date = prompt('New date (YYYY-MM-DD):', '2026-09-08');
      const slot = prompt('New slot (1-8):', '3');
      if (!date || !slot) return;
      try {
        await api('/api/classes/occurrences/' + id + '/reschedule', {
          method: 'POST',
          body: JSON.stringify({ date, dayOfWeek: 2, startSlot: parseInt(slot) })
        });
        showMsg('Occurrence rescheduled atomically.');
        loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function requestGeneration() {
      try {
        const res = await api('/api/generation/request', {
          method: 'POST',
          body: JSON.stringify({ termIds: ['term-3'] })
        });
        document.getElementById('generationStatus').innerHTML = '<p><strong>Status:</strong> ' + res.status + '<br>' + res.message + '</p>';
        showMsg(res.message);
        loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    function downloadPackage() {
      window.location.href = '/api/generation/package/download';
    }

    async function uploadDraft() {
      const text = document.getElementById('draftJsonInput').value.trim();
      const allowOverride = document.getElementById('overrideStaleCheck').checked;
      const reason = document.getElementById('staleReasonInput').value.trim();
      if (!text) { showMsg('Please paste draft JSON.', true); return; }
      try {
        const draft = JSON.parse(text);
        const res = await api('/api/generation/draft/upload', {
          method: 'POST',
          body: JSON.stringify({ draft, allowStaleOverride: allowOverride, staleOverrideReason: reason })
        });
        showMsg('Draft imported successfully as ' + res.version.status + ' (' + res.classCount + ' classes).');
        loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function publishVersion(id) {
      try {
        const res = await api('/api/timetable/versions/' + id + '/publish', { method: 'POST' });
        showMsg('Timetable version published! ' + res.instantiatedOccurrences + ' dated occurrences instantiated.');
        loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function restoreVersion(id) {
      try {
        await api('/api/timetable/versions/' + id + '/restore', { method: 'POST' });
        showMsg('Prior timetable version restored successfully.');
        loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function queryFreeSlots() {
      const date = document.getElementById('extraDate').value;
      const day = document.getElementById('extraDay').value;
      const act = document.getElementById('extraActivity').value;
      try {
        const res = await api('/api/classes/extra/available-slots?date=' + date + '&dayOfWeek=' + day + '&activityType=' + act + '&teacherId=t-1&targetType=section&targetId=sec-A');
        let html = '<h4>Eligible Slots:</h4><ul>';
        if (res.slots.length === 0) html += '<li>No free slots found.</li>';
        res.slots.forEach(s => {
          html += '<li>Slot ' + s.slotIndex + (s.isCancellationFreed ? ' <strong>[Cancellation-Freed]</strong>' : '') + ' — Rooms: ' + s.eligibleRooms.map(r => r.roomNumber).join(', ') + ' <button style="padding:2px 6px; font-size:11px;" onclick="bookExtraSlot(' + s.slotIndex + ', \\'' + s.eligibleRooms[0].id + '\\')">Book</button></li>';
        });
        html += '</ul>';
        document.getElementById('slotsResults').innerHTML = html;
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function bookExtraSlot(slot, roomId) {
      const date = document.getElementById('extraDate').value;
      const day = document.getElementById('extraDay').value;
      const act = document.getElementById('extraActivity').value;
      try {
        await api('/api/classes/extra/book', {
          method: 'POST',
          body: JSON.stringify({
            date,
            dayOfWeek: day,
            startSlot: slot,
            activityType: act,
            courseOfferingId: 'off-ds-lec',
            termId: 'term-3',
            roomId,
            targetType: 'section',
            targetId: 'sec-A'
          })
        });
        showMsg('Extra class booked successfully.');
        loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function submitUnavailability() {
      const date = document.getElementById('unavailDate').value;
      const startSlot = document.getElementById('unavailStart').value;
      const endSlot = document.getElementById('unavailEnd').value;
      const reason = document.getElementById('unavailReason').value;
      try {
        await api('/api/teachers/unavailability/request', {
          method: 'POST',
          body: JSON.stringify({ date, startSlot, endSlot, reason })
        });
        showMsg('Unavailability request submitted (pending confirmation).');
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function transferStudent() {
      const studentId = document.getElementById('transferStudentId').value;
      const newGroupId = document.getElementById('transferGroupId').value;
      const effectiveDate = document.getElementById('transferDate').value;
      try {
        await api('/api/students/transfer', {
          method: 'POST',
          body: JSON.stringify({ studentId, newGroupId, newGroupType: 'section', effectiveDate })
        });
        showMsg('Student transfer executed with effective date ' + effectiveDate);
        loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    // Initial load
    loadState();
  </script>
</body>
</html>`;
}
