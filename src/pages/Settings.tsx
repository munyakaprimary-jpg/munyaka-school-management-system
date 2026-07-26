"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Shield, Bell, Palette, Globe, Database, Save, Plus } from 'lucide-react';
import { showSuccess } from "@/utils/toast";

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="text-muted-foreground">Configure school system preferences and settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-1">
            <TabsList className="grid grid-cols-5 gap-2 bg-slate-100 p-2 rounded-2xl">
              <TabsTrigger value="general" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">General</TabsTrigger>
              <TabsTrigger value="academic" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Academic</TabsTrigger>
              <TabsTrigger value="notifications" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Notifications</TabsTrigger>
              <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Security</TabsTrigger>
              <TabsTrigger value="integrations" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Integrations</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsContent value="general">
              <Card className="border-none shadow-sm rounded-3xl bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">General Settings</CardTitle>
                  <CardDescription>Manage school information and basic preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>School Name</Label>
                      <Input defaultValue="Munyaka Primary & Junior School" className="rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label>Academic Year</Label>
                      <Select defaultValue="2024-2025">
                        <SelectTrigger className="rounded-xl h-12">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024-2025">2024 - 2025</SelectItem>
                          <SelectItem value="2023-2024">2023 - 2024</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Current Term</Label>
                      <Select defaultValue="term1">
                        <SelectTrigger className="rounded-xl h-12">
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="term1">Term 1</SelectItem>
                          <SelectItem value="term2">Term 2</SelectItem>
                          <SelectItem value="term3">Term 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>School Code</Label>
                      <Input defaultValue="MUNY-PRIMARY" className="rounded-xl h-12" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="academic">
              <Card className="border-none shadow-sm rounded-3xl bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">Academic Settings</CardTitle>
                  <CardDescription>Configure grading systems, subjects, and learning areas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Grading System</Label>
                      <Select defaultValue="cbse">
                        <SelectTrigger className="rounded-xl h-12">
                          <SelectValue placeholder="Select system" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cbse">CBSE</SelectItem>
                          <SelectItem value="igcse">IGCSE</SelectItem>
                          <SelectItem value="local">Local Curriculum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Attendance Policy</Label>
                      <Select defaultValue="strict">
                        <SelectTrigger className="rounded-xl h-12">
                          <SelectValue placeholder="Select policy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="strict">Strict (90%)</SelectItem>
                          <SelectItem value="lenient">Lenient (80%)</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900">Enable Learning Areas</p>
                      <p className="text-sm text-slate-500">Allow teachers to manage learning areas</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="border-none shadow-sm rounded-3xl bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">Notification Settings</CardTitle>
                  <CardDescription>Configure how and when notifications are sent.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">SMS Notifications</p>
                        <p className="text-sm text-slate-500">Send SMS alerts to parents</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">Email Notifications</p>
                        <p className="text-sm text-slate-500">Send email updates to staff</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">Push Notifications</p>
                        <p className="text-sm text-slate-500">Enable in-app notifications</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="border-none shadow-sm rounded-3xl bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">Security Settings</CardTitle>
                  <CardDescription>Manage account security and access controls.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">Two-Factor Authentication</p>
                        <p className="text-sm text-slate-500">Add an extra layer of security</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">Auto Lock After Inactivity</p>
                        <p className="text-sm text-slate-500">Lock after 30 minutes of inactivity</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations">
              <Card className="border-none shadow-sm rounded-3xl bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">Integrations</CardTitle>
                  <CardDescription>Connect with external services and APIs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Globe size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-900">Google Workspace</p>
              <p className="text-sm text-slate-500">Sync calendars and documents</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700">Connected</Badge>
        </div>
        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Database size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-900">SMS Gateway</p>
              <p className="text-sm text-slate-500">Send SMS to parents and staff</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-700">Not Connected</Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</TabsContent>
</Tabs>
</div>
</div>

<div className="flex justify-end">
<Button className="rounded-2xl px-10 h-14 font-black shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700" onClick={() => showSuccess('Settings applied!')}>
<Save size={18} className="mr-2" />
Apply All Changes
</Button>
</div>
</div>
);
};

export default Settings;