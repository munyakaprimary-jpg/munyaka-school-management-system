"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useIdleTimer } from '@/hooks/useIdleTimer';
import { Shield, UserPlus, Trash2, LogOut, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StaffAndRoles = () => {
  const { user, authorizedUsers, addAuthorizedUser, revokeAccess, logout } = useAuth();
  const navigate = useNavigate();
  useIdleTimer(); // Active 10-min idle tracker

  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('teacher');

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const ok = addAuthorizedUser(newEmail, newRole);
    if (ok) {
      setNewEmail('');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 font-bold text-[10px]">ADMINISTRATOR</Badge>;
      case 'teacher':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold text-[10px]">TEACHER</Badge>;
      case 'staff':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold text-[10px]">SUPPORT STAFF</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30">
      
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 h-16 px-6 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="font-black text-sm text-white tracking-tight leading-none">MUNYAKA CONTROL</h1>
            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Master Lifecycle Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-300">{user?.email}</span>
            {user?.role && getRoleBadge(user.role)}
          </div>

          <Button 
            onClick={handleSignOut} 
            className="rounded-xl h-9 px-4 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50 gap-2 border border-rose-500/30 transition-all shrink-0"
          >
            <LogOut size={15} /> Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">User Access Lifecycle & Pre-Authorizations</h2>
            <p className="text-xs text-slate-400 mt-1">Manage closed-loop registration list and role authorizations.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-400">
            <Clock size={14} className="text-emerald-400" />
            <span>10-Min Idle Expiry Protection Active</span>
          </div>
        </div>

        {/* 1. Explicit Inline Pre-Authorization Creation Form - PERMANENTLY VISIBLE */}
        <Card className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <UserPlus size={18} className="text-emerald-400" /> Authorize New User Email
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleAddSubmit} className="flex flex-col sm:flex-row gap-3 items-center">
              {/* Email Input */}
              <div className="flex-1 w-full">
                <input
                  type="email"
                  placeholder="Enter user email..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl h-11 px-4 text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-medium"
                />
              </div>

              {/* Role Dropdown Selector */}
              <div className="w-full sm:w-44">
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl h-11 px-3 text-xs text-slate-200 outline-none focus:border-emerald-500 font-semibold cursor-pointer"
                >
                  <option value="admin">admin</option>
                  <option value="teacher">teacher</option>
                  <option value="staff">staff</option>
                </select>
              </div>

              {/* Green Action Button */}
              <button
                type="submit"
                className="w-full sm:w-auto h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 px-6 flex items-center justify-center gap-2 shrink-0 transition-all"
              >
                <UserPlus size={16} /> Authorize Access
              </button>
            </form>
          </CardContent>
        </Card>

        {/* 2. Authorized User Tracking Matrix Table */}
        <Card className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <CardHeader className="p-6 border-b border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" /> Authorized User Tracking Matrix ({authorizedUsers.length})
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Email Address</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Assigned Role</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Authorized On</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {authorizedUsers.map((item) => {
                    const isMasterAdmin = item.email.toLowerCase() === 'admin@yourplatform.com';
                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                          {item.email}
                          {isMasterAdmin && (
                            <Badge className="bg-purple-500/20 text-purple-300 border-none text-[9px] font-black">
                              MASTER ADMIN
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">{getRoleBadge(item.role)}</td>
                        <td className="px-6 py-4 text-slate-400 font-mono">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            onClick={() => revokeAccess(item.id)}
                            disabled={isMasterAdmin}
                            variant="ghost"
                            size="sm"
                            className="rounded-xl h-8 px-3 text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <Trash2 size={14} className="mr-1.5" /> Revoke Access
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
};

export default StaffAndRoles;