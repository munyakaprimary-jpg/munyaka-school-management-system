export const STORAGE_KEYS = {
  LEARNERS: 'munyaka_learners_v2',
  STAFF: 'munyaka_staff_v2',
  CENTRAL_DB: 'munyaka_central_db',
};

export const getStoredLearners = (): any[] => {
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
    console.error('Error reading learners storage:', e);
  }
  return [];
};

export const saveLearnerRecord = (learner: any) => {
  const current = getStoredLearners();
  const filtered = current.filter((l) => l.id !== learner.id && l.admNo !== learner.admNo);
  const updated = [learner, ...filtered];

  localStorage.setItem(STORAGE_KEYS.LEARNERS, JSON.stringify(updated));

  // Harmonize with central DB object
  const centralRaw = localStorage.getItem(STORAGE_KEYS.CENTRAL_DB);
  let central = centralRaw ? JSON.parse(centralRaw) : { learners: [], staff: [] };
  delete (central as any).students; // Wipe obsolete legacy key
  central.learners = updated;
  localStorage.setItem(STORAGE_KEYS.CENTRAL_DB, JSON.stringify(central));

  window.dispatchEvent(new Event('storage'));
};

export const saveLearner = saveLearnerRecord;

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

  window.dispatchEvent(new Event('storage'));
};

export const saveStaff = saveStaffMember;
