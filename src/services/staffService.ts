/**
 * Staff Service - LocalStorage-based data layer
 * 
 * This service provides a REST-like API for managing staff records using
 * browser LocalStorage as the persistent data store. It follows a clean
 * async API pattern with proper error handling and supports CRUD operations.
 * 
 * Future: Can be easily swapped to call a real REST API or Supabase by
 * replacing the localStorage calls with fetch() requests.
 */

const STAFF_STORAGE_KEY = 'munyaka_staff_directory';
const STAFF_SYNC_EVENT = 'munyaka_staff_updated';

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
  created_at: string;
  updated_at: string;
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

/**
 * Read all staff records from LocalStorage. Returns an empty array if
 * the storage key does not exist or contains invalid JSON.
 */
function readAllFromStorage(): StaffRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STAFF_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as StaffRecord[];
    }
    return [];
  } catch (e) {
    console.error('Error reading staff records from localStorage:', e);
    return [];
  }
}

/**
 * Persist the full staff array back to LocalStorage. Emits a custom
 * event so other tabs and components listening via the subscription
 * helper can update in real-time without a manual page refresh.
 */
function writeAllToStorage(records: StaffRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(records));
    // Dispatch a custom event so other components in the same tab can react.
    window.dispatchEvent(new CustomEvent(STAFF_SYNC_EVENT, { detail: records }));
  } catch (e) {
    console.error('Error writing staff records to localStorage:', e);
  }
}

/**
 * Generate a unique ID for a new staff record. Uses crypto.randomUUID
 * when available (modern browsers) and falls back to a timestamp-based
 * ID for older environments.
 */
function generateStaffId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `staff-${crypto.randomUUID()}`;
  }
  return `staff-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Simulate a small async delay (50ms) to mimic a real network call so
 * the UI's loading state is observable. This makes the service a drop-in
 * replacement for a real REST API without changing the call sites.
 */
function simulateNetworkLatency(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 50));
}

export const staffService = {
  /**
   * GET /staff
   * Fetch all staff records, sorted by most recently created first.
   */
  async getAllStaff(): Promise<StaffRecord[]> {
    await simulateNetworkLatency();
    const records = readAllFromStorage();
    // Sort by created_at descending so the newest staff appear first.
    return records.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  },

  /**
   * GET /staff/:id
   * Fetch a single staff record by its ID. Returns null if not found.
   */
  async getStaffById(id: string): Promise<StaffRecord | null> {
    await simulateNetworkLatency();
    const records = readAllFromStorage();
    return records.find(r => r.id === id) || null;
  },

  /**
   * POST /staff
   * Create a new staff record. Returns the created record with its
   * generated id, created_at, and updated_at fields populated.
   */
  async createStaff(data: CreateStaffData): Promise<StaffRecord> {
    await simulateNetworkLatency();
    const now = new Date().toISOString();
    const newStaff: StaffRecord = {
      id: generateStaffId(),
      full_name: data.full_name.trim(),
      role: data.role.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      tsc_number: data.tsc_number?.trim() || undefined,
      national_id: data.national_id?.trim() || undefined,
      department: data.department?.trim() || 'School Administration',
      status: data.status || 'Active',
      created_at: now,
      updated_at: now,
    };
    const records = readAllFromStorage();
    records.unshift(newStaff);
    writeAllToStorage(records);
    return newStaff;
  },

  /**
   * PUT /staff/:id
   * Update an existing staff record. Returns the updated record, or
   * throws if the record was not found.
   */
  async updateStaff(id: string, data: UpdateStaffData): Promise<StaffRecord> {
    await simulateNetworkLatency();
    const records = readAllFromStorage();
    const index = records.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error(`Staff record with id "${id}" was not found.`);
    }
    const updated: StaffRecord = {
      ...records[index],
      ...data,
      // Trim string fields if they are being updated.
      full_name: data.full_name !== undefined ? data.full_name.trim() : records[index].full_name,
      role: data.role !== undefined ? data.role.trim() : records[index].role,
      phone: data.phone !== undefined ? data.phone.trim() : records[index].phone,
      email: data.email !== undefined ? data.email.trim() : records[index].email,
      tsc_number: data.tsc_number !== undefined ? (data.tsc_number?.trim() || undefined) : records[index].tsc_number,
      national_id: data.national_id !== undefined ? (data.national_id?.trim() || undefined) : records[index].national_id,
      department: data.department !== undefined ? (data.department?.trim() || 'School Administration') : records[index].department,
      updated_at: new Date().toISOString(),
    };
    records[index] = updated;
    writeAllToStorage(records);
    return updated;
  },

  /**
   * DELETE /staff/:id
   * Delete a staff record by its ID. Returns true if a record was
   * removed, false if the ID was not found.
   */
  async deleteStaff(id: string): Promise<boolean> {
    await simulateNetworkLatency();
    const records = readAllFromStorage();
    const filtered = records.filter(r => r.id !== id);
    if (filtered.length === records.length) {
      return false; // No record was deleted.
    }
    writeAllToStorage(filtered);
    return true;
  },

  /**
   * Subscribe to staff data changes. Returns an object with an
   * `unsubscribe()` method that should be called on component
   * unmount to clean up the listener.
   * 
   * Works for both same-tab (custom event) and cross-tab
   * (storage event) data updates.
   */
  subscribeToChanges(callback: (records: StaffRecord[]) => void): { unsubscribe: () => void } {
    if (typeof window === 'undefined') {
      return { unsubscribe: () => {} };
    }

    const handleSameTabEvent = (event: Event) => {
      const customEvent = event as CustomEvent<StaffRecord[]>;
      if (customEvent.detail) {
        callback(customEvent.detail);
      } else {
        // Fallback: re-read from storage if the event payload is missing.
        callback(readAllFromStorage());
      }
    };

    const handleCrossTabEvent = (event: StorageEvent) => {
      if (event.key === STAFF_STORAGE_KEY) {
        callback(readAllFromStorage());
      }
    };

    window.addEventListener(STAFF_SYNC_EVENT, handleSameTabEvent);
    window.addEventListener('storage', handleCrossTabEvent);

    return {
      unsubscribe: () => {
        window.removeEventListener(STAFF_SYNC_EVENT, handleSameTabEvent);
        window.removeEventListener('storage', handleCrossTabEvent);
      }
    };
  },
};