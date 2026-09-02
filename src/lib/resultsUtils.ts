export interface StudentResult {
  studentId: string;
  studentName: string;
  name?: string;
  grade?: string;
  stream?: string;
  /** Map of learning area name to raw score (0-100). */
  scores: Record<string, number>;
  /** Alias of `studentName`. */
  assessmentNo?: string;
  /** Sum of all subject scores. */
  totalMarks?: number;
  /** Average across all subjects (0-100). */
  meanScore?: number;
  /** Overall rubric level derived from the mean. */
  level?: 'EE' | 'ME' | 'AE' | 'BE';
  /** Overall numeric total (alias of `totalMarks`). */
  overallTotal?: number;
  /** Overall mean (alias of `meanScore`). */
  overallAverage?: number;
  rank?: number;
  assessment?: string;
}

