export const STORAGE_KEYS = {
  LEARNERS: 'munyaka_learners_v2',
  STAFF: 'munyaka_staff_v2',
  CENTRAL_DB: 'munyaka_central_db',
};

// Strictly typed Learner Model
export interface Learner {
  id: string;
  admNo: string;
  assessmentNo?: string;
  birthCertNo?: string;
  name: string;
  grade: string;
  stream: string;
  gender: string;
  dob: string;
  parentName: string;
  phone: string;
  createdAt: string;
}

// 1. Strict Learner Getter (Guards against empty/poisoned seeds)
export const getStoredLearners = (): Learner[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEARNERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (l: any) => l && l.name && l.name !== 'Unnamed Learner' && l.name !== 'Unknown Learner'
        );
      }
    }
  } catch (e) {
    console.error('Failed to parse learners:', e);
  }
  return []; // Clean empty array fallback only
};

// 2. Safe Learner Save Routine
export const saveLearner = (learner: Learner) => {
  const current = getStoredLearners();
  const filtered = current.filter((l) => l.id !== learner.id && l.admNo !== learner.admNo);
  const updated = [learner, ...filtered];

  localStorage.setItem(STORAGE_KEYS.LEARNERS, JSON.stringify(updated));

  // Sync to central database object
  const centralRaw = localStorage.getItem(STORAGE_KEYS.CENTRAL_DB);
  let central = centralRaw ? JSON.parse(centralRaw) : { learners: [], staff: [] };
  delete (central as any).students; // Wipe obsolete key
  central.learners = updated;
  localStorage.setItem(STORAGE_KEYS.CENTRAL_DB, JSON.stringify(central));

  // Dispatch custom event to notify all listening components across tabs/pages
  window.dispatchEvent(new Event('munyaka_storage_update'));
};

// Aliases for compatibility with other imports
export const saveLearnerRecord = saveLearner;

export const getStoredStaff = (): any[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading staff storage:', e);
  }
  return [];
};

export const saveStaffMember = (staffData: any) => {
  const existing = getStoredStaff();
  const filtered = existing.filter((s: any) => s.id !== staffData.id && s.email !== staffData.email && s.tscNo !== staffData.tscNo);
  const updated = [staffData, ...filtered];

  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(updated));

  const centralRaw = localStorage.getItem(STORAGE_KEYS.CENTRAL_DB);
  let central = centralRaw ? JSON.parse(centralRaw) : { learners: [], staff: [] };
  central.staff = updated;
  localStorage.setItem(STORAGE_KEYS.CENTRAL_DB, JSON.stringify(central));

  window.dispatchEvent(new Event('munyaka_storage_update'));
};

export const saveStaff = saveStaffMember;
