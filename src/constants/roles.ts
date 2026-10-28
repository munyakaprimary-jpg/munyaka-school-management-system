/**
 * Centralized Staff Role Mapping & RBAC Constants
 */

export interface StaffRoleItem {
  label: string;
  rbacKey: string;
  category: 'teaching' | 'non_teaching';
  defaultTitle?: string;
  systemRole?: string;
}

export const MUNYAKA_STAFF_ROLES: StaffRoleItem[] = [
  { label: 'Class Teacher', rbacKey: 'class_teacher', category: 'teaching', defaultTitle: 'Class Teacher', systemRole: 'class_teacher' },
  { label: 'Subject Teacher', rbacKey: 'subject_teacher', category: 'teaching', defaultTitle: 'Subject Teacher', systemRole: 'subject_teacher' },
  { label: 'ICT Teacher', rbacKey: 'ict_teacher', category: 'teaching', defaultTitle: 'ICT Teacher', systemRole: 'ict_teacher' },
  { label: 'Lab Teacher', rbacKey: 'lab_teacher', category: 'teaching', defaultTitle: 'Lab Teacher', systemRole: 'subject_teacher' },
  { label: 'Library Teacher', rbacKey: 'library_teacher', category: 'teaching', defaultTitle: 'Library Teacher', systemRole: 'subject_teacher' },
  { label: 'Tools & Inventory Teacher', rbacKey: 'tools_inventory_teacher', category: 'teaching', defaultTitle: 'Tools & Inventory Teacher', systemRole: 'storekeeper' },
  { label: 'HOI', rbacKey: 'admin', category: 'non_teaching', defaultTitle: 'Head of Institution', systemRole: 'head_teacher' },
  { label: 'DHOI', rbacKey: 'dhoi', category: 'non_teaching', defaultTitle: 'Deputy Head of Institution', systemRole: 'head_teacher' }
];

// For backwards compatibility
export const STAFF_ROLE_OPTIONS = MUNYAKA_STAFF_ROLES;

export function mapRoleLabelToRbacKey(labelOrRole: string): string {
  const norm = String(labelOrRole || '').trim().toLowerCase();
  const found = MUNYAKA_STAFF_ROLES.find(
    o => o.label.toLowerCase() === norm || o.rbacKey.toLowerCase() === norm
  );
  if (found) return found.rbacKey;

  if (norm.includes('admin') || norm.includes('hoi') || norm.includes('head') || norm.includes('owner')) return 'admin';
  if (norm.includes('dhoi')) return 'dhoi';
  if (norm.includes('ict')) return 'ict_teacher';
  if (norm.includes('librar')) return 'library_teacher';
  if (norm.includes('lab')) return 'lab_teacher';
  if (norm.includes('tools') || norm.includes('inventory')) return 'tools_inventory_teacher';
  if (norm.includes('class')) return 'class_teacher';
  return 'subject_teacher';
}

