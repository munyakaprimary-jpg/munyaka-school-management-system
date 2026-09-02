export interface MarkRecord {
  exam_id: string;
  grade: string;
  stream: string;
  academic_year: string;
  exam_type_id: string;
  term_id: string;
  /** Mirrors term_id for legacy callers. */
  term?: string;
  student_id: string;
  subject_id: string;
  score: string | number | null;
}

export interface MarksMatrix {
  [student_id: string]: {
    [subject_id: string]: string | number | null;
  };
}

export interface ExamKey {
  academic_year: string;
  term: string;
  exam_type: string;
  gradeId: string;
  streamId: string;
}

export const MARKS_STORAGE_KEY = 'munyaka_marks_records';
