/**
 * Menu-Based RBAC Definitions & Rules
 * Implements APP_SIDEBAR_MENUS, allowedRoles mapping, and filtering utilities.
 *
 * CLEANUP: Retained ONLY fully operational modules.
 * - Dashboard (`/dashboard`)
 * - Daily Check-In (`/staff-checkin`)
 * - Learners (`/learners`)
 * - CBC Marks Entry (`/assessments`)
 * - Timetable (`/timetable`)
 * - Workstation Hubs (ICT, Library, Inventory as permitted per role)
 * - Admin / Staff Registry (Admin/DHOI roles only)
 */

export interface SidebarMenuItem {
  key: string;
  name: string;
  path: string;
  iconName: string;
  moduleKey: string;
  allowedRoles: string[]; // e.g. ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'ict_teacher', 'lab_teacher', 'library_teacher', 'tools_inventory_teacher']
}

export const ALL_ROLES = [
  'admin',
  'dhoi',
  'class_teacher',
  'subject_teacher',
  'ict_teacher',
  'lab_teacher',
  'library_teacher',
  'tools_inventory_teacher',
  'owner',
  'hoi',
  'super_admin',
  'sysadmin'
];

export const TEACHING_ROLES = [
  'class_teacher',
  'subject_teacher',
  'ict_teacher',
  'lab_teacher',
  'library_teacher',
  'tools_inventory_teacher'
];

export const ADMIN_OR_MANAGEMENT_ROLES = [
  'admin',
  'dhoi',
  'owner',
  'hoi',
  'super_admin',
  'sysadmin'
];

export const APP_SIDEBAR_MENUS: SidebarMenuItem[] = [
  {
    key: 'admin_dashboard',
    name: 'Dashboard',
    path: '/dashboard',
    iconName: 'LayoutDashboard',
    moduleKey: 'dashboard',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'ict_teacher', 'lab_teacher', 'library_teacher', 'tools_inventory_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'daily_checkin',
    name: 'Daily Check-In',
    path: '/staff-checkin',
    iconName: 'LogIn',
    moduleKey: 'attendance',
    allowedRoles: ['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin', 'class_teacher', 'subject_teacher', 'teacher', 'head_teacher']
  },
  {
    key: 'learners',
    name: 'Learners',
    path: '/learners',
    iconName: 'Users',
    moduleKey: 'learners',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'enter_marks',
    name: 'CBC Marks Entry',
    path: '/assessments',
    iconName: 'FileSpreadsheet',
    moduleKey: 'assessments',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'timetable',
    name: 'Timetable',
    path: '/timetable',
    iconName: 'Clock',
    moduleKey: 'timetable',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'ict_lab_devices',
    name: 'ICT Lab & Devices',
    path: '/ict-lab',
    iconName: 'Monitor',
    moduleKey: 'inventory',
    allowedRoles: ['admin', 'dhoi', 'ict_teacher', 'lab_teacher', 'tools_inventory_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'library_e_resources',
    name: 'Library & E-Resources',
    path: '/library',
    iconName: 'Library',
    moduleKey: 'library',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'library_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'tools_inventory',
    name: 'Tools Inventory',
    path: '/inventory',
    iconName: 'Box',
    moduleKey: 'inventory',
    allowedRoles: ['admin', 'dhoi', 'tools_inventory_teacher', 'ict_teacher', 'lab_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'staff_registry',
    name: 'Staff Registry',
    path: '/staff-registry',
    iconName: 'UserCheck',
    moduleKey: 'staff',
    allowedRoles: ['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']
  }
];
