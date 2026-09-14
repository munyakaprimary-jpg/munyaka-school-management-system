export const initialSeedData = {
  students: [
    { id: '1', admissionNumber: 'M001', name: 'MUTWIKA', fullName: 'MUTWIKA', grade: 'Grade 1' },
    { id: '2', admissionNumber: 'M002', name: 'OCTEVIOR', fullName: 'OCTEVIOR', grade: 'Grade 1' },
    { id: '3', admissionNumber: 'M003', name: 'SAMWEL', fullName: 'SAMWEL', grade: 'Grade 1' },
    { id: '4', admissionNumber: 'M004', name: 'ALFRED', fullName: 'ALFRED', grade: 'Grade 2' },
    { id: '5', admissionNumber: 'M005', name: 'BRIAN', fullName: 'BRIAN', grade: 'Grade 2' },
    { id: '6', admissionNumber: 'M006', name: 'MARY', fullName: 'MARY', grade: 'Grade 2' },
    { id: '7', admissionNumber: 'M007', name: 'SAMSON KIBET', fullName: 'SAMSON KIBET', grade: 'Grade 3' },
    { id: '8', admissionNumber: 'M008', name: 'LEARNER 8', fullName: 'LEARNER 8', grade: 'Grade 3' },
    { id: '9', admissionNumber: 'M009', name: 'LEARNER 9', fullName: 'LEARNER 9', grade: 'Grade 4' },
    { id: '10', admissionNumber: 'M010', name: 'LEARNER 10', fullName: 'LEARNER 10', grade: 'Grade 4' },
    { id: '11', admissionNumber: 'M011', name: 'LEARNER 11', fullName: 'LEARNER 11', grade: 'Grade 5' }
  ],
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