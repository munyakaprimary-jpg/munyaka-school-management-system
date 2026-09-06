// Shared role & status types used by both staffMasterService and StaffPreRegistration

export type MasterSystemRole =
  | 'head_teacher'
  | 'senior_teacher'
  | 'class_teacher'
  | 'subject_teacher'
  | 'bursar'
  | 'support_admin';

export type MasterAccessStatus = 'Active' | 'Pre-Registered' | 'Suspended' | 'Pending Invite';

export type SystemRole = MasterSystemRole;

export type AccessStatus = 'Pre-Registered' | 'Pending Invite' | 'Active' | 'Suspended';

/**
 * Shape used by the Access Master Ledger (StaffPreRegistration.tsx) and
 * AddPreRegModal.tsx for displaying and submitting pre-registration records.
 *
 * Mirrors the fields of MasterStaffRecord from staffMasterService so that
 * conversions (toPreReg / masterToStaffMember) are lossless.
 */
export interface PreRegisteredStaff {
  // Identity
  id: string;
  staffId: string;         // login username e.g. "T001"
  fullName: string;
  nationalId: string;
  tscNumber?: string;

  // Contact
  email: string;
  phone: string;

  // Role & assignment
  systemRole: SystemRole;
  department?: string;
  assignedGrade?: string;
  assignedStream?: string;
  assignedSubjects: string[];

  // Personal
  gender?: string;
  salary?: number;

  // Employment
  joinedDate?: string;

  // Emergency
  emergencyContact?: string;
  emergencyName?: string;

  // School
  schoolId?: string;

  // Auth / access
  tempAccessCode: string;   // primary password (MUNYAKA-XXXX)
  status: AccessStatus;
  datePreRegistered: string;
  activatedAt?: string;
  lastLogin?: string;
  profileComplete?: boolean;
}

export const SYSTEM_ROLE_LABELS: Record<SystemRole, { label: string; color: string; badgeBg: string }> = {
  head_teacher:   { label: 'Head Teacher',    color: 'text-purple-700', badgeBg: 'bg-purple-50 border-purple-100' },
  senior_teacher: { label: 'Senior Teacher',  color: 'text-indigo-700', badgeBg: 'bg-indigo-50 border-indigo-100' },
  class_teacher:  { label: 'Class Teacher',   color: 'text-blue-700',   badgeBg: 'bg-blue-50 border-blue-100'    },
  subject_teacher:{ label: 'Subject Teacher', color: 'text-emerald-700',badgeBg: 'bg-emerald-50 border-emerald-100' },
  bursar:         { label: 'Bursar / Finance',color: 'text-amber-700',  badgeBg: 'bg-amber-50 border-amber-100'  },
  support_admin:  { label: 'System Admin',   color: 'text-rose-700',   badgeBg: 'bg-rose-50 border-rose-100'    },
};
