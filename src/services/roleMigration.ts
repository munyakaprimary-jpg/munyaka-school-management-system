/**
 * src/services/roleMigration.ts
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RBAC Migration: owner → super_admin
 * ─────────────────────────────────────────────────────────────────────────────
 * This module performs a one-time migration of all localStorage user records
 * from the deprecated 'owner' role to 'super_admin'. After migration,
 * 'owner' is removed from the UserRole type entirely.
 *
 * Migration is idempotent — calling migrateAllUsers() multiple times is safe.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { UserRole } from '@/context/AuthContext';

// The canonical, current list of valid roles. 'owner' is deprecated.
export const VALID_ROLES: UserRole[] = [
  'super_admin',
  'head_teacher',
  'teacher',
  'bursar',
  'parent',
  'student',
];

// The deprecated role that has been merged into super_admin.
export const DEPRECATED_ROLE = 'owner' as const;

/** True when `role` is the deprecated 'owner' sentinel. */
export function isDeprecatedOwner(role: string | null | undefined): boolean {
  return role === DEPRECATED_ROLE || role === 'OWNER';
}

/**
 * Normalize any legacy 'owner' value to 'super_admin'.
 * Call this on every role read from localStorage before using it in
 * comparisons, switch statements, or route guards.
 *
 * Examples:
 *   normalizeRole('owner')      → 'super_admin'
 *   normalizeRole('super_admin') → 'super_admin'
 *   normalizeRole(null)        → null
 */
export function normalizeRole(role: string | null | undefined): UserRole | null {
  if (!role) return null;
  const lower = role.trim().toLowerCase();
  if (lower === 'owner') return 'super_admin';
  if (lower === 'superadmin') return 'super_admin';
  if (lower === 'ict_teacher') return 'teacher'; // ICT teachers are stored as teacher + RBAC flag
  if (VALID_ROLES.includes(role as UserRole)) return role as UserRole;
  // Unknown role — return as-is so debugging catches it
  return role as UserRole;
}

/**
 * Human-readable display label for a UserRole.
 */
export function roleLabel(role: string | null | undefined): string {
  const map: Record<string, string> = {
    super_admin: 'Super Admin',
    head_teacher: 'Head Teacher',
    teacher: 'Teacher',
    bursar: 'Bursar',
    parent: 'Parent',
    student: 'Student',
    // Legacy
    owner: 'Super Admin',
    OWNER: 'Super Admin',
  };
  if (!role) return 'Guest';
  return map[role.toLowerCase()] ?? role;
}

/**
 * True when the given role should be treated as an administrator
 * (can access admin panels, settings, and billing).
 *
 * NOTE: Any role with 'super_admin' access now has ALL the combined
 * responsibilities previously split between Owner and SuperAdmin:
 *   - App Subscriptions & Payment Management  (formerly Owner)
 *   - Full System Configuration & User Management (formerly SuperAdmin)
 */
export function isAdminRole(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'super_admin';
}

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION — run once on app boot
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scan every user record in localStorage and replace any `role: 'owner'`
 * with `role: 'super_admin'`. Also updates the `CURRENT_AUTH_ROLE_KEY`
 * session key if it holds the deprecated value.
 *
 * Call this from `AuthContext` on mount / before rendering any routes.
 */
export function migrateAllUsers(): { migrated: number } {
  let migrated = 0;

  try {
    // 1. Migrate the users directory
    const USERS_KEY = 'munyaka_users';
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const users: Record<string, any> = JSON.parse(raw);
      let changed = false;
      Object.entries(users).forEach(([email, user]) => {
        if ((user as any).role === 'owner' || (user as any).role === 'OWNER') {
          (user as any).role = 'super_admin';
          changed = true;
          migrated++;
        }
      });
      if (changed) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    }

    // 2. Migrate the staff directory (teachers / admin staff)
    const STAFF_KEYS = ['munyaka_staff', 'staff', 'school_staff_data'];
    STAFF_KEYS.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const staff: any[] = JSON.parse(raw);
          let changed = false;
          staff.forEach((s) => {
            if (s.role === 'owner' || s.role === 'OWNER') {
              s.role = 'super_admin';
              changed = true;
              migrated++;
            }
          });
          if (changed) {
            localStorage.setItem(key, JSON.stringify(staff));
          }
        } catch { /* ignore parse errors */ }
      }
    });

    // 3. Migrate the current auth session role if it holds the deprecated value
    const SESSION_ROLE_KEY = 'munyaka_current_auth_role';
    const sessionRole = localStorage.getItem(SESSION_ROLE_KEY);
    if (sessionRole && isDeprecatedOwner(sessionRole)) {
      localStorage.setItem(SESSION_ROLE_KEY, 'super_admin');
      migrated++;
    }

    // 4. Migrate any role-based permission grants
    const PERM_KEYS = [
      'munyaka_ict_manager_permission',
      'munyaka_rbac_grants',
    ];
    PERM_KEYS.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const perm: any = JSON.parse(raw);
          let changed = false;
          Object.values(perm).forEach((entry: any) => {
            if (Array.isArray(entry?.roles)) {
              entry.roles.forEach((r: string, i: number) => {
                if (isDeprecatedOwner(r)) {
                  entry.roles[i] = 'super_admin';
                  changed = true;
                }
              });
            }
          });
          if (changed) {
            localStorage.setItem(key, JSON.stringify(perm));
          }
        } catch { /* ignore */ }
      }
    });
  } catch (e) {
    console.error('[roleMigration] Migration failed:', e);
  }

  return { migrated };
}
