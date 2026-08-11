export interface MarkRecord {
  exam_id: string;
  grade: string;
  stream: string;
  academic_year: string;
  term: string;
  exam_type: string;
  student_id: string;
  subject_id: string;
  score: string;
}

export interface MarksMatrix {
  [student_id: string]: {
    [subject_id: string]: string;
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