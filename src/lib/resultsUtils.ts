export interface StudentResult {
  rank: number;
  studentId: string;
  name: string;
  assessmentNo: string;
  stream: string;
  scores: Record<string, number>;
  totalMarks: number;
  meanScore: number;
  level: 'EE' | 'ME' | 'AE' | 'BE';
}