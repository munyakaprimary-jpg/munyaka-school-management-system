import { pb } from '@/lib/pocketbase';

export interface StaffRecord {
  id: string;
  full_name: string;
  role: string;
  phone: string;
  email: string;
  tsc_number?: string;
  national_id?: string;
  department?: string;
  status: 'Active' | 'Inactive' | 'Pre-Registered';
  created: string;
  updated: string;
}

export interface CreateStaffData {
  full_name: string;
  role: string;
  phone: string;
  email: string;
  tsc_number?: string;
  national_id?: string;
  department?: string;
  status?: 'Active' | 'Inactive' | 'Pre-Registered';
}

export interface UpdateStaffData {
  full_name?: string;
  role?: string;
  phone?: string;
  email?: string;
  tsc_number?: string;
  national_id?: string;
  department?: string;
  status?: 'Active' | 'Inactive' | 'Pre-Registered';
}

export const staffService = {
  /**
   * Fetch all staff records from PocketBase
   */
  async getAllStaff(): Promise<StaffRecord[]> {
    try {
      const records = await pb.collection('staff').getFullList({
        sort: '-created',
        filter: ''
      });
      return records as unknown as StaffRecord[];
    } catch (error) {
      console.error('Error fetching staff:', error);
      // Return empty array if collection doesn't exist yet
      return [];
    }
  },

  /**
   * Create a new staff record
   */
  async createStaff(data: CreateStaffData): Promise<StaffRecord> {
    const record = await pb.collection('staff').create({
      full_name: data.full_name,
      role: data.role,
      phone: data.phone,
      email: data.email,
      tsc_number: data.tsc_number || '',
      national_id: data.national_id || '',
      department: data.department || 'School Administration',
      status: data.status || 'Active'
    });
    return record as unknown as StaffRecord;
  },

  /**
   * Update an existing staff record
   */
  async updateStaff(id: string, data: UpdateStaffData): Promise<StaffRecord> {
    const record = await pb.collection('staff').update(id, data);
    return record as unknown as StaffRecord;
  },

  /**
   * Delete a staff record
   */
  async deleteStaff(id: string): Promise<boolean> {
    try {
      await pb.collection('staff').delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting staff:', error);
      return false;
    }
  },

  /**
   * Subscribe to real-time changes
   */
  subscribeToChanges(callback: (data: StaffRecord) => void) {
    return pb.collection('staff').subscribe('*', (e) => {
      callback(e.record as unknown as StaffRecord);
    });
  }
};