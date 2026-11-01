export const syncLearnerStorageKeys = () => {
  if (typeof window === 'undefined') return [];

  // Gather learners from all known storage keys
  const keys = ['munyaka_learners_v2', 'munyaka_learners', 'munyaka_central_db', 'school_learners_master', 'school_learners_data', 'munyaka_students', 'students', 'learners'];
  let allLearners: any[] = [];

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        allLearners = [...allLearners, ...parsed];
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.learners) && parsed.learners.length > 0) {
          allLearners = [...allLearners, ...parsed.learners];
        } else if (Array.isArray(parsed.students) && parsed.students.length > 0) {
          allLearners = [...allLearners, ...parsed.students];
        }
      }
    } catch (e) {}
  }

  // Deduplicate learners by id, admissionNumber, admNo, or name
  const uniqueMap = new Map();
  for (const l of allLearners) {
    if (!l) continue;
    const key = l.id || l.admissionNumber || l.admNo || l.assessmentNumber || l.name || JSON.stringify(l);
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, l);
    }
  }

  const unifiedList = Array.from(uniqueMap.values());

  if (unifiedList.length > 0) {
    // Save to primary unified keys
    localStorage.setItem('munyaka_learners_v2', JSON.stringify(unifiedList));
    localStorage.setItem('munyaka_learners', JSON.stringify(unifiedList));

    // Update central db
    let centralDb: any = { learners: [], staff: [] };
    try {
      const centralRaw = localStorage.getItem('munyaka_central_db');
      if (centralRaw) {
        const parsedCentral = JSON.parse(centralRaw);
        if (parsedCentral && typeof parsedCentral === 'object') {
          centralDb = parsedCentral;
        }
      }
    } catch (e) {}

    centralDb.learners = unifiedList;
    if (centralDb.students) delete centralDb.students;
    localStorage.setItem('munyaka_central_db', JSON.stringify(centralDb));
  }

  return unifiedList;
};
