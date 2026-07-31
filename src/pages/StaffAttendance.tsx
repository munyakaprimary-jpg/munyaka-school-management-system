"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "@/components/ui/Modal";
import { Users, TrendingUp, MapPin, UserCheck, Settings2, Save, Map } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useStaffAttendance } from '@/hooks/useStaffAttendance';
import { useGeolocation } from '@/hooks/useGeolocation';
import { StaffAttendanceRegister } from '@/components/attendance/StaffAttendanceRegister';
import { getGeofenceConfig, setGeofenceConfig, GeofenceConfig } from '@/lib/geofence';
import { showSuccess } from '@/utils/toast';
import BackButton from '@/components/ui/BackButton';

const StaffAttendancePage = () => {
  const { location } = useGeolocation();
  const { 
    masterRegister, 
    adminMarkStaff 
  } = useStaffAttendance(location);

  // Geofence Config State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState<GeofenceConfig>(getGeofenceConfig());

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
    { title: "Total Personnel", value: totalStaffCount.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Present Today", value: presentStaffCount.toString(), icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Weekly Turnout", value: "94%", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Allowed Radius", value: `${config.radius}m`, icon: MapPin, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const handleSaveConfig = () => {
    setGeofenceConfig(config);
    setIsConfigOpen(false);
    showSuccess("School Geofence coordinates updated successfully!");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Attendance Management</h1>
            <p className="text-muted-foreground">Monitor live check-in timestamps and system-wide analytics.</p>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="rounded-xl border-slate-200 bg-white gap-2 font-bold text-slate-600"
          onClick={() => setIsConfigOpen(true)}
        >
          <Settings2 size={18} /> Geofence Settings
        </Button>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-3xl">
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

      {/* Geofence Configuration Modal */}
      <Modal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title="School Geofence Configuration"
        description="Set the precise GPS coordinates and allowed radius for staff attendance validation."
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="ghost" onClick={() => setIsConfigOpen(false)} className="rounded-xl font-bold px-6 h-12">Cancel</Button>
            <Button onClick={handleSaveConfig} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 h-12 text-white shadow-lg shadow-indigo-100 gap-2">
              <Save size={18} /> Update School Location
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-4">
            <Map className="text-indigo-600 shrink-0 mt-1" size={20} />
            <p className="text-xs text-indigo-700/80 leading-relaxed">
              Staff will only be allowed to mark attendance if their device GPS reports a position within the specified radius of these coordinates.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">School Latitude</Label>
              <Input 
                type="number" 
                value={config.lat} 
                onChange={(e) => setConfig({...config, lat: parseFloat(e.target.value)})}
                placeholder="e.g. 0.5142"
                className="rounded-xl h-12 bg-slate-50 border-none font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">School Longitude</Label>
              <Input 
                type="number" 
                value={config.lng} 
                onChange={(e) => setConfig({...config, lng: parseFloat(e.target.value)})}
                placeholder="e.g. 35.2698"
                className="rounded-xl h-12 bg-slate-50 border-none font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Allowed Radius (Meters)</Label>
            <Input 
              type="number" 
              value={config.radius} 
              onChange={(e) => setConfig({...config, radius: parseInt(e.target.value)})}
              placeholder="e.g. 150"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StaffAttendancePage;