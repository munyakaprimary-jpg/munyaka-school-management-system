// Placeholder for data that will be fetched from API/database
// All data arrays are empty to prevent hardcoded values

export const STUDENTS = [];
export const ATTENDANCE_TREND = [];
export const TRANSACTIONS = [];
export const GRADES_DATA = [];
export const STAFF = [];
export const BOOKS = [];
export const MESSAGES = [];
export const NOTICES = [];
export const INVENTORY = [];
export const ASSET_LOGS = [];
export const EVENTS = [];
export const TIMETABLE = [];
export const FEES_DATA = [];

// Interfaces remain for type safety
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

export interface Grade {
  id: string;
  name: string;
  category: 'Pre-Primary' | 'Primary' | 'Junior School';
  streams: Stream[];
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