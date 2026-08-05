"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStaffAttendance } from '@/hooks/useStaffAttendance';
import { useGeolocation } from '@/hooks/useGeolocation';
import { PersonalCheckInCard } from '@/components/attendance/PersonalCheckInCard';
import BackButton from '@/components/ui/BackButton';
import { TeacherActionWrapper, useTeacherActions } from '@/components/TeacherActionWrapper';
import { SyncStatusHeader } from '@/components/SyncStatusHeader';

const StaffCheckInContent = () => {
  const { user } = useAuth();
  const { location } = useGeolocation();
  const { 
    personalRecords, 
    selfMarkAttendance
  } = useStaffAttendance(location);
  const { submitStaffCheckin, isOnline } = useTeacherActions();

  const handleCheckIn = async (session: 'morning' | 'afternoon') => {
    // Mark locally immediately
    await selfMarkAttendance(session);
    
    // Submit through offline-first wrapper
    await submitStaffCheckin({
      staff_id: user?.id || 'unknown',
      date: new Date().toISOString().split('T')[0],
      session,
      status: 'present',
      timestamp: new Date().toISOString(),
      location_lat: location?.lat,
      location_lng: location?.lng
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <SyncStatusHeader />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Daily Duty Check-In</h1>
            <p className="text-muted-foreground">Log your arrival and departure within the school geofence.</p>
          </div>
        </div>
      </div>

      <PersonalCheckInCard
        staffName={user?.name || 'Staff Member'}
        roleName={user?.role?.replace('_', ' ') || 'Teacher'}
        onCheckIn={handleCheckIn}
        personalHistory={personalRecords}
      />
    </div>
  );
};

const StaffCheckIn = () => {
  return (
    <TeacherActionWrapper
      onStaffCheckinSubmit={async (data) => {
        console.log('Staff check-in submitted:', data);
      }}
    >
      <StaffCheckInContent />
    </TeacherActionWrapper>
  );
};

export default StaffCheckIn;