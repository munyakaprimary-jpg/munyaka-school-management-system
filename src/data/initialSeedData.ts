export { DEFAULT_CBC_CLUSTERS, buildDefaultClusters } from './defaultCbcLearningAreas';

export const initialSeedData = {
  students: [],
  learners: [],
  staff: [],
  attendance: [],
  marks: [],
  assessments: [],
  transactions: [],
  learningAreas: [],
  studyContent: [],
  scienceLab: []
};

// Named exports for components importing named variables directly
export const INITIAL_SEED_DATA = initialSeedData;
export const mockLearners = initialSeedData.learners;
export const mockStaff = initialSeedData.staff;
export const mockAttendance = initialSeedData.attendance;
export const mockMarks = initialSeedData.marks;
export const mockTransactions = initialSeedData.transactions;

export default initialSeedData;
