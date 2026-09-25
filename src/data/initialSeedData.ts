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
  "students": [
    {
      "id": "1789881428012",
      "name": "FRED KAPONDI",
      "fullName": "FRED KAPONDI",
      "admissionNumber": "MUN-G1-002-2026",
      "admNo": "MUN-G1-002-2026",
      "assessmentNumber": "",
      "assessmentNo": "",
      "assessment": "",
      "gender": "Male",
      "grade": "GRADE 1",
      "stream": "GREEN",
      "parentName": "ANTONY MURIMA",
      "guardian": "ANTONY MURIMA",
      "phoneNumber": "0734525612",
      "phone": "0734525612",
      "createdAt": "2026-09-20T05:17:08.012Z"
    },
    {
      "id": "1789880616052",
      "name": "GRACE MUTHONI",
      "fullName": "GRACE MUTHONI",
      "admissionNumber": "MUN-G6-002-2026",
      "admNo": "MUN-G6-002-2026",
      "assessmentNumber": "A00345678",
      "assessmentNo": "A00345678",
      "assessment": "A00345678",
      "gender": "Female",
      "grade": "GRADE 6",
      "stream": "GREEN",
      "parentName": "MARY IKANYI",
      "guardian": "MARY IKANYI",
      "phoneNumber": "0734567345",
      "phone": "0734567345",
      "createdAt": "2026-09-20T05:03:36.052Z"
    },
    {
      "id": "1789880087460",
      "name": "BRIGHTON KIPKOECH",
      "fullName": "BRIGHTON KIPKOECH",
      "admissionNumber": "MUN-G6-001-2026",
      "admNo": "MUN-G6-001-2026",
      "assessmentNumber": "B003754306",
      "assessmentNo": "B003754306",
      "assessment": "B003754306",
      "gender": "Male",
      "grade": "GRADE 6",
      "stream": "BLUE",
      "parentName": "VIOLA JEPKORIR MAIYO",
      "guardian": "VIOLA JEPKORIR MAIYO",
      "phoneNumber": "0713345267",
      "phone": "0713345267",
      "createdAt": "2026-09-20T05:09:03.812Z"
    },
    {
      "id": "1789826147758",
      "name": "PETER MWANGI",
      "fullName": "PETER MWANGI",
      "admissionNumber": "MUN-G1-001-2026",
      "admNo": "MUN-G1-001-2026",
      "assessmentNumber": "",
      "assessmentNo": "",
      "assessment": "",
      "gender": "Female",
      "grade": "Grade 1",
      "stream": "North",
      "parentName": "ALICE WANJIRU",
      "guardian": "ALICE WANJIRU",
      "phoneNumber": "0789456778",
      "phone": "0789456778",
      "createdAt": "2026-09-19T13:55:47.758Z"
    }
  ],
  "staff": [
    {
      "name": "JAMES NDIKI",
      "nationalId": "ID-1789969050865",
      "email": "jndiki@munyaka.sc.ke",
      "phone": "0740583662",
      "tscNumber": "327775",
      "role": "ICT TECHNICIAN",
      "systemRole": "ict_technician",
      "department": "School Administration",
      "status": "Active",
      "id": "staff_1789969050866_xbcva",
      "full_name": "JAMES NDIKI",
      "staffId": "MUN-2430",
      "tempAccessCode": "134082",
      "joined": "2026-09-21",
      "assignedSubjects": []
    },
    {
      "name": "ALICE MAINA",
      "nationalId": "ID-1790072852855",
      "email": "maina@munyaka.sc.ke",
      "phone": "0722345567",
      "tscNumber": "1123345",
      "role": "CLASS TEACHER",
      "systemRole": "class_teacher",
      "department": "School Administration",
      "status": "Active",
      "id": "staff_1790072852855_fys7j",
      "full_name": "ALICE MAINA",
      "staffId": "MUN-4881",
      "tempAccessCode": "313167",
      "joined": "2026-09-22"
    },
    {
      "name": "ANN NDUTA MBUGUA",
      "nationalId": "ID-1790157907617",
      "email": "annmbugua@munyaka.sc.ke",
      "phone": "0724467137",
      "tscNumber": "452588",
      "role": "CLASS TEACHER",
      "systemRole": "class_teacher",
      "department": "School Administration",
      "status": "Active",
      "id": "staff_1790157907618_qk42q",
      "full_name": "ANN NDUTA MBUGUA",
      "staffId": "MUN-2020",
      "tempAccessCode": "443492",
      "joined": "2026-09-23"
    },
    {
      "name": "JANET GATHONI KUNGU",
      "nationalId": "ID-1790170127489",
      "email": "janetkungu@munyaka.sc.ke",
      "phone": "0720869310",
      "tscNumber": "487406",
      "role": "LIBRARIAN",
      "systemRole": "librarian",
      "department": "Library",
      "status": "Active",
      "id": "staff_1790170127489_uw96a",
      "full_name": "JANET GATHONI KUNGU",
      "staffId": "MUN-3433",
      "tempAccessCode": "774938",
      "joined": "2026-09-23"
    },
    {
      "name": "LAWRENCE NDEGWA GIOSHE",
      "nationalId": "ID-1790174007943",
      "email": "lndegwa@munyaka.sc.ke",
      "phone": "0720583097",
      "tscNumber": "516570",
      "role": "CLASS TEACHER",
      "systemRole": "class_teacher",
      "department": "School Administration",
      "status": "Active",
      "id": "staff_1790174007943_xtycd",
      "full_name": "LAWRENCE NDEGWA GIOSHE",
      "staffId": "MUN-1788",
      "tempAccessCode": "493306",
      "joined": "2026-09-23"
    }
  ],
  "attendance": {
    "Grade 4_Blue_2026-08-26_morning": {
      "session": "morning",
      "class": "Grade 4",
      "stream": "Blue",
      "date": "2026-08-26",
      "savedAt": "2026-08-26T07:05:17.006Z"
    },
    "Grade 4_all_2026-08-26_morning": {
      "session": "morning",
      "class": "Grade 4",
      "stream": "all",
      "date": "2026-08-26",
      "savedAt": "2026-08-26T07:13:13.158Z"
    },
    "Grade 6_all_2026-08-26_morning": {
      "session": "morning",
      "class": "Grade 6",
      "stream": "all",
      "date": "2026-08-26",
      "savedAt": "2026-08-26T08:56:37.698Z"
    }
  },
  "fees": []
};

(initialSeedData as any).learners = initialSeedData.students;

export const INITIAL_SEED_DATA = initialSeedData;

export const SEED_VERSION = "2026.09.25.FULL_PORTAL_v1";

export const initialAttendance = (initialSeedData as any).attendance || {};
export const initialIctEquipment = (initialSeedData as any).ictEquipment || (initialSeedData as any).ictLabEquipment || [];
export const initialScienceInventory = (initialSeedData as any).scienceInventory || (initialSeedData as any).scienceLabInventory || [];
export const initialStoreInventory = (initialSeedData as any).storeInventory || (initialSeedData as any).storeStock || [];
export const initialSettings = (initialSeedData as any).settings || (initialSeedData as any).schoolSettings || {};
export const initialNotices = (initialSeedData as any).notices || (initialSeedData as any).munyaka_notices || [];
export const initialEvents = [];
export const initialExams = (initialSeedData as any).exams || (initialSeedData as any).all_set_exams || (initialSeedData as any).question_bank || [];
export const initialExamSchedules = (initialSeedData as any).examSchedules || (initialSeedData as any).assessment_schedules || [];
export const initialExamTypes = (initialSeedData as any).examTypes || (initialSeedData as any).exam_types || [];
export const initialMarks = (initialSeedData as any).marks || (initialSeedData as any).assessments || (initialSeedData as any).marked_student_submissions || [];
export const initialQuestions = (initialSeedData as any).questions || (initialSeedData as any).question_bank || [];
export const initialLearners = initialSeedData.students || [];
export const initialStaff = initialSeedData.staff || [];
export const initialReportCards = (initialSeedData as any).reportCards || [];
export const initialFeeStructures = (initialSeedData as any).feeStructures || (initialSeedData as any).fees_structures || [];
export const initialFeePayments = (initialSeedData as any).fees || (initialSeedData as any).payments || [];
export const initialStudyCorner = (initialSeedData as any).studyCorner || (initialSeedData as any).study_materials || [];
export const initialLibraryBooks = (initialSeedData as any).libraryBooks || (initialSeedData as any).library_books || [];
export const initialLibraryLogs = (initialSeedData as any).libraryLogs || (initialSeedData as any).library_logs || [];
export const mockLearners = initialSeedData.students || [];
export const mockStudents = initialSeedData.students || [];
export const mockStaff = initialSeedData.staff || [];
export const initialGrades = (initialSeedData as any).grades || [];
export const initialStreams = (initialSeedData as any).streams || [];
export const initialClassAssignments = (initialSeedData as any).classAssignments || [];
export const mockExams = (initialSeedData as any).exams || [];
export const mockLibrary = (initialSeedData as any).libraryBooks || [];
export const mockFinances = (initialSeedData as any).fees || [];

export default initialSeedData;
