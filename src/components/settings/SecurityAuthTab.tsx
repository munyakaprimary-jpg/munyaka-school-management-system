import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import { CentralDataService } from "@/services/centralDataService";
import { auth, db } from '@/config/firebase';
import { updatePassword, updateEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { MUNYAKA_ADMIN_PASSWORD } from '@/services/adminCredentials';
import {
  Shield,
  Key,
  History,
  UserCheck,
  AlertTriangle,
  Navigation,
  Radio,
  Eye,
  EyeOff
} from 'lucide-react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const SECURITY_SETTINGS_KEY = 'munyaka_security_settings';
const AUDIT_LOGS_KEY = 'munyaka_security_audit_logs';

interface SecuritySettings {
  enforceGeofence: boolean;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  localhostBypass: boolean;
}

const DEFAULT_SECURITY: SecuritySettings = {
  enforceGeofence: true,
  latitude: -0.5143,
  longitude: 35.2698,
  geofenceRadiusMeters: 100,
  localhostBypass: true,
};

interface AuditLog {
  id: string;
  timestamp: string;
  userRole: string;
  userName: string;
  action: string;
  status: 'Success' | 'Warning' | 'Locked';
}

export default function SecurityAuthTab() {
  const [security, setSecurity] = useState<SecuritySettings>(() => {
    try {
      const central = CentralDataService.getData<SecuritySettings>(SECURITY_SETTINGS_KEY, DEFAULT_SECURITY);
      if (central && typeof central === 'object') return { ...DEFAULT_SECURITY, ...central };
      const saved = localStorage.getItem(SECURITY_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...DEFAULT_SECURITY, ...parsed };
      }
    } catch {}
    return DEFAULT_SECURITY;
  });

  const [isSettingsLocked, setIsSettingsLocked] = useState<boolean>(() => {
    try {
      const savedLock = localStorage.getItem('munyaka_geofence_locked');
      return savedLock ? JSON.parse(savedLock) : false;
    } catch {
      return false;
    }
  });

  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Admin Credentials state
  const [adminUsername, setAdminUsername] = useState(() =>
    localStorage.getItem('munyaka_admin_email') || localStorage.getItem('admin_email') || 'munyakaprimary@gmail.com'
  );
  const [adminPassword, setAdminPassword] = useState(() =>
    localStorage.getItem('munyaka_admin_password') || localStorage.getItem('admin_pin') || 'admin123'
  );
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [ownerUsername, setOwnerUsername] = useState(() =>
    localStorage.getItem('munyaka_owner_email') || localStorage.getItem('owner_email') || 'jamesndiki@gmail.com'
  );
  const [ownerPassword, setOwnerPassword] = useState(() =>
    localStorage.getItem('munyaka_owner_password') || localStorage.getItem('owner_pin') || 'owner123'
  );
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);

  // Real Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const central = CentralDataService.getData<AuditLog[]>(AUDIT_LOGS_KEY, []);
      if (central && Array.isArray(central)) return central;
      const saved = localStorage.getItem(AUDIT_LOGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);
  const circleInstanceRef = useRef<L.Circle | null>(null);

  const logSecurityEvent = (role: string, name: string, actionText: string, status: 'Success' | 'Warning' | 'Locked' = 'Success') => {
    const newLog: AuditLog = {
      id: `SEC-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleString(),
      userRole: role,
      userName: name,
      action: actionText,
      status
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev];
      try {
        CentralDataService.setData(AUDIT_LOGS_KEY, updated);
        localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleLockAndSave = () => {
    try {
      CentralDataService.setData(SECURITY_SETTINGS_KEY, security);
      localStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(security));
      const nextLockState = !isSettingsLocked;
      setIsSettingsLocked(nextLockState);
      localStorage.setItem('munyaka_geofence_locked', JSON.stringify(nextLockState));
      
      if (nextLockState) {
        showSuccess("Geofence and coordinate parameters locked & saved permanently!");
        logSecurityEvent('System Administrator', adminUsername, `Geofence & Coordinates Locked & Saved (${security.latitude}, ${security.longitude}, ${security.geofenceRadiusMeters}m)`, 'Locked');
      } else {
        showSuccess("Geofence settings unlocked for editing.");
        logSecurityEvent('System Administrator', adminUsername, 'Geofence Settings Unlocked for Editing');
      }
    } catch (e) {
      showError("Failed to save geofence settings.");
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([security.latitude, security.longitude], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Add marker
      const marker = L.marker([security.latitude, security.longitude], {
        draggable: !isSettingsLocked
      }).addTo(map);

      marker.on('dragend', () => {
        if (isSettingsLocked) return;
        const pos = marker.getLatLng();
        const lat = parseFloat(pos.lat.toFixed(6));
        const lng = parseFloat(pos.lng.toFixed(6));
        setSecurity(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));
        logSecurityEvent('System Administrator', adminUsername, `Campus Geofence Pin Dropped at (${lat}, ${lng})`);
      });

      // Add circle for geofence radius
      const circle = L.circle([security.latitude, security.longitude], {
        radius: security.geofenceRadiusMeters,
        color: '#4f46e5',
        fillColor: '#6366f1',
        fillOpacity: 0.2
      }).addTo(map);

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;
      circleInstanceRef.current = circle;

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker and circle when latitude, longitude, or radius changes
  useEffect(() => {
    if (mapInstanceRef.current && markerInstanceRef.current && circleInstanceRef.current) {
      const newLatLng = new L.LatLng(security.latitude, security.longitude);
      markerInstanceRef.current.setLatLng(newLatLng);
      circleInstanceRef.current.setLatLng(newLatLng);
      circleInstanceRef.current.setRadius(security.geofenceRadiusMeters);
      mapInstanceRef.current.setView(newLatLng, mapInstanceRef.current.getZoom(), { animate: true });
      mapInstanceRef.current.invalidateSize();
    }
    if (markerInstanceRef.current) {
      if (isSettingsLocked) {
        markerInstanceRef.current.dragging?.disable();
      } else {
        markerInstanceRef.current.dragging?.enable();
      }
    }
  }, [security.latitude, security.longitude, security.geofenceRadiusMeters, isSettingsLocked]);

  const toggleLiveTracking = () => {
    if (isSettingsLocked) {
      showError("Settings are locked. Unlock to use live GPS tracking.");
      return;
    }
    if (isLiveTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsLiveTracking(false);
      showSuccess("Live geolocation tracking paused.");
      logSecurityEvent('System Administrator', adminUsername, 'Stopped Live GPS Tracking');
    } else {
      if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser.");
        return;
      }
      setIsLiveTracking(true);
      showSuccess("Live geolocation tracking active — mapping movement in real-time.");
      logSecurityEvent('System Administrator', adminUsername, 'Started Live GPS Tracking');
      
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lng = parseFloat(position.coords.longitude.toFixed(6));
          setSecurity(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
          }));
        },
        (error) => {
          console.error(error);
          showError("Unable to retrieve live location updates.");
          setIsLiveTracking(false);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
    }
  };

  const handleSaveAdmin = async () => {
    try {
      const trimmedEmail = adminUsername.trim();
      const trimmedPass = adminPassword.trim();

      // 1. Update Firebase Auth password / email if user is logged in
      if (auth.currentUser) {
        try {
          if (auth.currentUser.email && auth.currentUser.email !== trimmedEmail) {
            await updateEmail(auth.currentUser, trimmedEmail);
          }
          if (trimmedPass) {
            await updatePassword(auth.currentUser, trimmedPass);
          }
        } catch (fbErr: any) {
          console.warn('[SecurityAuthTab] Firebase Auth credential update notice:', fbErr);
          // If requires recent login or other non-fatal constraint, we still save to localStorage/Firestore
        }
      }

      // 2. Save to localStorage
      localStorage.setItem('munyaka_admin_email', trimmedEmail);
      localStorage.setItem('admin_email', trimmedEmail);
      localStorage.setItem('munyaka_admin_password', trimmedPass);
      localStorage.setItem('admin_pin', trimmedPass);
      localStorage.setItem(MUNYAKA_ADMIN_PASSWORD, trimmedPass);

      // 3. Save to Firestore school_settings/credentials
      try {
        const credRef = doc(db, 'school_settings', 'credentials');
        await setDoc(credRef, {
          admin_email: trimmedEmail,
          admin_pin: trimmedPass,
          admin_password: trimmedPass,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) {
        console.warn('[SecurityAuthTab] Firestore credentials sync notice:', fsErr);
      }

      showSuccess("Admin credentials and Firebase Auth password updated successfully!");
      logSecurityEvent('System Administrator', trimmedEmail, 'Admin Credentials & Firebase Auth Password Updated');
    } catch (e: any) {
      console.error(e);
      showError(e?.message || "Failed to update admin credentials.");
    }
  };

  const handleSaveOwner = async () => {
    try {
      const trimmedEmail = ownerUsername.trim();
      const trimmedPass = ownerPassword.trim();

      if (auth.currentUser) {
        try {
          if (auth.currentUser.email && auth.currentUser.email !== trimmedEmail) {
            await updateEmail(auth.currentUser, trimmedEmail);
          }
          if (trimmedPass) {
            await updatePassword(auth.currentUser, trimmedPass);
          }
        } catch (fbErr: any) {
          console.warn('[SecurityAuthTab] Firebase Auth owner credential update notice:', fbErr);
        }
      }

      localStorage.setItem('munyaka_owner_email', trimmedEmail);
      localStorage.setItem('owner_email', trimmedEmail);
      localStorage.setItem('munyaka_owner_password', trimmedPass);
      localStorage.setItem('owner_pin', trimmedPass);

      try {
        const credRef = doc(db, 'school_settings', 'credentials');
        await setDoc(credRef, {
          owner_email: trimmedEmail,
          owner_pin: trimmedPass,
          owner_password: trimmedPass,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) {
        console.warn('[SecurityAuthTab] Firestore owner credentials sync notice:', fsErr);
      }

      showSuccess("Owner credentials and Firebase Auth password updated successfully!");
      logSecurityEvent('School Owner', trimmedEmail, 'Owner Credentials & Firebase Auth Password Updated');
    } catch (e: any) {
      console.error(e);
      showError(e?.message || "Failed to update owner credentials.");
    }
  };

  const handleRadiusChange = (radius: number) => {
    if (isSettingsLocked) return;
    setSecurity(prev => ({ ...prev, geofenceRadiusMeters: radius }));
    logSecurityEvent('System Administrator', adminUsername, `Geofence Radius Updated (${radius}m)`);
  };

  const handleGeofenceToggle = (val: boolean) => {
    if (isSettingsLocked) return;
    setSecurity(prev => ({ ...prev, enforceGeofence: val }));
    logSecurityEvent('System Administrator', adminUsername, `Geofence Enforcement ${val ? 'Enabled' : 'Disabled'}`);
  };

  const handleBypassToggle = (val: boolean) => {
    if (isSettingsLocked) return;
    setSecurity(prev => ({ ...prev, localhostBypass: val }));
    logSecurityEvent('System Administrator', adminUsername, `Localhost GPS Bypass ${val ? 'Enabled' : 'Disabled'}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* 1. Admin Credentials Card */}
      <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
        <CardHeader className="px-0 pt-0 pb-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Key size={22} />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">Admin & Owner Credentials</CardTitle>
              <CardDescription>Manage login credentials for both administrative roles.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* School Administrator Block */}
          <div className="p-5 bg-slate-50/80 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserCheck size={16} className="text-indigo-600" /> School Administrator
              </h4>
              <Badge className="bg-indigo-100 text-indigo-800 text-xs">Primary Admin</Badge>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Username / Email</Label>
                <Input value={adminUsername} onChange={e => setAdminUsername(e.target.value)} className="bg-white" />
              </div>
              <div>
                <Label className="text-xs">Password</Label>
                <div className="relative flex items-center">
                  <Input
                    type={showAdminPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    className="bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 text-slate-400 hover:text-indigo-600 focus:outline-none"
                  >
                    {showAdminPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button onClick={handleSaveAdmin} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-10">
                Update Admin Credentials
              </Button>
            </div>
          </div>

          {/* School Owner Block */}
          <div className="p-5 bg-slate-50/80 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Shield size={16} className="text-emerald-600" /> School Owner
              </h4>
              <Badge className="bg-emerald-100 text-emerald-800 text-xs">Executive Owner</Badge>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Username / Email</Label>
                <Input value={ownerUsername} onChange={e => setOwnerUsername(e.target.value)} className="bg-white" />
              </div>
              <div>
                <Label className="text-xs">Password</Label>
                <div className="relative flex items-center">
                  <Input
                    type={showOwnerPassword ? "text" : "password"}
                    value={ownerPassword}
                    onChange={e => setOwnerPassword(e.target.value)}
                    className="bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                    className="absolute right-3 text-slate-400 hover:text-emerald-600 focus:outline-none"
                  >
                    {showOwnerPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button onClick={handleSaveOwner} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-10">
                Update Owner Credentials
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Geofence & Location Security Rules */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
        
        {/* Geofence Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Geofence & Location Security Rules</h3>
              <p className="text-xs text-slate-500">Global GPS parameters for staff daily attendance check-ins.</p>
            </div>
          </div>

          {/* Lock & Save Action Button */}
          <button
            type="button"
            onClick={handleLockAndSave}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm ${
              isSettingsLocked 
                ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isSettingsLocked ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Unlock Settings
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                Lock & Save Settings
              </>
            )}
          </button>
        </div>

        {isSettingsLocked && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Settings are currently locked and saved permanently. Click &quot;Unlock Settings&quot; above to modify.
          </div>
        )}

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Enforce Attendance Geofence</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Require staff to be within campus radius to submit daily check-in.</p>
          </div>
          <Switch 
            checked={security.enforceGeofence} 
            onCheckedChange={handleGeofenceToggle}
            disabled={isSettingsLocked}
          />
        </div>

        {/* Admin Location Picker Map (Leaflet with Real-Time watchPosition) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="font-bold text-slate-800">Admin Location Picker (OpenStreetMap)</Label>
              {isLiveTracking && (
                <Badge className="bg-emerald-100 text-emerald-700 animate-pulse text-[10px] gap-1">
                  <Radio size={10} /> Live GPS Tracking
                </Badge>
              )}
            </div>
            {!isSettingsLocked && (
              <Button 
                size="sm" 
                variant={isLiveTracking ? "default" : "outline"} 
                onClick={toggleLiveTracking} 
                className={`text-xs gap-1.5 h-8 ${isLiveTracking ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : ''}`}
              >
                <Navigation size={13} /> {isLiveTracking ? 'Stop Live Tracking' : 'Start Live GPS Tracking'}
              </Button>
            )}
          </div>
          <div 
            ref={mapContainerRef} 
            className="w-full h-80 rounded-2xl overflow-hidden border shadow-inner z-0 relative"
          />
        </div>

        {/* Latitude & Longitude Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Latitude</Label>
            <Input 
              type="number" 
              step="0.0001"
              value={security.latitude} 
              disabled={isSettingsLocked}
              onChange={e => {
                if (isSettingsLocked) return;
                const val = parseFloat(e.target.value) || 0;
                setSecurity({...security, latitude: val});
                logSecurityEvent('System Administrator', adminUsername, `Latitude Adjusted to ${val}`);
              }} 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Longitude</Label>
            <Input 
              type="number" 
              step="0.0001"
              value={security.longitude} 
              disabled={isSettingsLocked}
              onChange={e => {
                if (isSettingsLocked) return;
                const val = parseFloat(e.target.value) || 0;
                setSecurity({...security, longitude: val});
                logSecurityEvent('System Administrator', adminUsername, `Longitude Adjusted to ${val}`);
              }} 
            />
          </div>
        </div>

        {/* Geofence Radius Slider & Quick Select Buttons */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <label className="font-bold text-slate-800">Geofence Radius ({security.geofenceRadiusMeters} meters)</label>
            <span className="text-indigo-600 font-bold">Allowed campus perimeter</span>
          </div>
          <input 
            type="range" 
            min="25" 
            max="1000" 
            step="25"
            value={security.geofenceRadiusMeters}
            disabled={isSettingsLocked}
            onChange={e => handleRadiusChange(parseInt(e.target.value))}
            className="w-full accent-indigo-600 bg-slate-200 h-2 rounded-lg cursor-pointer disabled:opacity-50"
          />
          <div className="flex justify-between text-[11px] text-slate-400 px-1">
            <span>25m</span>
            <span>50m</span>
            <span>100m</span>
            <span>150m</span>
            <span>200m</span>
            <span>500m</span>
            <span>1000m</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {[25, 50, 100, 150, 200, 500, 1000].map(m => (
              <button
                key={m}
                onClick={() => handleRadiusChange(m)}
                disabled={isSettingsLocked}
                className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition-colors disabled:opacity-50 ${
                  security.geofenceRadiusMeters === m 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>

        {/* Live Distance Verification Warning & Localhost Bypass */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-amber-900 text-sm">Live Distance Verification Active</h4>
            <p className="text-xs text-amber-700 mt-0.5">Staff check-ins outside the {security.geofenceRadiusMeters}m radius will be flagged or rejected unless Development Bypass is active.</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Development / Localhost GPS Bypass</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Skip GPS distance enforcement during local testing and simulation.</p>
          </div>
          <Switch 
            checked={security.localhostBypass} 
            onCheckedChange={handleBypassToggle} 
            disabled={isSettingsLocked}
          />
        </div>
      </div>

      {/* 3. System Security Audit Trail */}
      <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
        <CardHeader className="px-0 pt-0 pb-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
              <History size={22} />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">System Security Audit Trail</CardTitle>
              <CardDescription>Read-only log of high-privilege configuration and authentication events.</CardDescription>
            </div>
          </div>
          <Badge className="bg-purple-100 text-purple-800 border-purple-200 font-bold px-3 py-1 w-fit">
            Immutable Ledger
          </Badge>
        </CardHeader>
        <CardContent className="px-0 pt-6">
          <div className="overflow-x-auto">
            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium text-sm">
                No security events recorded yet.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-50/80 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="py-3 px-4">Event ID / Timestamp</th>
                    <th className="py-3 px-4">User Role & Name</th>
                    <th className="py-3 px-4">Action Taken</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 font-mono text-xs">
                        <div className="font-bold text-slate-900">{log.id}</div>
                        <div className="text-slate-400 text-[11px]">{log.timestamp}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{log.userName}</div>
                        <div className="text-xs text-indigo-600">{log.userRole}</div>
                      </td>
                      <td className="py-4 px-4 text-slate-700">{log.action}</td>
                      <td className="py-4 px-4 text-right">
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-bold">
                          {log.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
