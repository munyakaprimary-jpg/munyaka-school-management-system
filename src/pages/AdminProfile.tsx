"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Shield, Key, Bell, LogOut, Camera } from 'lucide-react';

const AdminProfile = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <Card className="w-full md:w-80 border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden p-8 text-center shrink-0">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="w-full h-full rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-4xl font-black shadow-2xl shadow-indigo-200">
              AD
            </div>
            <Button size="icon" className="absolute bottom-[-10px] right-[-10px] rounded-2xl bg-white text-slate-900 shadow-lg border hover:bg-slate-50 h-10 w-10">
              <Camera size={18} />
            </Button>
          </div>
          <h2 className="text-xl font-bold text-slate-900">System Admin</h2>
          <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mt-1">Master Control</p>
          <div className="mt-8 space-y-2">
            <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl h-12 font-bold text-slate-500 hover:text-indigo-600">
              <Key size={18} /> Change Password
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl h-12 font-bold text-red-500 hover:bg-red-50 hover:text-red-600">
              <LogOut size={18} /> Log Out
            </Button>
          </div>
        </Card>

        <div className="flex-1 space-y-6 w-full">
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b">
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input defaultValue="Admin User" className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input defaultValue="admin@munyaka.sc.ke" className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input defaultValue="+254 700 000 000" className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <Input defaultValue="EMP-001" readOnly className="rounded-xl h-12 bg-slate-100 border-none cursor-not-allowed opacity-60" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Shield size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Security Status</p>
                <p className="text-xs text-slate-500">2-Factor Authentication is currently <span className="text-emerald-600 font-bold">Enabled</span>.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;