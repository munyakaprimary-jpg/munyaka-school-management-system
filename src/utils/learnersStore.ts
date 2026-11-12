/**
 * Unified Learners Persistence Store (`munyaka_learners`)
 */

export interface PersistentLearner {
  id: string;
  admissionNumber?: string;
  name: string;
  grade: string;
  stream: string;
  gender: string;
  parentPhone?: string;
  balance?: number;
  status?: string;
  [key: string]: any;
}

export const LEARNERS_DB_KEY = 'munyaka_learners';

export function getStoredLearners(): PersistentLearner[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LEARNERS_DB_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveStoredLearners(learners: PersistentLearner[]): void {
  if (typeof window === 'undefined') return;
  try {
    const json = JSON.stringify(learners);
    localStorage.setItem(LEARNERS_DB_KEY, json);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('munyaka_learners_updated', { detail: { count: learners.length } }));
  } catch (e) {
    console.error('[munyaka_learners] saveStoredLearners error:', e);
  }
}
