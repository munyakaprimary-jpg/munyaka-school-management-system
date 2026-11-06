export interface RolePermissionMatrix {
  [roleId: string]: {
    [moduleId: string]: boolean;
  };
}

export const EXACT_RBAC_ROLES = [
  "HOI",
  "DHOI",
  "Class Teacher",
  "Subject Teacher",
  "ICT Teacher",
  "Library Teacher",
  "Lab Teacher",
  "Bursar",
  "Store Master"
] as const;

export const DEFAULT_RBAC_ROLES = [
  { id: 'HOI', name: 'HOI (Head of Institution / Principal)', description: 'Full institutional access (Admissions, CBC Assessments, Fees, Staff Management, System Settings, RBAC).' },
  { id: 'DHOI', name: 'DHOI (Deputy Head of Institution)', description: 'Full institutional access (Admissions, CBC Assessments, Fees, Staff Management, System Settings, RBAC).' },
  { id: 'Class Teacher', name: 'Class Teacher', description: 'Student Profiles (View), Attendance / Roll Call, Exam Marks & CBC Assessments, Homework.' },
  { id: 'Subject Teacher', name: 'Subject Teacher', description: 'Exam Marks & CBC Assessments, Subject Timetable.' },
  { id: 'ICT Teacher', name: 'ICT Teacher', description: 'ICT Lab & Digital Learning, Hardware Inventory, Server / System Maintenance, Basic Learner Info.' },
  { id: 'Library Teacher', name: 'Library Teacher', description: 'Library Catalog, E-Resources, Book Issuance/Returns, Basic Learner Info.' },
  { id: 'Lab Teacher', name: 'Lab Teacher', description: 'Science & Computer Lab Inventory, Experiment Schedules, Safety Records.' },
  { id: 'Bursar', name: 'Bursar', description: 'Fees & Financial Ledgers, Payment Receipts, Fee Statements, Expenses.' },
  { id: 'Store Master', name: 'Store Master', description: 'School Stores, Procurement, Inventory & Stock Ledgers.' },
];

export const RBAC_MODULES = [
  { id: 'dashboard', name: 'Dashboard & Overview' },
  { id: 'students', name: 'Student Profiles & Admissions' },
  { id: 'academics', name: 'Exam Marks & CBC Assessments' },
  { id: 'attendance', name: 'Attendance & Roll Call' },
  { id: 'homework', name: 'Homework & Assignments' },
  { id: 'timetable', name: 'Subject Timetable' },
  { id: 'fees', name: 'Fees & Financial Ledgers' },
  { id: 'library', name: 'Library Catalog & E-Resources' },
  { id: 'ict', name: 'ICT Lab & Hardware Inventory' },
  { id: 'science_lab', name: 'Science Lab Inventory & Safety' },
  { id: 'stores', name: 'School Stores & Procurement' },
  { id: 'staff', name: 'Staff Management' },
  { id: 'settings', name: 'System Settings & RBAC' },
];

export const DEFAULT_RBAC_MATRIX: RolePermissionMatrix = {
  HOI: {
    dashboard: true,
    students: true,
    academics: true,
    attendance: true,
    homework: true,
    timetable: true,
    fees: true,
    library: true,
    ict: true,
    science_lab: true,
    stores: true,
    staff: true,
    settings: true,
  },
  DHOI: {
    dashboard: true,
    students: true,
    academics: true,
    attendance: true,
    homework: true,
    timetable: true,
    fees: true,
    library: true,
    ict: true,
    science_lab: true,
    stores: true,
    staff: true,
    settings: true,
  },
  'Class Teacher': {
    dashboard: true,
    students: true,
    academics: true,
    attendance: true,
    homework: true,
    timetable: true,
    fees: false,
    library: false,
    ict: false,
    science_lab: false,
    stores: false,
    staff: false,
    settings: false,
  },
  'Subject Teacher': {
    dashboard: true,
    students: false,
    academics: true,
    attendance: false,
    homework: true,
    timetable: true,
    fees: false,
    library: false,
    ict: false,
    science_lab: false,
    stores: false,
    staff: false,
    settings: false,
  },
  'ICT Teacher': {
    dashboard: true,
    students: true,
    academics: false,
    attendance: false,
    homework: false,
    timetable: false,
    fees: false,
    library: false,
    ict: true,
    science_lab: false,
    stores: false,
    staff: false,
    settings: false,
  },
  'Library Teacher': {
    dashboard: true,
    students: true,
    academics: false,
    attendance: false,
    homework: false,
    timetable: false,
    fees: false,
    library: true,
    ict: false,
    science_lab: false,
    stores: false,
    staff: false,
    settings: false,
  },
  'Lab Teacher': {
    dashboard: true,
    students: false,
    academics: false,
    attendance: false,
    homework: false,
    timetable: false,
    fees: false,
    library: false,
    ict: false,
    science_lab: true,
    stores: false,
    staff: false,
    settings: false,
  },
  Bursar: {
    dashboard: true,
    students: false,
    academics: false,
    attendance: false,
    homework: false,
    timetable: false,
    fees: true,
    library: false,
    ict: false,
    science_lab: false,
    stores: false,
    staff: false,
    settings: false,
  },
  'Store Master': {
    dashboard: true,
    students: false,
    academics: false,
    attendance: false,
    homework: false,
    timetable: false,
    fees: false,
    library: false,
    ict: false,
    science_lab: false,
    stores: true,
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
  const normalizedRole = String(role || '').trim();
  
  // Exact lookup first
  if (matrix[normalizedRole] && typeof matrix[normalizedRole][moduleId] === 'boolean') {
    return matrix[normalizedRole][moduleId];
  }

  // Case-insensitive / alias mapping
  const lower = normalizedRole.toLowerCase();
  let canonicalKey = normalizedRole;
  if (lower === 'hoi' || lower.includes('principal') || lower.includes('head of institution')) canonicalKey = 'HOI';
  else if (lower === 'dhoi' || lower.includes('deputy')) canonicalKey = 'DHOI';
  else if (lower === 'class teacher' || lower === 'classteacher') canonicalKey = 'Class Teacher';
  else if (lower === 'subject teacher' || lower === 'subjectteacher') canonicalKey = 'Subject Teacher';
  else if (lower === 'ict teacher' || lower === 'ict' || lower.includes('technician')) canonicalKey = 'ICT Teacher';
  else if (lower === 'library teacher' || lower === 'librarian') canonicalKey = 'Library Teacher';
  else if (lower === 'lab teacher' || lower === 'lab' || lower.includes('science')) canonicalKey = 'Lab Teacher';
  else if (lower === 'bursar' || lower === 'accountant') canonicalKey = 'Bursar';
  else if (lower === 'store master' || lower === 'store' || lower.includes('procurement')) canonicalKey = 'Store Master';
  else if (lower.includes('admin') || lower.includes('owner') || lower === 'developer') return true;

  if (matrix[canonicalKey] && typeof matrix[canonicalKey][moduleId] === 'boolean') {
    return matrix[canonicalKey][moduleId];
  }

  // Admins / HOI get full access
  if (lower.includes('admin') || lower.includes('hoi') || lower.includes('owner')) {
    return true;
  }

  return false;
}
