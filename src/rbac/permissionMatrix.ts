export interface RolePermissions {
  dashboard: boolean;
  learners: boolean;
  assessments: boolean;
  fees: boolean;
  library: boolean;
  inventory: boolean;
  communication: boolean;
  settings: boolean;
  [key: string]: boolean;
}

export const ROLES = ['ADMIN', 'DHOI', 'CLASS_TEACHER', 'SUBJECT_TEACHER', 'ICT_TEACHER', 'LAB_TEACHER', 'LIBRARY_TEACHER', 'TOOLS_INVENTORY_TEACHER'] as const;

export const PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard & Overview' },
  { key: 'learners', label: 'Student Admissions & Profiles' },
  { key: 'assessments', label: 'CBC Marks & Roll Call / Attendance' },
  { key: 'fees', label: 'Fees & Financial Ledgers' },
  { key: 'library', label: 'Library & E-Resources' },
  { key: 'inventory', label: 'ICT Lab & Hardware Inventory' },
  { key: 'communication', label: 'Communication & SMS' },
  { key: 'settings', label: 'Settings & Security' },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  ADMIN: {
    dashboard: true,
    learners: true,
    assessments: true,
    fees: true,
    library: true,
    inventory: true,
    communication: true,
    settings: true,
  },
  DHOI: {
    dashboard: true,
    learners: true,
    assessments: true,
    fees: true,
    library: true,
    inventory: true,
    communication: true,
    settings: false,
  },
  CLASS_TEACHER: {
    dashboard: false,
    learners: true,
    assessments: true,
    fees: false,
    library: true,
    inventory: false,
    communication: false,
    settings: false,
  },
  SUBJECT_TEACHER: {
    dashboard: false,
    learners: true,
    assessments: true,
    fees: false,
    library: true,
    inventory: false,
    communication: false,
    settings: false,
  },
  ICT_TEACHER: {
    dashboard: false,
    learners: true,
    assessments: false,
    fees: false,
    library: false,
    inventory: true,
    communication: false,
    settings: false,
  },
  LAB_TEACHER: {
    dashboard: false,
    learners: false,
    assessments: true,
    fees: false,
    library: false,
    inventory: true,
    communication: false,
    settings: false,
  },
  LIBRARY_TEACHER: {
    dashboard: false,
    learners: false,
    assessments: false,
    fees: false,
    library: true,
    inventory: false,
    communication: false,
    settings: false,
  },
  TOOLS_INVENTORY_TEACHER: {
    dashboard: false,
    learners: false,
    assessments: false,
    fees: false,
    library: false,
    inventory: true,
    communication: false,
    settings: false,
  },
};

export const ROLE_DEFAULT_LANDING: Record<string, string> = {
  ADMIN: '/dashboard',
  DHOI: '/dashboard',
  CLASS_TEACHER: '/assessments',
  SUBJECT_TEACHER: '/assessments',
  ICT_TEACHER: '/inventory',
  LAB_TEACHER: '/assessments',
  LIBRARY_TEACHER: '/library',
  TOOLS_INVENTORY_TEACHER: '/inventory',
};

export function getDefaultLandingPage(role: string): string {
  const norm = String(role || '').toUpperCase().trim();
  return ROLE_DEFAULT_LANDING[norm] || '/dashboard';
}

export function resolveRole(role: string): string {
  const norm = String(role || '').toUpperCase().trim();
  const lower = String(role || '').toLowerCase().trim();
  if (norm.includes('ADMIN') || norm.includes('HOI') || norm.includes('OWNER') || norm.includes('SUPER') || lower === 'admin') {
    return 'ADMIN';
  }
  if (lower === 'dhoi') return 'DHOI';
  if (lower === 'class_teacher') return 'CLASS_TEACHER';
  if (lower === 'subject_teacher') return 'SUBJECT_TEACHER';
  if (lower === 'ict_teacher') return 'ICT_TEACHER';
  if (lower === 'lab_teacher') return 'LAB_TEACHER';
  if (lower === 'library_teacher') return 'LIBRARY_TEACHER';
  if (lower === 'tools_inventory_teacher') return 'TOOLS_INVENTORY_TEACHER';
  if (lower.includes('teacher') || norm.includes('TEACHER')) return 'CLASS_TEACHER';
  return norm || 'CLASS_TEACHER';
}

export function roleHas(role: string, permissionKey: string): boolean {
  const resolved = resolveRole(role);
  if (resolved === 'ADMIN') return true;
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
      return JSON.parse(saved);
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
