import { Learner } from '@/types/learners';

const LOCAL_STORAGE_KEY = 'munyaka_learners';

export const initLearnerStorageAlias = (): void => {
  try {
    const studentsLegacy = localStorage.getItem('munyaka_students');
    const learnersMaster = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (studentsLegacy && !learnersMaster) {
      localStorage.setItem(LOCAL_STORAGE_KEY, studentsLegacy);
    } else if (learnersMaster && !studentsLegacy) {
      localStorage.setItem('munyaka_students', learnersMaster);
    }
  } catch (err) {
    console.warn('[learnerService] Storage alias init warning:', err);
  }
};

export const generateLearnerId = (): string => `learner-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const formatLearnerDoc = (raw: any): Learner => ({
  id: raw.id || `learner-${Date.now()}`,
  admNo: raw.admNo || raw.admissionNumber || raw.admissionNo || '',
  name: raw.name || raw.fullName || 'Unknown Learner',
  grade: raw.grade || raw.gradeLevel || 'Grade 1',
  stream: raw.stream || 'BLUE',
  gender: raw.gender || 'Female',
  guardian: raw.guardian || raw.parentName || '',
  phone: raw.phone || raw.phoneNumber || '',
  status: raw.status || 'Active',
  dob: raw.dob || raw.dateOfBirth || '',
  ...raw
});

export const findExistingLearner = (learners: Learner[], idValue: string): Learner | undefined => {
  const clean = String(idValue || '').trim().toUpperCase();
  if (!clean) return undefined;
  return learners.find(l => {
    const aid = String(l.assessmentNo || l.birthCertificateNo || l.admNo || '').trim().toUpperCase();
    return aid === clean;
  });
};

export const deduplicateLearnersById = (learners: Learner[]): Learner[] => {
  const map = new Map<string, Learner>();
  for (const l of learners) {
    const key = l.id || l.admNo || l.name;
    if (key && !map.has(key)) {
      map.set(key, l);
    }
  }
  return Array.from(map.values());
};

export const dedupeLearnersById = deduplicateLearnersById;

export const learnerService = {
  getLearners: (): Learner[] => {
    initLearnerStorageAlias();
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem('munyaka_students') || '[]';
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveLearners: (learners: Learner[]): void => {
    try {
      const data = JSON.stringify(learners);
      localStorage.setItem(LOCAL_STORAGE_KEY, data);
      localStorage.setItem('munyaka_students', data);
      window.dispatchEvent(new Event('munyaka_learners_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('[learnerService] saveLearners failed:', err);
    }
  },

  addLearner: (learner: Learner): Learner[] => {
    const learners = learnerService.getLearners();
    const updated = [learner, ...learners];
    learnerService.saveLearners(updated);
    return updated;
  },

  updateLearner: (updatedLearner: Learner): Learner[] => {
    const learners = learnerService.getLearners();
    const updated = learners.map(l => l.id === updatedLearner.id ? updatedLearner : l);
    learnerService.saveLearners(updated);
    return updated;
  },

  deleteLearner: (id: string): Learner[] => {
    const learners = learnerService.getLearners();
    const updated = learners.filter(l => l.id !== id);
    learnerService.saveLearners(updated);
    return updated;
  }
};
