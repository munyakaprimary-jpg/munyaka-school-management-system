"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  Search,
  CalendarDays
} from 'lucide-react';
import { EVENTS as initialEvents } from '@/lib/mock-data';
import { showSuccess } from '@/utils/toast';

const SchoolCalendar = () => {
  const [eventsList, setEventsList] = useState(initialEvents);
  const [isOpen, setIsOpen] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("Internal");

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dates = Array.from({ length: 35 }, (_, i) => i - 3); // Mock calendar grid

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) return;

    const newEvent = {
      id: Date.now(),
      title,
      date,
      time,
      type
    };

    setEventsList([newEvent, ...eventsList]);
    setIsOpen(false);
    setTitle("");
    setDate("");
    setTime("");
    setType("Internal");
    showSuccess("New event added to calendar!");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">School Calendar</h1>
          <p className="text-muted-foreground">Manage events, holidays, and academic term milestones.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl border-slate-200">Export Ical</Button>
          <Button 
            className="rounded-2xl gap-2 bg-indigo-600 shadow-lg shadow-indigo-100"
            onClick={() => setIsOpen(true)}
          >
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
                {dates.map((dateNum, i) => (
                  <div 
                    key={i} 
                    className={`min-h-[120px] p-4 border-r border-b last:border-r-0 transition-colors hover:bg-slate-50/50 ${
                      dateNum <= 0 || dateNum > 31 ? 'bg-slate-50/30 text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    <span className={`text-sm font-black ${dateNum === 24 ? 'bg-indigo-600 text-white h-7 w-7 inline-flex items-center justify-center rounded-lg shadow-md' : ''}`}>
                      {dateNum > 0 && dateNum <= 31 ? dateNum : ''}
                    </span>
                    {dateNum === 25 && (
                      <div className="mt-2 p-1.5 rounded-lg bg-indigo-50 text-[10px] font-bold text-indigo-700 leading-tight">
                        Staff Meeting
                      </div>
                    )}
                    {dateNum === 20 && (
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
              {eventsList.map(event => {
                const day = event.date.includes('-') ? event.date.split('-')[2] : '??';
                return (
                  <div key={event.id} className="group cursor-pointer">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex flex-col items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                        <span className="text-[10px] font-black text-slate-400 uppercase leading-none">Oct</span>
                        <span className="text-sm font-black text-slate-900 leading-none mt-0.5">{day}</span>
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
                );
              })}
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

      {/* New Event Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Add New School Event</DialogTitle>
            <DialogDescription>
              Schedule a new milestone, meeting, or activity for the academic calendar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddEvent} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Event Title</Label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Sports Day"
                required
                className="rounded-xl h-12"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Date</Label>
                <Input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input 
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="rounded-xl h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Internal">Internal (Staff/Students)</SelectItem>
                  <SelectItem value="Academic">Academic (Exams/Reports)</SelectItem>
                  <SelectItem value="Event">School Event (Parents Invited)</SelectItem>
                  <SelectItem value="County">County/External Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                className="rounded-xl font-bold"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100"
              >
                Schedule Event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolCalendar;