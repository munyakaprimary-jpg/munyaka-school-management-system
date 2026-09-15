import { MarkRecord, MarksMatrix, ExamKey } from './schema';
import { CentralDataService, STORAGE_KEYS } from './centralDataService';

/**
 * Builds a unique exam_id used to key every mark record.
 * Marks for the same learner/subject across different exam periods
 * therefore never collide, so historical data is preserved.
 */
export const buildExamId = (key: ExamKey): string =>
 `${key.academic_year}|${key.term}|${key.exam_type}|${key.gradeId}|${key.streamId}`;

/**
 * Store marks with proper UPSERT logic and unique constraints
 */
export const MarksService = {
 getMarks: (examId: string): MarksMatrix => {
 const records = CentralDataService.getMarks();
 if (!records || !Array.isArray(records)) return {};
 try {
 return records
.filter(r => r.exam_id === examId)
.reduce<MarksMatrix>((matrix, r) => {
 if (!matrix[r.student_id]) matrix[r.student_id] = {};
 matrix[r.student_id][r.subject_id] = r.score?.toString() || "";
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

 saveMarks: async (examId: string, matrix: MarksMatrix): Promise<MarkRecord[]> => {
  if (!examId) throw new Error("exam_id is required");

  const records = CentralDataService.getMarks();

  // Parse examId to extract context fields
  const [academic_year, term, exam_type, gradeId, streamId] = examId.split("|");

  // Build new records from the matrix
  const newRecords: MarkRecord[] = [];
  Object.entries(matrix).forEach(([studentId, subjects]) => {
    Object.entries(subjects).forEach(([subjectId, score]) => {
      if (score === undefined || score === "") return;
      newRecords.push({
        exam_id: examId,
        student_id: studentId,
        subject_id: subjectId,
        exam_type_id: exam_type,
        term_id: term,
        academic_year,
        grade: gradeId,
        stream: streamId,
        score: Number(score)
      });
    });
  });

  // UPSERT: Update existing records or add new ones based on unique constraint
  // Unique constraint: (student_id, subject_id, exam_type_id, term_id, academic_year)
  const updatedRecords = [...records];
  newRecords.forEach(newRecord => {
    const existingIndex = updatedRecords.findIndex(r =>
      r.student_id === newRecord.student_id &&
      r.subject_id === newRecord.subject_id &&
      r.exam_type_id === newRecord.exam_type_id &&
      r.term_id === newRecord.term_id &&
      r.academic_year === newRecord.academic_year
    );

    if (existingIndex > -1) {
      updatedRecords[existingIndex] = {...updatedRecords[existingIndex],...newRecord };
    } else {
      updatedRecords.push(newRecord);
    }
  });

  CentralDataService.saveMarks(updatedRecords);
  return updatedRecords;
  }
};