import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { AttendanceStatus, StudentAttendance } from '@/types/attendance';
import { isWithinGeofence } from '@/lib/geofence';
import { showSuccess, showError } from '@/utils/toast';

const STORAGE_KEY_PREFIX = 'munyaka_staff_attendance_';

export const useStaffAttendance = (currentLocation: { lat: number; lng: number } | null) => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, StudentAttendance>>({});
  const [loading, setLoading] = useState(false);

  const storageKey = `${STORAGE_KEY_PREFIX}${user?.id || 'guest'}`;

  // Load from localStorage first, then try Supabase if connected
  const fetchAttendance = useCallback(async (date?: string) => {
    setLoading(true);
    const targetDate = date || new Date().toISOString().split('T')[0];

    // 1. Load local state from localStorage
    let localData: Record<string, StudentAttendance> = {};
    const savedLocal = localStorage.getItem(storageKey);
    if (savedLocal) {
      try {
        localData = JSON.parse(savedLocal);
      } catch (e) {
        console.error('Error parsing local staff attendance:', e);
      }
    }

    // Set local state immediately
    setAttendanceRecords(localData);

    // 2. Try fetching from Supabase if user is present
    if (user) {
      try {
        const { data, error } = await supabase
          .from('staff_attendance')
          .select('*')
          .eq('staff_id', user.id)
          .eq('date', targetDate);

        if (!error && data && data.length > 0) {
          const remoteRecords: Record<string, StudentAttendance> = { ...localData };
          
          data.forEach(record => {
            const dateKey = record.date;
            const existingForDate = remoteRecords[dateKey] || {};

            let morning = existingForDate.morning;
            if (record.arrival_time || record.status === 'present' || record.status === 'late') {
              const formattedTime = record.arrival_time 
                ? new Date(record.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '08:00 AM';
              morning = { status: record.status as AttendanceStatus, time: formattedTime };
            }

            let afternoon = existingForDate.afternoon;
            if (record.departure_time) {
              const formattedTime = new Date(record.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              afternoon = { status: record.status as AttendanceStatus, time: formattedTime };
            }

            remoteRecords[dateKey] = { morning, afternoon };
          });

          setAttendanceRecords(remoteRecords);
          localStorage.setItem(storageKey, JSON.stringify(remoteRecords));
        }
      } catch (err) {
        console.log('Supabase offline or fallback active, using local staff attendance state.');
      }
    }

    setLoading(false);
  }, [user, storageKey]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const markAttendance = async (
    date: string, 
    session: 'morning' | 'afternoon', 
    status: AttendanceStatus,
    locationOverride?: { lat: number; lng: number },
    notes?: string
  ): Promise<boolean> => {
    const loc = locationOverride || currentLocation;

    // Geofence check if location is available
    if (loc && !isWithinGeofence(loc.lat, loc.lng)) {
      showError('You must be within 100m of the school to mark attendance.');
      return false;
    }

    setLoading(true);

    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Update local state & localStorage immediately
    const updatedRecords: Record<string, StudentAttendance> = {
      ...attendanceRecords,
      [date]: {
        ...attendanceRecords[date],
        [session]: { status, time: currentTimeStr }
      }
    };

    setAttendanceRecords(updatedRecords);
    localStorage.setItem(storageKey, JSON.stringify(updatedRecords));

    // 2. Attempt Supabase sync if user is present
    if (user) {
      try {
        const { data: existingRecord } = await supabase
          .from('staff_attendance')
          .select('*')
          .eq('staff_id', user.id)
          .eq('date', date)
          .maybeSingle();

        if (existingRecord) {
          const updateData: Record<string, any> = {
            status,
            notes: session === 'morning' ? notes : existingRecord.notes,
          };
          
          if (session === 'morning') {
            updateData.arrival_time = new Date().toISOString();
            if (loc) {
              updateData.verified_lat = loc.lat;
              updateData.verified_lng = loc.lng;
            }
          } else {
            updateData.departure_time = new Date().toISOString();
          }

          await supabase
            .from('staff_attendance')
            .update(updateData)
            .eq('id', existingRecord.id);
        } else {
          const newRecord = {
            staff_id: user.id,
            date,
            status,
            arrival_time: session === 'morning' ? new Date().toISOString() : null,
            departure_time: session === 'afternoon' ? new Date().toISOString() : null,
            notes: session === 'morning' ? notes : null,
            verified_lat: loc ? loc.lat : null,
            verified_lng: loc ? loc.lng : null,
          };

          await supabase
            .from('staff_attendance')
            .insert(newRecord);
        }
      } catch (err) {
        console.log('Supabase sync skipped, attendance saved locally.');
      }
    }

    showSuccess(`Attendance marked as ${status} for ${session} session`);
    setLoading(false);
    return true;
  };

  const getAttendanceForDate = (date: string): StudentAttendance => {
    return attendanceRecords[date] || {};
  };

  return {
    attendanceRecords,
    loading,
    markAttendance,
    getAttendanceForDate,
    fetchAttendance,
  };
};