import { MarkRecord, MarksMatrix, ExamKey, MARKS_STORAGE_KEY } from './schema';

/**
 * Builds a unique exam_id used to key every mark record.
 * Marks for the same learner/subject across different exam periods
 * therefore never collide, so historical data is preserved.
 */
export const buildExamId = (key: ExamKey): string =>
  `${key.academic_year}|${key.term}|${key.exam_type}|${key.gradeId}|${key.streamId}`;

/***
 * Store marks as individual records with unique constraints
 * (student_id, subject_id, exam_type_id, term_id, academic_year)
 */
export const MarksService = {
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

  blankMarks: (examId: string, students: { id: string }[], subjectIds: string[]): MarksMatrix => {
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

  saveMarks: (examId: string, matrix: MarksMatrix): void => {
    const raw = localStorage.getItem(MARKS_STORAGE_KEY);
    const records: MarkRecord[] = raw ? JSON.parse(raw) : [];

    // UPSERT logic: Update existing records or create new ones
    const updatedRecords = records.map(record => {
      const key = `${record.student_id}|${record.subject_id}|${record.exam_type_id}|${record.term_id}|${record.academic_year}`;
      const existing = matrix[record.student_id]?.[record.subject_id];
      
      if (existing !== undefined) {
        // Update existing record
        return {
          ...record,
          score: existing
        };
      } else {
        // Create new record
        return {
          exam_id: examId,
          ...record,
          score: matrix[record.student_id]?.[record.subject_id] || ""
        };
      }
    });

    localStorage.setItem(MARKS_STORAGE_KEY, JSON.stringify(updatedRecords));
  }
};

const extraKeyFields = (examId: string) => {
  const [academic_year, term, exam_type, gradeId, streamId] = examId.split("|");
  return {
    grade: "",
    stream: "",
    academic_year,
    term,
    exam_type_id: exam_type, // Explicitly use exam_type_id
  };
};