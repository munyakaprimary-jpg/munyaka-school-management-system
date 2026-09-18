export interface CI {
  id: string;
  title: string;
  description: string;
}

export interface SC {
  id: string;
  name: string;
}

export interface Att {
  id: string;
  url: string;
}

export type ContentItem = CI;
export type StrandCategory = SC;
export type Attachment = Att;

export const strandCategories: SC[] = [];
export const gradeLevels: string[] = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
export const assessmentTypeOptions = ['quiz', 'exam', 'assignment'];

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

export const cbcStudyContent: CI[] = [];
export default cbcStudyContent;
