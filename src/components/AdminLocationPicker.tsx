import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { showSuccess, showError } from '@/utils/toast';
import { useGeolocation } from '@/hooks/useGeolocation';
import { calculateDistance } from '@/lib/geofence';
import { Crosshair, Navigation2, CheckCircle2, AlertCircle, Save, AlertTriangle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

// Fix for Leaflet's default icon assets in Vite/React environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Custom marker icon for the school pin
 */
const SchoolIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

/**
 * Inner component that captures map click events
 */
const MapClickHandler: React.FC<{
  onMapClick: (lat: number, lng: number) => void;
}> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const DEFAULT_LAT = 0.5304;
const DEFAULT_LNG = 35.3078;
const DEFAULT_RADIUS = 50;
const PRESET_RADII = [25, 50, 100, 200];

export interface AdminLocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialRadius?: number;
  geofenceEnabled?: boolean;
  onLocationChange: (lat: number, lng: number, radius: number) => void;
}

/**
 * Admin Location Picker using Leaflet.js + OpenStreetMap.
 *
 * Free, open-source replacement for the Google Maps implementation.
 * Renders an interactive OpenStreetMap view with:
 *  - A clickable/draggable school pin
 *  - An adjustable blue geofence circle (radius in meters)
 *  - A radius slider with preset buttons (25m, 50m, 100m, 200m)
 *  - Live distance verification against the admin's current GPS
 */
export const AdminLocationPicker: React.FC<AdminLocationPickerProps> = ({
  initialLat = DEFAULT_LAT,
  initialLng = DEFAULT_LNG,
  initialRadius = DEFAULT_RADIUS,
  geofenceEnabled = true,
  onLocationChange,
}) => {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);
  const [radius, setRadius] = useState<number>(initialRadius);

  const { location: currentGeoLoc, isLoading: isLocating, error: geoError } = useGeolocation();

  // Refs for direct map access
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Track the user's "centre on me" trigger
  const centerOnMeRef = useRef(false);

  /**
   * Handle map clicks - moves the school pin to the clicked location
   */
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setPosition([lat, lng]);
      if (onLocationChange) {
        onLocationChange(lat, lng, radius);
      }
    },
    [radius, onLocationChange]
  );

  /**
   * Handle marker drag - updates position when pin is dragged
   */
  const handleMarkerDragEnd = useCallback(
    (e: L.LeafletEvent) => {
      const marker = e.target as L.Marker;
      const { lat, lng } = marker.getLatLng();
      setPosition([lat, lng]);
      if (onLocationChange) {
        onLocationChange(lat, lng, radius);
      }
    },
    [radius, onLocationChange]
  );

  /**
   * When the user toggles "Centre on me", pan the map to current GPS
   */
  useEffect(() => {
    if (centerOnMeRef.current && currentGeoLoc && mapRef.current) {
      mapRef.current.setView([currentGeoLoc.lat, currentGeoLoc.lng], 17);
      centerOnMeRef.current = false;
    }
  }, [currentGeoLoc]);

  /**
   * Recentre the map to the admin's current GPS location
   */
  const handleCenterOnMe = useCallback(() => {
    if (currentGeoLoc && mapRef.current) {
      mapRef.current.setView([currentGeoLoc.lat, currentGeoLoc.lng], 17);
    } else if (geoError) {
      showError(`Geolocation Error: ${geoError}`);
    } else {
      showError('Acquiring GPS signal. Please allow location permissions.');
    }
  }, [currentGeoLoc, geoError]);

  /**
   * Move the pin to the admin's current GPS location
   */
  const handleUseCurrentLocation = useCallback(() => {
    if (currentGeoLoc) {
      const lat = parseFloat(currentGeoLoc.lat.toFixed(6));
      const lng = parseFloat(currentGeoLoc.lng.toFixed(6));
      setPosition([lat, lng]);
      if (onLocationChange) {
        onLocationChange(lat, lng, radius);
      }
      if (mapRef.current) {
        mapRef.current.setView([lat, lng], 17);
      }
      showSuccess(`Current GPS location set: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } else if (geoError) {
      showError(`Geolocation Error: ${geoError}`);
    } else {
      showError('Acquiring GPS signal. Please allow location permissions.');
    }
  }, [currentGeoLoc, geoError, radius, onLocationChange]);

  /**
   * Set a preset radius
   */
  const handlePresetRadius = useCallback(
    (preset: number) => {
      setRadius(preset);
      if (onLocationChange) {
        onLocationChange(position[0], position[1], preset);
      }
    },
    [position, onLocationChange]
  );

  /**
   * Live distance from admin's current GPS to school target
   */
  const liveDistance = currentGeoLoc
    ? calculateDistance(currentGeoLoc.lat, currentGeoLoc.lng, position[0], position[1])
    : null;

  const isInsideGeofence = liveDistance !== null && liveDistance <= radius;

  return (
    <div className="space-y-6">
      {/* Map */}
      <div
        className="relative w-full overflow-hidden rounded-2xl border-2 border-slate-200 shadow-lg"
        style={{ height: '400px' }}
        data-testid="admin-location-map"
      >
        <MapContainer
          center={position}
          zoom={17}
          style={{ width: '100%', height: '100%' }}
          ref={(m) => {
            if (m) {
              mapRef.current = m;
            }
          }}
        >
          {/* OpenStreetMap tile layer — free, no API key required */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Capture click events on the map */}
          <MapClickHandler onMapClick={handleMapClick} />

          {/* School pin (draggable) */}
          <Marker
            position={position}
            icon={SchoolIcon}
            draggable={true}
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
            ref={(m) => {
              if (m) {
                markerRef.current = m;
              }
            }}
          />

          {/* Geofence radius circle */}
          <Circle
            center={position}
            radius={radius}
            pathOptions={{
              color: '#4f46e5',
              fillColor: '#4f46e5',
              fillOpacity: 0.15,
              weight: 2,
            }}
          />
        </MapContainer>

        {/* Centre on me button */}
        {currentGeoLoc && (
          <Button
            size="icon"
            className="absolute top-4 right-4 z-[1000] rounded-2xl w-12 h-12 bg-white shadow-xl text-indigo-600 hover:bg-indigo-50 border border-slate-200"
            onClick={handleCenterOnMe}
            title="Centre map on my current location"
          >
            <Crosshair size={20} />
          </Button>
        )}

        {/* Open-source badge */}
        <div className="absolute bottom-2 left-2 z-[1000]">
          <Badge className="bg-white/90 text-slate-600 border-slate-200 font-bold text-[10px] px-2 py-0.5 backdrop-blur-sm">
            <MapPin size={10} className="mr-1 inline" />
            OpenStreetMap
          </Badge>
        </div>
      </div>

      {/* Coordinate + Radius Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
        {/* Latitude */}
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Latitude</Label>
          <Input
            type="number"
            step="0.000001"
            value={position[0]}
            onChange={(e) => {
              const lat = parseFloat(e.target.value) || initialLat;
              setPosition([lat, position[1]]);
              if (onLocationChange) {
                onLocationChange(lat, position[1], radius);
              }
            }}
            placeholder="e.g. 0.5304"
            className="rounded-xl h-12 bg-slate-50 border-none font-bold"
          />
        </div>

        {/* Longitude */}
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Longitude</Label>
          <Input
            type="number"
            step="0.000001"
            value={position[1]}
            onChange={(e) => {
              const lng = parseFloat(e.target.value) || initialLng;
              setPosition([position[0], lng]);
              if (onLocationChange) {
                onLocationChange(position[0], lng, radius);
              }
            }}
            placeholder="e.g. 35.3078"
            className="rounded-xl h-12 bg-slate-50 border-none font-bold"
          />
        </div>

        {/* Geofence Radius */}
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Geofence Radius (meters)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={25}
              max={1000}
              value={radius}
              onChange={(e) => {
                const r = parseInt(e.target.value) || DEFAULT_RADIUS;
                setRadius(r);
                if (onLocationChange) {
                  onLocationChange(position[0], position[1], r);
                }
              }}
              className="w-24 h-12 rounded-xl bg-slate-50 border-none font-bold text-center"
            />
            <span className="text-xs font-bold text-slate-500">Meters</span>
          </div>

          {/* Preset radius buttons */}
          <div className="flex gap-1.5 pt-1">
            {PRESET_RADII.map((preset) => (
              <Button
                key={preset}
                size="sm"
                variant="outline"
                className={cn(
                  "rounded-full px-3 h-8 text-[10px] font-bold transition-colors",
                  radius === preset
                    ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200"
                )}
                onClick={() => handlePresetRadius(preset)}
                title={`Set radius to ${preset}m`}
              >
                {preset}m
              </Button>
            ))}
          </div>
        </div>

        {/* Use Current Location */}
        <div className="space-y-2 flex flex-col justify-end">
          <Button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="h-12 rounded-xl border-indigo-200 bg-indigo-50/50 text-indigo-700 font-bold hover:bg-indigo-100 gap-2"
          >
            {isLocating ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Navigation2 size={16} />
            )}
            Use My Current Location
          </Button>
        </div>
      </div>

      {/* Radius slider */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Adjust Radius</Label>
          <span className="text-sm font-black text-indigo-600">{radius}m</span>
        </div>
        <input
          type="range"
          min={25}
          max={1000}
          step={5}
          value={radius}
          onChange={(e) => {
            const r = parseInt(e.target.value);
            setRadius(r);
            if (onLocationChange) {
              onLocationChange(position[0], position[1], r);
            }
          }}
          className="w-full accent-indigo-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-bold text-slate-400">
          <span>25m</span>
          <span>250m</span>
          <span>500m</span>
          <span>750m</span>
          <span>1000m</span>
        </div>
      </div>

      {/* Live Distance Verification */}
      <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-amber-600 shrink-0" size={20} />
          <div>
            <p className="font-bold text-slate-900 text-sm">Live Distance Verification</p>
            <p className="text-xs text-amber-800">Distance from your current GPS to the configured school target</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {liveDistance !== null ? (
            <>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-900">{Math.round(liveDistance)} m</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase">from school</p>
              </div>
              <Badge
                className={cn(
                  "rounded-full font-bold px-3 py-1",
                  isInsideGeofence
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                )}
              >
                {isInsideGeofence ? (
                  <>
                    <CheckCircle2 size={12} className="mr-1 inline" /> Inside {radius}m
                  </>
                ) : (
                  <>
                    <AlertCircle size={12} className="mr-1 inline" /> Outside {radius}m
                  </>
                )}
              </Badge>
            </>
          ) : (
            <div className="text-slate-500 text-sm">
              <p>Enable location access to see live distance</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLocationPicker;
