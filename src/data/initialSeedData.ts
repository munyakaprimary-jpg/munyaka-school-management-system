export const initialSeedData = {
  "students": [
    {
      "id": "1789839549470",
      "name": "BRIGHTON KIPKOECH",
      "fullName": "BRIGHTON KIPKOECH",
      "admissionNumber": "MUN-G6-003-2026",
      "admNo": "MUN-G6-003-2026",
      "assessmentNumber": "B003754306",
      "assessmentNo": "B003754306",
      "assessment": "B003754306",
      "gender": "Female",
      "grade": "GRADE 6",
      "stream": "BLUE",
      "parentName": "VIOLA JEPKORIR MAIYO",
      "guardian": "VIOLA JEPKORIR MAIYO",
      "phoneNumber": "0713245346",
      "phone": "0713245346",
      "createdAt": "2026-09-19T17:40:36.063Z"
    },
    {
      "id": "1789838992270",
      "name": "MICHAEL GICHUHI",
      "fullName": "MICHAEL GICHUHI",
      "admissionNumber": "MUN-G6-002-2026",
      "admNo": "MUN-G6-002-2026",
      "assessmentNumber": "B004822872",
      "assessmentNo": "B004822872",
      "assessment": "B004822872",
      "gender": "Female",
      "grade": "GRADE 6",
      "stream": "BLUE",
      "parentName": "EVANS GICHUHI",
      "guardian": "EVANS GICHUHI",
      "phoneNumber": "0713652254",
      "phone": "0713652254",
      "createdAt": "2026-09-19T17:34:03.103Z"
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
  "learners": [
    {
      "id": "1789839549470",
      "name": "BRIGHTON KIPKOECH",
      "fullName": "BRIGHTON KIPKOECH",
      "admissionNumber": "MUN-G6-003-2026",
      "admNo": "MUN-G6-003-2026",
      "assessmentNumber": "B003754306",
      "assessmentNo": "B003754306",
      "assessment": "B003754306",
      "gender": "Female",
      "grade": "GRADE 6",
      "stream": "BLUE",
      "parentName": "VIOLA JEPKORIR MAIYO",
      "guardian": "VIOLA JEPKORIR MAIYO",
      "phoneNumber": "0713245346",
      "phone": "0713245346",
      "createdAt": "2026-09-19T17:40:36.063Z"
    },
    {
      "id": "1789838992270",
      "name": "MICHAEL GICHUHI",
      "fullName": "MICHAEL GICHUHI",
      "admissionNumber": "MUN-G6-002-2026",
      "admNo": "MUN-G6-002-2026",
      "assessmentNumber": "B004822872",
      "assessmentNo": "B004822872",
      "assessment": "B004822872",
      "gender": "Female",
      "grade": "GRADE 6",
      "stream": "BLUE",
      "parentName": "EVANS GICHUHI",
      "guardian": "EVANS GICHUHI",
      "phoneNumber": "0713652254",
      "phone": "0713652254",
      "createdAt": "2026-09-19T17:34:03.103Z"
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
  "staff": [],
  "exams": [],
  "libraryBooks": [],
  "transactions": []
};

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
