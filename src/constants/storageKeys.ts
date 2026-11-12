export const STORAGE_KEYS = {
  LEARNERS: 'munyaka_learners_directory',
  STAFF: 'munyaka_staff_registry',
  MARKS: 'munyaka_marks'
};

export const clearLegacyLearnerStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const legacyKeys = [
    'munyaka_app_learners_v1',
    'munyaka_learners',
    'munyaka_master_learners',
    'munyaka_learners_v2',
    'munyaka_students',
    'munyaka_students_legacy',
    'munyaka_master_learner_list',
    'school_learners_data',
    'students_data'
  ];
  try {
    legacyKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (e) {
    console.error('Error clearing legacy learner storage:', e);
  }
};
