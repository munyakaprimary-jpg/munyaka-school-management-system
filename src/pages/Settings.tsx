import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import BackButton from '@/components/ui/BackButton';
import {
  School,
  Save,
  Loader2,
  Calendar,
  Layers,
  GraduationCap,
  Plus,
  Trash2,
  Info,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Lock,
  Navigation,
  Clock,
  History,
  AlertTriangle,
  AlertCircle,
  UserCog,
  Search,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Shield,
  FileSpreadsheet,
  RotateCcw,
  Key,
  MapPin,
  Eye,
  EyeOff,
  RefreshCw,
  Unlock,
  ShieldAlert,
  Crosshair
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getGeofenceConfig, setGeofenceConfig as persistGeofenceConfig, GeofenceConfig, calculateDistance } from '@/lib/geofence';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import AdminLocationPicker from '@/components/AdminLocationPicker';

const SETTINGS_MASTER_KEY = 'munyaka_system_settings_v3';
const SETTINGS_ROW_ID = 'default';

type Action = 'read' | 'create' | 'edit' | 'delete';
type PermissionState = Record<string, Record<Action, boolean>>;

const MODULES = [
  { id: 'sys_config', title: 'System Configuration & Security', desc: 'RBAC, Audit Logs, System Backups' },
  { id: 'academic_grading', title: 'Academic & CBC Grading Setup', desc: 'Assessments, Report Cards, Grade Bounds' },
  { id: 'student_records', title: 'Student & Guardian Records', desc: 'Enrollment, Bio Data, Attendance' },
  { id: 'finance_fees', title: 'Fee Management & Finance', desc: 'Billing, Invoices, Payment Collections' },
  { id: 'payment_subscriptions', title: 'Payment & Subscriptions', desc: 'Software Payments, Subscriptions, Financial Gateway' },
  { id: 'staff_mgmt', title: 'Staff Management & Geofence', desc: 'Staff Profiles, Compound GPS Tracking' }
];

const ROLES = [
  { id: 'owner', label: 'Super Admin / Owner' },
  { id: 'super_admin', label: 'System Administrator' },
  { id: 'head_teacher', label: 'Principal / Head' },
  { id: 'bursar', label: 'Bursar / Accountant' },
  { id: 'teacher', label: 'Class Teacher' },
  { id: 'parent', label: 'Parent / Guardian' },
  { id: 'student', label: 'Learner' }
];

const DEFAULT_AUDIT_LOGS = [
  { timestamp: "2026-03-31 09:14:02", admin: "School Owner", action: "Geofence Radius Updated (150m)", ip: "192.168.1.102 (Chrome/Win)" },
  { timestamp: "2026-03-30 16:45:11", admin: "School Owner", action: "Credentials Reset for J. Mwangi", ip: "192.168.1.102 (Chrome/Win)" },
  { timestamp: "2026-03-28 11:20:30", admin: "Head Teacher", action: "Grade Bounds Modified (Grade 4)", ip: "192.168.1.108 (Safari/Mac)" },
  { timestamp: "2026-03-25 08:30:15", admin: "School Owner", action: "Idle Session Timeout set to 30m", ip: "192.168.1.102 (Chrome/Win)" }
];

const getPasswordStrength = (pass: string) => {
  if (!pass) return { score: 0, label: 'Not Set', color: 'bg-slate-200 text-slate-400' };
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 10) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 2) return { score: 33, label: 'Weak', color: 'bg-rose-500 text-rose-600' };
  if (score <= 4) return { score: 66, label: 'Medium', color: 'bg-amber-500 text-amber-600' };
  return { score: 100, label: 'Strong', color: 'bg-emerald-500 text-emerald-600' };
};

/**
 * Build a fully-populated RBAC matrix for every role & every module.
 * Always returns a complete object — never undefined, never missing modules.
 * This is the single source of truth used both for the initial state and
 * as the merge base when loading stale/incomplete data from Supabase or
 * localStorage.
 */
const buildDefaultPermissions = (): Record<string, PermissionState> => {
  const initialState: Record<string, PermissionState> = {};
  ROLES.forEach(role => {
    initialState[role.id] = {};
    MODULES.forEach(mod => {
      initialState[role.id][mod.id] = {
        read: true,
        create: role.id === 'owner' || role.id === 'super_admin' || role.id === 'head_teacher',
        edit: role.id === 'owner' || role.id === 'super_admin' || role.id === 'head_teacher',
        delete: role.id === 'owner' || role.id === 'super_admin'
      };
    });
  });
  // Owner has exclusive payment_subscriptions access; super_admin and others do not
  if (initialState['owner']) {
    initialState['owner']['payment_subscriptions'] = { read: true, create: true, edit: true, delete: true };
  }
  ['super_admin', 'head_teacher', 'bursar', 'teacher', 'parent', 'student'].forEach(roleId => {
    if (initialState[roleId]) {
      initialState[roleId]['payment_subscriptions'] = { read: false, create: false, edit: false, delete: false };
    }
  });
  return initialState;
};

/**
 * Merge incoming RBAC data on top of the default matrix.
 * Guarantees every role & every module has a complete CRUD object,
 * filling in any missing entries (e.g. when loading data from an older
 * schema that did not include the new `payment_subscriptions` module).
 */
const mergePermissions = (
  incoming: Record<string, PermissionState> | null | undefined
): Record<string, PermissionState> => {
  const base = buildDefaultPermissions();
  if (!incoming || typeof incoming !== 'object') return base;

  Object.keys(incoming).forEach(roleId => {
    const incomingRole = incoming[roleId];
    if (!incomingRole || typeof incomingRole !== 'object') return;
    if (!base[roleId]) base[roleId] = {};
    Object.keys(incomingRole).forEach(moduleId => {
      const incomingModule = incomingRole[moduleId];
      if (!incomingModule || typeof incomingModule !== 'object') return;
      const safe = {
        read: !!incomingModule.read,
        create: !!incomingModule.create,
        edit: !!incomingModule.edit,
        delete: !!incomingModule.delete
      };
      base[roleId][moduleId] = safe;
    });
  });

  return base;
};

/**
 * Safe getter for a single permission flag.
 * Returns `false` for any missing/undefined access path so deep
 * property reads never throw.
 */
const getPermFlag = (
  perms: Record<string, PermissionState> | null | undefined,
  roleId: string,
  moduleId: string,
  action: Action
): boolean => {
  return !!perms?.[roleId]?.[moduleId]?.[action];
};

const Settings = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(false);
  const [showAuthPass, setShowAuthPass] = useState(false);

  const { location: currentGeoLoc, isLoading: isLocating, error: geoError, refresh: refreshGeo } = useGeolocation();

  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (['general', 'academic', 'roles', 'security'].includes(tab ?? '')) return tab as string;
    }
    return 'roles';
  });

  const [generalConfig, setGeneralConfig] = useState({
    schoolName: "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
    motto: "KNOWLEDGE IS POWER",
    postalAddress: "P.O. BOX 5239-30100 ELDORET",
    phone: "+254 712 345 678",
    email: "info@munyaka.sc.ke",
    location: "Munyaka, Eldoret East, Uasin Gishu County",
    maintenanceMode: false
  });

  const [academicConfig, setAcademicConfig] = useState({
    activeYear: "2026",
    activeTerm: "term1",
    termStartDate: "2026-01-05",
    termEndDate: "2026-04-10",
    gradingScale: [
      { level: "EE", descriptor: "Exceeding Expectations", min: 80, max: 100, points: 4 },
      { level: "ME", descriptor: "Meeting Expectations", min: 50, max: 79, points: 3 },
      { level: "AE", descriptor: "Approaching Expectations", min: 30, max: 49, points: 2 },
      { level: "BE", descriptor: "Below Expectations", min: 0, max: 29, points: 1 }
    ]
  });

  const [expandedRole, setExpandedRole] = useState<string | null>('owner');
  const [permissions, setPermissions] = useState<Record<string, PermissionState>>(() => buildDefaultPermissions());

  const [pinForm, setPinForm] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: ""
  });
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // Geofence state — defaults to the Munyaka School coordinates with 50m default radius
  const [geofenceConfig, setGeofenceState] = useState<GeofenceConfig>({
    lat: 0.5304,
    lng: 35.3078,
    radius: 50
  });
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const [devBypass, setDevBypass] = useState(false);

  const [sessionSecurity, setSessionSecurity] = useState({
    idleTimeout: "30m",
    requirePasswordOnFirstLogin: true
  });

  const [auditLogs, setAuditLogs] = useState(DEFAULT_AUDIT_LOGS);

  // Admin Location Picker state (Leaflet-based, no Google Maps)
  const [searchQuery, setSearchQuery] = useState("");

  const handleAuthorizeSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPassword.trim()) {
      setAuthError("Please enter your admin password.");
      return;
    }

    setIsVerifyingAuth(true);
    setAuthError("");

    await new Promise(r => setTimeout(r, 600));

    const currentAdminPass = localStorage.getItem('munyaka_admin_pass') || 'munyaka5239';

    if (authPassword === currentAdminPass) {
      setIsAuthorized(true);
      setAuthPassword("");
      showSuccess("Admin authorization granted. Opening System Configuration...");
    } else {
      setAuthError("Invalid Admin Password. Access denied.");
      setAuthPassword("");
      showError("Authentication failed");
    }
    setIsVerifyingAuth(false);
  };

  const handleLockSettings = () => {
    setIsAuthorized(false);
    setAuthPassword("");
    setAuthError("");
    showSuccess("Configuration console locked.");
  };

  const fetchSettingsFromDatabase = useCallback(async () => {
    setIsLoadingSettings(true);

    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', SETTINGS_ROW_ID)
        .single();

      if (!error && data) {
        setGeneralConfig({
          schoolName: data.school_name || "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
          motto: data.motto || "KNOWLEDGE IS POWER",
          postalAddress: data.postal_address || "P.O. BOX 5239-30100 ELDORET",
          phone: data.phone || "+254 712 345 678",
          email: data.email || "info@munyaka.sc.ke",
          location: data.location || "Munyaka, Eldoret East, Uasin Gishu County",
          maintenanceMode: !!data.maintenance_mode
        });

        setAcademicConfig({
          activeYear: data.active_year || "2026",
          activeTerm: data.active_term || "term1",
          termStartDate: data.term_start_date || "2026-01-05",
          termEndDate: data.term_end_date || "2026-04-10",
          gradingScale: data.grading_scale || academicConfig.gradingScale
        });

        if (data.rbac_permissions) setPermissions(mergePermissions(data.rbac_permissions));
        if (data.geofence_lat !== undefined && data.geofence_lng !== undefined) {
          setGeofenceState({
            lat: data.geofence_lat,
            lng: data.geofence_lng,
            radius: data.geofence_radius || 50
          });
        }
        if (data.geofence_enabled !== undefined) setGeofenceEnabled(!!data.geofence_enabled);
        if (data.dev_bypass !== undefined) setDevBypass(!!data.dev_bypass);
        if (data.session_security) setSessionSecurity(data.session_security);
        if (data.audit_logs) setAuditLogs(data.audit_logs);

      } else {
        const savedMaster = localStorage.getItem(SETTINGS_MASTER_KEY);
        if (savedMaster) {
          const parsed = JSON.parse(savedMaster);
          if (parsed.general) setGeneralConfig(parsed.general);
          if (parsed.academic) setAcademicConfig(parsed.academic);
          if (parsed.permissions) setPermissions(mergePermissions(parsed.permissions));
          if (parsed.geofence) setGeofenceState(parsed.geofence);
          if (parsed.geofenceEnabled !== undefined) setGeofenceEnabled(parsed.geofenceEnabled);
          if (parsed.devBypass !== undefined) setDevBypass(parsed.devBypass);
          if (parsed.sessionSecurity) setSessionSecurity(parsed.sessionSecurity);
          if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
        } else {
          const geoConf = getGeofenceConfig();
          setGeofenceState(geoConf);
        }
      }
    } catch (err) {
      console.warn("Supabase fetch fallback to local state:", err);
    } finally {
      setIsLoadingSettings(false);
      setHasUnsavedChanges(false);
    }
  }, []);

  useEffect(() => {
    fetchSettingsFromDatabase();
  }, [fetchSettingsFromDatabase]);

  /**
   * Handler invoked by the Leaflet-based AdminLocationPicker whenever
   * the school pin or geofence radius changes on the map. Mirrors
   * the change into the parent state so the rest of the screen
   * (coordinate inputs, live distance panel) updates in real time.
   */
  const handleLocationChange = useCallback(
    (lat: number, lng: number, radius: number) => {
      setGeofenceState({ lat, lng, radius });
      setHasUnsavedChanges(true);
    },
    []
  );

  const handleSaveAllSettings = async () => {
    setIsSaving(true);

    const payload = {
      id: SETTINGS_ROW_ID,
      school_name: generalConfig.schoolName,
      motto: generalConfig.motto,
      postal_address: generalConfig.postalAddress,
      phone: generalConfig.phone,
      email: generalConfig.email,
      location: generalConfig.location,
      maintenance_mode: generalConfig.maintenanceMode,
      active_year: academicConfig.activeYear,
      active_term: academicConfig.activeTerm,
      term_start_date: academicConfig.termStartDate,
      term_end_date: academicConfig.termEndDate,
      grading_scale: academicConfig.gradingScale,
      rbac_permissions: permissions,
      geofence_lat: geofenceConfig.lat,
      geofence_lng: geofenceConfig.lng,
      geofence_radius: geofenceConfig.radius,
      geofence_enabled: geofenceEnabled,
      dev_bypass: devBypass,
      session_security: sessionSecurity,
      audit_logs: auditLogs,
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn("Supabase upsert warning:", error.message);
      }

      const masterLocal = {
        general: generalConfig,
        academic: academicConfig,
        permissions,
        geofence: geofenceConfig,
        geofenceEnabled,
        devBypass,
        sessionSecurity,
        auditLogs
      };
      localStorage.setItem(SETTINGS_MASTER_KEY, JSON.stringify(masterLocal));
      // Mirror the change into the canonical geofence key so that
      // isWithinGeofence() / getGeofenceConfig() everywhere else in
      // the app picks it up immediately.
      persistGeofenceConfig(geofenceConfig);

      setHasUnsavedChanges(false);
      showSuccess("System settings saved successfully!");
    } catch (err: any) {
      showError(`Failed to save settings: ${err.message || 'Network error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = async () => {
    showSuccess("Discarded uncommitted changes. Re-fetching committed record...");
    await fetchSettingsFromDatabase();
  };

  const handleUpdateMasterPin = async () => {
    const storedAdminPass = localStorage.getItem('munyaka_admin_pass') || 'munyaka5239';
    
    if (pinForm.currentPin !== storedAdminPass) {
      showError("Current Admin PIN/Password is incorrect.");
      return;
    }

    if (!pinForm.newPin || pinForm.newPin.length < 6) {
      showError("New PIN/Password must be at least 6 characters long.");
      return;
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      showError("New PINs do not match.");
      return;
    }

    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));

    localStorage.setItem('munyaka_admin_pass', pinForm.newPin);

    const newLog = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      admin: "System Admin",
      action: "Admin Master Password / PIN Updated",
      ip: "192.168.1.102 (Chrome/Win)"
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);

    setPinForm({ currentPin: "", newPin: "", confirmPin: "" });
    setIsSaving(false);
    setHasUnsavedChanges(true);
    showSuccess("Administrative Master PIN updated successfully!");
  };

  const togglePermission = (roleId: string, modId: string, action: Action) => {
    setPermissions(prev => {
      const safePrev = prev || buildDefaultPermissions();
      const safeRole = safePrev[roleId] || {};
      const safeModule = safeRole[modId] || { read: true, create: false, edit: false, delete: false };
      return {
        ...safePrev,
        [roleId]: {
          ...safeRole,
          [modId]: {
            ...safeModule,
            [action]: !safeModule[action]
          }
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  const toggleAllForRole = (roleId: string, checked: boolean) => {
    setPermissions(prev => {
      const safePrev = prev || buildDefaultPermissions();
      const updatedRole = { ...(safePrev[roleId] || {}) };
      MODULES.forEach(mod => {
        updatedRole[mod.id] = { read: checked, create: checked, edit: checked, delete: checked };
      });
      return { ...safePrev, [roleId]: updatedRole };
    });
    setHasUnsavedChanges(true);
  };

  const strength = useMemo(() => getPasswordStrength(pinForm.newPin), [pinForm.newPin]);
  const isPinMatching = pinForm.confirmPin.length > 0 && pinForm.newPin === pinForm.confirmPin;

  /**
   * Live distance from the admin's current GPS to the school's
   * configured target. Used in the "Live Distance Check" panel
   * so the admin can immediately see whether the radius they
   * choose will catch their physical location on school grounds.
   */
  const liveDistanceMeters = useMemo(() => {
    if (!currentGeoLoc) return null;
    return calculateDistance(
      currentGeoLoc.lat,
      currentGeoLoc.lng,
      geofenceConfig.lat,
      geofenceConfig.lng
    );
  }, [currentGeoLoc, geofenceConfig.lat, geofenceConfig.lng]);

  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex items-center gap-3 mb-6">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Configuration</h1>
            <p className="text-xs text-slate-500 font-medium">Restricted Administrative Settings</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-2">
          <CardContent className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-rose-100">
                <Lock size={36} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Authorization Required</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Enter your administrative PIN / password to access system configuration, RBAC permissions, and security parameters.
              </p>
            </div>

            <form onSubmit={handleAuthorizeSettings} className="space-y-6">
              {authError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                  <ShieldAlert size={18} className="shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Admin PIN / Password</Label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    type={showAuthPass ? "text" : "password"}
                    value={authPassword}
                    onChange={(e) => {
                      setAuthPassword(e.target.value);
                      if (authError) setAuthError("");
                    }}
                    placeholder="••••••••"
                    className="h-14 pl-12 pr-12 rounded-2xl bg-slate-50 border-none font-bold text-lg focus:bg-white focus:ring-2 ring-indigo-100"
                    autoFocus
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowAuthPass(!showAuthPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showAuthPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isVerifyingAuth || !authPassword.trim()}
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-xl shadow-indigo-100 gap-2 transition-all active:scale-95"
              >
                {isVerifyingAuth ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Verifying Credentials...
                  </>
                ) : (
                  <>
                    <Unlock size={20} />
                    Authorize Access
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Admin Security Notice</p>
              <p className="text-xs text-slate-500 font-medium">Default admin credential: <strong className="text-slate-800">munyaka5239</strong></p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingSettings) {
    return (
      <div className="max-w-7xl mx-auto p-12 flex flex-col items-center justify-center min-h-[600px] space-y-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-500 font-bold text-sm">Executing database fetch for system settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 action-bar">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">System Configuration</h1>
              <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-[10px] px-2.5 py-0.5">
                <ShieldCheck size={12} className="mr-1 inline" /> Unlocked
              </Badge>
            </div>
            <p className="text-muted-foreground">Master console for institutional policy, RBAC roles, and security parameters.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <>
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse font-bold px-3 py-1 text-xs">
                <AlertTriangle size={14} className="mr-1.5" /> Uncommitted Changes
              </Badge>
              <Button 
                variant="outline"
                onClick={handleDiscardChanges}
                disabled={isSaving}
                className="rounded-2xl border-slate-200 text-slate-600 font-bold h-14 px-6 hover:bg-slate-50"
              >
                <RotateCcw size={16} className="mr-2" /> Discard
              </Button>
            </>
          )}
          
          <Button 
            variant="outline"
            onClick={handleLockSettings}
            className="rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 font-bold h-14 px-6 gap-2"
          >
            <Lock size={16} /> Lock Console
          </Button>

          <Button 
            onClick={handleSaveAllSettings} 
            disabled={isSaving} 
            className="rounded-2xl px-8 h-14 font-black shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save All Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(tab) => {
        setActiveTab(tab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url.toString());
      }} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-14 mb-8 flex overflow-x-auto">
          <TabsTrigger value="general" className="rounded-xl px-8 h-full font-bold text-xs">General</TabsTrigger>
          <TabsTrigger value="academic" className="rounded-xl px-8 h-full font-bold text-xs">Academic Setup</TabsTrigger>
          <TabsTrigger value="roles" className="rounded-xl px-8 h-full font-bold text-xs">Users & Roles</TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-8 h-full font-bold text-xs">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b">
              <CardTitle className="text-2xl font-black text-slate-900">Institutional Identity</CardTitle>
              <CardDescription>Primary school details displayed on transcripts, receipts, and public communications.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">School Name</Label>
                  <Input 
                    value={generalConfig.schoolName} 
                    onChange={e => { setGeneralConfig({...generalConfig, schoolName: e.target.value}); setHasUnsavedChanges(true); }}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Motto</Label>
                  <Input 
                    value={generalConfig.motto} 
                    onChange={e => { setGeneralConfig({...generalConfig, motto: e.target.value}); setHasUnsavedChanges(true); }}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Official Email</Label>
                  <Input 
                    value={generalConfig.email} 
                    onChange={e => { setGeneralConfig({...generalConfig, email: e.target.value}); setHasUnsavedChanges(true); }}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Contact Phone</Label>
                  <Input
                    value={generalConfig.phone}
                    onChange={e => { setGeneralConfig({...generalConfig, phone: e.target.value}); setHasUnsavedChanges(true); }}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                  />
                </div>
              </div>

              <div className="pt-6 border-t flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">System Maintenance Mode</p>
                  <p className="text-xs text-slate-500">Temporarily restrict portal access for parents and students during term rollover.</p>
                </div>
                <Switch 
                  checked={generalConfig.maintenanceMode}
                  onCheckedChange={checked => { setGeneralConfig({...generalConfig, maintenanceMode: checked}); setHasUnsavedChanges(true); }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b">
              <CardTitle className="text-2xl font-black text-slate-900">Active Academic Calendar</CardTitle>
              <CardDescription>Configure term dates and national CBC grading thresholds.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Active Academic Year</Label>
                  <Select 
                    value={academicConfig.activeYear} 
                    onValueChange={val => { setAcademicConfig({...academicConfig, activeYear: val}); setHasUnsavedChanges(true); }}
                  >
                    <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Active Term</Label>
                  <Select 
                    value={academicConfig.activeTerm} 
                    onValueChange={val => { setAcademicConfig({...academicConfig, activeTerm: val}); setHasUnsavedChanges(true); }}
                  >
                    <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="term1">Term 1</SelectItem>
                      <SelectItem value="term2">Term 2</SelectItem>
                      <SelectItem value="term3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Term Start Date</Label>
                  <Input 
                    type="date"
                    value={academicConfig.termStartDate}
                    onChange={e => { setAcademicConfig({...academicConfig, termStartDate: e.target.value}); setHasUnsavedChanges(true); }}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
              <UserCog size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">RBAC Permission Matrix</h2>
              <p className="text-sm text-slate-500">Configure module-level access rights for each system role.</p>
            </div>
          </div>

          <div className="space-y-4">
            {ROLES.map((role) => {
              const isOpen = expandedRole === role.id;
              const safePerms = permissions || buildDefaultPermissions();
              const rolePerms = safePerms[role.id] || {};
              const allChecked = MODULES.every(m => rolePerms[m.id]?.read && rolePerms[m.id]?.create && rolePerms[m.id]?.edit && rolePerms[m.id]?.delete);

              return (
                <div key={role.id} className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => setExpandedRole(isOpen ? null : role.id)}
                    className={cn(
                      "w-full px-8 py-6 flex items-center justify-between transition-colors",
                      isOpen ? "bg-indigo-600 text-white" : "bg-white hover:bg-slate-50 text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-xl transition-colors",
                        isOpen ? "bg-white/20" : "bg-indigo-50 text-indigo-600"
                      )}>
                        <Shield size={20} />
                      </div>
                      <span className="text-lg font-bold tracking-tight">{role.label}</span>
                    </div>
                    {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} className="text-slate-400" />}
                  </button>

                  {isOpen && (
                    <div className="p-8 space-y-8 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="text-indigo-600" size={20} />
                          <div>
                            <p className="font-bold text-slate-900">Full Administrative Access</p>
                            <p className="text-xs text-slate-500">Grant all CRUD permissions for this role across every module.</p>
                          </div>
                        </div>
                        <Switch 
                          checked={allChecked} 
                          onCheckedChange={(checked) => toggleAllForRole(role.id, checked)}
                          className="data-[state=checked]:bg-indigo-600"
                        />
                      </div>

                      <div className="overflow-hidden border border-slate-100 rounded-3xl">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr>
                              <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Module & Description</th>
                              <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Read</th>
                              <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Create</th>
                              <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Edit</th>
                              <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Delete</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {MODULES.map((mod) => (
                              <tr key={mod.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-6 py-5">
                                  <p className="font-bold text-slate-900">{mod.title}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{mod.desc}</p>
                                </td>
                                {(['read', 'create', 'edit', 'delete'] as Action[]).map((action) => (
                                  <td key={action} className="px-4 py-5 text-center">
                                    <Checkbox
                                      checked={rolePerms[mod.id]?.[action] || false}
                                      onCheckedChange={() => togglePermission(role.id, mod.id, action)}
                                      className="rounded-md border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                  <Key size={24} />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900">Master Administrative Credentials</CardTitle>
                  <CardDescription>Protects sensitive operations like geofence overrides, grade deletions, and fee structure updates.</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 font-bold px-3 py-1">
                High Privilege Level
              </Badge>
            </CardHeader>

            <CardContent className="px-0 pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Current Admin PIN / Password</Label>
                  <div className="relative">
                    <Input 
                      type={showCurrentPin ? "text" : "password"}
                      value={pinForm.currentPin}
                      onChange={e => setPinForm({...pinForm, currentPin: e.target.value})}
                      placeholder="••••••••"
                      className="rounded-xl h-12 bg-slate-50 border-none font-bold pr-10"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowCurrentPin(!showCurrentPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPin ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">New Admin PIN / Password</Label>
                  <div className="relative">
                    <Input 
                      type={showNewPin ? "text" : "password"}
                      value={pinForm.newPin}
                      onChange={e => setPinForm({...pinForm, newPin: e.target.value})}
                      placeholder="••••••••"
                      className="rounded-xl h-12 bg-slate-50 border-none font-bold pr-10"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNewPin(!showNewPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPin ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {pinForm.newPin && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">Strength Indicator</span>
                        <span className={strength.color.split(' ')[1]}>{strength.label}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${strength.color.split(' ')[0]}`} style={{ width: `${strength.score}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Confirm New PIN / Password</Label>
                  <div className="relative">
                    <Input 
                      type={showConfirmPin ? "text" : "password"}
                      value={pinForm.confirmPin}
                      onChange={e => setPinForm({...pinForm, confirmPin: e.target.value})}
                      placeholder="••••••••"
                      className="rounded-xl h-12 bg-slate-50 border-none font-bold pr-10"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPin ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {pinForm.confirmPin && (
                    <p className={`text-xs font-bold flex items-center gap-1 ${isPinMatching ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isPinMatching ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {isPinMatching ? "PINs match" : "PINs do not match"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleUpdateMasterPin}
                  disabled={isSaving || !pinForm.currentPin || !isPinMatching}
                  className="rounded-xl px-8 h-12 font-bold bg-slate-900 text-white hover:bg-slate-800 gap-2 shadow-lg"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                  Update Master PIN
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <MapPin size={24} />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900">Geofence & Location Security Rules</CardTitle>
                  <CardDescription>Control global GPS parameters for staff daily attendance check-ins.</CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-indigo-50/60 p-3 px-5 rounded-2xl border border-indigo-100">
                <Label htmlFor="geofence-master-toggle" className="text-xs font-black uppercase tracking-widest text-indigo-900 cursor-pointer">
                  Geofence Enforcement
                </Label>
                <Switch 
                  id="geofence-master-toggle"
                  checked={geofenceEnabled}
                  onCheckedChange={checked => { setGeofenceEnabled(checked); setHasUnsavedChanges(true); }}
                />
              </div>
            </CardHeader>

            <CardContent className="px-0 pt-6 space-y-6">
              {/* Admin Location Picker - Leaflet/OpenStreetMap */}
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Admin Location Picker</h3>
                    <p className="text-sm text-slate-500">
                      Click anywhere on the map to drop the school pin, drag the pin to fine-tune, or use your current GPS location. The blue circle shows the active geofence radius.
                    </p>
                  </div>
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 font-bold px-3 py-1">
                    <MapPin size={12} className="mr-1 inline" /> OpenStreetMap — No API Key Required
                  </Badge>
                </div>

                {/* Leaflet-based interactive map */}
                {activeTab === 'security' && (
                  <AdminLocationPicker
                    initialLat={geofenceConfig.lat}
                    initialLng={geofenceConfig.lng}
                    initialRadius={geofenceConfig.radius}
                    geofenceEnabled={geofenceEnabled}
                    onLocationChange={handleLocationChange}
                  />
                )}

                {/* Save & Update Target Location Button */}
                <div className="pt-4 border-t flex justify-end">
                  <Button
                    onClick={handleSaveAllSettings}
                    disabled={isSaving}
                    className="rounded-xl px-8 h-12 font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-100"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Save & Update Target Location
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Development / Localhost Bypass</p>
                    <p className="text-xs text-amber-800">Skip GPS distance enforcement for local software testing and offline demonstrations.</p>
                  </div>
                </div>
                <Switch 
                  checked={devBypass}
                  onCheckedChange={checked => { setDevBypass(checked); setHasUnsavedChanges(true); }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b bg-slate-50/30 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl">
                  <History size={24} />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-slate-900">System Security Audit Trail</CardTitle>
                  <CardDescription>Read-only log of high-privilege configuration and authentication events.</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="border-slate-200 text-slate-600 font-bold">
                Immutable Ledger
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-4 font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                      <th className="px-8 py-4 font-black uppercase tracking-widest text-slate-400">Admin User</th>
                      <th className="px-8 py-4 font-black uppercase tracking-widest text-slate-400">Action Taken</th>
                      <th className="px-8 py-4 font-black uppercase tracking-widest text-slate-400 text-right">IP / Device Origin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log, index) => (
                      <tr key={index} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-8 py-4 font-mono text-slate-500">{log.timestamp}</td>
                        <td className="px-8 py-4 font-bold text-slate-900">{log.admin}</td>
                        <td className="px-8 py-4">
                          <Badge variant="outline" className="rounded-lg border-indigo-100 bg-indigo-50/50 text-indigo-700 font-bold">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-8 py-4 text-right font-mono text-slate-400">{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
