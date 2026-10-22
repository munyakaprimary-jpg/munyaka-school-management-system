import { STORAGE_KEYS } from '@/constants/storageKeys';
import { initialSeedData } from '@/data/initialSeedData';

export const UNIFIED_LEARNERS_KEY = STORAGE_KEYS.LEARNERS; // 'munyaka_learners_v2'

export interface HarmonizedLearner {
  id: string;
  name: string;
  fullName?: string;
  admissionNumber?: string;
  admNo?: string;
  assessmentNumber?: string;
  assessmentNo?: string;
  gender?: string;
  grade?: string;
  stream?: string;
  parentName?: string;
  guardian?: string;
  phoneNumber?: string;
  phone?: string;
  dateOfBirth?: string;
  dob?: string;
  status?: string;
  [key: string]: any;
}

/**
 * HarmonizedLearnerService: Single source of truth for all learner operations in the app.
 * Reads and writes exclusively to 'munyaka_learners_v2'.
 */
export const HarmonizedLearnerService = {
  getLearners: (): HarmonizedLearner[] => {
    try {
      const raw = localStorage.getItem(UNIFIED_LEARNERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('[HarmonizedLearnerService] Error reading learners:', e);
    }

    // Fallback to initial seed if empty
    const seed = (initialSeedData as any).students || (initialSeedData as any).learners || [];
    if (seed.length > 0) {
      try {
        localStorage.setItem(UNIFIED_LEARNERS_KEY, JSON.stringify(seed));
      } catch {}
      return seed;
    }

    return [];
  },

  saveLearners: (learners: HarmonizedLearner[]): boolean => {
    try {
      // Deduplicate by ID, admission number, or name
      const map = new Map<string, HarmonizedLearner>();
      (learners || []).forEach((l) => {
        if (l && (l.id || l.admissionNumber || l.admNo || l.name)) {
          const key = String(l.id || l.admissionNumber || l.admNo || l.name).trim().toLowerCase();
          map.set(key, {
            ...l,
            id: l.id ? String(l.id) : `learner_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
          });
        }
      });

      const uniqueList = Array.from(map.values());
      localStorage.setItem(UNIFIED_LEARNERS_KEY, JSON.stringify(uniqueList));

      // Dispatch global change events so all components re-render instantly
      window.dispatchEvent(new Event('learners-updated'));
      window.dispatchEvent(new Event('students-updated'));
      window.dispatchEvent(new Event('munyaka:data-changed'));
      return true;
    } catch (e) {
      console.error('[HarmonizedLearnerService] Error saving learners:', e);
      return false;
    }
  },

  addLearner: (learner: Partial<HarmonizedLearner>): HarmonizedLearner => {
    const list = HarmonizedLearnerService.getLearners();
    const newRecord: HarmonizedLearner = {
      id: `learner_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: learner.name || learner.fullName || 'New Learner',
      admissionNumber: learner.admissionNumber || learner.admNo || `MUN-${Math.floor(1000 + Math.random() * 9000)}`,
      grade: learner.grade || 'Grade 1',
      stream: learner.stream || 'Green',
      gender: learner.gender || 'Not Specified',
      ...learner,
    };
    list.push(newRecord);
    HarmonizedLearnerService.saveLearners(list);
    return newRecord;
  },

  updateLearner: (id: string, updates: Partial<HarmonizedLearner>): void => {
    const list = HarmonizedLearnerService.getLearners();
    const idx = list.findIndex(l => String(l.id) === String(id) || String(l.admissionNumber) === String(id) || String(l.admNo) === String(id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      HarmonizedLearnerService.saveLearners(list);
    }
  },

  deleteLearner: (id: string): void => {
    const list = HarmonizedLearnerService.getLearners();
    const filtered = list.filter(l => String(l.id) !== String(id) && String(l.admissionNumber) !== String(id) && String(l.admNo) !== String(id));
    HarmonizedLearnerService.saveLearners(filtered);
  }
};
