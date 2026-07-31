"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, MapPin, UserCheck, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useStaffAttendance } from '@/hooks/useStaffAttendance';
import { useGeolocation } from '@/hooks/useGeolocation';
import { PersonalCheckInCard } from '@/components/attendance/PersonalCheckInCard';
import { StaffAttendanceRegister } from '@/components/attendance/StaffAttendanceRegister';

const StaffAttendancePage = () => {
  const { user } = useAuth();
  const { location } = useGeolocation();
  const { 
    personalRecords, 
    masterRegister, 
    selfMarkAttendance, 
    adminMarkStaff 
  } = useStaffAttendance(location);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'head_teacher';
  const [activeTab, setActiveTab] = useState<'checkin' | 'register'>(isAdmin ? 'register' : 'checkin');

  // Attendance Trend Chart Data
  const attendanceTrendData = [
    { day: "Mon", rate: 95 },
    { day: "Tue", rate: 92 },
    { day: "Wed", rate: 88 },
    { day: "Thu", rate: 94 },
    { day: "Fri", rate: 91 },
  ];

  const totalStaffCount = Object.keys(masterRegister).length || 4;
  const presentStaffCount = Object.values(masterRegister).filter(
    s => s.morning?.status === 'present' || s.afternoon?.status === 'present'
  ).length;

  const stats = [
    { title: "Total Registered Staff", value: totalStaffCount.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Checked In Today", value: presentStaffCount.toString(), icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Overall Attendance Rate", value: "94%", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "School Geofence Status", value: "Active", icon: MapPin, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff Attendance & Geofencing</h1>
          <p className="text-muted-foreground">Self check-in and master attendance tracking for Munyaka School staff.</p>
        </div>

        {/* Tab Selector for Admins */}
        {isAdmin && (
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
            <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 h-12">
              <TabsTrigger value="register" className="rounded-xl px-6 h-full font-bold text-xs">
                Staff Master Register
              </TabsTrigger>
              <TabsTrigger value="checkin" className="rounded-xl px-6 h-full font-bold text-xs">
                My Check-In Card
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-3xl hover:translate-y-[-2px] transition-transform">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`${stat.bg} p-4 rounded-2xl`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-0.5">{stat.title}</p>
                <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main View Area */}
      {activeTab === 'checkin' || !isAdmin ? (
        <PersonalCheckInCard
          staffName={user?.name || 'Staff Member'}
          roleName={user?.role?.replace('_', ' ') || 'Teacher'}
          onCheckIn={selfMarkAttendance}
          personalHistory={personalRecords}
        />
      ) : (
        <div className="space-y-8">
          {/* Attendance Trend Chart */}
          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <div className="p-6 flex flex-row items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Staff Weekly Attendance Trends</h3>
                <p className="text-xs text-slate-400">Aggregated turn-out percentages for current term</p>
              </div>
              <Badge variant="outline" className="rounded-lg text-emerald-600 bg-emerald-50 border-emerald-100">
                <TrendingUp size={12} className="mr-1" /> Live Analytics
              </Badge>
            </div>
            <CardContent className="h-[240px] w-full pt-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={attendanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase">{data.day}</p>
                            <p className="text-base font-black text-indigo-600">{data.rate}% Turnout</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="rate" radius={[10, 10, 0, 0]}>
                    {attendanceTrendData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#6366f1" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Master Register View */}
          <StaffAttendanceRegister
            masterRegister={masterRegister}
            onAdminMark={adminMarkStaff}
          />
        </div>
      )}
    </div>
  );
};

export default StaffAttendancePage;