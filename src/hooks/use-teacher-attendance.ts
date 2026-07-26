import { useState, useCallback } from 'react';
import { checkGeofence, SCHOOL_COORDINATES } from '@/lib/geofence';
import { useGeolocation } from './use-geolocation';
import { AttendanceState, EarlyDepartureValidation } from '@/lib/attendance-types';

const EARLY_DEPARTURE_CUTOFF_HOUR = 15;
const EARLY_DEPARTURE_CUTOFF_MINUTE = 30;
const MIN_REASON_LENGTH = 10;

/**
 * Get current time as HH:MM string
 */
function getCurrentTimeString(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

/**
 * Check if current time is before early departure cutoff (15:30)
 */
function isBeforeEarlyDepartureCutoff(): boolean {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  if (hours < EARLY_DEPARTURE_CUTOFF_HOUR) return true;
  if (hours === EARLY_DEPARTURE_CUTOFF_HOUR && minutes < EARLY_DEPARTURE_CUTOFF_MINUTE) return true;
  return false;
}

/**
 * Validate early departure reason
 */
export function validateEarlyDeparture(reason: string | null): EarlyDepartureValidation {
  const beforeCutoff = isBeforeEarlyDepartureCutoff();
  
  if (!beforeCutoff) {
    return {
      isValid: true,
      requiresReason: false,
      error: null,
    };
  }

  if (beforeCutoff && !reason) {
    return {
      isValid: false,
      requiresReason: true,
      error: 'Early departure reason is required when leaving before 15:30',
    };
  }

  if (beforeCutoff && reason && reason.trim().length < MIN_REASON_LENGTH) {
    return {
      isValid: false,
      requiresReason: true,
      error: `Reason must be at least ${MIN_REASON_LENGTH} characters`,
    };
  }

  return {
    isValid: true,
    requiresReason: true,
    error: null,
  };
}

/**
 * Custom hook for managing teacher attendance state
 */
export function useTeacherAttendance() {
  const [attendanceState, setAttendanceState] = useState<AttendanceState>({
    isCheckedIn: false,
    isCheckedOut: false,
    arrivalTime: null,
    departureTime: null,
    location: null,
    isWithinGeofence: false,
    distanceFromSchool: null,
  });

  const { latitude, longitude, accuracy, error: geoError, getCurrentPosition } = useGeolocation();

  const checkIn = useCallback(async (teacherId: string) => {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

    const { latitude, longitude } = position.coords;
    const geofenceCheck = checkGeofence(latitude, longitude);

    if (!geofenceCheck.isWithinGeofence) {
      throw new Error(`You must be within ${100} meters of the school to check in`);
    }

    setAttendanceState((prev) => ({
      ...prev,
      isCheckedIn: true,
      isCheckedOut: false,
      arrivalTime: new Date().toISOString(),
      location: { lat: latitude, lng: longitude },
      isWithinGeofence: geofenceCheck.isWithinGeofence,
      distanceFromSchool: geofenceCheck.distance,
    }));

    return {
      teacherId,
      arrivalTime: new Date().toISOString(),
      verifiedLat: latitude,
      verifiedLng: longitude,
    };
  }, []);

  const checkOut = useCallback(async (teacherId: string, earlyDepartureReason?: string) => {
    const validation = validateEarlyDeparture(earlyDepartureReason || null);
    
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

    const { latitude, longitude } = position.coords;
    const geofenceCheck = checkGeofence(latitude, longitude);

    setAttendanceState((prev) => ({
      ...prev,
      isCheckedOut: true,
      departureTime: new Date().toISOString(),
      location: { lat: latitude, lng: longitude },
      isWithinGeofence: geofenceCheck.isWithinGeofence,
      distanceFromSchool: geofenceCheck.distance,
    }));

    return {
      teacherId,
      departureTime: new Date().toISOString(),
      earlyDepartureReason: earlyDepartureReason || null,
      verifiedLat: latitude,
      verifiedLng: longitude,
    };
  }, []);

  return {
    ...attendanceState,
    checkIn,
    checkOut,
    validateEarlyDeparture,
    isBeforeEarlyDepartureCutoff: isBeforeEarlyDepartureCutoff(),
    geolocation: { latitude, longitude, accuracy, error: geoError },
    refreshLocation: getCurrentPosition,
  };
}