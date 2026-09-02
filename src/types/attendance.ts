export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'departed' | 'early_departure';

export interface AttendanceRecord {
  id?: string;
  student_id: string;
  date: string;
  status: AttendanceStatus;
  arrival_time?: string | null;
  departure_time?: string | null;
  notes?: string | null;
  verified_lat?: number | null;
  verified_lng?: number | null;
}

export interface AttendanceSession {
  status: AttendanceStatus;
  time: string;
}

export interface StudentAttendance {
  morning?: AttendanceSession;
  afternoon?: AttendanceSession;
}