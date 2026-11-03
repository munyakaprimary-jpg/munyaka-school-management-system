export interface Learner {
  id: string;
  admissionNo: string;
  fullName: string;
  grade: string;
  stream: string;
  guardian: string;
  phone: string;
  location: string;
  identifierType?: 'assessment' | 'birth_cert';
  identifierValue?: string;
  assessmentNo?: string;
  birthCertNo?: string;
  // Optional legacy/helper fallback fields for cross-module compatibility
  admNo?: string;
  admissionNumber?: string;
  name?: string;
  gender?: string;
  assessmentNo?: string;
  birthCertificateNo?: string;
  status?: string;
  dob?: string;
  dateOfAdmission?: string;
  nemisUpi?: string;
  previousSchool?: string;
  previousSchoolClearanceRef?: string;
  transferReason?: string;
  email?: string;
  health?: string;
  needs?: string;
  feeBalance?: number;
  totalBilled?: number;
  totalPaid?: number;
  balance?: number;
  feeHistory?: unknown[];
  coCurricularActivities?: string;
  examType?: string;
  assessment?: string;
  parentName?: string;
}

export interface LearnerFilters {
  searchTerm: string;
  filterGrade: string;
  filterStream: string;
}
