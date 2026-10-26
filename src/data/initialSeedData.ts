export const SEED_VERSION = "BUILD_OFFLINE_CLEAN_1791374548780";

export const DEFAULT_CBC_CLUSTERS = [
  {
    id: "cluster_1",
    name: "Languages & Literacy",
    description: "English, Kiswahili, Indigenous Languages, Foreign Languages",
    color: "bg-indigo-500",
    icon: "BookOpen",
    learningAreas: [
      { id: "la_eng", name: "English Language Activities", code: "ENG-01", category: "Core", gradeLevels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"] },
      { id: "la_kisw", name: "Kiswahili Language Activities", code: "KISW-01", category: "Core", gradeLevels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"] }
    ]
  },
  {
    id: "cluster_2",
    name: "Mathematics & Science",
    description: "Mathematics, Integrated Science, Health Education",
    color: "bg-emerald-500",
    icon: "Calculator",
    learningAreas: [
      { id: "la_math", name: "Mathematics Activities", code: "MATH-01", category: "Core", gradeLevels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"] },
      { id: "la_sci", name: "Integrated Science", code: "SCI-01", category: "Core", gradeLevels: ["Grade 4", "Grade 5", "Grade 6"] }
    ]
  }
];

export const buildDefaultClusters = () => DEFAULT_CBC_CLUSTERS;

export const initialSeedData = {
  "version": SEED_VERSION,
  "grades": [
    { "id": "g_pp1", "name": "PP1", "streams": ["BLUE", "GREEN", "RED"] },
    { "id": "g_pp2", "name": "PP2", "streams": ["BLUE", "GREEN", "RED"] },
    { "id": "g_1", "name": "Grade 1", "streams": ["RED", "GREEN", "YELLOW"] },
    { "id": "g_2", "name": "Grade 2", "streams": ["RED", "GREEN", "YELLOW"] },
    { "id": "g_3", "name": "Grade 3", "streams": ["RED", "GREEN", "YELLOW"] },
    { "id": "g_4", "name": "Grade 4", "streams": ["RED", "GREEN", "YELLOW"] },
    { "id": "g_5", "name": "Grade 5", "streams": ["RED", "GREEN", "YELLOW"] },
    { "id": "g_6", "name": "Grade 6", "streams": ["RED", "GREEN", "YELLOW"] },
    { "id": "g_7", "name": "Grade 7", "streams": ["RED", "GREEN", "YELLOW"] },
    { "id": "g_8", "name": "Grade 8", "streams": ["RED", "GREEN", "YELLOW"] },
    { "id": "g_9", "name": "Grade 9", "streams": ["RED", "GREEN", "YELLOW"] }
  ],
  "streams": ["BLUE", "RED", "GREEN", "YELLOW"],
  "configured_streams": [
    { "id": "g_pp1", "name": "PP1", "streams": ["BLUE", "GREEN", "RED"] },
    { "id": "g_pp2", "name": "PP2", "streams": ["BLUE", "GREEN", "RED"] },
    { "id": "g_1", "name": "Grade 1", "streams": ["RED", "GREEN", "YELLOW"] },
    { "id": "g_2", "name": "Grade 2", "streams": ["RED", "GREEN", "YELLOW"] },
    { "id": "g_3", "name": "Grade 3", "streams": ["RED", "GREEN", "YELLOW"] },
    { "id": "g_4", "name": "Grade 4", "streams": ["RED", "GREEN", "YELLOW"] },
    { "id": "g_5", "name": "Grade 5", "streams": ["RED", "GREEN", "YELLOW"] },
    { "id": "g_6", "name": "Grade 6", "streams": ["RED", "GREEN", "YELLOW"] },
    { "id": "g_7", "name": "Grade 7", "streams": ["RED", "GREEN", "YELLOW"] },
    { "id": "g_8", "name": "Grade 8", "streams": ["RED", "GREEN", "YELLOW"] },
    { "id": "g_9", "name": "Grade 9", "streams": ["RED", "GREEN", "YELLOW"] }
  ],
  "learners": [],
  "staff": [],
  "fees": [],
  "attendance": {},
  "examTypes": [],
  "libraryBooks": [],
  "feeStructures": [],
  "notices": [],
  "settings": {}
};

(initialSeedData as any).learners = [];
delete (initialSeedData as any).students;

export const INITIAL_SEED_DATA = initialSeedData;

export const initialAttendance = {};
export const initialIctEquipment = [];
export const initialScienceInventory = [];
export const initialStoreInventory = [];
export const initialSettings = {};
export const initialNotices = [];
export const initialEvents = [];
export const initialExams = [];
export const initialExamSchedules = [];
export const initialExamTypes = [];
export const initialMarks = [];
export const initialQuestions = [];
export const initialLearners = [];
export const initialReportCards = [];
export const initialFeeStructures = [];
export const initialFeePayments = [];
export const initialStudyCorner = [];
export const initialLibraryBooks = [];
export const initialLibraryLogs = [];
export const initialGrades = initialSeedData.grades;
export const initialStreams = initialSeedData.streams;
export const initialConfiguredStreams = initialSeedData.configured_streams;
export const initialClassAssignments = [];
export const mockExams = [];
export const mockLibrary = [];
export const mockFinances = [];

export default initialSeedData;
