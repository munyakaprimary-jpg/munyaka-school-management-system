import type { ExamTypeOption } from '@/types/assessments';

export const DEFAULT_EXAM_TYPES: ExamTypeOption[] = [
  { id: "et-1", name: "Formative Assessment", code: "FORMATIVE", weight: 40, category: "Formative" },
  { id: "et-2", name: "Summative Assessment", code: "SUMMATIVE", weight: 60, category: "Summative" },
  { id: "et-3", name: "Opener Exam", code: "OPENER", weight: 0, category: "Other" },
  { id: "et-4", name: "Mid-Term Exam", code: "MIDTERM", weight: 0, category: "Other" }
];