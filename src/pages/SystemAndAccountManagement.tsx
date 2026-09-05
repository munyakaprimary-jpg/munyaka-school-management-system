"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import BackButton from '@/components/ui/BackButton';
import Modal from '@/components/ui/Modal';
import {
  Users,
  Wifi,
  Calendar,
  ShieldCheck,
  UserPlus,
  Key,
  Lock,
  Search,
  Cpu,
  Activity,
  Globe,
  Clock,
  MoreVertical,
  Ban,
  RefreshCw,
  HardDrive,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Monitor,
  Plus,
  Download,
  Upload,
  Database,
  FileJson,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { notifyDataChanged, downloadDatabaseBackup, parseAndImportBackup } from '@/utils/storage';
import { cn } from '@/lib/utils';

// --- Types ---
interface SystemUser {
  id: string;
  name: string;
  role: 'Teacher' | 'Student' | 'Admin' | 'Lab Tech';
  username: string;
  lastLogin: string;
  status: 'Active' | 'Disabled';
}

interface NetworkDevice {
  id: string;
  mac: string;
  owner: string;
  role: string;
  quota: number; // in GB
  used: number; // in GB
  status: 'Online' | 'Offline';
}

interface LabReservation {
  id: string;
  day: string;
  time: string;
  grade: string;
  subject: string;
  teacher: string;
  room: string;
  status: 'Upcoming' | 'In Session' | 'Completed';
}

// --- Storage Keys ---
const SYSTEM_USERS_KEY = 'munyaka_system_users';
const SYSTEM_DEVICES_KEY = 'munyaka_system_devices';
const LAB_RESERVATIONS_KEY = 'munyaka_lab_reservations';

// --- Default Seed Data (used only when localStorage is empty) ---
const DEFAULT_USERS: SystemUser[] = [
  { id: "USR-001", name: "Grace Njeri", role: "Admin", username: "grace.njeri@munyaka.sc.ke", lastLogin: "10 mins ago", status: "Active" },
  { id: "USR-042", name: "John Kamau", role: "Teacher", username: "john.kamau", lastLogin: "2 hours ago", status: "Active" },
  { id: "USR-108", name: "Brian Kiptoo", role: "Student", username: "A827361", lastLogin: "Yesterday", status: "Active" },
  { id: "USR-005", name: "Peter Omondi", role: "Lab Tech", username: "peter.tech", lastLogin: "Just now", status: "Disabled" },
];

const DEFAULT_DEVICES: NetworkDevice[] = [
  { id: "DEV-1", mac: "00:1A:2B:3C:4D:5E", owner: "ICT Lab Main", role: "Infrastructure", quota: 50, used: 32.4, status: "Online" },
  { id: "DEV-2", mac: "A1:B2:C3:D4:E5:F6", owner: "Jane Mwangi", role: "Teacher", quota: 2.0, used: 1.1, status: "Online" },
  { id: "DEV-3", mac: "11:22:33:44:55:66", owner: "Staff Room Guest", role: "Guest", quota: 0.5, used: 0.45, status: "Online" },
  { id: "DEV-4", mac: "99:88:77:66:55:44", owner: "Tablets Cart A", role: "Student", quota: 10, used: 2.5, status: "Offline" },
];

const DEFAULT_RESERVATIONS: LabReservation[] = [
  { id: "RES-01", day: "Monday", time: "08:00 AM - 09:30 AM", grade: "Grade 7 Alpha", subject: "Digital Literacy", teacher: "Mr. Omondi", room: "Main Lab", status: "Completed" },
  { id: "RES-02", day: "Wednesday", time: "11:00 AM - 12:30 PM", grade: "Grade 4 Blue", subject: "Creative Arts", teacher: "Ms. Mwangi", room: "Main Lab", status: "In Session" },
  { id: "RES-03", day: "Friday", time: "02:00 PM - 03:30 PM", grade: "Grade 8 Beta", subject: "Pre-Tech", teacher: "Mr. Kamau", room: "Mini Lab", status: "Upcoming" },
];

const SystemAndAccountManagement = () => {
  const [activeTab, setActiveTab] = useState("logins");
  
  // --- States with localStorage persistence ---
  const [users, setUsers] = useState<SystemUser[]>(() => {
    try {
      const saved = localStorage.getItem(SYSTEM_USERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    localStorage.setItem(SYSTEM_USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  });

  const [devices, setDevices] = useState<NetworkDevice[]>(() => {
    try {
      const saved = localStorage.getItem(SYSTEM_DEVICES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    localStorage.setItem(SYSTEM_DEVICES_KEY, JSON.stringify(DEFAULT_DEVICES));
    return DEFAULT_DEVICES;
  });

  const [reservations, setReservations] = useState<LabReservation[]>(() => {
    try {
      const saved = localStorage.getItem(LAB_RESERVATIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    localStorage.setItem(LAB_RESERVATIONS_KEY, JSON.stringify(DEFAULT_RESERVATIONS));
    return DEFAULT_RESERVATIONS;
  });

  // --- Persist to localStorage on changes ---
  useEffect(() => {
    try { localStorage.setItem(SYSTEM_USERS_KEY, JSON.stringify(users)); notifyDataChanged('munyaka_system_users'); } catch { /* ignore */ }
  }, [users]);

  useEffect(() => {
    try { localStorage.setItem(SYSTEM_DEVICES_KEY, JSON.stringify(devices)); notifyDataChanged('munyaka_network_devices'); } catch { /* ignore */ }
  }, [devices]);

  useEffect(() => {
    try { localStorage.setItem(LAB_RESERVATIONS_KEY, JSON.stringify(reservations)); notifyDataChanged('munyaka_lab_reservations'); } catch { /* ignore */ }
  }, [reservations]);

  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isReserveOpen, setIsReserveOpen] = useState(false);

  // ── Database Backup State ───────────────────────────────────────────────────
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreResult, setRestoreResult] = useState<{
    success: boolean;
    keysRestored: string[];
    errors: string[];
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // --- Summary Calculations ---
  const userStats = {
    total: users.length,
    teachers: users.filter(u => u.role === 'Teacher').length,
    students: users.filter(u => u.role === 'Student').length,
    suspended: users.filter(u => u.status === 'Disabled').length
  };

  const networkStats = {
    bandwidth: "142.5 GB",
    active: devices.filter(d => d.status === 'Online').length,
    quotaAvg: "2.5 GB"
  };

  // --- Handlers ---
  const handleToggleUserStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Disabled' : 'Active' } : u));
    showSuccess("User account status updated.");
  };

  const handleResetPassword = (name: string) => {
    showSuccess(`Temporary password generated and sent to ${name}.`);
  };

  const handleAdjustQuota = (owner: string) => {
    showSuccess(`Quota adjustment interface opened for ${owner}.`);
  };

  const handleCancelBooking = (id: string) => {
    setReservations(prev => prev.filter(r => r.id !== id));
    showSuccess("Lab reservation cancelled.");
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const nameInput = form.querySelector<HTMLInputElement>('input[name="fullName"]');
    const roleInput = form.querySelector<HTMLSelectElement>('select[name="role"]');
    const usernameInput = form.querySelector<HTMLInputElement>('input[name="username"]');

    const newUser: SystemUser = {
      id: `USR-${Math.floor(Math.random() * 900) + 100}`,
      name: nameInput?.value || "New User Account",
      role: (roleInput?.value || "Teacher") as SystemUser['role'],
      username: usernameInput?.value || "new.user",
      lastLogin: "Never",
      status: "Active"
    };
    setUsers(prev => [newUser, ...prev]);
    setIsAddUserOpen(false);
    showSuccess("User account provisioned successfully.");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">System Management</h1>
            <p className="text-muted-foreground font-medium">Manage portal security, network access, and ICT infrastructure.</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-14 mb-8 flex w-fit overflow-x-auto">
          <TabsTrigger value="logins" className="rounded-xl px-8 h-full font-bold text-xs gap-2">
            <ShieldCheck size={16} /> Portal Logins
          </TabsTrigger>
          <TabsTrigger value="network" className="rounded-xl px-8 h-full font-bold text-xs gap-2">
            <Wifi size={16} /> Network & Quotas
          </TabsTrigger>
          <TabsTrigger value="lab" className="rounded-xl px-8 h-full font-bold text-xs gap-2">
            <Monitor size={16} /> Lab Schedules
          </TabsTrigger>
          <TabsTrigger value="backup" className="rounded-xl px-8 h-full font-bold text-xs gap-2">
            <Database size={16} /> Database Backup
          </TabsTrigger>
        </TabsList>

        {/* --- TAB 1: PORTAL LOGINS --- */}
        <TabsContent value="logins" className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: userStats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Active Teachers', value: userStats.teachers, icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Active Students', value: userStats.students, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Suspended', value: userStats.suspended, icon: Ban, color: 'text-rose-600', bg: 'bg-rose-50' },
            ].map((s, i) => (
              <Card key={i} className="border-none shadow-sm rounded-[2rem] bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-2xl", s.bg)}>
                    <s.icon className={s.color} size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p>
                    <h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{s.value}</h3>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-5">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex flex-1 gap-4 w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    placeholder="Search by name or email..." 
                    className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px] h-12 rounded-2xl bg-slate-50 border-none font-bold">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="Admin">Administrators</SelectItem>
                    <SelectItem value="Teacher">Teachers</SelectItem>
                    <SelectItem value="Student">Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-100"
                onClick={() => setIsAddUserOpen(true)}
              >
                <UserPlus size={18} /> Add User Account
              </Button>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left min-w-[800px]">
                  <thead className="text-slate-500 border-b bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">User Identity</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Role</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Username / Email</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Last Login</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Status</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{user.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ID: {user.id}</p>
                        </td>
                        <td className="px-8 py-5">
                          <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-600 font-bold px-2.5 py-0.5">{user.role}</Badge>
                        </td>
                        <td className="px-8 py-5 font-medium text-slate-600">{user.username}</td>
                        <td className="px-8 py-5 font-medium text-slate-400 italic">{user.lastLogin}</td>
                        <td className="px-8 py-5 text-center">
                          <Badge className={cn("rounded-xl border-none font-bold text-[10px] uppercase px-3 py-1", 
                            user.status === 'Active' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600")}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="rounded-xl h-9 px-3 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 gap-1.5"
                              onClick={() => handleResetPassword(user.name)}
                            >
                              <Key size={14} /> Reset
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={cn("rounded-xl h-9 w-9", user.status === 'Active' ? "text-rose-500 hover:bg-rose-50" : "text-emerald-600 hover:bg-emerald-50")}
                              onClick={() => handleToggleUserStatus(user.id)}
                            >
                              {user.status === 'Active' ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 2: NETWORK USAGE --- */}
        <TabsContent value="network" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm rounded-3xl bg-indigo-600 text-white p-8 relative overflow-hidden">
              <div className="absolute right-[-10px] top-[-10px] opacity-10"><Wifi size={120} /></div>
              <p className="text-xs font-black uppercase tracking-widest text-indigo-200">Daily Bandwidth Used</p>
              <h3 className="text-4xl font-black mt-2">{networkStats.bandwidth}</h3>
              <p className="text-xs font-medium text-indigo-200 mt-4 flex items-center gap-1"><HardDrive size={12} /> Safaricom Fiber Connection</p>
            </Card>
            <Card className="border-none shadow-sm rounded-3xl bg-white p-8">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Active Devices</p>
              <h3 className="text-4xl font-black text-slate-900 mt-2">{networkStats.active}</h3>
              <p className="text-xs font-bold text-emerald-600 mt-4 flex items-center gap-1"><Activity size={12} /> Real-time Monitoring</p>
            </Card>
            <Card className="border-none shadow-sm rounded-3xl bg-white p-8">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Avg. Daily Quota</p>
              <h3 className="text-4xl font-black text-slate-900 mt-2">{networkStats.quotaAvg}</h3>
              <p className="text-xs font-bold text-slate-400 mt-4 flex items-center gap-1"><ShieldCheck size={12} /> Security Policies Active</p>
            </Card>
          </div>

          <div className="flex justify-between items-center bg-white p-5 rounded-[2rem] shadow-sm border-none">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 text-indigo-600 rounded-2xl"><Globe size={24} /></div>
              <div>
                <h4 className="font-bold text-slate-900">Network Access Control</h4>
                <p className="text-xs text-slate-400">Manage individual device quotas and connection status.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl border-slate-200 font-bold gap-2 text-rose-600 hover:bg-rose-50"><Ban size={16} /> Revoke Guest Access</Button>
              <Button variant="outline" className="rounded-xl border-slate-200 font-bold gap-2"><RefreshCw size={16} /> Reset All Quotas</Button>
            </div>
          </div>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left min-w-[900px]">
                  <thead className="text-slate-500 border-b bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">MAC / IP Address</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Owner & Role</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Data Usage (Current vs Quota)</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Status</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {devices.map((dev) => {
                      const usagePct = (dev.used / dev.quota) * 100;
                      return (
                        <tr key={dev.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6">
                            <p className="font-mono font-bold text-slate-700">{dev.mac}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">IP: 192.168.1.{Math.floor(Math.random() * 254)}</p>
                          </td>
                          <td className="px-8 py-6">
                            <p className="font-bold text-slate-900">{dev.owner}</p>
                            <p className="text-xs font-medium text-slate-400">{dev.role}</p>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1.5 max-w-[200px]">
                              <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                                <span>{dev.used.toFixed(1)} GB / {dev.quota.toFixed(1)} GB</span>
                                <span className={cn(usagePct > 90 ? "text-rose-600" : "text-indigo-600")}>{Math.round(usagePct)}%</span>
                              </div>
                              <Progress value={usagePct} className={cn("h-1.5", usagePct > 90 && "[&>div]:bg-rose-500")} />
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <Badge className={cn("rounded-full h-2.5 w-2.5 p-0 border-none", dev.status === 'Online' ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} title={dev.status} />
                            <span className="text-[10px] font-bold text-slate-400 uppercase ml-2">{dev.status}</span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="rounded-xl h-9 px-4 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                              onClick={() => handleAdjustQuota(dev.owner)}
                            >
                              Adjust Quota
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
        </TabsContent>

        {/* --- TAB 3: LAB SCHEDULES --- */}
        <TabsContent value="lab" className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 action-bar">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Calendar size={24} /></div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">ICT Lab Reservations</h4>
                <p className="text-sm text-slate-400 font-medium">Coordinate shared digital classroom resources.</p>
              </div>
            </div>
            <Button 
              className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-100"
              onClick={() => setIsReserveOpen(true)}
            >
              <Plus size={20} /> Reserve Lab Slot
            </Button>
          </div>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left min-w-[800px]">
                  <thead className="text-slate-500 border-b bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Day & Time Slot</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Class / Subject</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Teacher in Charge</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Location</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Status</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reservations.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <p className="font-bold text-slate-900">{res.day}</p>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mt-1">
                            <Clock size={12} /> {res.time}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="font-bold text-slate-800">{res.grade}</p>
                          <p className="text-xs font-medium text-indigo-500">{res.subject}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 font-bold text-slate-600">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-500">
                              {res.teacher.split(' ').map(n => n[0]).join('')}
                            </div>
                            {res.teacher}
                          </div>
                        </td>
                        <td className="px-8 py-6 font-bold text-slate-500">{res.room}</td>
                        <td className="px-8 py-6 text-center">
                          <Badge className={cn("rounded-lg border-none font-bold text-[10px] uppercase px-3 py-1", 
                            res.status === 'Completed' ? "bg-slate-100 text-slate-500" : 
                            res.status === 'In Session' ? "bg-amber-50 text-amber-700 animate-pulse" : "bg-indigo-50 text-indigo-700")}>
                            {res.status}
                          </Badge>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-xl h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-rose-50"
                            onClick={() => handleCancelBooking(res.id)}
                            disabled={res.status === 'Completed'}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 4: DATABASE BACKUP --- */}
        <TabsContent value="backup" className="space-y-8">
          {/* Page header */}
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Database size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Database Backup &amp; Restore</h3>
              <p className="text-sm text-slate-400 font-medium">
                Export all school data as a JSON file or restore from a previously saved backup.
              </p>
            </div>
          </div>

          {/* Export Card */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Download size={20} />
                  </div>
                  <h4 className="font-black text-slate-900 text-lg">Export / Backup Database</h4>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Downloads a complete JSON snapshot of all local data — students, staff, fees, attendance,
                  grades, settings, and more. Save this file to transfer data between the web app and
                  the Android APK.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {['Students', 'Staff', 'Fees', 'Attendance', 'Grades', 'Settings'].map((tag) => (
                    <Badge key={tag} className="rounded-lg bg-slate-100 text-slate-500 font-bold text-[10px] border-none px-2.5 py-0.5">
                      {tag}
                    </Badge>
                  ))}
                  <Badge className="rounded-lg bg-indigo-50 text-indigo-600 font-bold text-[10px] border-none px-2.5 py-0.5">
                    + more
                  </Badge>
                </div>
              </div>
              <Button
                className="shrink-0 h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-lg shadow-emerald-100"
                onClick={() => {
                  setIsExporting(true);
                  try {
                    downloadDatabaseBackup();
                    showSuccess('Database backup downloaded successfully!');
                  } catch {
                    showError('Failed to export database. Please try again.');
                  } finally {
                    setIsExporting(false);
                  }
                }}
                disabled={isExporting}
              >
                {isExporting ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Download size={18} />
                )}
                {isExporting ? 'Preparing...' : 'Export JSON Backup'}
              </Button>
            </div>
          </Card>

          {/* Import Card */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Upload size={20} />
                  </div>
                  <h4 className="font-black text-slate-900 text-lg">Restore / Import Database</h4>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Replaces all local data with the contents of a previously exported JSON backup file.
                  This action <strong>overwrites</strong> existing data — use with caution.
                </p>
                <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 rounded-xl">
                  <AlertCircle size={16} className="text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">
                    Importing a backup will replace all current records. Make sure to export your current data first.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="shrink-0 h-14 px-8 rounded-2xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold gap-2"
                onClick={() => {
                  setRestoreResult(null);
                  setIsRestoreOpen(true);
                }}
              >
                <Upload size={18} />
                Import from JSON
              </Button>
            </div>
          </Card>

          {/* Format info */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-slate-50 p-6">
            <div className="flex gap-4">
              <div className="p-2.5 bg-white text-indigo-500 rounded-xl h-fit">
                <FileJson size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Backup File Format</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The exported JSON file contains all localStorage data serialised as a single portable bundle.
                  It is a plain-text file that can be opened in any text editor or JSON viewer.
                  To restore, select the same file using the Import button above.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- MODALS --- */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Provision New User Account"
        description="Configure system access rights and initial security credentials."
        footer={<div className="flex gap-2 justify-end w-full"><Button variant="ghost" onClick={() => setIsAddUserOpen(false)} className="rounded-xl font-bold h-12 px-6">Cancel</Button><Button onClick={handleAddUser} className="rounded-xl bg-indigo-600 text-white font-bold h-12 px-8">Create User Account</Button></div>}
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label className="text-xs font-black uppercase text-slate-400">Full Name</Label><Input name="fullName" placeholder="e.g. Samuel Kamau" className="rounded-xl h-12 bg-slate-50 border-none font-bold" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-black uppercase text-slate-400">System Role</Label>
              <Select defaultValue="Teacher" name="role"><SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Teacher">Teacher</SelectItem><SelectItem value="Admin">Administrator</SelectItem><SelectItem value="Lab Tech">Lab Technician</SelectItem></SelectContent></Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs font-black uppercase text-slate-400">Username / Email</Label><Input name="username" placeholder="e.g. sam.kamau" className="rounded-xl h-12 bg-slate-50 border-none font-bold" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-black uppercase text-slate-400">Temporary Password</Label><div className="flex gap-2"><Input value="MUNYAKA_TEMP_2024" readOnly className="rounded-xl h-12 bg-slate-100 border-none font-black text-indigo-600 text-center" /><Button type="button" variant="outline" className="h-12 w-12 rounded-xl border-slate-200"><RefreshCw size={16} /></Button></div></div>
        </form>
      </Modal>

      <Modal
        isOpen={isReserveOpen}
        onClose={() => setIsReserveOpen(false)}
        title="ICT Lab Slot Reservation"
        description="Schedule dedicated lab time for class activities or digital assessments."
        footer={<div className="flex gap-2 justify-end w-full"><Button variant="ghost" onClick={() => setIsReserveOpen(false)} className="rounded-xl font-bold h-12 px-6">Cancel</Button><Button onClick={() => {setIsReserveOpen(false); showSuccess("Lab slot reserved.");}} className="rounded-xl bg-indigo-600 text-white font-bold h-12 px-8">Confirm Reservation</Button></div>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label className="text-xs font-black uppercase text-slate-400">Select Day</Label>
              <Select defaultValue="Monday"><SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Monday">Monday</SelectItem><SelectItem value="Tuesday">Tuesday</SelectItem><SelectItem value="Wednesday">Wednesday</SelectItem><SelectItem value="Thursday">Thursday</SelectItem><SelectItem value="Friday">Friday</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-black uppercase text-slate-400">Target Lab</Label>
              <Select defaultValue="Main Lab"><SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Main Lab">Main ICT Lab</SelectItem><SelectItem value="Mini Lab">Junior School Wing</SelectItem></SelectContent></Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs font-black uppercase text-slate-400">Time Interval</Label><Input placeholder="e.g. 09:40 AM - 10:30 AM" className="rounded-xl h-12 bg-slate-50 border-none font-bold" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label className="text-xs font-black uppercase text-slate-400">Grade Level</Label><Input placeholder="e.g. Grade 5" className="rounded-xl h-12 bg-slate-50 border-none font-bold" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-black uppercase text-slate-400">Subject / Purpose</Label><Input placeholder="e.g. Mathematics" className="rounded-xl h-12 bg-slate-50 border-none font-bold" /></div>
          </div>
        </div>
      </Modal>

      {/* Restore / Import Database Modal */}
      <Modal
        isOpen={isRestoreOpen}
        onClose={() => {
          setIsRestoreOpen(false);
          setRestoreResult(null);
          setRestoreFile(null);
        }}
        title="Restore Database from Backup"
        description="Select a previously exported JSON backup file to restore all school data."
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button
              variant="ghost"
              onClick={() => {
                setIsRestoreOpen(false);
                setRestoreResult(null);
                setRestoreFile(null);
              }}
              className="rounded-xl font-bold h-12 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!restoreFile) {
                  showError('Please select a JSON backup file first.');
                  return;
                }
                setIsRestoring(true);
                setRestoreResult(null);
                try {
                  const text = await restoreFile.text();
                  const result = parseAndImportBackup(text);
                  setRestoreResult(result);
                  if (result.success) {
                    showSuccess(
                      `Database restored! ${result.keysRestored.length} data areas restored.`
                    );
                  } else {
                    showError('Database restore completed with some errors.');
                  }
                } catch {
                  showError('Failed to read the selected file.');
                } finally {
                  setIsRestoring(false);
                }
              }}
              disabled={!restoreFile || isRestoring}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold h-12 px-8 gap-2"
            >
              {isRestoring ? (
                <><RefreshCw size={16} className="animate-spin" /> Restoring...</>
              ) : (
                <><Upload size={16} /> Restore Backup</>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* File picker */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400">
              Backup File (.json)
            </Label>
            <label
              htmlFor="restore-file-input"
              className={cn(
                "flex flex-col items-center justify-center gap-3 cursor-pointer rounded-2xl border-2 border-dashed h-32 transition-colors",
                restoreFile
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50"
              )}
            >
              {restoreFile ? (
                <>
                  <FileJson size={28} className="text-emerald-500" />
                  <div className="text-center">
                    <p className="font-bold text-emerald-700 text-sm">{restoreFile.name}</p>
                    <p className="text-xs text-emerald-500 font-medium">
                      {(restoreFile.size / 1024).toFixed(1)} KB · Click to change
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload size={28} className="text-slate-400" />
                  <div className="text-center">
                    <p className="font-bold text-slate-600 text-sm">Click to select a backup file</p>
                    <p className="text-xs text-slate-400 font-medium">
                      Must be a .json file exported from this app
                    </p>
                  </div>
                </>
              )}
              <input
                id="restore-file-input"
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setRestoreFile(file);
                  setRestoreResult(null);
                }}
              />
            </label>
          </div>

          {/* Result banner */}
          {restoreResult && (
            <div
              className={cn(
                "rounded-2xl p-4 space-y-3",
                restoreResult.success
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-rose-50 border border-rose-200"
              )}
            >
              <div className="flex items-center gap-2">
                {restoreResult.success ? (
                  <CheckCircle size={18} className="text-emerald-500" />
                ) : (
                  <XCircle size={18} className="text-rose-500" />
                )}
                <p
                  className={cn(
                    "font-black text-sm",
                    restoreResult.success ? "text-emerald-700" : "text-rose-700"
                  )}
                >
                  {restoreResult.success
                    ? 'Restore completed successfully'
                    : 'Restore completed with errors'}
                </p>
              </div>

              {restoreResult.keysRestored.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wide">
                    Restored data areas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {restoreResult.keysRestored.map((key) => (
                      <Badge
                        key={key}
                        className="rounded-lg bg-emerald-100 text-emerald-700 font-bold text-[10px] border-none px-2 py-0.5"
                      >
                        <CheckCircle2 size={10} className="mr-1" />
                        {key}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {restoreResult.errors.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wide">
                    Errors encountered
                  </p>
                  {restoreResult.errors.map((err, i) => (
                    <p key={i} className="text-xs text-rose-600 font-medium flex items-start gap-1.5">
                      <XCircle size={12} className="mt-0.5 shrink-0" />
                      {err}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Warning */}
          <div className="flex gap-2.5 p-3 bg-amber-50 rounded-xl">
            <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              Restoring a backup will <strong>permanently replace</strong> all current local data
              with the contents of the selected file. If you have unsaved data, export your current
              database first.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SystemAndAccountManagement;