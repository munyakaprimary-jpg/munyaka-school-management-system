"use client";

import React, { useCallback } from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { showSuccess, showError } from '@/utils/toast';

interface TeacherActionWrapperProps {
  children: React.ReactNode;
  onAttendanceSubmit?: (data: any) => Promise<void>;
  onMarksSubmit?: (data: any) => Promise<void>;
  onStaffCheckinSubmit?: (data: any) => Promise<void>;
  onStudentRegistrationSubmit?: (data: any) => Promise<void>;
  onFeePaymentSubmit?: (data: any) => Promise<void>;
}

export const TeacherActionWrapper: React.FC<TeacherActionWrapperProps> = ({
  children,
  onAttendanceSubmit,
  onMarksSubmit,
  onStaffCheckinSubmit,
  onStudentRegistrationSubmit,
  onFeePaymentSubmit
}) => {
  const { saveActionOffline, isOnline } = useOfflineSync();

  const handleAttendanceSubmit = useCallback(async (data: any) => {
    // Save offline first
    const saved = await saveActionOffline('attendance', data);
    if (!saved) return;

    // If online, also try direct submission for immediate feedback
    if (isOnline && onAttendanceSubmit) {
      try {
        await onAttendanceSubmit(data);
      } catch (error) {
        console.warn('Direct submission failed, relying on sync:', error);
      }
    }
  }, [saveActionOffline, isOnline, onAttendanceSubmit]);

  const handleMarksSubmit = useCallback(async (data: any) => {
    const saved = await saveActionOffline('marks', data);
    if (!saved) return;

    if (isOnline && onMarksSubmit) {
      try {
        await onMarksSubmit(data);
      } catch (error) {
        console.warn('Direct submission failed, relying on sync:', error);
      }
    }
  }, [saveActionOffline, isOnline, onMarksSubmit]);

  const handleStaffCheckinSubmit = useCallback(async (data: any) => {
    const saved = await saveActionOffline('staff_checkin', data);
    if (!saved) return;

    if (isOnline && onStaffCheckinSubmit) {
      try {
        await onStaffCheckinSubmit(data);
      } catch (error) {
        console.warn('Direct submission failed, relying on sync:', error);
      }
    }
  }, [saveActionOffline, isOnline, onStaffCheckinSubmit]);

  const handleStudentRegistrationSubmit = useCallback(async (data: any) => {
    const saved = await saveActionOffline('student_registration', data);
    if (!saved) return;

    if (isOnline && onStudentRegistrationSubmit) {
      try {
        await onStudentRegistrationSubmit(data);
      } catch (error) {
        console.warn('Direct submission failed, relying on sync:', error);
      }
    }
  }, [saveActionOffline, isOnline, onStudentRegistrationSubmit]);

  const handleFeePaymentSubmit = useCallback(async (data: any) => {
    const saved = await saveActionOffline('fee_payment', data);
    if (!saved) return;

    if (isOnline && onFeePaymentSubmit) {
      try {
        await onFeePaymentSubmit(data);
      } catch (error) {
        console.warn('Direct submission failed, relying on sync:', error);
      }
    }
  }, [saveActionOffline, isOnline, onFeePaymentSubmit]);

  // Provide the wrapped handlers via context or props
  const contextValue = {
    submitAttendance: handleAttendanceSubmit,
    submitMarks: handleMarksSubmit,
    submitStaffCheckin: handleStaffCheckinSubmit,
    submitStudentRegistration: handleStudentRegistrationSubmit,
    submitFeePayment: handleFeePaymentSubmit,
    isOnline
  };

  return (
    <TeacherActionContext.Provider value={contextValue}>
      {children}
    </TeacherActionContext.Provider>
  );
};

// Context for accessing wrapped handlers anywhere in the component tree
const TeacherActionContext = React.createContext<{
  submitAttendance: (data: any) => Promise<void>;
  submitMarks: (data: any) => Promise<void>;
  submitStaffCheckin: (data: any) => Promise<void>;
  submitStudentRegistration: (data: any) => Promise<void>;
  submitFeePayment: (data: any) => Promise<void>;
  isOnline: boolean;
} | null>(null);

export const useTeacherActions = () => {
  const context = React.useContext(TeacherActionContext);
  if (!context) {
    throw new Error('useTeacherActions must be used within TeacherActionWrapper');
  }
  return context;
};

export default TeacherActionWrapper;