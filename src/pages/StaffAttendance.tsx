"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPinCheck, 
  Loader2, 
  AlertCircle,
  LogIn,
  LogOut,
  Calendar,
  UserCheck,
  Shield,
  Home,
  Wifi,
  Navigation
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTeacherAttendance } from '@/hooks/useTeacherAttendance';
import { useGeolocation } from '@/hooks/useGeolocation';
import { showSuccess, showError } from '@/utils/toast';
import { format, formatDistanceToNow } from 'date-fns';
import { SCHOOL_COORDINATES, GEOFENCE_RADIUS_METERS } from '@/lib/geofence';

const StaffAttendance = () => {
  const { user } = useAuth();
  const { location, accuracy, error: geoError, isLoading: geoLoading } = useGeolocation();
  const { record, loading, clockIn, clockOut } = useTeacherAttendance(location);
  
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [departureReason, setDepartureReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);

  // Check if within geofence
  const isWithinFence = location ? 
    (() => {
      const R = 6371e3;
      const φ1 = (location.lat * Math.PI) / 180;
      const φ2 = (SCHOOL_COORDINATES.lat * Math.PI) / 180;
      const Δφ = ((SCHOOL_COORDINATES.lat - location.lat) * Math.PI) / 180;
      const Δλ = ((SCHOOL_COORDINATES.lng - location.lng) * Math.PI) / 180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c <= GEOFENCE_RADIUS_METERS;
    })() : false;

  const distanceFromSchool = location ? 
    (() => {
      const R = 6371e3;
      const φ1 = (location.lat * Math.PI) / 180;
      const φ2 = (SCHOOL_COORDINATES.lat * Math.PI) / 180;
      const Δφ = ((SCHOOL_COORDINATES.lat - location.lat) * Math.PI) / 180;
      const Δλ = ((SCHOOL_COORDINATES.lng - location.lng) * Math.PI) / 180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return Math.round(R * c);
    })() : null;

  const handleClockOut = async () => {
    if (!departureReason.trim()) {
      showError("Please provide a reason for early departure");
      return;
    }
    setIsClockingOut(true);
    await clockOut(departureReason);
    setDepartureReason('');
    setShowReasonModal(false);
    setIsClockingOut(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-emerald-50 text-emerald-700 border-none"><UserCheck size={14} className="mr-1" /> Present</Badge>;
      case 'late':
        return <Badge className="bg-amber-50 text-amber-700 border-none"><Clock size={14} className="mr-1" /> Late</Badge>;
      case 'clocked_out':
        return <Badge className="bg-slate-50 text-slate-700 border-none"><LogOut size={14} className="mr-1" /> Clocked Out</Badge>;
      default:
        return <Badge className="bg-rose-50 text-rose-700 border-none"><XCircle size={14} className="mr-1" /> Absent</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff Attendance</h1>
          <p className="text-muted-foreground">Geofenced clock-in/out for Munyaka Primary School</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${isWithinFence ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isWithinFence ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {isWithinFence ? 'Within Geofence' : 'Outside Geofence'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Status Card */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <Navigation size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Location</p>
                <p className="font-bold text-slate-900">
                  {location 
                    ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
                    : geoLoading ? 'Detecting...' : 'Location unavailable'}
                </p>
                {accuracy && <p className="text-xs text-slate-500">Accuracy: ±{Math.round(accuracy)}m</p>}
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">School Location</p>
                <p className="font-bold text-slate-900">
                  {SCHOOL_COORDINATES.lat.toFixed(6)}, {SCHOOL_COORDINATES.lng.toFixed(6)}
                </p>
                <p className="text-xs text-slate-500">Geofence Radius: {GEOFENCE_RADIUS_METERS}m</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ backgroundColor: isWithinFence ? '#f0fdf4' : '#fef2f2' }}>
              <div className={`p-3 rounded-xl ${isWithinFence ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                <Shield size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Distance from School</p>
                <p className="font-bold text-slate-900 text-xl">
                  {distanceFromSchool !== null ? `${distanceFromSchool}m` : '—'}
                </p>
                <p className="text-xs text-slate-500">
                  {isWithinFence ? '✓ Within allowed range' : '✗ Outside geofence - cannot clock in/out'}
                </p>
              </div>
            </div>
          </div>

          {geoError && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700">
              <AlertCircle size={20} />
              <div>
                <p className="font-bold">Location Error</p>
                <p className="text-sm">{geoError}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Attendance Card */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <CardHeader className="p-6 border-b bg-slate-50/50">
          <CardTitle className="text-xl font-black text-slate-900">Today's Status</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
          ) : !record ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Not Clocked In Yet</h3>
              <p className="text-slate-500 mb-6">Start your day by clocking in</p>
              <Button 
                className="w-full md:w-[280px] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100 gap-2"
                onClick={clockIn}
                disabled={!isWithinFence || geoLoading}
              >
                <LogIn size={20} /> Clock In
              </Button>
              {!isWithinFence && (
                <p className="text-xs text-rose-600 mt-3 text-center">
                  You must be within {GEOFENCE_RADIUS_METERS}m of the school to clock in
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</p>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(record.status || 'present')}
                      {record.is_late && <Badge className="bg-amber-50 text-amber-700 border-none"><Clock size={12} className="mr-1" /> Late Arrival</Badge>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</p>
                  <p className="font-bold text-slate-900">{format(new Date(record.date), 'PPP')}</p>
                </div>
              </div>

              {/* Time Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                      <LogIn size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clock In</p>
                      <p className="font-bold text-slate-900 text-lg">
                        {record.arrival_time ? format(new Date(record.arrival_time), 'HH:mm:ss') : '—'}
                      </p>
                    </div>
                  </div>
                  {record.verified_lat && (
                    <p className="text-xs text-slate-500 ml-10">Verified at school location</p>
                  )}
                </div>

                <div className="p-4 border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                      <LogOut size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clock Out</p>
                      <p className="font-bold text-slate-900 text-lg">
                        {record.departure_time ? format(new Date(record.departure_time), 'HH:mm:ss') : '—'}
                      </p>
                    </div>
                  </div>
                  {record.early_departure_reason && (
                    <div className="ml-10 pt-2 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Early Departure Reason</p>
                      <p className="text-sm text-slate-600 italic">"{record.early_departure_reason}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Clock Out Button */}
              {!record.departure_time && (
                <Button 
                  variant="outline"
                  className="w-full md:w-[280px] h-12 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 font-bold gap-2"
                  onClick={() => setShowReasonModal(true)}
                >
                  <LogOut size={20} /> Clock Out
                </Button>
              )}

              {record.departure_time && (
                <div className="text-center text-slate-500 py-4">
                  <p className="font-medium">Shift completed at {format(new Date(record.departure_time), 'HH:mm')}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-12 mb-6">
          <TabsTrigger value="today" className="rounded-xl px-8 h-full font-bold text-xs">Today</TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl px-8 h-full font-bold text-xs">History</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="hidden">
          {/* Today's content is shown above */}
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 border-b">
                  <tr>
                    <th className="px-8 py-5 text-left font-black text-[10px] uppercase tracking-widest text-slate-400">Date</th>
                    <th className="px-8 py-5 text-center font-black text-[10px] uppercase tracking-widest text-slate-400">Clock In</th>
                    <th className="px-8 py-5 text-center font-black text-[10px] uppercase tracking-widest text-slate-400">Clock Out</th>
                    <th className="px-8 py-5 text-center font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-8 py-5 text-center font-black text-[10px] uppercase tracking-widest text-slate-400">Duration</th>
                    <th className="px-8 py-5 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">Location Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {/* Mock history data - in real app this would come from Supabase */}
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-medium text-slate-900">{format(new Date(), 'PPP')}</td>
                    <td className="px-8 py-5 text-center font-medium text-slate-600">07:45:12</td>
                    <td className="px-8 py-5 text-center font-medium text-slate-600">16:30:45</td>
                    <td className="px-8 py-5 text-center">
                      <Badge className="bg-emerald-50 text-emerald-700 border-none"><UserCheck size={12} className="mr-1" /> Present</Badge>
                    </td>
                    <td className="px-8 py-5 text-center font-bold text-indigo-600">8h 45m</td>
                    <td className="px-8 py-5 text-right">
                      <Badge className="bg-emerald-50 text-emerald-700 border-none"><MapPinCheck size={12} className="mr-1" /> Verified</Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-medium text-slate-900">{format(new Date(Date.now() - 86400000), 'PPP')}</td>
                    <td className="px-8 py-5 text-center font-medium text-slate-600">08:12:30</td>
                    <td className="px-8 py-5 text-center font-medium text-slate-600">16:00:00</td>
                    <td className="px-8 py-5 text-center">
                      <Badge className="bg-amber-50 text-amber-700 border-none"><Clock size={12} className="mr-1" /> Late</Badge>
                    </td>
                    <td className="px-8 py-5 text-center font-bold text-indigo-600">7h 47m</td>
                    <td className="px-8 py-5 text-right">
                      <Badge className="bg-emerald-50 text-emerald-700 border-none"><MapPinCheck size={12} className="mr-1" /> Verified</Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-medium text-slate-900">{format(new Date(Date.now() - 172800000), 'PPP')}</td>
                    <td className="px-8 py-5 text-center font-medium text-slate-600">07:30:00</td>
                    <td className="px-8 py-5 text-center font-medium text-slate-600">13:15:00</td>
                    <td className="px-8 py-5 text-center">
                      <Badge className="bg-amber-50 text-amber-700 border-none"><Clock size={12} className="mr-1" /> Early Departure</Badge>
                    </td>
                    <td className="px-8 py-5 text-center font-bold text-indigo-600">5h 45m</td>
                    <td className="px-8 py-5 text-right">
                      <Badge className="bg-emerald-50 text-emerald-700 border-none"><MapPinCheck size={12} className="mr-1" /> Verified</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Clock Out Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <LogOut size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Clock Out</h3>
                <p className="text-sm text-slate-500">Please provide a reason for departure</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">Departure Reason *</label>
                <textarea
                  value={departureReason}
                  onChange={(e) => setDepartureReason(e.target.value)}
                  placeholder="e.g. Medical appointment, family emergency, meeting..."
                  className="w-full h-24 rounded-xl bg-slate-50 border border-slate-200 p-3 focus:ring-2 focus:ring-indigo-100 outline-none font-medium resize-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowReasonModal(false)}
                  className="flex-1 rounded-xl h-11 font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleClockOut}
                  disabled={isClockingOut || !departureReason.trim()}
                  className="flex-1 rounded-xl h-11 bg-rose-600 hover:bg-rose-700 font-bold text-white shadow-lg shadow-rose-100 gap-2"
                >
                  {isClockingOut ? <Loader2 className="animate-spin" size={18} /> : <LogOut size={18} />}
                  Clock Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffAttendance;