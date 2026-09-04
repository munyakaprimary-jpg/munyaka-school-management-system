export type QuestionType =
  | 'mcq'
  | 'structured'
  | 'math'
  | 'numeric'
  | 'fill_blank';

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
  // Numeric / math / fill-in-the-blank specific
  correctAnswer?: string;
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
  status?: "draft" | "published" | "closed";
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
  attemptId?: string; // unique per launch; prevents prior attempt answers leaking in
  responses: StudentResponse[];
  startedAt: string;
  submittedAt?: string;
  isComplete: boolean;
}

// =============================================
// Assessment Result Record — linked to student, class, subject, term
// =============================================
export interface AssessmentResult {
  id: string;
  studentId: string;
  studentName?: string;
  classId: string;          // e.g. "Grade 4"
  className: string;         // e.g. "Grade 4"
  stream?: string;           // e.g. "Green"
  subjectId: string;         // e.g. "Mathematics"
  subjectName: string;       // e.g. "Mathematics"
  academicYear: string;      // e.g. "2025"
  term: string;              // e.g. "Term 1"
  examType: string;          // e.g. "Formative Assessment", "Mid-Term"
  assessmentId: string;      // Reference to the quiz/test definition
  assessmentTitle: string;   // Human-readable title
  // Raw score data
  totalScore: number;        // Sum of all earned points
  maxScore: number;          // Total possible points
  percentage: number;         // (totalScore / maxScore) * 100
  // Detailed responses
  responses: StudentResponse[];
  // Metadata
  startedAt: string;
  submittedAt: string;
  durationSeconds?: number;  // How long the student took
  isComplete: boolean;
  // CBC grading level
  gradeLevel?: 'EE' | 'ME' | 'AE' | 'BE';
  remarks?: string;
}

// Storage key for all assessment results
export const ASSESSMENT_RESULTS_KEY = "munyaka_assessment_results";
export const ASSESSMENT_SUBMISSIONS_KEY = "student_assessment_submissions";

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
