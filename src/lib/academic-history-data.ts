import { HistoricalAssessment, AssessmentType } from '@/types/academic-history';

export const MOCK_HISTORICAL_ASSESSMENTS: HistoricalAssessment[] = [
  // Grade 4 - Term 1 - Formative
  {
    id: 'h1',
    studentId: '1',
    subject: 'Mathematics',
    score: 85,
    performanceLevel: 'EE',
    comment: 'Excellent problem-solving skills demonstrated throughout the term.',
    assessmentType: 'Formative',
    gradeLevel: 'Grade 4',
    academicYear: '2023',
    term: 'Term 1',
    dateRecorded: '2023-04-15',
    isLocked: true
  },
  {
    id: 'h2',
    studentId: '1',
    subject: 'English',
    score: 72,
    performanceLevel: 'ME',
    comment: 'Good reading comprehension but needs improvement in creative writing.',
    assessmentType: 'Formative',
    gradeLevel: 'Grade 4',
    academicYear: '2023',
    term: 'Term 1',
    dateRecorded: '2023-04-15',
    isLocked: true
  },
  {
    id: 'h3',
    studentId: '1',
    subject: 'Science & Technology',
    score: 90,
    performanceLevel: 'EE',
    comment: 'Outstanding practical work and scientific inquiry skills.',
    assessmentType: 'Formative',
    gradeLevel: 'Grade 4',
    academicYear: '2023',
    term: 'Term 1',
    dateRecorded: '2023-04-15',
    isLocked: true
  },
  // Grade 4 - Term 1 - Summative
  {
    id: 'h4',
    studentId: '1',
    subject: 'Mathematics',
    score: 88,
    performanceLevel: 'EE',
    comment: 'Term-end exam showed mastery of all curriculum areas.',
    assessmentType: 'Summative',
    gradeLevel: 'Grade 4',
    academicYear: '2023',
    term: 'Term 1',
    dateRecorded: '2023-05-20',
    isLocked: true
  },
  {
    id: 'h5',
    studentId: '1',
    subject: 'English',
    score: 75,
    performanceLevel: 'ME',
    comment: 'Solid performance in grammar and comprehension sections.',
    assessmentType: 'Summative',
    gradeLevel: 'Grade 4',
    academicYear: '2023',
    term: 'Term 1',
    dateRecorded: '2023-05-20',
    isLocked: true
  },
  // Grade 4 - Term 1 - Report Card
  {
    id: 'h6',
    studentId: '1',
    subject: 'Overall Performance',
    score: 84,
    performanceLevel: 'EE',
    comment: 'Consistent high performance across all learning areas. Well done!',
    assessmentType: 'ReportCard',
    gradeLevel: 'Grade 4',
    academicYear: '2023',
    term: 'Term 1',
    dateRecorded: '2023-05-25',
    isLocked: true
  },
  // Grade 3 - Term 2 - Formative
  {
    id: 'h7',
    studentId: '1',
    subject: 'Kiswahili',
    score: 68,
    performanceLevel: 'ME',
    comment: 'Good participation in class activities and oral presentations.',
    assessmentType: 'Formative',
    gradeLevel: 'Grade 3',
    academicYear: '2022',
    term: 'Term 2',
    dateRecorded: '2022-10-10',
    isLocked: true
  },
  {
    id: 'h8',
    studentId: '1',
    subject: 'Mathematics',
    score: 78,
    performanceLevel: 'ME',
    comment: 'Shows good understanding of basic arithmetic operations.',
    assessmentType: 'Formative',
    gradeLevel: 'Grade 3',
    academicYear: '2022',
    term: 'Term 2',
    dateRecorded: '2022-10-10',
    isLocked: true
  },
  // Grade 3 - Term 2 - Summative
  {
    id: 'h9',
    studentId: '1',
    subject: 'Science & Technology',
    score: 82,
    performanceLevel: 'EE',
    comment: 'Excellent practical observation and recording skills.',
    assessmentType: 'Summative',
    gradeLevel: 'Grade 3',
    academicYear: '2022',
    term: 'Term 2',
    dateRecorded: '2022-11-15',
    isLocked: true
  },
  // Grade 3 - Term 2 - Report Card
  {
    id: 'h10',
    studentId: '1',
    subject: 'Overall Performance',
    score: 76,
    performanceLevel: 'ME',
    comment: 'A well-behaved student who consistently completes classwork.',
    assessmentType: 'ReportCard',
    gradeLevel: 'Grade 3',
    academicYear: '2022',
    term: 'Term 2',
    dateRecorded: '2022-11-20',
    isLocked: true
  },
  // Grade 2 - Term 3 - Formative
  {
    id: 'h11',
    studentId: '1',
    subject: 'English',
    score: 65,
    performanceLevel: 'ME',
    comment: 'Improving in reading fluency and vocabulary.',
    assessmentType: 'Formative',
    gradeLevel: 'Grade 2',
    academicYear: '2021',
    term: 'Term 3',
    dateRecorded: '2021-08-05',
    isLocked: true
  },
  {
    id: 'h12',
    studentId: '1',
    subject: 'Creative Arts',
    score: 88,
    performanceLevel: 'EE',
    comment: 'Very creative and artistic with excellent drawing skills.',
    assessmentType: 'Formative',
    gradeLevel: 'Grade 2',
    academicYear: '2021',
    term: 'Term 3',
    dateRecorded: '2021-08-05',
    isLocked: true
  },
  // Grade 2 - Term 3 - Summative
  {
    id: 'h13',
    studentId: '1',
    subject: 'Mathematics',
    score: 72,
    performanceLevel: 'ME',
    comment: 'Good understanding of addition and subtraction concepts.',
    assessmentType: 'Summative',
    gradeLevel: 'Grade 2',
    academicYear: '2021',
    term: 'Term 3',
    dateRecorded: '2021-09-10',
    isLocked: true
  },
  // Grade 2 - Term 3 - Report Card
  {
    id: 'h14',
    studentId: '1',
    subject: 'Overall Performance',
    score: 74,
    performanceLevel: 'ME',
    comment: 'A bright and cheerful student who is making good progress.',
    assessmentType: 'ReportCard',
    gradeLevel: 'Grade 2',
    academicYear: '2021',
    term: 'Term 3',
    dateRecorded: '2021-09-15',
    isLocked: true
  }
];