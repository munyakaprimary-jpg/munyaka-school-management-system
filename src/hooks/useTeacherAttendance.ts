import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { AttendanceRecord } from '@/types/attendance';
import { calculateDistance } from '@/lib/geofence';
import { isWithinGeofence, SCHOOL_COORDINATES } from '@/lib/geofence';
import { validateDeparture } from '@/lib/attendance-utils';
import { showSuccess, showError } from '@/utils/toast';

export const useTeacherAttendance = (currentLocation: { lat: number; lng: number } | null) => {
  const { user } = useAuth();
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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
    const { lat, lng } = currentLocation;
    if (!isWithinGeofence(lat, lng)) {
      showError('You must be within 100m of the school to clock in.');
      return;
    }

    const { data, error } = await supabase
      .from('teacher_attendance')
      .upsert({
        teacher_id: user.id,
        arrival_time: new Date().toISOString(),
        verified_lat: lat,
        verified_lng: lng,
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
    const { lat, lng } = currentLocation;
    if (!isWithinGeofence(lat, lng)) {
      showError('You must be within 100m of the school to clock out.');
      return;
    }

    const validation = validateDeparture(new Date(), reason);
    if (!validation.valid) {
      showError(validation.message!);
      return;
    }

    const { data, error } = await supabase
      .from('teacher_attendance')
      .update({
        departure_time: new Date().toISOString(),
        early_departure_reason: validation.valid ? reason : null,
        verified_lat: lat,
        verified_lng: lng,
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

  return { record, loading, clockIn, clockOut };
};