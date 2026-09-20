/**
 * staffMasterService.ts — Unified fallback adapter for legacy staffMasterService imports
 * Routes all queries and mutations through CentralDataService and unified persistent storage.
 */

import { CentralDataService, STORAGE_KEYS } from './centralDataService';

export const STAFF_MASTER_KEY = STORAGE_KEYS.STAFF;

export type MasterSystemRole =
  | 'head_teacher'
  | 'senior_teacher'
  | 'class_teacher'
  | 'subject_teacher'
  | 'bursar'
  | 'librarian'
  | 'storekeeper'
  | 'lab_assistant'
  | 'ict_technician'
  | 'support_staff'
  | 'support_admin';

export interface MasterStaffRecord {
  id: string;
  name: string;
  nationalId: string;
  email: string;
  phone: string;
  tscNumber?: string;
  role: string;
  systemRole: MasterSystemRole;
  department: string;
  assignedGrade?: string;
  assignedStream?: string;
  assignedSubjects?: string[];
  status: 'Active' | 'Pre-Registered' | 'Suspended';
  staffId?: string;
  tempAccessCode?: string;
  joinedDate?: string;
}

export const TEACHING_SYSTEM_ROLES: MasterSystemRole[] = [
  'head_teacher',
  'senior_teacher',
  'class_teacher',
  'subject_teacher',
];

export const isNonTeachingDesignation = (role: string): boolean => {
  const r = (role || '').toLowerCase();
  return r.includes('librarian') || r.includes('bursar') || r.includes('store') || r.includes('lab') || r.includes('ict') || r.includes('support');
};

export const isLibrarianDesignation = (role: string): boolean => {
  return (role || '').toLowerCase().includes('librarian');
};

export const mapDesignationToSystemRole = (role: string): MasterSystemRole => {
  const r = (role || '').toLowerCase();
  if (r.includes('head')) return 'head_teacher';
  if (r.includes('senior')) return 'senior_teacher';
  if (r.includes('class')) return 'class_teacher';
  if (r.includes('librarian')) return 'librarian';
  if (r.includes('bursar') || r.includes('account')) return 'bursar';
  if (r.includes('store')) return 'storekeeper';
  if (r.includes('lab')) return 'lab_assistant';
  if (r.includes('ict')) return 'ict_technician';
  return 'subject_teacher';
};

export const initializeStaffMaster = (): void => {};

export const getStaffMaster = (): MasterStaffRecord[] => {
  if (localStorage.getItem('munyaka_staff_cleared_explicitly') === 'true') {
    return [];
  }
  const staff = CentralDataService.getStaff();
  return staff as unknown as MasterStaffRecord[];
};

export const getStaffMasterCount = (): number => getStaffMaster().length;

export const getStaffMetrics = (_schoolId?: string | null) => {
  const staff = getStaffMaster();
  const total = staff.length;
  const active = staff.filter(s => s.status === 'Active').length;
  const pending = staff.filter(s => s.status !== 'Active').length;
  return { total, active, pending };
};

export const getCategorizedMetrics = (_schoolId?: string | null) => {
  const staff = getStaffMaster();
  const teaching = staff.filter(s => TEACHING_SYSTEM_ROLES.includes(s.systemRole)).length;
  const nonTeaching = staff.length - teaching;
  return { teaching, nonTeaching };
};

export const addStaffMaster = (record: Omit<MasterStaffRecord, 'id' | 'staffId' | 'tempAccessCode' | 'joinedDate'>): MasterStaffRecord => {
  localStorage.removeItem('munyaka_staff_cleared_explicitly');
  const staff = getStaffMaster();
  const id = `staff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const staffId = `MUN-${Math.floor(1000 + Math.random() * 9000)}`;
  const tempAccessCode = String(Math.floor(100000 + Math.random() * 900000));
  const joinedDate = new Date().toISOString().slice(0, 10);

  const newRecord: MasterStaffRecord = {
    ...record,
    id,
    staffId,
    tempAccessCode,
    joinedDate,
    status: record.status || 'Pre-Registered',
  };

  staff.push(newRecord);
  CentralDataService.saveStaff(staff as any);
  window.dispatchEvent(new Event('staff-changed'));
  window.dispatchEvent(new Event('munyaka:staff-directory-changed'));
  window.dispatchEvent(new Event('munyaka:data-changed'));
  return newRecord;
};

export const updateStaffMaster = (id: string, updates: Partial<MasterStaffRecord>): void => {
  const staff = getStaffMaster();
  const index = staff.findIndex(s => s.id === id);
  if (index !== -1) {
    staff[index] = { ...staff[index], ...updates };
    CentralDataService.saveStaff(staff as any);
    window.dispatchEvent(new Event('staff-changed'));
    window.dispatchEvent(new Event('munyaka:staff-directory-changed'));
    window.dispatchEvent(new Event('munyaka:data-changed'));
  }
};

export const activateStaffMaster = (id: string): void => {
  updateStaffMaster(id, { status: 'Active' });
};

export const bulkActivateStaffMaster = (ids: string[]): void => {
  const staff = getStaffMaster();
  let changed = false;
  staff.forEach(s => {
    if (ids.includes(s.id)) {
      s.status = 'Active';
      changed = true;
    }
  });
  if (changed) {
    CentralDataService.saveStaff(staff as any);
    window.dispatchEvent(new Event('staff-changed'));
    window.dispatchEvent(new Event('munyaka:staff-directory-changed'));
    window.dispatchEvent(new Event('munyaka:data-changed'));
  }
};

export const verifyStaffLogin = (_identifier: string, _pass: string) => null;
export const isTeachingRole = (_role: string) => true;
