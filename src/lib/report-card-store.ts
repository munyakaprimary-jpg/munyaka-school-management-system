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
}

export interface StudentMark {
  id: string;
  student_id: string;
  learning_area_id: string;
  score: number;
  performance_level: 'EE' | 'ME' | 'AE' | 'BE';
}

export interface StudentRemarks {
  teacher_remark: string;
  hoi_remark: string;
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
 * AUTO-ASSIGNMENT LOGIC:
 * Evaluates current_grade (1-9) and auto-assigns grade_band_id
 */
export function resolveGradeBandId(currentGrade: number): string {
  if (currentGrade >= 1 && currentGrade <= 3) return 'band-1-3';
  if (currentGrade >= 4 && currentGrade <= 6) return 'band-4-6';
  if (currentGrade >= 7 && currentGrade <= 9) return 'band-7-9';
  return 'band-4-6';
}

export const INITIAL_STUDENTS: Student[] = [
  { id: 'std-1', name: 'Brian Kiptoo', assessment_number: 'KNEC/CBC/2024/101', stream: 'Blue', current_grade: 2, grade_band_id: 'band-1-3' },
  { id: 'std-2', name: 'Mary Atieno', assessment_number: 'KNEC/CBC/2024/102', stream: 'Blue', current_grade: 2, grade_band_id: 'band-1-3' },
  { id: 'std-3', name: 'Emmanuel Maina', assessment_number: 'KNEC/CBC/2024/401', stream: 'Blue', current_grade: 4, grade_band_id: 'band-4-6' },
  { id: 'std-4', name: 'Sheila Chepkoech', assessment_number: 'KNEC/CBC/2024/402', stream: 'Green', current_grade: 5, grade_band_id: 'band-4-6' },
  { id: 'std-5', name: 'David Mutua', assessment_number: 'KNEC/CBC/2024/701', stream: 'Alpha', current_grade: 7, grade_band_id: 'band-7-9' },
  { id: 'std-6', name: 'Faith Wanjiku', assessment_number: 'KNEC/CBC/2024/801', stream: 'Alpha', current_grade: 8, grade_band_id: 'band-7-9' },
];

export const INITIAL_MARKS: Record<string, Record<string, { score: number; performance_level: 'EE' | 'ME' | 'AE' | 'BE' }>> = {
  'std-1': {
    'la-lp-1': { score: 88, performance_level: 'EE' },
    'la-lp-2': { score: 76, performance_level: 'EE' },
    'la-lp-3': { score: 70, performance_level: 'ME' },
    'la-lp-4': { score: 85, performance_level: 'EE' },
    'la-lp-5': { score: 68, performance_level: 'ME' },
    'la-lp-6': { score: 92, performance_level: 'EE' },
    'la-lp-7': { score: 80, performance_level: 'EE' },
  },
  'std-2': {
    'la-lp-1': { score: 62, performance_level: 'ME' },
    'la-lp-2': { score: 74, performance_level: 'ME' },
    'la-lp-3': { score: 81, performance_level: 'EE' },
    'la-lp-4': { score: 58, performance_level: 'ME' },
    'la-lp-5': { score: 64, performance_level: 'ME' },
    'la-lp-6': { score: 70, performance_level: 'ME' },
    'la-lp-7': { score: 75, performance_level: 'EE' },
  },
  'std-3': {
    'la-up-1': { score: 85, performance_level: 'EE' },
    'la-up-2': { score: 72, performance_level: 'ME' },
    'la-up-3': { score: 68, performance_level: 'ME' },
    'la-up-4': { score: 90, performance_level: 'EE' },
    'la-up-5': { score: 82, performance_level: 'EE' },
    'la-up-6': { score: 78, performance_level: 'EE' },
    'la-up-7': { score: 65, performance_level: 'ME' },
    'la-up-8': { score: 80, performance_level: 'EE' },
  },
  'std-5': {
    'la-js-1': { score: 78, performance_level: 'EE' },
    'la-js-2': { score: 84, performance_level: 'EE' },
    'la-js-3': { score: 72, performance_level: 'ME' },
    'la-js-4': { score: 89, performance_level: 'EE' },
    'la-js-5': { score: 91, performance_level: 'EE' },
    'la-js-6': { score: 76, performance_level: 'EE' },
    'la-js-7': { score: 70, performance_level: 'ME' },
    'la-js-8': { score: 68, performance_level: 'ME' },
    'la-js-9': { score: 85, performance_level: 'EE' },
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