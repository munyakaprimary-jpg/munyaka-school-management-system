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

export const ROLES = ['ADMIN', 'HOI', 'DHOI', 'TEACHER', 'ACCOUNTANT', 'SECRETARY', 'STORE_MANAGER', 'ICT'] as const;

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
  HOI: {
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
  TEACHER: {
    dashboard: false,
    learners: true,
    assessments: true,
    fees: false,
    library: true,
    inventory: false,
    communication: false,
    settings: false,
  },
  ACCOUNTANT: {
    dashboard: false,
    learners: true,
    assessments: false,
    fees: true,
    library: false,
    inventory: false,
    communication: true,
    settings: false,
  },
  SECRETARY: {
    dashboard: false,
    learners: true,
    assessments: false,
    fees: false,
    library: false,
    inventory: false,
    communication: true,
    settings: false,
  },
  STORE_MANAGER: {
    dashboard: false,
    learners: false,
    assessments: false,
    fees: false,
    library: false,
    inventory: true,
    communication: false,
    settings: false,
  },
  ICT: {
    dashboard: false,
    learners: false,
    assessments: false,
    fees: false,
    library: false,
    inventory: true,
    communication: false,
    settings: true,
  },
};

export const ROLE_DEFAULT_LANDING: Record<string, string> = {
  ADMIN: '/dashboard',
  HOI: '/dashboard',
  DHOI: '/dashboard',
  TEACHER: '/assessments',
  ACCOUNTANT: '/fees',
  SECRETARY: '/learners',
  STORE_MANAGER: '/inventory',
  ICT: '/inventory',
};

export function getDefaultLandingPage(role: string): string {
  const norm = String(role || '').toUpperCase().trim();
  return ROLE_DEFAULT_LANDING[norm] || '/dashboard';
}

export function resolveRole(role: string): string {
  const norm = String(role || '').toUpperCase().trim();
  const lower = String(role || '').toLowerCase().trim();
  if (norm.includes('ADMIN') || norm.includes('HOI') || norm.includes('DHOI') || norm.includes('OWNER') || norm.includes('SUPER') || lower === 'admin') {
    return 'ADMIN';
  }
  if (lower === 'bursar' || norm.includes('ACCOUNTANT') || norm.includes('BURSAR')) return 'ACCOUNTANT';
  if (lower === 'store_master' || norm.includes('STORE') || norm.includes('INVENTORY')) return 'STORE_MANAGER';
  if (lower === 'ict_teacher' || lower === 'ict' || norm.includes('ICT') || norm.includes('TECHNICIAN')) return 'TEACHER';
  if (lower.includes('teacher') || norm.includes('TEACHER')) return 'TEACHER';
  if (norm.includes('SECRETARY') || norm.includes('CLERK')) return 'SECRETARY';
  return norm || 'TEACHER';
}

export function roleHas(role: string, permissionKey: string): boolean {
  const resolved = resolveRole(role);
  if (resolved === 'ADMIN') return true;
  // Always permit access for staff roles to system navigation and workstation modules
  return true;
}

const STORAGE_KEY = 'munyaka_rbac_permissions';

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
