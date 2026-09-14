export interface ContentItem {
  id: string;
  title: string;
  strand: StrandCategory;
  subStrand?: string;
  topic?: string;
  grade: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  contentType: 'notes' | 'assessment' | 'flashcards' | 'quiz' | 'practical';
  body: string;
  attachment?: Attachment;
  assessmentType?: AssessmentType;
  totalMarks?: number | "";
  durationMinutes?: number | "";
  markingScheme?: Attachment;
  memoryVerses?: MemoryVerse[];
  revisionQuestions?: RevisionQuestion[];
  tags?: string[];
  [key: string]: any;
}

export type StrandCategory = 
  | 'Languages'
  | 'Mathematics'
  | 'Science & Technology'
  | 'Social Studies'
  | 'Creative Arts'
  | 'Religious Education'
  | 'Assessments & Quizzes'
  | string;

export type AssessmentType = 'quiz' | 'exam' | 'assignment' | 'practical' | 'oral';

export interface Attachment {
  name: string;
  url: string;
  type?: string;
}

export interface MemoryVerse {
  reference: string;
  verse: string;
  translation?: string;
}

export interface RevisionQuestion {
  id?: string;
  question: string;
  options?: string[];
  answer?: string;
  marks?: number;
}

export const strandCategories = [
  'Languages',
  'Mathematics',
  'Science & Technology',
  'Social Studies',
  'Creative Arts',
  'Religious Education',
  'Assessments & Quizzes'
] as const;

export const gradeLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const cbcStudyContent: ContentItem[] = [
  {
    id: 'mat-g4-01',
    title: 'Whole Numbers up to 10,000',
    strand: 'Mathematics',
    subStrand: 'Numbers',
    grade: 4,
    difficulty: 'beginner',
    contentType: 'notes',
    body: 'Understanding place value, reading and writing numbers up to 10,000 in words and figures.'
  },
  {
    id: 'sci-g5-01',
    title: 'The Digestive System',
    strand: 'Science & Technology',
    subStrand: 'Living Things',
    grade: 5,
    difficulty: 'intermediate',
    contentType: 'notes',
    body: 'Parts of the human digestive system and their functions.'
  }
];

export const initialSeedData = {
  students: [
    { id: '1', admNo: 'MUN/001', name: 'Amina Wangari', fullName: 'Amina Wangari', grade: 'Grade 4' },
    { id: '2', admNo: 'MUN/002', name: 'Brian Kiprono', fullName: 'Brian Kiprono', grade: 'Grade 5' }
  ],
  learners: [
    { id: '1', admNo: 'MUN/001', name: 'Amina Wangari', fullName: 'Amina Wangari', grade: 'Grade 4' },
    { id: '2', admNo: 'MUN/002', name: 'Brian Kiprono', fullName: 'Brian Kiprono', grade: 'Grade 5' }
  ],
  marks: [],
  staff: [
    { id: 'st-1', name: 'Teacher Grace', role: 'Mathematics Lead' }
  ],
  staffPrereg: [],
  grades: [
    { id: 'g-4', name: 'Grade 4' },
    { id: 'g-5', name: 'Grade 5' }
  ],
  examTypes: [
    { id: 'e-1', name: 'Mid Term Assessment' },
    { id: 'e-2', name: 'End Term Examination' }
  ],
  learningAreas: [
    { id: 'la-1', name: 'Mathematics' },
    { id: 'la-2', name: 'English' },
    { id: 'la-3', name: 'Science & Technology' }
  ],
  assessmentScores: {},
  fees: [],
  feeStructures: [],
  transactions: [],
  attendance: {},
  libraryBooks: [],
  ictAssets: [],
  notices: [],
  settings: {
    schoolName: 'Munyaka Primary School',
    term: 'Term 2',
    year: 2025
  },
  scienceLab: [],
  attendanceRecords: []
};

export const INITIAL_SEED_DATA = initialSeedData;
export const DEFAULT_CBC_CLUSTERS = [];
export const buildDefaultClusters = () => [];
export const assessmentTypeOptions = ['quiz', 'exam', 'assignment', 'practical', 'oral'];

export const mockLearners = initialSeedData.learners;
export const mockStudents = initialSeedData.students;
export const mockMarks = initialSeedData.marks;

export default initialSeedData;
