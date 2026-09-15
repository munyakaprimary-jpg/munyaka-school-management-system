import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StudentAttendance } from '@/types/attendance';
import { isWithinGeofence } from '@/lib/geofence';
import { showSuccess, showError } from '@/utils/toast';
import { localData } from '@/services/localDataService';
export interface StudentAttendanceRecord {
  id?: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  term?: string;
  year?: string;
}

export const useStudentAttendance = (studentId: string | null) => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, StudentAttendance>>({});
  const [loading, setLoading] = useState(false);

  const fetchAttendance = useCallback((date?: string) => {
    if (!studentId) return;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const records = localData.studentAttend.getAll({ studentId, date: targetDate });
    const recordMap: Record<string, StudentAttendance> = {};

    records.forEach(record => {
      if (!recordMap[record.date]) {
        recordMap[record.date] = {};
      }
      recordMap[record.date][record.session] = {
        status: record.status as 'present' | 'absent' | 'late',
        time: record.arrivalTime || record.departureTime || '',
      };
    });

    setAttendanceRecords(recordMap);
  }, [studentId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const markAttendance = async (
    date: string,
    session: 'morning' | 'afternoon',
    status: string,
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

    const now = new Date().toISOString();
    const record: StudentAttendanceRecord = {
      id: `${studentId}-${date}-${session}`,
      studentId,
      date,
      session,
      status,
      arrivalTime: session === 'morning' ? now : undefined,
      departureTime: session === 'afternoon' ? now : undefined,
      notes: session === 'morning' ? notes : undefined,
      verifiedLat: location?.lat,
      verifiedLng: location?.lng,
    };

    const result = await localData.studentAttend.save(record);

    if (result.ok) {
      setAttendanceRecords(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          [session]: { status: status as 'present' | 'absent' | 'late', time: now },
        },
      }));
      showSuccess(`Attendance marked as ${status}`);
    } else {
      showError('Failed to mark attendance');
    }

    setLoading(false);
    return result.ok;
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
