const LEARNERS_DB_KEY = 'munyaka_learners_v2';

export function getStoredLearners(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEARNERS_DB_KEY) || localStorage.getItem('munyaka_learners') || localStorage.getItem('school_learners_data');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredLearners(learners: any[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LEARNERS_DB_KEY, JSON.stringify(learners));
  } catch {
    // ignore
  }
}

export function removeStoredLearner(id: string) {
  const learners = getStoredLearners();
  const filtered = learners.filter((l: any) => 
    l.id !== id && 
    l.admissionNumber !== id && 
    l.admissionNo !== id && 
    l.admNo !== id
  );
  saveStoredLearners(filtered);

  for (const key of ['munyaka_learners_v2', 'munyaka_learners', 'school_learners_data']) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((l: any) => 
            l.id !== id && 
            l.admissionNumber !== id && 
            l.admissionNo !== id && 
            l.admNo !== id
          );
          localStorage.setItem(key, JSON.stringify(cleaned));
        }
      }
    } catch {
      // ignore
    }
  }
}
