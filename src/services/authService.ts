/**
 * Authentication and server-enforced role authorization service.
 * Reference: docs/01_MASTER_PRD.md (Section 3), docs/06_API_AND_WORKFLOWS.md (Section 2), docs/08_SECURITY_CONFIG_AND_OPERATIONS.md
 */

import { TimetableRepository, UserProfile } from '../data/repository.js';
import { UserRole } from '../domain/types.js';

export interface AuthSession {
  userId: string;
  email: string;
  role: UserRole;
  linkedId?: string;
}

export class AuthService {
  constructor(private repo: TimetableRepository) {}

  /**
   * Admin-only user account provisioning.
   * Prohibits open public self-registration from claiming privileged roles (D14).
   */
  public async createUser(
    actorRole: UserRole,
    params: {
      email: string;
      role: UserRole;
      passwordHash: string;
      linkedId?: string;
    }
  ): Promise<UserProfile> {
    if (actorRole !== 'admin') {
      throw new Error('ERR_FORBIDDEN: Only administrators can create user accounts or assign roles.');
    }

    return this.repo.runTransaction(async (tx) => {
      // Check if email already exists
      for (const existing of tx.userProfiles.values()) {
        if (existing.email.toLowerCase() === params.email.toLowerCase()) {
          throw new Error('ERR_EMAIL_EXISTS: A user with this email already exists.');
        }
      }

      const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const profile: UserProfile = {
        id,
        email: params.email.toLowerCase(),
        role: params.role,
        linkedId: params.linkedId,
        passwordHash: params.passwordHash,
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };

      tx.userProfiles.set(id, profile);
      this.repo.logAudit(id, 'CREATE_USER', 'user_profiles', id, 'success', {
        role: params.role,
        email: params.email,
      });

      return profile;
    });
  }

  /**
   * Authenticates a user against stored credentials.
   */
  public authenticate(email: string, passwordHash: string): AuthSession {
    const state = this.repo.getState();
    for (const profile of state.userProfiles.values()) {
      if (
        profile.email.toLowerCase() === email.toLowerCase() &&
        profile.passwordHash === passwordHash
      ) {
        return {
          userId: profile.id,
          email: profile.email,
          role: profile.role,
          linkedId: profile.linkedId,
        };
      }
    }
    throw new Error('ERR_UNAUTHENTICATED: Invalid email or password.');
  }

  /**
   * Password recovery request:
   * Non-negotiable security requirement (Section 11 of Test Plan):
   * Does NOT disclose whether arbitrary emails are registered.
   */
  public requestPasswordRecovery(email: string): { message: string } {
    // Intentionally returns uniform response without revealing if email is registered
    return {
      message: 'If the university account exists, a secure password recovery link has been dispatched.',
    };
  }

  /**
   * Enforces role requirements on operations.
   */
  public static requireRole(session: AuthSession, allowedRoles: UserRole[]): void {
    if (!allowedRoles.includes(session.role)) {
      throw new Error(`ERR_FORBIDDEN: Role '${session.role}' is not authorized to perform this operation.`);
    }
  }
}
