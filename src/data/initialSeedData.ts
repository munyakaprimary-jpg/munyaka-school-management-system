export interface ContentItem {
  id: string;
  title: string;
  strand: string;
  subStrand?: string;
  topic?: string;
  grade: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  contentType: 'notes' | 'assessment' | 'flashcards' | 'quiz' | 'practical';
  body: string;
  attachment?: { name: string; url: string; size?: number; type?: string };
  assessmentType?: string;
  totalMarks?: number | "";
  durationMinutes?: number | "";
  markingScheme?: { name: string; url: string; size?: number; type?: string };
  memoryVerses?: { reference: string; text: string }[];
  revisionQuestions?: { question: string; answer?: string; rubric?: string }[];
  tags?: string[];
  [key: string]: any;
}

export type StrandCategory = string;
export type AssessmentType = string;
export type Attachment = { name: string; url: string; size?: number; type?: string };
export type MemoryVerse = { reference: string; text: string };
export type RevisionQuestion = { question: string; answer?: string; rubric?: string };

export const strandCategories = [
  'Languages',
  'Mathematics',
  'Science & Technology',
  'Social Studies',
  'Creative Arts',
  'Religious Education',
  'Assessments & Quizzes'
];

export const gradeLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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
  staff: [],
  staffPrereg: [],
  grades: [],
  examTypes: [],
  learningAreas: [],
  assessmentScores: {},
  fees: [],
  feeStructures: [],
  transactions: [],
  attendance: {},
  libraryBooks: [],
  ictAssets: [],
  notices: [],
  settings: {}
};

export const INITIAL_SEED_DATA = initialSeedData as any;
export const DEFAULT_CBC_CLUSTERS = [];
export const buildDefaultClusters = () => [];
export const assessmentTypeOptions = ['quiz', 'exam', 'assignment', 'practical', 'oral'];

export const mockLearners = initialSeedData.learners;
export const mockStudents = initialSeedData.students;
export const mockMarks = initialSeedData.marks;

export default initialSeedData;
