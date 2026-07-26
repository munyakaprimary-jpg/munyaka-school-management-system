"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  School, 
  Users, 
  BookOpen 
} from 'lucide-react';

const Settings = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Settings</h1>
        <p className="text-muted-foreground">Configure global parameters and school-wide preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-1">
          {[
            { label: 'General', icon: School, active: true },
            { label: 'Learning Areas', icon: BookOpen, active: false },
            { label: 'Users & Roles', icon: Users, active: false },
            { label: 'Notifications', icon: Bell, active: false },
            { label: 'Security', icon: Shield, active: false },
          ].map((item) => (
            <Button 
              key={item.label}
              variant="ghost" 
              className={`w-full justify-start gap-3 h-12 rounded-2xl font-bold ${item.active ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
            >
              <item.icon size={18} />
              {item.label}
            </Button>
          ))}
        </aside>

        <div className="lg:col-span-3 space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle>School Information</CardTitle>
              <CardDescription>Public details used for report cards and official documents.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>School Name</Label>
                  <Input defaultValue="Munyaka Primary and Junior School" className="rounded-xl h-12 border-slate-100 bg-slate-50/50" />
                </div>
                <div className="space-y-2">
                  <Label>Postal Address</Label>
                  <Input defaultValue="P.O. Box 5239-30100 Eldoret" className="rounded-xl h-12 border-slate-100 bg-slate-50/50" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input defaultValue="+254 712 345 678" className="rounded-xl h-12 border-slate-100 bg-slate-50/50" />
                </div>
                <div className="space-y-2">
                  <Label>Official Email</Label>
                  <Input defaultValue="info@munyakaprimary.ac.ke" className="rounded-xl h-12 border-slate-100 bg-slate-50/50" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle>Academic Configuration</CardTitle>
              <CardDescription>Manage terms and assessment weightage.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900">Current Academic Term</p>
                  <p className="text-xs text-slate-500">All data recorded will be tagged to this term.</p>
                </div>
                <Badge className="bg-indigo-600 px-4 py-1.5 rounded-full">Term 1, 2024</Badge>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900">Auto-generate Assessment Numbers</p>
                  <p className="text-xs text-slate-500">Automatically assign unique IDs to new students.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
            <div className="p-8 pt-0 flex justify-end">
              <Button className="rounded-xl px-8 shadow-lg shadow-indigo-100">Save Changes</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;