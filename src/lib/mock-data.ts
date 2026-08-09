// Central configuration store integration
// All data arrays are populated dynamically from the central store

// Interfaces remain for type safety
export interface Stream {
  id: string;
  name: string;
  gradeIds: string[];
  teacher: string;
  studentsCount: number;
}

export interface Grade {
  id: string;
  name: string;
  category: 'Pre-Primary' | 'Primary' | 'Junior School';
  streams: Stream[];
}

export interface Student {
  id: string;
  name: string;
  assessment: string;
  grade: string;
  stream: string;
  gender: string;
  dob: string;
  guardian: string;
  phone: string;
  email: string;
  health: string;
  needs: string;
}

export interface StaffMember {
  id: string;
  id_no: string;
  tsc_no?: string;
  name: string;
  role: string;
  subjects: string[];
  phone: string;
  email: string;
  status: 'Active' | 'Pre-Registered' | 'Suspended';
  joined: string;
  department: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  stock: number;
  borrowed: number;
}

export interface Message {
  id: string;
  recipient: string;
  subject: string;
  type: string;
  date: string;
  status: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  category: string;
  color: string;
}

export interface InventoryItem {
  id: string;
  item: string;
  category: string;
  qty: number;
  status: string;
  color: string;
}

export interface AssetLog {
  id: number;
  item: string;
  issuedTo: string;
  date: string;
  dateReturned?: string;
  status: string;
}

export interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  type: string;
}

export interface TimetableEntry {
  time: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
}

export interface FeeData {
  id: string;
  student: string;
  total: number;
  paid: number;
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

// Placeholder arrays for backward compatibility
// These will be populated dynamically from the central store
export const GRADES_DATA: Grade[] = [];
export const STREAMS_DATA: Stream[] = [];
export const STUDENTS: Student[] = [];
export const STAFF: StaffMember[] = [];
export const BOOKS: Book[] = [];
export const MESSAGES: Message[] = [];
export const NOTICES: Notice[] = [];
export const INVENTORY: InventoryItem[] = [];
export const ASSET_LOGS: AssetLog[] = [];
export const EVENTS: Event[] = [];
export const TIMETABLE: TimetableEntry[] = [];
export const FEES_DATA: FeeData[] = [];
export const ATTENDANCE_TREND: any[] = [];
export const TRANSACTIONS: Transaction[] = [];