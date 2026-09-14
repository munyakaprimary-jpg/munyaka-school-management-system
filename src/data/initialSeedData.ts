export const initialSeedData = {
  students: [] as any[],
  learners: [] as any[],
  staff: [
    // Teaching Staff (2)
    { id: 's1', name: 'Teacher One', role: 'Teacher', type: 'Teaching', status: 'Active' },
    { id: 's2', name: 'Teacher Two', role: 'Teacher', type: 'Teaching', status: 'Active' },
    // Non-Teaching Staff (6)
    { id: 's3', name: 'Staff Member 1', role: 'Support', type: 'Non-Teaching', status: 'Active' },
    { id: 's4', name: 'Staff Member 2', role: 'Support', type: 'Non-Teaching', status: 'Active' },
    { id: 's5', name: 'Staff Member 3', role: 'Support', type: 'Non-Teaching', status: 'Active' },
    { id: 's6', name: 'Staff Member 4', role: 'Support', type: 'Non-Teaching', status: 'Active' },
    { id: 's7', name: 'Staff Member 5', role: 'Support', type: 'Non-Teaching', status: 'Active' },
    { id: 's8', name: 'Staff Member 6', role: 'Support', type: 'Non-Teaching', status: 'Active' }
  ],
  exams: [],
  libraryBooks: [],
  transactions: []
};

// MANDATORY EXPORTS FOR VITE COMPATIBILITY
(initialSeedData as any).learners = initialSeedData.students;

export const INITIAL_SEED_DATA = initialSeedData;
export const DEFAULT_CBC_CLUSTERS = [];
export const buildDefaultClusters = () => [];
export const strandCategories = [];
export const gradeLevels = [];
export const ContentItem = {};
export const StrandCategory = {};
export const MemoryVerse = {};
export const RevisionQuestion = {};
export const Attachment = {};
export const AssessmentType = {};
export const assessmentTypeOptions = [];

export const mockLearners = initialSeedData.students;
export const mockStudents = initialSeedData.students;
export const mockStaff = initialSeedData.staff;
export const mockExams = initialSeedData.exams;
export const mockLibrary = initialSeedData.libraryBooks;
export const mockFinances = initialSeedData.transactions;

export const cbcStudyContent = [];
export const cbcStudyMaterials = cbcStudyContent;
export const cbcCurriculum = [];

export default initialSeedData;