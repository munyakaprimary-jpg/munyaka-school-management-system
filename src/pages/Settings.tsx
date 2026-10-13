import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import { CentralDataService } from "@/services/centralDataService";
import SecurityAuthTab from '@/components/settings/SecurityAuthTab';
import Modal from '@/components/ui/Modal';
import {
  Building,
  Lock,
  Database,
  Save,
  RefreshCw,
  Server,
  Shield,
  Users,
  Check,
  X,
  Download,
  Upload
} from 'lucide-react';
import { exportAllData, parseAndImportBackup } from '@/utils/storage';

const SETTINGS_STORAGE_KEY = 'munyaka_system_settings';
const RBAC_STORAGE_KEY = 'munyaka_rbac_permissions';

interface SystemSettings {
  schoolName: string;
  schoolCode: string;
  address: string;
  phone: string;
  email: string;
  currentTerm: string;
  academicYear: string;
  isTermLocked: boolean;
  enableCloudSync: boolean;
  maintenanceMode: boolean;
  autoLockTerms: boolean;
  gradingSystem: string;
  smsNotifications: boolean;
  emailAlerts: boolean;
  studentPortalAccess: boolean;
  teacherPortalAccess: boolean;
  maxUploadSize: string;
  authSessionTimeout: string;
  encryptionEnabled: boolean;
}

const DEFAULT_SETTINGS: SystemSettings = {
  schoolName: "Munyaka Primary and Junior School",
  schoolCode: "MUNYAKA-001",
  address: "P.O. Box 5239-30100, Eldoret",
  phone: "+254 712 345 678",
  email: "info@munyaka.ac.ke",
  currentTerm: "Term 3",
  academicYear: "2026",
  isTermLocked: true,
  enableCloudSync: true,
  maintenanceMode: false,
  autoLockTerms: true,
  gradingSystem: "CBC 4-Point (EE, ME, AE, BE)",
  smsNotifications: true,
  emailAlerts: true,
  studentPortalAccess: true,
  teacherPortalAccess: true,
  maxUploadSize: "50 MB",
  authSessionTimeout: "30 minutes",
  encryptionEnabled: true,
};

const SYSTEM_ROLES = [
  { id: 'admin', name: 'Administrators', description: 'Full access to institutional control center, staff records, and financial ledgers.' },
  { id: 'teacher', name: 'Teachers', description: 'Access to mark entry, student attendance, lesson plans, and CBC assessments.' },
  { id: 'bursar', name: 'Bursars', description: 'Access to fee collections, payment records, and financial summaries.' },
  { id: 'librarian', name: 'Librarians', description: 'Access to library catalog, book checkouts, and e-resource inventories.' },
  { id: 'ict_technician', name: 'ICT Technicians', description: 'Access to lab devices, digital literacy hubs, and network monitoring.' },
  { id: 'developer', name: 'Platform Developers', description: 'Full access to multi-tenant configurations, schema migrations, and raw database backups.' }
];

const MODULE_PERMISSIONS = [
  { id: 'dashboard', name: 'Dashboard & Overview' },
  { id: 'admissions', name: 'Student Admissions & Profiles' },
  { id: 'academics', name: 'Timetable & CBC Assessments' },
  { id: 'finance', name: 'Fees & Financial Ledgers' },
  { id: 'library', name: 'Library & E-Resources' },
  { id: 'ict_labs', name: 'ICT Lab & Hardware Inventory' },
  { id: 'communication', name: 'SMS & Email Communication' },
  { id: 'settings', name: 'System Settings & RBAC' }
];

const DEFAULT_RBAC_MATRIX: Record<string, Record<string, boolean>> = {
  admin: { dashboard: true, admissions: true, academics: true, finance: true, library: true, ict_labs: true, communication: true, settings: true },
  teacher: { dashboard: true, admissions: false, academics: true, finance: false, library: true, ict_labs: true, communication: true, settings: false },
  bursar: { dashboard: true, admissions: true, academics: false, finance: true, library: false, ict_labs: false, communication: true, settings: false },
  librarian: { dashboard: true, admissions: false, academics: false, finance: false, library: true, ict_labs: false, communication: false, settings: false },
  ict_technician: { dashboard: true, admissions: false, academics: false, finance: false, library: false, ict_labs: true, communication: false, settings: false },
  developer: { dashboard: true, admissions: true, academics: true, finance: true, library: true, ict_labs: true, communication: true, settings: true }
};

export default function Settings() {
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const central = CentralDataService.getData<SystemSettings>(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS);
      if (central && typeof central === 'object') return { ...DEFAULT_SETTINGS, ...central };
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [rbacMatrix, setRbacMatrix] = useState<Record<string, Record<string, boolean>>>(() => {
    try {
      const central = CentralDataService.getData<Record<string, Record<string, boolean>>>(RBAC_STORAGE_KEY, {});
      if (central && typeof central === 'object' && Object.keys(central).length > 0) return central;
      const saved = localStorage.getItem(RBAC_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return DEFAULT_RBAC_MATRIX;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isResetAuthOpen, setIsResetAuthOpen] = useState(false);
  const [resetAdminPassword, setResetAdminPassword] = useState('');
  const [resetAuthError, setResetAuthError] = useState('');
  const [isVerifyingReset, setIsVerifyingReset] = useState(false);

  useEffect(() => {
    try {
      CentralDataService.setData(SETTINGS_STORAGE_KEY, settings);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    try {
      CentralDataService.setData(RBAC_STORAGE_KEY, rbacMatrix);
      localStorage.setItem(RBAC_STORAGE_KEY, JSON.stringify(rbacMatrix));
    } catch {}
  }, [rbacMatrix]);

  const handlePermissionToggle = (roleId: string, moduleId: string) => {
    setRbacMatrix(prev => ({
      ...prev,
      [roleId]: {
        ...(prev[roleId] || {}),
        [moduleId]: !prev[roleId]?.[moduleId]
      }
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      try {
        CentralDataService.setData(SETTINGS_STORAGE_KEY, settings);
        CentralDataService.setData(RBAC_STORAGE_KEY, rbacMatrix);
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        localStorage.setItem(RBAC_STORAGE_KEY, JSON.stringify(rbacMatrix));
        if (settings.currentTerm) {
          localStorage.setItem('munyaka_active_term', settings.currentTerm);
          localStorage.setItem('activeTerm', settings.currentTerm);
        }
        localStorage.setItem('munyaka_term_locked', String(settings.isTermLocked));
        showSuccess("All system settings and RBAC permissions saved securely!");
      } catch (e) {
        showError("Failed to save settings.");
      }
      setIsSaving(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-6 max-w-7xl mx-auto space-y-8 animate-in fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
              Configuration Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">System Settings & Preferences</h1>
          <p className="text-indigo-200 text-sm mt-1">Manage institutional profile, academic setup, RBAC roles, security & auth, and database backups.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg gap-2 shrink-0">
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        {/* Scrollable sub-navigation container */}
        <div className="w-full overflow-x-auto pb-2 mb-6">
          <TabsList className="bg-white p-1.5 rounded-2xl shadow-sm border h-16 inline-flex min-w-max gap-1">
            <TabsTrigger value="profile" className="rounded-xl px-5 font-bold text-xs flex items-center gap-2">
              <Building size={14} /> School Profile
            </TabsTrigger>
            <TabsTrigger value="academic" className="rounded-xl px-5 font-bold text-xs flex items-center gap-2">
              <Lock size={14} /> Academic Setup
            </TabsTrigger>
            <TabsTrigger value="rbac" className="rounded-xl px-5 font-bold text-xs flex items-center gap-2">
              <Users size={14} /> RBAC Roles
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-xl px-5 font-bold text-xs flex items-center gap-2">
              <Shield size={14} /> Security & Auth
            </TabsTrigger>
            <TabsTrigger value="storage" className="rounded-xl px-5 font-bold text-xs flex items-center gap-2">
              <Database size={14} /> Database & Backups
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 1. School Profile */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building className="text-indigo-600" size={22} /> School Institution Profile
              </CardTitle>
              <CardDescription>Official institution details displayed on report cards and official transcripts.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>School Name</Label>
                  <Input value={settings.schoolName} onChange={e => setSettings({...settings, schoolName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>School Code / Identifier</Label>
                  <Input value={settings.schoolCode} onChange={e => setSettings({...settings, schoolCode: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Postal Address</Label>
                  <Input value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Contact</Label>
                  <Input value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Official Email Address</Label>
                  <Input value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Academic Setup */}
        <TabsContent value="academic" className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Lock className="text-indigo-600" size={22} /> Academic Setup & Term Locks
              </CardTitle>
              <CardDescription>Configure active term and auto-lock rules for archived grades.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Current Active Term</Label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextLock = !settings.isTermLocked;
                        setSettings({...settings, isTermLocked: nextLock});
                        localStorage.setItem('munyaka_term_locked', String(nextLock));
                      }}
                      className={`text-xs font-bold px-3 py-1 rounded-full transition-all shadow-sm ${
                        settings.isTermLocked
                          ? 'bg-rose-100 text-rose-700 border border-rose-300 hover:bg-rose-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200'
                      }`}
                    >
                      {settings.isTermLocked ? '🔒 Term Locked' : '🔓 Term Unlocked'}
                    </button>
                  </div>
                  <Select value={settings.currentTerm} onValueChange={(val) => setSettings({...settings, currentTerm: val})}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select active term..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Term 1">Term 1</SelectItem>
                      <SelectItem value="Term 2">Term 2</SelectItem>
                      <SelectItem value="Term 3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Select value={settings.academicYear} onValueChange={(val) => setSettings({...settings, academicYear: val})}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select academic year..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024 Academic Year</SelectItem>
                      <SelectItem value="2025">2025 Academic Year</SelectItem>
                      <SelectItem value="2026">2026 Academic Year</SelectItem>
                      <SelectItem value="2027">2027 Academic Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Grading System Framework</Label>
                  <Select value={settings.gradingSystem} onValueChange={(val) => setSettings({...settings, gradingSystem: val})}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select grading framework..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CBC 4-Point (EE, ME, AE, BE)">CBC 4-Point (EE, ME, AE, BE)</SelectItem>
                      <SelectItem value="Percentage (0-100%)">Percentage (0-100%)</SelectItem>
                      <SelectItem value="Letter Grade (A, B, C, D, E)">Letter Grade (A, B, C, D, E)</SelectItem>
                      <SelectItem value="Competency Rubric (Exceeds, Meets, Approaches, Below)">Competency Rubric (Exceeds, Meets, Approaches, Below)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
                <div>
                  <h4 className="font-bold text-slate-900">Auto-Lock Past Terms</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Prevent unauthorized edits to past closed terms.</p>
                </div>
                <Switch checked={settings.autoLockTerms} onCheckedChange={(val) => setSettings({...settings, autoLockTerms: val})} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. RBAC Roles & Permissions Matrix */}
        <TabsContent value="rbac" className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="text-indigo-600" size={22} /> RBAC Roles & Granular Permissions Matrix
              </CardTitle>
              <CardDescription>Configure module access permissions across all institutional system roles.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-6 space-y-6">
              <div className="space-y-6">
                {SYSTEM_ROLES.map(role => (
                  <div key={role.id} className="p-5 bg-slate-50/80 rounded-2xl border space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-base">{role.name}</h4>
                          <Badge variant="outline" className="font-mono text-xs uppercase">{role.id}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {MODULE_PERMISSIONS.map(mod => {
                        const isAllowed = Boolean(rbacMatrix[role.id]?.[mod.id]);
                        return (
                          <div 
                            key={mod.id} 
                            onClick={() => handlePermissionToggle(role.id, mod.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                              isAllowed 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-400 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <span className="text-xs font-bold truncate">{mod.name}</span>
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${isAllowed ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                              {isAllowed ? <Check size={12} /> : <X size={12} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Security & Auth */}
        <TabsContent value="security" className="space-y-6">
          <SecurityAuthTab />
        </TabsContent>

        {/* 5. Database & Backups */}
        <TabsContent value="storage" className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Database className="text-indigo-600" size={22} /> Database & Backups
              </CardTitle>
              <CardDescription>Permanent storage persistence status, backup creation, and database recovery.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
                <div>
                  <h4 className="font-bold text-slate-900">Cloud Backup & Central Sync</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Automatically mirror local permanent storage to secure cloud nodes.</p>
                </div>
                <Switch checked={settings.enableCloudSync} onCheckedChange={(val) => setSettings({...settings, enableCloudSync: val})} />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
                <div>
                  <h4 className="font-bold text-slate-900">Maintenance Mode</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Lock system for scheduled database maintenance.</p>
                </div>
                <Switch checked={settings.maintenanceMode} onCheckedChange={(val) => setSettings({...settings, maintenanceMode: val})} />
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Server className="text-indigo-600" size={24} />
                  <div>
                    <h4 className="font-bold text-indigo-900 text-sm">Central Storage Engine Status</h4>
                    <p className="text-xs text-indigo-700">Active storage driver: <span className="font-mono font-bold">IndexedDB + Central Persistent Store</span></p>
                  </div>
                </div>
                <span className="bg-emerald-600 text-white font-bold text-xs px-3 py-1 rounded-full">Healthy</span>
              </div>

              {/* Data Operations */}
              <div className="pt-4 border-t space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Manual Data Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Backup Export */}
                  <div className="p-5 border rounded-2xl bg-white shadow-sm flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-2 text-indigo-600 font-bold mb-1">
                        <Download size={18} /> Export Backup
                      </div>
                      <p className="text-xs text-muted-foreground">Download a complete JSON snapshot of learners, staff, marks, and settings.</p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold"
                      onClick={() => {
                        try {
                          const backup = exportAllData();
                          const jsonStr = JSON.stringify(backup, null, 2);
                          const blob = new Blob([jsonStr], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `munyaka_system_backup_${new Date().toISOString().slice(0, 10)}.json`;
                          a.click();
                          URL.revokeObjectURL(a.href);
                          showSuccess('Backup exported successfully!');
                        } catch {
                          showError('Failed to generate database backup.');
                        }
                      }}
                    >
                      Backup Now
                    </Button>
                  </div>

                  {/* Restore / Import */}
                  <div className="p-5 border rounded-2xl bg-white shadow-sm flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-600 font-bold mb-1">
                        <Upload size={18} /> Restore Data
                      </div>
                      <p className="text-xs text-muted-foreground">Restore database state from an existing JSON backup archive.</p>
                    </div>
                    <label className="w-full">
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const content = event.target?.result as string;
                              const res = parseAndImportBackup(content);
                              if (res.success) {
                                showSuccess(`Restored successfully! Reloading...`);
                                setTimeout(() => window.location.reload(), 1000);
                              } else {
                                showError(res.errors.join('; ') || 'Invalid backup file format.');
                              }
                            } catch {
                              showError('Error reading backup file.');
                            }
                          };
                          reader.readAsText(file);
                        }}
                      />
                      <Button asChild variant="outline" className="w-full rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold cursor-pointer">
                        <span>Upload & Restore</span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
