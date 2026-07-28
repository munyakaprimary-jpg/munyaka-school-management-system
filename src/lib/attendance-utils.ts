/**
 * Haversine formula to calculate distance between two points in meters
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

export const SCHOOL_COORDINATES = {
  lat: -1.2921,
  lng: 36.8219,
};

export const GEOFENCE_RADIUS_METERS = 100;
export const EARLY_DEPARTURE_CUTOFF_HOUR = 15; // 15:30
export const EARLY_DEPARTURE_CUTOFF_MINUTE = 30;

export const isEarlyDeparture = (date: Date = new Date()): boolean => {
  const cutoff = new Date(date);
  cutoff.setHours(EARLY_DEPARTURE_CUTOFF_HOUR, EARLY_DEPARTURE_CUTOFF_MINUTE, 0, 0);
  return date < cutoff;
};