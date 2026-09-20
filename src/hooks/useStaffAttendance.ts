import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AttendanceStatus, StudentAttendance } from '@/types/attendance';
import { isWithinGeofence } from '@/lib/geofence';
import { showSuccess, showError } from '@/utils/toast';
import { PreRegisteredStaff } from '@/types/staff-access';
import { startOfWeek, addDays, format, isAfter } from 'date-fns';
import { lsSet, lsRead } from '@/utils/storage';
import { getStaffMaster } from '@/services/staffMasterService';

const PERSONAL_STORAGE_PREFIX = 'munyaka_staff_attendance_';
const MASTER_REGISTER_PREFIX = 'munyaka_master_staff_register_';

export interface StaffAttendanceRecord {
  staffId: string;
  staffName: string;
  /** Alias of staffName used by some pages. */
  name?: string;
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
    const saved = lsRead<unknown>(personalKey, null);
    if (saved && typeof saved === 'object') {
      try {
        setPersonalRecords(saved as Record<string, StudentAttendance>);
      } catch (e) {
        console.error('Error parsing personal staff attendance:', e);
      }
    }
  }, [personalKey]);

  // 2. Fetch Master Register for All Staff & Calculate Trends
  const fetchMasterData = useCallback(() => {
    // A. Fetch Today's Master Register
    const savedMaster = lsRead<Record<string, StaffAttendanceRecord>>(masterKey, {});
    let currentMaster: Record<string, StaffAttendanceRecord> = savedMaster;

    // Dynamic Fetch: Populate register from central data (single source of truth)
    initializeStaffMaster();
    const staffLedger = getStaffMaster();
    const totalActiveStaff = staffLedger.length;

    staffLedger.forEach(staff => {
      if (!currentMaster[staff.id]) {
        currentMaster[staff.id] = {
          staffId: staff.id,
          staffName: staff.name || '',
          name: staff.name || '',
          role: (staff.systemRole || '').replace('_', ' '),
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
        const history = lsRead<Record<string, StaffAttendanceRecord>>(
          `${MASTER_REGISTER_PREFIX}${dayKey}`,
          {}
        );
        if (history && totalActiveStaff > 0 && Object.keys(history).length > 0) {
          try {
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
    lsSet(personalKey, updatedPersonal);

    const currentMaster = { ...masterRegister };
    const staffRecord = currentMaster[user.id] || {
      staffId: user.id,
      staffName: user.name,
      name: user.name,
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
    lsSet(masterKey, currentMaster);

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
      lsSet(masterKey, currentMaster);
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