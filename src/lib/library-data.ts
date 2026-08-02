import { BookAllocation } from '@/types/library';

export const MOCK_BOOK_ALLOCATIONS: BookAllocation[] = [
  {
    id: 'alloc-001',
    borrower_name: 'Brian Kiptoo',
    role: 'Student',
    grade: 'Grade 4',
    stream: 'Blue',
    book_title: 'Clay Modeling: Animals',
    accession_no: 'CLM-2023-001',
    date_issued: '2024-04-15',
    due_date: '2024-05-15',
    qty_issued: 1,
    condition_on_issue: 'New',
    condition_on_return: 'Pending',
    status: 'Active',
    notes: 'Created for art project',
  },
  {
    id: 'alloc-002',
    borrower_name: 'Mary Atieno',
    role: 'Student',
    grade: 'Grade 4',
    stream: 'Blue',
    book_title: 'Oral Narrative Audio',
    accession_no: 'ONA-2023-001',
    date_issued: '2024-04-20',
    due_date: '2024-05-20',
    qty_issued: 1,
    condition_on_issue: 'Good',
    condition_on_return: 'Pending',
    status: 'Active',
    notes: 'Storytelling activity',
  },
  // Add more entries for different grades and streams
  // ... (more entries)
];