"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Loader2,
  Calendar,
  RefreshCw,
  ShieldOff
} from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { isWithinGeofence, getGeofenceConfig, calculateDistance } from "@/lib/geofence";
import { format } from "date-fns";

interface PersonalCheckInCardProps {
  staffName: string;
  roleName: string;
  onCheckIn: (session: 'morning' | 'afternoon') => Promise<boolean>;
  personalHistory: Record<string, any>;
}

export const PersonalCheckInCard: React.FC<PersonalCheckInCardProps> = ({
  staffName,
  roleName,
  onCheckIn,
  personalHistory
}) => {
  const { location, accuracy, error, isLoading: geoLoading, refresh: refreshGeo } = useGeolocation();
  const [timeStr, setTimeStr] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<"unknown" | "granted" | "denied" | "prompt">("unknown");

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayRecord = personalHistory[todayStr] || {};

  const isMorningDone = !!todayRecord.morning?.time;
  const isAfternoonDone = !!todayRecord.afternoon?.time;

  const geofenceConfig = useMemo(() => getGeofenceConfig(), []);
  const inGeofence = location ? isWithinGeofence(location.lat, location.lng) : false;

  // Check if current time is 12:00 PM (1200 hours) or later
  const isMorningCutoffPassed = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();
    return hours >= 12;
  }, []);

  // Check geolocation permission state when component mounts or after errors
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          setPermissionState(result.state as any);
          result.onchange = () => {
            setPermissionState(result.state as any);
          };
        })
        .catch(() => {
          setPermissionState("unknown");
        });
    } else {
      setPermissionState("unknown");
    }
  }, []);

  // If the geolocation hook reports an error, mark permission as denied
  useEffect(() => {
    if (error) {
      setPermissionState("denied");
    } else if (location) {
      setPermissionState("granted");
    }
  }, [error, location]);

  // Live Digital Clock
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    setTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (session: 'morning' | 'afternoon') => {
    setIsSubmitting(true);
    await onCheckIn(session);
    setIsSubmitting(false);
  };

  // Handle "Fix Location Permissions" click — attempt to re-prompt or
  // show guidance based on the current permission state.
  const handleFixLocationPermissions = () => {
    // First, try to re-prompt the browser to request geolocation access.
    // If the user previously denied, the browser will silently refuse
    // without re-prompting — in that case we fall through to the
    // settings guidance.
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          // User accepted on the second prompt — refresh the geolocation
          // hook so the new reading propagates into the component.
          refreshGeo();
        },
        () => {
          // Still denied. Update state so the UI reflects the error
          // and the user can follow the settings instructions below.
          setPermissionState("denied");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  // Build the Google Maps embed URL. We always show the target school
  // (the geofence centre) so the user can see both their own position
  // and the school perimeter on the same map.
  const schoolLat = geofenceConfig.lat;
  const schoolLng = geofenceConfig.lng;
  const radiusMeters = geofenceConfig.radius;

  // Convert the geofence radius from metres to a pixel radius at the
  // current map zoom. Google Maps does not let us draw a real circle via
  // the embed URL, so we use the radius-derived zoom and rely on the
  // explicit in/out-of-bounds border colour to convey the geofence.
  // A radius of 150m -> zoom 17, 300m -> 16, 500m -> 15, 1km -> 14
  const radiusToZoom = (r: number) => {
    if (r <= 150) return 17;
    if (r <= 300) return 16;
    if (r <= 500) return 15;
    if (r <= 1000) return 14;
    return 13;
  };
  const mapZoom = radiusToZoom(radiusMeters);

  // Compose the Google Maps embed URL using the standard /maps/embed endpoint.
  // We pin the centre on the school (so the geofence is always visible)
  // and pass the API key only if it has been provided via env; without
  // an API key the embed falls back to a permissionless share URL.
  const GOOGLE_MAPS_API_KEY =
    (typeof process !== "undefined" && (process as any).env?.VITE_GOOGLE_MAPS_API_KEY) || "";

  // Two embed URL strategies:
  // 1. With an API key — use the proper /maps/embed/v1 endpoint so we can
  //    switch map types, toggle place markers, etc.
  // 2. Without an API key — use the /maps embed endpoint with a q= param
  //    so we still get an interactive map without any auth.
  const mapsEmbedUrl = GOOGLE_MAPS_API_KEY
    ? `https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_API_KEY}&center=${schoolLat},${schoolLng}&zoom=${mapZoom}&maptype=roadmap`
    : `https://maps.google.com/maps?q=${schoolLat},${schoolLng}&z=${mapZoom}&output=embed`;

  // Decide the border colour of the mini-map based on whether the user
  // is inside or outside the geofence. Red = outside, green = inside.
  const mapBorderColor = inGeofence ? "rgb(16 185 129)" : "rgb(244 63 94)";

  // Build a human-readable accuracy caption for the map overlay.
  const accuracyCaption = (() => {
    if (geoLoading) return "Acquiring GPS…";
    if (error) return error;
    if (accuracy == null) return "Awaiting position";
    if (accuracy <= 25) return "Excellent signal";
    if (accuracy <= 75) return "Good signal";
    return "Approximate signal";
  })();

  // Calculate live distance from user to school
  const liveDistance = useMemo(() => {
    if (!location) return null;
    return calculateDistance(location.lat, location.lng, schoolLat, schoolLng);
  }, [location, schoolLat, schoolLng]);

  return (
    <div className="space-y-6">
      {/* Hero Self Check-In Portal */}
      <Card className="border-none shadow-lg rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white overflow-hidden relative">
        <div className="absolute right-[-20px] top-[-20px] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <CardContent className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-400/20 font-black uppercase text-[10px] tracking-widest px-3 py-1">
                  Personal Attendance Portal
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-none font-bold text-[10px] px-2.5 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse mr-1" />
                  Live
                </Badge>
              </div>
              <h2 className="text-3xl font-black tracking-tight">{staffName}</h2>
              <p className="text-indigo-200/80 font-medium text-sm mt-1">{roleName} • Munyaka School Staff</p>
            </div>

            {/* Live Clock Display */}
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 text-center shrink-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Current Time</p>
              <p className="text-3xl font-black font-mono tracking-tight text-white mt-0.5 tabular-nums">{timeStr || '00:00:00 AM'}</p>
              <p className="text-[11px] font-bold text-indigo-300/80 mt-1">{format(new Date(), 'EEEE, MMMM dd, yyyy')}</p>
            </div>
          </div>

          {/* 
            ============================================
            COMPACT GOOGLE MAPS EMBED
            Replaces the old "GPS Location Radar" status
            block. The map shows the school geofence
            perimeter, the user's detected position, and
            a colour-coded border that turns red/green
            based on whether the user is inside the
            geofence.
            ============================================
          */}
          <div className="my-8 space-y-4">
            {/* Mini-map container */}
            <div
              className="relative w-full overflow-hidden rounded-3xl border-4 transition-colors duration-500 shadow-2xl"
              style={{ borderColor: mapBorderColor }}
              data-testid="personal-checkin-map"
              aria-label={`Mini-map of the school geofence at ${schoolLat.toFixed(4)}, ${schoolLng.toFixed(4)} with radius ${radiusMeters} metres`}
            >
              {/* 
                16:9 aspect-ratio wrapper ensures the map keeps a
                reasonable size on both phones and tablets without
                forcing a fixed pixel height.
              */}
              <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
                <iframe
                  title="School Geofence Map"
                  src={mapsEmbedUrl}
                  className="absolute inset-0 w-full h-full"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />

                {/* Top-left badge: Live status pill */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
                  <Badge
                    className={`rounded-full border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 shadow-lg ${
                      inGeofence
                        ? "bg-emerald-500 text-white"
                        : "bg-rose-500 text-white"
                    }`}
                  >
                    {inGeofence ? (
                      <>
                        <CheckCircle2 size={11} className="mr-1 inline" />
                        Inside Geofence
                      </>
                    ) : (
                      <>
                        <AlertCircle size={11} className="mr-1 inline" />
                        Outside Geofence
                      </>
                    )}
                  </Badge>
                </div>

                {/* Top-right badge: Accuracy caption */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 pointer-events-none">
                  <Badge className="bg-slate-900/80 backdrop-blur-md text-white border-white/10 font-bold text-[10px] px-2.5 py-1 shadow-lg">
                    {accuracyCaption}
                  </Badge>
                </div>

                {/* 
                  User location marker — overlaid on top of the iframe.
                  Because the map is hosted inside an iframe (cross-origin
                  restrictions prevent us from drawing a custom marker
                  directly on the Google Maps tile layer), we use an
                  absolutely-positioned pin that hovers above the map.
                  When the user's location differs from the school
                  centre, we render a small connector line to indicate
                  the direction from the school to the user.
                */}
                {location && (() => {
                  // Compute a rough visual offset of the user pin from
                  // the school pin based on the relative lat/lng delta.
                  // These are normalised to a +/- 1 range against the
                  // visible map area and clamped so the pin never
                  // escapes the iframe.
                  const dLat = location.lat - schoolLat;
                  const dLng = location.lng - schoolLng;
                  const offsetScale = 0.6; // Tuned for 16:9 aspect
                  let dx = dLng * offsetScale * 6;
                  let dy = -dLat * offsetScale * 6;
                  // Clamp to keep the pin inside the visible map area
                  dx = Math.max(-35, Math.min(35, dx * 3.5));
                  dy = Math.max(-20, Math.min(20, dy * 3.5));

                  return (
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `calc(50% + ${dx}%)`,
                        top: `calc(50% + ${dy}%)`,
                        transform: "translate(-50%, -100%)",
                      }}
                      aria-hidden="true"
                    >
                      <div className="flex flex-col items-center">
                        <MapPin
                          size={28}
                          strokeWidth={2.5}
                          className={inGeofence ? "text-emerald-300 drop-shadow-lg" : "text-rose-300 drop-shadow-lg"}
                          fill="currentColor"
                          fillOpacity={0.15}
                        />
                        <div
                          className={`w-2 h-2 rounded-full -mt-1.5 ${
                            inGeofence ? "bg-emerald-300" : "bg-rose-300"
                          } animate-pulse`}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* 
                  School target marker — always centred on the geofence
                  centre so the user can see the boundary they need to
                  be within.
                */}
                <div
                  className="absolute pointer-events-none"
                  style={{ left: "50%", top: "50%", transform: "translate(-50%, -100%)" }}
                  aria-hidden="true"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-5 rounded-full bg-indigo-500 border-2 border-white shadow-xl ring-4 ring-indigo-500/30" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-white bg-indigo-600 px-1.5 py-0.5 rounded mt-1 shadow">
                      School
                    </p>
                  </div>
                </div>

                {/* Bottom info bar: coordinates, radius, accuracy */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-3 pt-8 flex items-end justify-between">
                  <div className="text-white/90 text-[10px] font-bold leading-tight">
                    {location ? (
                      <>
                        <p>
                          Your GPS:{" "}
                          <span className="font-mono text-white">
                            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                          </span>
                        </p>
                        <p>
                          Target:{" "}
                          <span className="font-mono text-white">
                            {schoolLat.toFixed(4)}, {schoolLng.toFixed(4)}
                          </span>
                        </p>
                      </>
                    ) : (
                      <p className="italic">Acquiring precise GPS coordinates…</p>
                    )}
                  </div>
                  <div className="text-white/90 text-[10px] font-bold text-right">
                    {accuracy != null && location && (
                      <p>±{Math.round(accuracy)} m</p>
                    )}
                    <p>Radius: {radiusMeters} m</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 
              If the geolocation hook reports a permission error (e.g.
              the user previously denied location access, or the browser
              blocked the prompt), show a "Fix Location Permissions" button
              that re-prompts the browser and — if denied — points the user
              to the browser's site settings.
            */}
            {error && (
              <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <ShieldOff size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-rose-900 text-sm">
                    Location access is blocked
                  </p>
                  <p className="text-xs text-rose-700/90 mt-0.5">
                    {error}
                  </p>
                  {permissionState === "denied" && (
                    <p className="text-[11px] text-rose-600/80 mt-1">
                      Open your browser's site settings and allow location
                      access, then tap <strong>Fix Location Permissions</strong> below.
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleFixLocationPermissions}
                  className="rounded-2xl h-11 px-5 bg-rose-600 hover:bg-rose-700 text-white font-black shadow-lg shadow-rose-200 gap-2 shrink-0"
                  aria-label="Re-request browser location permissions"
                >
                  <RefreshCw size={16} /> Fix Location Permissions
                </Button>
              </div>
            )}

            {/* Live accuracy / signal summary chip strip */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={`rounded-full border-none font-bold text-[10px] px-3 py-1.5 gap-1 ${
                  inGeofence
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {inGeofence ? (
                  <CheckCircle2 size={11} />
                ) : (
                  <AlertCircle size={11} />
                )}
                {inGeofence
                  ? "Verified within 100m of school"
                  : "Move closer to the school to mark attendance"}
              </Badge>
              {accuracy != null && (
                <Badge variant="outline" className="rounded-full font-bold text-[10px] px-3 py-1.5 bg-white text-slate-600">
                  Accuracy ±{Math.round(accuracy)} m
                </Badge>
              )}
              <Badge variant="outline" className="rounded-full font-bold text-[10px] px-3 py-1.5 bg-white text-slate-600">
                {radiusMeters} m radius
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={refreshGeo}
                className="rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 gap-1.5 h-7 px-3"
                aria-label="Refresh GPS location"
              >
                <RefreshCw size={12} className={geoLoading ? "animate-spin" : ""} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Action Cards: Morning Check-In & Afternoon Check-Out */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Morning Arrival Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <LogIn size={20} className="text-emerald-400" />
                    <h3 className="font-bold text-lg text-white">Morning Arrival</h3>
                  </div>
                  {isMorningDone ? (
                    <Badge className="bg-emerald-500 text-white font-bold border-none">
                      <CheckCircle2 size={12} className="mr-1" /> Checked In
                    </Badge>
                  ) : isMorningCutoffPassed ? (
                    <Badge className="bg-slate-600 text-slate-200 font-bold border-none">
                      Closed
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-300 border-none">
                      Pending
                    </Badge>
                  )}
                </div>

                {isMorningDone ? (
                  <div className="space-y-1 bg-black/20 p-4 rounded-2xl border border-white/5 mb-6">
                    <p className="text-[10px] font-black uppercase text-indigo-300">Clock-In Timestamp</p>
                    <p className="text-2xl font-black text-emerald-300">{todayRecord.morning.time}</p>
                    <p className="text-xs text-indigo-200/70">Verified Arrival • Status: Present</p>
                  </div>
                ) : isMorningCutoffPassed ? (
                  <div className="space-y-1 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50 mb-6">
                    <p className="text-[10px] font-black uppercase text-slate-400">Window Closed</p>
                    <p className="text-sm font-bold text-slate-300">Morning arrival attendance window closed at 11:59 AM.</p>
                  </div>
                ) : (
                  <p className="text-xs text-indigo-200/80 mb-6 leading-relaxed">
                    Mark your morning arrival upon reaching school grounds to record your official shift start time.
                  </p>
                )}
              </div>

              <Button
                disabled={isMorningDone || isMorningCutoffPassed || isSubmitting || !inGeofence}
                onClick={() => handleAction('morning')}
                className={`w-full h-14 rounded-2xl font-black text-base transition-all ${
                  isMorningDone || isMorningCutoffPassed
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-900/40 active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : isMorningDone ? (
                  "Morning Arrival Recorded"
                ) : isMorningCutoffPassed ? (
                  "Closed (Window Passed 11:59 AM)"
                ) : (
                  "Clock In (Morning Arrival)"
                )}
              </Button>
            </div>

            {/* Afternoon Departure Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <LogOut size={20} className="text-indigo-400" />
                    <h3 className="font-bold text-lg text-white">Afternoon Departure</h3>
                  </div>
                  {isAfternoonDone ? (
                    <Badge className="bg-indigo-500 text-white font-bold border-none">
                      <CheckCircle2 size={12} className="mr-1" /> Checked Out
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-500/20 text-slate-300 border-none">
                      Pending
                    </Badge>
                  )}
                </div>

                {isAfternoonDone ? (
                  <div className="space-y-1 bg-black/20 p-4 rounded-2xl border border-white/5 mb-6">
                    <p className="text-[10px] font-black uppercase text-indigo-300">Clock-Out Timestamp</p>
                    <p className="text-2xl font-black text-indigo-300">{todayRecord.afternoon.time}</p>
                    <p className="text-xs text-indigo-200/70">Verified Departure • Shift Complete</p>
                  </div>
                ) : (
                  <p className="text-xs text-indigo-200/80 mb-6 leading-relaxed">
                    Record your departure at the end of the school day to log official duty completion.
                  </p>
                )}
              </div>

              <Button
                disabled={isAfternoonDone || isSubmitting || !inGeofence}
                onClick={() => handleAction('afternoon')}
                className={`w-full h-14 rounded-2xl font-black text-base transition-all ${
                  isAfternoonDone 
                    ? 'bg-white/10 text-white/50 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-900/40 active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : isAfternoonDone ? (
                  "Afternoon Departure Recorded"
                ) : (
                  "Clock Out (Afternoon Departure)"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Personal Log History */}
      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Personal Activity Log</h3>
              <p className="text-xs text-slate-400">Your recent verified attendance entries</p>
            </div>
          </div>
          <Badge variant="outline" className="rounded-xl border-slate-200 text-slate-600 font-bold">
            Last 7 Days
          </Badge>
        </div>

        <div className="divide-y divide-slate-100">
          {Object.keys(personalHistory).length > 0 ? (
            Object.keys(personalHistory).map((dateKey) => {
              const rec = personalHistory[dateKey];
              return (
                <div key={dateKey} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900">{format(new Date(dateKey), 'MMMM dd, yyyy')}</p>
                    <p className="text-xs text-slate-400 font-medium">Daily Duty Session</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Morning ArrArrival</p>
                      <p className="text-sm font-black text-emerald-600">{rec.morning?.time || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Afternoon Departure</p>
                      <p className="text-sm font-black text-indigo-600">{rec.afternoon?.time || '—'}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm">
              No previous personal check-in logs recorded yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};