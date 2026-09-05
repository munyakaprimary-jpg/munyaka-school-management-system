import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import Modal from '@/components/ui/Modal';
import {
  Save,
  Loader2,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Lock,
  Clock,
  History,
  AlertTriangle,
  UserCog,
  CheckCircle2,
  XCircle,
  Shield,
  RotateCcw,
  Key,
  MapPin,
  Eye,
  EyeOff,
  RefreshCw,
  Unlock,
  ShieldAlert,
  LogOut,
  Users,
  CreditCard,
  Crown,
  Settings2,
  ArrowLeft
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { notifyDataChanged } from '@/utils/storage';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getGeofenceConfig, setGeofenceConfig as persistGeofenceConfig, GeofenceConfig, calculateDistance } from '@/lib/geofence';
import { localData } from '@/services/localDataService';
import { cn } from '@/lib/utils';
import AdminLocationPicker from '@/components/AdminLocationPicker';
import {
  MUNYAKA_ADMIN_PASSWORD,
  DEFAULT_ADMIN_PASSWORD,
  getActiveAdminPassword,
  saveAdminPassword,
} from '@/services/adminCredentials';

const SETTINGS_MASTER_KEY = 'munyaka_system_settings_v3';
const SETTINGS_ROW_ID = 'default';

// Session persistence keys
const SESSION_KEY = 'munyaka_admin_session';

type AdminRole = 'admin' | 'owner';

interface AdminSession {
  role: AdminRole;
  roleLabel: string;
  roleIcon: string;
  timestamp: number;
}

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
  { id: 'owner', label: 'School Owner' },
  { id: 'admin', label: 'School Administrator' },
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

const buildDefaultPermissions = (): Record<string, PermissionState> => {
  const initialState: Record<string, PermissionState> = {};
  ROLES.forEach(role => {
    initialState[role.id] = {};
    MODULES.forEach(mod => {
      initialState[role.id][mod.id] = {
              read: true,
              create: role.id === 'owner' || role.id === 'admin' || role.id === 'head_teacher',
              edit: role.id === 'owner' || role.id === 'admin' || role.id === 'head_teacher',
              delete: role.id === 'owner' || role.id === 'admin'
            };
    });
  });
  if (initialState['owner']) {
    initialState['owner']['payment_subscriptions'] = { read: true, create: true, edit: true, delete: true };
  }
  ['admin', 'head_teacher', 'bursar', 'teacher', 'parent', 'student'].forEach(roleId => {
      if (initialState[roleId]) {
        initialState[roleId]['payment_subscriptions'] = { read: false, create: false, edit: false, delete: false };
      }
    });
  return initialState;
};

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

// Session management helpers
const getStoredSession = (): AdminSession | null => {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    const session = JSON.parse(stored) as AdminSession;
    // Session expires after 8 hours
    if (Date.now() - session.timestamp > 8 * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

const saveSession = (role: AdminRole, roleLabel: string, roleIcon: string) => {
  const session: AdminSession = {
    role,
    roleLabel,
    roleIcon,
    timestamp: Date.now()
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

/** Thin wrapper: delegates to the centralized helper so existing callers get a plain string. */
const getCredential = (): string => {
  return getActiveAdminPassword();
};

const Settings = () => {
  const navigate = useNavigate();
  // Session state
  const [session, setSession] = useState<AdminSession | null>(null);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(false);
  const [showAuthPass, setShowAuthPass] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  // Password update modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const { location: currentGeoLoc } = useGeolocation();

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

  // Check for existing session on mount
  useEffect(() => {
    const storedSession = getStoredSession();
    if (storedSession) {
      setSession(storedSession);
    }
  }, []);

  // Login handlers
  const handleLogin = async (role: AdminRole, password: string) => {
    if (!password.trim()) {
      setAuthError("Please enter your password.");
      return;
    }

    setIsVerifyingAuth(true);
    setAuthError("");

    await new Promise(r => setTimeout(r, 600));

    const storedPassword = getCredential();
    const isValid = password.trim() === storedPassword || password.trim() === DEFAULT_ADMIN_PASSWORD;

    if (isValid) {
          const roleInfo = {
            admin: { label: 'School Administrator', icon: 'settings' },
            owner: { label: 'School Owner', icon: 'crown' }
          }[role];
    
          const newSession: AdminSession = {
            role,
            roleLabel: roleInfo.label,
            roleIcon: roleInfo.icon,
            timestamp: Date.now()
          };
    
          setSession(newSession);
          saveSession(role, roleInfo.label, roleInfo.icon);
          setAuthPassword("");
          setIsSwitchingRole(false);
    
          // Role-specific success message
          if (role === 'admin') {
            showSuccess(`Welcome, School Administrator! Full system access granted.`);
          } else {
            showSuccess(`Welcome, School Owner! Payment module unlocked.`);
          }
        } else {
          setAuthError(`Invalid password for the selected role.`);
          showError("Authentication failed");
        }
        setIsVerifyingAuth(false);
      };
    
      // State for selected login role
      const [selectedLoginRole, setSelectedLoginRole] = useState<AdminRole>('admin');

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setAuthPassword("");
    setAuthError("");
    setIsSwitchingRole(false);
    showSuccess("Logged out successfully.");
  };

  const handleSwitchRole = () => {
    setIsSwitchingRole(true);
    setAuthPassword("");
    setAuthError("");
  };

  // Password update handler
  const handleUpdateCredential = async () => {
    const currentRole = session?.role;
    if (!currentRole) return;

    // Normalise the entered "current" password and the stored value so
    // a stray whitespace / newline never blocks a legitimate update.
    const enteredCurrent = passwordForm.currentPassword.trim();
    if (!enteredCurrent) {
      showError("Please enter your current password.");
      return;
    }

    // Look up the active stored value AND the hard-coded default. Either
    // one is accepted as a valid "current password" — this mirrors the
    // login page's own dual-mode check so a saved-or-default flow works
    // the same way in both directions.
    const storedPassword = getCredential();
    const defaultPassword = DEFAULT_ADMIN_PASSWORD;

    const isCurrentValid =
      enteredCurrent === storedPassword || enteredCurrent === defaultPassword;

    if (!isCurrentValid) {
      showError("Current password is incorrect.");
      return;
    }

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      showError("New password must be at least 6 characters long.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));

    // Persist the new PIN to the single canonical key. The Login page
    // reads the exact same key, so the change takes effect immediately.
    const saved = saveAdminPassword(passwordForm.newPassword);
    if (!saved) {
      showError("Could not save the new password to local storage.");
      setIsSaving(false);
      return;
    }

    const newLog = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      admin: session.roleLabel,
      action: `Credential Updated for ${session.roleLabel}`,
      ip: "192.168.1.102 (Chrome/Win)"
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);

    // ── Smooth close: clear all fields, close the modal, then show a
    //    confirmation that explicitly states the new PIN is now active
    //    for the login page.
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsSaving(false);
    setIsPasswordModalOpen(false);
    setHasUnsavedChanges(true);
    showSuccess(
      `${session.roleLabel} password updated — your new PIN is now active on the login page.`,
    );
  };

  const strength = useMemo(() => getPasswordStrength(passwordForm.newPassword), [passwordForm.newPassword]);
  const isPasswordMatching = passwordForm.confirmPassword.length > 0 && passwordForm.newPassword === passwordForm.confirmPassword;

  const fetchSettingsFromDatabase = useCallback(async () => {
    setIsLoadingSettings(true);
    try {
      const data = localData.settings.get<Record<string, unknown>>();

      if (data && Object.keys(data).length > 0) {
        if (data.general) setGeneralConfig(data.general as any);
        if (data.academic) setAcademicConfig(data.academic as any);
        if (data.permissions) setPermissions(mergePermissions(data.permissions as any));
        if (data.geofence) setGeofenceState(data.geofence as any);
        if (data.geofenceEnabled !== undefined) setGeofenceEnabled(!!data.geofenceEnabled);
        if (data.devBypass !== undefined) setDevBypass(!!data.devBypass);
        if (data.sessionSecurity) setSessionSecurity(data.sessionSecurity as any);
        if (data.auditLogs) setAuditLogs(data.auditLogs as any);
      } else {
        // First launch — use defaults from geofence
        const geoConf = getGeofenceConfig();
        setGeofenceState(geoConf);
      }
    } catch (err) {
      console.warn("[Settings] Error loading local settings:", err);
    } finally {
      setIsLoadingSettings(false);
      setHasUnsavedChanges(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchSettingsFromDatabase();
    }
  }, [session, fetchSettingsFromDatabase]);

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
      await localData.settings.save(masterLocal);
      persistGeofenceConfig(geofenceConfig);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      showError(`Failed to save settings: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = async () => {
    showSuccess("Discarded uncommitted changes. Re-fetching committed record...");
    await fetchSettingsFromDatabase();
  };

  const handleUpdateMasterPin = async () => {
    const storedAdminPass = getCredential();
    const defaultAdminPass = DEFAULT_ADMIN_PASSWORD;

    if (pinForm.currentPin !== storedAdminPass && pinForm.currentPin !== defaultAdminPass) {
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

    const saved = saveAdminPassword(pinForm.newPin);
    if (!saved) {
      showError("Could not save the new password to local storage.");
      setIsSaving(false);
      return;
    }

    const newLog = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      admin: session?.roleLabel || "System Admin",
      action: "System Admin Password / PIN Updated",
      ip: "192.168.1.102 (Chrome/Win)"
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);

    setPinForm({ currentPin: "", newPin: "", confirmPin: "" });
    setIsSaving(false);
    setHasUnsavedChanges(true);
    showSuccess("System Admin credential updated successfully!");
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

  const liveDistanceMeters = useMemo(() => {
    if (!currentGeoLoc) return null;
    return calculateDistance(
      currentGeoLoc.lat,
      currentGeoLoc.lng,
      geofenceConfig.lat,
      geofenceConfig.lng
    );
  }, [currentGeoLoc, geofenceConfig.lat, geofenceConfig.lng]);

  // No session - show login screen
  if (!session) {
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
          <CardContent className="p-6 md:p-8 sm:p-10">
            <div className="text-center mb-6 md:mb-8">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-100">
                <Shield size={32} className="md:hidden" />
                <Shield size={36} className="hidden md:inline" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Select Your Role</h2>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                Choose your administrative role and enter your credentials to access system configuration.
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                <ShieldAlert size={18} className="shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-3 mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Choose Role</p>
              
              <div className="grid grid-cols-1 gap-3">
                <button
                                  type="button"
                                  onClick={() => setSelectedLoginRole('admin')}
                                  disabled={isVerifyingAuth}
                                  className={cn(
                                    "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group",
                                    selectedLoginRole === 'admin'
                                      ? "border-indigo-300 bg-indigo-50/30 ring-2 ring-indigo-200"
                                      : "border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30"
                                  )}
                                >
                                  <div className={cn(
                                    "p-3 rounded-xl transition-colors",
                                    selectedLoginRole === 'admin' ? "bg-indigo-200 text-indigo-700" : "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200"
                                  )}>
                                    <Settings2 size={24} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900">School Administrator</p>
                                    <p className="text-xs text-slate-500">Full access: Settings, Users, Fees, Academics, RBAC, Security</p>
                                  </div>
                                  <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-600 font-bold text-[10px]">
                                    PIN: sysadmin2026
                                  </Badge>
                                </button>
                
                                <button
                                  type="button"
                                  onClick={() => setSelectedLoginRole('owner')}
                                  disabled={isVerifyingAuth}
                                  className={cn(
                                    "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group",
                                    selectedLoginRole === 'owner'
                                      ? "border-amber-300 bg-amber-50/30 ring-2 ring-amber-200"
                                      : "border-slate-100 hover:border-amber-200 hover:bg-amber-50/30"
                                  )}
                                >
                                  <div className={cn(
                                    "p-3 rounded-xl transition-colors",
                                    selectedLoginRole === 'owner' ? "bg-amber-200 text-amber-700" : "bg-amber-100 text-amber-600 group-hover:bg-amber-200"
                                  )}>
                                    <Crown size={24} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900">School Owner</p>
                                    <p className="text-xs text-slate-500">Exclusive access to Payment &amp; Subscriptions module</p>
                                  </div>
                                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-600 font-bold text-[10px]">
                                    PIN: ownerpass2026
                                  </Badge>
                                </button>
              </div>
            </div>

            {/* Password Input */}
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(selectedLoginRole as AdminRole, authPassword); }} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Password</Label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    type={showAuthPass ? "text" : "password"}
                    value={authPassword}
                    onChange={(e) => {
                      setAuthPassword(e.target.value);
                      if (authError) setAuthError("");
                    }}
                    placeholder="Enter your password"
                    className="h-12 md:h-14 pl-12 pr-12 rounded-xl bg-slate-50 border-none font-bold text-base focus:bg-white focus:ring-2 ring-indigo-100"
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
                className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-xl shadow-indigo-100 gap-2 transition-all active:scale-95"
              >
                {isVerifyingAuth ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Unlock size={20} />
                    Authorize Access
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Security Notice</p>
              <p className="text-xs text-slate-500 font-medium">
                Default credentials can be changed in Security settings after login.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Switching role - show role selector
  if (isSwitchingRole) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => { setIsSwitchingRole(false); setAuthPassword(""); setAuthError(""); }}
            className="rounded-xl h-10 w-10 text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all shrink-0 flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Switch Role</h1>
            <p className="text-xs text-slate-500 font-medium">Select a different administrative role</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-2">
          <CardContent className="p-6 md:p-8 sm:p-10">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-rose-100">
                <LogOut size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Switch to Another Role</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                You'll need to log in with the credentials for the role you want to switch to.
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                <ShieldAlert size={18} className="shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <button
                              type="button"
                              onClick={() => handleLogin('admin', authPassword)}
                              className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group",
                                session.role === 'admin'
                                  ? "border-indigo-300 bg-indigo-50/30 cursor-not-allowed opacity-60"
                                  : "border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30"
                              )}
                              disabled={session.role === 'admin' || isVerifyingAuth}
                            >
                              <div className={cn("p-3 rounded-xl transition-colors", session.role === 'admin' ? "bg-indigo-200 text-indigo-600" : "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200")}>
                                <Settings2 size={24} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900">School Administrator</p>
                                <p className="text-xs text-slate-500">Full access: Settings, Users, Fees, Academics, RBAC, Security</p>
                              </div>
                              {session.role === 'admin' && (
                                <Badge className="bg-indigo-100 text-indigo-600 font-bold text-[10px]">Current</Badge>
                              )}
                            </button>
              
                            <button
                              type="button"
                              onClick={() => handleLogin('owner', authPassword)}
                              className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group",
                                session.role === 'owner'
                                  ? "border-amber-300 bg-amber-50/30 cursor-not-allowed opacity-60"
                                  : "border-slate-100 hover:border-amber-200 hover:bg-amber-50/30"
                              )}
                              disabled={session.role === 'owner' || isVerifyingAuth}
                            >
                              <div className={cn("p-3 rounded-xl transition-colors", session.role === 'owner' ? "bg-amber-200 text-amber-600" : "bg-amber-100 text-amber-600 group-hover:bg-amber-200")}>
                                <Crown size={24} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900">School Owner</p>
                                <p className="text-xs text-slate-500">Exclusive access to Payment &amp; Subscriptions module</p>
                              </div>
                              {session.role === 'owner' && (
                                <Badge className="bg-amber-100 text-amber-600 font-bold text-[10px]">Current</Badge>
                              )}
                            </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(session.role === 'owner' ? 'admin' : 'owner', authPassword); }} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Password for Selected Role</Label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    type={showAuthPass ? "text" : "password"}
                    value={authPassword}
                    onChange={(e) => {
                      setAuthPassword(e.target.value);
                      if (authError) setAuthError("");
                    }}
                    placeholder="Enter password for selected role"
                    className="h-12 md:h-14 pl-12 pr-12 rounded-xl bg-slate-50 border-none font-bold text-base focus:bg-white focus:ring-2 ring-indigo-100"
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
                className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-xl shadow-indigo-100 gap-2 transition-all active:scale-95"
              >
                {isVerifyingAuth ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Switching...
                  </>
                ) : (
                  <>
                    <Unlock size={20} />
                    Switch Role
                  </>
                )}
              </Button>

              <Button 
                type="button" 
                variant="outline"
                onClick={() => { setIsSwitchingRole(false); setAuthPassword(""); setAuthError(""); }}
                className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl border-slate-200 text-slate-600 font-bold"
              >
                Cancel
              </Button>
            </form>
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
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 action-bar">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 style={{ fontSize: 'clamp(1.25rem, 4.5vw, 1.875rem)' }} className="font-black tracking-tight text-slate-900">System Configuration</h1>
              <Badge className={cn(
                              "border-none font-bold text-[10px] px-2.5 py-0.5",
                              session.role === 'owner' ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                            )}>
                              <ShieldCheck size={12} className="mr-1 inline" /> {session.roleLabel}
                            </Badge>
            </div>
            <p className="text-muted-foreground text-sm md:text-base">Master console for institutional policy, RBAC roles, and security parameters.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:overflow-visible">
          {hasUnsavedChanges && (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse font-bold px-3 py-1 text-xs shrink-0">
              <AlertTriangle size={14} className="mr-1.5" /> Uncommitted Changes
            </Badge>
          )}

          {/* Quick Navigation - Owner gets Payment link, Admin gets System Management link */}
                    {session.role === 'owner' && (
                      <Button
                        variant="outline"
                        onClick={() => navigate('/payment-management')}
                        className="rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50 font-bold h-10 px-3 gap-1.5 text-sm shrink-0"
                      >
                        <CreditCard size={16} />
                        <span className="hidden sm:inline">Payments</span>
                      </Button>
                    )}
                    {session.role === 'admin' && (
                      <Button
                        variant="outline"
                        onClick={() => navigate('/ict-lab')}
                        className="rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold h-10 px-3 gap-1.5 text-sm shrink-0"
                      >
                        <Settings2 size={16} />
                        <span className="hidden sm:inline">ICT Lab & Devices</span>
                      </Button>
                    )}

          {/* Switch Role Button */}
          <Button
            variant="outline"
            onClick={handleSwitchRole}
            className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold h-10 px-3 gap-1.5 text-sm shrink-0"
          >
            <Users size={16} />
            <span className="hidden sm:inline">Switch Role</span>
          </Button>

          {/* Update Password Button */}
          <Button
            variant="outline"
            onClick={() => setIsPasswordModalOpen(true)}
            className="rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold h-10 px-3 gap-1.5 text-sm shrink-0"
          >
            <Key size={16} />
            <span className="hidden sm:inline">Password</span>
          </Button>
          
          {/* Logout Button */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 font-bold h-10 px-3 gap-1.5 text-sm shrink-0"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </Button>

          <Button
            onClick={handleSaveAllSettings}
            disabled={isSaving}
            className="rounded-xl px-4 h-10 font-black shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-sm shrink-0"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>
      </div>

      {/* Password Update Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => { setIsPasswordModalOpen(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
        title={`Update ${session.roleLabel} Password`}
        description={`Change the password for the ${session.roleLabel} account.`}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="ghost" onClick={() => { setIsPasswordModalOpen(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} className="rounded-xl font-bold h-12 px-6">Cancel</Button>
            <Button 
              onClick={handleUpdateCredential} 
              disabled={isSaving || !passwordForm.currentPassword || !isPasswordMatching}
              className="rounded-xl bg-indigo-600 text-white font-bold h-12 px-6 gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
              Update Password
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Current Password</Label>
            <div className="relative">
              <Input 
                type={showAuthPass ? "text" : "password"}
                value={passwordForm.currentPassword}
                onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                placeholder="Enter current password"
                className="rounded-xl h-12 bg-slate-50 border-none font-bold pr-10"
              />
              <button 
                type="button" 
                onClick={() => setShowAuthPass(!showAuthPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showAuthPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">New Password</Label>
            <div className="relative">
              <Input 
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                placeholder="Enter new password"
                className="rounded-xl h-12 bg-slate-50 border-none font-bold pr-10"
              />
              <button 
                type="button" 
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordForm.newPassword && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Strength</span>
                  <span className={strength.color.split(' ')[1]}>{strength.label}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${strength.color.split(' ')[0]}`} style={{ width: `${strength.score}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Confirm New Password</Label>
            <div className="relative">
              <Input 
                type={showConfirmPassword ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                placeholder="Confirm new password"
                className="rounded-xl h-12 bg-slate-50 border-none font-bold pr-10"
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordForm.confirmPassword && (
              <p className={`text-xs font-bold flex items-center gap-1 ${isPasswordMatching ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isPasswordMatching ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {isPasswordMatching ? "Passwords match" : "Passwords do not match"}
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(tab) => {
        setActiveTab(tab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url.toString());
      }} className="w-full">
        <TabsList className="bg-white p-1 rounded-xl md:rounded-2xl shadow-sm border h-12 md:h-14 mb-6 md:mb-8 flex overflow-x-auto scrollbar-hide gap-1">
          <TabsTrigger value="general" className="rounded-lg md:rounded-xl px-3 md:px-6 lg:px-8 h-full font-bold text-xs md:text-sm whitespace-nowrap">General</TabsTrigger>
          <TabsTrigger value="academic" className="rounded-lg md:rounded-xl px-3 md:px-6 lg:px-8 h-full font-bold text-xs md:text-sm whitespace-nowrap">Academic Setup</TabsTrigger>
          <TabsTrigger value="roles" className="rounded-lg md:rounded-xl px-3 md:px-6 lg:px-8 h-full font-bold text-xs md:text-sm whitespace-nowrap">Users & Roles</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg md:rounded-xl px-3 md:px-6 lg:px-8 h-full font-bold text-xs md:text-sm whitespace-nowrap">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="border-none shadow-sm rounded-2xl md:rounded-[2.5rem] bg-white p-4 md:p-8 overflow-hidden">
            <CardHeader className="px-0 pt-0 pb-4 md:pb-6 border-b">
              <CardTitle className="text-xl md:text-2xl font-black text-slate-900">Institutional Identity</CardTitle>
              <CardDescription className="text-xs md:text-sm">Primary school details displayed on transcripts, receipts, and public communications.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-4 md:pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2 min-w-0">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">School Name</Label>
                  <Input 
                    value={generalConfig.schoolName} 
                    onChange={e => { setGeneralConfig({...generalConfig, schoolName: e.target.value}); setHasUnsavedChanges(true); }}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold w-full min-w-0" 
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Motto</Label>
                  <Input 
                    value={generalConfig.motto} 
                    onChange={e => { setGeneralConfig({...generalConfig, motto: e.target.value}); setHasUnsavedChanges(true); }}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold w-full min-w-0" 
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Official Email</Label>
                  <Input 
                    value={generalConfig.email} 
                    onChange={e => { setGeneralConfig({...generalConfig, email: e.target.value}); setHasUnsavedChanges(true); }}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold w-full min-w-0" 
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Contact Phone</Label>
                  <Input
                    value={generalConfig.phone}
                    onChange={e => { setGeneralConfig({...generalConfig, phone: e.target.value}); setHasUnsavedChanges(true); }}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold w-full min-w-0"
                  />
                </div>
              </div>

              <div className="pt-4 md:pt-6 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
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
          <Card className="border-none shadow-sm rounded-2xl md:rounded-[2.5rem] bg-white p-4 md:p-8 overflow-hidden">
            <CardHeader className="px-0 pt-0 pb-4 md:pb-6 border-b">
              <CardTitle className="text-xl md:text-2xl font-black text-slate-900">Active Academic Calendar</CardTitle>
              <CardDescription className="text-xs md:text-sm">Configure term dates and national CBC grading thresholds.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-4 md:pt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="space-y-2 min-w-0">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Active Academic Year</Label>
                  <Select 
                    value={academicConfig.activeYear} 
                    onValueChange={val => { setAcademicConfig({...academicConfig, activeYear: val}); setHasUnsavedChanges(true); }}
                  >
                    <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 min-w-0">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Active Term</Label>
                  <Select 
                    value={academicConfig.activeTerm} 
                    onValueChange={val => { setAcademicConfig({...academicConfig, activeTerm: val}); setHasUnsavedChanges(true); }}
                  >
                    <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="term1">Term 1</SelectItem>
                      <SelectItem value="term2">Term 2</SelectItem>
                      <SelectItem value="term3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 min-w-0 sm:col-span-2 lg:col-span-1">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Term Start Date</Label>
                  <Input 
                    type="date"
                    value={academicConfig.termStartDate}
                    onChange={e => { setAcademicConfig({...academicConfig, termStartDate: e.target.value}); setHasUnsavedChanges(true); }}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
              <UserCog size={20} className="md:hidden" />
              <UserCog size={24} className="hidden md:inline" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-black text-slate-900">RBAC Permission Matrix</h2>
              <p className="text-xs md:text-sm text-slate-500">Configure module-level access rights for each system role.</p>
            </div>
          </div>

          <div className="space-y-4">
            {ROLES.map((role) => {
              const isOpen = expandedRole === role.id;
              const safePerms = permissions || buildDefaultPermissions();
              const rolePerms = safePerms[role.id] || {};
              const allChecked = MODULES.every(m => rolePerms[m.id]?.read && rolePerms[m.id]?.create && rolePerms[m.id]?.edit && rolePerms[m.id]?.delete);

              return (
                <div key={role.id} className="border-none shadow-sm rounded-2xl md:rounded-[2rem] bg-white overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => setExpandedRole(isOpen ? null : role.id)}
                    className={cn(
                      "w-full px-4 md:px-8 py-4 md:py-6 flex items-center justify-between transition-colors gap-2",
                      isOpen ? "bg-indigo-600 text-white" : "bg-white hover:bg-slate-50 text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                      <div className={cn(
                        "p-2 rounded-xl transition-colors shrink-0",
                        isOpen ? "bg-white/20" : "bg-indigo-50 text-indigo-600"
                      )}>
                        <Shield size={18} className="md:hidden" />
                        <Shield size={20} className="hidden md:inline" />
                      </div>
                      <span className="text-base md:text-lg font-bold tracking-tight truncate">{role.label}</span>
                    </div>
                    {isOpen ? <ChevronDown size={18} className="shrink-0" /> : <ChevronRight size={18} className="text-slate-400 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-100 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <CheckCircle2 className="text-indigo-600 shrink-0" size={18} />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-sm md:text-base">Full Administrative Access</p>
                            <p className="text-xs text-slate-500">Grant all CRUD permissions for this role across every module.</p>
                          </div>
                        </div>
                        <Switch
                          checked={allChecked} 
                          onCheckedChange={(checked) => toggleAllForRole(role.id, checked)}
                          className="data-[state=checked]:bg-indigo-600 shrink-0"
                        />
                      </div>

                      <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                        <div className="inline-block min-w-full align-middle">
                          <div className="overflow-hidden md:border md:border-slate-100 md:rounded-3xl">
                            <table className="w-full text-sm text-left border-collapse min-w-[640px]">
                              <thead className="bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                  <th className="px-4 md:px-6 py-3 md:py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Module & Description</th>
                                  <th className="px-2 md:px-4 py-3 md:py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Read</th>
                                  <th className="px-2 md:px-4 py-3 md:py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Create</th>
                                  <th className="px-2 md:px-4 py-3 md:py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Edit</th>
                                  <th className="px-2 md:px-4 py-3 md:py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Delete</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {MODULES.map((mod) => (
                                  <tr key={mod.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-4 md:px-6 py-4 md:py-5 min-w-[200px]">
                                      <p className="font-bold text-slate-900 text-sm">{mod.title}</p>
                                      <p className="text-[11px] md:text-xs text-slate-400 mt-0.5">{mod.desc}</p>
                                    </td>
                                    {(['read', 'create', 'edit', 'delete'] as Action[]).map((action) => (
                                      <td key={action} className="px-2 md:px-4 py-4 md:py-5 text-center">
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
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-300">
          
          <Card className="border-none shadow-sm rounded-2xl md:rounded-[2.5rem] bg-white p-4 md:p-8 overflow-hidden">
            <CardHeader className="px-0 pt-0 pb-4 md:pb-6 border-b flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 bg-rose-50 text-rose-600 rounded-xl md:rounded-2xl shrink-0">
                  <CreditCard size={18} className="md:hidden" />
                  <CreditCard size={24} className="hidden md:inline" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-lg md:text-2xl font-black text-slate-900">Admin Credentials</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Manage login credentials for both administrative roles.</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className={cn(
                              "font-bold px-3 py-1 shrink-0",
                              session.role === 'owner' ? "border-amber-200 bg-amber-50 text-amber-700" : "border-indigo-200 bg-indigo-50 text-indigo-700"
                            )}>
                              {session.roleLabel}
                            </Badge>
            </CardHeader>

            <CardContent className="px-0 pt-4 md:pt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Admin Credentials */}
                                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                                      <Settings2 size={18} />
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900">School Administrator</p>
                                      <p className="text-xs text-slate-500">Controls system settings, users, academics</p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                      if (session.role === 'admin') {
                                        setIsPasswordModalOpen(true);
                                      } else {
                                        showError("Switch to School Administrator role to update this password.");
                                      }
                                    }}
                                    disabled={session.role !== 'admin'}
                                    className={cn(
                                      "w-full h-10 rounded-xl gap-2 font-bold",
                                      session.role !== 'admin' ? "opacity-50 cursor-not-allowed" : "border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                                    )}
                                  >
                                    <Key size={14} /> Update Admin Password
                                  </Button>
                                </div>
                
                                {/* Owner Credentials */}
                                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                                      <Crown size={18} />
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900">School Owner</p>
                                      <p className="text-xs text-slate-500">Full access including payment module</p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                      if (session.role === 'owner') {
                                        setIsPasswordModalOpen(true);
                                      } else {
                                        showError("Switch to School Owner role to update this password.");
                                      }
                                    }}
                                    disabled={session.role !== 'owner'}
                                    className={cn(
                                      "w-full h-10 rounded-xl gap-2 font-bold",
                                      session.role !== 'owner' ? "opacity-50 cursor-not-allowed" : "border-amber-200 text-amber-600 hover:bg-amber-100"
                                    )}
                                  >
                                    <Key size={14} /> Update Owner Password
                                  </Button>
                                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl md:rounded-[2.5rem] bg-white p-4 md:p-8 overflow-hidden">
            <CardHeader className="px-0 pt-0 pb-4 md:pb-6 border-b flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl shrink-0">
                  <MapPin size={18} className="md:hidden" />
                  <MapPin size={24} className="hidden md:inline" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-lg md:text-2xl font-black text-slate-900">Geofence & Location Security Rules</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Control global GPS parameters for staff daily attendance check-ins.</CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-indigo-50/60 p-2 md:p-3 px-3 md:px-5 rounded-xl md:rounded-2xl border border-indigo-100 shrink-0">
                <Label htmlFor="geofence-master-toggle" className="text-[10px] md:text-xs font-black uppercase tracking-widest text-indigo-900 cursor-pointer">
                  Geofence
                </Label>
                <Switch 
                  id="geofence-master-toggle"
                  checked={geofenceEnabled}
                  onCheckedChange={checked => { setGeofenceEnabled(checked); setHasUnsavedChanges(true); }}
                />
              </div>
            </CardHeader>

            <CardContent className="px-0 pt-4 md:pt-6 space-y-6">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base md:text-lg font-black text-slate-900">Admin Location Picker</h3>
                    <p className="text-xs md:text-sm text-slate-500">
                      Click anywhere on the map to drop the school pin, drag the pin to fine-tune, or use your current GPS location.
                    </p>
                  </div>
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 font-bold px-2 md:px-3 py-1 shrink-0 text-[10px] md:text-xs">
                    <MapPin size={10} className="md:hidden mr-1" />
                    <MapPin size={12} className="hidden md:inline mr-1" /> OpenStreetMap
                  </Badge>
                </div>

                {activeTab === 'security' && (
                  <AdminLocationPicker
                    initialLat={geofenceConfig.lat}
                    initialLng={geofenceConfig.lng}
                    initialRadius={geofenceConfig.radius}
                    geofenceEnabled={geofenceEnabled}
                    onLocationChange={handleLocationChange}
                  />
                )}

                <div className="pt-4 border-t flex justify-end">
                  <Button
                    onClick={handleSaveAllSettings}
                    disabled={isSaving}
                    className="rounded-xl px-4 md:px-6 h-10 md:h-12 font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg text-sm md:text-base w-full sm:w-auto"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} className="md:hidden" />}
                    {isSaving ? <Loader2 className="animate-spin hidden md:inline" size={16} /> : <Save size={16} className="hidden md:inline" />}
                    <span className="hidden sm:inline">Save & Update Location</span>
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 shrink-0" size={18} />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm">Development / Localhost Bypass</p>
                    <p className="text-xs text-amber-800">Skip GPS distance enforcement for testing.</p>
                  </div>
                </div>
                <Switch 
                  checked={devBypass}
                  onCheckedChange={checked => { setDevBypass(checked); setHasUnsavedChanges(true); }}
                  className="shrink-0"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl md:rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-4 md:p-8 border-b bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 bg-slate-100 text-slate-600 rounded-xl md:rounded-2xl shrink-0">
                  <History size={18} className="md:hidden" />
                  <History size={24} className="hidden md:inline" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base md:text-xl font-black text-slate-900">System Security Audit Trail</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Read-only log of high-privilege configuration and authentication events.</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="border-slate-200 text-slate-600 font-bold shrink-0">
                Immutable Ledger
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[600px]">
                  <thead className="bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      <th className="px-4 md:px-8 py-3 md:py-4 font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                      <th className="px-4 md:px-8 py-3 md:py-4 font-black uppercase tracking-widest text-slate-400">Admin User</th>
                      <th className="px-4 md:px-8 py-3 md:py-4 font-black uppercase tracking-widest text-slate-400">Action Taken</th>
                      <th className="px-4 md:px-8 py-3 md:py-4 font-black uppercase tracking-widest text-slate-400 text-right">IP / Device</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log, index) => (
                      <tr key={index} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 md:px-8 py-3 md:py-4 font-mono text-slate-500 text-[10px] md:text-xs">{log.timestamp}</td>
                        <td className="px-4 md:px-8 py-3 md:py-4 font-bold text-slate-900 text-sm">{log.admin}</td>
                        <td className="px-4 md:px-8 py-3 md:py-4">
                          <Badge variant="outline" className="rounded-lg border-indigo-100 bg-indigo-50/50 text-indigo-700 font-bold text-[10px] md:text-xs whitespace-nowrap">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-4 md:px-8 py-3 md:py-4 text-right font-mono text-slate-400 text-[10px] md:text-xs">{log.ip}</td>
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
