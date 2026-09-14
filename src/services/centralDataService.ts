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
    const seedStudents = initialSeedData?.students || initialSeedData?.learners || [];
    try {
      const stored = localStorage.getItem(KEYS.LEARNERS) || localStorage.getItem(KEYS.STUDENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only return stored array if it is fully populated with all learners
        if (Array.isArray(parsed) && parsed.length >= seedStudents.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading learners:", e);
    }

    // Restore full seed student list if storage only has partial/1 record
    localStorage.setItem(KEYS.LEARNERS, JSON.stringify(seedStudents));
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(seedStudents));
    return seedStudents;
  },

  getStaff: () => {
    try {
      const stored = localStorage.getItem(KEYS.STAFF);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading staff:", e);
    }
    
    const seedStaff = initialSeedData?.staff || [];
    localStorage.setItem(KEYS.STAFF, JSON.stringify(seedStaff));
    return seedStaff;
  },

  saveLearners: (learners: any[]) => {
    localStorage.setItem(KEYS.LEARNERS, JSON.stringify(learners));
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(learners));
  }
};

export default CentralDataService;