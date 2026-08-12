import { MarkRecord, MarksMatrix, ExamKey, MARKS_STORAGE_KEY } from './schema';

/**
 * Builds a unique exam_id used to key every mark record.
 * Marks for the same learner/subject across different exam periods
 * therefore never collide, so historical data is preserved.
 */
export const buildExamId = (key: ExamKey): string =>
  `${key.academic_year}|${key.term}|${key.exam_type}|${key.gradeId}|${key.streamId}`;

/**
 * Parses an exam_id back into its component parts.
 */
export const parseExamId = (examId: string): ExamKey | null => {
  const parts = examId.split('|');
  if (parts.length !== 5) return null;
  return {
    academic_year: parts[0],
    term: parts[1],
    exam_type: parts[2],
    gradeId: parts[3],
    streamId: parts[4],
  };
};

export const MarksService = {
  /**
   * Retrieves all marks for a specific exam_id.
   * Returns a matrix keyed by student_id -> subject_id -> score.
   */
  getMarks: (examId: string): MarksMatrix => {
    const raw = localStorage.getItem(MARKS_STORAGE_KEY);
    if (!raw) return {};
    try {
      const records: MarkRecord[] = JSON.parse(raw);
      return records
        .filter(r => r.exam_id === examId)
        .reduce<MarksMatrix>((matrix, r) => {
          if (!matrix[r.student_id]) matrix[r.student_id] = {};
          matrix[r.student_id][r.subject_id] = r.score;
          return matrix;
        }, {});
    } catch (e) {
      console.error("Error loading saved marks:", e);
      return {};
    }
  },

  /**
   * Returns a blank matrix for a brand new exam period.
   * All learners and subjects start with empty string values.
   */
  blankMarks: (students: { id: string }[], subjectIds: string[]): MarksMatrix => {
    return students.reduce<MarksMatrix>((matrix, student) => {
      matrix[student.id] = subjectIds.reduce<Record<string, string>>(
        (map, subjectId) => {
          map[subjectId] = "";
          return map;
        },
        {}
      );
      return matrix;
    }, {});
  },

  /**
   * Saves marks for a specific exam_id.
   * Only overwrites records for this exact exam_id, preserving all other exams' data.
   */
  saveMarks: (examId: string, matrix: MarksMatrix): void => {
    const raw = localStorage.getItem(MARKS_STORAGE_KEY);
    const records: MarkRecord[] = raw ? JSON.parse(raw) : [];

    // Drop any previous records for this exact exam (so the grid always reflects
    // the current state), while leaving other exams' records untouched.
    const others = records.filter(r => r.exam_id !== examId);

    const parsedKey = parseExamId(examId);
    if (!parsedKey) return;

    const currentRecords: MarkRecord[] = [];
    Object.entries(matrix).forEach(([studentId, subjects]) => {
      Object.entries(subjects).forEach(([subjectId, score]) => {
        if (score === undefined || score === "") return;
        currentRecords.push({
          exam_id: examId,
          grade: parsedKey.gradeId,
          stream: parsedKey.streamId,
          academic_year: parsedKey.academic_year,
          term: parsedKey.term,
          exam_type: parsedKey.exam_type,
          student_id: studentId,
          subject_id: subjectId,
          score
        });
      });
    });

    localStorage.setItem(MARKS_STORAGE_KEY, JSON.stringify([...others, ...currentRecords]));
  },

  /**
   * Retrieves all historical exam records for a specific learner.
   * Used for transcript generation and historical reporting.
   */
  getLearnerHistory: (studentId: string): MarkRecord[] => {
    const raw = localStorage.getItem(MARKS_STORAGE_KEY);
    if (!raw) return [];
    try {
      const records: MarkRecord[] = JSON.parse(raw);
      return records.filter(r => r.student_id === studentId);
    } catch (e) {
      console.error("Error loading learner history:", e);
      return [];
    }
  },

  /**
   * Retrieves all unique exam periods that have marks recorded.
   */
  getAllExamPeriods: (): ExamKey[] => {
    const raw = localStorage.getItem(MARKS_STORAGE_KEY);
    if (!raw) return [];
    try {
      const records: MarkRecord[] = JSON.parse(raw);
      const seen = new Set<string>();
      const exams: ExamKey[] = [];
      records.forEach(r => {
        if (!seen.has(r.exam_id)) {
          seen.add(r.exam_id);
          const parsed = parseExamId(r.exam_id);
          if (parsed) exams.push(parsed);
        }
      });
      return exams;
    } catch (e) {
      console.error("Error loading exam periods:", e);
      return [];
    }
  }
};