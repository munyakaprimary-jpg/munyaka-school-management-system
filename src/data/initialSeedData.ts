export const initialSeedData: Record<string, any> = {
  students: [
    {
      id: "1-001",
      admNo: "B002961576",
      name: "MUTWIKA KILONZO",
      fullName: "MUTWIKA KILONZO",
      grade: "Grade 7",
      stream: "VENUS",
      status: "Active",
      gender: "Male",
      attendanceStatus: "Present",
      guardian: "STEPHEN KILONZO KINGOO",
      phone: "0705221675"
    },
    {
      id: "1-002",
      admNo: "B004123291",
      name: "OCTEVIOR LUVISIA",
      fullName: "OCTEVIOR LUVISIA",
      grade: "Grade 6",
      stream: "Yellow",
      status: "Active",
      gender: "Male",
      attendanceStatus: "Present",
      guardian: "TITUS KIJUSA LUVISIA",
      phone: "0705138090"
    }
  ],
  learners: [],
  staff: [],
  staffPrereg: [],
  grades: [],
  examTypes: [],
  learningAreas: [],
  assessmentScores: {},
  fees: [],
  feeStructures: [],
  transactions: [],
  attendance: {},
  libraryBooks: [],
  ictAssets: [],
  notices: [],
  settings: {},
  exams: [],
  marks: [],
  cbcAssessments: []
};

initialSeedData.learners = initialSeedData.students;

export const INITIAL_SEED_DATA = initialSeedData;
export const DEFAULT_CBC_CLUSTERS = [];
export const buildDefaultClusters = () => [];
export const strandCategories = [
  'Languages',
  'Mathematics',
  'Science & Technology',
  'Social Studies',
  'Creative Arts',
  'Religious Education',
  'Assessments & Quizzes'
];
export const gradeLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const ContentItem = {};
export const StrandCategory = {};
export const MemoryVerse = {};
export const RevisionQuestion = {};
export const Attachment = {};
export const AssessmentType = {};
export const assessmentTypeOptions = ['quiz', 'exam', 'assignment', 'practical', 'oral'];

export const mockLearners = initialSeedData.students;
export const mockStudents = initialSeedData.students;
export const mockStaff = initialSeedData.staff;
export const mockExams = initialSeedData.exams;
export const mockMarks = initialSeedData.marks;
export const mockCBCAssessments = initialSeedData.cbcAssessments;
export const mockLibrary = initialSeedData.libraryBooks;
export const mockICT = initialSeedData.ictAssets;
export const mockFinances = initialSeedData.transactions;
export const mockFeeStructures = initialSeedData.feeStructures;

export default initialSeedData;
