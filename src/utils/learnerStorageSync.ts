export const saveLearnerToStorage = (newLearner: any) => {
  if (typeof window === 'undefined') return;
  
  // 1. Update primary learners keys
  const rawLearners = localStorage.getItem('munyaka_learners') || localStorage.getItem('munyaka_learners_v2') || '[]';
  let learnersList = [];
  try {
    learnersList = JSON.parse(rawLearners);
    if (!Array.isArray(learnersList)) learnersList = [];
  } catch (e) {
    learnersList = [];
  }

  const updatedList = [newLearner, ...learnersList.filter((l: any) => l.id !== newLearner.id && l.admNo !== newLearner.admNo)];
  
  localStorage.setItem('munyaka_learners', JSON.stringify(updatedList));
  localStorage.setItem('munyaka_learners_v2', JSON.stringify(updatedList));

  // 2. Sync into central db schema ({ learners: [], staff: [] })
  const rawCentral = localStorage.getItem('munyaka_central_db');
  let centralDb = rawCentral ? JSON.parse(rawCentral) : { learners: [], staff: [] };
  
  if (centralDb.students) {
    delete centralDb.students;
  }
  
  centralDb.learners = updatedList;
  localStorage.setItem('munyaka_central_db', JSON.stringify(centralDb));

  // 3. Purge obsolete student keys
  localStorage.removeItem('munyaka_students');

  // Trigger global refresh events
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('munyaka_students_updated'));
  window.dispatchEvent(new Event('central_db_updated'));
};
