/**
 * School domain types — shared across the application.
 * These were previously co-located in src/lib/mock-data.ts alongside
 * empty data exports. Keeping the types here avoids importing from a
 * deprecated data module just for type definitions.
 */

export interface Stream {
  id: string;
  name: string;
  teacher: string;
  studentsCount: number;
}

export interface Grade {
  id: string;
  name: string;
  category: 'Pre-Primary' | 'Primary' | 'Junior School';
  streams: Stream[];
}

/** LocalStorage-persisted learner record */
export interface LearnerRecord {
  id: string;
  admNo?: string;
  name?: string;
  grade?: string;
  stream?: string;
  gender?: string;
  guardian?: string;
  phone?: string;
  email?: string;
  dob?: string;
  status?: string;
  schoolId?: string;
  isArchived?: boolean;
  deletedAt?: string;
  [key: string]: unknown;
}

/** LocalStorage-persisted staff record */
export interface StaffRecord {
  id: string;
  name?: string;
  role?: string;
  tscNo?: string;
  email?: string;
  phone?: string;
  gender?: string;
  status?: string;
  [key: string]: unknown;
}

/** Pre-registered staff invitation */
export interface StaffPreregRecord {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  invitedAt?: string;
  status?: string;
  [key: string]: unknown;
}

/** Library book */
export interface BookRecord {
  id: string;
  title?: string;
  author?: string;
  isbn?: string;
  category?: string;
  status?: string;
  [key: string]: unknown;
}

/** Notice / announcement */
export interface NoticeRecord {
  id: string;
  title?: string;
  content?: string;
  category?: string;
  publishedAt?: string;
  status?: string;
  [key: string]: unknown;
}

/** In-app message */
export interface MessageRecord {
  id: string;
  senderId?: string;
  recipientId?: string;
  content?: string;
  read?: boolean;
  sentAt?: string;
  [key: string]: unknown;
}

/** Fee ledger entry */
export interface FeeRecord {
  id: string;
  learnerId?: string;
  learnerName?: string;
  total?: number;
  paid?: number;
  balance?: number;
  academicYear?: string;
  termId?: string;
  status?: string;
  [key: string]: unknown;
}

/** Fee structure definition */
export interface FeeStructureRecord {
  id: string;
  gradeId?: string;
  academicYear?: string;
  category?: string;
  amount?: number;
  [key: string]: unknown;
}

/** Financial transaction */
export interface TransactionRecord {
  id: string;
  learnerId?: string;
  learnerName?: string;
  amount?: number;
  method?: string;
  type?: string;
  date?: string;
  ref?: string;
  [key: string]: unknown;
}
