export const buildDefaultClusters = () => {
  return [
    { id: 'cluster-1', name: 'Mathematics Activities', grade: 'Grade 1', learningAreas: ['Mathematics'] },
    { id: 'cluster-2', name: 'Language Activities', grade: 'Grade 1', learningAreas: ['English', 'Kiswahili'] }
  ];
};

export const DEFAULT_CBC_CLUSTERS = buildDefaultClusters();

export const initialExams = [];
export const initialExamSchedules = [];
export const initialExamTypes = [];
export const initialMarks = [];
export const initialQuestions = [];
export const initialStudents = [];
export const initialReportCards = [];
export const initialFeeStructures = [];
export const initialFeePayments = [];
export const initialStudyCorner = [];
export const initialLibraryBooks = [];
export const initialLibraryLogs = [];

export const initialSeedData = {
  version: "2.6.0",
  students: [],
  learners: [],
  staff: [],
  grades: ["PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"],
  streams: ["North", "South", "East", "West"],
  exams: [],
  fees: [],
  attendance: [],
  transactions: []
};

(initialSeedData as any).learners = [];
(initialSeedData as any).students = [];

export const INITIAL_SEED_DATA = initialSeedData;
export const SEED_VERSION = initialSeedData.version;
export const initialStaff = [];
export const initialLearners = [];
export const initialGrades = initialSeedData.grades;
export const initialStreams = initialSeedData.streams;
export const initialConfiguredStreams = initialSeedData.streams;

export default initialSeedData;
