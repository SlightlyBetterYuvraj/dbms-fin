/**
 * Timetable completeness and draft validation.
 * Verifies that all required sessions for every course offering are scheduled
 * and that all scheduled classes within the draft satisfy mandatory constraints.
 * Reference: docs/04_SCHEDULING_DOMAIN_RULES.md, docs/06_API_AND_WORKFLOWS.md
 */

import {
  Course,
  CourseOffering,
  ScheduledClass,
  ValidationErrorDetail,
  ValidationResult,
} from './types.js';
import { expandRequiredSessions } from './sessionRules.js';
import { validateCandidateSession, ValidationContext } from './conflictValidator.js';

export interface DraftTimetablePackage {
  termIds: string[];
  classes: ScheduledClass[];
}

/**
 * Validates the completeness and constraint satisfaction of an entire draft timetable.
 */
export function validateDraftTimetable(
  draft: DraftTimetablePackage,
  courses: Map<string, Course>,
  courseOfferings: Map<string, CourseOffering>,
  ctx: ValidationContext
): ValidationResult {
  const errors: ValidationErrorDetail[] = [];

  // 1. Validate contact hours for all courses and collect required sessions per offering
  const requiredSessionsByOffering = new Map<
    string,
    { activityType: string; count: number }[]
  >();

  for (const offering of courseOfferings.values()) {
    if (!draft.termIds.includes(offering.termId)) {
      continue;
    }
    const course = courses.get(offering.courseId);
    if (!course) {
      errors.push({
        code: 'ERR_COURSE_NOT_FOUND',
        message: `Course ${offering.courseId} for offering ${offering.id} not found.`,
        entityId: offering.id,
      });
      continue;
    }

    const { sessions, errors: expandErrors } = expandRequiredSessions(course);
    if (expandErrors.length > 0) {
      errors.push(...expandErrors);
      continue;
    }

    // Aggregate required sessions by type
    const counts = new Map<string, number>();
    for (const s of sessions) {
      counts.set(s.activityType, (counts.get(s.activityType) || 0) + 1);
    }

    const reqList: { activityType: string; count: number }[] = [];
    for (const [type, count] of counts.entries()) {
      reqList.push({ activityType: type, count });
    }
    requiredSessionsByOffering.set(offering.id, reqList);
  }

  // 2. Count scheduled sessions by offering in the draft
  const scheduledCountByOffering = new Map<string, Map<string, number>>();
  for (const cls of draft.classes) {
    if (!scheduledCountByOffering.has(cls.courseOfferingId)) {
      scheduledCountByOffering.set(cls.courseOfferingId, new Map());
    }
    const typeMap = scheduledCountByOffering.get(cls.courseOfferingId)!;
    typeMap.set(cls.activityType, (typeMap.get(cls.activityType) || 0) + 1);
  }

  // 3. Verify completeness: each offering must have exact scheduled count matching required count
  for (const [offeringId, requiredList] of requiredSessionsByOffering.entries()) {
    const scheduledMap = scheduledCountByOffering.get(offeringId) || new Map();
    for (const req of requiredList) {
      const scheduledCount = scheduledMap.get(req.activityType) || 0;
      if (scheduledCount < req.count) {
        errors.push({
          code: 'ERR_INCOMPLETE_SESSIONS',
          message: `Offering ${offeringId} is missing required ${req.activityType} sessions. Scheduled: ${scheduledCount}, Required: ${req.count}.`,
          entityId: offeringId,
        });
      } else if (scheduledCount > req.count) {
        errors.push({
          code: 'ERR_EXCESS_SESSIONS',
          message: `Offering ${offeringId} has extra ${req.activityType} sessions. Scheduled: ${scheduledCount}, Required: ${req.count}.`,
          entityId: offeringId,
        });
      }
    }
  }

  // 4. Validate pairwise constraints for all classes in draft
  // To avoid duplicate error reporting, each pair is checked once, or each candidate checked against preceding classes
  for (let i = 0; i < draft.classes.length; i++) {
    const candidate = draft.classes[i];
    const previousClasses = draft.classes.slice(0, i);

    const singleRes = validateCandidateSession(
      candidate,
      previousClasses,
      ctx
    );
    if (!singleRes.valid) {
      errors.push(...singleRes.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
