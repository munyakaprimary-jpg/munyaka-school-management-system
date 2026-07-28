export interface AttendanceRecord {
  id?: string;
  teacher_id: string;
  date: string;
  arrival_time: string | null;
  departure_time: string | null;
  early_departure_reason: string | null;
  verified_lat: number;
  verified_lng: number;
}

export interface GeofenceResult {
  distance: number;
  isWithinBounds: boolean;
}