export const initialSeedData = {
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
    },
    {
      id: "1-003",
      admNo: "B004761829",
      name: "SAMWEL KAMAU WANJIKU",
      fullName: "SAMWEL KAMAU WANJIKU",
      grade: "Grade 6",
      stream: "Yellow",
      status: "Active",
      gender: "Male",
      attendanceStatus: "Late",
      guardian: "MARY WANJIKU WAIRIMU",
      phone: "0719182804"
    },
    {
      id: "1-006",
      admNo: "B004276095",
      name: "ALFRED JUMA",
      fullName: "ALFRED JUMA",
      grade: "Grade 6",
      stream: "East",
      status: "Active",
      gender: "Male",
      attendanceStatus: "Unmarked",
      guardian: "PHANICE NASIMIYU KIRISWA",
      phone: "0141893904"
    },
    {
      id: "1-007",
      admNo: "B005110023",
      name: "BRIAN KIPTOO",
      fullName: "BRIAN KIPTOO",
      grade: "Grade 7",
      stream: "VENUS",
      status: "Suspended",
      gender: "Male",
      attendanceStatus: "Unmarked",
      guardian: "MARY KIPTOO",
      phone: "0722001122"
    },
    {
      id: "1-008",
      admNo: "B005233114",
      name: "MARY ATIENO",
      fullName: "MARY ATIENO",
      grade: "Grade 5",
      stream: "Blue",
      status: "Active",
      gender: "Female",
      attendanceStatus: "Present",
      guardian: "JOHN ATIENO",
      phone: "0711002233"
    },
    {
      id: "1-009",
      admNo: "MUN-G6-001/2021",
      name: "SAMSON KIBET",
      fullName: "SAMSON KIBET",
      grade: "Grade 6",
      stream: "Blue",
      gender: "Male",
      assessmentNo: "A0997890",
      birthCertNo: "1442008976",
      status: "Active",
      attendanceStatus: "Present",
      guardian: "ALICE KIBET",
      phone: "0700000000"
    }
  ],
  learners: [],
  staff: [],
  exams: [],
  marks: [],
  cbcAssessments: [],
  libraryBooks: [],
  ictAssets: [],
  feeStructures: [],
  transactions: []
};

// Mirror learners list automatically
(initialSeedData as any).learners = initialSeedData.students;

export const INITIAL_SEED_DATA = initialSeedData;

// Export explicit named components to prevent import errors
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