export interface SubjectScore {
  subjectId: string;
  subjectName: string;
  score: string;
  performance: string;
  comment: string;
}

export interface PerformanceLevel {
  code: string;
  label: string;
  color: string;
}

export interface StudentMark {
  id: number;
  name: string;
  score: string;
  performance: string;
  comment: string;
}</arg_value></tool_call><dyad-write path="src/components/assessments/types.ts" description="Type definitions for assessments components">
export interface SubjectScore {
  subjectId: string;
  subjectName: string;
  score: string;
  performance: string;
  comment: string;
}

export interface PerformanceLevel {
  code: string;
  label: string;
  color: string;
}

export interface StudentMark {
  id: number;
  name: string;
  score: string;
  performance: string;
  comment: string;
}