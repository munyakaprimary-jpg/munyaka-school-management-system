import { centralGetStaff, centralSaveStaff, verifyStaffLogin as centralVerifyStaffLogin } from '@/hooks/useCentralData';

export const STAFF_MASTER_KEY = 'munyaka_staff_v2';
export const STAFF_PREREG_KEY = 'munyaka_staff_prereg';

export interface StaffRecord {
  id: string;
  name: string;
  fullName?: string;
  role: string;
  category: 'Teaching' | 'Non-Teaching' | 'Support' | 'Admin' | string;
  status: 'Active' | 'Pre-Registered' | 'Archived' | 'Suspended' | string;
  email?: string;
  phone?: string;
  tscNumber?: string;
  employmentType?: 'Permanent' | 'Contract' | 'Intern' | string;
  schoolId?: string;
  dateJoined?: string;
  isArchived?: boolean;
  deletedAt?: string;
}

export interface CategorizedStaffMetrics {
  teaching: { active: number; pending: number; total: number };
  nonTeaching: { active: number; pending: number; total: number };
}

export function initializeStaffMaster(): void {
  // Handled centrally by db.ts & useCentralData
}

export function getStaffMaster(activeSchoolId?: string | null): StaffRecord[] {
  const staff = centralGetStaff();
  if (!activeSchoolId) return staff;
  return staff.filter((s: any) => !s.schoolId || s.schoolId === activeSchoolId);
}

export function saveStaffMaster(records: StaffRecord[]): void {
  centralSaveStaff(records);
}

export function addStaffRecord(record: Omit<StaffRecord, 'id'>): StaffRecord {
  const current = getStaffMaster();
  const newId = `MUNYAKA-STF-${Date.now().toString().slice(-4)}`;
  const newRecord: StaffRecord = {
    id: newId,
    status: 'Active',
    category: 'Teaching',
    dateJoined: new Date().toISOString().split('T')[0],
    ...record,
  };
  saveStaffMaster([newRecord, ...current]);
  return newRecord;
}

export function updateStaffRecord(id: string, updates: Partial<StaffRecord>): boolean {
  const current = getStaffMaster();
  let found = false;
  const updated = current.map((s) => {
    if (s.id === id) {
      found = true;
      return { ...s, ...updates };
    }
    return s;
  });
  if (found) {
    saveStaffMaster(updated);
  }
  return found;
}

export function deleteStaffRecord(id: string): boolean {
  const current = getStaffMaster();
  const filtered = current.filter((s) => s.id !== id);
  if (filtered.length !== current.length) {
    saveStaffMaster(filtered);
    return true;
  }
  return false;
}

export function getStaffMetrics(activeSchoolId?: string | null) {
  const staff = getStaffMaster(activeSchoolId);
  const active = staff.filter((s) => !s.isArchived && s.status !== 'Archived');
  const pending = staff.filter((s) => s.status === 'Pre-Registered' || s.status === 'Pending');

  return {
    total: staff.length,
    active: active.length,
    pending: pending.length,
  };
}

export function getCategorizedMetrics(activeSchoolId?: string | null): CategorizedStaffMetrics {
  const staff = getStaffMaster(activeSchoolId);
  
  let teachingActive = 0;
  let teachingPending = 0;
  let teachingTotal = 0;
  
  let nonTeachingActive = 0;
  let nonTeachingPending = 0;
  let nonTeachingTotal = 0;

  staff.forEach((s) => {
    const isTeacher = s.category === 'Teaching' || /teach|educator|principal|head teacher|ict/i.test(s.role || '');
    const isActive = !s.isArchived && s.status !== 'Archived';
    const isPending = s.status === 'Pre-Registered' || s.status === 'Pending';

    if (isTeacher) {
      teachingTotal++;
      if (isActive) teachingActive++;
      if (isPending) teachingPending++;
    } else {
      nonTeachingTotal++;
      if (isActive) nonTeachingActive++;
      if (isPending) nonTeachingPending++;
    }
  });

  return {
    teaching: { active: teachingActive, pending: teachingPending, total: teachingTotal },
    nonTeaching: { active: nonTeachingActive, pending: nonTeachingPending, total: nonTeachingTotal },
  };
}

export function getStaffMasterCount(activeSchoolId?: string | null): number {
  return getStaffMaster(activeSchoolId).length;
}

export function verifyStaffLogin(identifier: string, pass: string) {
  return centralVerifyStaffLogin(identifier, pass);
}

export function isTeachingRole(role?: string): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return r.includes('teach') || r.includes('educator') || r.includes('principal') || r.includes('ict');
}

export function addStaffMaster(record: any) {
  return addStaffRecord(record);
}

