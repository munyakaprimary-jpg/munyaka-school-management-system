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

// 1. Strict Learner Getter (Guards against empty/poisoned seeds & unifies legacy keys)
export const purgeAllLearnersPermanently = () => {
  localStorage.removeItem('munyaka_learners');
  localStorage.removeItem('munyaka_learners_v2');
  localStorage.removeItem('munyaka_central_db');
  localStorage.removeItem('munyaka_learners_backup');
  
  Object.keys(localStorage).forEach(key => {
    if (key.includes('learner') || key.includes('munyaka') || key.includes('student')) {
      if (key !== 'munyaka_admin_pin') {
        localStorage.removeItem(key);
      }
    }
  });
};

export const getStoredLearners = (): Learner[] => {
  try {
    const keys = [
      STORAGE_KEYS.LEARNERS,
      'munyaka_app_learners_v1',
      'school_learners_data',
      'munyaka_learners',
      'munyaka_students',
      'munyaka_central_db'
    ];
    let allRaw: any[] = [];
    const seenIds = new Set<string>();
    const seenAdmins = new Set<string>();

    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed)
          ? parsed
          : (parsed?.learners || parsed?.students || parsed?.munyaka_learners || []);
        if (Array.isArray(list)) {
          for (const l of list) {
            if (!l) continue;
            const name = String(l.fullName || l.name || l.studentName || `${l.firstName || ''} ${l.lastName || ''}`).trim();
            if (!name || name === 'undefined undefined' || name === 'null null' || name === 'Unnamed Learner') continue;
            const id = String(l.id || l._id || '');
            const adm = String(l.admissionNo || l.admNo || l.admissionNumber || '');
            
            if (id && seenIds.has(id)) continue;
            if (adm && seenAdmins.has(adm)) continue;
            
            if (id) seenIds.add(id);
            if (adm) seenAdmins.add(adm);
            
            allRaw.push(l);
          }
        }
      } catch (err) {
        console.error(`[centralStorage.ts] Error reading key ${key}:`, err);
      }
    }

    if (allRaw.length > 0) {
      try {
        const normalized = allRaw.map((l: any) => ({
          ...l,
          id: l.id || l._id || l.admissionNo || l.admissionNumber || `learner_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          admNo: l.admNo || l.admissionNo || l.admissionNumber || '',
          name: l.fullName || l.name || l.studentName || `${l.firstName || ''} ${l.lastName || ''}`.trim() || '',
          grade: l.grade || l.gradeLevel || 'Grade 4',
          stream: l.stream || 'Blue',
          gender: l.gender || l.sex || '—',
          dob: l.dob || l.dateOfBirth || '—',
          parentName: l.parentName || l.parentGuardian || l.guardian || '—',
          phone: l.phone || l.phoneNumber || '+254',
          createdAt: l.createdAt || new Date().toISOString(),
        }));
        localStorage.setItem(STORAGE_KEYS.LEARNERS, JSON.stringify(normalized));
        localStorage.setItem('school_learners_data', JSON.stringify(normalized));
        return normalized;
      } catch (e) {}
    }
  } catch (e) {
    console.error('Failed to parse learners:', e);
  }
  return [];
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
