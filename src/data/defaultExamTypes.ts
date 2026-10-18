export interface ExamTypeDefinition {
  id: string;
  name: string;
  code: string;
  weightPercentage: number;
  term: string;
  year: number;
  description: string;
  passingScore: number;
  totalMarksBaseline: number;
  isDefault?: boolean;
}

export const defaultExamTypes: ExamTypeDefinition[] = [
  {
    id: 'et_opener',
    name: 'Opener Exam',
    code: 'OPENER',
    weightPercentage: 10,
    term: 'Term 1',
    year: 2025,
    description: 'Initial term diagnostic assessment to evaluate prerequisite knowledge.',
    passingScore: 40,
    totalMarksBaseline: 50,
    isDefault: true
  },
  {
    id: 'et_cat',
    name: 'Continuous Assessment Test',
    code: 'CAT',
    weightPercentage: 20,
    term: 'Term 1',
    year: 2025,
    description: 'Mid-term formative quiz and assignment evaluation.',
    passingScore: 50,
    totalMarksBaseline: 100,
    isDefault: true
  },
  {
    id: 'et_midterm',
    name: 'Mid-Term Exam',
    code: 'MIDTERM',
    weightPercentage: 30,
    term: 'Term 1',
    year: 2025,
    description: 'Comprehensive mid-term examination covering weeks 1 through 6.',
    passingScore: 50,
    totalMarksBaseline: 100,
    isDefault: true
  },
  {
    id: 'et_endterm',
    name: 'End of Term Exam',
    code: 'ENDTERM',
    weightPercentage: 40,
    term: 'Term 1',
    year: 2025,
    description: 'Terminal summative exam for overall grading and rank promotion.',
    passingScore: 50,
    totalMarksBaseline: 100,
    isDefault: true
  },
  {
    id: 'et_cbc_rubric',
    name: 'Assessment Rubric Task',
    code: 'RUBRIC',
    weightPercentage: 100,
    term: 'Term 1',
    year: 2025,
    description: 'Competency-based formative assessment task evaluated via performance rubrics.',
    passingScore: 2, // Meeting Expectation
    totalMarksBaseline: 4,
    isDefault: true
  }
];

export const getExamTypes = (): ExamTypeDefinition[] => {
  try {
    const raw = localStorage.getItem('munyaka_exam_types');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return defaultExamTypes;
};

export const saveExamTypes = (types: ExamTypeDefinition[]): boolean => {
  try {
    localStorage.setItem('munyaka_exam_types', JSON.stringify(types));
    return true;
  } catch {
    return false;
  }
};

export default defaultExamTypes;
