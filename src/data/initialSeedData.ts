export const initialSeedData = {
  "students": [],
  "staff": [],
  "attendance": {},
  "fees": [],
  "grades": {},
  "examTypes": [],
  "libraryBooks": [],
  "feeStructures": [],
  "notices": [],
  "settings": {}
};

(initialSeedData as any).learners = initialSeedData.students;

export const INITIAL_SEED_DATA = initialSeedData;

export const mockLearners = initialSeedData.students;
export const mockStudents = initialSeedData.students;
export const mockStaff = initialSeedData.staff;
export const mockExams = (initialSeedData as any).exams || [];
export const mockLibrary = (initialSeedData as any).libraryBooks || [];
export const mockFinances = (initialSeedData as any).fees || [];

export default initialSeedData;
