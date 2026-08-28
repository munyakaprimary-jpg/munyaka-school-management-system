export type UserRole = 'owner' | 'admin' | 'teacher' | 'bursar' | 'librarian' | 'storekeeper';

export interface School {
  id: string;
  school_name: string;
  contact_email: string;
  subscription_status: 'active' | 'expired' | 'unpaid';
  created_at?: string;
}

export interface MonthlyCode {
  id: string;
  school_id: string;
  code: string;
  month_year: string; // e.g. "08-2026"
  created_at: string;
  expires_at: string; // strictly 11:59:59 PM on the last day of the calendar month
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  school_id: string;
  access_valid_until: string; // ISO timestamp
  isActive: boolean;
  password?: string;
}
