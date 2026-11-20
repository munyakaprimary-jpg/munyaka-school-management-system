// Shared role & status types used by both staffMasterService and StaffPreRegistration

export type MasterSystemRole =
  | 'head_teacher'
  | 'deputy_head_teacher'
  | 'senior_teacher'
  | 'class_teacher'
  | 'subject_teacher'
  | 'ict_teacher'
  | 'hoi'
  | 'dhoi'
  | 'admin'
  | 'bursar'
  | 'support_admin'
  | 'support_staff'
  | 'librarian'
  | 'storekeeper'
  | 'lab_assistant'
  | 'ict_technician';

export type MasterAccessStatus = 'Active' | 'Pre-Registered' | 'Suspended' | 'Pending Invite';

export type SystemRole = MasterSystemRole;

export type AccessStatus = 'Pre-Registered' | 'Pending Invite' | 'Active' | 'Suspended';

/**
 * Teaching staff roles - involved in classroom instruction
 */
export const TEACHING_ROLES: SystemRole[] = [
  'class_teacher',
  'subject_teacher',
  'ict_teacher',
  'senior_teacher',
  'head_teacher',
  'deputy_head_teacher',
  'hoi',
  'dhoi'
];

/**
 * Non-teaching staff roles
 */
export const NON_TEACHING_ROLES: SystemRole[] = [
  'bursar',
  'support_admin',
  'support_staff',
  'librarian',
  'storekeeper',
  'lab_assistant',
  'ict_technician',
  'admin'
];

/**
 * Role display metadata
 */
export const SYSTEM_ROLE_LABELS: Record<SystemRole, { label: string; color: string; badgeBg: string }> = {
  head_teacher:    { label: 'Head Teacher',      color: 'text-purple-700',  badgeBg: 'bg-purple-50 border-purple-100'   },
  deputy_head_teacher: { label: 'Deputy Head Teacher', color: 'text-violet-700', badgeBg: 'bg-violet-50 border-violet-100' },
  senior_teacher:  { label: 'Senior Teacher',    color: 'text-indigo-700',  badgeBg: 'bg-indigo-50 border-indigo-100'  },
  class_teacher:   { label: 'Class Teacher',     color: 'text-blue-700',    badgeBg: 'bg-blue-50 border-blue-100'      },
  subject_teacher: { label: 'Subject Teacher',   color: 'text-emerald-700', badgeBg: 'bg-emerald-50 border-emerald-100'},
  ict_teacher:     { label: 'ICT Teacher',       color: 'text-cyan-700',    badgeBg: 'bg-cyan-50 border-cyan-100'      },
  hoi:             { label: 'Head of Institution', color: 'text-fuchsia-700', badgeBg: 'bg-fuchsia-50 border-fuchsia-100' },
  dhoi:            { label: 'Deputy HOI',        color: 'text-rose-700',    badgeBg: 'bg-rose-50 border-rose-100'      },
  admin:           { label: 'Administrator',     color: 'text-slate-900',   badgeBg: 'bg-slate-100 border-slate-200'   },
  bursar:          { label: 'Bursar / Finance',  color: 'text-amber-700',  badgeBg: 'bg-amber-50 border-amber-100'    },
  support_admin:   { label: 'System Admin',      color: 'text-rose-700',   badgeBg: 'bg-rose-50 border-rose-100'      },
  support_staff:   { label: 'Support Staff',     color: 'text-slate-700',   badgeBg: 'bg-slate-50 border-slate-100'    },
  librarian:       { label: 'Librarian',         color: 'text-orange-700',  badgeBg: 'bg-orange-50 border-orange-100'  },
  storekeeper:     { label: 'Storekeeper',       color: 'text-teal-700',    badgeBg: 'bg-teal-50 border-teal-100'      },
  lab_assistant:   { label: 'Lab Assistant',     color: 'text-sky-700',     badgeBg: 'bg-sky-50 border-sky-100'        },
  ict_technician:  { label: 'ICT Technician',    color: 'text-emerald-800', badgeBg: 'bg-emerald-50 border-emerald-100'}
};

export interface StaffMember {
  id: string;
  staffId?: string;
  name?: string;
  fullName?: string;
  tscNumber?: string;
  nationalId?: string;
  email: string;
  phone?: string;
  category?: string;
  rbacRole?: MasterSystemRole | string;
  systemRole?: MasterSystemRole | string;
  department?: string;
  status: AccessStatus;
  subjects?: string[];
  assignedSubjects?: string[];
  assignedClasses?: string[];
  assignedStreams?: string[];
  assignedGrade?: string;
  assignedStream?: string;
  homeroomGrade?: string;
  homeroomStream?: string;
  tempAccessCode?: string;
  datePreRegistered: string;
  activatedAt?: string;
  lastLogin?: string;
  profileComplete?: boolean;
}

export type PreRegisteredStaff = StaffMember;
