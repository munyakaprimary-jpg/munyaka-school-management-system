import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { AttendanceStatus, StudentAttendance } from '@/types/attendance';
import { isWithinGeofence } from '@/lib/geofence';
import { showSuccess, showError } from '@/utils/toast';
import { PreRegisteredStaff } from '@/types/staff-access';
import { startOfWeek, addDays, format, isAfter } from 'date-fns';

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

export interface WeeklyTrendItem {
  day: string;
  rate: number;
  isFuture: boolean;
}

export const useStaffAttendance = (currentLocation: { lat: number; lng: number } | null) => {
  const { user } = useAuth();
  const [personalRecords, setPersonalRecords] = useState<Record<string, StudentAttendance>>({});
  const [masterRegister, setMasterRegister] = useState<Record<string, StaffAttendanceRecord>>({});
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrendItem[]>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
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

  // 2. Fetch Master Register for All Staff & Calculate Trends
  const fetchMasterData = useCallback(() => {
    // A. Fetch Today's Master Register
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
    const totalActiveStaff = staffLedger.length;

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

    // B. Calculate Weekly Trend (Mon-Fri)
    const mon = startOfWeek(today, { weekStartsOn: 1 });
    const trend: WeeklyTrendItem[] = [];
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];

    for (let i = 0; i < 5; i++) {
      const dayDate = addDays(mon, i);
      const dayKey = format(dayDate, 'yyyy-MM-dd');
      const isFuture = isAfter(dayDate, today) && dayKey !== todayStr;
      
      let rate = 0;
      if (!isFuture) {
        const historyJson = localStorage.getItem(`${MASTER_REGISTER_PREFIX}${dayKey}`);
        if (historyJson && totalActiveStaff > 0) {
          try {
            const history: Record<string, StaffAttendanceRecord> = JSON.parse(historyJson);
            const presentCount = Object.values(history).filter(
              s => s.morning?.status === 'present' || s.afternoon?.status === 'present'
            ).length;
            rate = Math.round((presentCount / totalActiveStaff) * 100);
          } catch (e) {
            rate = 0;
          }
        } else if (dayKey === todayStr && totalActiveStaff > 0) {
           // Use current state for today
           const presentCount = Object.values(currentMaster).filter(
             s => s.morning?.status === 'present' || s.afternoon?.status === 'present'
           ).length;
           rate = Math.round((presentCount / totalActiveStaff) * 100);
        }
      }

      trend.push({
        day: dayNames[i],
        rate: isFuture ? 0 : rate,
        isFuture
      });
    }

    setWeeklyTrend(trend);
  }, [masterKey, todayStr, today]);

  useEffect(() => {
    fetchPersonalAttendance();
    fetchMasterData();
  }, [fetchPersonalAttendance, fetchMasterData]);

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
    const currentTimeStr = format(new Date(), "hh:mm a");

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
    fetchMasterData(); // Trigger trend refresh
    return true;
  };

  const adminMarkStaff = (
    staffId: string,
    session: 'morning' | 'afternoon',
    status: AttendanceStatus
  ) => {
    const currentTimeStr = format(new Date(), "hh:mm a");
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
      fetchMasterData(); // Trigger trend refresh
    }
  };

  return {
    personalRecords,
    masterRegister,
    weeklyTrend,
    loading,
    selfMarkAttendance,
    adminMarkStaff,
    fetchPersonalAttendance,
    fetchMasterRegister: fetchMasterData,
  };
};