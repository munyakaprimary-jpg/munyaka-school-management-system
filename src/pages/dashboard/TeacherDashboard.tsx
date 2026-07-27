"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useIdleTimer } from '@/hooks/useIdleTimer';
import { GraduationCap, LogOut, Clock, CheckCircle2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  useIdleTimer(); // 10-minute idle tracker active

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30">
      
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 h-16 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="font-black text-sm text-white tracking-tight leading-none">MUNYAKA ACADEMICS</h1>
            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Teacher Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-300">{user?.email}</span>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold text-[10px]">TEACHER</Badge>
          </div>

          <Button 
            onClick={() => logout()} 
            variant="ghost" 
            className="rounded-xl h-9 px-3 text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 gap-2 border border-slate-800"
          >
            <LogOut size={15} /> Sign Out
          </Button>
        </div>
      </header>

      {/* Main Teacher Workspace Placeholder */}
      <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold px-3 py-1">
                AUTHORIZED WORKSPACE
              </Badge>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock size={14} className="text-emerald-400" />
                <span>10-Min Idle Protection Active</span>
              </div>
            </div>

            <h2 className="text-2xl font-black text-white">Welcome, Academic Instructor</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              You are authenticated with role <strong className="text-emerald-400">TEACHER</strong>. Attempting to access administrative routes (e.g. <code className="text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded">/admin/staff-and-roles</code>) will automatically trigger the route guard intercepter.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-slate-900 border-slate-800 rounded-2xl p-6">
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" /> Closed-Loop Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-xs text-slate-400">
              Account status is verified against authorized user list.
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 rounded-2xl p-6">
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Shield size={16} className="text-emerald-400" /> Stage 2 TOTP Passed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-xs text-slate-400">
              Session is encrypted with dual-stage token.
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
};

export default TeacherDashboard;