/**
 * Extra class booking, available slot discovery with cancellation ranking,
 * and teacher unavailability management.
 * Source of truth: docs/01_MASTER_PRD.md, docs/02_DECISION_REGISTER.md (D02, D03, D19, D20, D24, D25, D29, D30)
 */

import { TimetableRepository, RepositoryDataState } from '../data/repository.js';
import {
  ActivityType,
  ClassOccurrence,
  TargetGroupType,
  TeacherUnavailabilityRequest,
  ValidationResult,
} from '../domain/types.js';
import {
  validateCandidateSession,
  getRepresentedStudents,
  ValidationContext,
} from '../domain/conflictValidator.js';
import { AuthSession } from './authService.js';

export interface AvailableSlotResult {
  slotIndex: number;
  dayOfWeek: number;
  isCancellationFreed: boolean;
  eligibleRooms: { id: string; roomNumber: string; capacity: number }[];
}

export class ExtraClassService {
  constructor(private repo: TimetableRepository) {}

  private buildValidationContext(state: RepositoryDataState): ValidationContext {
    return {
      grid: state.gridConfig,
      rooms: state.rooms,
      batches: state.batches,
      studentMemberships: Array.from(state.studentGroupMemberships.values()),
      electiveAssignments: Array.from(state.electiveAssignments.values()),
      teacherAvailabilities: Array.from(state.teacherAvailabilities.values()),
      teacherAbsences: Array.from(state.teacherUnavailabilityRequests.values()),
    };
  }

  /**
   * Queries available time slots and eligible rooms for an extra class on a given date.
   * D03: Ranks cancellation-freed slots first, without hiding other valid free slots.
   */
  public queryAvailableSlots(params: {
    date: string;
    dayOfWeek: number;
    activityType: ActivityType;
    teacherId: string;
    targetType: TargetGroupType;
    targetId: string;
    expectedGroupSize?: number;
  }): AvailableSlotResult[] {
    const state = this.repo.getState();
    const ctx = this.buildValidationContext(state);
    const duration = params.activityType === 'P' ? 2 : 1;
    const requiredType = params.activityType === 'P' ? 'P' : 'LT';
    const groupSize = params.expectedGroupSize ?? 30;

    const results: AvailableSlotResult[] = [];
    const occurrencesOnDate = Array.from(state.classOccurrences.values()).filter(
      (o) => o.date === params.date
    );

    // Identify slots where a cancellation occurred for this student cohort
    const cancelledSlots = new Set<number>();
    for (const occ of occurrencesOnDate) {
      if (occ.status === 'cancelled' && occ.targetType === params.targetType && occ.targetId === params.targetId) {
        for (let off = 0; off < occ.duration; off++) {
          cancelledSlots.add(occ.startSlot + off);
        }
      }
    }

    // Iterate through daily slots on grid
    const dailySlots = ctx.grid.slots.filter((s) => s.dayOfWeek === params.dayOfWeek && !s.isBreak);

    for (const slot of dailySlots) {
      const candidateSlot = slot.slotIndex;
      // Filter rooms matching required type and capacity
      const eligibleRooms: { id: string; roomNumber: string; capacity: number }[] = [];

      for (const room of ctx.rooms.values()) {
        if (!room.active || room.roomType !== requiredType || room.capacity < groupSize) {
          continue;
        }

        const candidate = {
          termId: 'any',
          dayOfWeek: params.dayOfWeek,
          date: params.date,
          startSlot: candidateSlot,
          duration,
          activityType: params.activityType,
          teacherId: params.teacherId,
          roomId: room.id,
          targetType: params.targetType,
          targetId: params.targetId,
          expectedGroupSize: groupSize,
        };

        const valRes = validateCandidateSession(candidate, occurrencesOnDate, ctx);
        if (valRes.valid) {
          eligibleRooms.push({
            id: room.id,
            roomNumber: room.roomNumber,
            capacity: room.capacity,
          });
        }
      }

      if (eligibleRooms.length > 0) {
        results.push({
          slotIndex: candidateSlot,
          dayOfWeek: params.dayOfWeek,
          isCancellationFreed: cancelledSlots.has(candidateSlot),
          eligibleRooms,
        });
      }
    }

    // Rank cancellation-freed slots first (D03)
    results.sort((a, b) => {
      if (a.isCancellationFreed && !b.isCancellationFreed) return -1;
      if (!a.isCancellationFreed && b.isCancellationFreed) return 1;
      return a.slotIndex - b.slotIndex;
    });

    return results;
  }

  /**
   * Books a one-off extra class in a valid free slot with an eligible room.
   * D02, D19, D20, D24: Backend re-validates all conflicts against current state.
   * Extra class never mutates recurring weekly timetable pattern.
   */
  public async bookExtraClass(
    session: AuthSession,
    params: {
      date: string;
      dayOfWeek: number;
      startSlot: number;
      activityType: ActivityType;
      courseOfferingId: string;
      termId: string;
      roomId: string;
      targetType: TargetGroupType;
      targetId: string;
      expectedGroupSize?: number;
    }
  ): Promise<ClassOccurrence> {
    if (session.role !== 'teacher' && session.role !== 'admin') {
      throw new Error('ERR_FORBIDDEN: Only teachers or admins can book extra classes.');
    }

    const duration = params.activityType === 'P' ? 2 : 1;
    const teacherId = session.role === 'teacher' ? session.linkedId! : session.userId;

    return this.repo.runTransaction(async (tx) => {
      const ctx = this.buildValidationContext(tx);
      const activeOccurrences = Array.from(tx.classOccurrences.values()).filter(
        (o) => o.status !== 'cancelled' && o.status !== 'superseded'
      );

      const candidate = {
        termId: params.termId,
        dayOfWeek: params.dayOfWeek,
        date: params.date,
        startSlot: params.startSlot,
        duration,
        activityType: params.activityType,
        teacherId,
        roomId: params.roomId,
        targetType: params.targetType,
        targetId: params.targetId,
        expectedGroupSize: params.expectedGroupSize,
      };

      const valRes: ValidationResult = validateCandidateSession(
        candidate,
        activeOccurrences,
        ctx
      );

      if (!valRes.valid) {
        const firstError = valRes.errors[0];
        throw new Error(`${firstError.code}: ${firstError.message}`);
      }

      const occurrenceId = `extra-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const extraClassOccurrence: ClassOccurrence = {
        id: occurrenceId,
        versionId: 'published-active',
        courseOfferingId: params.courseOfferingId,
        termId: params.termId,
        date: params.date,
        dayOfWeek: params.dayOfWeek,
        startSlot: params.startSlot,
        duration,
        activityType: params.activityType,
        teacherId,
        roomId: params.roomId,
        targetType: params.targetType,
        targetId: params.targetId,
        status: 'scheduled',
        isExtraClass: true,
        bookedByTeacherId: teacherId,
      };

      tx.classOccurrences.set(occurrenceId, extraClassOccurrence);

      this.repo.logAudit(session.userId, 'BOOK_EXTRA_CLASS', 'class_occurrences', occurrenceId, 'success', {
        date: params.date,
        slot: params.startSlot,
        roomId: params.roomId,
      });

      // Post-commit notification to affected students only
      const affectedStudents = getRepresentedStudents(
        params.targetType,
        params.targetId,
        ctx,
        params.date
      );

      for (const studentId of affectedStudents) {
        const outboxId = `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        tx.notificationOutbox.push({
          id: outboxId,
          recipientStudentId: studentId,
          eventType: 'EXTRA_CLASS_BOOKED',
          title: 'Extra Class Booked',
          message: `An extra class has been scheduled on ${params.date} at slot ${params.startSlot}.`,
          entityType: 'class_occurrences',
          entityId: occurrenceId,
          status: 'pending',
          retryCount: 0,
          createdAt: new Date().toISOString(),
        });
      }

      return extraClassOccurrence;
    });
  }

  /**
   * Cancels an extra class.
   * D25: Only the booking teacher or an authorized admin can cancel an extra class.
   */
  public async cancelExtraClass(
    session: AuthSession,
    occurrenceId: string,
    reason?: string
  ): Promise<ClassOccurrence> {
    return this.repo.runTransaction(async (tx) => {
      const occ = tx.classOccurrences.get(occurrenceId);
      if (!occ || !occ.isExtraClass) {
        throw new Error(`ERR_NOT_FOUND: Extra class occurrence ${occurrenceId} not found.`);
      }

      // Authorization check (D25)
      if (session.role === 'teacher') {
        if (occ.bookedByTeacherId !== session.linkedId) {
          throw new Error('ERR_FORBIDDEN: Teachers can only cancel extra classes booked by themselves.');
        }
      } else if (session.role !== 'admin') {
        throw new Error('ERR_FORBIDDEN: Insufficient permissions.');
      }

      occ.status = 'cancelled';
      occ.cancellationReason = reason;

      this.repo.logAudit(session.userId, 'CANCEL_EXTRA_CLASS', 'class_occurrences', occurrenceId, 'success', {
        reason,
      });

      // Notify affected students
      const ctx = this.buildValidationContext(tx);
      const affectedStudents = getRepresentedStudents(occ.targetType, occ.targetId, ctx, occ.date);
      for (const studentId of affectedStudents) {
        const outboxId = `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        tx.notificationOutbox.push({
          id: outboxId,
          recipientStudentId: studentId,
          eventType: 'EXTRA_CLASS_CANCELLED',
          title: 'Extra Class Cancelled',
          message: `The extra class on ${occ.date} at slot ${occ.startSlot} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
          entityType: 'class_occurrences',
          entityId: occurrenceId,
          status: 'pending',
          retryCount: 0,
          createdAt: new Date().toISOString(),
        });
      }

      return occ;
    });
  }

  /**
   * Submits a teacher unavailability request (D30).
   * Request status is 'pending' until explicitly confirmed by an admin.
   */
  public async submitUnavailabilityRequest(
    session: AuthSession,
    params: {
      date: string;
      startSlot: number;
      endSlot: number;
      reason?: string;
    }
  ): Promise<TeacherUnavailabilityRequest> {
    if (session.role !== 'teacher') {
      throw new Error('ERR_FORBIDDEN: Only teachers can submit unavailability requests.');
    }

    return this.repo.runTransaction(async (tx) => {
      const id = `unavail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const request: TeacherUnavailabilityRequest = {
        id,
        teacherId: session.linkedId!,
        date: params.date,
        startSlot: params.startSlot,
        endSlot: params.endSlot,
        reason: params.reason,
        status: 'pending', // Pending confirmation
        submittedAt: new Date().toISOString(),
      };

      tx.teacherUnavailabilityRequests.set(id, request);
      this.repo.logAudit(session.userId, 'SUBMIT_UNAVAILABILITY', 'teacher_unavailability_requests', id, 'success', {
        date: params.date,
        slots: `${params.startSlot}-${params.endSlot}`,
      });

      return request;
    });
  }

  /**
   * Confirms a teacher unavailability request and lists affected class occurrences.
   * D29, D30: Admin confirms request. Once confirmed, affected classes must be enumerated
   * for explicit admin resolution (substitute, reschedule, or cancel).
   */
  public async confirmUnavailabilityRequest(
    session: AuthSession,
    requestId: string
  ): Promise<{ request: TeacherUnavailabilityRequest; affectedOccurrences: ClassOccurrence[] }> {
    if (session.role !== 'admin') {
      throw new Error('ERR_FORBIDDEN: Only administrators can confirm unavailability requests.');
    }

    return this.repo.runTransaction(async (tx) => {
      const req = tx.teacherUnavailabilityRequests.get(requestId);
      if (!req) {
        throw new Error(`ERR_NOT_FOUND: Request ${requestId} not found.`);
      }

      req.status = 'confirmed';
      req.reviewedBy = session.userId;
      req.reviewedAt = new Date().toISOString();

      // Find affected class occurrences
      const affectedOccurrences: ClassOccurrence[] = [];
      for (const occ of tx.classOccurrences.values()) {
        if (
          occ.teacherId === req.teacherId &&
          occ.date === req.date &&
          occ.status === 'scheduled'
        ) {
          // Check slot overlap
          const occEnd = occ.startSlot + occ.duration - 1;
          if (Math.max(occ.startSlot, req.startSlot) <= Math.min(occEnd, req.endSlot)) {
            affectedOccurrences.push(occ);
          }
        }
      }

      this.repo.logAudit(session.userId, 'CONFIRM_UNAVAILABILITY', 'teacher_unavailability_requests', requestId, 'success', {
        affectedCount: affectedOccurrences.length,
      });

      return { request: req, affectedOccurrences };
    });
  }
}
