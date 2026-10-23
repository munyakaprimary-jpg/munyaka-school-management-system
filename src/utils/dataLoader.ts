import { INITIAL_SEED_DATA } from '@/data/initialSeedData';

export const initializeMasterStore = () => {
  try {
    // Force reset on development boot if flag not set for this seed version
    const SEED_VERSION_KEY = 'munyaka_seed_version_v3_clean';
    if (!localStorage.getItem(SEED_VERSION_KEY)) {
      localStorage.removeItem('munyaka_learners_v2');
      localStorage.setItem(SEED_VERSION_KEY, 'true');
    }

    const existingLearners = localStorage.getItem('munyaka_learners_v2');
    if (!existingLearners) {
      const cleanLearners = (INITIAL_SEED_DATA.learners || []).map((l: any) => ({
        ...l,
        id: l.id && String(l.id).startsWith('learner-') ? String(l.id) : `learner-${l.id || l.admNo || Math.random().toString(36).slice(2, 9)}`
      }));
      localStorage.setItem('munyaka_learners_v2', JSON.stringify(cleanLearners));
    }
    
    const existingStaff = localStorage.getItem('munyaka_users_v1');
    if (!existingStaff) {
      localStorage.setItem('munyaka_users_v1', JSON.stringify(INITIAL_SEED_DATA.staff || []));
    }
  } catch (e) {
    console.error("Error initializing master store:", e);
  }
};

export const getNormalizedLearners = () => {
  try {
    initializeMasterStore();
    const raw = localStorage.getItem('munyaka_learners_v2');
    let learners = [];
    if (raw) {
      learners = JSON.parse(raw);
    }
    
    if (!Array.isArray(learners) || learners.length === 0) {
      learners = INITIAL_SEED_DATA.learners || [];
      localStorage.setItem('munyaka_learners_v2', JSON.stringify(learners));
    }

    const rawDeleted = localStorage.getItem('deleted_learner_ids');
    const deletedIds: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];

    const uniqueLearnersMap = new Map();
    learners.forEach((l: any) => {
      if (!l) return;
      const key = String(l.id || l.admNo || '').trim();
      if (key && !deletedIds.includes(key)) {
        uniqueLearnersMap.set(key, l);
      }
    });
    
    return Array.from(uniqueLearnersMap.values());
  } catch (e) {
    console.error("Error reading learners:", e);
    return INITIAL_SEED_DATA.learners || [];
  }
};

export const sanitizeAndSeedLearners = (learners: any[]) => {
  const uniqueMap = new Map();
  learners.forEach((learner) => {
    if (!learner) return;
    const key = String(learner.id || learner.learnerId || learner.admNo || learner.admissionNumber || learner.admission_number || '').trim();
    if (key && !uniqueMap.has(key)) {
      uniqueMap.set(key, learner);
    } else if (!key && learner.name) {
      const nameKey = String(learner.name).trim().toLowerCase();
      if (!uniqueMap.has(nameKey)) {
        uniqueMap.set(nameKey, learner);
      }
    }
  });
  const cleanLearners = Array.from(uniqueMap.values());
  localStorage.setItem('munyaka_learners_v2', JSON.stringify(cleanLearners));
  return cleanLearners;
};

export const getActiveStaff = () => {
  try {
    const keys = ['munyaka_staff_db', 'munyaka_staff_master_v1', 'munyaka_staff_directory', 'munyaka_master_staff_list', 'munyaka_staff', 'staff_members', 'staff'];
    let users: any[] = [];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          users = parsed;
          break;
        }
      }
    }
    if (users.length === 0) {
      // Fallback to initial seed staff if localStorage is empty
      // We can import or read from initialSeedData if available, or return empty array
    }
    return users;
  } catch {
    return [];
  }
};
