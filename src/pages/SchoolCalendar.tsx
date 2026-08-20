"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from "@/components/ui/Modal";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { EVENTS as initialEvents } from '@/lib/mock-data';
import { showSuccess } from '@/utils/toast';

const SchoolCalendar = () => {
  const [eventsList, setEventsList] = useState(initialEvents);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("Internal");

  const handleAddEvent = () => {
    if (!title || !date || !time) return;
    const newEvent = { id: Date.now(), title, date, time, type };
    setEventsList([newEvent, ...eventsList]);
    setIsOpen(false);
    setTitle(""); setDate(""); setTime("");
    showSuccess("New event added to calendar!");
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dates = Array.from({ length: 35 }, (_, i) => i - 3);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div><h1 className="text-3xl font-bold text-slate-900">School Calendar</h1><p className="text-muted-foreground">Manage events and academic milestones.</p></div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl">Export Ical</Button>
          <Button className="rounded-2xl gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsOpen(true)}><Plus size={18} /> New Event</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">October 2024</h2>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8"><ChevronLeft size={18} /></Button>
                <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8"><ChevronRight size={18} /></Button>
              </div>
            </div>
            <div className="grid grid-cols-7 border-b">{days.map(d => <div key={d} className="px-4 py-3 text-center text-[9px] font-black uppercase text-slate-400">{d}</div>)}</div>
            <div className="grid grid-cols-7 border-b">{dates.map((d, i) => (
              <div key={i} className={`min-h-[80px] p-2 border-r border-b ${d <= 0 || d > 31 ? 'bg-slate-50/30' : ''}`}>
                <span className={`text-sm font-black ${d === 24 ? 'bg-indigo-600 text-white p-2 rounded-lg' : ''}`}>{d > 0 && d <= 31 ? d : ''}</span>
                {d === 25 && <div className="mt-1.5 p-1.5 rounded-lg bg-indigo-50 text-[9px] font-bold text-indigo-700">Staff Meeting</div>}
              </div>
            ))}</div>
          </Card>
        </div>
        <Card className="border-none shadow-sm rounded-[2rem] bg-white p-4">
          <CardTitle className="text-lg mb-4">Upcoming</CardTitle>
          <div className="space-y-4">{eventsList.map(e => (
            <div key={e.id} className="flex gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 flex flex-col items-center justify-center font-black">
                <span className="text-[8px] text-slate-400">Oct</span><span className="text-sm">{e.date.split('-')[2] || '??'}</span>
              </div>
              <div><p className="text-sm font-bold">{e.title}</p><p className="text-[8px] text-slate-400 uppercase font-black tracking-widest"><Clock size={10} className="inline mr-1" /> {e.time}</p></div>
            </div>
          ))}</div>
        </Card>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New School Event" footer={<><Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button><Button onClick={handleAddEvent}>Schedule Event</Button></>}>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Annual Sports Day" /></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div><div className="space-y-2"><Label>Time</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div></div>
          <div className="space-y-2"><Label>Event Type</Label><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="Internal">Internal</SelectItem><SelectItem value="Academic">Academic</SelectItem><SelectItem value="Event">School Event</SelectItem></SelectContent></Select></div>
        </div>
      </Modal>
    </div>
  );
};

export default SchoolCalendar;