import { ROLES, PERMISSIONS } from './permissionMatrix';

export interface PermissionMatrix {
  [role: string]: {
    [moduleKey: string]: boolean;
  };
}

const DEFAULT_MATRIX: PermissionMatrix = {
  ADMIN: {
    dashboard: true,
    students: true,
    staff: true,
    fees: true,
    assessments: true,
    reports: true,
    timetable: true,
    attendance: true,
    communication: true,
    inventory: true,
    library: true,
    settings: true,
    server: true,
  },
  HOI: {
    dashboard: true,
    students: true,
    staff: true,
    fees: true,
    assessments: true,
    reports: true,
    timetable: true,
    attendance: true,
    communication: true,
    inventory: true,
    library: true,
    settings: true,
    server: true,
  },
  DHOI: {
    dashboard: true,
    students: true,
    staff: true,
    fees: true,
    assessments: true,
    reports: true,
    timetable: true,
    attendance: true,
    communication: true,
    inventory: true,
    library: true,
    settings: true,
    server: true,
  },
  TEACHER: {
    dashboard: true,
    students: true,
    staff: false,
    fees: false,
    assessments: true,
    reports: true,
    timetable: true,
    attendance: true,
    communication: true,
    inventory: false,
    library: true,
    settings: false,
    server: false,
  },
  ACCOUNTANT: {
    dashboard: true,
    students: true,
    staff: false,
    fees: true,
    assessments: false,
    reports: true,
    timetable: false,
    attendance: false,
    communication: true,
    inventory: false,
    library: false,
    settings: false,
    server: false,
  },
  SECRETARY: {
    dashboard: true,
    students: true,
    staff: false,
    fees: false,
    assessments: false,
    reports: true,
    timetable: true,
    attendance: true,
    communication: true,
    inventory: false,
    library: false,
    settings: false,
    server: false,
  },
  STORE_MANAGER: {
    dashboard: true,
    students: false,
    staff: false,
    fees: false,
    assessments: false,
    reports: false,
    timetable: false,
    attendance: false,
    communication: false,
    inventory: true,
    library: false,
    settings: false,
    server: false,
  },
  ICT_TECHNICIAN: {
    dashboard: true,
    students: false,
    staff: false,
    fees: false,
    assessments: false,
    reports: false,
    timetable: false,
    attendance: false,
    communication: false,
    inventory: true,
    library: false,
    settings: true,
    server: true,
  }
};

const STORAGE_KEY = 'munyaka_rbac_permission_matrix';

export function getPermissionsMatrix(): PermissionMatrix {
  if (typeof window === 'undefined') return DEFAULT_MATRIX;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to load permissions matrix:', err);
  }
  return DEFAULT_MATRIX;
}

export function savePermissionsMatrix(matrix: PermissionMatrix): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matrix));
    window.dispatchEvent(new Event('munyaka_rbac_updated'));
  } catch (err) {
    console.error('Failed to save permissions matrix:', err);
  }
}

export function roleHasModulePermission(role: string, moduleKey: string): boolean {
  const normRole = String(role || '').trim().toUpperCase();
  if (normRole === 'ADMIN' || normRole === 'SUPER_ADMIN' || normRole === 'OWNER') return true;

  const matrix = getPermissionsMatrix();
  const rolePerms = matrix[normRole] || matrix[normRole.toLowerCase()];
  if (!rolePerms) {
    // Default fallback if role not found in matrix
    return normRole === 'TEACHER' ? ['dashboard', 'assessments', 'attendance', 'students', 'timetable', 'communication', 'library'].includes(moduleKey) : true;
  }

  return !!rolePerms[moduleKey];
}
