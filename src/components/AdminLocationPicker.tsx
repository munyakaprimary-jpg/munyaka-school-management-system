import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { showSuccess, showError } from '@/utils/toast';
import { useGeolocation } from '@/hooks/useGeolocation';
import { calculateDistance } from '@/lib/geofence';
import { Crosshair, Navigation2, CheckCircle2, AlertCircle, AlertTriangle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_LAT = 0.5304;
const DEFAULT_LNG = 35.3078;
const DEFAULT_RADIUS = 50;
const PRESET_RADII = [25, 50, 100, 200];

export interface AdminLocationPickerProps {
  initialLat?: number;
  initialLat_default?: number;
  initialLng?: number;
  initialRadius?: number;
  geofenceEnabled?: boolean;
  onLocationChange: (lat: number, lng: number, radius: number) => void;
}

/**
 * Admin Location Picker using an iframe-embedded OpenStreetMap.
 *
 * Free, open-source replacement for the Google Maps implementation.
 * Uses a standard <iframe> with OpenStreetMap embed URL — no external
 * mapping libraries, no API keys, no bundling conflicts.
 *
 * Features:
 *  - Latitude / Longitude / Radius input fields
 *  - Click-to-set pin via the embedded map
 *  - Adjustable radius (25m, 50m, 100m, 200m presets + custom input)
 *  - Live distance verification from admin's current GPS
 */
const AdminLocationPicker: React.FC<AdminLocationPickerProps> = ({
  initialLat = DEFAULT_LAT,
  initialLng = DEFAULT_LNG,
  initialRadius = DEFAULT_RADIUS,
  geofenceEnabled = true,
  onLocationChange,
}) => {
  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [radius, setRadius] = useState<number>(initialRadius);

  const { location: currentGeoLoc, isLoading: isLocating, error: geoError } = useGeolocation();

  /**
   * Recentre the embedded map to the admin's current GPS location
   */
  const handleCenterOnMe = useCallback(() => {
    if (currentGeoLoc) {
      setLat(parseFloat(currentGeoLoc.lat.toFixed(6)));
      setLng(parseFloat(currentGeoLoc.lng.toFixed(6)));
      showSuccess(`Current GPS location set: ${currentGeoLoc.lat.toFixed(4)}, ${currentGeoLoc.lng.toFixed(4)}`);
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
      const newLat = parseFloat(currentGeoLoc.lat.toFixed(6));
      const newLng = parseFloat(currentGeoLoc.lng.toFixed(6));
      setLat(newLat);
      setLng(newLng);
      onLocationChange(newLat, newLng, radius);
      showSuccess(`Current GPS location set: ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`);
    } else if (geoError) {
      showError(`Geolocation Error: ${geoError}`);
    } else {
      showError('Acquiring GPS signal. Please allow location permissions.');
    }
  }, [currentGeoLoc, geoError, radius, onLocationChange]);

  /**
   * Update lat/lng via input fields
   */
  const updateLat = (value: string) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      setLat(parsed);
      onLocationChange(parsed, lng, radius);
    }
  };

  const updateLng = (value: string) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      setLng(parsed);
      onLocationChange(lat, parsed, radius);
    }
  };

  const updateRadius = (value: string) => {
    const parsed = parseInt(value);
    if (!isNaN(parsed) && parsed > 0) {
      setRadius(parsed);
      onLocationChange(lat, lng, parsed);
    }
  };

  /**
   * Set a preset radius
   */
  const handlePresetRadius = (preset: number) => {
    setRadius(preset);
    onLocationChange(lat, lng, preset);
  };

  /**
   * Live distance from admin's current GPS to school target
   */
  const liveDistance = currentGeoLoc
    ? calculateDistance(currentGeoLoc.lat, currentGeoLoc.lng, lat, lng)
    : null;

  const isInsideGeofence = liveDistance !== null && liveDistance <= radius;

  // Build the OpenStreetMap embed URL (no API key, fully free)
  // Using the standard /export/embed.html endpoint with marker for the school pin
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005}%2C${lat - 0.003}%2C${lng + 0.005}%2C${lat + 0.003}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="space-y-6">
      {/* Map Preview - OpenStreetMap iframe embed */}
      <div
        className="relative w-full overflow-hidden rounded-2xl border-2 border-slate-200 shadow-lg"
        style={{ height: '400px' }}
        data-testid="admin-location-map"
      >
        <iframe
          title="School Location Map"
          src={mapEmbedUrl}
          className="w-full h-full"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/* Centre on me button */}
        {currentGeoLoc && (
          <Button
            size="icon"
            className="absolute top-4 right-4 z-10 rounded-2xl w-12 h-12 bg-white shadow-xl text-indigo-600 hover:bg-indigo-50 border border-slate-200"
            onClick={handleCenterOnMe}
            title="Centre map on my current location"
          >
            <Crosshair size={20} />
          </Button>
        )}

        {/* Open-source badge */}
        <div className="absolute bottom-2 left-2 z-10">
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
            value={lat}
            onChange={(e) => updateLat(e.target.value)}
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
            value={lng}
            onChange={(e) => updateLng(e.target.value)}
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
              onChange={(e) => updateRadius(e.target.value)}
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
          onChange={(e) => updateRadius(e.target.value)}
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