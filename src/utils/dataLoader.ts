import { Learner } from '@/services/learnerService';

const STORAGE_KEY = 'munyaka_learners_v2';

export const initializeMasterStore = () => {
  try {
    const SEED_VERSION_KEY = 'munyaka_seed_version_v4_purge';
    if (!localStorage.getItem(SEED_VERSION_KEY)) {
      localStorage.setItem(SEED_VERSION_KEY, 'true');
    }
  } catch (e) {
    console.error("Error initializing master store:", e);
  }
};

export const getNormalizedLearners = (): any[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    const rawDeleted = localStorage.getItem('deleted_learner_ids');
    const deletedIds: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];

    return parsed.filter((l: any) => {
      if (!l) return false;
      const id = String(l.id || l._id || '').trim();
      const adm = String(l.admissionNumber || l.admissionNo || l.admNo || '').trim();
      if (deletedIds.includes(id) || deletedIds.includes(adm)) return false;
      return true;
    });
  } catch (e) {
    console.error("Error reading normalized learners:", e);
    return [];
  }
};

export const sanitizeAndSeedLearners = (learners: any[]) => {
  return learners;
};

export const getActiveStaff = () => {
  try {
    const raw = localStorage.getItem('munyaka_users_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    return [];
  } catch {
    return [];
  }
};
