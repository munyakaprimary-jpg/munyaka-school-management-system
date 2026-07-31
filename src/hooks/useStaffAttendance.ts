import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { AttendanceStatus, StudentAttendance } from '@/types/attendance';
import { isWithinGeofence } from '@/lib/geofence';
import { showSuccess, showError } from '@/utils/toast';
import { PreRegisteredStaff } from '@/types/staff-access';

const PERSONAL_STORAGE_PREFIX = 'munyaka_staff_attendance_';
const MASTER_REGISTER_PREFIX = 'munyaka_master_staff_register_';

export interface StaffAttendanceRecord {
  staffId: string;
  staffName: string;
  role: string;
  morning?: { status: AttendanceStatus; time: string; verifiedLat?: number; verifiedLng?: number };
  afternoon?: { status: AttendanceStatus; time: string; verifiedLat?: number; verifiedLng?: number };
  date: string;
}

export const useStaffAttendance = (currentLocation: { lat: number; lng: number } | null) => {
  const { user } = useAuth();
  const [personalRecords, setPersonalRecords] = useState<Record<string, StudentAttendance>>({});
  const [masterRegister, setMasterRegister] = useState<Record<string, StaffAttendanceRecord>>({});
  const [loading, setLoading] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const personalKey = `${PERSONAL_STORAGE_PREFIX}${user?.id || 'guest'}`;
  const masterKey = `${MASTER_REGISTER_PREFIX}${todayStr}`;

  // 1. Fetch Personal Attendance History
  const fetchPersonalAttendance = useCallback(() => {
    const saved = localStorage.getItem(personalKey);
    if (saved) {
      try {
        setPersonalRecords(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing personal staff attendance:', e);
      }
    }
  }, [personalKey]);

  // 2. Fetch Master Register for All Staff
  const fetchMasterRegister = useCallback(() => {
    const savedMaster = localStorage.getItem(masterKey);
    let currentMaster: Record<string, StaffAttendanceRecord> = {};

    if (savedMaster) {
      try {
        currentMaster = JSON.parse(savedMaster);
      } catch (e) {
        console.error('Error parsing master staff register:', e);
      }
    }

    // Dynamic Fetch: Populate register from the actual staff ledger
    const savedLedgerJson = localStorage.getItem('munyaka_staff_prereg');
    const staffLedger: PreRegisteredStaff[] = savedLedgerJson ? JSON.parse(savedLedgerJson) : [];

    staffLedger.forEach(staff => {
      if (!currentMaster[staff.id]) {
        currentMaster[staff.id] = {
          staffId: staff.id,
          staffName: staff.fullName,
          role: staff.systemRole.replace('_', ' '),
          date: todayStr,
        };
      }
    });

    setMasterRegister(currentMaster);
  }, [masterKey, todayStr]);

  useEffect(() => {
    fetchPersonalAttendance();
    fetchMasterRegister();
  }, [fetchPersonalAttendance, fetchMasterRegister]);

  const selfMarkAttendance = async (
    session: 'morning' | 'afternoon',
    status: AttendanceStatus = 'present',
    date: string = todayStr
  ): Promise<boolean> => {
    if (!user) {
      showError('Please log in to mark attendance.');
      return false;
    }

    if (currentLocation && !isWithinGeofence(currentLocation.lat, currentLocation.lng)) {
      showError('Geofence Error: You must be within school grounds to mark attendance.');
      return false;
    }

    setLoading(true);
    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedPersonal: Record<string, StudentAttendance> = {
      ...personalRecords,
      [date]: {
        ...personalRecords[date],
        [session]: { status, time: currentTimeStr }
      }
    };
    setPersonalRecords(updatedPersonal);
    localStorage.setItem(personalKey, JSON.stringify(updatedPersonal));

    const currentMaster = { ...masterRegister };
    const staffRecord = currentMaster[user.id] || {
      staffId: user.id,
      staffName: user.name,
      role: user.role,
      date,
    };

    if (session === 'morning') {
      staffRecord.morning = { status, time: currentTimeStr };
    } else {
      staffRecord.afternoon = { status, time: currentTimeStr };
    }

    currentMaster[user.id] = staffRecord;
    setMasterRegister(currentMaster);
    localStorage.setItem(masterKey, JSON.stringify(currentMaster));

    showSuccess(`Successfully Recorded at ${currentTimeStr}`);
    setLoading(false);
    return true;
  };

  const adminMarkStaff = (
    staffId: string,
    session: 'morning' | 'afternoon',
    status: AttendanceStatus
  ) => {
    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentMaster = { ...masterRegister };
    
    if (currentMaster[staffId]) {
      if (session === 'morning') {
        currentMaster[staffId].morning = { status, time: currentTimeStr };
      } else {
        currentMaster[staffId].afternoon = { status, time: currentTimeStr };
      }
      setMasterRegister(currentMaster);
      localStorage.setItem(masterKey, JSON.stringify(currentMaster));
      showSuccess(`Updated attendance for ${currentMaster[staffId].staffName}`);
    }
  };

  return {
    personalRecords,
    masterRegister,
    loading,
    selfMarkAttendance,
    adminMarkStaff,
    fetchPersonalAttendance,
    fetchMasterRegister,
  };
};