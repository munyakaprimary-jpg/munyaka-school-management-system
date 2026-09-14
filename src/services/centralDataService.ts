/**
 * Central Data Export Service
 * ===========================
 * Aggregates all persistent data stores across the Munyaka school management system
 * into a single unified snapshot for export as `initialSeedData.ts`.
 */

import { initialSeedData } from '../data/initialSeedData';

const safeParse = (key: string, fallback: any): any => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
};

export const generateFullSnapshot = (): string => {
  const snapshot = {
    students: safeParse('munyaka_learners', initialSeedData.students || []),
    staff: safeParse('munyaka_staff', initialSeedData.staff || []),
    exams: safeParse('munyaka_exams', initialSeedData.exams || []),
    libraryBooks: safeParse('munyaka_library', initialSeedData.libraryBooks || []),
    transactions: safeParse('munyaka_finances', initialSeedData.transactions || [])
  };

  return `export const initialSeedData = ${JSON.stringify(snapshot, null, 2)};

(initialSeedData as any).learners = initialSeedData.students;

export const INITIAL_SEED_DATA = initialSeedData;
export const DEFAULT_CBC_CLUSTERS = [];
export const buildDefaultClusters = () => [];
export const strandCategories = [];
export const gradeLevels = [];
export const ContentItem = {};
export const StrandCategory = {};
export const MemoryVerse = {};
export const RevisionQuestion = {};
export const Attachment = {};
export const AssessmentType = {};
export const assessmentTypeOptions = [];

export const mockLearners = initialSeedData.students;
export const mockStudents = initialSeedData.students;
export const mockStaff = initialSeedData.staff;
export const mockExams = initialSeedData.exams;
export const mockLibrary = initialSeedData.libraryBooks;
export const mockFinances = initialSeedData.transactions;

export const cbcStudyContent = (initialSeedData as any).cbcStudyContent || [];
export const cbcStudyMaterials = cbcStudyContent;
export const cbcCurriculum = (initialSeedData as any).cbcCurriculum || [];

export default initialSeedData;
`;
};