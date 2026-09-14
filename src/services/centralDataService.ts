const STORAGE_KEY_LEARNERS = 'munyaka_learners_v2';
const STORAGE_KEY_STAFF = 'munyaka_staff_v2';

const DEFAULT_LEARNERS = Array.from({ length: 11 }, (_, i) => ({
  id: `learner-${i + 1}`,
  name: `Learner ${i + 1}`,
  grade: i < 8 ? `Grade ${i + 1}` : 'Junior Secondary',
}));

const DEFAULT_STAFF = [
  { id: 's1', name: 'Teacher One', role: 'Teaching Staff' },
  { id: 's2', name: 'Teacher Two', role: 'Teaching Staff' },
  { id: 's3', name: 'Support One', role: 'Non-Teaching Staff' },
  { id: 's4', name: 'Support Two', role: 'Non-Teaching Staff' },
  { id: 's5', name: 'Support Three', role: 'Non-Teaching Staff' },
  { id: 's6', name: 'Support Four', role: 'Non-Teaching Staff' },
  { id: 's7', name: 'Support Five', role: 'Non-Teaching Staff' },
  { id: 's8', name: 'Support Six', role: 'Non-Teaching Staff' },
];

export const CentralDataService = {
  getLearners: () => {
    try {
      console.log("All localStorage keys:", Object.keys(localStorage));
      const data = localStorage.getItem(STORAGE_KEY_LEARNERS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }

      // Check legacy keys
      const legacyKeys = ['munyaka_learners_db', 'munyaka_students', 'munyaka_learners', 'school_learners_data', 'students', 'learners', 'munyaka_pupils'];
      for (const key of legacyKeys) {
        const legacyData = localStorage.getItem(key);
        if (legacyData) {
          try {
            const parsed = JSON.parse(legacyData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log(`Migrated learners from legacy key: ${key}`, parsed.length);
              localStorage.setItem(STORAGE_KEY_LEARNERS, JSON.stringify(parsed));
              return parsed;
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error("Error reading learners", e);
    }
    return DEFAULT_LEARNERS;
  },

  saveLearners: (learners: any[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_LEARNERS, JSON.stringify(learners));
    } catch (e) {
      console.error("Error saving learners", e);
    }
  },

  getStaff: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_STAFF);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error reading staff", e);
    }
    return DEFAULT_STAFF;
  },

  saveStaff: (staff: any[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(staff));
    } catch (e) {
      console.error("Error saving staff", e);
    }
  }
};

export function generateFullSnapshot() {
  const learners = CentralDataService.getLearners();
  const staff = CentralDataService.getStaff();
  return `// Auto-generated seed snapshot
export const mockLearners = ${JSON.stringify(learners, null, 2)};
export const mockStaff = ${JSON.stringify(staff, null, 2)};
`;
}

export default CentralDataService;