import { STORAGE_KEYS } from '../constants/storageKeys';

export interface Learner {
  id: string;
  admissionNumber?: string;
  admissionNo?: string;
  admNo?: string;
  identifierValue?: string;
  identifierType?: string;
  assessmentNo?: string;
  assessmentNumber?: string;
  birthCertNo?: string;
  birthCertificateNo?: string;
  fullName?: string;
  name?: string;
  studentName?: string;
  firstName?: string;
  lastName?: string;
  gradeLevel?: string;
  grade?: string;
  stream?: string;
  gender?: string;
  sex?: string;
  dateOfBirth?: string;
  dob?: string;
  parentName?: string;
  parentGuardian?: string;
  phoneNumber?: string;
  phone?: string;
  [key: string]: any;
}

import { STORAGE_KEYS as APP_STORAGE_KEYS, getLearners as getStorageLearners, saveLearners as saveStorageLearners } from '@/utils/storage';
// import type { Learner } from '@/types/learners';



const STORAGE_KEY = STORAGE_KEYS.LEARNERS;

export const formatLearnerDoc = (l: any): Learner => {
  if (!l) return {} as Learner;
  const fullName = l.fullName || l.name || l.studentName || `${l.firstName || ''} ${l.lastName || ''}`.trim() || '';
  const admissionNo = l.admissionNo || l.admissionNumber || l.admNo || '';
  const identifierValue = l.idValue || l.identifierValue || l.assessmentNo || l.assessmentNumber || l.birthCertNo || l.birthCertificateNo || '';
  const grade = l.grade || l.gradeLevel || '';
  const stream = l.stream || '';
  const gender = l.gender || l.sex || '';
  const dob = l.dob || l.dateOfBirth || '';
  const guardianName = l.guardianName || l.parentName || l.parentGuardian || '';
  const guardianPhone = l.guardianPhone || l.phoneNumber || l.phone || l.parentPhone || '';

  return {
    ...l,
    id: l.id || l._id || admissionNo || `MUN-${Date.now()}`,
    admissionNo: admissionNo || '',
    admissionNumber: admissionNo || '',
    assessmentNo: l.assessmentNo || l.assessmentNumber || (l.identifierType === 'assessment' || !l.birthCertificateNo ? identifierValue : ''),
    assessmentNumber: l.assessmentNumber || l.assessmentNo || '',
    fullName: fullName || '',
    name: fullName || '',
    grade: grade || '',
    gradeLevel: grade || '',
    stream: stream || '',
    gender: gender || '',
    dob: dob || '',
    dateOfBirth: dob || '',
    guardianName: guardianName || '',
    parentName: guardianName || '',
    guardianPhone: guardianPhone || '',
    phoneNumber: guardianPhone || ''
  };
};

export const learnerService = {
  async getLearners(): Promise<Learner[]> {
    try {
      const learners = getStorageLearners();
      return learners.map(formatLearnerDoc);
    } catch (e) {
      console.error('Error fetching learners:', e);
      return [];
    }
  },

  async saveLearner(learner: Partial<Learner>): Promise<Learner> {
    const learners = await this.getLearners();
    const formatted = formatLearnerDoc(learner);
    const id = formatted.id;
    
    const existingIndex = learners.findIndex(l => (l.id && l.id === id) || (l.admissionNumber && l.admissionNumber === formatted.admissionNumber));
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
      learners = learners.filter(l => l.id !== id && l.admissionNumber !== id && l.admNo !== id);
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
export const findExistingLearner = (list: any[], l: any) => list.find(item => item.id === l.id || item.admissionNumber === l.admissionNumber);
export const dedupeLearnersById = (list: any[]) => {
  const seen = new Set<string>();
  return (list || []).filter((learner) => {
    if (!learner) return false;
    const identifier = (
      learner.birthCertificateNo ||
      learner.birthCertNo ||
      learner.assessmentNo ||
      learner.admissionNumber ||
      learner.admissionNo ||
      learner.admNo ||
      learner.fullName ||
      learner.name ||
      ''
    ).trim().toLowerCase();

    if (!identifier || seen.has(identifier)) {
      return false;
    }
    seen.add(identifier);
    return true;
  });
};

export const deduplicateLearnersById = dedupeLearnersById;
export const deduplicateLearners = dedupeLearnersById;
