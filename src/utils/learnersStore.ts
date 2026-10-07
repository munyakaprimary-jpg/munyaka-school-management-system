/**
 * Unified Learners Persistence Store (`munyaka_learners_db`)
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

export const LEARNERS_DB_KEY = 'munyaka_learners_db';
export const SCHOOL_LEARNERS_MASTER = 'school_learners_master';
export const SCHOOL_LEARNERS_DATA = 'school_learners_data';

export function getStoredLearners(): PersistentLearner[] {
  if (typeof window === 'undefined') return [];
  try {
    let all: any[] = [];
    const keys = [
      LEARNERS_DB_KEY,
      SCHOOL_LEARNERS_MASTER,
      SCHOOL_LEARNERS_DATA,
      'munyaka_students',
      'students',
      'learners',
      'pupils',
      'school_students',
      'registered_students',
      'munyaka_registered_students'
    ];

    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            all = [...all, ...parsed];
          }
        } catch {}
      }
    }

    if (all.length > 0) {
      const map = new Map<string, any>();
      all.forEach(l => {
        if (l && (l.id || l.admissionNumber || l.admission_no || l.name)) {
          const key = String(l.id || l.admissionNumber || l.admission_no || l.name).trim().toLowerCase();
          if (!map.has(key)) {
            map.set(key, l);
          }
        }
      });
      const unique = Array.from(map.values());
      try {
        localStorage.setItem(LEARNERS_DB_KEY, JSON.stringify(unique));
        localStorage.setItem(SCHOOL_LEARNERS_MASTER, JSON.stringify(unique));
        localStorage.setItem(SCHOOL_LEARNERS_DATA, JSON.stringify(unique));
      } catch {}
      return unique;
    }
  } catch (e) {
    console.error('getStoredLearners error:', e);
  }
  return [];
}

export function saveStoredLearners(learners: PersistentLearner[]): void {
  if (typeof window === 'undefined') return;
  try {
    const json = JSON.stringify(learners);
    localStorage.setItem(LEARNERS_DB_KEY, json);
    localStorage.setItem(SCHOOL_LEARNERS_MASTER, json);
    localStorage.setItem(SCHOOL_LEARNERS_DATA, json);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('munyaka_learners_updated', { detail: { count: learners.length } }));
  } catch (e) {
    console.error('[munyaka_learners_db] saveStoredLearners error:', e);
  }
}
