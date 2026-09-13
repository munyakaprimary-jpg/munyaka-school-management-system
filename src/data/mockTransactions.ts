/**
 * Mock fee transactions for the StudentProfile consolidated summary.
 * Mirrors the shape of the real `munyaka_transactions` localStorage key.
 */

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  method: string;
  ref: string;
  category: string;
  studentId?: string;
  learnerName?: string;
  admNo?: string;
  grade?: string;
  stream?: string;
  invoiceId?: string;
  description?: string;
  currency?: string;
  status?: string;
  paymentMethod?: string;
  paymentDetails?: any;
  paidAt?: string;
}

export const transactions: Transaction[] = [
  {
    id: 'TX-516',
    date: '8/26/2026',
    amount: 700,
    method: 'M-Pesa',
    ref: 'AUTO-GEN',
    category: 'Tuition',
    studentId: '1787737452457',
    grade: '',
  },
  {
    id: 'TX-901',
    date: '8/15/2026',
    amount: 5000,
    method: 'M-Pesa',
    ref: 'RI82JD91S',
    category: 'Tuition',
    studentId: '1787737452457',
    grade: '',
  },
  {
    id: 'TX-882',
    date: '7/28/2026',
    amount: 2000,
    method: 'Bank Deposit',
    ref: 'DEP-2938',
    category: 'Activity',
    studentId: '1787737452457',
    grade: '',
  },
  {
    id: 'TX-750',
    date: '7/15/2026',
    amount: 5000,
    method: 'M-Pesa',
    ref: 'QH12LK34P',
    category: 'Tuition',
    studentId: '1787737452457',
    grade: '',
  },
];