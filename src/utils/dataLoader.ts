import { INITIAL_SEED_DATA } from '@/data/initialSeedData';

export const initializeMasterStore = () => {
  try {
    const SEED_VERSION_KEY = 'munyaka_seed_version_v3_clean';
    if (!localStorage.getItem(SEED_VERSION_KEY)) {
      localStorage.removeItem('munyaka_learners_v2');
      localStorage.setItem(SEED_VERSION_KEY, 'true');
    }

    const existingLearners = localStorage.getItem('munyaka_learners_v2');
    if (!existingLearners) {
      localStorage.setItem('munyaka_learners_v2', JSON.stringify([]));
    }
    
    const existingStaff = localStorage.getItem('munyaka_users_v1');
    if (!existingStaff) {
      localStorage.setItem('munyaka_users_v1', JSON.stringify([]));
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
    
    if (!Array.isArray(learners)) {
      learners = [];
      localStorage.setItem('munyaka_learners_v2', JSON.stringify([]));
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
    return [];
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
    return users;
  } catch {
    return [];
  }
};
