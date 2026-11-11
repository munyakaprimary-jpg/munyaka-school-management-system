import { STORAGE_KEYS } from '../constants/storageKeys';
import type { Learner } from '@/types/learners';
import { getLearners as getStorageLearners, saveLearners as saveStorageLearners } from '@/utils/storage';

export { Learner };

export const normalizeLearner = (item: any): Learner => {
  if (!item) return { id: '', admissionNo: '', fullName: '', grade: '', stream: '', gender: '' };
  
  const admissionNo = String(item.admissionNo || item.admissionNumber || item.admNo || item.id || '').trim();
  const assessmentNo = String(item.assessmentNo || item.assessmentNumber || item.birthCertificateNo || item.birthCertNo || item.idValue || '').trim() || undefined;
  const fullName = String(item.fullName || item.name || item.studentName || '').trim();
  const grade = String(item.grade || item.gradeLevel || item.class || '').trim();
  const stream = String(item.stream || item.streamName || '').trim();
  const gender = String(item.gender || item.sex || '').trim();
  const dob = String(item.dob || item.dateOfBirth || '').trim() || undefined;
  const guardianName = String(item.guardianName || item.parentName || item.guardian || item.parentGuardian || '').trim() || undefined;
  const guardianPhone = String(item.guardianPhone || item.phone || item.phoneNumber || item.parentPhone || '').trim() || undefined;
  const createdAt = item.createdAt ? String(item.createdAt).trim() : undefined;

  return {
    id: String(item.id || admissionNo || `lrn_${Math.random().toString(36).slice(2, 9)}`),
    admissionNo,
    assessmentNo,
    fullName,
    grade,
    stream,
    gender,
    dob,
    guardianName,
    guardianPhone,
    createdAt
  };
};

export const formatLearnerDoc = (l: any): Learner => {
  return normalizeLearner(l);
};

export const learnerService = {
  async getLearners(): Promise<Learner[]> {
    try {
      const learners = getStorageLearners();
      return (learners || []).map(formatLearnerDoc);
    } catch (e) {
      console.error('Error fetching learners:', e);
      return [];
    }
  },

  async saveLearner(learner: Partial<Learner>): Promise<Learner> {
    const learners = await this.getLearners();
    const formatted = formatLearnerDoc(learner);
    const id = formatted.id || formatted.admissionNo;
    
    const existingIndex = learners.findIndex(l => (l.id && l.id === id) || (l.admissionNo && l.admissionNo === formatted.admissionNo));
    if (existingIndex >= 0) {
      learners[existingIndex] = { ...learners[existingIndex], ...formatted };
    } else {
      learners.unshift(formatted);
    }
    saveStorageLearners(learners);
    return formatted;
  },

  async deleteLearner(id: string): Promise<boolean> {
      try {
        let learners = await this.getLearners();
        const target = learners.find(l =>
          l.id === id || l.admissionNo === id || l.assessmentNo === id
        );
        if (target) {
          const { purgeLearnerPermanently } = await import('@/services/purgeLearnerService');
          await purgeLearnerPermanently(target);
        }
        learners = learners.filter(l => l.id !== id && l.admissionNo !== id && l.assessmentNo !== id);
        saveStorageLearners(learners);
        return true;
      } catch (e) {
        console.error('Error deleting learner:', e);
        return false;
      }
    }
};

export const fetchLearners = async (): Promise<Learner[]> => {
  return learnerService.getLearners();
};

export const saveLearner = async (learner: Partial<Learner>): Promise<Learner> => {
  return learnerService.saveLearner(learner);
};

export const deleteLearner = async (id: string): Promise<boolean> => {
  return learnerService.deleteLearner(id);
};

export const generateLearnerId = () => `MUN-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;
export const findExistingLearner = (list: any[], l: any) => list.find(item => item.id === l.id || item.admissionNo === l.admissionNo);

export const dedupeLearnersById = (list: any[]) => {
  const seen = new Set<string>();
  return (list || []).filter((learner) => {
    if (!learner) return false;
    const identifier = String(
      learner.admissionNo ||
      learner.id ||
      learner.fullName ||
      ''
    ).trim().toLowerCase();

    if (!identifier || identifier === 'unregistered learner' || seen.has(identifier)) {
      return false;
    }
    seen.add(identifier);
    return true;
  });
};

export const deduplicateLearnersById = dedupeLearnersById;
export const deduplicateLearners = dedupeLearnersById;
