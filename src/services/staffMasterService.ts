/**
 * Dedicated Compatibility Bridge Service (`staffMasterService.ts`)
 * Restores all legacy staff master functions as clean pass-through wrappers
 * pointing to central storage / useCentralData helpers.
 */

import { centralGetStaff, centralSaveStaff } from '@/hooks/useCentralData';

export interface MasterStaffRecord {
  id: string;
  name: string;
  fullName?: string;
  nationalId?: string;
  tscNumber?: string;
  email?: string;
  phone?: string;
  systemRole?: string;
  role?: string;
  category?: string;
  assignedSubjects?: string[];
  status?: string;
  isArchived?: boolean;
}

export function getStaffMaster(): MasterStaffRecord[] {
  try {
    const list = centralGetStaff();
    return (Array.isArray(list) ? list : []).map((s: any) => ({
      id: s.id || `T00${Math.floor(Math.random() * 900) + 100}`,
      name: s.name || s.fullName || 'Staff Member',
      fullName: s.name || s.fullName || 'Staff Member',
      nationalId: s.nationalId || '',
      tscNumber: s.tscNumber || '',
      email: s.email || '',
      phone: s.phone || '',
      systemRole: s.systemRole || s.role || 'subject_teacher',
      role: s.role || 'Teacher',
      category: s.category || 'Teaching',
      assignedSubjects: s.assignedSubjects || s.subjects || [],
      status: s.status || 'Active',
      isArchived: !!s.isArchived,
    }));
  } catch {
    return [];
  }
}

export function saveStaffMaster(records: MasterStaffRecord[]): void {
  try {
    centralSaveStaff(records as any[]);
  } catch {}
}

export function addStaffRecord(record: any): any {
  try {
    const list = centralGetStaff();
    const newRecord = {
      id: record.id || `T00${Math.floor(Math.random() * 900) + 100}`,
      name: record.name || record.fullName || 'Staff Member',
      fullName: record.name || record.fullName || 'Staff Member',
      nationalId: record.nationalId || '',
      tscNumber: record.tscNumber || '',
      email: record.email || '',
      phone: record.phone || '',
      systemRole: record.systemRole || record.role || 'subject_teacher',
      role: record.role || 'Teacher',
      category: record.category || 'Teaching',
      assignedSubjects: record.assignedSubjects || record.subjects || [],
      status: record.status || 'Active',
      isArchived: false,
      ...record,
    };
    centralSaveStaff([newRecord, ...list]);
    broadcastStaffMasterChange();
    return newRecord;
  } catch (err) {
    console.error('[addStaffRecord] error:', err);
    return null;
  }
}

export function updateStaffRecord(id: string, updates: any): void {
  try {
    const list = centralGetStaff();
    const updated = (Array.isArray(list) ? list : []).map((s: any) => {
      if (s && s.id === id) {
        return { ...s, ...updates };
      }
      return s;
    });
    centralSaveStaff(updated);
    broadcastStaffMasterChange();
  } catch (err) {
    console.error('[updateStaffRecord] error:', err);
  }
}

export function deleteStaffRecord(id: string): void {
  try {
    const list = centralGetStaff();
    const filtered = (Array.isArray(list) ? list : []).filter((s: any) => s && s.id !== id);
    centralSaveStaff(filtered);
    broadcastStaffMasterChange();
  } catch (err) {
    console.error('[deleteStaffRecord] error:', err);
  }
}

export function broadcastStaffMasterChange(): void {
  try {
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key: 'munyaka_staff_v3' } }));
  } catch {}
}

const staffMasterService = {
  getStaffMaster,
  saveStaffMaster,
  addStaffRecord,
  updateStaffRecord,
  deleteStaffRecord,
  broadcastStaffMasterChange,
};

export default staffMasterService;
