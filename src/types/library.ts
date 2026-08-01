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
  issuedDate: string;
  dueDate: string;
  returnedDate?: string;
  status: 'Issued' | 'Returned';
}