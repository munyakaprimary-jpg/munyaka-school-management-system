import { MarkRecord, MarksMatrix, ExamKey, MARKS_STORAGE_KEY } from './schema';

/**
 * Builds a unique exam_id used to key every mark record.
 * Marks for the same learner/subject across different exam periods
 * therefore never collide, so historical data is preserved.
 */
export const buildExamId = (key: ExamKey): string =>
  `${key.academic_year}|${key.term}|${key.exam_type}|${key.gradeId}|${key.streamId}`;

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

  /** Returns a blank matrix of zeros per learner/subject for a brand new exam. */
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

    // Drop any previous records for this exact exam (so the grid always reflects
    // the current state), while leaving other exams' records untouched.
    const others = records.filter(r => r.exam_id !== examId);

    const currentRecords: MarkRecord[] = [];
    Object.entries(matrix).forEach(([studentId, subjects]) => {
      Object.entries(subjects).forEach(([subjectId, score]) => {
        if (score === undefined || score === "") return;
        currentRecords.push({ exam_id: examId, ...extraKeyFields(examId), student_id: studentId, subject_id: subjectId, score });
      });
    });

    localStorage.setItem(MARKS_STORAGE_KEY, JSON.stringify([...others, ...currentRecords]));
  }
};

const extraKeyFields = (examId: string) => {
  const [academic_year, term, exam_type, gradeId, streamId] = examId.split("|");
  return {
    grade: "",
    stream: "",
    academic_year,
    term,
    exam_type,
  };
};