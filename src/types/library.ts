export type ConditionStatus = 'New' | 'Good' | 'Fair' | 'Damaged';
export type ConditionReturnStatus = 'Good' | 'Damaged' | 'Lost' | 'Pending';
export type BookAllocationStatus = 'Active' | 'Returned' | 'Overdue' | 'Lost';

export interface BookAllocation {
  id: string;
  borrower_name: string;
  role: 'Student' | 'Teacher' | 'Staff';
  grade: string;
  stream: string;
  book_title: string;
  accession_no: string;
  date_issued: string;
  due_date: string;
  qty_issued: number;
  condition_on_issue: ConditionStatus;
  condition_on_return: ConditionReturnStatus;
  status: BookAllocationStatus;
  notes?: string;
}

export function getLogBalance(qtyIssued: number, qtyReturned: number, qtyLost: number = 0): number {
  return qtyIssued - (qtyReturned + qtyLost);
}