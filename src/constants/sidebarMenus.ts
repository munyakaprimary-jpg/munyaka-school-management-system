/**
 * Menu-Based RBAC Definitions & Rules
 * Implements APP_SIDEBAR_MENUS, allowedRoles mapping, and route mapping registry.
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
    name: 'Dashboard & Overview',
    path: '/portal/dashboard',
    iconName: 'LayoutDashboard',
    moduleKey: 'dashboard',
    allowedRoles: ['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin', 'class_teacher', 'subject_teacher']
  },
  {
    key: 'data_harmonization',
    name: 'Data Harmonization Hub',
    path: '/portal/data-harmonization',
    iconName: 'ShieldCheck',
    moduleKey: 'server',
    allowedRoles: ['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'learners',
    name: 'Learners',
    path: '/portal/learners',
    iconName: 'Users',
    moduleKey: 'learners',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'staff_registry',
    name: 'Staff Registry',
    path: '/portal/staff',
    iconName: 'UserCheck',
    moduleKey: 'staff',
    allowedRoles: ['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'games_hub',
    name: 'Games Hub',
    path: '/portal/games-hub',
    iconName: 'Gamepad2',
    moduleKey: 'dashboard',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'ict_teacher', 'lab_teacher', 'library_teacher', 'tools_inventory_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'grades_streams',
    name: 'Grades & Streams',
    path: '/portal/grades-streams',
    iconName: 'Layers',
    moduleKey: 'timetable',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'transferred_archive',
    name: 'Transferred Archive',
    path: '/portal/transferred',
    iconName: 'Archive',
    moduleKey: 'learners',
    allowedRoles: ['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'learning_areas',
    name: 'Learning Areas',
    path: '/portal/learning-areas',
    iconName: 'BookOpen',
    moduleKey: 'assessments',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'exam_types',
    name: 'Exam Types',
    path: '/portal/exam-types',
    iconName: 'Award',
    moduleKey: 'assessments',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'tenants_campuses',
    name: 'Tenants / Campuses',
    path: '/portal/tenants',
    iconName: 'School',
    moduleKey: 'school',
    allowedRoles: ['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'admin_control',
    name: 'Admin Control Center',
    path: '/portal/admin-control',
    iconName: 'Shield',
    moduleKey: 'settings',
    allowedRoles: ['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'communication',
    name: 'Communication',
    path: '/portal/communication',
    iconName: 'MessageSquare',
    moduleKey: 'communication',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'ict_teacher', 'lab_teacher', 'library_teacher', 'tools_inventory_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'events_notices',
    name: 'Events & Notices',
    path: '/portal/notices',
    iconName: 'Bell',
    moduleKey: 'communication',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'ict_teacher', 'lab_teacher', 'library_teacher', 'tools_inventory_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'timetable',
    name: 'Timetable',
    path: '/portal/timetable',
    iconName: 'Clock',
    moduleKey: 'timetable',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'ict_teacher', 'lab_teacher', 'library_teacher', 'tools_inventory_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'central_data_apk',
    name: 'Central Data & APK',
    path: '/portal/central-data',
    iconName: 'Database',
    moduleKey: 'server',
    allowedRoles: ['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'learner_attendance',
    name: 'Learner Attendance',
    path: '/portal/learner-attendance',
    iconName: 'ClipboardCheck',
    moduleKey: 'attendance',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'daily_checkin',
    name: 'Daily Check-In',
    path: '/portal/attendance',
    iconName: 'LogIn',
    moduleKey: 'attendance',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'ict_teacher', 'lab_teacher', 'library_teacher', 'tools_inventory_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'attendance_monitor',
    name: 'Attendance Monitor',
    path: '/portal/attendance-monitor',
    iconName: 'Monitor',
    moduleKey: 'attendance',
    allowedRoles: ['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'attendance_management',
    name: 'Attendance Management',
    path: '/portal/attendance-mgmt',
    iconName: 'CheckSquare',
    moduleKey: 'attendance',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'enter_marks',
    name: 'Enter Marks',
    path: '/portal/enter-marks',
    iconName: 'FileSpreadsheet',
    moduleKey: 'assessments',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'results_analysis',
    name: 'Results Analysis',
    path: '/portal/results-analysis',
    iconName: 'BarChart3',
    moduleKey: 'reports',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'grading_review',
    name: 'Grading Review',
    path: '/portal/grading-review',
    iconName: 'Target',
    moduleKey: 'assessments',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'create_exam',
    name: 'Create Exam / Quiz',
    path: '/portal/create-exam',
    iconName: 'Award',
    moduleKey: 'assessments',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'question_bank',
    name: 'Question Bank & Import',
    path: '/portal/question-bank',
    iconName: 'BookOpen',
    moduleKey: 'assessments',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'grading_marks',
    name: 'Grading & Marks',
    path: '/portal/grading-marks',
    iconName: 'FileText',
    moduleKey: 'assessments',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'all_set_exams',
    name: 'All Set Exams',
    path: '/portal/all-set-exams',
    iconName: 'FileText',
    moduleKey: 'assessments',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'digital_hub',
    name: 'Digital Hub',
    path: '/portal/digital-hub',
    iconName: 'Laptop',
    moduleKey: 'library',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'ict_teacher', 'lab_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'ict_lab_devices',
    name: 'ICT Lab & Devices',
    path: '/portal/ict-lab',
    iconName: 'Monitor',
    moduleKey: 'inventory',
    allowedRoles: ['admin', 'dhoi', 'ict_teacher', 'lab_teacher', 'tools_inventory_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'digital_skills',
    name: 'Digital Skills Assessment',
    path: '/portal/digital-skills',
    iconName: 'Keyboard',
    moduleKey: 'library',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'ict_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'practical_competencies',
    name: 'Practical Competencies',
    path: '/portal/practical-competencies',
    iconName: 'Award',
    moduleKey: 'assessments',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'lab_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'portfolios',
    name: 'Portfolios',
    path: '/portal/portfolios',
    iconName: 'FolderHeart',
    moduleKey: 'assessments',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'library_e_resources',
    name: 'Library & E-Resources',
    path: '/portal/library',
    iconName: 'Library',
    moduleKey: 'library',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'library_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'study_corner',
    name: 'Study Corner',
    path: '/portal/study-corner',
    iconName: 'BookOpen',
    moduleKey: 'library',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'subject_teacher', 'ict_teacher', 'lab_teacher', 'library_teacher', 'tools_inventory_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'tools_inventory',
    name: 'Tools & Inventory',
    path: '/portal/tools-inventory',
    iconName: 'Box',
    moduleKey: 'inventory',
    allowedRoles: ['admin', 'dhoi', 'tools_inventory_teacher', 'ict_teacher', 'lab_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'fees_finance',
    name: 'Fees & Finance',
    path: '/portal/fees',
    iconName: 'Wallet',
    moduleKey: 'fees',
    allowedRoles: ['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'report_cards',
    name: 'Report Cards',
    path: '/portal/report-cards',
    iconName: 'FileText',
    moduleKey: 'reports',
    allowedRoles: ['admin', 'dhoi', 'class_teacher', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'settings',
    name: 'Settings',
    path: '/portal/settings',
    iconName: 'Settings',
    moduleKey: 'settings',
    allowedRoles: ['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']
  },
  {
    key: 'promote_learners',
    name: 'Promote Learners',
    path: '/portal/promote',
    iconName: 'ArrowUpCircle',
    moduleKey: 'learners',
    allowedRoles: ['admin', 'dhoi', 'owner', 'hoi', 'super_admin', 'sysadmin']
  }
];
