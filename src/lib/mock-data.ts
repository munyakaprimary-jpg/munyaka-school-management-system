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
    accessCode: '7A9K2',
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
    accessCode: '3H5M8',
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
    accessCode: '5A1X9',
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
    accessCode: '4P9X1',
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
    accessCode: '9K2J5',
    status: 'Active',
    createdAt: '2023-04-05T11:05:00.000Z'
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
