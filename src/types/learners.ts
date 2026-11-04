export interface Learner {
  id: string;
  admissionNo: string;
  admissionNumber?: string;
  fullName: string;
  name?: string;
  grade: string;
  stream: string;
  gender?: string;
  guardian?: string;
  phone?: string;
  location?: string;
  assessmentNo?: string;
  assessmentNumber?: string;
  [key: string]: any;
}
