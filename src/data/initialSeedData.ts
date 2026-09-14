export const initialSeedData = {
  students: [],
  learners: [],
  marks: []
};

export const INITIAL_SEED_DATA = initialSeedData;
export const DEFAULT_CBC_CLUSTERS = [];
export const buildDefaultClusters = () => [];
export const cbcStudyContent = [];
export const strandCategories = [];
export const gradeLevels = [];
export const ContentItem = {};
export const StrandCategory = {};
export const MemoryVerse = {};
export const RevisionQuestion = {};
export const Attachment = {};
export const AssessmentType = {};
export const assessmentTypeOptions = [];

export const mockLearners = (initialSeedData as any).learners || [];
export const mockStudents = (initialSeedData as any).students || [];
export const mockMarks = (initialSeedData as any).marks || [];

export default initialSeedData;
