export interface GradeBand {
  id: string;
  name: 'Lower Primary' | 'Upper Primary' | 'Junior School';
  grade_range: '1-3' | '4-6' | '7-9';
}

export interface LearningArea {
  id: string;
  name: string;
  grade_band_id: string;
}

export interface Student {
  id: string;
  name: string;
  assessment_number: string;
  stream: string;
  current_grade: number; // 1 to 9
  grade_band_id: string; // Auto-assigned
  gender: 'M' | 'F';
  dob: string;
}

export interface SubjectMarks {
  mid_term: number;
  end_term: number;
}

export interface StudentRemarks {
  teacher_remark: string;
  hoi_remark: string;
}

export interface TermDates {
  closing_date: string;
  next_term_opening: string;
}

export const GRADE_BANDS: GradeBand[] = [
  { id: 'band-1-3', name: 'Lower Primary', grade_range: '1-3' },
  { id: 'band-4-6', name: 'Upper Primary', grade_range: '4-6' },
  { id: 'band-7-9', name: 'Junior School', grade_range: '7-9' },
];

export const LEARNING_AREAS: LearningArea[] = [
  // Lower Primary (Grades 1-3)
  { id: 'la-lp-1', name: 'Mathematical Activities', grade_band_id: 'band-1-3' },
  { id: 'la-lp-2', name: 'English Language Activities', grade_band_id: 'band-1-3' },
  { id: 'la-lp-3', name: 'Kiswahili Language Activities', grade_band_id: 'band-1-3' },
  { id: 'la-lp-4', name: 'Environmental Activities', grade_band_id: 'band-1-3' },
  { id: 'la-lp-5', name: 'Hygiene and Nutrition Activities', grade_band_id: 'band-1-3' },
  { id: 'la-lp-6', name: 'Movement and Creative Activities', grade_band_id: 'band-1-3' },
  { id: 'la-lp-7', name: 'Religious Education Activities', grade_band_id: 'band-1-3' },

  // Upper Primary (Grades 4-6)
  { id: 'la-up-1', name: 'Mathematics', grade_band_id: 'band-4-6' },
  { id: 'la-up-2', name: 'English Language', grade_band_id: 'band-4-6' },
  { id: 'la-up-3', name: 'Kiswahili Lugha', grade_band_id: 'band-4-6' },
  { id: 'la-up-4', name: 'Science and Technology', grade_band_id: 'band-4-6' },
  { id: 'la-up-5', name: 'Agriculture and Nutrition', grade_band_id: 'band-4-6' },
  { id: 'la-up-6', name: 'Creative Arts', grade_band_id: 'band-4-6' },
  { id: 'la-up-7', name: 'Social Studies', grade_band_id: 'band-4-6' },
  { id: 'la-up-8', name: 'Christian Religious Education', grade_band_id: 'band-4-6' },

  // Junior School (Grades 7-9)
  { id: 'la-js-1', name: 'Mathematics', grade_band_id: 'band-7-9' },
  { id: 'la-js-2', name: 'English', grade_band_id: 'band-7-9' },
  { id: 'la-js-3', name: 'Kiswahili', grade_band_id: 'band-7-9' },
  { id: 'la-js-4', name: 'Integrated Science', grade_band_id: 'band-7-9' },
  { id: 'la-js-5', name: 'Pre-Technical Studies', grade_band_id: 'band-7-9' },
  { id: 'la-js-6', name: 'Health Education', grade_band_id: 'band-7-9' },
  { id: 'la-js-7', name: 'Agriculture', grade_band_id: 'band-7-9' },
  { id: 'la-js-8', name: 'Social Studies', grade_band_id: 'band-7-9' },
  { id: 'la-js-9', name: 'Religious Education', grade_band_id: 'band-7-9' },
];

/**
 * Performance Level Evaluator based on Average Score:
 * EE (Exceeding Expectation): 75% – 100%
 * ME (Meeting Expectation): 50% – 74%
 * AE (Approaching Expectation): 31% – 49%
 * BE (Below Expectation): 0% – 30%
 */
export function calculatePerformanceLevel(avgScore: number): 'EE' | 'ME' | 'AE' | 'BE' {
  if (avgScore >= 75) return 'EE';
  if (avgScore >= 50) return 'ME';
  if (avgScore >= 31) return 'AE';
  return 'BE';
}

export function getPerformanceLabel(level: 'EE' | 'ME' | 'AE' | 'BE'): string {
  switch (level) {
    case 'EE': return 'Exceeding Expectation';
    case 'ME': return 'Meeting Expectation';
    case 'AE': return 'Approaching Expectation';
    case 'BE': return 'Below Expectation';
  }
}

export function resolveGradeBandId(currentGrade: number): string {
  if (currentGrade >= 1 && currentGrade <= 3) return 'band-1-3';
  if (currentGrade >= 4 && currentGrade <= 6) return 'band-4-6';
  if (currentGrade >= 7 && currentGrade <= 9) return 'band-7-9';
  return 'band-4-6';
}

export const INITIAL_STUDENTS: Student[] = [
  { id: 'std-1', name: 'Brian Kiptoo', assessment_number: 'A827361', stream: 'Blue', current_grade: 2, grade_band_id: 'band-1-3', gender: 'M', dob: '2016-05-12' },
  { id: 'std-2', name: 'Mary Atieno', assessment_number: 'A827362', stream: 'Blue', current_grade: 2, grade_band_id: 'band-1-3', gender: 'F', dob: '2016-08-20' },
  { id: 'std-3', name: 'Emmanuel Maina', assessment_number: 'A827363', stream: 'Blue', current_grade: 4, grade_band_id: 'band-4-6', gender: 'M', dob: '2014-03-15' },
  { id: 'std-4', name: 'Sheila Chepkoech', assessment_number: 'A827364', stream: 'Green', current_grade: 5, grade_band_id: 'band-4-6', gender: 'F', dob: '2013-11-05' },
  { id: 'std-5', name: 'David Mutua', assessment_number: 'A827365', stream: 'Alpha', current_grade: 7, grade_band_id: 'band-7-9', gender: 'M', dob: '2011-09-28' },
  { id: 'std-6', name: 'Faith Wanjiku', assessment_number: 'A827366', stream: 'Alpha', current_grade: 8, grade_band_id: 'band-7-9', gender: 'F', dob: '2010-01-14' },
];

export const INITIAL_MARKS: Record<string, Record<string, SubjectMarks>> = {
  'std-1': {
    'la-lp-1': { mid_term: 84, end_term: 92 },
    'la-lp-2': { mid_term: 70, end_term: 82 },
    'la-lp-3': { mid_term: 65, end_term: 75 },
    'la-lp-4': { mid_term: 80, end_term: 90 },
    'la-lp-5': { mid_term: 62, end_term: 74 },
    'la-lp-6': { mid_term: 90, end_term: 94 },
    'la-lp-7': { mid_term: 78, end_term: 82 },
  },
  'std-2': {
    'la-lp-1': { mid_term: 58, end_term: 66 },
    'la-lp-2': { mid_term: 72, end_term: 76 },
    'la-lp-3': { mid_term: 80, end_term: 82 },
    'la-lp-4': { mid_term: 54, end_term: 62 },
    'la-lp-5': { mid_term: 60, end_term: 68 },
    'la-lp-6': { mid_term: 66, end_term: 74 },
    'la-lp-7': { mid_term: 74, end_term: 76 },
  },
  'std-3': {
    'la-up-1': { mid_term: 82, end_term: 88 },
    'la-up-2': { mid_term: 68, end_term: 76 },
    'la-up-3': { mid_term: 62, end_term: 74 },
    'la-up-4': { mid_term: 88, end_term: 92 },
    'la-up-5': { mid_term: 78, end_term: 86 },
    'la-up-6': { mid_term: 74, end_term: 82 },
    'la-up-7': { mid_term: 60, end_term: 70 },
    'la-up-8': { mid_term: 76, end_term: 84 },
  },
  'std-5': {
    'la-js-1': { mid_term: 74, end_term: 82 },
    'la-js-2': { mid_term: 80, end_term: 88 },
    'la-js-3': { mid_term: 68, end_term: 76 },
    'la-js-4': { mid_term: 86, end_term: 92 },
    'la-js-5': { mid_term: 88, end_term: 94 },
    'la-js-6': { mid_term: 72, end_term: 80 },
    'la-js-7': { mid_term: 66, end_term: 74 },
    'la-js-8': { mid_term: 64, end_term: 72 },
    'la-js-9': { mid_term: 82, end_term: 88 },
  }
};

export const DEFAULT_REMARKS: Record<string, StudentRemarks> = {
  'std-1': {
    teacher_remark: 'An outstanding term! Displays deep understanding and critical thinking skills.',
    hoi_remark: 'Excellent academic performance. Consistently exceeds expectations across all learning areas.',
  },
  'std-3': {
    teacher_remark: 'A very hardworking and disciplined student. Keep it up!',
    hoi_remark: 'Satisfactory progress made this term. With continued effort, higher levels are attainable.',
  },
  'std-5': {
    teacher_remark: 'Demonstrates remarkable aptitude in Pre-Technical Studies and Integrated Science.',
    hoi_remark: 'Excellent academic performance. Consistently exceeds expectations across all learning areas.',
  }
};

export const DEFAULT_TERM_DATES: TermDates = {
  closing_date: '2024-10-25',
  next_term_opening: '2024-11-04',
};