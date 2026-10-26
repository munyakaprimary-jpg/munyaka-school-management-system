// Complete system purge of all learners and student keys
export const purgeAllLearnersCompletely = () => {
  const legacyKeys = [
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

  // Completely remove all fragment keys
  for (const key of legacyKeys) {
    localStorage.removeItem(key);
  }

  // Reset the single master key to empty
  localStorage.setItem('munyaka_learners', JSON.stringify([]));

  window.dispatchEvent(new Event('munyaka_learners_updated'));
  window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key: 'munyaka_learners' } }));
};

