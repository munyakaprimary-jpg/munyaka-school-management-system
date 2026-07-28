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

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  method: string;
  ref: string;
  category: string;
}