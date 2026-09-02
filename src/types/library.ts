export type ConditionStatus = 'New' | 'Good' | 'Fair' | 'Damaged';
export type ConditionReturnStatus = 'Good' | 'Damaged' | 'Lost' | 'Pending';
export type BookAllocationStatus = 'Active' | 'Returned' | 'Overdue' | 'Lost';

export interface Book {
  id: string;
  title: string;
  author?: string;
  subject: string;
  grade: string;
  /** Total copies currently held in the library (alias of totalCopies). */
  stock?: number;
  /** Copies currently out on loan. */
  borrowed?: number;
  isbn: string;
  publisher: string;
  totalCopies: number;
  availableCopies: number;
  category: string;
}

export interface BorrowLog {
  id: string;
  bookId: string;
  bookTitle: string;
  borrowerName: string;
  borrowerType: 'Student' | 'Teacher' | 'Staff';
  grade?: string;
  stream?: string;
  issuedDate: string;
  dueDate: string;
  /** Alias of returnDate kept for legacy callers. */
  returnedDate?: string;
  status: string;
  qty_issued: number;
  qty_returned?: number;
  qty_lost?: number;
  returnDate?: string;
  condition?: string;
  /** Convenience alias used by some views. */
  accession_no?: string;
  /** Optional condition snapshot recorded at issue time. */
  condition_on_issue?: ConditionStatus;
  /** Optional condition snapshot recorded at return time. */
  condition_on_return?: ConditionReturnStatus;
}

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
  qty_returned?: number;
  qty_lost?: number;
}

export function getLogBalance(
  logOrQty: number | { qty_issued: number; qty_returned?: number; qty_lost?: number },
  qtyReturned: number = 0,
  qtyLost: number = 0
): number {
  if (typeof logOrQty === 'object' && logOrQty !== null) {
    return logOrQty.qty_issued - ((logOrQty.qty_returned || 0) + (logOrQty.qty_lost || 0));
  }
  return logOrQty - (qtyReturned + qtyLost);
}

export function getLogStatusInfo(
  log: BookAllocation | BorrowLog
): { label: string; color: string } {
  const balance = getLogBalance(log.qty_issued, log.qty_returned || 0, log.qty_lost || 0);
  const todayStr = new Date().toISOString().split('T')[0];
  // Support both BookAllocation (due_date) and BorrowLog (dueDate)
  const dueDate = 'due_date' in log ? log.due_date : log.dueDate;
  const isOverdue = dueDate < todayStr && balance > 0;

  if (balance === 0) {
    if ((log.qty_lost || 0) > 0) {
      return { label: 'Closed (With Losses)', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
    return { label: 'Fully Returned', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }

  if (isOverdue) {
    return { label: 'Overdue', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  }

  if ((log.qty_returned || 0) > 0) {
    return { label: 'Partially Returned', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  }

  return { label: 'Out on Loan', color: 'bg-blue-50 text-blue-700 border-blue-200' };
}
