// ─── Unified Learner Storage Merge Utility ──────────────────────────────────
// Combines learner records across all known localStorage keys, deduplicates by
// admission number / ID / assessment number, and provides synchronized write-through.

const LEARNER_STORAGE_KEYS = [
  'munyaka_learners_directory',
  'munyaka_learners',
  'munyaka_learners_v2',
  'school_learners_data',
  'munyaka_central_db',
  'munyaka_students',
  'munyaka_master_learners',
  'munyaka_app_learners_v1'
];

export const normalizeLearnerRecord = (l: any) => {
  if (!l || typeof l !== 'object') return null;
  const fullName = String(l.fullName || l.name || l.studentName || l.learnerName || '').trim();
  if (!fullName || fullName === 'undefined undefined' || fullName === 'null null' || fullName === 'Unnamed Learner' || fullName === 'Unregistered Learner' || fullName === 'Unregistered Name') {
    return null;
  }

  const admissionNo = String(l.admissionNo || l.admissionNumber || l.admNo || l.admNumber || '').trim();
  const assessmentNo = String(l.assessmentNo || l.assessmentNumber || l.upi || '').trim();
  const id = String(l.id || l._id || l.learnerId || l.documentId || admissionNo || assessmentNo || '').trim();

  return {
    ...l,
    id: id || admissionNo || assessmentNo,
    fullName,
    admissionNo: admissionNo && admissionNo !== '—' && admissionNo !== '-' && admissionNo !== 'N/A' && admissionNo !== 'undefined' ? admissionNo : '',
    assessmentNo: assessmentNo && assessmentNo !== '—' && assessmentNo !== '-' && assessmentNo !== 'N/A' && assessmentNo !== 'undefined' ? assessmentNo : '',
  };
};

export const mergeStoredLearners = (): any[] => {
  const mergedMap = new Map<string, any>();

  for (const key of LEARNER_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      
      let list: any[] = [];
      if (Array.isArray(parsed)) {
        list = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.learners)) list = parsed.learners;
        else if (Array.isArray(parsed.students)) list = parsed.students;
        else if (Array.isArray(parsed.data)) list = parsed.data;
        else if (Array.isArray(parsed.records)) list = parsed.records;
      }

      for (const item of list) {
        const normalized = normalizeLearnerRecord(item);
        if (!normalized) continue;

        // Create a robust uniqueness key (AdmissionNo first, then ID, then AssessmentNo, then Name)
        const adm = normalized.admissionNo;
        const assess = normalized.assessmentNo;
        const lid = normalized.id;
        const nameKey = normalized.fullName.toLowerCase();

        const uniqueKey = adm ? `adm_${adm}` : (assess ? `assess_${assess}` : (lid && lid.length > 3 ? `id_${lid}` : `name_${nameKey}`));

        // If we already have this record, merge properties (keeping non-empty fields)
        if (mergedMap.has(uniqueKey)) {
          const existing = mergedMap.get(uniqueKey);
          mergedMap.set(uniqueKey, {
            ...existing,
            ...normalized,
            grade: normalized.grade || existing.grade,
            stream: normalized.stream || existing.stream,
            gender: normalized.gender || existing.gender,
            guardianPhone: normalized.guardianPhone || existing.guardianPhone || existing.parentPhone,
            feesBalance: normalized.feesBalance !== undefined ? normalized.feesBalance : existing.feesBalance,
          });
        } else {
          mergedMap.set(uniqueKey, normalized);
        }
      }
    } catch (e) {
      console.error(`[mergeStoredLearners] Error reading key ${key}:`, e);
    }
  }

  return Array.from(mergedMap.values());
};

export const saveMergedLearners = (learners: any[]) => {
  try {
    const valid = (learners || []).map(normalizeLearnerRecord).filter(Boolean);
    const serialized = JSON.stringify(valid);

    // Write to all primary keys to guarantee cross-component and offline sync
    localStorage.setItem('munyaka_learners_directory', serialized);
    localStorage.setItem('munyaka_learners', serialized);
    localStorage.setItem('munyaka_learners_v2', serialized);
    localStorage.setItem('school_learners_data', serialized);
    localStorage.setItem('munyaka_students', serialized);

    // Also update central db wrapper if present
    try {
      const centralRaw = localStorage.getItem('munyaka_central_db');
      const centralDb = centralRaw ? JSON.parse(centralRaw) : {};
      centralDb.learners = valid;
      centralDb.students = valid;
      centralDb.lastUpdated = new Date().toISOString();
      localStorage.setItem('munyaka_central_db', JSON.stringify(centralDb));
    } catch {}

    window.dispatchEvent(new Event('munyaka_learners_updated'));
    window.dispatchEvent(new Event('munyaka:data-changed'));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('[saveMergedLearners] Failed to save learners:', e);
  }
};
