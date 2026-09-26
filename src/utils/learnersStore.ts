/**
 * Unified Learners Persistence Store (`munyaka_learners_db`)
 * Single authoritative source of truth for all learner records across Munyaka Portal.
 */

export const LEARNERS_DB_KEY = 'munyaka_central_db';

export interface PersistentLearner {
  id: string;
  admNo: string;
  admissionNo?: string;
  name: string;
  grade: string;
  stream: string;
  gender: 'Male' | 'Female' | 'Other';
  guardian: string;
  phone: string;
  email?: string;
  dob?: string;
  birthCertificateNo?: string;
  assessmentNo?: string;
  dateOfAdmission?: string;
  enrollmentYear?: number;
  status: 'Active' | 'Transferred' | 'Graduated' | 'Suspended';
  term?: string;
  activeTermId?: string;
  academicYear?: string;
  totalBilled?: number;
  totalPaid?: number;
  balance?: number;
  feeBalance?: number;
  feeHistory?: any[];
  [key: string]: any;
}

/**
 * Get all stored learners from the unified database key, with automatic fallback & self-healing from legacy keys.
 */
export function getStoredLearners(): PersistentLearner[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEARNERS_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Fallback & self-heal from legacy keys if primary is empty
    const legacyKeys = [
      'school_learners_data',
      'munyaka_students',
      'students',
      'learners',
      'pupils',
      'school_students',
      'registered_students',
      'munyaka_registered_students',
    ];

    let maxList: PersistentLearner[] = [];
    for (const lKey of legacyKeys) {
      try {
        const lRaw = localStorage.getItem(lKey);
        if (lRaw) {
          const lParsed = JSON.parse(lRaw);
          if (Array.isArray(lParsed) && lParsed.length > maxList.length) {
            maxList = lParsed;
          }
        }
      } catch {}
    }

    if (maxList.length > 0) {
      // Self-heal primary storage
      try {
        localStorage.setItem(LEARNERS_DB_KEY, JSON.stringify(maxList));
      } catch {}
      return maxList;
    }

    return [];
  } catch (err) {
    console.error('[munyaka_learners_db] getStoredLearners error:', err);
    return [];
  }
}

/**
 * Save or update a learner in the unified database key and dispatch update events.
 */
export function saveStoredLearner(learner: Partial<PersistentLearner> & { id?: string; name: string }): PersistentLearner {
  if (typeof window === 'undefined') throw new Error('Cannot save learner outside browser');
  try {
    const existing = getStoredLearners();
    const learnerId = learner.id ?? `stu_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Read active academic calendar settings for default term/year
    let activeTerm = 'Term 1';
    let activeYear = '2026';
    try {
      const calRaw = localStorage.getItem('munyaka_academic_calendar') || localStorage.getItem('munyaka_owner_academic') || localStorage.getItem('school_academic_settings');
      if (calRaw) {
        const parsed = JSON.parse(calRaw);
        if (parsed.activeTerm) activeTerm = parsed.activeTerm;
        if (parsed.activeYear) activeYear = String(parsed.activeYear);
      }
    } catch {}

    const fullLearner: PersistentLearner = {
      id: learnerId,
      admNo: String(learner.admNo ?? learner.admissionNo ?? `ADM-${Math.floor(1000 + Math.random() * 9000)}`),
      name: String(learner.name ?? 'Unnamed Learner'),
      grade: String(learner.grade ?? 'Grade 1'),
      stream: String(learner.stream ?? 'North'),
      gender: (learner.gender ?? 'Female') as any,
      guardian: String(learner.guardian ?? 'Parent'),
      phone: String(learner.phone ?? ''),
      status: (learner.status ?? 'Active') as any,
      term: String(learner.term ?? activeTerm),
      activeTermId: String(learner.activeTermId ?? learner.term ?? activeTerm),
      academicYear: String(learner.academicYear ?? activeYear),
      totalBilled: Number(learner.totalBilled ?? 0),
      totalPaid: Number(learner.totalPaid ?? 0),
      balance: Number(learner.balance ?? 0),
      feeBalance: Number(learner.feeBalance ?? 0),
      feeHistory: Array.isArray(learner.feeHistory) ? learner.feeHistory : [],
      ...learner,
    };

    const updated = [fullLearner, ...existing.filter(s => s.id !== learnerId && s.admNo !== fullLearner.admNo)];
    
    // Write directly to primary DB and sync legacy keys for full backwards compatibility
    localStorage.setItem(LEARNERS_DB_KEY, JSON.stringify(updated));
    localStorage.setItem('school_learners_data', JSON.stringify(updated));
    localStorage.setItem('munyaka_students', JSON.stringify(updated));

    // Automatically push to /api/save-seed so initialSeedData.ts is updated on disk immediately
    try {
      const fullState = {
        ...(typeof window !== 'undefined' && (window as any).__munyaka_get_full_state ? (window as any).__munyaka_get_full_state() : {}),
        students: updated,
        staff: JSON.parse(localStorage.getItem('munyaka_staff') || '[]'),
        fees: JSON.parse(localStorage.getItem('munyaka_fees') || '[]'),
        attendance: JSON.parse(localStorage.getItem('munyaka_attendance') || '{}'),
      };
      fetch('/api/save-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullState)
      }).catch(() => {});
    } catch {}

    // Dispatch update events for reactive UI subscribers
    window.dispatchEvent(new Event('students-updated'));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key: LEARNERS_DB_KEY } }));

    return fullLearner;
  } catch (err) {
    console.error('[munyaka_learners_db] saveStoredLearner error:', err);
    throw err;
  }
}

/**
 * Remove a learner by id.
 */
export function removeStoredLearner(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredLearners();
    const updated = existing.filter(s => s.id !== id && s.admNo !== id);
    localStorage.setItem(LEARNERS_DB_KEY, JSON.stringify(updated));
    localStorage.setItem('school_learners_data', JSON.stringify(updated));
    localStorage.setItem('munyaka_students', JSON.stringify(updated));

    window.dispatchEvent(new Event('students-updated'));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key: LEARNERS_DB_KEY } }));
  } catch (err) {
    console.error('[munyaka_learners_db] removeStoredLearner error:', err);
  }
}
