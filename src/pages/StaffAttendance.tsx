"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, MapPin, UserCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { STAFF } from '@/lib/mock-data';
import StaffAttendance from '@/components/attendance/StaffAttendance';

const StaffAttendancePage = () => {
  const { user } = useAuth();
  
  // Filter staff based on user role
  const filteredStaff = STAFF.filter(staff => {
    if (user?.role === 'super_admin') return true;
    if (user?.role === 'head_teacher') return ['Jane Mwangi', 'John Onyango'].includes(staff.name);
    if (user?.role === 'teacher') return ['Jane Mwangi', 'Peter Kamau', 'Sarah Chebet'].includes(staff.name);
    return false;
  });

  // Mock attendance data for visualization
  const attendanceData = [
    { day: "Mon", rate: 95 },
    { day: "Tue", rate: 92 },
    { day: "Wed", rate: 88 },
    { day: "Thu", rate: 94 },
    { day: "Fri", rate: 91 },
  ];

  const stats = [
    { title: "Total Staff", value: filteredStaff.length.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Present Today", value: "3", icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Attendance Rate", value: "92%", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Geofence Active", value: "3", icon: MapPin, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff Attendance Register</h1>
          <p className="text-muted-foreground">Track and manage staff attendance with geolocation verification.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Sync</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-3xl hover:translate-y-[-4px] transition-transform">
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

      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Attendance Trends (Weekly)</CardTitle>
          <Badge variant="outline" className="rounded-lg text-emerald-600 bg-emerald-50 border-emerald-100">
            <TrendingUp size={12} className="mr-1" /> Real-time Data
          </Badge>
        </CardHeader>
        <CardContent className="h-[300px] w-full pt-4">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis domain={[0, 100]} hide />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-50">
                        <p className="text-xs font-black text-slate-400 uppercase mb-1">{data.day}</p>
                        <p className="text-lg font-black text-indigo-600">{data.rate}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="rate" radius={[10, 10, 0, 0]}>
                {attendanceData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill="#6366f1" 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Staff Attendance Component for the logged-in user */}
      {user && (
        <StaffAttendance 
          staffId={user.id} 
          staffName={user.name} 
        />
      )}
    </div>
  );
};

export default StaffAttendancePage;