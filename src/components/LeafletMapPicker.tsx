import { useEffect, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { useGeolocation } from '@/hooks/useGeolocation';

// Fix default marker icon missing in Leaflet + bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface LeafletMapPickerProps {
  /** Current latitude */
  lat: number;
  /** Current longitude */
  lng: number;
  /** Geofence radius in metres */
  radius: number;
  /** Called when the admin moves the pin (click or drag) */
  onLocationChange: (lat: number, lng: number) => void;
  /** Called when the geofence radius changes */
  onRadiusChange?: (radius: number) => void;
  /** Zoom level, default 17 */
  zoom?: number;
  /** Extra CSS class for the map container */
  className?: string;
  /** Show controls like zoom buttons */
  scrollWheelZoom?: boolean;
}

/** Custom school-pin icon (indigo marker) */
function buildSchoolIcon() {
  const svgMarker = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="30" height="45">
      <defs>
        <filter id="shadow" x="-30%" y="-10%" width="160%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
        </filter>
      </defs>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z"
        fill="#4f46e5" filter="url(#shadow)"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
      <circle cx="12" cy="12" r="3" fill="#4f46e5"/>
    </svg>`;
  return L.divIcon({
    html: svgMarker,
    className: '',
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [0, -45],
  });
}

/**
 * Inner component that handles map events.
 * Must be used inside <MapContainer>.
 */
function MapEvents({
  onLocationChange,
  markerPosRef,
}: {
  onLocationChange: (lat: number, lng: number) => void;
  markerPosRef: React.MutableRefObject<{ lat: number; lng: number }>;
}) {
  // Handle map clicks
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
      markerPosRef.current = { lat: e.latlng.lat, lng: e.latlng.lng };
    },
  });

  return null;
}

/**
 * Fly-to effect when center prop changes after mount.
 */
function FlyToCenter({
  lat,
  lng,
  zoom,
}: {
  lat: number;
  lng: number;
  zoom: number;
}) {
  const map = useMap();
  const prevCenter = useRef<{ lat: number; lng: number } | null>(null);
  const center = { lat, lng };

  useEffect(() => {
    if (
      !prevCenter.current ||
      prevCenter.current.lat !== center.lat ||
      prevCenter.current.lng !== center.lng
    ) {
      map.flyTo(center, zoom, { animate: true, duration: 0.8 });
      prevCenter.current = center;
    }
  }, [center, zoom, map]);

  return null;
}

/**
 * Draggable marker that syncs its position back to the parent.
 */
function DraggableSchoolMarker({
  lat,
  lng,
  onDragEnd,
}: {
  lat: number;
  lng: number;
  onDragEnd: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);

  const handleDragEnd = useCallback(() => {
    const marker = markerRef.current;
    if (!marker) return;
    const pos = marker.getLatLng();
    onDragEnd(pos.lat, pos.lng);
  }, [onDragEnd]);

  return (
    <Marker
      position={[lat, lng]}
      draggable
      eventHandlers={{ dragend: handleDragEnd }}
      icon={buildSchoolIcon()}
      ref={markerRef}
    />
  );
}

/**
 * The full Leaflet map picker component.
 *
 * Renders an OpenStreetMap view with:
 * - A draggable indigo school pin
 * - A blue geofence circle (radius adjustable via the parent)
 * - Click-to-set-pin behaviour
 * - Smooth fly-to when the centre changes
 */
export default function LeafletMapPicker({
  lat,
  lng,
  radius,
  onLocationChange,
  onRadiusChange,
  zoom = 17,
  className = '',
  scrollWheelZoom = true,
}: LeafletMapPickerProps) {
  const markerPosRef = useRef({ lat, lng });
  const { location: geoLoc } = useGeolocation();

  // Default to user's GPS if lat/lng are still at default (0,0)
  const hasValidCoords = lat !== 0 || lng !== 0;
  const mapCenter: [number, number] = hasValidCoords
    ? [lat, lng]
    : geoLoc
    ? [geoLoc.lat, geoLoc.lng]
    : [0.5304, 35.3078]; // Munyaka School default

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      className={className}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom={scrollWheelZoom}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <DraggableSchoolMarker
        lat={lat}
        lng={lng}
        onDragEnd={(newLat, newLng) => {
          markerPosRef.current = { lat: newLat, lng: newLng };
          onLocationChange(newLat, newLng);
        }}
      />

      <Circle
        center={[lat, lng]}
        radius={radius}
        pathOptions={{
          color: '#4f46e5',
          fillColor: '#4f46e5',
          fillOpacity: 0.12,
          weight: 2,
          opacity: 0.8,
        }}
      />

      <MapEvents
        onLocationChange={onLocationChange}
        markerPosRef={markerPosRef}
      />

      <FlyToCenter lat={lat} lng={lng} zoom={zoom} />
    </MapContainer>
  );
}
