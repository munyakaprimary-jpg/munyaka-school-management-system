export interface TransferStudent {
  id: string;
  name: string;
  assessment: string;
  grade: string;
  stream: string;
  gender: string;
  dob: string;
  admissionDate: string;
  guardian: string;
  phone: string;
  email: string;
  health: string;
  needs: string;
  status: 'Active' | 'Transferred' | 'Graduated' | 'Archived';
  feeBalance: number;
  lastFeePayment?: string;
}

export interface TransferSetupData {
  exitDate: string;
  destinationSchool: string;
  reason: string;
  feeBalance: number;
  isFeeCleared: boolean;
}

export interface ClearanceCertificateData {
  serialNumber: string;
  studentName: string;
  gender: string;
  admissionDate: string;
  lastGrade: string;
  stream: string;
  feeClearanceStatus: 'CLEARED' | 'PENDING';
  balance: number;
  bursarSignature: boolean;
  headteacherSignature: boolean;
  coCurricularActivities?: string;
  headteacherRemarks?: string;
  transferDate: string;
  destinationSchool: string;
}

export interface TransferHistory {
  id: string;
  studentId: string;
  studentName: string;
  transferDate: string;
  destinationSchool: string;
  reason: string;
  feeBalanceAtTransfer: number;
  isFeeCleared: boolean;
  bursarSignature: boolean;
  headteacherSignature: boolean;
  certificateUrl?: string;
}