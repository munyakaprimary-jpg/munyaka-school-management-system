export interface Learner {
  id: string;
  admissionNumber?: string;
  admissionNo?: string;
  admNo?: string;
  identifierValue?: string;
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

export const learnerService = {
  async getLearners(): Promise<Learner[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      console.error('Error fetching learners:', e);
      return [];
    }
  },

  async saveLearner(learner: Partial<Learner>): Promise<Learner> {
    const learners = await this.getLearners();
    const id = learner.id || `MUN-${Date.now()}`;
    const newLearner = { ...learner, id } as Learner;
    
    const existingIndex = learners.findIndex(l => (l.id && l.id === id) || (l.admissionNumber && l.admissionNumber === learner.admissionNumber));
    if (existingIndex >= 0) {
      learners[existingIndex] = { ...learners[existingIndex], ...newLearner };
    } else {
      learners.unshift(newLearner);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(learners));
    return newLearner;
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

export const formatLearnerDoc = (l: any) => l;
export const generateLearnerId = () => `MUN-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;
export const findExistingLearner = (list: any[], l: any) => list.find(item => item.id === l.id || item.admissionNumber === l.admissionNumber);
export const deduplicateLearnersById = (list: any[]) => list;
export const dedupeLearnersById = (list: any[]) => list;
export const deduplicateLearners = (list: any[]) => list;

export const saveLearner = async (learner: Partial<Learner>): Promise<Learner> => {
  return learnerService.saveLearner(learner);
};

export const deleteLearner = async (id: string): Promise<boolean> => {
  return learnerService.deleteLearner(id);
};
