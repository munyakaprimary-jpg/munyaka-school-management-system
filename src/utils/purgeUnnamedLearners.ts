// Purge and sanitize all local storage keys to strip unnamed learners
try {
  const keys = ['munyaka_learners_v2', 'munyaka_learners', 'munyaka_students', 'school_learners_data', 'school_students', 'munyaka_central_db'];
  keys.forEach(key => {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((l: any) => {
          if (!l) return false;
          const name = String(l.fullName || l.name || '').trim();
          return name && name !== 'Unnamed Learner' && name !== 'Unknown Learner' && !name.includes('Unnamed');
        });
        localStorage.setItem(key, JSON.stringify(cleaned));
      } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.learners)) {
        parsed.learners = parsed.learners.filter((l: any) => {
          if (!l) return false;
          const name = String(l.fullName || l.name || '').trim();
          return name && name !== 'Unnamed Learner' && name !== 'Unknown Learner' && !name.includes('Unnamed');
        });
        localStorage.setItem(key, JSON.stringify(parsed));
      }
    } catch (e) {}
  });
} catch (e) {}
