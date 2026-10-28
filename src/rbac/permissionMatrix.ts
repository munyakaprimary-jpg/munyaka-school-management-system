export interface RolePermissions {
  dashboard: boolean;
  learners: boolean;
  assessments: boolean;
  attendance: boolean;
  fees: boolean;
  library: boolean;
  inventory: boolean;
  communication: boolean;
  reports: boolean;
  timetable: boolean;
  settings: boolean;
  [key: string]: boolean;
}

export const ROLES = [
  'admin',
  'dhoi',
  'class_teacher',
  'subject_teacher',
  'ict_teacher',
  'lab_teacher',
  'library_teacher',
  'tools_inventory_teacher'
] as const;

export const PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard & Overview' },
  { key: 'learners', label: 'Student Admissions & Profiles' },
  { key: 'assessments', label: 'CBC Marks & Exam Types' },
  { key: 'attendance', label: 'Roll Call & Attendance' },
  { key: 'fees', label: 'Fees & Finance' },
  { key: 'library', label: 'Library & E-Resources' },
  { key: 'inventory', label: 'ICT Lab & Devices / Tools & Inventory' },
  { key: 'communication', label: 'Communication & Notices' },
  { key: 'reports', label: 'Report Cards & Results' },
  { key: 'timetable', label: 'Timetable & Classes' },
  { key: 'settings', label: 'System Settings & Security' },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  admin: {
    dashboard: true,
    learners: true,
    assessments: true,
    attendance: true,
    fees: true,
    library: true,
    inventory: true,
    communication: true,
    reports: true,
    timetable: true,
    settings: true,
  },
  dhoi: {
    dashboard: true,
    learners: true,
    assessments: true,
    attendance: true,
    fees: true,
    library: true,
    inventory: true,
    communication: true,
    reports: true,
    timetable: true,
    settings: false,
  },
  class_teacher: {
    dashboard: true,
    learners: true,
    assessments: true,
    attendance: true,
    fees: false,
    library: true,
    inventory: false,
    communication: true,
    reports: true,
    timetable: true,
    settings: false,
  },
  subject_teacher: {
    dashboard: true,
    learners: false,
    assessments: true,
    attendance: true,
    fees: false,
    library: true,
    inventory: false,
    communication: true,
    reports: true,
    timetable: true,
    settings: false,
  },
  ict_teacher: {
    dashboard: true,
    learners: false,
    assessments: false,
    attendance: true,
    fees: false,
    library: false,
    inventory: true,
    communication: false,
    reports: false,
    timetable: true,
    settings: false,
  },
  lab_teacher: {
    dashboard: true,
    learners: false,
    assessments: false,
    attendance: true,
    fees: false,
    library: false,
    inventory: true,
    communication: false,
    reports: false,
    timetable: true,
    settings: false,
  },
  library_teacher: {
    dashboard: true,
    learners: false,
    assessments: false,
    attendance: true,
    fees: false,
    library: true,
    inventory: false,
    communication: false,
    reports: false,
    timetable: true,
    settings: false,
  },
  tools_inventory_teacher: {
    dashboard: true,
    learners: false,
    assessments: false,
    attendance: true,
    fees: false,
    library: false,
    inventory: true,
    communication: false,
    reports: false,
    timetable: true,
    settings: false,
  },
};

export const ROLE_DEFAULT_LANDING: Record<string, string> = {
  admin: '/system-management',
  dhoi: '/system-management',
  class_teacher: '/assessments',
  subject_teacher: '/assessments',
  ict_teacher: '/ict-lab',
  lab_teacher: '/ict-lab',
  library_teacher: '/library',
  tools_inventory_teacher: '/inventory',
};

export function getDefaultLandingPage(role: string): string {
  const norm = String(role || '').toLowerCase().trim();
  return ROLE_DEFAULT_LANDING[norm] || '/dashboard';
}

export function resolveRole(role: string): string {
  const norm = String(role || '').toLowerCase().trim();
  if (norm.includes('admin') || norm.includes('hoi') || norm.includes('owner') || norm.includes('super')) {
    return 'admin';
  }
  if (norm === 'dhoi') return 'dhoi';
  if (norm === 'class_teacher') return 'class_teacher';
  if (norm === 'subject_teacher') return 'subject_teacher';
  if (norm === 'ict_teacher') return 'ict_teacher';
  if (norm === 'lab_teacher') return 'lab_teacher';
  if (norm === 'library_teacher') return 'library_teacher';
  if (norm === 'tools_inventory_teacher') return 'tools_inventory_teacher';
  if (norm.includes('teacher')) return 'class_teacher';
  return norm || 'class_teacher';
}

export function roleHas(role: string, permissionKey: string): boolean {
  const resolved = resolveRole(role);
  if (resolved === 'admin') return true;
  const matrix = getPermissionsMatrix();
  const perms = matrix[resolved] || matrix[role];
  if (!perms) return true;
  return !!perms[permissionKey];
}

const STORAGE_KEY = 'munyaka_rbac_matrix';

export function getPermissionsMatrix(): Record<string, RolePermissions> {
  if (typeof window === 'undefined') return DEFAULT_ROLE_PERMISSIONS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_ROLE_PERMISSIONS, ...parsed };
      }
    }
  } catch (err) {
    console.error('Failed to load permissions matrix:', err);
  }
  return DEFAULT_ROLE_PERMISSIONS;
}

export function savePermissionsMatrix(matrix: Record<string, RolePermissions>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matrix));
    window.dispatchEvent(new Event('munyaka_rbac_updated'));
  } catch (err) {
    console.error('Failed to save permissions matrix:', err);
  }
}
