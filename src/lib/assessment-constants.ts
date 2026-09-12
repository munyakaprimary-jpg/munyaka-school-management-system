import { ClusterData, ExamTypeOption } from '@/types/assessments';

export const DEFAULT_EXAM_TYPES: ExamTypeOption[] = [
  { id: "et-1", name: "Formative Assessment", code: "FORMATIVE", weight: 40, category: "Formative" },
  { id: "et-2", name: "Summative Assessment", code: "SUMMATIVE", weight: 60, category: "Summative" },
  { id: "et-3", name: "Opener Exam", code: "OPENER", weight: 0, category: "Other" },
  { id: "et-4", name: "Mid-Term Exam", code: "MIDTERM", weight: 0, category: "Other" }
];

export const FALLBACK_CLUSTERS: ClusterData[] = [
  {
    id: "pre-primary",
    name: "Pre-Primary",
    learningAreas: [
      { id: "pp-1", name: "Math", type: "Core" },
      { id: "pp-2", name: "Language", type: "Core" },
      { id: "pp-3", name: "Env", type: "Core" },
      { id: "pp-4", name: "Creative", type: "Core" },
      { id: "pp-5", name: "Religious", type: "Core" }
    ]
  },
  {
    id: "lower-primary",
    name: "Lower Primary",
    learningAreas: [
      { id: "lp-1", name: "Math", type: "Core" },
      { id: "lp-2", name: "English", type: "Core" },
      { id: "lp-3", name: "Kiswahili", type: "Core" },
      { id: "lp-4", name: "Env", type: "Core" },
      { id: "lp-5", name: "Hygiene", type: "Core" },
      { id: "lp-6", name: "Creative", type: "Core" },
      { id: "lp-7", name: "Religious", type: "Core" }
    ]
  },
  {
    id: "upper-primary",
    name: "Upper Primary",
    learningAreas: [
      { id: "up-1", name: "Math", type: "Core" },
      { id: "up-2", name: "English", type: "Core" },
      { id: "up-3", name: "Kiswahili", type: "Core" },
      { id: "up-4", name: "Science", type: "Core" },
      { id: "up-5", name: "Agri", type: "Core" },
      { id: "up-6", name: "Arts", type: "Core" },
      { id: "up-7", name: "Social", type: "Core" },
      { id: "up-8", name: "Religious", type: "Core" }
    ]
  },
  {
    id: "junior-school",
    name: "Junior School",
    learningAreas: [
      { id: "js-1", name: "Math", type: "Core" },
      { id: "js-2", name: "English", type: "Core" },
      { id: "js-3", name: "Kiswahili", type: "Core" },
      { id: "js-4", name: "Science", type: "Core" },
      { id: "js-5", name: "Health", type: "Core" },
      { id: "js-6", name: "Pre-Tech", type: "Core" },
      { id: "js-7", name: "Social", type: "Core" },
      { id: "js-8", name: "Agri", type: "Core" },
      { id: "js-9", name: "Business", type: "Core" }
    ]
  }
];