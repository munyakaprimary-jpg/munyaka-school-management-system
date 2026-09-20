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
      // 1. Check if ANY staff storage key has data
      for (const key of STAFF_STORAGE_KEYS) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Clean unnamed placeholder records
              const cleaned = parsed.filter((s: any) => {
                const name = String(s.name || s.fullName || '').trim().toLowerCase();
                const sId = String(s.id || '').trim();
                if (name === 'unnamed staff' || name === '' || sId === 'MUNYAKA-3304') {
                  return false;
                }
                return true;
              });

              if (cleaned.length > 0) {
                // Also ensure munyaka_staff_directory and munyaka_staff_v2 are synchronized
                localStorage.setItem('munyaka_staff_v2', JSON.stringify(cleaned));
                localStorage.setItem('munyaka_staff_directory', JSON.stringify(cleaned));
                return cleaned;
              }
            }
          } catch {
            // parse error, continue
          }
        }
      }

      // 2. If no populated staff key exists, initialize and persist from initialSeedData.staff
      const seed = ((initialSeedData.staff as StaffMember[]) || []).filter((s: any) => {
        const name = String(s.name || s.fullName || '').trim().toLowerCase();
        const sId = String(s.id || '').trim();
        return name !== 'unnamed staff' && name !== '' && sId !== 'MUNYAKA-3304';
      });

      if (seed.length > 0) {
        localStorage.setItem('munyaka_staff_v2', JSON.stringify(seed));
        localStorage.setItem('munyaka_staff_directory', JSON.stringify(seed));
        localStorage.setItem('munyaka_staff', JSON.stringify(seed));
        return seed;
      }
      return [];
    } catch (err) {
      console.error('[StaffService] Error loading staff:', err);
      return (initialSeedData.staff as StaffMember[]) || [];
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
      // Check category explicitly or role keywords
      const cat = String(s.category || s.type || '').toLowerCase();
      return cat.includes('teach') || roleStr.includes('teach') || roleStr.includes('educator') || roleStr.includes('teacher');
    });

    const nonTeaching = staff.filter((s) => {
      const roleStr = `${s.role || ''} ${s.type || ''} ${s.category || ''} ${s.position || ''} ${s.department || ''}`.toLowerCase();
      const cat = String(s.category || s.type || '').toLowerCase();
      const isTeach = cat.includes('teach') || roleStr.includes('teach') || roleStr.includes('educator') || roleStr.includes('teacher');
      return !isTeach;
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
