/**
 * Mock dataset for StudentProfile performance chart.
 * Self-contained so the page works even before real marks records are
 * populated in localStorage / Supabase.
 *
 * Shape:
 *   marks.studentRecords[id] = { currentTerm, terms: { [term]: { examType, scores } } }
 *   marks.classAverages[subject] = { [term]: number }
 */

export interface MarkRecord {
  currentTerm: string;
  terms: Record<string, {
    examType: string;
    scores: Record<string, number>;
  }>;
}

export const marks: {
  studentRecords: Record<string, MarkRecord>;
  classAverages: Record<string, Record<string, number>>;
} = {
  studentRecords: {
    '1787737452457': {
      currentTerm: 'Term 1',
      terms: {
        'Term 1': {
          examType: 'Formative Assessment',
          scores: {
            Mathematics: 88,
            English: 75,
            Kiswahili: 82,
            'Science & Technology': 92,
            'Social Studies': 78,
            'Agriculture & Nutrition': 84,
            'Creative Arts': 90,
            'Religious Education': 80,
          },
        },
      },
    },
  },
  classAverages: {
    Mathematics: { 'Term 1': 72, 'Term 2': 75, 'Term 3': 78 },
    English: { 'Term 1': 68, 'Term 2': 70, 'Term 3': 73 },
    Kiswahili: { 'Term 1': 70, 'Term 2': 72, 'Term 3': 75 },
    'Science & Technology': { 'Term 1': 74, 'Term 2': 76, 'Term 3': 79 },
    'Social Studies': { 'Term 1': 71, 'Term 2': 73, 'Term 3': 76 },
    'Agriculture & Nutrition': { 'Term 1': 75, 'Term 2': 77, 'Term 3': 80 },
    'Creative Arts': { 'Term 1': 78, 'Term 2': 80, 'Term 3': 82 },
    'Religious Education': { 'Term 1': 73, 'Term 2': 75, 'Term 3': 78 },
  },
};