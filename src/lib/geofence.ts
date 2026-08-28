/**
 * Geofence Module for Munyaka School
 *
 * Updated Target Coordinates:
 *   Latitude:  0.5304
 *   Longitude: 35.3078
 *
 * These coordinates are the official GPS location of Munyaka Primary and
 * Junior School and are used by:
 *   - PersonalCheckInCard (Daily Duty Check-In)
 *   - StaffAttendance (Geofence enforcement for staff check-in)
 *   - Settings (Admin Location Picker)
 *
 * The distance calculation uses the Haversine formula to compute the
 * great-circle distance between two lat/lng pairs in meters, which
 * is accurate enough for sub-kilometer geofence enforcement.
 */

export interface GeofenceConfig {
  lat: number;
  lng: number;
  radius: number;
}

const DEFAULT_CONFIG: GeofenceConfig = {
  lat: 0.5304,
  lng: 35.3078,
  radius: 150,
};

/**
 * Read the currently active geofence configuration. The order of
 * precedence is:
 *   1. LocalStorage override written by the admin via the Settings
 *      page (munyaka_geofence_config).
 *   2. The hard-coded DEFAULT_CONFIG above.
 *
 * This function is the single source of truth for "where is the
 * school" — every component that needs the geofence centre
 * (PersonalCheckInCard, StaffAttendance, Settings, etc.) should
 * call getGeofenceConfig() rather than hard-coding coordinates.
 */
export const getGeofenceConfig = (): GeofenceConfig => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_CONFIG;
  }
  const saved = localStorage.getItem('munyaka_geofence_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing geofence config:', e);
    }
  }
  return DEFAULT_CONFIG;
};

/**
 * Persist a new geofence configuration to localStorage. The
 * Settings page calls this on every save so that the change is
 * immediately visible to the rest of the app.
 */
export const setGeofenceConfig = (config: GeofenceConfig) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  localStorage.setItem('munyaka_geofence_config', JSON.stringify(config));
};

/**
 * Compute the great-circle distance between two lat/lng pairs using
 * the Haversine formula. Returns distance in meters.
 *
 * This is the single source of truth for "how far is the user
 * from the school" — both isWithinGeofence and the live distance
 * check in the Settings panel use this function.
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
};

/**
 * Test whether a given (lat, lng) point falls inside the active
 * geofence. Returns true if the distance from the school center
 * is less than or equal to the configured radius.
 */
export const isWithinGeofence = (lat: number, lng: number): boolean => {
  const config = getGeofenceConfig();
  const distance = calculateDistance(lat, lng, config.lat, config.lng);
  return distance <= config.radius;
};

/**
 * Convenience helper: format a distance in meters for display
 * purposes. Sub-1km distances are shown in meters; anything
 * larger is shown in kilometers with one decimal place.
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};