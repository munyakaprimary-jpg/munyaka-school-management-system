export const initialSeedData = {
  students: [
    { id: '1', name: 'MUTWIKA', fullName: 'MUTWIKA', grade: 'Grade 1' },
    { id: '2', name: 'OCTEVIOR', fullName: 'OCTEVIOR', grade: 'Grade 1' },
    { id: '3', name: 'SAMWEL', fullName: 'SAMWEL', grade: 'Grade 1' },
    { id: '4', name: 'ALFRED', fullName: 'ALFRED', grade: 'Grade 2' },
    { id: '5', name: 'BRIAN', fullName: 'BRIAN', grade: 'Grade 2' },
    { id: '6', name: 'MARY', fullName: 'MARY', grade: 'Grade 2' },
    { id: '7', name: 'SAMSON KIBET', fullName: 'SAMSON KIBET', grade: 'Grade 3' }
  ],
  staff: [],
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

export const cbcStudyContent = (initialSeedData as any).cbcStudyContent || [];
export const cbcStudyMaterials = cbcStudyContent;
export const cbcCurriculum = (initialSeedData as any).cbcCurriculum || [];

export default initialSeedData;