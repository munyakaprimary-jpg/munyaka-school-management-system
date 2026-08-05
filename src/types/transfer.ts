export interface TransferData {
  studentId: string;
  dateOfExit: string;
  destinationSchool: string;
  reason: string;
  feeBalance: number;
  isFeeCleared: boolean;
  coCurricularActivities: string;
  headteacherRemarks: string;
  executedBy: string;
  executedAt: string;
  certificateNumber: string;
}

export interface StudentTransferInfo {
  id: string;
  name: string;
  assessment: string;
  grade: string;
  stream: string;
  gender: string;
  dob: string;
  guardian: string;
  phone: string;
  email: string;
  health: string;
  needs: string;
  feeBalance: number;
  status: 'Active' | 'Transferred' | 'Graduated' | 'Suspended';
  dateOfAdmission: string;
  coCurricularActivities: string;
}