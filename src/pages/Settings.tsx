import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess, showError } from "@/utils/toast";
import { CentralDataService } from "@/services/centralDataService";
import { 
  Building, 
  Lock, 
  Database, 
  Save, 
  RefreshCw,
  Server,
  Shield,
  Bell,
  Sliders,
  Globe,
  Key,
  Users,
  HardDrive
} from 'lucide-react';

const SETTINGS_STORAGE_KEY = 'munyaka_system_settings';

interface SystemSettings {
  schoolName: string;
  schoolCode: string;
  address: string;
  phone: string;
  email: string;
  currentTerm: string;
  academicYear: string;
  enableCloudSync: boolean;
  maintenanceMode: boolean;
  autoLockTerms: boolean;
  gradingSystem: string;
  smsNotifications: boolean;
  emailAlerts: boolean;
  studentPortalAccess: boolean;
  teacherPortalAccess: boolean;
  maxUploadSize: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  schoolName: "Munyaka Primary and Junior School",
  schoolCode: "MUNYAKA-001",
  address: "P.O. Box 5239-30100, Eldoret",
  phone: "+254 712 345 678",
  email: "info@munyaka.ac.ke",
  currentTerm: "Term 1",
  academicYear: "2026",
  enableCloudSync: true,
  maintenanceMode: false,
  autoLockTerms: true,
  gradingSystem: "CBC 4-Point (EE, ME, AE, BE)",
  smsNotifications: true,
  emailAlerts: true,
  studentPortalAccess: true,
  teacherPortalAccess: true,
  maxUploadSize: "50 MB",
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

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      CentralDataService.setData(SETTINGS_STORAGE_KEY, settings);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      try {
        CentralDataService.setData(SETTINGS_STORAGE_KEY, settings);
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        showSuccess("All system settings saved securely to permanent storage!");
      } catch (e) {
        showError("Failed to save settings.");
      }
      setIsSaving(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-6 max-w-7xl mx-auto space-y-8 animate-in fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
              Configuration Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">System Settings & Preferences</h1>
          <p className="text-indigo-200 text-sm mt-1">Manage institutional profile, academic calendars, portal controls, and persistent storage.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg gap-2">
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-white p-1.5 rounded-2xl shadow-sm border h-14 mb-8 flex flex-wrap gap-1">
          <TabsTrigger value="profile" className="rounded-xl px-5 font-bold text-xs">School Profile</TabsTrigger>
          <TabsTrigger value="academic" className="rounded-xl px-5 font-bold text-xs">Academic & Term Locks</TabsTrigger>
          <TabsTrigger value="portals" className="rounded-xl px-5 font-bold text-xs">Portals & Access</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-xl px-5 font-bold text-xs">Notifications</TabsTrigger>
          <TabsTrigger value="storage" className="rounded-xl px-5 font-bold text-xs">Storage & Backups</TabsTrigger>
        </TabsList>

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

        {/* 2. Academic & Term Locks */}
        <TabsContent value="academic" className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Lock className="text-indigo-600" size={22} /> Academic Calendar & Term Locks
              </CardTitle>
              <CardDescription>Configure active term and auto-lock rules for archived grades.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Active Term</Label>
                  <Input value={settings.currentTerm} onChange={e => setSettings({...settings, currentTerm: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Input value={settings.academicYear} onChange={e => setSettings({...settings, academicYear: e.target.value})} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Grading System Framework</Label>
                  <Input value={settings.gradingSystem} onChange={e => setSettings({...settings, gradingSystem: e.target.value})} />
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

        {/* 3. Portals & Access */}
        <TabsContent value="portals" className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="text-indigo-600" size={22} /> Portal Access Controls
              </CardTitle>
              <CardDescription>Enable or restrict student and teacher portal accessibility across the network.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
                <div>
                  <h4 className="font-bold text-slate-900">Student Portal Access</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Allow students to log in and view report cards and homework.</p>
                </div>
                <Switch checked={settings.studentPortalAccess} onCheckedChange={(val) => setSettings({...settings, studentPortalAccess: val})} />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
                <div>
                  <h4 className="font-bold text-slate-900">Teacher Portal Access</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Allow teaching staff to enter marks, attendance, and lesson plans.</p>
                </div>
                <Switch checked={settings.teacherPortalAccess} onCheckedChange={(val) => setSettings({...settings, teacherPortalAccess: val})} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Bell className="text-indigo-600" size={22} /> Notification Preferences
              </CardTitle>
              <CardDescription>Configure automated SMS and email communication triggers.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
                <div>
                  <h4 className="font-bold text-slate-900">SMS Notifications</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Send automated attendance and fee reminders via SMS gateway.</p>
                </div>
                <Switch checked={settings.smsNotifications} onCheckedChange={(val) => setSettings({...settings, smsNotifications: val})} />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
                <div>
                  <h4 className="font-bold text-slate-900">Email Alerts</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Broadcast notices and report cards via email.</p>
                </div>
                <Switch checked={settings.emailAlerts} onCheckedChange={(val) => setSettings({...settings, emailAlerts: val})} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. Storage & Backups */}
        <TabsContent value="storage" className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
            <CardHeader className="px-0 pt-0 pb-6 border-b">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Database className="text-indigo-600" size={22} /> Central Storage & Sync
              </CardTitle>
              <CardDescription>Permanent storage persistence status and cloud sync configurations.</CardDescription>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
