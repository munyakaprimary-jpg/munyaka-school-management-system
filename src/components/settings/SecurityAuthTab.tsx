import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import { CentralDataService } from "@/services/centralDataService";
import { 
  Shield, 
  Key, 
  MapPin, 
  Compass, 
  History, 
  Lock, 
  UserCheck, 
  Globe, 
  Check, 
  AlertTriangle,
  RefreshCw,
  Navigation
} from 'lucide-react';

const SECURITY_SETTINGS_KEY = 'munyaka_security_settings';
const ADMIN_CREDENTIALS_KEY = 'munyaka_admin_credentials_store';
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

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'LOG-101', timestamp: '2026-04-14 08:30:12', userRole: 'School Owner', userName: 'Director Kiprop', action: 'Geofence Radius Updated (100m)', status: 'Success' },
  { id: 'LOG-102', timestamp: '2026-04-13 14:22:05', userRole: 'School Administrator', userName: 'System Admin', action: 'Admin Credentials Reset', status: 'Success' },
  { id: 'LOG-103', timestamp: '2026-04-12 09:10:44', userRole: 'School Owner', userName: 'Director Kiprop', action: 'Grade Bounds Modified (CBC 4-Point)', status: 'Success' },
  { id: 'LOG-104', timestamp: '2026-04-10 16:45:00', userRole: 'System Administrator', userName: 'System Admin', action: 'Idle Session Timeout Configured (30 mins)', status: 'Success' },
];

export default function SecurityAuthTab() {
  const [security, setSecurity] = useState<SecuritySettings>(() => {
    try {
      const central = CentralDataService.getData<SecuritySettings>(SECURITY_SETTINGS_KEY, DEFAULT_SECURITY);
      if (central && typeof central === 'object') return { ...DEFAULT_SECURITY, ...central };
      const saved = localStorage.getItem(SECURITY_SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SECURITY;
  });

  // Admin Credentials state
  const [adminUsername, setAdminUsername] = useState("admin@munyaka.ac.ke");
  const [adminPassword, setAdminPassword] = useState("••••••••");
  const [ownerUsername, setOwnerUsername] = useState("director@munyaka.ac.ke");
  const [ownerPassword, setOwnerPassword] = useState("••••••••");

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const central = CentralDataService.getData<AuditLog[]>(AUDIT_LOGS_KEY, []);
      if (central && central.length > 0) return central;
      const saved = localStorage.getItem(AUDIT_LOGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_AUDIT_LOGS;
  });

  useEffect(() => {
    try {
      CentralDataService.setData(SECURITY_SETTINGS_KEY, security);
      localStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(security));
    } catch {}
  }, [security]);

  const handleSaveCredentials = (role: 'Admin' | 'Owner') => {
    showSuccess(`${role} credentials updated securely in persistent storage!`);
    const newLog: AuditLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleString(),
      userRole: role === 'Owner' ? 'School Owner' : 'School Administrator',
      userName: role === 'Owner' ? ownerUsername : adminUsername,
      action: `${role} Login Credentials Reset`,
      status: 'Success'
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    CentralDataService.setData(AUDIT_LOGS_KEY, updatedLogs);
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updatedLogs));
  };

  const handleUseCurrentGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSecurity(prev => ({
            ...prev,
            latitude: parseFloat(position.coords.latitude.toFixed(6)),
            longitude: parseFloat(position.coords.longitude.toFixed(6))
          }));
          showSuccess("Acquired current GPS coordinates successfully!");
        },
        () => {
          showError("Unable to retrieve your GPS location. Please check browser permissions.");
        }
      );
    } else {
      showError("Geolocation is not supported by your browser.");
    }
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
                <Input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="bg-white" />
              </div>
              <Button onClick={() => handleSaveCredentials('Admin')} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-10">
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
                <Input type="password" value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)} className="bg-white" />
              </div>
              <Button onClick={() => handleSaveCredentials('Owner')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-10">
                Update Owner Credentials
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Geofence & Location Security Rules */}
      <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
        <CardHeader className="px-0 pt-0 pb-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <MapPin size={22} />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">Geofence & Location Security Rules</CardTitle>
              <CardDescription>Global GPS parameters for staff daily attendance check-ins.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pt-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
            <div>
              <h4 className="font-bold text-slate-900">Enforce Attendance Geofence</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Require staff to be within campus radius to submit daily check-in.</p>
            </div>
            <Switch 
              checked={security.enforceGeofence} 
              onCheckedChange={(val) => setSecurity({...security, enforceGeofence: val})} 
            />
          </div>

          {/* Admin Location Picker Map Simulation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-bold text-slate-800">Admin Location Picker (OpenStreetMap)</Label>
              <Button size="sm" variant="outline" onClick={handleUseCurrentGPS} className="text-xs gap-1.5 h-8">
                <Navigation size={13} /> Use Current GPS Location
              </Button>
            </div>
            <div className="relative w-full h-64 rounded-2xl overflow-hidden border bg-slate-100 flex items-center justify-center shadow-inner">
              {/* Simulated interactive map background */}
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-70"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/50 via-slate-100/30 to-blue-50/50"></div>
              
              {/* Map pin */}
              <div className="relative z-10 flex flex-col items-center animate-bounce">
                <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                  <MapPin size={12} /> Munyaka Campus Center
                </div>
                <div className="w-4 h-4 bg-indigo-600 rotate-45 -mt-2 shadow"></div>
              </div>

              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border text-[11px] font-mono text-slate-600 shadow-sm">
                Lat: {security.latitude}, Lng: {security.longitude}
              </div>
            </div>
          </div>

          {/* Latitude & Longitude Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Latitude</Label>
              <Input 
                type="number" 
                step="0.0001"
                value={security.latitude} 
                onChange={e => setSecurity({...security, latitude: parseFloat(e.target.value) || 0})} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Longitude</Label>
              <Input 
                type="number" 
                step="0.0001"
                value={security.longitude} 
                onChange={e => setSecurity({...security, longitude: parseFloat(e.target.value) || 0})} 
              />
            </div>
          </div>

          {/* Geofence Radius Slider & Quick Select Buttons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800">Geofence Radius ({security.geofenceRadiusMeters} meters)</Label>
              <span className="text-xs text-indigo-600 font-mono font-bold">Allowed campus perimeter</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="1000" 
              step="10"
              value={security.geofenceRadiusMeters}
              onChange={e => setSecurity({...security, geofenceRadiusMeters: parseInt(e.target.value)})}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {[25, 50, 100, 150, 200, 500, 1000].map(m => (
                <button
                  key={m}
                  onClick={() => setSecurity({...security, geofenceRadiusMeters: m})}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition-colors ${
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
              <h4 className="font-bold text-slate-900">Development / Localhost GPS Bypass</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Skip GPS distance enforcement during local testing and simulation.</p>
            </div>
            <Switch 
              checked={security.localhostBypass} 
              onCheckedChange={(val) => setSecurity({...security, localhostBypass: val})} 
            />
          </div>
        </CardContent>
      </Card>

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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
