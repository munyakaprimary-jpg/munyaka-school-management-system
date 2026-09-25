/**
 * AUTO-GENERATED SEED DATA FOR MUNYAKA SCHOOL MANAGEMENT SYSTEM
 * Generated at: 2026-09-25T04:41:12.970Z
 * DO NOT EDIT DIRECTLY — Run "npm run export-seed" on the backend server to regenerate.
 */

export const initialFeeStructures = [
  {
    "id": "fs_1",
    "grade": "Grade 4",
    "term": "Term 1",
    "tuitionFee": 12000,
    "activityFee": 2500,
    "lunchFee": 4500,
    "total": 19000
  }
];
export const initialFees = [
  {
    "id": "fee_1",
    "studentId": "stu_1",
    "studentName": "Amina Kiprop",
    "amount": 15000,
    "term": "Term 1",
    "date": "2026-01-10",
    "status": "Completed"
  }
];
export const initialExamTypes = [
  {
    "id": "et_1",
    "name": "Formative Assessment",
    "weight": 30
  },
  {
    "id": "et_2",
    "name": "Mid-Term Exam",
    "weight": 30
  },
  {
    "id": "et_3",
    "name": "End-Term Exam",
    "weight": 40
  }
];
export const initialExams = [
  {
    "id": "asm_1",
    "title": "Grade 4 Mathematics Opener",
    "subject": "Mathematics",
    "classLevel": "Grade 4",
    "totalMarks": 50,
    "duration": 60,
    "status": "published",
    "questions": []
  }
];
export const initialStudyCorner = [
  {
    "id": "sc_1",
    "title": "Grade 4 Science Revision Notes",
    "subject": "Science & Technology",
    "category": "class_notes",
    "fileUrl": "#"
  }
];
export const initialLibrary = [
  {
    "id": "lib_1",
    "title": "Secondary Mathematics Bk 1",
    "author": "KLB",
    "isbn": "978-9966-10-001-1",
    "totalCopies": 10,
    "availableCopies": 8
  }
];
export const initialLibraryLogs = [
  {
    "id": "log_1",
    "bookId": "lib_1",
    "studentId": "stu_1",
    "issuedDate": "2026-02-01",
    "dueDate": "2026-02-15",
    "status": "issued"
  }
];
export const initialGrades = {
  "PP1": [
    "Stream A"
  ],
  "PP2": [
    "Stream A"
  ],
  "Grade 1": [
    "East",
    "West"
  ],
  "Grade 2": [
    "East",
    "West"
  ],
  "Grade 3": [
    "North",
    "South"
  ],
  "Grade 4": [
    "Green",
    "Blue"
  ],
  "Grade 5": [
    "Green",
    "Blue"
  ],
  "Grade 6": [
    "Gold",
    "Silver"
  ],
  "Grade 7": [
    "Alpha",
    "Beta"
  ],
  "Grade 8": [
    "Alpha",
    "Beta"
  ],
  "Grade 9": [
    "Alpha",
    "Beta"
  ]
};
export const initialStreams = [
  "Green",
  "Blue",
  "East",
  "West",
  "North",
  "South",
  "Gold",
  "Silver",
  "Alpha",
  "Beta"
];
export const initialLearningAreas = [
  {
    "id": "la_1",
    "name": "Mathematics",
    "tier": "upper-primary"
  },
  {
    "id": "la_2",
    "name": "English Language",
    "tier": "upper-primary"
  },
  {
    "id": "la_3",
    "name": "Kiswahili",
    "tier": "upper-primary"
  },
  {
    "id": "la_4",
    "name": "Science & Technology",
    "tier": "upper-primary"
  }
];
export const initialStaff = [
  {
    "id": "st_1",
    "name": "Teacher John Mwangi",
    "role": "teacher",
    "department": "ACADEMIC",
    "staffCategory": "TEACHING",
    "email": "john@munyaka.sc.ke"
  }
];
export const initialStudents = [
  {
    "id": "stu_1",
    "admissionNumber": "MUN/2026/001",
    "name": "Amina Kiprop",
    "grade": "Grade 4",
    "stream": "Green",
    "gender": "Female"
  }
];
export const initialLearners = initialStudents;
export const initialAttendance = {
  "2026-02-10": {
    "stu_1": "present"
  }
};
export const initialMarks = {
  "asm_1": {
    "stu_1": {
      "score": 45,
      "maxScore": 50,
      "grade": "EE"
    }
  }
};
export const initialReportCards = [];
export const initialIctLabEquipment = [];
export const initialScienceLabInventory = [];
export const initialStoreInventory = [];
export const initialSchoolSettings = {
  "schoolName": "Munyaka School",
  "county": "Uasin Gishu"
};

export const initialSeedData = {
  version: "v2.6.0",
  generatedAt: "2026-09-25T04:41:12.970Z",
  feeStructures: initialFeeStructures,
  fees: initialFees,
  examTypes: initialExamTypes,
  exams: initialExams,
  studyCorner: initialStudyCorner,
  libraryBooks: initialLibrary,
  libraryLogs: initialLibraryLogs,
  grades: initialGrades,
  streams: initialStreams,
  learningAreas: initialLearningAreas,
  staff: initialStaff,
  students: initialStudents,
  learners: initialStudents,
  attendance: initialAttendance,
  marks: initialMarks,
  reportCards: initialReportCards,
  ictLabEquipment: initialIctLabEquipment,
  scienceLabInventory: initialScienceLabInventory,
  storeInventory: initialStoreInventory,
  schoolSettings: initialSchoolSettings,
};

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
export const mockLearners = initialStudents;
export const mockStudents = initialStudents;
export const mockStaff = initialStaff;
export const mockExams = initialExams;
export const mockLibrary = initialLibrary;
export const mockFinances = initialFees;

export default initialSeedData;
