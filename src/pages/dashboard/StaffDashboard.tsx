"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useIdleTimer } from '@/hooks/useIdleTimer';
import { Shield, LogOut, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  useIdleTimer(); // 10-minute idle tracker active

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30">
      
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 h-16 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-950/80 border border-blue-500/30 text-blue-400">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="font-black text-sm text-white tracking-tight leading-none">MUNYAKA OPERATIONS</h1>
            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">Support Staff Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-300">{user?.email}</span>
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold text-[10px]">STAFF</Badge>
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

      {/* Main Staff Workspace Placeholder */}
      <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold px-3 py-1">
                AUTHORIZED WORKSPACE
              </Badge>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock size={14} className="text-blue-400" />
                <span>10-Min Idle Protection Active</span>
              </div>
            </div>

            <h2 className="text-2xl font-black text-white">Welcome, Support Staff Member</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              You are authenticated with role <strong className="text-blue-400">STAFF</strong>. You have access to authorized support workspace modules.
            </p>
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800 rounded-2xl p-6">
          <CardHeader className="p-0 mb-2">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 size={16} className="text-blue-400" /> Active Session State
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-xs text-slate-400">
            User email pre-authorization confirmed in closed-loop database.
          </CardContent>
        </Card>

      </main>
    </div>
  );
};

export default StaffDashboard;