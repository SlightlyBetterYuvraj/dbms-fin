/**
 * Canonical input revision calculation for stale package detection.
 * Source of truth: docs/06_API_AND_WORKFLOWS.md (Section 3), docs/08_SECURITY_CONFIG_AND_OPERATIONS.md
 */

import crypto from 'crypto';
import { Course, CourseOffering, Room, Teacher } from './types.js';

export function computeInputRevision(params: {
  termIds: string[];
  rooms: Room[];
  teachers: Teacher[];
  courses: Course[];
  courseOfferings: CourseOffering[];
}): string {
  const sortedTermIds = [...params.termIds].sort();
  const sortedRooms = [...params.rooms]
    .filter((r) => r.active)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((r) => ({ id: r.id, cap: r.capacity, type: r.roomType }));

  const sortedTeachers = [...params.teachers]
    .filter((t) => t.active)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((t) => t.id);

  const sortedCourses = [...params.courses]
    .filter((c) => sortedTermIds.includes(c.termId))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((c) => ({
      id: c.id,
      l: c.lectureHours,
      t: c.tutorialHours,
      p: c.practicalHours,
    }));

  const sortedOfferings = [...params.courseOfferings]
    .filter((o) => sortedTermIds.includes(o.termId))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((o) => ({
      id: o.id,
      c: o.courseId,
      t: o.teacherId,
      g: o.targetId,
    }));

  const hashPayload = JSON.stringify({
    termIds: sortedTermIds,
    rooms: sortedRooms,
    teachers: sortedTeachers,
    courses: sortedCourses,
    courseOfferings: sortedOfferings,
  });

  return crypto.createHash('sha256').update(hashPayload).digest('hex').substring(0, 16);
}
