"use client";

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useStaffAttendance } from '@/hooks/useStaffAttendance';
import { useGeolocation } from '@/hooks/useGeolocation';
import { PersonalCheckInCard } from '@/components/attendance/PersonalCheckInCard';
import BackButton from '@/components/ui/BackButton';

const CURRENT_TEACHER_STORAGE_KEY = 'munyaka_current_checkin_teacher';

const StaffCheckIn = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { location: geoLocation } = useGeolocation();
  const {
    personalRecords,
    selfMarkAttendance
  } = useStaffAttendance(geoLocation);

  // Determine which teacher name to display. Priority:
  // 1. location.state.teacherName (just navigated from selection page)
  // 2. localStorage.munyaka_current_checkin_teacher (persisted from previous selection)
  // 3. The currently logged-in user
  const [staffName, setStaffName] = useState<string>(
    () => {
      const fromState = (location.state as { teacherName?: string } | null)?.teacherName;
      if (fromState) return fromState;
      try {
        const persisted = localStorage.getItem(CURRENT_TEACHER_STORAGE_KEY);
        if (persisted) return persisted;
      } catch (e) {
        // ignore
      }
      return user?.name || 'Staff Member';
    }
  );

  // Sync staffName when the location state or persisted storage changes
  useEffect(() => {
    const fromState = (location.state as { teacherName?: string } | null)?.teacherName;
    if (fromState) {
      setStaffName(fromState);
      try {
        localStorage.setItem(CURRENT_TEACHER_STORAGE_KEY, fromState);
      } catch (e) {
        // ignore
      }
      return;
    }
    try {
      const persisted = localStorage.getItem(CURRENT_TEACHER_STORAGE_KEY);
      if (persisted && persisted !== staffName) {
        setStaffName(persisted);
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Map the persisted teacher name back to a usable role label. We default
  // to "Staff Member" when no role metadata is available.
  const roleName = useMemoRole(staffName, user?.role);

  // Custom back arrow that returns the user to the teacher selection view
  // instead of the generic dashboard fallback.
  const handleBack = () => {
    navigate('/staff/select-teacher');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div className="flex items-center gap-3">
          <BackButton onClickOverride={handleBack} />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Daily Duty Check-In</h1>
            <p className="text-muted-foreground">Log your arrival and departure within the school geofence.</p>
          </div>
        </div>
      </div>

      <PersonalCheckInCard
        staffName={staffName}
        roleName={roleName}
        onCheckIn={selfMarkAttendance}
        personalHistory={personalRecords}
      />
    </div>
  );
};

// Helper hook to derive a role name from a teacher display name. We try
// to pull the role from the staff directory / pre-registration ledger, and
// fall back to the authenticated user's role when nothing is found.
function useMemoRole(staffName: string, fallbackRole?: string) {
  const [role, setRole] = React.useState<string>(fallbackRole || 'Staff Member');

  React.useEffect(() => {
    if (!staffName) {
      setRole(fallbackRole || 'Staff Member');
      return;
    }

    const tryLookup = (raw: string | null) => {
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const match = parsed.find((item: any) => {
            const candidateName = item?.name || item?.fullName;
            return (
              typeof candidateName === 'string' &&
              candidateName.toLowerCase() === staffName.toLowerCase()
            );
          });
          if (match) {
            return match.role || match.systemRole || null;
          }
        }
      } catch (e) {
        // ignore
      }
      return null;
    };

    const roleFromDir = tryLookup(localStorage.getItem('munyaka_staff_directory'));
    const roleFromPre = tryLookup(localStorage.getItem('munyaka_staff_prereg'));

    const resolved =
      roleFromDir ||
      roleFromPre ||
      (fallbackRole ? fallbackRole.replace(/_/g, ' ') : 'Staff Member');

    setRole(resolved);
  }, [staffName, fallbackRole]);

  return role;
}

export default StaffCheckIn;