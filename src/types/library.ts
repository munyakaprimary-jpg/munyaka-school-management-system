export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  stock: number;
  borrowed: number;
}

export interface BorrowLog {
  id: string;
  bookId: string;
  bookTitle: string;
  borrowerName: string;
  borrowerType: 'Student' | 'Staff';
  grade?: string;
  stream?: string;
  issuedDate: string;
  dueDate: string;
  returnedDate?: string;
  status?: string;
  qty_issued: number;
  qty_returned: number;
  qty_lost: number;
}

export const getLogBalance = (log: BorrowLog): number => {
  return log.qty_issued - ((log.qty_returned || 0) + (log.qty_lost || 0));
};

export const getLogStatusInfo = (log: BorrowLog) => {
  const balance = getLogBalance(log);
  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = log.dueDate < todayStr && balance > 0;

  if (balance === 0) {
    if (log.qty_lost > 0) {
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
};