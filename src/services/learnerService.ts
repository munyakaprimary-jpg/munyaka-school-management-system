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

const STORAGE_KEY = STORAGE_KEYS.LEARNERS;

export const formatLearnerDoc = (l: any): Learner => {
  if (!l) return {} as Learner;
  const fullName = l.fullName || l.name || l.studentName || `${l.firstName || ''} ${l.lastName || ''}`.trim() || '';
  const admissionNumber = l.admissionNumber || l.admissionNo || l.admNo || '';
  const identifierValue = l.idValue || l.identifierValue || l.assessmentNo || l.assessmentNumber || l.birthCertNo || l.birthCertificateNo || '';
  const gradeLevel = l.gradeLevel || l.grade || '';
  const stream = l.stream || '';
  const gender = l.gender || l.sex || '';
  const dateOfBirth = l.dateOfBirth || l.dob || '';
  const parentName = l.parentName || l.parentGuardian || '';
  const phoneNumber = l.phoneNumber || l.phone || '';

  return {
    ...l,
    id: l.id || l._id || admissionNumber || `MUN-${Date.now()}`,
    admissionNumber: admissionNumber || l.admissionNumber || '',
    admissionNo: admissionNumber || l.admissionNo || '',
    idValue: identifierValue || l.idValue || '',
    identifierValue: identifierValue || l.identifierValue || '',
    identifierType: l.identifierType || (l.birthCertificateNo || l.birthCertNo ? 'birthCert' : 'assessment'),
    assessmentNo: l.assessmentNo || l.assessmentNumber || (l.identifierType === 'assessment' || !l.birthCertificateNo ? identifierValue : ''),
    birthCertNo: l.birthCertNo || l.birthCertificateNo || (l.identifierType === 'birthCert' || l.birthCertificateNo ? identifierValue : ''),
    birthCertificateNo: l.birthCertificateNo || l.birthCertNo || identifierValue || '',
    fullName: fullName || l.fullName || l.name || '',
    name: fullName || l.name || l.fullName || '',
    gradeLevel: gradeLevel || l.gradeLevel || '',
    grade: gradeLevel || l.grade || '',
    stream: stream || l.stream || '',
    gender: gender || l.gender || '',
    dateOfBirth: dateOfBirth || l.dateOfBirth || l.dob || '',
    dob: dateOfBirth || l.dob || l.dateOfBirth || '',
    parentName: parentName || l.parentName || l.parentGuardian || '',
    parentGuardian: parentName || l.parentGuardian || l.parentName || '',
    phoneNumber: phoneNumber || l.phoneNumber || l.phone || '',
    phone: phoneNumber || l.phone || l.phoneNumber || ''
  };
};

export const learnerService = {
  async getLearners(): Promise<Learner[]> {
    try {
      let data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        const legacyData = localStorage.getItem('munyaka_learners_v2') || localStorage.getItem('munyaka_students');
        if (legacyData) {
          localStorage.setItem(STORAGE_KEY, legacyData);
          data = legacyData;
        }
      }
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(formatLearnerDoc);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(learners));
    return formatted;
  },

  async deleteLearner(id: string): Promise<boolean> {
    try {
      let learners = await this.getLearners();
      learners = learners.filter(l => l.id !== id && l.admissionNumber !== id && l.admNo !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(learners));
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

export const generateAdmissionNumber = (existingLearners: any[]) => {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `-${currentYear}`;
  
  // Find existing learners for this year to determine next sequence
  const currentYearLearners = (existingLearners || []).filter(l => {
    const adm = l.admNo || l.admissionNo || l.admissionNumber || '';
    return adm.includes(yearPrefix);
  });

  let maxSeq = 0;
  currentYearLearners.forEach(l => {
    const adm = l.admNo || l.admissionNo || l.admissionNumber || '';
    // Extract middle digits e.g., MUN-049-2026 -> 49
    const parts = adm.split('-');
    if (parts.length >= 2) {
      const seq = parseInt(parts[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  const nextSeq = maxSeq + 1;
  const formattedSeq = String(nextSeq).padStart(3, '0');
  return `MUN-${formattedSeq}-${currentYear}`;
};

export const generateLearnerId = (existingLearners?: any[]) => {
  if (existingLearners && existingLearners.length > 0) {
    return generateAdmissionNumber(existingLearners);
  }
  // Fallback for when no existing learners are available
  const currentYear = new Date().getFullYear();
  return `MUN-001-${currentYear}`;
};
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
