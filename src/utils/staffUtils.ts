/**
 * Staff Classification Utility
 * Provides robust helper functions to distinguish teaching staff from
 * support / non-teaching staff based on role and designation keywords.
 * Used by: AdminDashboard, CentralDataService (getSystemStats), StaffRegistry.
 */

// Support / non-teaching keywords (in order of precedence)
const SUPPORT_KEYWORDS = [
  'support',
  'bursar',
  'finance',
  'accountant',
  'secretary',
  'cook',
  'security',
  'guard',
  'groundskeeper',
  'cleaner',
  'clerk',
  'driver',
  'nurse',
  'technician',
  'admin assistant',
  'store master'
] as const;

// Teaching keywords
const TEACHING_KEYWORDS = [
  'teacher',
  'instructor',
  'educator',
  'tutor',
  'trainer',
  'head teacher',
  'deputy',
  'master',
  'mistress',
  'ict'
] as const;

/**
 * Determines whether a staff member is support / non-teaching staff.
 * Checks both role and designation fields (case-insensitive).
 * Returns true if ANY support keyword is found.
 */
export const isSupportStaff = (
  role: string = '',
  designation: string = ''
): boolean => {
  const combined = `${role} ${designation}`.toLowerCase();
  return SUPPORT_KEYWORDS.some((keyword) => combined.includes(keyword));
};

/**
 * Determines whether a staff member is teaching staff.
 * Returns false if the staff member explicitly matches a support keyword.
 * Otherwise returns true if ANY teaching keyword is found in role/designation.
 */
export const isTeachingStaff = (
  role: string = '',
  designation: string = ''
): boolean => {
  const combined = `${role} ${designation}`.toLowerCase();
  // If it explicitly matches support, it's not teaching
  if (isSupportStaff(role, designation)) {
    return false;
  }
  return TEACHING_KEYWORDS.some((keyword) => combined.includes(keyword));
};

/**
 * Returns the category label for a staff member based on role/designation.
 */
export const getStaffCategory = (
  role: string = '',
  designation: string = ''
): 'Teaching' | 'Support' | 'Unknown' => {
  if (isTeachingStaff(role, designation)) {
    return 'Teaching';
  }
  if (isSupportStaff(role, designation)) {
    return 'Support';
  }
  return 'Unknown';
};

/**
 * Returns the color badge config for staff type in the registry.
 */
export const getStaffTypeBadge = (
  role: string = '',
  designation: string = ''
): { bg: string; text: string; textColor: string } => {
  if (isTeachingStaff(role, designation)) {
    return {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      text: 'Teacher',
      textColor: 'text-emerald-600'
    };
  }
  if (isSupportStaff(role, designation)) {
    return {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      text: 'Support',
      textColor: 'text-blue-600'
    };
  }
  return {
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    text: 'Other',
    textColor: 'text-slate-500'
  };
};

/**
 * Counts teaching and support staff from a staff list.
 */
export const countStaffByType = (staffList: any[]): {
  teaching: number;
  support: number;
  unknown: number;
} => {
  let teaching = 0;
  let support = 0;
  let unknown = 0;

  for (const staff of staffList) {
    const role = String(staff.role || staff.category || '');
    const designation = String(staff.designation || '');
    if (isTeachingStaff(role, designation)) {
      teaching += 1;
    } else if (isSupportStaff(role, designation)) {
      support += 1;
    } else {
      unknown += 1;
    }
  }

  return { teaching, support, unknown };
};
