/**
 * Centralized Staff Role Mapping & RBAC Constants
 */

export interface StaffRoleOption {
  label: string;
  rbacKey: string;
  defaultTitle: string;
  systemRole: string;
}

export const STAFF_ROLE_OPTIONS: StaffRoleOption[] = [
  { label: 'Class Teacher', rbacKey: 'class_teacher', defaultTitle: 'Class Teacher', systemRole: 'class_teacher' },
  { label: 'Subject Teacher', rbacKey: 'subject_teacher', defaultTitle: 'Subject Teacher', systemRole: 'subject_teacher' },
  { label: 'ICT Teacher', rbacKey: 'ict_teacher', defaultTitle: 'ICT Teacher', systemRole: 'ict_teacher' },
  { label: 'Lab Teacher', rbacKey: 'lab_teacher', defaultTitle: 'Lab Teacher', systemRole: 'subject_teacher' },
  { label: 'Library Teacher', rbacKey: 'library_teacher', defaultTitle: 'Library Teacher', systemRole: 'subject_teacher' },
  { label: 'Bursar', rbacKey: 'bursar', defaultTitle: 'Bursar / Accounts', systemRole: 'bursar' },
  { label: 'HOI', rbacKey: 'hoi', defaultTitle: 'Head of Institution', systemRole: 'head_teacher' },
  { label: 'DHOI', rbacKey: 'dhoi', defaultTitle: 'Deputy Head of Institution', systemRole: 'head_teacher' },
  { label: 'Store Master', rbacKey: 'store_master', defaultTitle: 'Store Master', systemRole: 'storekeeper' }
];

export function mapRoleLabelToRbacKey(labelOrRole: string): string {
  const norm = String(labelOrRole || '').trim().toLowerCase();
  const found = STAFF_ROLE_OPTIONS.find(
    o => o.label.toLowerCase() === norm || o.rbacKey.toLowerCase() === norm || o.defaultTitle.toLowerCase() === norm
  );
  if (found) return found.rbacKey;

  if (norm.includes('admin') || norm.includes('owner')) return 'admin';
  if (norm.includes('hoi')) return 'hoi';
  if (norm.includes('dhoi')) return 'dhoi';
  if (norm.includes('head')) return 'admin';
  if (norm.includes('bursar') || norm.includes('accountant')) return 'bursar';
  if (norm.includes('ict')) return 'ict_teacher';
  if (norm.includes('librar')) return 'library_teacher';
  if (norm.includes('store')) return 'store_master';
  if (norm.includes('class')) return 'class_teacher';
  return 'subject_teacher';
}
