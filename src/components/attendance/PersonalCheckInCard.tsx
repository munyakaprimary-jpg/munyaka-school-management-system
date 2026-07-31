"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Loader2,
  Calendar
} from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { isWithinGeofence } from '@/lib/geofence';
import { format } from 'date-fns';

interface PersonalCheckInCardProps {
  staffName: string;
  roleName: string;
  onCheckIn: (session: 'morning' | 'afternoon') => Promise<boolean>;
  personalHistory: Record<string, any>;
}

export const PersonalCheckInCard: React.FC<PersonalCheckInCardProps> = ({
  staffName,
  roleName,
  onCheckIn,
  personalHistory
}) => {
  const { location, accuracy, error, isLoading: geoLoading } = useGeolocation();
  const [timeStr, setTimeStr] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayRecord = personalHistory[todayStr] || {};

  const isMorningDone = !!todayRecord.morning?.time;
  const isAfternoonDone = !!todayRecord.afternoon?.time;

  const inGeofence = location ? isWithinGeofence(location.lat, location.lng) : false;

  // Live Digital Clock
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    setTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (session: 'morning' | 'afternoon') => {
    setIsSubmitting(true);
    await onCheckIn(session);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Hero Self Check-In Portal */}
      <Card className="border-none shadow-lg rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white overflow-hidden relative">
        <div className="absolute right-[-20px] top-[-20px] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <CardContent className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-400/20 font-black uppercase text-[10px] tracking-widest px-3 py-1">
                  Personal Attendance Portal
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-none font-bold text-[10px] px-2.5 py-0.5">
                  Live Self-Marking
                </Badge>
              </div>
              <h2 className="text-3xl font-black tracking-tight">{staffName}</h2>
              <p className="text-indigo-200/80 font-medium text-sm mt-1">{roleName} • Munyaka School Staff</p>
            </div>

            {/* Live Clock Display */}
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 text-center shrink-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Current Time</p>
              <p className="text-3xl font-black font-mono tracking-tight text-white mt-0.5">{timeStr || '00:00:00 AM'}</p>
              <p className="text-[11px] font-bold text-indigo-300/80 mt-1">{format(new Date(), 'EEEE, MMMM dd, yyyy')}</p>
            </div>
          </div>

          {/* GPS Radar & Geofence Indicator */}
          <div className="my-8 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3.5 rounded-2xl ${inGeofence ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                <MapPin size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base">GPS Location Radar</h4>
                  {geoLoading ? (
                    <Badge className="bg-amber-500/20 text-amber-300 border-none text-[10px]">
                      <Loader2 className="animate-spin mr-1" size={12} /> Locating...
                    </Badge>
                  ) : inGeofence ? (
                    <Badge className="bg-emerald-500/30 text-emerald-200 border-none text-[10px] font-bold">
                      <ShieldCheck size={12} className="mr-1" /> Geofence Verified
                    </Badge>
                  ) : (
                    <Badge className="bg-rose-500/30 text-rose-200 border-none text-[10px] font-bold">
                      <AlertCircle size={12} className="mr-1" /> Outside Geofence
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-indigo-200/70 mt-1">
                  {inGeofence 
                    ? "Verified within 100m radius of Munyaka Primary & Junior School." 
                    : error || "Acquiring precision GPS coordinates..."}
                </p>
              </div>
            </div>

            {location && (
              <div className="text-left sm:text-right shrink-0 font-mono text-xs text-indigo-200/80 bg-black/20 px-4 py-2 rounded-2xl border border-white/5">
                <p>Lat: {location.lat.toFixed(4)}</p>
                <p>Lng: {location.lng.toFixed(4)}</p>
                <p className="text-[10px] text-emerald-400">Accuracy: ±{Math.round(accuracy || 0)}m</p>
              </div>
            )}
          </div>

          {/* Action Cards: Morning Check-In & Afternoon Check-Out */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Morning Arrival Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <LogIn size={20} className="text-emerald-400" />
                    <h3 className="font-bold text-lg text-white">Morning Arrival</h3>
                  </div>
                  {isMorningDone ? (
                    <Badge className="bg-emerald-500 text-white font-bold border-none">
                      <CheckCircle2 size={12} className="mr-1" /> Checked In
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-300 border-none">
                      Pending
                    </Badge>
                  )}
                </div>

                {isMorningDone ? (
                  <div className="space-y-1 bg-black/20 p-4 rounded-2xl border border-white/5 mb-6">
                    <p className="text-[10px] font-black uppercase text-indigo-300">Clock-In Timestamp</p>
                    <p className="text-2xl font-black text-emerald-300">{todayRecord.morning.time}</p>
                    <p className="text-xs text-indigo-200/70">Verified Arrival • Status: Present</p>
                  </div>
                ) : (
                  <p className="text-xs text-indigo-200/80 mb-6 leading-relaxed">
                    Mark your morning arrival upon reaching school grounds to record your official shift start time.
                  </p>
                )}
              </div>

              <Button
                disabled={isMorningDone || isSubmitting || !inGeofence}
                onClick={() => handleAction('morning')}
                className={`w-full h-14 rounded-2xl font-black text-base transition-all ${
                  isMorningDone 
                    ? 'bg-white/10 text-white/50 cursor-not-allowed' 
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-900/40 active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : isMorningDone ? (
                  "Morning Arrival Recorded"
                ) : (
                  "Clock In (Morning Arrival)"
                )}
              </Button>
            </div>

            {/* Afternoon Departure Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <LogOut size={20} className="text-indigo-400" />
                    <h3 className="font-bold text-lg text-white">Afternoon Departure</h3>
                  </div>
                  {isAfternoonDone ? (
                    <Badge className="bg-indigo-500 text-white font-bold border-none">
                      <CheckCircle2 size={12} className="mr-1" /> Checked Out
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-500/20 text-slate-300 border-none">
                      Pending
                    </Badge>
                  )}
                </div>

                {isAfternoonDone ? (
                  <div className="space-y-1 bg-black/20 p-4 rounded-2xl border border-white/5 mb-6">
                    <p className="text-[10px] font-black uppercase text-indigo-300">Clock-Out Timestamp</p>
                    <p className="text-2xl font-black text-indigo-300">{todayRecord.afternoon.time}</p>
                    <p className="text-xs text-indigo-200/70">Verified Departure • Shift Complete</p>
                  </div>
                ) : (
                  <p className="text-xs text-indigo-200/80 mb-6 leading-relaxed">
                    Record your departure at the end of the school day to log official duty completion.
                  </p>
                )}
              </div>

              <Button
                disabled={isAfternoonDone || isSubmitting || !inGeofence}
                onClick={() => handleAction('afternoon')}
                className={`w-full h-14 rounded-2xl font-black text-base transition-all ${
                  isAfternoonDone 
                    ? 'bg-white/10 text-white/50 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-900/40 active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : isAfternoonDone ? (
                  "Afternoon Departure Recorded"
                ) : (
                  "Clock Out (Afternoon Departure)"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Personal Log History */}
      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Personal Activity Log</h3>
              <p className="text-xs text-slate-400">Your recent verified attendance entries</p>
            </div>
          </div>
          <Badge variant="outline" className="rounded-xl border-slate-200 text-slate-600 font-bold">
            Last 7 Days
          </Badge>
        </div>

        <div className="divide-y divide-slate-100">
          {Object.keys(personalHistory).length > 0 ? (
            Object.keys(personalHistory).map((dateKey) => {
              const rec = personalHistory[dateKey];
              return (
                <div key={dateKey} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900">{format(new Date(dateKey), 'MMMM dd, yyyy')}</p>
                    <p className="text-xs text-slate-400 font-medium">Daily Duty Session</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Morning Arrival</p>
                      <p className="text-sm font-black text-emerald-600">{rec.morning?.time || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Afternoon Departure</p>
                      <p className="text-sm font-black text-indigo-600">{rec.afternoon?.time || '—'}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm">
              No previous personal check-in logs recorded yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};