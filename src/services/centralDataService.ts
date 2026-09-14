const STORAGE_KEY_LEARNERS = 'munyaka_learners_v2';
const STORAGE_KEY_STAFF = 'munyaka_staff_v2';

const DEFAULT_LEARNERS = [
  { id: 'learner-1', name: 'Amina Wangari', grade: 'Grade 4', admissionNo: 'MUN-G4-001/2026', gender: 'Female', guardian: 'John Wangari', phone: '0712345678' },
  { id: 'learner-2', name: 'Brian Kiprono', grade: 'Grade 5', admissionNo: 'MUN-G5-001/2026', gender: 'Male', guardian: 'Sarah Kiprono', phone: '0722345678' },
  { id: 'learner-3', name: 'Charity Mutua', grade: 'Grade 6', admissionNo: 'MUN-G6-001/2026', gender: 'Female', guardian: 'David Mutua', phone: '0732345678' },
  { id: 'learner-4', name: 'Daniel Ochieng', grade: 'Grade 7', admissionNo: 'MUN-G7-001/2026', gender: 'Male', guardian: 'Grace Ochieng', phone: '0742345678' },
  { id: 'learner-5', name: 'Esther Njeri', grade: 'Grade 8', admissionNo: 'MUN-G8-001/2026', gender: 'Female', guardian: 'Peter Njeri', phone: '0752345678' },
  { id: 'learner-6', name: 'Faith Chebet', grade: 'Grade 3', admissionNo: 'MUN-G3-001/2026', gender: 'Female', guardian: 'Kipkorir Chebet', phone: '0762345678' },
  { id: 'learner-7', name: 'George Odhiambo', grade: 'Grade 2', admissionNo: 'MUN-G2-001/2026', gender: 'Male', guardian: 'Akinyi Odhiambo', phone: '0772345678' },
  { id: 'learner-8', name: 'Hannah Wanjiku', grade: 'Grade 1', admissionNo: 'MUN-G1-001/2026', gender: 'Female', guardian: 'Kamau Wanjiku', phone: '0782345678' },
  { id: 'learner-9', name: 'Ian Kiprop', grade: 'Junior Secondary', admissionNo: 'MUN-JS-001/2026', gender: 'Male', guardian: 'Kiptoo Kiprop', phone: '0792345678' },
  { id: 'learner-10', name: 'Jane Akinyi', grade: 'Grade 4', admissionNo: 'MUN-G4-002/2026', gender: 'Female', guardian: 'Otieno Akinyi', phone: '0702345678' },
  { id: 'learner-11', name: 'Kevin Maina', grade: 'Grade 5', admissionNo: 'MUN-G5-002/2026', gender: 'Male', guardian: 'Wanjiru Maina', phone: '0711345678' },
];

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

      // Target strictly the primary student storage keys in order of precedence
      const primaryKeys = ['munyaka_learners_db', 'munyaka_students', 'munyaka_learners', 'school_learners_data', STORAGE_KEY_LEARNERS];
      for (const key of primaryKeys) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Filter to ensure items are valid student records (must have name or admission/assessment number)
              const validStudents = parsed.filter(item =>
                item &&
                typeof item === 'object' &&
                (item.name || item.fullName || item.admissionNo || item.admNo || item.assessmentNo) &&
                !String(item.name || '').toLowerCase().includes('device') &&
                !String(item.name || '').toLowerCase().includes('setting')
              );

              if (validStudents.length > 0) {
                console.log(`[CentralDataService] Loaded ${validStudents.length} valid students from key: ${key}`);
                // Ensure name & fullName are synchronized
                for (const l of validStudents) {
                  if (!l.name && l.fullName) l.name = l.fullName;
                  if (!l.fullName && l.name) l.fullName = l.name;
                }
                localStorage.setItem(STORAGE_KEY_LEARNERS, JSON.stringify(validStudents));
                return validStudents;
              }
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error("Error reading learners", e);
    }
    localStorage.setItem(STORAGE_KEY_LEARNERS, JSON.stringify(DEFAULT_LEARNERS));
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