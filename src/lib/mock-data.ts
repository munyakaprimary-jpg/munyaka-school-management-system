export interface Student {
  id: string;
  name: string;
  admissionNo: string;
  grade: 'PP1' | 'PP2' | 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Grade 4' | 'Grade 5' | 'Grade 6' | 'Grade 7' | 'Grade 8';
  stream: 'Blue' | 'Red' | 'Green';
  gender: 'M' | 'F';
  parentName: string;
  parentContact: string;
  assessmentScores?: Record<string, number>; // subject -> marks
}

export interface StreamInfo {
  id: string;
  name: string;
  teacher?: string;
  studentsCount: number;
}

export interface GradeInfo {
  id: string;
  name: string;
  category?: 'Pre-Primary' | 'Primary' | 'Junior School';
  streams: StreamInfo[];
  studentsCount: number;
  streamCount: number;
}

export const GRADES_DATA: GradeInfo[] = [
  { id: 'pp1', name: 'PP1', category: 'Pre-Primary', streams: [{ id: 's1', name: 'Blue', teacher: 'Unassigned', studentsCount: 21 }, { id: 's2', name: 'Red', teacher: 'Unassigned', studentsCount: 21 }], studentsCount: 42, streamCount: 2 },
  { id: 'pp2', name: 'PP2', category: 'Pre-Primary', streams: [{ id: 's3', name: 'Blue', teacher: 'Unassigned', studentsCount: 22 }, { id: 's4', name: 'Red', teacher: 'Unassigned', studentsCount: 23 }], studentsCount: 45, streamCount: 2 },
  { id: 'grade-1', name: 'Grade 1', category: 'Primary', streams: [{ id: 's5', name: 'Blue', teacher: 'Unassigned', studentsCount: 18 }, { id: 's6', name: 'Red', teacher: 'Unassigned', studentsCount: 18 }, { id: 's7', name: 'Green', teacher: 'Unassigned', studentsCount: 18 }], studentsCount: 54, streamCount: 3 },
  { id: 'grade-2', name: 'Grade 2', category: 'Primary', streams: [{ id: 's8', name: 'Blue', teacher: 'Unassigned', studentsCount: 16 }, { id: 's9', name: 'Red', teacher: 'Unassigned', studentsCount: 16 }, { id: 's10', name: 'Green', teacher: 'Unassigned', studentsCount: 16 }], studentsCount: 48, streamCount: 3 },
  { id: 'grade-3', name: 'Grade 3', category: 'Primary', streams: [{ id: 's11', name: 'Blue', teacher: 'Unassigned', studentsCount: 17 }, { id: 's12', name: 'Red', teacher: 'Unassigned', studentsCount: 17 }, { id: 's13', name: 'Green', teacher: 'Unassigned', studentsCount: 18 }], studentsCount: 52, streamCount: 3 },
  { id: 'grade-4', name: 'Grade 4', category: 'Primary', streams: [{ id: 's14', name: 'Blue', teacher: 'Unassigned', studentsCount: 17 }, { id: 's15', name: 'Red', teacher: 'Unassigned', studentsCount: 16 }, { id: 's16', name: 'Green', teacher: 'Unassigned', studentsCount: 17 }], studentsCount: 50, streamCount: 3 },
  { id: 'grade-5', name: 'Grade 5', category: 'Primary', streams: [{ id: 's17', name: 'Blue', teacher: 'Unassigned', studentsCount: 15 }, { id: 's18', name: 'Red', teacher: 'Unassigned', studentsCount: 15 }, { id: 's19', name: 'Green', teacher: 'Unassigned', studentsCount: 16 }], studentsCount: 46, streamCount: 3 },
  { id: 'grade-6', name: 'Grade 6', category: 'Primary', streams: [{ id: 's20', name: 'Blue', teacher: 'Unassigned', studentsCount: 18 }, { id: 's21', name: 'Red', teacher: 'Unassigned', studentsCount: 18 }, { id: 's22', name: 'Green', teacher: 'Unassigned', studentsCount: 19 }], studentsCount: 55, streamCount: 3 },
  { id: 'grade-7', name: 'Grade 7', category: 'Junior School', streams: [{ id: 's23', name: 'Blue', teacher: 'Unassigned', studentsCount: 16 }, { id: 's24', name: 'Red', teacher: 'Unassigned', studentsCount: 16 }, { id: 's25', name: 'Green', teacher: 'Unassigned', studentsCount: 16 }], studentsCount: 48, streamCount: 3 },
  { id: 'grade-8', name: 'Grade 8', category: 'Junior School', streams: [{ id: 's26', name: 'Blue', teacher: 'Unassigned', studentsCount: 14 }, { id: 's27', name: 'Red', teacher: 'Unassigned', studentsCount: 14 }, { id: 's28', name: 'Green', teacher: 'Unassigned', studentsCount: 14 }], studentsCount: 42, streamCount: 3 },
  { id: 'grade-9', name: 'Grade 9', category: 'Junior School', streams: [{ id: 's29', name: 'Blue', teacher: 'Unassigned', studentsCount: 19 }, { id: 's30', name: 'Red', teacher: 'Unassigned', studentsCount: 19 }], studentsCount: 38, streamCount: 2 }
];

export const STREAM_NAMES = ['Blue', 'Red', 'Green', 'East', 'West'];

export const ASSESSMENT_TYPES = ['Opener Exam', 'Mid-Term Exam', 'End-Term Exam'];

export const defaultCbcLearningAreas = [
  'Mathematics',
  'English Language',
  'Kiswahili Lugha',
  'Science and Technology',
  'Social Studies',
  'Religious Education (CRE/IRE/HRE)',
  'Creative Arts',
  'Physical Education and Sports',
  'Agriculture and Nutrition',
  'Pre-Technical Studies'
];

export const defaultSchoolSubjects = [
  'Mathematics',
  'English Language',
  'Kiswahili Lugha',
  'Science and Technology',
  'Social Studies',
  'Religious Education (CRE/IRE/HRE)',
  'Creative Arts',
  'Physical Education and Sports',
  'Agriculture and Nutrition',
  'Pre-Technical Studies'
];

export const defaultMockStaff = [
  {
    id: "staff_t001",
    staffId: "T001",
    name: "JANE WANJIKU",
    email: "jane.wanjiku@munyaka.ac.ke",
    phone: "+254712345678",
    role: "teacher",
    category: "Subject Teacher",
    designation: "Senior Teacher",
    department: "Mathematics",
    gender: "Female",
    status: "Active",
    employmentType: "Permanent",
    tscNumber: "TSC123456",
    nationalId: "23456789",
    dateJoined: "2020-01-15",
    accessCode: "MUN-1234"
  },
  {
    id: "staff_t002",
    staffId: "T002",
    name: "JOHN OMONDI",
    email: "john.omondi@munyaka.ac.ke",
    phone: "+254722334455",
    role: "teacher",
    category: "Class Teacher",
    designation: "Class Teacher",
    department: "Science",
    gender: "Male",
    status: "Active",
    employmentType: "Permanent",
    tscNumber: "TSC654321",
    nationalId: "34567890",
    dateJoined: "2021-05-10",
    accessCode: "MUN-5678"
  },
  {
    id: "staff_t003",
    staffId: "T003",
    name: "GRACE ACHIENG",
    email: "grace.achieng@munyaka.ac.ke",
    phone: "+254733445566",
    role: "teacher",
    category: "Subject Teacher",
    designation: "Subject Teacher",
    department: "Languages",
    gender: "Female",
    status: "Active",
    employmentType: "Contract",
    tscNumber: "TSC789012",
    nationalId: "45678901",
    dateJoined: "2022-09-01",
    accessCode: "MUN-9012"
  },
  {
    id: "staff_t004",
    staffId: "T004",
    name: "DAVID KIPRONO",
    email: "david.kiprono@munyaka.ac.ke",
    phone: "+254755889900",
    role: "teacher",
    category: "Class Teacher",
    designation: "Class Teacher",
    department: "Humanities",
    gender: "Male",
    status: "Active",
    employmentType: "Permanent",
    tscNumber: "TSC445566",
    nationalId: "33445566",
    dateJoined: "2021-01-10",
    accessCode: "MUN-3456"
  },
  {
    id: "staff_t005",
    staffId: "T005",
    name: "ESTHER NYAMBURA",
    email: "esther.nyambura@munyaka.ac.ke",
    phone: "+254766990011",
    role: "teacher",
    category: "Subject Teacher",
    designation: "Subject Teacher",
    department: "Creative Arts",
    gender: "Female",
    status: "Active",
    employmentType: "Permanent",
    tscNumber: "TSC334455",
    nationalId: "22334455",
    dateJoined: "2022-02-15",
    accessCode: "MUN-7890"
  },
  {
    id: "staff_l001",
    staffId: "L001",
    name: "PETER KAMAU",
    email: "peter.kamau@munyaka.ac.ke",
    phone: "+254744556677",
    role: "librarian",
    category: "Store Master",
    designation: "Librarian",
    department: "Library",
    gender: "Male",
    status: "Active",
    employmentType: "Permanent",
    tscNumber: "TSC998877",
    nationalId: "56789012",
    dateJoined: "2019-03-20",
    accessCode: "MUN-1122"
  },
  {
    id: "staff_a001",
    staffId: "A001",
    name: "ALICE MUTUA",
    email: "alice.mutua@munyaka.ac.ke",
    phone: "+254755667788",
    role: "admin",
    category: "HOI",
    designation: "Administrator",
    department: "Administration",
    gender: "Female",
    status: "Active",
    employmentType: "Permanent",
    tscNumber: "TSC112233",
    nationalId: "67890123",
    dateJoined: "2018-06-11",
    accessCode: "MUN-3344"
  }
];

export const MOCK_STAFF = defaultMockStaff;

export const mockStudentsList = [
  {
    id: 'std_1',
    name: 'Abdi Hassan Ibrahim',
    admissionNo: 'ADM/2023/1004',
    grade: 'Grade 4',
    stream: 'Blue',
    gender: 'M',
    parentName: 'Hassan Ibrahim',
    parentContact: '+254 711 000 111',
    assessmentScores: {
      'Mathematics': 84,
      'English Language': 76,
      'Kiswahili Lugha': 72,
      'Science and Technology': 80,
      'Social Studies': 78,
      'Religious Education (CRE/IRE/HRE)': 85,
      'Creative Arts': 70,
      'Physical Education and Sports': 90,
      'Agriculture and Nutrition': 88,
      'Pre-Technical Studies': 75
    }
  },
  {
    id: 'std_2',
    name: 'Belinda Cherotich',
    admissionNo: 'ADM/2023/1012',
    grade: 'Grade 4',
    stream: 'Blue',
    gender: 'F',
    parentName: 'Wesley Kiprop',
    parentContact: '+254 722 000 222',
    assessmentScores: {
      'Mathematics': 92,
      'English Language': 88,
      'Kiswahili Lugha': 85,
      'Science and Technology': 90,
      'Social Studies': 86,
      'Religious Education (CRE/IRE/HRE)': 94,
      'Creative Arts': 82,
      'Physical Education and Sports': 95,
      'Agriculture and Nutrition': 91,
      'Pre-Technical Studies': 89
    }
  },
  {
    id: 'std_3',
    name: 'Caleb Wanjala Wafula',
    admissionNo: 'ADM/2023/1029',
    grade: 'Grade 4',
    stream: 'Blue',
    gender: 'M',
    parentName: 'Moses Wafula',
    parentContact: '+254 733 000 333',
    assessmentScores: {
      'Mathematics': 65,
      'English Language': 70,
      'Kiswahili Lugha': 62,
      'Science and Technology': 68,
      'Social Studies': 74,
      'Religious Education (CRE/IRE/HRE)': 71,
      'Creative Arts': 75,
      'Physical Education and Sports': 85,
      'Agriculture and Nutrition': 70,
      'Pre-Technical Studies': 66
    }
  },
  {
    id: 'std_4',
    name: 'Diana Mwende Musyoka',
    admissionNo: 'ADM/2023/1043',
    grade: 'Grade 4',
    stream: 'Blue',
    gender: 'F',
    parentName: 'Stephen Musyoka',
    parentContact: '+254 744 000 444',
    assessmentScores: {
      'Mathematics': 78,
      'English Language': 82,
      'Kiswahili Lugha': 80,
      'Science and Technology': 75,
      'Social Studies': 79,
      'Religious Education (CRE/IRE/HRE)': 83,
      'Creative Arts': 88,
      'Physical Education and Sports': 80,
      'Agriculture and Nutrition': 76,
      'Pre-Technical Studies': 81
    }
  },
  {
    id: 'std_5',
    name: 'Emmanuel Kipkemboi',
    admissionNo: 'ADM/2023/1055',
    grade: 'Grade 4',
    stream: 'Blue',
    gender: 'M',
    parentName: 'David Kipkemboi',
    parentContact: '+254 755 000 555',
    assessmentScores: {
      'Mathematics': 58,
      'English Language': 60,
      'Kiswahili Lugha': 55,
      'Science and Technology': 64,
      'Social Studies': 59,
      'Religious Education (CRE/IRE/HRE)': 65,
      'Creative Arts': 72,
      'Physical Education and Sports': 78,
      'Agriculture and Nutrition': 62,
      'Pre-Technical Studies': 57
    }
  },
  {
    id: 'std_6',
    name: 'Fatuma Zaruni',
    admissionNo: 'ADM/2023/1067',
    grade: 'Grade 5',
    stream: 'Red',
    gender: 'F',
    parentName: 'Zaruni Ali',
    parentContact: '+254 766 000 666',
    assessmentScores: {
      'Mathematics': 81,
      'English Language': 85,
      'Kiswahili Lugha': 91,
      'Science and Technology': 83,
      'Social Studies': 80,
      'Religious Education (CRE/IRE/HRE)': 88,
      'Creative Arts': 85,
      'Physical Education and Sports': 82,
      'Agriculture and Nutrition': 84,
      'Pre-Technical Studies': 79
    }
  },
  {
    id: 'std_7',
    name: 'George Ndung\'u',
    admissionNo: 'ADM/2023/1078',
    grade: 'Grade 5',
    stream: 'Red',
    gender: 'M',
    parentName: 'James Ndung\'u',
    parentContact: '+254 777 000 777',
    assessmentScores: {
      'Mathematics': 73,
      'English Language': 69,
      'Kiswahili Lugha': 70,
      'Science and Technology': 75,
      'Social Studies': 72,
      'Religious Education (CRE/IRE/HRE)': 74,
      'Creative Arts': 78,
      'Physical Education and Sports': 88,
      'Agriculture and Nutrition': 71,
      'Pre-Technical Studies': 70
    }
  }
];
