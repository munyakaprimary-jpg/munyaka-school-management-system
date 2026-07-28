"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BackButton from '@/components/ui/BackButton';
import { 
  Settings as SettingsIcon, 
  Plus, 
  Trash2
} from 'lucide-react';

const Settings = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-3">
        <BackButton fallback="/" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Configuration</h1>
          <p className="text-muted-foreground">Tailor the system to Munyaka Primary's specific needs and academic structure.</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-12 mb-8">
          <TabsTrigger value="general" className="rounded-xl px-6 h-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold text-xs">General</TabsTrigger>
          <TabsTrigger value="academic" className="rounded-xl px-6 h-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold text-xs">Academic Setup</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl px-6 h-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold text-xs">Users & Roles</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-xl px-6 h-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold text-xs">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle>School Profile</CardTitle>
              <CardDescription>Public identity details for official document headers.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>School Name</Label>
                <Input defaultValue="Munyaka Primary and Junior School" className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
              </div>
              <div className="space-y-2">
                <Label>School Code / Registration No.</Label>
                <Input defaultValue="PS/2024/0042" className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
              </div>
              <div className="space-y-2">
                <Label>Physical Location</Label>
                <Input defaultValue="Munyaka, Eldoret East" className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
              </div>
              <div className="space-y-2">
                <Label>Official Contact</Label>
                <Input defaultValue="+254 712 345 678" className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Maintenance Mode</CardTitle>
                <p className="text-sm text-muted-foreground">Temporarily disable portal access for regular users during updates.</p>
              </div>
              <Switch />
            </div>
          </Card>
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

      <div className="flex justify-end pt-4">
        <Button className="rounded-2xl px-10 h-14 font-black shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700">
          Apply All Changes
        </Button>
      </div>
    </div>
  );
};

export default Settings;