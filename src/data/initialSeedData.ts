/**
 * AUTO-GENERATED SEED DATA FOR MUNYAKA SCHOOL MANAGEMENT SYSTEM
 * Generated at: 2026-09-25T04:44:06.960Z
 * DO NOT EDIT DIRECTLY — Run "npm run export-seed" on the backend server to regenerate.
 */

export const initialFeeStructures = [];
export const initialFeePayments = [];
export const initialExamTypes = [];
export const initialExams = [];
export const initialStudyCorner = [];
export const initialLibraryBooks = [];
export const initialLibraryLogs = [];
export const initialGrades = [];
export const initialStreams = [];
export const initialLearningAreas = [];
export const initialStaff = [];
export const initialLearners = [];
export const initialAttendance = [];
export const initialMarks = [];
export const initialReportCards = [];
export const initialIctEquipment = [];
export const initialScienceInventory = [];
export const initialStoreInventory = [];
export const initialSettings = {};

export const initialFees = initialFeePayments;
export const initialStudents = initialLearners;
export const INITIAL_SEED_DATA = {
  feeStructures: initialFeeStructures,
  feePayments: initialFeePayments,
  fees: initialFeePayments,
  examTypes: initialExamTypes,
  exams: initialExams,
  studyCorner: initialStudyCorner,
  libraryBooks: initialLibraryBooks,
  libraryLogs: initialLibraryLogs,
  grades: initialGrades,
  streams: initialStreams,
  learningAreas: initialLearningAreas,
  staff: initialStaff,
  learners: initialLearners,
  students: initialLearners,
  attendance: initialAttendance,
  marks: initialMarks,
  reportCards: initialReportCards,
  ictEquipment: initialIctEquipment,
  scienceInventory: initialScienceInventory,
  storeInventory: initialStoreInventory,
  settings: initialSettings,
  schoolSettings: initialSettings
};

export const mockLearners = initialLearners;
export const mockStudents = initialLearners;
export const mockStaff = initialStaff;
export const mockExams = initialExams;
export const mockLibrary = initialLibraryBooks;
export const mockFinances = initialFeePayments;

export const DEFAULT_CBC_CLUSTERS = [
  {
    id: 'lower-primary',
    name: 'Lower Primary (Grades 1–3)',
    learningAreas: [
      { id: 'lp_1', name: 'Literacy Activities', code: 'LIT', description: 'Reading, writing and communication' },
      { id: 'lp_2', name: 'Mathematical Activities', code: 'MATH', description: 'Numbers, measurement, geometry' },
      { id: 'lp_3', name: 'Environmental Activities', code: 'ENV', description: 'Social and natural environment' },
      { id: 'lp_4', name: 'Hygiene and Nutrition', code: 'HN', description: 'Health, sanitation and nutrition' },
      { id: 'lp_5', name: 'Religious Education', code: 'RE', description: 'CRE / IRE / HRE' },
      { id: 'lp_6', name: 'Movement and Creative Activities', code: 'MCA', description: 'PE, music, art and craft' }
    ]
  },
  {
    id: 'upper-primary',
    name: 'Upper Primary (Grades 4–6)',
    learningAreas: [
      { id: 'up_1', name: 'English Language', code: 'ENG', description: 'Grammar, composition, comprehension' },
      { id: 'up_2', name: 'Kiswahili Language', code: 'KIS', description: 'Kusoma, kuandika na kuzungumza' },
      { id: 'up_3', name: 'Mathematics', code: 'MTH', description: 'Advanced arithmetic, algebra, geometry' },
      { id: 'up_4', name: 'Science and Technology', code: 'SCI', description: 'Scientific inquiry, ICT basics' },
      { id: 'up_5', name: 'Agriculture and Nutrition', code: 'AGR', description: 'Crop production, animal husbandry, home science' },
      { id: 'up_6', name: 'Social Studies', code: 'SST', description: 'Geography, history, citizenship' },
      { id: 'up_7', name: 'Creative Arts', code: 'CA', description: 'Visual arts, music, crafts' },
      { id: 'up_8', name: 'Religious Education (CRE/IRE/HRE)', code: 'RE', description: 'Spiritual and moral education' }
    ]
  },
  {
    id: 'junior-secondary',
    name: 'Junior Secondary (Grades 7–9)',
    learningAreas: [
      { id: 'js_1', name: 'English', code: 'ENG', description: 'Advanced literature and communication' },
      { id: 'js_2', name: 'Kiswahili', code: 'KIS', description: 'Fasihi na lugha ya Kiswahili' },
      { id: 'js_3', name: 'Mathematics', code: 'MTH', description: 'Algebra, trigonometry, statistics' },
      { id: 'js_4', name: 'Integrated Science', code: 'SCI', description: 'Physics, chemistry, biology combined' },
      { id: 'js_5', name: 'Health Education', code: 'HE', description: 'Public health and human biology' },
      { id: 'js_6', name: 'Agriculture and Nutrition', code: 'AGR', description: 'Modern farming and food science' },
      { id: 'js_7', name: 'Social Studies', code: 'SST', description: 'History, civics, economics' },
      { id: 'js_8', name: 'Religious Education', code: 'RE', description: 'CRE / IRE / HRE' },
      { id: 'js_9', name: 'Pre-Technical Studies', code: 'PTS', description: 'Basic mechanics, woodwork, design' },
      { id: 'js_10', name: 'Computer Science', code: 'CS', description: 'Coding, algorithms, digital literacy' },
      { id: 'js_11', name: 'Creative Arts and Sports', code: 'CAS', description: 'Fine arts, sports science' }
    ]
  }
];

export const buildDefaultClusters = () => DEFAULT_CBC_CLUSTERS;

const initialSeedData = {
  feeStructures: initialFeeStructures,
  feePayments: initialFeePayments,
  examTypes: initialExamTypes,
  exams: initialExams,
  studyCorner: initialStudyCorner,
  libraryBooks: initialLibraryBooks,
  libraryLogs: initialLibraryLogs,
  grades: initialGrades,
  streams: initialStreams,
  learningAreas: initialLearningAreas,
  staff: initialStaff,
  learners: initialLearners,
  attendance: initialAttendance,
  marks: initialMarks,
  reportCards: initialReportCards,
  ictEquipment: initialIctEquipment,
  scienceInventory: initialScienceInventory,
  storeInventory: initialStoreInventory,
  settings: initialSettings
};

export default initialSeedData;
