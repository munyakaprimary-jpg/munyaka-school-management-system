import { initialSeedData } from '../data/initialSeedData';

const KEYS = {
  LEARNERS: 'munyaka_learners',
  EXAMS: 'munyaka_exams',
  MARKS: 'munyaka_marks',
  LIBRARY: 'munyaka_library',
  FINANCES: 'munyaka_finances',
};

export const CentralDataService = {
  // Retrieve module data or seed if empty
  getData: <T>(key: string, fallbackSeed: T[]): T[] => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        localStorage.setItem(key, JSON.stringify(fallbackSeed));
        return fallbackSeed;
      }
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(key, JSON.stringify(fallbackSeed));
        return fallbackSeed;
      }
      return parsed;
    } catch {
      localStorage.setItem(key, JSON.stringify(fallbackSeed));
      return fallbackSeed;
    }
  },

  // Save new items cleanly to storage
  saveData: <T>(key: string, data: T[]): void => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to save data for ${key}:`, e);
    }
  },

  // Getters for specific contexts
  getLearners: () => CentralDataService.getData(KEYS.LEARNERS, initialSeedData.students),
  getExams: () => CentralDataService.getData(KEYS.EXAMS, initialSeedData.exams || []),
  getLibrary: () => CentralDataService.getData(KEYS.LIBRARY, initialSeedData.libraryBooks || []),
  
  // Storage updater for new records
  addRecord: <T>(key: string, newRecord: T): T[] => {
    const existing = CentralDataService.getData<T>(key, []);
    const updated = [...existing, newRecord];
    CentralDataService.saveData(key, updated);
    return updated;
  }
};