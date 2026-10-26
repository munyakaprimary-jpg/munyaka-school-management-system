import { Learner } from '@/types/learners';

const MASTER_KEY = 'munyaka_learners';

export const generateLearnerId = (): string => `learner-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const formatLearnerDoc = (raw: any): Learner => ({
  id: raw.id || `learner-${Date.now()}`,
  admNo: raw.admNo || raw.admissionNumber || raw.admissionNo || '',
  name: raw.name || raw.fullName || '',
  grade: raw.grade || raw.gradeLevel || 'Grade 1',
  stream: raw.stream || 'BLUE',
  gender: raw.gender || 'Female',
  guardian: raw.guardian || raw.parentName || '',
  phone: raw.phone || raw.phoneNumber || '',
  status: raw.status || 'Active',
  dob: raw.dob || raw.dateOfBirth || '',
  ...raw
});

export const getLearners = (): Learner[] => {
  const data = localStorage.getItem(MASTER_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

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

export const saveLearners = (learners: Learner[]): void => {
  localStorage.setItem(MASTER_KEY, JSON.stringify(learners));
  window.dispatchEvent(new Event('munyaka_learners_updated'));
};

export const addLearner = (learner: Learner): Learner[] => {
  const learners = getLearners();
  const updated = [learner, ...learners];
  saveLearners(updated);
  return updated;
};

export const updateLearner = (updatedLearner: Learner): Learner[] => {
  const learners = getLearners();
  const updated = learners.map(l => l.id === updatedLearner.id ? updatedLearner : l);
  saveLearners(updated);
  return updated;
};

export const deleteLearner = (id: string): Learner[] => {
  const learners = getLearners();
  const updated = learners.filter(l => l.id !== id);
  saveLearners(updated);
  return updated;
};

export const learnerService = {
  getLearners,
  saveLearners,
  addLearner,
  updateLearner,
  deleteLearner
};
