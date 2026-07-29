import { TransferStudent, TransferHistory } from '@/types/transfer';

export const TRANSFER_STUDENTS: TransferStudent[] = [
  {
    id: "1",
    name: "Brian Kiptoo",
    assessment: "A827361",
    grade: "4",
    stream: "Blue",
    gender: "M",
    dob: "2014-05-12",
    admissionDate: "2019-01-15",
    guardian: "Samuel Kiptoo",
    phone: "+254 712 000 111",
    email: "sam.kiptoo@email.com",
    health: "None",
    needs: "None",
    status: "Active",
    feeBalance: 3000,
    lastFeePayment: "Oct 15, 2024"
  },
  {
    id: "2",
    name: "Mary Atieno",
    assessment: "A827362",
    grade: "4",
    stream: "Blue",
    gender: "F",
    dob: "2014-08-20",
    admissionDate: "2019-01-15",
    guardian: "Grace Atieno",
    phone: "+254 712 000 222",
    email: "g.atieno@email.com",
    health: "Asthma",
    needs: "None",
    status: "Active",
    feeBalance: 0,
    lastFeePayment: "Oct 15, 2024"
  },
  {
    id: "3",
    name: "Emmanuel Maina",
    assessment: "A827363",
    grade: "4",
    stream: "Green",
    gender: "M",
    dob: "2014-03-15",
    admissionDate: "2019-01-15",
    guardian: "David Maina",
    phone: "+254 712 000 333",
    email: "d.maina@email.com",
    health: "None",
    needs: "Vision Support",
    status: "Active",
    feeBalance: 7500,
    lastFeePayment: "Sep 20, 2024"
  }
];

export const TRANSFER_HISTORY: TransferHistory[] = [
  {
    id: "TR-001",
    studentId: "1",
    studentName: "Brian Kiptoo",
    transferDate: "2024-10-20",
    destinationSchool: "St. Mary's School",
    reason: "Family relocation to Nairobi",
    feeBalanceAtTransfer: 3000,
    isFeeCleared: false,
    bursarSignature: true,
    headteacherSignature: true,
    certificateUrl: "/certificates/tr-001.pdf"
  },
  {
    id: "TR-002",
    studentId: "2",
    studentName: "Mary Atieno",
    transferDate: "2024-09-15",
    destinationSchool: "Greenfield Academy",
    reason: "Parents' job transfer",
    feeBalanceAtTransfer: 0,
    isFeeCleared: true,
    bursarSignature: true,
    headteacherSignature: true,
    certificateUrl: "/certificates/tr-002.pdf"
  }
];