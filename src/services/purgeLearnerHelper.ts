// Complete system purge of all learners
export const purgeAllLearnersCompletely = () => {
  localStorage.setItem('munyaka_learners', JSON.stringify([]));
  localStorage.removeItem('munyaka_learners_v2');
  localStorage.removeItem('munyaka_learners_db');
  localStorage.removeItem('school_learners_data');
  localStorage.removeItem('school_learners_master');
  localStorage.removeItem('munyaka_students');
  window.dispatchEvent(new Event('munyaka_learners_updated'));
  window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key: 'munyaka_learners' } }));
};
