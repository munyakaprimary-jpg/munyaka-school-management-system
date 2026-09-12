export type AssessmentType = 'Formative' | 'Summative' | 'ReportCard';

export type PerformanceLevel = 'EE' | 'ME' | 'AE' | 'BE';

export interface HistoricalAssessment {
  id: string;
  studentId: string;
  subject: string;
  score: number;
  performanceLevel: PerformanceLevel;
  comment: string;
  assessmentType: AssessmentType;
  gradeLevel: string;
  academicYear: string;
  term: string;
  dateRecorded: string;
  isLocked: boolean;
}

export interface AcademicHistoryGroup {
  academicYear: string;
  gradeLevel: string;
  assessments: HistoricalAssessment[];
}

export interface PerformanceLevelConfig {
  code: PerformanceLevel;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

export const PERFORMANCE_LEVELS: PerformanceLevelConfig[] = [
  {
    code: 'EE',
    label: 'Exceeding Expectation',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    description: 'Student demonstrates comprehensive understanding and exceeds grade-level expectations.'
  },
  {
    code: 'ME',
    label: 'Meeting Expectation',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    description: 'Student demonstrates solid understanding and meets grade-level expectations.'
  },
  {
    code: 'AE',
    label: 'Approaching Expectation',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    description: 'Student is developing understanding and approaching grade-level expectations.'
  },
  {
    code: 'BE',
    label: 'Below Expectation',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    description: 'Student needs additional support to meet grade-level expectations.'
  }
];

export const getPerformanceLevel = (code: PerformanceLevel): PerformanceLevelConfig => {
  return PERFORMANCE_LEVELS.find(l => l.code === code) || PERFORMANCE_LEVELS[1];
};

export const getPerformanceFromScore = (score: number): PerformanceLevel => {
  if (score >= 80) return 'EE';
  if (score >= 50) return 'ME';
  if (score >= 30) return 'AE';
  return 'BE';
};