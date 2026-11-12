import { getStoredLearners, saveStoredLearners } from '@/utils/learnersStore';

export function removeStoredLearner(id: string) {
  const learners = getStoredLearners();
  const filtered = learners.filter((l: any) => 
    l.id !== id && 
    l.admissionNumber !== id && 
    l.admissionNo !== id && 
    l.admNo !== id
  );
  saveStoredLearners(filtered);

  // Also clean munyaka_learners / munyaka_learners_v2 if present
  for (const key of ['munyaka_learners_v2', 'munyaka_learners']) {
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
