import { STUDENTS } from './mock-data';

export interface MarkRecord {
  learnerId: string;
  grade: string;
  year: number;
  term: string;
  examType: string;
  marks: Record<string, number>; // learningAreaId -> score
}

export type MarksData = MarkRecord[];

const STORAGE_KEY = 'exam_marks_data';

export const ExamService = {
  getMarks: (): MarksData => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data? JSON.parse(data) : [];
  },

  saveMarks: (newMarks: MarksData): void => {
    const currentMarks = ExamService.getMarks();
    
    // Merge new marks with existing ones, ensuring no overwriting of different periods
    const updatedMarks = [...currentMarks];
    
    newMarks.forEach(newMark => {
      const existingIndex = updatedMarks.findIndex(m => 
        m.learnerId === newMark.learnerId &&
        m.grade === newMark.grade &&
        m.year === newMark.year &&
        m.term === newMark.term &&
        m.examType === newMark.examType
      );

      if (existingIndex > -1) {
        // If marks for this period already exist, merge them (allowing updates to the same period)
        updatedMarks[existingIndex].marks = {
          ..updatedMarks[existingIndex].marks,
          ..newMark.marks
        };
      } else {
        // If it's a new period, add it
        updatedMarks.push(newMark);
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMarks));
  },

  initializeNewExamPeriod: (year: number, term: string, examType: string, learners: any[]): void => {
    const currentMarks = ExamService.getMarks();
    const newPeriodMarks: MarksData = learners.map(learner => ({
      learnerId: learner.id,
      grade: learner.grade,
      year: year,
      term: term,
      examType: examType,
      marks: {} // Blank marks
    }));

    // Check if any of these learners already have marks for this period
    const filteredNewMarks = newPeriodMarks.filter(newMark => {
      return!currentMarks.some(m => 
        m.learnerId === newMark.learnerId &&
        m.grade === newMark.grade &&
        m.year === newMark.year &&
        m.term === newMark.term &&
        m.examType === newMark.examType
      );
    });

    if (filteredNewMarks.length > 0) {
      ExamService.saveMarks(filteredNewMarks);
    }
  }
};