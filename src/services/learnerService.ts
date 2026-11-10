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

export const normalizeLearner = (item: any): Learner => {
  if (!item) return {} as Learner;
  const admissionNo = item.admissionNo || item.adm_no || item.admission_no || item.admissionNumber || item.admNo || item.id || '—';
  const assessmentNo = item.assessmentNo || item.assessment_no || item.birth_cert_no || item.assessmentNumber || item.birthCertificateNo || item.birthCertNo || item.idValue || '—';
  const fullName = item.fullName || item.name || item.full_name || item.studentName || item.student_name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unregistered Learner';
  const grade = item.grade || item.class || item.grade_level || item.class_name || 'Grade 6';
  const stream = item.stream || item.stream_name || item.streamName || 'BLUE';
  const gender = item.gender || item.sex || 'Male';
  const dob = item.dob || item.date_of_birth || item.birthDate || '—';
  const guardianName = item.guardianName || item.parent_name || item.guardian_name || item.parentName || item.guardian || '—';
  const guardianPhone = item.guardianPhone || item.phone || item.parent_phone || item.phone_number || item.phoneNumber || item.parentPhone || '—';

  return {
    ...item,
    id: item.id || item._id || admissionNo,
    admissionNo,
    admissionNumber: admissionNo,
    assessmentNo,
    assessmentNumber: assessmentNo,
    fullName,
    name: fullName,
    grade,
    gradeLevel: grade,
    stream,
    gender,
    sex: gender,
    dob,
    dateOfBirth: dob,
    guardianName,
    parentName: guardianName,
    guardianPhone,
    phoneNumber: guardianPhone
  };
};

export const formatLearnerDoc = (l: any): Learner => {
  return normalizeLearner(l);
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
