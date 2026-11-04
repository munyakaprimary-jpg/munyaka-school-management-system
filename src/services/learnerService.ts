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

const STORAGE_KEY = 'munyaka_learners_v2';

export const formatLearnerDoc = (l: any): Learner => {
  if (!l) return {} as Learner;
  return {
    ...l,
    id: l.id || l._id || l.admissionNumber || l.admissionNo || `MUN-${Date.now()}`,
    admissionNumber: l.admissionNumber || l.admissionNo || l.admNo || '',
    identifierValue: l.identifierValue || l.assessmentNo || l.assessmentNumber || l.birthCertNo || l.birthCertificateNo || '',
    identifierType: l.identifierType || (l.birthCertNo ? 'Birth Certificate' : 'Assessment No'),
    birthCertNo: l.birthCertNo || l.birthCertificateNo || l.identifierValue || '',
    fullName: l.fullName || l.name || `${l.firstName || ''} ${l.lastName || ''}`.trim() || '',
    gradeLevel: l.gradeLevel || l.grade || '',
    stream: l.stream || '',
    gender: l.gender || l.sex || '',
    dateOfBirth: l.dateOfBirth || l.dob || '',
    parentName: l.parentName || l.parentGuardian || '',
    phoneNumber: l.phoneNumber || l.phone || ''
  };
};

export const learnerService = {
  async getLearners(): Promise<Learner[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
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

export const generateLearnerId = () => `MUN-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;
export const findExistingLearner = (list: any[], l: any) => list.find(item => item.id === l.id || item.admissionNumber === l.admissionNumber);
export const dedupeLearnersById = (list: any[]) => list;
export const deduplicateLearnersById = (list: any[]) => list;
export const deduplicateLearners = (list: any[]) => list;
