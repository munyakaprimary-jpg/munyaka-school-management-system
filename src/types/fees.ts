export interface FeeStructure {
  year: string;
  term: string;
  gradeId: string;
  amount: number;
}

export interface StudentFeeRecord {
  id: string;
  student: string;
  paid: number;
  total: number;
  balance: number;
  status: string;
}

// ─────────────────────────────────────────────
// Payment methods
// ─────────────────────────────────────────────
export type PaymentMethod = 'cash' | 'bank' | 'cheque' | 'mpesa';

export interface CashPaymentDetails {
  receivedBy: string;
}

export interface BankPaymentDetails {
  bankName: string;
  branch: string;
  transactionRef: string;
}

export interface ChequePaymentDetails {
  bankName: string;
  branch: string;
  chequeNumber: string;
}

export interface MpesaPaymentDetails {
  receiptNumber: string;
}

export type PaymentDetails =
  | CashPaymentDetails
  | BankPaymentDetails
  | ChequePaymentDetails
  | MpesaPaymentDetails;

// ─────────────────────────────────────────────
// Enriched transaction record
// ─────────────────────────────────────────────
export interface Transaction {
  id: string;
  date: string;
  amount: number;
  method: string;
  ref: string;
  category: string;
  invoiceId?: string;
  description?: string;
  currency?: string;
  status?: string;
  paidAt?: string;
  // Enrichment fields
  studentId?: string;
  grade?: string;
  stream?: string;
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails;
}
