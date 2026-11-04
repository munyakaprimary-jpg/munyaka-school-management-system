import { Learner } from '@/types/learners';

const MASTER_KEY = 'munyaka_learners';

export const generateLearnerId = (): string => `learner-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const formatLearnerDoc = (raw: any): Learner => ({
  id: raw.id || `learner-${Date.now()}`,
  admNo: raw.admNo || raw.admissionNumber || raw.admissionNo || '',
  name: raw.name || raw.fullName || raw.studentName || '',
  grade: raw.grade || raw.gradeLevel || 'Grade 1',
  stream: raw.stream || 'BLUE',
  gender: raw.gender || 'Female',
  guardian: raw.guardian || raw.parentName || '',
  phone: raw.phone || raw.phoneNumber || '',
  status: raw.status || 'Active',
  dob: raw.dob || raw.dateOfBirth || '',
  identifierValue: raw.identifierValue || raw.assessmentNo || raw.assessmentNumber || raw.birthCertNo || raw.birthCertificateNo || '',
  identifierType: raw.identifierType || (raw.birthCertNo || raw.birthCertificateNo ? 'birth_cert' : 'assessment'),
  assessmentNo: raw.assessmentNo || raw.assessmentNumber || (raw.identifierType === 'assessment' ? raw.identifierValue : ''),
  assessmentNumber: raw.assessmentNumber || raw.assessmentNo || '',
  birthCertNo: raw.birthCertNo || raw.birthCertificateNo || (raw.identifierType === 'birth_cert' ? raw.identifierValue : ''),
  birthCertificateNo: raw.birthCertificateNo || raw.birthCertNo || '',
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

export const deduplicateLearners = (learnersList: any[]) => {
  const seen = new Set();
  return (learnersList || []).filter((item) => {
    if (!item) return false;
    const key = item.admissionNo || item.admNo || item.assessmentNo || item.upi || item.id || item._id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const deduplicateLearnersById = (learners: Learner[]): Learner[] => {
  return deduplicateLearners(learners);
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
