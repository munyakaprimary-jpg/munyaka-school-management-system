import { initialSeedData } from '@/data/initialSeedData';

export interface StaffMember {
  id: string;
  name: string;
  fullName?: string;
  role?: string;
  type?: string;
  category?: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  status?: string;
  tscNumber?: string;
  idNumber?: string;
  isArchived?: boolean;
  [key: string]: unknown;
}

const STAFF_STORAGE_KEYS = [
  'munyaka_staff_v2',
  'munyaka_staff_directory',
  'munyaka_staff',
  'school_staff',
  'staff_records'
];

export const staffService = {
  /**
   * Get all staff records, guaranteed to fall back to initialSeedData if empty.
   */
  getStaff(): StaffMember[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return (initialSeedData.staff as StaffMember[]) || [];
    }

    try {
      for (const key of STAFF_STORAGE_KEYS) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            // Filter out unnamed placeholder staff permanently
            const cleaned = parsed.filter((s: any) => {
              const name = String(s.name || s.fullName || '').trim().toLowerCase();
              const sId = String(s.id || '').trim();
              if (name === 'unnamed staff' || name === '' || sId === 'MUNYAKA-3304') {
                return false;
              }
              return true;
            });

            // Update storage to permanently purge unnamed records
            localStorage.setItem(key, JSON.stringify(cleaned));
            if (cleaned.length > 0 || parsed.length > 0) {
              return cleaned;
            }
          }
        }
      }

      // Fallback to initial seed data, also filtering out unnamed staff
      const seed = ((initialSeedData.staff as StaffMember[]) || []).filter((s: any) => {
        const name = String(s.name || s.fullName || '').trim().toLowerCase();
        const sId = String(s.id || '').trim();
        return name !== 'unnamed staff' && name !== '' && sId !== 'MUNYAKA-3304';
      });

      if (seed.length > 0) {
        localStorage.setItem('munyaka_staff_v2', JSON.stringify(seed));
        localStorage.setItem('munyaka_staff_directory', JSON.stringify(seed));
      }
      return seed;
    } catch (err) {
      console.error('[StaffService] Error loading staff:', err);
      return [];
    }
  },

  /**
   * Save or update the entire staff array and notify subscribers.
   */
  saveStaff(staff: StaffMember[]): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem('munyaka_staff_v2', JSON.stringify(staff));
      localStorage.setItem('munyaka_staff_directory', JSON.stringify(staff));
      localStorage.setItem('munyaka_staff', JSON.stringify(staff));
      window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { type: 'staff' } }));
    } catch (err) {
      console.error('[StaffService] Error saving staff:', err);
    }
  },

  /**
   * Add a new staff member
   */
  addStaffMember(member: Omit<StaffMember, 'id'> & { id?: string }): StaffMember {
    const current = this.getStaff();
    const newMember: StaffMember = {
      id: member.id || `staff-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      status: 'Active',
      ...member,
    };
    const updated = [newMember, ...current];
    this.saveStaff(updated);
    return newMember;
  },

  /**
   * Update an existing staff member
   */
  updateStaffMember(id: string, patch: Partial<StaffMember>): StaffMember | null {
    const current = this.getStaff();
    let updatedMember: StaffMember | null = null;
    const updated = current.map((s) => {
      if (s.id === id || (s as any).staffId === id) {
        updatedMember = { ...s, ...patch };
        return updatedMember;
      }
      return s;
    });
    if (updatedMember) {
      this.saveStaff(updated);
    }
    return updatedMember;
  },

  /**
   * Delete a staff member
   */
  deleteStaffMember(id: string): boolean {
    const current = this.getStaff();
    const filtered = current.filter((s) => s.id !== id && (s as any).staffId !== id);
    if (filtered.length !== current.length) {
      this.saveStaff(filtered);
      return true;
    }
    return false;
  },

  /**
   * Get calculated statistics derived directly from current staff records
   */
  getStaffStats() {
    const staff = this.getStaff();
    const teaching = staff.filter((s) => {
      const roleStr = `${s.role || ''} ${s.type || ''} ${s.category || ''} ${s.position || ''} ${s.department || ''}`.toLowerCase();
      return roleStr.includes('teach') || roleStr.includes('educator');
    });

    const nonTeaching = staff.filter((s) => {
      const roleStr = `${s.role || ''} ${s.type || ''} ${s.category || ''} ${s.position || ''} ${s.department || ''}`.toLowerCase();
      return !roleStr.includes('teach') && !roleStr.includes('educator');
    });

    const active = staff.filter((s) => !s.isArchived && String(s.status || '').toLowerCase() !== 'archived');

    return {
      total: staff.length,
      teachingCount: teaching.length,
      nonTeachingCount: nonTeaching.length,
      activeCount: active.length,
    };
  }
};

export default staffService;
