export const getNormalizedLearners = () => {
  try {
    const raw = localStorage.getItem('munyaka_learners_v2');
    const learners = raw ? JSON.parse(raw) : [];
    
    // Deduplicate by ID
    const uniqueLearnersMap = new Map();
    learners.forEach((l: any) => {
      const key = l.id || l.learnerId || l.admNo;
      if (key) uniqueLearnersMap.set(key, l);
    });
    
    return Array.from(uniqueLearnersMap.values());
  } catch (e) {
    console.error("Error reading learners:", e);
    return [];
  }
};

export const getActiveStaff = () => {
  try {
    const raw = localStorage.getItem('munyaka_users_v1');
    const users = raw ? JSON.parse(raw) : [];
    return users.filter((u: any) => u.role === 'Teacher' || u.role === 'Teaching Staff');
  } catch {
    return [];
  }
};
