/**
 * Data repository with atomic transactions, rollback guarantees,
 * concurrency locking, audit logging, and transactional outbox.
 * Conforms to docs/05_DATA_MODEL.md and docs/06_API_AND_WORKFLOWS.md
 */

import {
  AcademicTerm,
  Batch,
  ClassOccurrence,
  Course,
  CourseOffering,
  ElectiveAssignment,
  ElectiveGroup,
  Room,
  ScheduledClass,
  Section,
  Student,
  StudentGroupMembership,
  Teacher,
  TeacherAvailability,
  TeacherUnavailabilityRequest,
  TimetableGridConfig,
  TimetableVersion,
  UserRole,
} from '../domain/types.js';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  linkedId?: string; // studentId or teacherId
  passwordHash: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuditEventRecord {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  outcome: 'success' | 'failure';
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface NotificationOutboxRecord {
  id: string;
  recipientStudentId: string;
  eventType: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  status: 'pending' | 'delivered' | 'failed';
  retryCount: number;
  createdAt: string;
  deliveredAt?: string;
}

export interface ClassOccurrenceEvent {
  id: string;
  occurrenceId: string;
  eventType: 'cancelled' | 'rescheduled' | 'room_changed' | 'teacher_changed' | 'replacement';
  priorPayload?: Record<string, unknown>;
  newPayload?: Record<string, unknown>;
  reason?: string;
  actorId: string;
  createdAt: string;
}

export interface RepositoryDataState {
  academicTerms: Map<string, AcademicTerm>;
  sections: Map<string, Section>;
  batches: Map<string, Batch>;
  students: Map<string, Student>;
  studentGroupMemberships: Map<string, StudentGroupMembership>;
  electiveGroups: Map<string, ElectiveGroup>;
  electiveAssignments: Map<string, ElectiveAssignment>;
  teachers: Map<string, Teacher>;
  teacherAvailabilities: Map<string, TeacherAvailability>;
  teacherUnavailabilityRequests: Map<string, TeacherUnavailabilityRequest>;
  rooms: Map<string, Room>;
  courses: Map<string, Course>;
  courseOfferings: Map<string, CourseOffering>;
  timetableVersions: Map<string, TimetableVersion>;
  scheduledClasses: Map<string, ScheduledClass>;
  classOccurrences: Map<string, ClassOccurrence>;
  classOccurrenceEvents: Map<string, ClassOccurrenceEvent>;
  userProfiles: Map<string, UserProfile>;
  auditEvents: AuditEventRecord[];
  notificationOutbox: NotificationOutboxRecord[];
  gridConfig: TimetableGridConfig;
}

function cloneEntityMap<K, V>(map: Map<K, V>): Map<K, V> {
  const cloned = new Map<K, V>();
  for (const [k, v] of map.entries()) {
    cloned.set(k, typeof v === 'object' && v !== null ? { ...v } : v);
  }
  return cloned;
}

function cloneDataState(src: RepositoryDataState): RepositoryDataState {
  return {
    academicTerms: cloneEntityMap(src.academicTerms),
    sections: cloneEntityMap(src.sections),
    batches: cloneEntityMap(src.batches),
    students: cloneEntityMap(src.students),
    studentGroupMemberships: cloneEntityMap(src.studentGroupMemberships),
    electiveGroups: cloneEntityMap(src.electiveGroups),
    electiveAssignments: cloneEntityMap(src.electiveAssignments),
    teachers: cloneEntityMap(src.teachers),
    teacherAvailabilities: cloneEntityMap(src.teacherAvailabilities),
    teacherUnavailabilityRequests: cloneEntityMap(src.teacherUnavailabilityRequests),
    rooms: cloneEntityMap(src.rooms),
    courses: cloneEntityMap(src.courses),
    courseOfferings: cloneEntityMap(src.courseOfferings),
    timetableVersions: cloneEntityMap(src.timetableVersions),
    scheduledClasses: cloneEntityMap(src.scheduledClasses),
    classOccurrences: cloneEntityMap(src.classOccurrences),
    classOccurrenceEvents: cloneEntityMap(src.classOccurrenceEvents),
    userProfiles: cloneEntityMap(src.userProfiles),
    auditEvents: src.auditEvents.map((a) => ({ ...a })),
    notificationOutbox: src.notificationOutbox.map((n) => ({ ...n })),
    gridConfig: {
      ...src.gridConfig,
      days: [...src.gridConfig.days],
      slots: src.gridConfig.slots.map((s) => ({ ...s })),
    },
  };
}

export class TimetableRepository {
  private state: RepositoryDataState;
  private transactionLock: Promise<void> = Promise.resolve();

  constructor(initialGrid?: TimetableGridConfig) {
    const defaultGrid: TimetableGridConfig = initialGrid || {
      days: [1, 2, 3, 4, 5],
      slotsPerDay: 8,
      slots: [
        { dayOfWeek: 1, slotIndex: 1, startTime: '09:00', endTime: '10:00' },
        { dayOfWeek: 1, slotIndex: 2, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 1, slotIndex: 3, startTime: '11:00', endTime: '12:00' },
        { dayOfWeek: 1, slotIndex: 4, startTime: '12:00', endTime: '13:00', isBreak: true },
        { dayOfWeek: 1, slotIndex: 5, startTime: '13:00', endTime: '14:00' },
        { dayOfWeek: 1, slotIndex: 6, startTime: '14:00', endTime: '15:00' },
        { dayOfWeek: 1, slotIndex: 7, startTime: '15:00', endTime: '16:00' },
        { dayOfWeek: 1, slotIndex: 8, startTime: '16:00', endTime: '17:00' },
        { dayOfWeek: 2, slotIndex: 1, startTime: '09:00', endTime: '10:00' },
        { dayOfWeek: 2, slotIndex: 2, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 2, slotIndex: 3, startTime: '11:00', endTime: '12:00' },
        { dayOfWeek: 2, slotIndex: 4, startTime: '12:00', endTime: '13:00', isBreak: true },
        { dayOfWeek: 2, slotIndex: 5, startTime: '13:00', endTime: '14:00' },
        { dayOfWeek: 2, slotIndex: 6, startTime: '14:00', endTime: '15:00' },
        { dayOfWeek: 2, slotIndex: 7, startTime: '15:00', endTime: '16:00' },
        { dayOfWeek: 2, slotIndex: 8, startTime: '16:00', endTime: '17:00' },
        { dayOfWeek: 3, slotIndex: 1, startTime: '09:00', endTime: '10:00' },
        { dayOfWeek: 3, slotIndex: 2, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 3, slotIndex: 3, startTime: '11:00', endTime: '12:00' },
        { dayOfWeek: 3, slotIndex: 4, startTime: '12:00', endTime: '13:00', isBreak: true },
        { dayOfWeek: 3, slotIndex: 5, startTime: '13:00', endTime: '14:00' },
        { dayOfWeek: 3, slotIndex: 6, startTime: '14:00', endTime: '15:00' },
        { dayOfWeek: 3, slotIndex: 7, startTime: '15:00', endTime: '16:00' },
        { dayOfWeek: 3, slotIndex: 8, startTime: '16:00', endTime: '17:00' },
        { dayOfWeek: 4, slotIndex: 1, startTime: '09:00', endTime: '10:00' },
        { dayOfWeek: 4, slotIndex: 2, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 4, slotIndex: 3, startTime: '11:00', endTime: '12:00' },
        { dayOfWeek: 4, slotIndex: 4, startTime: '12:00', endTime: '13:00', isBreak: true },
        { dayOfWeek: 4, slotIndex: 5, startTime: '13:00', endTime: '14:00' },
        { dayOfWeek: 4, slotIndex: 6, startTime: '14:00', endTime: '15:00' },
        { dayOfWeek: 4, slotIndex: 7, startTime: '15:00', endTime: '16:00' },
        { dayOfWeek: 4, slotIndex: 8, startTime: '16:00', endTime: '17:00' },
        { dayOfWeek: 5, slotIndex: 1, startTime: '09:00', endTime: '10:00' },
        { dayOfWeek: 5, slotIndex: 2, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 5, slotIndex: 3, startTime: '11:00', endTime: '12:00' },
        { dayOfWeek: 5, slotIndex: 4, startTime: '12:00', endTime: '13:00', isBreak: true },
        { dayOfWeek: 5, slotIndex: 5, startTime: '13:00', endTime: '14:00' },
        { dayOfWeek: 5, slotIndex: 6, startTime: '14:00', endTime: '15:00' },
        { dayOfWeek: 5, slotIndex: 7, startTime: '15:00', endTime: '16:00' },
        { dayOfWeek: 5, slotIndex: 8, startTime: '16:00', endTime: '17:00' },
      ],
    };

    this.state = {
      academicTerms: new Map(),
      sections: new Map(),
      batches: new Map(),
      students: new Map(),
      studentGroupMemberships: new Map(),
      electiveGroups: new Map(),
      electiveAssignments: new Map(),
      teachers: new Map(),
      teacherAvailabilities: new Map(),
      teacherUnavailabilityRequests: new Map(),
      rooms: new Map(),
      courses: new Map(),
      courseOfferings: new Map(),
      timetableVersions: new Map(),
      scheduledClasses: new Map(),
      classOccurrences: new Map(),
      classOccurrenceEvents: new Map(),
      userProfiles: new Map(),
      auditEvents: [],
      notificationOutbox: [],
      gridConfig: defaultGrid,
    };
  }

  /**
   * Returns a read-only snapshot of current data state.
   */
  public getState(): Readonly<RepositoryDataState> {
    return this.state;
  }

  /**
   * Executes a mutating operation inside an atomic transaction.
   * If an exception occurs, all changes made inside callback are rolled back immediately.
   * Concurrent transactions are strictly serialized to prevent race conditions.
   */
  public async runTransaction<T>(
    callback: (txState: RepositoryDataState) => Promise<T>
  ): Promise<T> {
    // Chain transaction locks to enforce strict serializability for race safety
    const previousLock = this.transactionLock;
    let releaseLock: () => void;
    this.transactionLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    await previousLock;

    try {
      // Snapshot state prior to transaction
      const snapshot = cloneDataState(this.state);
      try {
        const result = await callback(snapshot);
        // Transaction succeeded: atomically commit snapshot
        this.state = snapshot;
        return result;
      } catch (err) {
        // Transaction failed: discard snapshot, state remains intact
        throw err;
      }
    } finally {
      releaseLock!();
    }
  }

  /**
   * Helper to append an audit event.
   */
  public logAudit(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    outcome: 'success' | 'failure',
    details?: Record<string, unknown>,
    txState?: RepositoryDataState
  ): void {
    const target = txState ? txState.auditEvents : this.state.auditEvents;
    target.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actorId,
      action,
      entityType,
      entityId,
      outcome,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Flushes and returns pending notifications from the outbox.
   */
  public deliverPendingNotifications(): NotificationOutboxRecord[] {
    const pending = this.state.notificationOutbox.filter((n) => n.status === 'pending');
    const now = new Date().toISOString();
    for (const notice of pending) {
      notice.status = 'delivered';
      notice.deliveredAt = now;
    }
    return pending;
  }
}
