export type QuestionType = 'mcq' | 'structured';

export interface MCQOption {
  id: string;
  label: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  // Common fields
  prompt: string;
  points: number;
  order: number;
  // MCQ specific
  options?: MCQOption[];
  correctOptionId?: string;
  // Structured specific
  modelAnswer?: string;
  rubric?: string;
}

export interface Assessment {
  id: string;
  configId?: string;
  title: string;
  category: string;
  classLevel: string;
  subject: string;
  duration: number;
  totalMarks: number;
  randomizeQuestions: boolean;
  showImmediateFeedback: boolean;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentResponse {
  assessmentId: string;
  studentId: string;
  questionId: string;
  selectedOptionId?: string; // for MCQ
  answerText?: string; // for structured
  answeredAt: string;
}

export interface StudentSubmission {
  assessmentId: string;
  studentId: string;
  responses: StudentResponse[];
  startedAt: string;
  submittedAt?: string;
  isComplete: boolean;
}

export const createQuestion = (type: QuestionType, order: number): Question => ({
  id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  prompt: '',
  points: type === 'mcq' ? 1 : 5,
  order,
  options: type === 'mcq' ? [
    { id: 'a', label: 'A', text: '' },
    { id: 'b', label: 'B', text: '' },
    { id: 'c', label: 'C', text: '' },
    { id: 'd', label: 'D', text: '' },
  ] : undefined,
  modelAnswer: type === 'structured' ? '' : undefined,
});

export const createMCQOption = (label: string): MCQOption => ({
  id: label.toLowerCase(),
  label,
  text: '',
});
