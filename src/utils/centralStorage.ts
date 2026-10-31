export const KEYS = {
  LEARNERS: 'munyaka_learners_v2',
  STAFF: 'munyaka_staff_v2',
  CENTRAL_DB: 'munyaka_central_db',
};

export const getStoredLearners = () => {
  try {
    const raw = localStorage.getItem(KEYS.LEARNERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any unwanted placeholder records permanently
        return parsed.filter((l: any) => l && l.name && l.name !== 'Unnamed Learner' && l.name !== 'Unknown Learner');
      }
    }
  } catch (e) {}
  return [];
};

export const saveLearner = (learnerData: any) => {
  const existing = getStoredLearners();
  // Prevent duplicates by ID or Admission Number
  const filtered = existing.filter((l: any) => l.id !== learnerData.id && l.admNo !== learnerData.admNo);
  const updated = [learnerData, ...filtered];
  
  localStorage.setItem(KEYS.LEARNERS, JSON.stringify(updated));

  // Sync with central DB structure
  const centralRaw = localStorage.getItem(KEYS.CENTRAL_DB);
  let central = centralRaw ? JSON.parse(centralRaw) : { learners: [], staff: [] };
  central.learners = updated;
  delete central.students; // Purge legacy key
  localStorage.setItem(KEYS.CENTRAL_DB, JSON.stringify(central));

  window.dispatchEvent(new Event('storage'));
};

export const getStoredStaff = () => {
  try {
    const raw = localStorage.getItem(KEYS.STAFF);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {}
  return [];
};

export const saveStaffMember = (staffData: any) => {
  const existing = getStoredStaff();
  const filtered = existing.filter((s: any) => s.id !== staffData.id && s.email !== staffData.email && s.tscNo !== staffData.tscNo);
  const updated = [staffData, ...filtered];

  localStorage.setItem(KEYS.STAFF, JSON.stringify(updated));

  const centralRaw = localStorage.getItem(KEYS.CENTRAL_DB);
  let central = centralRaw ? JSON.parse(centralRaw) : { learners: [], staff: [] };
  central.staff = updated;
  localStorage.setItem(KEYS.CENTRAL_DB, JSON.stringify(central));

  window.dispatchEvent(new Event('storage'));
};
