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
    id: 'staff_1',
    name: 'Mrs. Mary Atieno',
    category: 'Teaching Staff',
    tscNumber: 'TSC-884920',
    email: 'mary.atieno@school.ac.ke',
    phone: '+254 722 890 123',
    subjects: ['Mathematics', 'Science and Technology'],
    assignedClasses: ['Grade 4', 'Grade 5'],
    assignedStreams: ['Blue', 'Red'],
    accessCode: 'MUN-7A9K',
    status: 'Active',
    createdAt: '2023-01-15T08:00:00.000Z'
  },
  {
    id: 'staff_2',
    name: 'Mr. John Kiprop',
    category: 'Teaching Staff',
    tscNumber: 'TSC-910432',
    email: 'john.kiprop@school.ac.ke',
    phone: '+254 733 456 789',
    subjects: ['English Language', 'Social Studies'],
    assignedClasses: ['Grade 6'],
    assignedStreams: ['Green'],
    accessCode: 'MUN-3H5M',
    status: 'Active',
    createdAt: '2023-02-10T09:15:00.000Z'
  },
  {
    id: 'staff_3',
    name: 'Sister Clara Nafula',
    category: 'Administration',
    tscNumber: 'TSC-551209',
    email: 'clara.nafula@school.ac.ke',
    phone: '+254 701 112 233',
    subjects: [],
    accessCode: 'MUN-5A1X',
    status: 'Active',
    createdAt: '2022-11-01T10:00:00.000Z'
  },
  {
    id: 'staff_4',
    name: 'Mr. David Owino',
    category: 'Teaching Staff',
    tscNumber: 'TSC-775612',
    email: 'david.owino@school.ac.ke',
    phone: '+254 711 223 344',
    subjects: ['Kiswahili Lugha', 'Religious Education (CRE/IRE/HRE)'],
    assignedClasses: ['Grade 7', 'Grade 8'],
    assignedStreams: ['Blue'],
    accessCode: 'MUN-4P9X',
    status: 'Active',
    createdAt: '2023-03-22T14:20:00.000Z'
  },
  {
    id: 'staff_5',
    name: 'Mrs. Jane Koech',
    category: 'Support Staff',
    tscNumber: 'N/A',
    email: 'jane.koech@school.ac.ke',
    phone: '+254 755 667 788',
    subjects: [],
    accessCode: 'MUN-9K2J',
    status: 'Active',
    createdAt: '2023-04-05T11:05:00.000Z'
  }
];

export const MOCK_STAFF = defaultMockStaff;

export const mockStudentsList: any[] = [];
