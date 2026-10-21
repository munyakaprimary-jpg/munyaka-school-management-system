/**
 * learnerService.ts — Canonical service for learner ID standardization, normalization, and deduplication.
 */

export const LEARNER_ID_PREFIX = 'learner-';

/**
 * Enforce a uniform prefix structure whenever a new learner document is created in Firestore or localStorage.
 */
export const generateLearnerId = (): string => {
  return `${LEARNER_ID_PREFIX}${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

/**
 * Normalizes any ID (legacy numeric or prefixed string) into the canonical prefixed format.
 */
export const normalizeLearnerId = (id?: string | number | null): string => {
  if (id === undefined || id === null || id === '') return '';
  const raw = String(id).trim();
  if (!raw) return '';
  return raw.startsWith(LEARNER_ID_PREFIX) ? raw : `${LEARNER_ID_PREFIX}${raw}`;
};

/**
 * Normalization guard on fetching: handles both legacy numeric IDs and new prefixed IDs seamlessly.
 */
export const formatLearnerDoc = (docSnap: any) => {
  const data = typeof docSnap?.data === 'function' ? docSnap.data() : (docSnap || {});
  const rawId = docSnap?.id ?? data?.id ?? generateLearnerId();
  const id = String(rawId);
  return {
    ...data,
    id, // Handles both legacy '1790437574910' and 'learner-179069...'
  };
};

/**
 * Generates candidate ID variations for deduplication check.
 */
export const getLearnerIdCandidates = (id?: string | number | null): string[] => {
  if (id === undefined || id === null || id === '') return [];
  const raw = String(id).trim();
  if (!raw) return [];
  const candidates = new Set<string>();
  candidates.add(raw);
  if (raw.startsWith(LEARNER_ID_PREFIX)) {
    candidates.add(raw.slice(LEARNER_ID_PREFIX.length));
  } else {
    candidates.add(`${LEARNER_ID_PREFIX}${raw}`);
  }
  return Array.from(candidates);
};

/**
 * Canonical key used to detect that two records are the same learner document.
 * Legacy numeric IDs ('1790437574910') and prefixed IDs ('learner-1790437574910')
 * resolve to the same key.
 */
export const getLearnerDedupeKey = (learner: any): string => {
  const rawId = learner?.id ?? learner?.learnerId ?? learner?.documentId;
  if (rawId !== undefined && rawId !== null && String(rawId).trim() !== '') {
    const raw = String(rawId).trim();
    const bare = raw.startsWith(LEARNER_ID_PREFIX) ? raw.slice(LEARNER_ID_PREFIX.length) : raw;
    return `id:${bare.toLowerCase()}`;
  }
  const adm = learner?.admissionNumber ?? learner?.admission_number ?? learner?.admNo;
  if (adm !== undefined && adm !== null && String(adm).trim() !== '') {
    return `adm:${String(adm).trim().toLowerCase()}`;
  }
  const name = learner?.name ?? learner?.fullName;
  if (name !== undefined && name !== null && String(name).trim() !== '') {
    return `name:${String(name).trim().toLowerCase()}`;
  }
  return '';
};

/**
 * Collapses duplicate learner documents that differ only by the ID prefix format.
 */
export const dedupeLearnersById = (learners: any[]): any[] => {
  if (!Array.isArray(learners)) return [];
  const map = new Map<string, any>();
  const order: string[] = [];

  learners.forEach((l) => {
    if (!l) return;
    const key = getLearnerDedupeKey(l);
    if (!key) {
      order.push(`__anon_${order.length}`);
      map.set(`__anon_${order.length - 1}`, l);
      return;
    }
    if (!map.has(key)) order.push(key);
    map.set(key, { ...(map.get(key) || {}), ...l });
  });

  return order.map((key) => map.get(key)).filter(Boolean);
};

/**
 * Deduplication check on import/save:
 * Check if a document with either id or learner-${id} already exists before writing.
 */
export const findExistingLearner = (learners: any[], candidate: any): any | undefined => {
  if (!candidate || !Array.isArray(learners)) return undefined;
  const candidateIds = getLearnerIdCandidates(candidate.id ?? candidate.learnerId ?? candidate.documentId);
  const admissionNumber = candidate.admissionNumber ? String(candidate.admissionNumber).trim().toLowerCase() : null;

  return learners.find((l) => {
    if (!l) return false;
    const existingIds = getLearnerIdCandidates(l?.id ?? l?.learnerId ?? l?.documentId);
    const idMatch = existingIds.some((id) => candidateIds.includes(id));
    
    if (idMatch) return true;

    if (admissionNumber && l.admissionNumber) {
      if (String(l.admissionNumber).trim().toLowerCase() === admissionNumber) {
        return true;
      }
    }
    return false;
  });
};
