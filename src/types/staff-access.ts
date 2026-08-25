export type SystemRole = 'head_teacher' | 'senior_teacher' | 'class_teacher' | 'subject_teacher' | 'bursar' | 'support_admin';

export type AccessStatus = 'Pre-Registered' | 'Pending Invite' | 'Active' | 'Suspended';

export interface PreRegisteredStaff {
  id: string;
  fullName: string;
  nationalId: string;
  tscNumber?: string;
  email: string;
  phone: string;
  systemRole: SystemRole;
  assignedGrade?: string;
  assignedStream?: string;
  assignedSubjects: string[];
  tempAccessCode: string;
  status: AccessStatus;
  datePreRegistered: string;
  activatedAt?: string;
  lastLogin?: string;
}

export const SYSTEM_ROLE_LABELS: Record<SystemRole, { label: string; color: string; badgeBg: string }> = {
  head_teacher: { label: 'Head Teacher', color: 'text-purple-700', badgeBg: 'bg-purple-50 border-purple-100' },
  senior_teacher: { label: 'Senior Teacher', color: 'text-indigo-700', badgeBg: 'bg-indigo-50 border-indigo-100' },
  class_teacher: { label: 'Class Teacher', color: 'text-blue-700', badgeBg: 'bg-blue-50 border-blue-100' },
  subject_teacher: { label: 'Subject Teacher', color: 'text-emerald-700', badgeBg: 'bg-emerald-50 border-emerald-100' },
  bursar: { label: 'Bursar / Finance', color: 'text-amber-700', badgeBg: 'bg-amber-50 border-amber-100' },
  support_admin: { label: 'System Admin', color: 'text-rose-700', badgeBg: 'bg-rose-50 border-rose-100' },
};