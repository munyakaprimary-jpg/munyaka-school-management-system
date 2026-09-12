/**
 * Geofence Module for Munyaka School
 *
 * Target Coordinates: latitude 0.5304, longitude 35.3078
 *
 * Distance uses Haversine formula in metres, accurate enough for
 * sub-kilometre geofence enforcement.
 */

/** Canonical school coordinates used by every geofence-aware feature. */
export const SCHOOL_COORDINATES = { lat: 0.5304, lng: 35.3078 } as const;

export interface GeofenceConfig {
  lat: number;
  lng: number;
  radius: number;
}

const DEFAULT_CONFIG: GeofenceConfig = {
  lat: SCHOOL_COORDINATES.lat,
  lng: SCHOOL_COORDINATES.lng,
  radius: 150,
};

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

export const setGeofenceConfig = (config: GeofenceConfig) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  localStorage.setItem('munyaka_geofence_config', JSON.stringify(config));
};

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

  return R * c;
};

export const isWithinGeofence = (lat: number, lng: number): boolean => {
  const config = getGeofenceConfig();
  const distance = calculateDistance(lat, lng, config.lat, config.lng);
  return distance <= config.radius;
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};
