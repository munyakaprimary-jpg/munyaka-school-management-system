export interface SC {
  id: string;
  name: string;
}

export interface Att {
  id: string;
  url: string;
  title?: string;
  type?: string;
  name?: string;
  size?: number;
  dataUrl?: string;
}

export interface CI {
  id: string;
  title: string;
  description: string;
  strand?: string;
  subStrand?: string;
  topic?: string;
  summary?: string;
  grade?: number | string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  assessmentType?: string;
  totalMarks?: number;
  durationMinutes?: number;
  attachment?: Att;
  markingScheme?: Att;
  notes?: string;
  memoryVerses?: MemoryVerse[];
  revisionQuestions?: RevisionQuestion[];
  tags?: string[];
  category?: string;
}

export type ContentItem = CI;
export type StrandCategory = string;
export type Attachment = Att;

export const strandCategories: SC[] = [
  { id: '1', name: 'Mathematics' },
  { id: '2', name: 'English' },
  { id: '3', name: 'Kiswahili' },
  { id: '4', name: 'Science & Technology' },
  { id: '5', name: 'Social Studies' },
  { id: '6', name: 'CRE' }
];

export const gradeLevels: string[] = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
export const assessmentTypeOptions: string[] = ['quiz', 'exam', 'assignment'];

export interface MemoryVerse {
  id: string;
  reference: string;
  verse: string;
}

export interface RevisionQuestion {
  id: string;
  question: string;
  options?: string[];
  answer: string;
}

export type AssessmentType = string;

export const cbcStudyContent: CI[] = [];
export default cbcStudyContent;
