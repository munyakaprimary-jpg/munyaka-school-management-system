// Complete system purge of all learners and student keys
export const purgeAllLearnersCompletely = () => {
  const keysToPurge = [
    'munyaka_learners',
    'munyaka_learners_v2',
    'munyaka_learners_db',
    'school_learners_data',
    'school_learners_master',
    'munyaka_students',
    'munyaka_students_master',
    'students',
    'learners',
    'cached_learners',
    'school_learners',
    'deleted_learner_ids'
  ];

  // 1. Completely remove all legacy and active keys from localStorage
  for (const k of keysToPurge) {
    localStorage.removeItem(k);
  }

  // 2. Initialize the single master key as an empty array
  localStorage.setItem('munyaka_learners', JSON.stringify([]));

  window.dispatchEvent(new Event('munyaka_learners_updated'));
  window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key: 'munyaka_learners' } }));
};

