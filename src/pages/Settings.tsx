"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import BackButton from '@/components/ui/BackButton';
import { 
  Settings as SettingsIcon, 
  School,
  Building2,
  Mail,
  Phone,
  Quote,
  MapPin,
  Image as ImageIcon,
  Save,
  Loader2,
  UploadCloud,
  FileBadge,
  Calendar,
  Layers,
  GraduationCap,
  BookOpen,
  Plus,
  Trash2,
  Info,
  ChevronRight,
  ShieldCheck,
  Lock,
  Key,
  Navigation,
  Clock,
  History,
  AlertTriangle,
  Monitor,
  Users as UsersIcon,
  ShieldAlert,
  UserCheck,
  UserCog,
  CheckCircle2
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useGeolocation } from '@/hooks/useGeolocation';
import { setGeofenceConfig, getGeofenceConfig } from '@/lib/geofence';
import { cn } from '@/lib/utils';

const SETTINGS_STORAGE_KEY = 'munyaka_system_config';
const ACADEMIC_STORAGE_KEY = 'munyaka_academic_config';
const SECURITY_STORAGE_KEY = 'munyaka_security_config';
const ROLES_STORAGE_KEY = 'munyaka_roles_config';

const Settings = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { location: geoLoc, isLoading: geoLoading } = useGeolocation();
  
  // 1. General Settings State
  const [generalConfig, setGeneralConfig] = useState({
    schoolName: "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
    postalAddress: "P.O. BOX 5239-30100 ELDORET",
    motto: "KNOWLEDGE IS POWER",
    phone: "+254 712 345 678",
    email: "info@munyaka.sc.ke",
    location: "Munyaka, Eldoret East, Uasin Gishu County",
    maintenanceMode: false
  });

  // 2. Academic Setup State
  const [academicConfig, setAcademicConfig] = useState({
    activeYear: "2026",
    activeTerm: "term1",
    termStartDate: "2026-01-05",
    termEndDate: "2026-04-10",
    gradingScale: [
      { level: "EE1", descriptor: "Exceeding Expectations", min: 90, max: 100, points: 8 },
      { level: "EE2", descriptor: "Exceeding Expectations", min: 75, max: 89, points: 7 },
      { level: "ME1", descriptor: "Meeting Expectations", min: 65, max: 74, points: 6 },
      { level: "ME2", descriptor: "Meeting Expectations", min: 50, max: 64, points: 5 },
      { level: "AE1", descriptor: "Approaching Expectations", min: 40, max: 49, points: 4 },
      { level: "AE2", descriptor: "Approaching Expectations", min: 30, max: 39, points: 3 },
      { level: "BE1", descriptor: "Below Expectations", min: 20, max: 29, points: 2 },
      { level: "BE2", descriptor: "Below Expectations", min: 0, max: 19, points: 1 },
    ],
    gradeStreams: [
      { grade: "Grade 4", streams: ["Blue", "Green"] },
      { grade: "Grade 7", streams: ["Alpha", "Beta"] },
    ],
    subjects: [
      { name: "Mathematics", category: "Lower Primary", compulsory: true },
      { name: "English Language", category: "Lower Primary", compulsory: true },
      { name: "Kiswahili", category: "Lower Primary", compulsory: true },
      { name: "Integrated Science", category: "Junior Secondary", compulsory: true },
      { name: "Pre-Technical Studies", category: "Junior Secondary", compulsory: false },
    ]
  });

  // 3. Roles & Permissions State
  const [rolesConfig, setRolesConfig] = useState([
    { id: 'super_admin', name: 'Super Admin', users: 1, permissions: ['All Access', 'System Config', 'Financials'], color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'head_teacher', name: 'Head Teacher', users: 1, permissions: ['Manage Staff', 'View All Marks', 'Reports'], color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'bursar', name: 'Bursar', users: 1, permissions: ['Manage Fees', 'Financial Reports'], color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'teacher', name: 'Class Teacher', users: 12, permissions: ['Mark Attendance', 'Enter Marks', 'Student Profiles'], color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'student', name: 'Student / Parent', users: 450, permissions: ['View Results', 'View Fees', 'Notice Board'], color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]);

  // 4. Security Settings State
  const [securityConfig, setSecurityConfig] = useState({
    geofenceEnabled: true,
    lat: 0.5304,
    lng: 35.3077,
    radius: 150,
    devBypass: false,
    idleTimeout: "30m",
    requirePasswordChange: true
  });

  const [pinForm, setPinForm] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: ""
  });

  // Load from localStorage
  useEffect(() => {
    const savedGeneral = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const savedAcademic = localStorage.getItem(ACADEMIC_STORAGE_KEY);
    const savedSecurity = localStorage.getItem(SECURITY_STORAGE_KEY);
    const savedRoles = localStorage.getItem(ROLES_STORAGE_KEY);
    
    if (savedGeneral) setGeneralConfig(prev => ({ ...prev, ...JSON.parse(savedGeneral) }));
    if (savedAcademic) setAcademicConfig(prev => ({ ...prev, ...JSON.parse(savedAcademic) }));
    if (savedSecurity) setSecurityConfig(prev => ({ ...prev, ...JSON.parse(savedSecurity) }));
    if (savedRoles) setRolesConfig(JSON.parse(savedRoles));
  }, []);

  const handleSaveAll = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(generalConfig));
    localStorage.setItem(ACADEMIC_STORAGE_KEY, JSON.stringify(academicConfig));
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(securityConfig));
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(rolesConfig));
    
    // Sync geofence specific helper lib
    setGeofenceConfig({
      lat: securityConfig.lat,
      lng: securityConfig.lng,
      radius: securityConfig.radius
    });
    
    setIsSaving(false);
    showSuccess("System configuration updated successfully!");
  };

  const handleUpdatePin = async () => {
    if (!pinForm.currentPin || !pinForm.newPin) {
      showError("Please fill in all PIN fields.");
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      showError("New PINs do not match.");
      return;
    }
    
    const storedPin = localStorage.getItem('munyaka_admin_pass') || 'admin123';
    if (pinForm.currentPin !== storedPin) {
      showError("Incorrect current Admin PIN.");
      return;
    }

    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    localStorage.setItem('munyaka_admin_pass', pinForm.newPin);
    setPinForm({ currentPin: "", newPin: "", confirmPin: "" });
    setIsSaving(false);
    showSuccess("Administrative Master PIN updated successfully.");
  };

  const useCurrentLocation = () => {
    if (geoLoc) {
      setSecurityConfig({
        ...securityConfig,
        lat: parseFloat(geoLoc.lat.toFixed(6)),
        lng: parseFloat(geoLoc.lng.toFixed(6))
      });
      showSuccess("Coordinates updated from your current GPS position.");
    } else {
      showError("Could not retrieve GPS coordinates. Check browser permissions.");
    }
  };

  const pinStrength = useMemo(() => {
    if (!pinForm.newPin) return 0;
    let score = 0;
    if (pinForm.newPin.length > 6) score += 1;
    if (/[A-Z]/.test(pinForm.newPin)) score += 1;
    if (/[0-9]/.test(pinForm.newPin)) score += 1;
    if (/[^A-Za-z0-9]/.test(pinForm.newPin)) score += 1;
    return score;
  }, [pinForm.newPin]);

  const updateGrading = (index: number, field: string, value: any) => {
    const newScale = [...academicConfig.gradingScale];
    newScale[index] = { ...newScale[index], [field]: value };
    setAcademicConfig({ ...academicConfig, gradingScale: newScale });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">System Configuration</h1>
            <p className="text-muted-foreground">Manage institutional identity, academic setup, and security policies.</p>
          </div>
        </div>
        <Button 
          onClick={handleSaveAll} 
          disabled={isSaving}
          className="rounded-[1.5rem] px-10 h-14 font-black shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700"
        >
          {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
          Save All Settings
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-12 mb-8">
          <TabsTrigger value="general" className="rounded-xl px-8 h-full font-bold text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">General</TabsTrigger>
          <TabsTrigger value="academic" className="rounded-xl px-8 h-full font-bold text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Academic Setup</TabsTrigger>
          <TabsTrigger value="roles" className="rounded-xl px-8 h-full font-bold text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Users & Roles</TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-8 h-full font-bold text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Security & Access</TabsTrigger>
        </TabsList>

        {/* --- GENERAL TAB --- */}
        <TabsContent value="general" className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                  <School size={24} />
                </div>
                <div>
                  <CardTitle className="text-xl">Institutional Profile</CardTitle>
                  <CardDescription>Official school identity details used for reports.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">School Name</Label>
                  <Input 
                    value={generalConfig.schoolName}
                    onChange={(e) => setGeneralConfig({...generalConfig, schoolName: e.target.value})}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Postal Address</Label>
                  <Input 
                    value={generalConfig.postalAddress}
                    onChange={(e) => setGeneralConfig({...generalConfig, postalAddress: e.target.value})}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">School Motto</Label>
                  <Input 
                    value={generalConfig.motto}
                    onChange={(e) => setGeneralConfig({...generalConfig, motto: e.target.value})}
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold italic" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Contact Phone</Label>
                    <Input 
                      value={generalConfig.phone}
                      onChange={(e) => setGeneralConfig({...generalConfig, phone: e.target.value})}
                      className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Official Email</Label>
                    <Input 
                      value={generalConfig.email}
                      onChange={(e) => setGeneralConfig({...generalConfig, email: e.target.value})}
                      className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Location Description</Label>
                <Textarea 
                  value={generalConfig.location}
                  onChange={(e) => setGeneralConfig({...generalConfig, location: e.target.value})}
                  className="rounded-xl min-h-[100px] bg-slate-50 border-none font-medium" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden p-8">
            <div className="flex items-center justify-between bg-indigo-900 text-white p-6 rounded-3xl overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-1">Maintenance Mode</h3>
                <p className="text-xs text-indigo-200">Prevent system access for standard users during updates.</p>
              </div>
              <Switch 
                checked={generalConfig.maintenanceMode}
                onCheckedChange={(val) => setGeneralConfig({...generalConfig, maintenanceMode: val})}
                className="data-[state=checked]:bg-emerald-500 relative z-10" 
              />
              <div className="absolute right-[-20px] top-[-20px] opacity-10"><SettingsIcon size={120} /></div>
            </div>
          </Card>
        </TabsContent>

        {/* --- ACADEMIC SETUP TAB --- */}
        <TabsContent value="academic" className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-8 border-b bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                    <Calendar size={24} />
                  </div>
                  <CardTitle className="text-xl">Calendar & Term Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Active Academic Year</Label>
                    <Select value={academicConfig.activeYear} onValueChange={(v) => setAcademicConfig({...academicConfig, activeYear: v})}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {["2024", "2025", "2026", "2027"].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Active Academic Term</Label>
                    <Select value={academicConfig.activeTerm} onValueChange={(v) => setAcademicConfig({...academicConfig, activeTerm: v})}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="term1">Term 1 (First Term)</SelectItem>
                        <SelectItem value="term2">Term 2 (Second Term)</SelectItem>
                        <SelectItem value="term3">Term 3 (Third Term)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Term Start Date</Label>
                    <Input 
                      type="date" 
                      value={academicConfig.termStartDate}
                      onChange={(e) => setAcademicConfig({...academicConfig, termStartDate: e.target.value})}
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Term End Date</Label>
                    <Input 
                      type="date" 
                      value={academicConfig.termEndDate}
                      onChange={(e) => setAcademicConfig({...academicConfig, termEndDate: e.target.value})}
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-xl shadow-indigo-100">
              <div className="space-y-2">
                <Badge className="bg-white/20 text-white border-none uppercase text-[10px] tracking-widest font-black">Status Insight</Badge>
                <h4 className="text-2xl font-black">Period Active</h4>
                <p className="text-indigo-100/70 text-sm leading-relaxed">System-wide reports and marks entry will default to the current active term and year defined here.</p>
              </div>
              <div className="pt-6">
                <div className="flex items-center gap-2 text-indigo-200">
                  <Info size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Updates will apply live</span>
                </div>
              </div>
            </div>
          </div>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b bg-slate-50/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                    <Layers size={24} />
                  </div>
                  <CardTitle className="text-xl">Grade Levels & Class Streams</CardTitle>
                </div>
                <Button variant="ghost" className="text-indigo-600 font-black rounded-xl">
                  <Plus size={18} className="mr-2" /> Add Level
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {academicConfig.gradeStreams.map((gs, i) => (
                  <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-black text-lg text-slate-900">{gs.grade}</h4>
                      <Button variant="ghost" size="icon" className="rounded-full text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {gs.streams.map(s => (
                        <Badge key={s} className="bg-white text-slate-600 border-slate-200 shadow-sm px-3 py-1 rounded-lg">
                          Stream {s}
                        </Badge>
                      ))}
                      <Button size="sm" variant="ghost" className="rounded-lg h-7 px-2 text-[10px] uppercase font-black text-indigo-600 border border-dashed border-indigo-200">
                        + Stream
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <CardTitle className="text-xl">CBC 8-Tier Grading Scale</CardTitle>
                  <CardDescription>Configuration for automated report card performance calculation.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50/50 border-b">
                  <tr>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Level</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Descriptor</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Min %</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Max %</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {academicConfig.gradingScale.map((row, i) => (
                    <tr key={row.level} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-black text-slate-900">{row.level}</td>
                      <td className="px-8 py-5 font-medium text-slate-600">{row.descriptor}</td>
                      <td className="px-8 py-5 text-center">
                        <Input 
                          type="number" 
                          value={row.min} 
                          onChange={(e) => updateGrading(i, 'min', parseInt(e.target.value))}
                          className="w-16 h-10 mx-auto text-center font-bold rounded-xl border-none bg-slate-100" 
                        />
                      </td>
                      <td className="px-8 py-5 text-center">
                        <Input 
                          type="number" 
                          value={row.max} 
                          onChange={(e) => updateGrading(i, 'max', parseInt(e.target.value))}
                          className="w-16 h-10 mx-auto text-center font-bold rounded-xl border-none bg-slate-100" 
                        />
                      </td>
                      <td className="px-8 py-5 text-right font-black text-indigo-600">{row.points} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- USERS & ROLES TAB --- */}
        <TabsContent value="roles" className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-3 border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-8 border-b bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                    <UserCog size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-xl">System Roles & Access Policy</CardTitle>
                    <CardDescription>Manage user categories and their functional access levels.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/50 border-b">
                      <tr>
                        <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">System Role</th>
                        <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Permissions / Capability</th>
                        <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Active Users</th>
                        <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {rolesConfig.map((role) => (
                        <tr key={role.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-2 h-2 rounded-full", role.id === 'super_admin' ? 'bg-rose-500' : 'bg-indigo-500')} />
                              <span className="font-bold text-slate-900">{role.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-wrap gap-1.5">
                              {role.permissions.map(p => (
                                <Badge key={p} variant="outline" className="rounded-lg bg-white border-slate-200 text-slate-500 text-[10px] px-2 py-0.5">
                                  {p}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-center font-bold text-slate-600">{role.users}</td>
                          <td className="px-8 py-5 text-right">
                            <Button variant="ghost" size="sm" className="text-indigo-600 font-bold rounded-xl hover:bg-indigo-50">
                              Edit Policy
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-none shadow-sm rounded-[2.5rem] bg-indigo-900 text-white p-8 relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/10 rounded-lg"><ShieldAlert size={18} /></div>
                    <h3 className="font-bold">Role Safeguard</h3>
                  </div>
                  <p className="text-xs text-indigo-200 leading-relaxed">
                    Changing permissions for established roles may affect core functionality. All role modifications are logged in the security audit trail.
                  </p>
                  <Button className="w-full h-11 bg-white/10 hover:bg-white/20 border-white/10 text-white font-bold rounded-xl shadow-lg">
                    Audit All Permissions
                  </Button>
                </div>
                <div className="absolute right-[-20px] top-[-20px] opacity-10 pointer-events-none"><ShieldCheck size={120} /></div>
              </Card>

              <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-4">
                  <UserCheck size={32} />
                </div>
                <h4 className="font-bold text-slate-900">Privilege Review</h4>
                <p className="text-xs text-slate-400 mt-1">Next required audit: Jan 2025</p>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* --- SECURITY TAB --- */}
        <TabsContent value="security" className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                  <Lock size={24} />
                </div>
                <div>
                  <CardTitle className="text-xl">Administrative Master PIN</CardTitle>
                  <CardDescription>Manage the password required for high-privileged system actions.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Current Admin PIN</Label>
                  <Input 
                    type="password"
                    value={pinForm.currentPin}
                    onChange={(e) => setPinForm({...pinForm, currentPin: e.target.value})}
                    placeholder="••••••••"
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">New Admin PIN</Label>
                  <Input 
                    type="password"
                    value={pinForm.newPin}
                    onChange={(e) => setPinForm({...pinForm, newPin: e.target.value})}
                    placeholder="••••••••"
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
                  />
                  {pinForm.newPin && (
                    <div className="flex gap-1 mt-1 px-1">
                      {[1,2,3,4].map((step) => (
                        <div key={step} className={cn("h-1 flex-1 rounded-full", step <= pinStrength ? "bg-emerald-500" : "bg-slate-100")} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Confirm New PIN</Label>
                  <Input 
                    type="password"
                    value={pinForm.confirmPin}
                    onChange={(e) => setPinForm({...pinForm, confirmPin: e.target.value})}
                    placeholder="••••••••"
                    className={cn("rounded-xl h-12 bg-slate-50 border-none font-bold", pinForm.confirmPin && pinForm.newPin !== pinForm.confirmPin && "ring-2 ring-rose-500")} 
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button 
                  onClick={handleUpdatePin}
                  className="rounded-xl px-8 h-11 bg-slate-900 text-white font-bold gap-2"
                >
                  <ShieldCheck size={18} /> Update Master PIN
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-8 border-b bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                      <Navigation size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Geofence & Location Security</CardTitle>
                      <CardDescription>Control global GPS enforcement parameters for staff check-in.</CardDescription>
                    </div>
                  </div>
                  <Switch 
                    checked={securityConfig.geofenceEnabled}
                    onCheckedChange={(val) => setSecurityConfig({...securityConfig, geofenceEnabled: val})}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Target School Latitude</Label>
                      <Input 
                        type="number" 
                        value={securityConfig.lat}
                        onChange={(e) => setSecurityConfig({...securityConfig, lat: parseFloat(e.target.value)})}
                        className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Target School Longitude</Label>
                      <Input 
                        type="number" 
                        value={securityConfig.lng}
                        onChange={(e) => setSecurityConfig({...securityConfig, lng: parseFloat(e.target.value)})}
                        className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl h-11 border-dashed border-indigo-200 text-indigo-600 font-bold hover:bg-indigo-50"
                      onClick={useCurrentLocation}
                      disabled={geoLoading}
                    >
                      {geoLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <MapPin size={16} className="mr-2" />}
                      Use My Current Location
                    </Button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Allowed Radius Limit</Label>
                        <Badge variant="outline" className="rounded-lg bg-indigo-50 border-none text-indigo-600 font-black">{securityConfig.radius} Meters</Badge>
                      </div>
                      <Slider 
                        value={[securityConfig.radius]}
                        onValueChange={(val) => setSecurityConfig({...securityConfig, radius: val[0]})}
                        max={1000}
                        step={10}
                        className="py-4"
                      />
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="text-amber-600" size={20} />
                        <div>
                          <p className="text-sm font-bold text-amber-900">Dev / Localhost Bypass</p>
                          <p className="text-[10px] text-amber-700">Disable geofence for system testing</p>
                        </div>
                      </div>
                      <Switch 
                        checked={securityConfig.devBypass}
                        onCheckedChange={(val) => setSecurityConfig({...securityConfig, devBypass: val})}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-none shadow-sm rounded-[2.5rem] bg-indigo-900 text-white p-8 relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/10 rounded-lg"><Clock size={18} /></div>
                    <h3 className="font-bold">Session Security</h3>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-indigo-300 tracking-widest">Idle Session Timeout</Label>
                    <Select value={securityConfig.idleTimeout} onValueChange={(v) => setSecurityConfig({...securityConfig, idleTimeout: v})}>
                      <SelectTrigger className="h-11 bg-white/10 border-white/20 rounded-xl font-bold text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="15m">15 Minutes</SelectItem>
                        <SelectItem value="30m">30 Minutes</SelectItem>
                        <SelectItem value="1h">1 Hour</SelectItem>
                        <SelectItem value="never">Never (Stay Logged In)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[10px] font-bold text-indigo-200 max-w-[140px]">Force password change on first login</p>
                    <Switch 
                      checked={securityConfig.requirePasswordChange}
                      onCheckedChange={(val) => setSecurityConfig({...securityConfig, requirePasswordChange: val})}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </div>
                <div className="absolute right-[-20px] top-[-20px] opacity-10 pointer-events-none"><ShieldCheck size={120} /></div>
              </Card>

              <div className="p-6 bg-white rounded-[2.5rem] shadow-sm border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center">
                  <Monitor size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Connected Devices</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">2 active sessions</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
                  <History size={24} />
                </div>
                <div>
                  <CardTitle className="text-xl">Recent Security Activity</CardTitle>
                  <CardDescription>Historical log of key administrative security events.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-50/50 border-b">
                    <tr>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Timestamp</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Admin User</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Action Taken</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">IP / Device</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[
                      { time: "2024-10-20 14:32", user: "Admin (Self)", action: "Geofence Radius Updated (150m)", device: "192.168.1.1 (Chrome)" },
                      { time: "2024-10-18 09:15", user: "Admin (Self)", action: "Master PIN Changed", device: "192.168.1.5 (Safari)" },
                      { time: "2024-10-15 11:20", user: "Admin (Self)", action: "Credentials Reset: J. Mwangi", device: "10.0.0.42 (Mobile)" },
                    ].map((log, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 font-medium text-slate-600">{log.time}</td>
                        <td className="px-8 py-5 font-bold text-slate-900">{log.user}</td>
                        <td className="px-8 py-5">
                          <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-700 bg-slate-50">{log.action}</Badge>
                        </td>
                        <td className="px-8 py-5 text-right font-mono text-[10px] text-slate-400">{log.device}</td>
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