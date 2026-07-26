// School anchor coordinates (Eldoret, Kenya area)
export const SCHOOL_COORDINATES = {
  lat: -1.2921,
  lng: 36.8219,
} as const;

// Maximum geofence radius in meters
export const GEOFENCE_RADIUS_METERS = 100;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of point 1
 * @param lng1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lng2 - Longitude of point 2
 * @returns Distance in meters
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if a coordinate is within the school geofence
 * @param lat - Latitude to check
 * @param lng - Longitude to check
 * @returns Object with isWithinGeofence and distance
 */
export function checkGeofence(lat: number, lng: number): {
  isWithinGeofence: boolean;
  distance: number;
} {
  const distance = calculateDistance(
    lat,
    lng,
    SCHOOL_COORDINATES.lat,
    SCHOOL_COORDINATES.lng
  );

  return {
    isWithinGeofence: distance <= GEOFENCE_RADIUS_METERS,
    distance,
  };
}