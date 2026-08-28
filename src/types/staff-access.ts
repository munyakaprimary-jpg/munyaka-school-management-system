export type SystemRole =
  | 'super_admin'
  | 'support_admin'
  | 'head_teacher'
  | 'senior_teacher'
  | 'class_teacher'
  | 'subject_teacher'
  | 'bursar';

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

export const SYSTEM_ROLE_LABELS: Record<SystemRole, { label: string; color: string; badgeBg: string; description: string }> = {
  super_admin: {
    label: 'Super Admin / Owner',
    color: 'text-fuchsia-700',
    badgeBg: 'bg-fuchsia-50 border-fuchsia-200',
    description: 'Holds the highest privilege. Sole authority over software payments, subscriptions, and financial gateway configurations.',
  },
  support_admin: {
    label: 'System Administrator',
    color: 'text-rose-700',
    badgeBg: 'bg-rose-50 border-rose-100',
    description: 'Day-to-day system configuration, user access, and operational administration.',
  },
  head_teacher: {
    label: 'Head Teacher',
    color: 'text-purple-700',
    badgeBg: 'bg-purple-50 border-purple-100',
    description: 'Manages academic structures, staff reports, and overall school administration.',
  },
  senior_teacher: {
    label: 'Senior Teacher',
    color: 'text-indigo-700',
    badgeBg: 'bg-indigo-50 border-indigo-100',
    description: 'Leads curriculum delivery and mentors class/subject teachers.',
  },
  class_teacher: {
    label: 'Class Teacher',
    color: 'text-blue-700',
    badgeBg: 'bg-blue-50 border-blue-100',
    description: 'Manages a single class attendance, welfare, and academic progress.',
  },
  subject_teacher: {
    label: 'Subject Teacher',
    color: 'text-emerald-700',
    badgeBg: 'bg-emerald-50 border-emerald-100',
    description: 'Delivers specific learning areas and enters assessment marks.',
  },
  bursar: {
    label: 'Bursar / Finance',
    color: 'text-amber-700',
    badgeBg: 'bg-amber-50 border-amber-100',
    description: 'Handles daily student fee collection, receipts, and account ledgers.',
  },
};
