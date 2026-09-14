import { initialSeedData } from '../data/initialSeedData';

const KEYS = {
  LEARNERS: 'munyaka_learners',
  STUDENTS: 'munyaka_students',
  STAFF: 'munyaka_staff',
  EXAMS: 'munyaka_exams',
  LIBRARY: 'munyaka_library',
  FINANCES: 'munyaka_finances',
};

export const CentralDataService = {
  getLearners: () => {
    const seedStudents = initialSeedData?.students || (initialSeedData as any)?.learners || [];
    try {
      const stored = localStorage.getItem(KEYS.LEARNERS) || localStorage.getItem(KEYS.STUDENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mergedMap = new Map();
          seedStudents.forEach((item: any) => {
            const id = item.id || item.admissionNumber || item.name;
            if (id) mergedMap.set(id, item);
          });
          parsed.forEach((item: any) => {
            const id = item.id || item.admissionNumber || item.name;
            if (id) mergedMap.set(id, item);
          });
          
          const mergedList = Array.from(mergedMap.values());
          localStorage.setItem(KEYS.LEARNERS, JSON.stringify(mergedList));
          localStorage.setItem(KEYS.STUDENTS, JSON.stringify(mergedList));
          return mergedList;
        }
      }
    } catch (e) {
      console.error("Error reading learners:", e);
    }

    localStorage.setItem(KEYS.LEARNERS, JSON.stringify(seedStudents));
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(seedStudents));
    return seedStudents;
  },

  addLearner: (newLearner: any) => {
    const current = CentralDataService.getLearners();
    const updated = [...current, newLearner];
    CentralDataService.saveLearners(updated);
    return updated;
  },

  saveLearners: (learners: any[]) => {
    localStorage.setItem(KEYS.LEARNERS, JSON.stringify(learners));
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(learners));
  },

  getStaff: () => {
    try {
      const stored = localStorage.getItem(KEYS.STAFF);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error reading staff:", e);
    }
    
    const seedStaff = initialSeedData?.staff || [];
    localStorage.setItem(KEYS.STAFF, JSON.stringify(seedStaff));
    return seedStaff;
  }
};

export default CentralDataService;