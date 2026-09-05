import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AttendanceRecord } from '@/types/attendance';
import { isWithinGeofence, SCHOOL_COORDINATES } from '@/lib/geofence';
import { validateDeparture } from '@/lib/attendance-utils';
import { showSuccess, showError } from '@/utils/toast';
import { localData, TeacherAttendanceRecord } from '@/services/localDataService';

export const useTeacherAttendance = (currentLocation: { lat: number; lng: number } | null) => {
  const { user } = useAuth();
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchTodayRecord = () => {
    if (!user) return;
    setLoading(true);

    const todayRecord = localData.teacherAttend.getForToday(user.id);
    if (todayRecord) {
      setRecord({
        student_id: '',
        teacher_id: todayRecord.teacherId,
        date: todayRecord.date,
        status: 'present',
        arrival_time: todayRecord.arrivalTime || '',
        departure_time: todayRecord.departureTime || '',
        early_departure_reason: todayRecord.earlyDepartureReason,
        verified_lat: todayRecord.verifiedLat,
        verified_lng: todayRecord.verifiedLng,
      } as AttendanceRecord);
    } else {
      setRecord(null);
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

    const now = new Date().toISOString();
    const newRecord: TeacherAttendanceRecord = {
      id: `${user.id}-${now.split('T')[0]}`,
      teacherId: user.id,
      date: now.split('T')[0],
      arrivalTime: now,
      verifiedLat: lat,
      verifiedLng: lng,
    };

    const result = await localData.teacherAttend.save(newRecord);

    if (result.ok) {
      setRecord({
        student_id: '',
        teacher_id: user.id,
        date: newRecord.date,
        status: 'present',
        arrival_time: now,
        verified_lat: lat,
        verified_lng: lng,
      } as AttendanceRecord);
      showSuccess('Clocked in successfully!');
    } else {
      showError('Failed to clock in');
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

    const now = new Date().toISOString();
    const todayDate = now.split('T')[0];
    const updatedRecord: TeacherAttendanceRecord = {
      id: `${user.id}-${todayDate}`,
      teacherId: user.id,
      date: todayDate,
      arrivalTime: (record as any).arrival_time || now,
      departureTime: now,
      earlyDepartureReason: validation.valid ? reason : undefined,
      verifiedLat: lat,
      verifiedLng: lng,
    };

    const result = await localData.teacherAttend.save(updatedRecord);

    if (result.ok) {
      setRecord(prev => prev ? {
        ...prev,
        departure_time: now,
        early_departure_reason: validation.valid ? reason : undefined,
        verified_lat: lat,
        verified_lng: lng,
      } : null);
      showSuccess('Clocked out successfully!');
    } else {
      showError('Failed to clock out');
    }
  };

  return { record, loading, clockIn, clockOut };
};
