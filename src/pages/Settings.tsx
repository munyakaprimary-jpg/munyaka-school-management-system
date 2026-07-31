"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getGeofenceConfig, setGeofenceConfig, GeofenceConfig } from '@/lib/geofence';
import { cn } from '@/lib/utils';

// Persistent Storage Keys
const SETTINGS_MASTER_KEY = 'munyaka_system_settings_v3';

// Permission Types
type Action = 'read' | 'create' | 'edit' | 'delete';
type PermissionState = Record<string, Record<Action, boolean>>;

const MODULES = [
  { id: 'sys_config', title: 'System Configuration & Security', desc: 'RBAC, Audit Logs, System Backups' },
  { id: 'academic_grading', title: 'Academic & CBC Grading Setup', desc: 'Assessments, Report Cards, Grade Bounds' },
  { id: 'student_records', title: 'Student & Guardian Records', desc: 'Enrollment, Bio Data, Attendance' },
  { id: 'finance_fees', title: 'Fee Management & Finance', desc: 'Billing, Invoices, Payment Collections' },
  { id: 'staff_mgmt', title: 'Staff Management & Geofence', desc: 'Staff Profiles, Compound GPS Tracking' }
];

const ROLES = [
  { id: 'super_admin', label: 'System Administrator' },
  { id: 'head_teacher', label: 'Principal / Head' },
  { id: 'bursar', label: 'Bursar / Accountant' },
  { id: 'teacher', label: 'Class Teacher' },
  { id: 'parent', label: 'Parent / Guardian' },
  { id: 'student', label: 'Learner' }
];

const DEFAULT_AUDIT_LOGS = [
  { timestamp: "2026-03-31 09:14:02", admin: "System Admin", action: "Geofence Radius Updated (150m)", ip: "192.168.1.102 (Chrome/Win)" },
  { timestamp: "2026-03-30 16:45:11", admin: "System Admin", action: "Credentials Reset for J. Mwangi", ip: "192.168.1.102 (Chrome/Win)" },
  { timestamp: "2026-03-28 11:20:30", admin: "Head Teacher", action: "Grade Bounds Modified (Grade 4)", ip: "192.168.1.108 (Safari/Mac)" },
  { timestamp: "2026-03-25 08:30:15", admin: "System Admin", action: "Idle Session Timeout set to 30m", ip: "192.168.1.102 (Chrome/Win)" }
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

const Settings = () => {
  const { location: currentGeoLoc, isLoading: isLocating, error: geoError } = useGeolocation();

  // Loading & Hydration State
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState('roles');

  // --- 1. General Config State ---
  const [generalConfig, setGeneralConfig] = useState({
    schoolName: "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
    motto: "KNOWLEDGE IS POWER",
    postalAddress: "P.O. BOX 5239-30100 ELDORET",
    phone: "+254 712 345 678",
    email: "info@munyaka.sc.ke",
    location: "Munyaka, Eldoret East, Uasin Gishu County",
    maintenanceMode: false
  });

  // --- 2. Academic Config State ---
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

  // --- 3. Roles & Permissions State ---
  const [expandedRole, setExpandedRole] = useState<string | null>('super_admin');
  const [permissions, setPermissions] = useState<Record<string, PermissionState>>(() => {
    const initialState: Record<string, PermissionState> = {};
    ROLES.forEach(role => {
      initialState[role.id] = {};
      MODULES.forEach(mod => {
        initialState[role.id][mod.id] = {
          read: true,
          create: role.id === 'super_admin' || role.id === 'head_teacher',
          edit: role.id === 'super_admin' || role.id === 'head_teacher',
          delete: role.id === 'super_admin'
        };
      });
    });
    return initialState;
  });

  // --- 4. Security Tab State ---
  // Master PIN/Password
  const [pinForm, setPinForm] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: ""
  });
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // Geofence & Location Security Rules
  const [geofenceConfig, setGeofenceState] = useState<GeofenceConfig>({
    lat: 0.5304,
    lng: 35.3077,
    radius: 150
  });
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const [devBypass, setDevBypass] = useState(false);

  // Session & Access Security
  const [sessionSecurity, setSessionSecurity] = useState({
    idleTimeout: "30m",
    requirePasswordOnFirstLogin: true
  });

  // Security Audit Logs
  const [auditLogs, setAuditLogs] = useState(DEFAULT_AUDIT_LOGS);

  // --- HYDRATION ON MOUNT ---
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoadingSettings(true);
      await new Promise(r => setTimeout(r, 400)); // Smooth UX delay

      const savedMaster = localStorage.getItem(SETTINGS_MASTER_KEY);
      if (savedMaster) {
        try {
          const parsed = JSON.parse(savedMaster);
          if (parsed.general) setGeneralConfig(parsed.general);
          if (parsed.academic) setAcademicConfig(parsed.academic);
          if (parsed.permissions) setPermissions(parsed.permissions);
          if (parsed.geofence) setGeofenceState(parsed.geofence);
          if (parsed.geofenceEnabled !== undefined) setGeofenceEnabled(parsed.geofenceEnabled);
          if (parsed.devBypass !== undefined) setDevBypass(parsed.devBypass);
          if (parsed.sessionSecurity) setSessionSecurity(parsed.sessionSecurity);
          if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
        } catch (e) {
          console.error("Failed to parse saved system configuration:", e);
        }
      } else {
        // Hydrate geofence from local geofence utility if master key doesn't exist
        const geoConf = getGeofenceConfig();
        setGeofenceState(geoConf);
      }

      setIsLoadingSettings(false);
      setHasUnsavedChanges(false);
    };

    loadSettings();
  }, []);

  // --- SAVE ALL SETTINGS FUNCTION ---
  const handleSaveAllSettings = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));

    // Prepare master payload
    const masterData = {
      general: generalConfig,
      academic: academicConfig,
      permissions,
      geofence: geofenceConfig,
      geofenceEnabled,
      devBypass,
      sessionSecurity,
      auditLogs
    };

    // Save to localStorage master key
    localStorage.setItem(SETTINGS_MASTER_KEY, JSON.stringify(masterData));

    // Also sync app-wide geofence utility so staff attendance uses exact coordinates
    setGeofenceConfig(geofenceConfig);

    setIsSaving(false);
    setHasUnsavedChanges(false);
    showSuccess("System configuration and security parameters saved successfully!");
  };

  // --- HANDLERS FOR SECURITY TAB ---
  const handleUseCurrentLocation = () => {
    if (currentGeoLoc) {
      setGeofenceState(prev => ({
        ...prev,
        lat: parseFloat(currentGeoLoc.lat.toFixed(6)),
        lng: parseFloat(currentGeoLoc.lng.toFixed(6))
      }));
      setHasUnsavedChanges(true);
      showSuccess(`Auto-filled coordinates: ${currentGeoLoc.lat.toFixed(4)}, ${currentGeoLoc.lng.toFixed(4)}`);
    } else if (geoError) {
      showError(`Geolocation Error: ${geoError}`);
    } else {
      showError("Acquiring GPS signal. Please allow location permissions in your browser.");
    }
  };

  const handleUpdateMasterPin = async () => {
    const storedAdminPass = localStorage.getItem('munyaka_admin_pass') || 'admin123';
    
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

    // Append to Audit Logs
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
    showSuccess("Administrative Master PIN updated successfully!");
  };

  // Permissions helpers
  const togglePermission = (roleId: string, modId: string, action: Action) => {
    setPermissions(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [modId]: {
          ...prev[roleId][modId],
          [action]: !prev[roleId][modId][action]
        }
      }
    }));
    setHasUnsavedChanges(true);
  };

  const toggleAllForRole = (roleId: string, checked: boolean) => {
    setPermissions(prev => {
      const updatedRole = { ...prev[roleId] };
      MODULES.forEach(mod => {
        updatedRole[mod.id] = { read: checked, create: checked, edit: checked, delete: checked };
      });
      return { ...prev, [roleId]: updatedRole };
    });
    setHasUnsavedChanges(true);
  };

  const strength = useMemo(() => getPasswordStrength(pinForm.newPin), [pinForm.newPin]);
  const isPinMatching = pinForm.confirmPin.length > 0 && pinForm.newPin === pinForm.confirmPin;
  const isPinMismatch = pinForm.confirmPin.length > 0 && pinForm.newPin !== pinForm.confirmPin;

  if (isLoadingSettings) {
    return (
      <div className="max-w-7xl mx-auto p-12 flex flex-col items-center justify-center min-h-[600px] space-y-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-500 font-bold text-sm">Hydrating system configuration and security parameters...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">System Configuration</h1>
            <p className="text-muted-foreground">Master console for institutional policy, RBAC roles, and security parameters.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse font-bold px-3 py-1 text-xs">
              <AlertTriangle size={14} className="mr-1.5" /> Pending Unsaved Changes
            </Badge>
          )}
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

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-14 mb-8 flex overflow-x-auto">
          <TabsTrigger value="general" className="rounded-xl px-8 h-full font-bold text-xs">General</TabsTrigger>
          <TabsTrigger value="academic" className="rounded-xl px-8 h-full font-bold text-xs">Academic Setup</TabsTrigger>
          <TabsTrigger value="roles" className="rounded-xl px-8 h-full font-bold text-xs">Users & Roles</TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-8 h-full font-bold text-xs">Security</TabsTrigger>
        </TabsList>

        {/* ==================== TAB 1: GENERAL CONFIGURATION ==================== */}
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

        {/* ==================== TAB 2: ACADEMIC SETUP ==================== */}
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

        {/* ==================== TAB 3: USERS & ROLES ==================== */}
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
              const rolePerms = permissions[role.id] || {};
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

        {/* ==================== TAB 4: SECURITY & SYSTEM PARAMETERS ==================== */}
        <TabsContent value="security" className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          
          {/* SECTION 1: Administrative Master Password / PIN Settings */}
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
                
                {/* Current PIN */}
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

                {/* New PIN & Strength Meter */}
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

                  {/* Password Strength Meter */}
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

                {/* Confirm PIN & Matching Indicator */}
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

                  {/* Validation Matching Text */}
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

          {/* SECTION 2: Geofence & Location Security Rules */}
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

              {/* Master Geofence Toggle */}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Latitude Input */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Target School Latitude</Label>
                  <Input 
                    type="number"
                    step="0.000001"
                    value={geofenceConfig.lat}
                    onChange={e => {
                      setGeofenceState({...geofenceConfig, lat: parseFloat(e.target.value) || 0});
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="e.g. 0.5304"
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                  />
                </div>

                {/* Longitude Input */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Target School Longitude</Label>
                  <Input 
                    type="number"
                    step="0.000001"
                    value={geofenceConfig.lng}
                    onChange={e => {
                      setGeofenceState({...geofenceConfig, lng: parseFloat(e.target.value) || 0});
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="e.g. 35.3077"
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                  />
                </div>

                {/* Auto-detect Location Button */}
                <div className="space-y-2 flex flex-col justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="h-12 rounded-xl border-indigo-200 bg-indigo-50/50 text-indigo-700 font-bold hover:bg-indigo-100 gap-2"
                  >
                    {isLocating ? <Loader2 className="animate-spin" size={16} /> : <Navigation size={16} />}
                    Use My Current Location
                  </Button>
                </div>
              </div>

              {/* Allowed Radius Limit */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Allowed Geofence Radius Limit</Label>
                    <p className="text-xs text-slate-500 mt-0.5">Staff check-ins outside this distance from school coordinates will be rejected.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number"
                      value={geofenceConfig.radius}
                      onChange={e => {
                        setGeofenceState({...geofenceConfig, radius: parseInt(e.target.value) || 50});
                        setHasUnsavedChanges(true);
                      }}
                      className="w-24 h-10 rounded-xl bg-slate-50 font-black text-center"
                    />
                    <span className="text-xs font-bold text-slate-500">Meters</span>
                  </div>
                </div>

                {/* Range Slider for Radius */}
                <input 
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={geofenceConfig.radius}
                  onChange={e => {
                    setGeofenceState({...geofenceConfig, radius: parseInt(e.target.value)});
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Dev / Localhost Bypass Toggle */}
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

          {/* SECTION 3: Session & Access Security */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <Clock size={24} />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900">Session & Access Security</CardTitle>
                  <CardDescription>Idle logout intervals and temporary key activation policies.</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-0 pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Idle Session Timeout */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Idle Session Timeout</Label>
                  <Select 
                    value={sessionSecurity.idleTimeout}
                    onValueChange={val => {
                      setSessionSecurity({...sessionSecurity, idleTimeout: val});
                      setHasUnsavedChanges(true);
                    }}
                  >
                    <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="15m">15 Minutes (High Security)</SelectItem>
                      <SelectItem value="30m">30 Minutes (Recommended)</SelectItem>
                      <SelectItem value="1h">1 Hour</SelectItem>
                      <SelectItem value="never">Never (Shared Display)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Force First Login Password Change */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Force First-Login Password Reset</p>
                    <p className="text-xs text-slate-500">Require staff signing in with temporary keys (MUNYAKA-XXXX) to set a private password.</p>
                  </div>
                  <Switch 
                    checked={sessionSecurity.requirePasswordOnFirstLogin}
                    onCheckedChange={checked => {
                      setSessionSecurity({...sessionSecurity, requirePasswordOnFirstLogin: checked});
                      setHasUnsavedChanges(true);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 4: System Security Audit Log (Read-Only) */}
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