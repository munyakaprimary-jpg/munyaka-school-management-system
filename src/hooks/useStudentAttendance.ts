import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { AttendanceRecord, AttendanceStatus, StudentAttendance } from '@/types/attendance';
import { isWithinGeofence } from '@/lib/geofence';
import { showSuccess, showError } from '@/utils/toast';

export const useStudentAttendance = (studentId: string | null) => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, StudentAttendance>>({});
  const [loading, setLoading] = useState(false);

  const fetchAttendance = useCallback(async (date?: string) => {
    if (!studentId) return;
    
    setLoading(true);
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await (supabase as any)
      .from('student_attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', targetDate);

    if (error) {
      console.error('Error fetching attendance:', error);
      setLoading(false);
      return;
    }

    const records = data as AttendanceRecord[];
    const recordMap: Record<string, StudentAttendance> = {};
    
    records.forEach(record => {
      const session = record.arrival_time ? 'morning' : 'afternoon';
      recordMap[record.date] = {
        morning: record.status === 'present' || record.status === 'late'
          ? { status: record.status, time: record.arrival_time || '' }
          : undefined,
        afternoon: record.departure_time
          ? { status: record.status, time: record.departure_time }
          : undefined
      };
    });

    setAttendanceRecords(recordMap);
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const markAttendance = async (
    date: string, 
    session: 'morning' | 'afternoon', 
    status: AttendanceStatus,
    location?: { lat: number; lng: number },
    notes?: string
  ) => {
    if (!studentId || !user) return;

    // Geofence check
    if (location && !isWithinGeofence(location.lat, location.lng)) {
      showError('You must be within 100m of the school to mark attendance.');
      return false;
    }

    setLoading(true);

    const { data: existingRecord, error: fetchError } = await (supabase as any)
      .from('student_attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', date)
      .single();

    let result;
    if (existingRecord) {
      // Update existing record
      const updateData: Partial<AttendanceRecord> = {
        status,
        notes: session === 'morning' ? notes : existingRecord.notes,
      };
      
      if (session === 'morning') {
        updateData.arrival_time = new Date().toISOString();
        if (location) {
          updateData.verified_lat = location.lat;
          updateData.verified_lng = location.lng;
        }
      } else {
        updateData.departure_time = new Date().toISOString();
      }

      result = await (supabase as any)
        .from('student_attendance')
        .update(updateData)
        .eq('id', existingRecord.id)
        .select()
        .single();
    } else {
      // Create new record
      const newRecord: AttendanceRecord = {
        student_id: studentId,
        date,
        status,
        arrival_time: session === 'morning' ? new Date().toISOString() : null,
        departure_time: session === 'afternoon' ? new Date().toISOString() : null,
        notes: session === 'morning' ? notes : null,
        verified_lat: location?.lat ?? null,
        verified_lng: location?.lng ?? null,
      };

      result = await (supabase as any)
        .from('student_attendance')
        .insert(newRecord)
        .select()
        .single();
    }

    if (result.error) {
      showError('Failed to mark attendance');
      setLoading(false);
      return false;
    }

    // Update local state
    setAttendanceRecords(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [session]: { status, time: new Date().toISOString() }
      }
    }));

    showSuccess(`Attendance marked as ${status}`);
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
