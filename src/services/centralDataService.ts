const STORAGE_KEY_STUDENTS = 'munyaka_students';

export const CentralDataService = {
  getLearners: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading students from CentralDataService", e);
    }
    return [];
  },

  saveLearners: (students: any[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
      window.dispatchEvent(new Event('students-updated'));
      window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key: STORAGE_KEY_STUDENTS } }));
    } catch (e) {
      console.error("Error saving students to CentralDataService", e);
    }
  },

  getStudents: () => CentralDataService.getLearners(),
  saveStudents: (students: any[]) => CentralDataService.saveLearners(students),
  getStaff: () => {
    try {
      const raw = localStorage.getItem('munyaka_staff');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  },

  saveStaff: (staff: any[]) => {
    try {
      localStorage.setItem('munyaka_staff', JSON.stringify(staff));
    } catch (e) {}
  }
};

export function generateFullSnapshot() {
  const learners = CentralDataService.getLearners();
  const staff = CentralDataService.getStaff();
  return JSON.stringify({ learners, staff }, null, 2);
}
