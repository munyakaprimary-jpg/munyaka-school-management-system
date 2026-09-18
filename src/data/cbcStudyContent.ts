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

export interface AttItem {
  id: string;
  title: string;
  url: string;
  type: string;
}

export type AssessmentType = 'quiz' | 'exam' | 'assignment';

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

export const cbcStudyContent = [];
export type ContentItem = CI;
export type StrandCategory = SC;
export type Attachment = Att;
export default cbcStudyContent;
