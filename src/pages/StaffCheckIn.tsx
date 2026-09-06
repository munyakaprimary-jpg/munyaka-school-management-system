"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStaffAttendance } from '@/hooks/useStaffAttendance';
import { useGeolocation } from '@/hooks/useGeolocation';
import { PersonalCheckInCard } from '@/components/attendance/PersonalCheckInCard';
import BackButton from '@/components/ui/BackButton';

const StaffCheckIn = () => {
  const { user } = useAuth();
  const { location } = useGeolocation();
  const { 
    personalRecords, 
    selfMarkAttendance
  } = useStaffAttendance(location);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div className="flex items-center gap-3">
          <BackButton parentPath="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Daily Duty Check-In</h1>
            <p className="text-muted-foreground">Log your arrival and departure within the school geofence.</p>
          </div>
        </div>
      </div>

      <PersonalCheckInCard
        staffName={user?.name || 'Staff Member'}
        roleName={user?.role?.replace('_', ' ') || 'Teacher'}
        onCheckIn={selfMarkAttendance}
        personalHistory={personalRecords}
      />
    </div>
  );
};

export default StaffCheckIn;