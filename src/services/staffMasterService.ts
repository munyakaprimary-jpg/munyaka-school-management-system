/**
 * Compatibility wrapper for components referencing staff master records.
 * Uses central storage drivers via `useCentralData.ts` and `db.ts`.
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

export function broadcastStaffMasterChange(): void {
  try {
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key: 'munyaka_staff_v3' } }));
  } catch {}
}
