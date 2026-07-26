"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Search
} from 'lucide-react';
import { EVENTS } from '@/lib/mock-data';

const SchoolCalendar = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dates = Array.from({ length: 35 }, (_, i) => i - 3); // Mock calendar grid

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">School Calendar</h1>
          <p className="text-muted-foreground">Manage events, holidays, and academic term milestones.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl border-slate-200">Export Ical</Button>
          <Button className="rounded-2xl gap-2 bg-indigo-600 shadow-lg shadow-indigo-100">
            <Plus size={18} /> New Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">October 2024</h2>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8"><ChevronLeft size={18} /></Button>
                  <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8"><ChevronRight size={18} /></Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="rounded-xl font-bold text-xs bg-indigo-600 text-white">Month</Button>
                <Button variant="ghost" className="rounded-xl font-bold text-xs text-slate-400">Week</Button>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b">
                {days.map(day => (
                  <div key={day} className="px-4 py-3 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 border-b">
                {dates.map((date, i) => (
                  <div 
                    key={i} 
                    className={`min-h-[120px] p-4 border-r border-b last:border-r-0 transition-colors hover:bg-slate-50/50 ${
                      date <= 0 || date > 31 ? 'bg-slate-50/30 text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    <span className={`text-sm font-black ${date === 24 ? 'bg-indigo-600 text-white h-7 w-7 inline-flex items-center justify-center rounded-lg shadow-md' : ''}`}>
                      {date > 0 && date <= 31 ? date : ''}
                    </span>
                    {date === 25 && (
                      <div className="mt-2 p-1.5 rounded-lg bg-indigo-50 text-[10px] font-bold text-indigo-700 leading-tight">
                        Staff Meeting
                      </div>
                    )}
                    {date === 20 && (
                      <div className="mt-2 p-1.5 rounded-lg bg-red-50 text-[10px] font-bold text-red-600 leading-tight">
                        Half-Term Break
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
            <CardTitle className="text-lg mb-6 flex items-center justify-between">
              Upcoming
              <CalendarIcon size={18} className="text-slate-300" />
            </CardTitle>
            <div className="space-y-6">
              {EVENTS.map(event => (
                <div key={event.id} className="group cursor-pointer">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex flex-col items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                      <span className="text-[10px] font-black text-slate-400 uppercase leading-none">Oct</span>
                      <span className="text-sm font-black text-slate-900 leading-none mt-0.5">{event.date.split('-')[2]}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{event.title}</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <Clock size={12} /> {event.time}
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-indigo-500">{event.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-8 rounded-xl font-bold text-indigo-600 text-sm">
              View All Events
            </Button>
          </Card>

          <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-100 overflow-hidden relative">
            <div className="absolute top-[-20px] right-[-20px] opacity-10">
              <CalendarIcon size={120} />
            </div>
            <h3 className="text-lg font-bold mb-2">Term 1 Summary</h3>
            <p className="text-xs text-indigo-100 mb-6 leading-relaxed">Currently 6 weeks into the term. Half-term starts in 5 days.</p>
            <div className="space-y-4">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-80">
                <span>Progress</span>
                <span>45% Done</span>
              </div>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="bg-white h-full w-[45%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolCalendar;