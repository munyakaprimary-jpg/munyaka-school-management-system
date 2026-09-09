/**
 * Unified Staff Master Service & Persistent Storage Store
 * Manages school personnel records, TSC numbers, system roles, and status
 * for both Staff Directory and System Access Master.
 */

export interface MasterStaffRecord {
  id: string;
  name: string;
  nationalId: string;
  email: string;
  phone: string;
  tscNumber: string;
  staffId: string;
  role: string;
  systemRole: 'admin' | 'head_teacher' | 'teacher' | 'subject_teacher' | 'librarian' | 'accountant' | 'support_staff';
  department: string;
  status: 'Active' | 'Pre-Registered' | 'Inactive' | 'Suspended';
  datePreRegistered: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  tsc_number: string;
  staff_id: string;
  role: string;
  system_role: string;
  department: string;
  status: 'active' | 'inactive';
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export const STAFF_MASTER_KEY = 'munyaka_staff_directory';

const defaultStaff: MasterStaffRecord[] = [
  {
    id: 'staff-john-mwaura',
    name: 'John Mwaura',
    nationalId: '32891204',
    email: 'john.mwaura@munyaka.ac.ke',
    phone: '+254 712 345 678',
    tscNumber: 'TSC-889120',
    staffId: 'TSC-889120',
    role: 'Teacher',
    systemRole: 'teacher',
    department: 'Mathematics & Sciences',
    status: 'Active',
    datePreRegistered: new Date().toISOString(),
  },
  {
    id: 'staff-mary-wairimu',
    name: 'Mary Wairimu',
    nationalId: '29481920',
    email: 'mary.wairimu@munyaka.ac.ke',
    phone: '+254 722 987 654',
    tscNumber: 'TSC-774312',
    staffId: 'TSC-774312',
    role: 'Librarian',
    systemRole: 'librarian',
    department: 'Library & Information Services',
    status: 'Active',
    datePreRegistered: new Date().toISOString(),
  },
  {
    id: 'staff-admin-main',
    name: 'Admin Munyaka',
    nationalId: '21093847',
    email: 'admin@munyaka.ac.ke',
    phone: '+254 700 111 222',
    tscNumber: 'TSC-110293',
    staffId: 'TSC-110293',
    role: 'Administrator',
    systemRole: 'admin',
    department: 'Administration',
    status: 'Active',
    datePreRegistered: new Date().toISOString(),
  },
];

export const initializeStaffMaster = (): MasterStaffRecord[] => {
  try {
    const raw = localStorage.getItem(STAFF_MASTER_KEY);
    if (!raw) {
      localStorage.setItem(STAFF_MASTER_KEY, JSON.stringify(defaultStaff));
      return defaultStaff;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STAFF_MASTER_KEY, JSON.stringify(defaultStaff));
      return defaultStaff;
    }
    return parsed;
  } catch (err) {
    console.error('Error initializing staff master:', err);
    return defaultStaff;
  }
};

export const getStaffMaster = (): MasterStaffRecord[] => {
  return initializeStaffMaster();
};

export const saveStaffMaster = (records: MasterStaffRecord[]): void => {
  try {
    localStorage.setItem(STAFF_MASTER_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving staff master to storage:', err);
  }
};

export const isTeachingRole = (role?: string): boolean => {
  if (!role) return false;
  const lower = role.toLowerCase();
  return lower.includes('teacher') || lower.includes('tutor') || lower.includes('head_teacher');
};

export const getCategorizedMetrics = () => {
  const staff = getStaffMaster();
  return {
    total: staff.length,
    active: staff.filter(s => s.status === 'Active').length,
    teachers: staff.filter(s => isTeachingRole(s.systemRole || s.role)).length,
    support: staff.filter(s => !isTeachingRole(s.systemRole || s.role)).length,
  };
};

const mapMasterToStaffMember = (record: MasterStaffRecord): StaffMember => ({
  id: record.id,
  name: record.name,
  email: record.email || '',
  phone: record.phone || '',
  tsc_number: record.tscNumber || record.staffId || '',
  staff_id: record.staffId || record.tscNumber || '',
  role: record.role || 'teacher',
  system_role: record.systemRole || 'teacher',
  department: record.department || 'Academics',
  status: (record.status || '').toLowerCase() === 'active' ? 'active' : 'inactive',
  avatar: '',
  created_at: record.datePreRegistered || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const addStaffMaster = (record: Omit<MasterStaffRecord, 'id' | 'datePreRegistered'>): MasterStaffRecord => {
  const records = getStaffMaster();
  const newRecord: MasterStaffRecord = {
    ...record,
    id: `staff-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    datePreRegistered: new Date().toISOString(),
  };
  records.unshift(newRecord);
  saveStaffMaster(records);
  return newRecord;
};

export const updateStaffMaster = (id: string, updates: Partial<MasterStaffRecord>): MasterStaffRecord | null => {
  const records = getStaffMaster();
  let updatedRecord: MasterStaffRecord | null = null;
  const next = records.map((r) => {
    if (r.id === id) {
      updatedRecord = { ...r, ...updates };
      return updatedRecord;
    }
    return r;
  });
  if (updatedRecord) {
    saveStaffMaster(next);
  }
  return updatedRecord;
};

export const deleteStaffMaster = (id: string): boolean => {
  const records = getStaffMaster();
  const filtered = records.filter((r) => r.id !== id);
  if (filtered.length === records.length) return false;
  saveStaffMaster(filtered);
  return true;
};

export const activateStaffMaster = (id: string): MasterStaffRecord | null => {
  return updateStaffMaster(id, { status: 'Active' });
};

export const staffMasterService = {
  async getAllStaff(): Promise<StaffMember[]> {
    const records = getStaffMaster();
    return records.map(mapMasterToStaffMember);
  },

  async addStaff(member: Omit<StaffMember, 'id' | 'created_at' | 'updated_at'>): Promise<StaffMember> {
    const created = addStaffMaster({
      name: member.name,
      nationalId: member.tsc_number || `ID-${Math.floor(100000 + Math.random() * 900000)}`,
      email: member.email,
      phone: member.phone,
      tscNumber: member.tsc_number,
      staffId: member.tsc_number,
      role: member.role,
      systemRole: (member.system_role as any) || 'teacher',
      department: member.department,
      status: member.status === 'active' ? 'Active' : 'Inactive',
    });
    return mapMasterToStaffMember(created);
  },

  async updateStaff(id: string, updates: Partial<StaffMember>): Promise<StaffMember> {
    const patch: any = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.email !== undefined) patch.email = updates.email;
    if (updates.phone !== undefined) patch.phone = updates.phone;
    if (updates.tsc_number !== undefined) {
      patch.tscNumber = updates.tsc_number;
      patch.staffId = updates.tsc_number;
    }
    if (updates.role !== undefined) patch.role = updates.role;
    if (updates.system_role !== undefined) patch.systemRole = updates.system_role;
    if (updates.department !== undefined) patch.department = updates.department;
    if (updates.status !== undefined) patch.status = updates.status === 'active' ? 'Active' : 'Inactive';

    const updated = updateStaffMaster(id, patch);
    if (!updated) throw new Error('Staff member not found');
    return mapMasterToStaffMember(updated);
  },

  async deleteStaff(id: string): Promise<void> {
    const success = deleteStaffMaster(id);
    if (!success) throw new Error('Failed to delete staff member');
  },
};

