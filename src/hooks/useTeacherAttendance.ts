import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { AttendanceRecord } from '@/types/attendance';
import { 
  calculateDistance, 
  SCHOOL_COORDINATES, 
  GEOFENCE_RADIUS_METERS, 
  isEarlyDeparture 
} from '@/lib/attendance-utils';
import { showSuccess, showError } from '@/utils/toast';

export const useTeacherAttendance = (currentLocation: { lat: number; lng: number } | null) => {
  const { user } = useAuth();
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculate distance to school reactively
  const distance = currentLocation 
    ? calculateDistance(currentLocation.lat, currentLocation.lng, SCHOOL_COORDINATES.lat, SCHOOL_COORDINATES.lng)
    : null;

  const isWithinBounds = distance !== null && distance <= GEOFENCE_RADIUS_METERS;

  const fetchTodayRecord = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('teacher_attendance')
      .select('*')
      .eq('teacher_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .single();

    if (!error && data) {
      setRecord(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTodayRecord();
  }, [user]);

  const clockIn = async () => {
    if (!user || !currentLocation) return;
    if (!isWithinBounds) {
      showError('You must be within 100m of the school to clock in.');
      return;
    }

    const { data, error } = await supabase
      .from('teacher_attendance')
      .upsert({
        teacher_id: user.id,
        arrival_time: new Date().toISOString(),
        verified_lat: currentLocation.lat,
        verified_lng: currentLocation.lng,
      })
      .select()
      .single();

    if (error) {
      showError('Failed to clock in');
    } else {
      setRecord(data);
      showSuccess('Clocked in successfully!');
    }
  };

  const clockOut = async (reason: string = '') => {
    if (!user || !currentLocation || !record) return;
    if (!isWithinBounds) {
      showError('You must be within 100m of the school to clock out.');
      return;
    }

    const early = isEarlyDeparture();
    if (early && reason.length < 10) {
      showError('Early departure requires a reason (min 10 characters).');
      return;
    }

    const { data, error } = await supabase
      .from('teacher_attendance')
      .update({
        departure_time: new Date().toISOString(),
        early_departure_reason: early ? reason : null,
        verified_lat: currentLocation.lat,
        verified_lng: currentLocation.lng,
      })
      .eq('id', record.id)
      .select()
      .single();

    if (error) {
      showError('Failed to clock out');
    } else {
      setRecord(data);
      showSuccess('Clocked out successfully!');
    }
  };

  return { record, distance, isWithinBounds, loading, clockIn, clockOut };
};