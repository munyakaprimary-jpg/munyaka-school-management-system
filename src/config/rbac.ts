export interface RolePermissionMatrix {
  [roleId: string]: {
    [moduleId: string]: boolean;
  };
}

export const DEFAULT_RBAC_ROLES = [
  { id: 'admin', name: 'Administrator / Owner', description: 'Full system access across all modules' },
  { id: 'class_teacher', name: 'Class Teacher', description: 'Attendance, Marks Entry, Assigned Class Learner Directory' },
  { id: 'ict_teacher', name: 'ICT Teacher', description: 'ICT Lab, Hardware Inventory, Digital Learning Support' },
  { id: 'library_teacher', name: 'Library Teacher', description: 'Library Catalog, Book Issuance & Returns, Media Center' },
  { id: 'accountant', name: 'Accountant / Bursar', description: 'Fees & Financial Ledgers, Payment Receipts, Fee Statements' },
];

export const RBAC_MODULES = [
  { id: 'dashboard', name: 'Dashboard & Overview' },
  { id: 'students', name: 'Student Admissions & Profiles' },
  { id: 'academics', name: 'Timetable & CBC Assessments' },
  { id: 'fees', name: 'Fees & Financial Ledgers' },
  { id: 'library', name: 'Library & E-Resources' },
  { id: 'ict', name: 'ICT Lab & Hardware Inventory' },
  { id: 'staff', name: 'Staff Directory & HR' },
  { id: 'settings', name: 'System Settings & RBAC' },
];

export const DEFAULT_RBAC_MATRIX: RolePermissionMatrix = {
  admin: {
    dashboard: true,
    students: true,
    academics: true,
    fees: true,
    library: true,
    ict: true,
    staff: true,
    settings: true,
  },
  class_teacher: {
    dashboard: true,
    students: true,
    academics: true,
    fees: false,
    library: false,
    ict: false,
    staff: false,
    settings: false,
  },
  ict_teacher: {
    dashboard: true,
    students: true,
    academics: false,
    fees: false,
    library: false,
    ict: true,
    staff: false,
    settings: false,
  },
  library_teacher: {
    dashboard: true,
    students: true,
    academics: false,
    fees: false,
    library: true,
    ict: false,
    staff: false,
    settings: false,
  },
  accountant: {
    dashboard: true,
    students: true,
    academics: false,
    fees: true,
    library: false,
    ict: false,
    staff: false,
    settings: false,
  },
};

export const RBAC_STORAGE_KEY = 'munyaka_rbac_matrix';

export function getRbacMatrix(): RolePermissionMatrix {
  try {
    const raw = localStorage.getItem(RBAC_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_RBAC_MATRIX, ...parsed };
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_RBAC_MATRIX;
}

export function hasPermission(role: string, moduleId: string): boolean {
  const matrix = getRbacMatrix();
  const normalizedRole = String(role || '').toLowerCase().trim();
  
  // Map variant role names to canonical keys
  let canonicalRole = normalizedRole;
  if (normalizedRole.includes('admin') || normalizedRole.includes('owner')) canonicalRole = 'admin';
  else if (normalizedRole.includes('library') || normalizedRole.includes('librarian')) canonicalRole = 'library_teacher';
  else if (normalizedRole.includes('ict') || normalizedRole.includes('tech')) canonicalRole = 'ict_teacher';
  else if (normalizedRole.includes('accountant') || normalizedRole.includes('bursar')) canonicalRole = 'accountant';
  else if (normalizedRole.includes('teacher') || normalizedRole.includes('class')) canonicalRole = 'class_teacher';

  const rolePerms = matrix[canonicalRole] || matrix[normalizedRole];
  if (rolePerms && typeof rolePerms[moduleId] === 'boolean') {
    return rolePerms[moduleId];
  }
  // Default fallback for admin
  if (canonicalRole === 'admin') return true;
  return false;
}
