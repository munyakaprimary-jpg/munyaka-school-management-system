export interface Learner {
  id: string;
  admissionNo: string;
  assessmentNo?: string;
  fullName: string;
  grade: string;
  stream: string;
  gender: string;
  dob?: string;
  guardianName?: string;
  guardianPhone?: string;
  createdAt?: string;
  [key: string]: any;
}
