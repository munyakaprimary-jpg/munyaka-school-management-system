"use client";

import React, { useState, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';

const SETTINGS_STORAGE_KEY = 'munyaka_system_config';
const ACADEMIC_STORAGE_KEY = 'munyaka_academic_config';

const Settings = () => {
  const [isSaving, setIsSaving] = useState(false);
  
  // General Settings State
  const [generalConfig, setGeneralConfig] = useState({
    schoolName: "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
    postalAddress: "P.O. BOX 5239-30100 ELDORET",
    motto: "KNOWLEDGE IS POWER",
    phone: "+254 712 345 678",
    email: "info@munyaka.sc.ke",
    location: "Munyaka, Eldoret East, Uasin Gishu County",
    maintenanceMode: false
  });

  // Academic Setup State
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

  // Load from localStorage
  useEffect(() => {
    const savedGeneral = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const savedAcademic = localStorage.getItem(ACADEMIC_STORAGE_KEY);
    
    if (savedGeneral) setGeneralConfig(prev => ({ ...prev, ...JSON.parse(savedGeneral) }));
    if (savedAcademic) setAcademicConfig(prev => ({ ...prev, ...JSON.parse(savedAcademic) }));
  }, []);

  const handleSaveAll = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(generalConfig));
    localStorage.setItem(ACADEMIC_STORAGE_KEY, JSON.stringify(academicConfig));
    
    setIsSaving(false);
    showSuccess("System configuration and Academic setup updated successfully!");
  };

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
            <p className="text-muted-foreground">Manage institutional identity and academic frameworks.</p>
          </div>
        </div>
        <Button 
          onClick={handleSaveAll} 
          disabled={isSaving}
          className="rounded-[1.5rem] px-10 h-14 font-black shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700"
        >
          {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
          Save Configuration
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-12 mb-8">
          <TabsTrigger value="general" className="rounded-xl px-8 h-full font-bold text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">General</TabsTrigger>
          <TabsTrigger value="academic" className="rounded-xl px-8 h-full font-bold text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Academic Setup</TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-8 h-full font-bold text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Security</TabsTrigger>
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
          
          {/* 1. Calendar & Term */}
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

          {/* 2. Grades & Streams */}
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

          {/* 3. CBC 8-Tier Grading */}
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

          {/* 4. Subject Manager */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b bg-slate-50/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
                    <BookOpen size={24} />
                  </div>
                  <CardTitle className="text-xl">Subject & Learning Area Registry</CardTitle>
                </div>
                <Button className="rounded-xl bg-slate-900 text-white font-bold h-11 px-6 shadow-lg shadow-slate-200">
                  <Plus size={18} className="mr-2" /> Add Learning Area
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {academicConfig.subjects.map((subj, i) => (
                  <div key={i} className="px-8 py-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-6">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <div>
                        <h4 className="font-bold text-slate-900">{subj.name}</h4>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-0.5">{subj.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          id={`comp-${i}`} 
                          checked={subj.compulsory} 
                          onCheckedChange={(v) => {
                            const newSubjs = [...academicConfig.subjects];
                            newSubjs[i].compulsory = !!v;
                            setAcademicConfig({...academicConfig, subjects: newSubjs});
                          }}
                          className="rounded-md"
                        />
                        <Label htmlFor={`comp-${i}`} className="text-xs font-bold text-slate-500 cursor-pointer">Compulsory</Label>
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-xl text-slate-300 hover:text-red-500">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="animate-in fade-in zoom-in-95 duration-300">
           <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-12 text-center">
             <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
               <FileBadge size={40} />
             </div>
             <h3 className="text-xl font-bold text-slate-900">Security Policies</h3>
             <p className="text-slate-400 text-sm max-w-sm mx-auto mt-2">Administrative credentials and data access policies are managed in the User Management portal.</p>
             <Button variant="outline" className="mt-8 rounded-xl h-12 px-8 font-black gap-2 border-slate-200">
               Go to User Management <ChevronRight size={16} />
             </Button>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;