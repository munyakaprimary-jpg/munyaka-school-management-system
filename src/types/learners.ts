export interface Learner {
  id: string;
  admNo: string;
  admissionNumber?: string;
  admissionNo?: string;
  name: string;
  grade: string;
  stream: string;
  gender: string;
  guardian: string;
  phone: string;
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
  assessmentNo?: string;
}

export interface LearnerExamSubmission {
  id: string;
  learnerId: string;
  learnerName: string;
  examId: string;
  examTitle: string;
  submittedAt: string;
  score?: number;
  maxScore?: number;
  status: 'submitted' | 'graded' | 'pending';
  answers?: Record<string, any>;
  feedback?: string;
}

export interface LearnerFilters {
  searchTerm: string;
  filterGrade: string;
  filterStream: string;
}

export interface RegistrationForm {
  fullName: string;
  admissionNo: string;
  assessmentNo: string;
  regGrade: string;
  regStream: string;
  guardianName: string;
  phone: string;
  address: string;
}
