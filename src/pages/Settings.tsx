"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import BackButton from '@/components/ui/BackButton';
import { 
  Settings as SettingsIcon, 
  Plus, 
  Trash2,
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
  FileBadge
} from 'lucide-react';
import { showSuccess } from '@/utils/toast';

const SETTINGS_STORAGE_KEY = 'munyaka_system_config';

const Settings = () => {
  const [isSaving, setIsSaving] = useState(false);
  
  // Settings State
  const [config, setConfig] = useState({
    schoolName: "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
    postalAddress: "P.O. BOX 5239-30100 ELDORET",
    motto: "KNOWLEDGE IS POWER",
    phone: "+254 712 345 678",
    email: "info@munyaka.sc.ke",
    location: "Munyaka, Eldoret East, Uasin Gishu County",
    maintenanceMode: false
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        setConfig(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(config));
    setIsSaving(false);
    showSuccess("Institutional configuration updated successfully!");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Configuration</h1>
            <p className="text-muted-foreground">Tailor the system to Munyaka Primary's specific needs and academic structure.</p>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="rounded-2xl px-10 h-14 font-black shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700"
        >
          {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
          Apply All Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-12 mb-8">
          <TabsTrigger value="general" className="rounded-xl px-6 h-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold text-xs">General</TabsTrigger>
          <TabsTrigger value="academic" className="rounded-xl px-6 h-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold text-xs">Academic Setup</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl px-6 h-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold text-xs">Users & Roles</TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-6 h-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold text-xs">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-8">
          {/* 1. Institutional Profile Section */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                  <School size={24} />
                </div>
                <div>
                  <CardTitle className="text-xl">Institutional Profile</CardTitle>
                  <CardDescription>Official school identity details used for reports and communication.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Official School Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <Input 
                      value={config.schoolName}
                      onChange={(e) => setConfig({...config, schoolName: e.target.value})}
                      className="rounded-xl h-12 pl-12 bg-slate-50/50 border-slate-100 font-bold focus:bg-white" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Postal Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <Input 
                      value={config.postalAddress}
                      onChange={(e) => setConfig({...config, postalAddress: e.target.value})}
                      className="rounded-xl h-12 pl-12 bg-slate-50/50 border-slate-100 font-bold focus:bg-white" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Motto / Slogan</Label>
                  <div className="relative">
                    <Quote className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <Input 
                      value={config.motto}
                      onChange={(e) => setConfig({...config, motto: e.target.value})}
                      className="rounded-xl h-12 pl-12 bg-slate-50/50 border-slate-100 font-bold focus:bg-white italic" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Contact Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <Input 
                        value={config.phone}
                        onChange={(e) => setConfig({...config, phone: e.target.value})}
                        className="rounded-xl h-12 pl-12 bg-slate-50/50 border-slate-100 font-bold focus:bg-white" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Official Email</Label>
                    <Input 
                      value={config.email}
                      onChange={(e) => setConfig({...config, email: e.target.value})}
                      className="rounded-xl h-12 bg-slate-50/50 border-slate-100 font-bold focus:bg-white" 
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Physical Location Description</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-slate-300" size={18} />
                  <Textarea 
                    value={config.location}
                    onChange={(e) => setConfig({...config, location: e.target.value})}
                    placeholder="Describe the school location, county, or landmarks..."
                    className="rounded-xl min-h-[100px] pl-12 pt-3.5 bg-slate-50/50 border-slate-100 font-medium focus:bg-white" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Branding & Assets Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-8 border-b bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                    <FileBadge size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Institutional Branding</CardTitle>
                    <CardDescription>Manage your school logo and visual identity for reports.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-32 h-32 rounded-3xl bg-slate-100 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 text-slate-400 shrink-0">
                    <ImageIcon size={32} strokeWidth={1.5} />
                    <span className="text-[10px] font-bold mt-2 uppercase tracking-tighter">Current Logo</span>
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                      <p className="text-sm font-bold text-indigo-900 mb-1">Recommended Format</p>
                      <p className="text-xs text-indigo-700/80 leading-relaxed">
                        Please upload a transparent PNG or high-quality JPG. Suggested size is 512x512px. This logo will appear on all system-generated Report Cards.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="rounded-xl h-11 px-6 font-bold border-slate-200">
                        <UploadCloud size={18} className="mr-2" /> Upload New Logo
                      </Button>
                      <Button variant="ghost" className="rounded-xl h-11 px-6 font-bold text-rose-500 hover:bg-rose-50">
                        <Trash2 size={18} className="mr-2" /> Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[2.5rem] bg-indigo-900 text-white p-8 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute right-[-20px] top-[-20px] opacity-10 pointer-events-none">
                <SettingsIcon size={120} />
              </div>
              <div>
                <CardTitle className="text-lg mb-2">Maintenance Mode</CardTitle>
                <p className="text-sm text-indigo-200/80 leading-relaxed mb-6">
                  Activating this will block all staff and student access to the portal while you perform updates or changes.
                </p>
              </div>
              <div className="flex items-center justify-between bg-white/10 p-4 rounded-2xl border border-white/10">
                <span className="font-bold">Status: {config.maintenanceMode ? "ACTIVE" : "OFF"}</span>
                <Switch 
                  checked={config.maintenanceMode}
                  onCheckedChange={(val) => setConfig({...config, maintenanceMode: val})}
                  className="data-[state=checked]:bg-emerald-500" 
                />
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="academic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Learning Areas (CBC)</CardTitle>
                  <CardDescription>Manage active subjects per grade level.</CardDescription>
                </div>
                <Button size="sm" variant="ghost" className="text-indigo-600 rounded-xl font-bold">
                  <Plus size={16} className="mr-1" /> Add New
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {['Mathematics', 'English Language', 'Kiswahili', 'Science & Tech', 'Agriculture'].map(subject => (
                    <div key={subject} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="font-bold text-slate-700">{subject}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Class Streams</CardTitle>
                  <CardDescription>Configure group names for student categorization.</CardDescription>
                </div>
                <Button size="sm" variant="ghost" className="text-emerald-600 rounded-xl font-bold">
                  <Plus size={16} className="mr-1" /> Add Stream
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {['Blue (A)', 'Green (B)', 'Alpha (C)', 'Beta (D)'].map(stream => (
                    <div key={stream} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                      <span className="font-bold text-slate-700">{stream}</span>
                      <div className="flex gap-4 items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase">32 Learners</span>
                        <Button variant="ghost" size="icon" className="text-slate-300">
                          <SettingsIcon size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;