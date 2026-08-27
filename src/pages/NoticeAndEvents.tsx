"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import Modal from '@/components/ui/Modal';
import { 
  Bell, 
  Megaphone, 
  Calendar, 
  Clock, 
  MapPin, 
  Pin, 
  Plus, 
  Send, 
  Paperclip, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  ExternalLink,
  Flame,
  CheckCircle2,
  CalendarDays,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { format, isToday, isSameDay, addDays, parseISO, startOfDay } from 'date-fns';
import { Notice, SchoolEvent } from '@/types/notice';

const NOTICES_STORAGE_KEY = 'munyaka_notices_v2';
const EVENTS_STORAGE_KEY = 'munyaka_events_v2';

const INITIAL_NOTICES: Notice[] = [
  {
    id: 'n1',
    title: 'Urgent: Term 3 Fee Balance Deadline & Statement Verification',
    content: 'All parents and guardians are kindly reminded that the deadline for clearing 100% of Term 3 school fee balances is Friday of next week. Please ensure bank payment slips are presented to the bursar.',
    description: 'All parents and guardians are kindly reminded that the deadline for clearing 100% of Term 3 school fee balances is Friday...',
    date: 'Today, 08:30 AM',
    category: 'Urgent',
    pinned: true,
    attachmentName: 'Term3_Fee_Guidelines_2025.pdf',
    attachmentUrl: '#',
    color: 'bg-rose-50 text-rose-600 border-rose-200'
  },
  {
    id: 'n2',
    title: 'Mid-Term Examination Timetable and Revision Guidelines',
    content: 'Mid-Term examinations for Grades 1 to 9 will commence on Monday. Teachers have uploaded all revision materials into the Digital Hub and E-Resources library.',
    description: 'Mid-Term examinations for Grades 1 to 9 will commence on Monday. Teachers have uploaded all revision materials...',
    date: 'Yesterday, 02:15 PM',
    category: 'General',
    pinned: false,
    attachmentName: 'MidTerm_Exam_Schedule.pdf',
    attachmentUrl: '#',
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
  },
  {
    id: 'n3',
    title: 'School Canteen Supplier Update & Subsidy Announcement',
    content: 'We have updated our nutritional supplier guidelines to incorporate fresh organic milk and locally sourced fruits for all Junior Secondary students.',
    description: 'We have updated our nutritional supplier guidelines to incorporate fresh organic milk and locally sourced fruits...',
    date: 'Oct 24, 2025',
    category: 'Finance',
    pinned: false,
    color: 'bg-amber-50 text-amber-600 border-amber-200'
  }
];

export default function NoticeAndEvents({ defaultTab = 'announcements' }: { defaultTab?: 'announcements' | 'events' }) {
  // LocalStorage Persistence for Notices and Events
  const [notices, setNotices] = useState<Notice[]>(() => {
    try {
      const saved = localStorage.getItem(NOTICES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_NOTICES;
  });

  const [events, setEvents] = useState<SchoolEvent[]>(() => {
    try {
      const saved = localStorage.getItem(EVENTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return []; // Start with empty events - no hardcoded mock data
  });

  // Mobile/responsive segmented toggle: 'announcements' | 'events'
  const [mobileTab, setMobileTab] = useState<'announcements' | 'events'>(defaultTab);

  // Update tab when route changes or defaultTab prop updates
  useEffect(() => {
    setMobileTab(defaultTab);
  }, [defaultTab]);

  // Separate modal states for Notice and Event
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Notice Form State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticePriority, setNoticePriority] = useState<'Normal' | 'Important' | 'Urgent Alert'>('Normal');
  const [noticeAudience, setNoticeAudience] = useState<'All' | 'Staff' | 'Parents' | 'Learners'>('All');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeExpiryDate, setNoticeExpiryDate] = useState('');

  // Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [eventType, setEventType] = useState('Academic');

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(notices));
  }, [notices]);

  const formatTime12h = (time24: string): string => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    if (!hours || !minutes) return '';
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  const handlePublishNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;
    
    let badgeColor = 'bg-indigo-50 text-indigo-600 border-indigo-200';
    if (noticePriority === 'Urgent Alert') badgeColor = 'bg-rose-50 text-rose-600 border-rose-200';
    if (noticePriority === 'Important') badgeColor = 'bg-amber-50 text-amber-600 border-amber-200';

    const newNotice: Notice = {
      id: Date.now().toString(),
      title: noticeTitle.trim(),
      content: noticeContent.trim(),
      description: noticeContent.trim().substring(0, 120) + '...',
      date: 'Just now',
      category: noticePriority,
      pinned: noticePriority === 'Urgent Alert',
      color: badgeColor
    };

    setNotices([newNotice, ...notices]);
    setNoticeTitle('');
    setNoticeContent('');
    setNoticePriority('Normal');
    setNoticeAudience('All');
    setNoticeExpiryDate('');
    setIsNoticeModalOpen(false);
    showSuccess("New Notice published successfully!");
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate || !eventTime) return;

    const newEvent: SchoolEvent = {
      id: Date.now(),
      title: eventTitle.trim(),
      date: eventDate,
      time: eventTime,
      location: eventLocation.trim() || 'School Grounds',
      type: eventType
    };

    setEvents([...events, newEvent].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setEventTitle('');
    setEventDate('');
    setEventTime('');
    setEventLocation('');
    setEventDetails('');
    setEventType('Academic');
    setIsEventModalOpen(false);
    showSuccess("New Event added to School Calendar!");
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
    setDeleteConfirmId(null);
    showSuccess("Event removed from history.");
  };

  // Separate banner states for each tab
  // Notice Board Banner: Latest urgent/pinned notice
  const urgentNotices = useMemo(() => {
    return notices.filter(n => n.category === 'Urgent' || n.pinned);
  }, [notices]);

  // Dynamic separation of events based on current date
  const today = useMemo(() => startOfDay(new Date()), []);
  
  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => {
        const eventDate = startOfDay(parseISO(e.date));
        return eventDate >= today;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, today]);

  const pastEvents = useMemo(() => {
    return events
      .filter(e => {
        const eventDate = startOfDay(parseISO(e.date));
        return eventDate < today;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Most recent past first
  }, [events, today]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 dark:shadow-none">
              {mobileTab === 'announcements' ? <Megaphone size={24} /> : <CalendarDays size={24} />}
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{mobileTab === 'announcements' ? 'Notice Board' : 'School Calendar'}</h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{mobileTab === 'announcements' ? 'Official school announcements and urgent alerts' : 'Upcoming events, schedules, and important dates'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsNoticeModalOpen(true)}
            className="rounded-2xl gap-2 h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 transition-transform"
          >
            <Plus size={18} /> Publish Notice
          </Button>
          <Button 
            onClick={() => setIsEventModalOpen(true)}
            variant="outline"
            className="rounded-2xl gap-2 h-12 px-6 border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform"
          >
            <CalendarDays size={18} /> Add Event
          </Button>
        </div>
      </div>

      {/* Notice Board Banner - Urgent/Pinned Notices */}
      {mobileTab === 'announcements' && urgentNotices.length > 0 && (
        <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-indigo-600 rounded-3xl p-4 sm:p-5 text-white shadow-xl shadow-rose-500/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 animate-pulse">
              <Flame size={22} className="text-amber-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">Urgent Alert</span>
                <span className="text-xs font-medium text-rose-100 truncate">{urgentNotices[0].date}</span>
              </div>
              <p className="font-bold text-sm sm:text-base truncate mt-0.5">{urgentNotices[0].title}</p>
            </div>
          </div>
          <Button 
            onClick={() => {
              const el = document.getElementById(`notice-${urgentNotices[0].id}`);
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            size="sm"
            className="bg-white text-rose-600 hover:bg-rose-50 rounded-xl font-bold shrink-0 text-xs shadow-md"
          >
            View Details
          </Button>
        </div>
      )}

      {/* School Calendar Banner - Next Upcoming Event */}
      {mobileTab === 'events' && upcomingEvents.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 rounded-3xl p-4 sm:p-5 text-white shadow-xl shadow-amber-500/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 animate-pulse">
              <CalendarDays size={22} className="text-amber-100" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                  Next Upcoming Event
                </span>
                <span className="text-xs font-medium text-amber-100 truncate">
                  {format(new Date(upcomingEvents[0].date), 'EEEE, MMM d')}
                </span>
              </div>
              <p className="font-bold text-sm sm:text-base truncate mt-0.5">{upcomingEvents[0].title}</p>
            </div>
          </div>
          <Button 
            onClick={() => {
              const el = document.getElementById(`event-${upcomingEvents[0].id}`);
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            size="sm"
            className="bg-white text-amber-600 hover:bg-amber-50 rounded-xl font-bold shrink-0 text-xs shadow-md"
          >
            View Details
          </Button>
        </div>
      )}

      {/* Mobile Segmented Toggle Switcher */}
      <div className="flex lg:hidden bg-slate-200/70 dark:bg-slate-800 p-1.5 rounded-2xl">
        <button
          onClick={() => setMobileTab('announcements')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            mobileTab === 'announcements' 
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md' 
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Megaphone size={16} /> Announcements ({notices.length})
        </button>
        <button
          onClick={() => setMobileTab('events')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            mobileTab === 'events' 
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md' 
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <CalendarDays size={16} /> Upcoming Events ({upcomingEvents.length})
        </button>
      </div>

      {/* Desktop/Tablet: Side-by-side 2-column view | Mobile: Conditional based on tab */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Notice Board / Announcements feed */}
        <div className={`lg:col-span-8 space-y-6 ${mobileTab !== 'announcements' ? 'hidden lg:block' : ''}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Megaphone className="text-indigo-600" size={20} />
              Notice Board Feed
            </h2>
            <span className="text-xs font-bold text-slate-400">{notices.length} Active Notices</span>
          </div>

          <div className="space-y-5">
            {notices.map((notice) => {
              // Priority badge styling
              let badgeVariant = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300";
              let dotColor = "bg-indigo-600";
              if (notice.category === 'Urgent') {
                badgeVariant = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300";
                dotColor = "bg-rose-600";
              } else if (notice.category === 'Finance') {
                badgeVariant = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300";
                dotColor = "bg-amber-500";
              }

              return (
                <div 
                  key={notice.id} 
                  id={`notice-${notice.id}`}
                  className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                >
                  {notice.pinned && (
                    <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-2xl shadow-sm flex items-center gap-1">
                      <Pin size={10} /> Pinned
                    </div>
                  )}

                  <div className="flex items-start gap-4 sm:gap-5">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 ${notice.color || 'bg-indigo-50 text-indigo-600'}`}>
                      <Bell size={24} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className={`px-3 py-1 rounded-full text-xs font-black border ${badgeVariant}`}>
                          {notice.category}
                        </span>
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={12} /> {notice.date}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                        {notice.title}
                      </h3>

                      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        {notice.content}
                      </p>

                      {notice.attachmentName && (
                        <div className="pt-2">
                          <a 
                            href={notice.attachmentUrl || '#'} 
                            onClick={(e) => { e.preventDefault(); showSuccess(`Downloading ${notice.attachmentName}`); }}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 transition-colors"
                          >
                            <Paperclip size={14} />
                            <span>{notice.attachmentName}</span>
                            <ExternalLink size={12} className="ml-1 text-slate-400" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Upcoming Events & Past Events History */}
        <div className={`lg:col-span-4 space-y-6 ${mobileTab !== 'events' ? 'hidden lg:block' : ''}`}>
          {/* Upcoming Events Section */}
          <Card className="rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <CalendarDays size={18} />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Upcoming Events</h3>
              </div>
              <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full">
                {upcomingEvents.length} Scheduled
              </span>
            </div>

            <div className="space-y-5">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => {
                  const dateObj = new Date(event.date);
                  const monthStr = !isNaN(dateObj.getTime()) ? format(dateObj, 'MMM').toUpperCase() : 'AUG';
                  const dayStr = !isNaN(dateObj.getTime()) ? format(dateObj, 'dd') : '28';
                  const isTodayEvent = isToday(dateObj);

                  return (
                    <div key={event.id} id={`event-${event.id}`} className={`flex items-start gap-4 group ${isTodayEvent ? 'ring-2 ring-indigo-500/50' : ''}`}>
                      {/* Bold Date Badge */}
                      <div className={`w-14 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm ${
                        isTodayEvent 
                          ? 'bg-indigo-600 text-white animate-pulse' 
                          : 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50'
                      }`}>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${isTodayEvent ? 'text-indigo-200' : 'text-indigo-500'}`}>{monthStr}</span>
                        <span className={`text-lg font-black ${isTodayEvent ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{dayStr}</span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                            {event.type || 'School Event'}
                          </span>
                          {isTodayEvent && (
                            <Badge className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
                              TODAY
                            </Badge>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug truncate">
                          {event.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                          <Clock size={12} className="shrink-0" /> {event.time}
                        </p>
                        {event.location && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                            <MapPin size={12} className="shrink-0" /> {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <CalendarDays size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">No upcoming events scheduled.</p>
                  <p className="text-xs text-slate-500 mt-1">Click "Add Event" to schedule a new event.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Past Events History Section */}
          <Card className="rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                  <CalendarDays size={18} />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Past Events History</h3>
              </div>
              <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full">
                {pastEvents.length} Completed
              </span>
            </div>

            <div className="space-y-4">
              {pastEvents.length > 0 ? (
                pastEvents.map((event) => {
                  const dateObj = new Date(event.date);
                  const monthStr = !isNaN(dateObj.getTime()) ? format(dateObj, 'MMM').toUpperCase() : 'AUG';
                  const dayStr = !isNaN(dateObj.getTime()) ? format(dateObj, 'dd') : '28';
                  const formattedDate = !isNaN(dateObj.getTime()) ? format(dateObj, 'EEEE, MMM d, yyyy') : event.date;

                  return (
                    <div key={event.id} id={`event-${event.id}`} className="flex items-start gap-4 group">
                      {/* Date Badge - Muted for past events */}
                      <div className="w-14 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shrink-0 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-all duration-300">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{monthStr}</span>
                        <span className="text-lg font-black text-slate-700 dark:text-slate-300">{dayStr}</span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {event.type || 'School Event'}
                          </span>
                          {/* Delete button for past events */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            onClick={() => setDeleteConfirmId(event.id.toString())}
                            title="Delete this past event record"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug truncate">
                          {event.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                          <Clock size={12} className="shrink-0" /> {event.time}
                        </p>
                        {event.location && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                            <MapPin size={12} className="shrink-0" /> {event.location}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 font-medium">
                          Completed on {formattedDate}
                        </p>
                      </div>
                    </div>
                  );
                })}
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                  <CalendarDays size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No past events recorded</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Events will appear here automatically after their scheduled date passes.</p>
                </div>
              )}
            </div>

            {/* Delete Confirmation Modal for Past Events */}
            {deleteConfirmId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Delete Past Event?</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">This will permanently remove the event from history.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="ghost" 
                      className="flex-1 rounded-xl h-11 font-bold"
                      onClick={() => setDeleteConfirmId(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive"
                      className="flex-1 rounded-xl h-11 font-bold"
                      onClick={() => handleDeleteEvent(parseInt(deleteConfirmId))}
                    >
                      <Trash2 size={16} className="mr-2" /> Delete Permanently
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

      </div>

      {/* Publish Notice Modal - Notice-specific form */}
      <Modal 
        isOpen={isNoticeModalOpen} 
        onClose={() => setIsNoticeModalOpen(false)} 
        title="Publish New Notice"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsNoticeModalOpen(false)} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button 
              onClick={handlePublishNotice} 
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-100"
            >
              <Send size={16} /> Publish Notice
            </Button>
          </>
        }
      >
        <form onSubmit={handlePublishNotice} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notice Title</Label>
            <Input 
              value={noticeTitle} 
              onChange={(e) => setNoticeTitle(e.target.value)} 
              placeholder="e.g. Term 3 Fee Payment Deadline" 
              className="rounded-xl h-11 border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Priority & Category</Label>
              <Select value={noticePriority} onValueChange={(v: any) => setNoticePriority(v)}>
                <SelectTrigger className="rounded-xl h-11 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Important">Important</SelectItem>
                  <SelectItem value="Urgent Alert">Urgent Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Audience</Label>
              <Select value={noticeAudience} onValueChange={(v: any) => setNoticeAudience(v)}>
                <SelectTrigger className="rounded-xl h-11 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select Audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Parents">Parents</SelectItem>
                  <SelectItem value="Learners">Learners</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Detailed Description</Label>
            <Textarea 
              value={noticeContent} 
              onChange={(e) => setNoticeContent(e.target.value)} 
              placeholder="Type the full announcement content here..." 
              className="rounded-2xl border-slate-200 dark:border-slate-700 min-h-[120px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Expiry Date (Optional)</Label>
            <Input 
              type="date" 
              value={noticeExpiryDate} 
              onChange={(e) => setNoticeExpiryDate(e.target.value)} 
              className="rounded-xl h-11 border-slate-200 dark:border-slate-700"
            />
          </div>
        </form>
      </Modal>

      {/* Add Event Modal - Calendar-specific form */}
      <Modal 
        isOpen={isEventModalOpen} 
        onClose={() => setIsEventModalOpen(false)} 
        title="Add New Calendar Event"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsEventModalOpen(false)} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button 
              onClick={handleAddEvent} 
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-100"
            >
              <Send size={16} /> Schedule Event
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddEvent} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Event Title</Label>
            <Input 
              value={eventTitle} 
              onChange={(e) => setEventTitle(e.target.value)} 
              placeholder="e.g. Annual Sports Day" 
              className="rounded-xl h-11 border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Date</Label>
              <Input 
                type="date" 
                value={eventDate} 
                onChange={(e) => setEventDate(e.target.value)} 
                className="rounded-xl h-11 border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Time Slot</Label>
              <Input 
                type="text" 
                value={eventTime} 
                onChange={(e) => setEventTime(e.target.value)} 
                placeholder="e.g. 09:00 AM - 02:00 PM" 
                className="rounded-xl h-11 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Location / Venue</Label>
            <Input 
              value={eventLocation} 
              onChange={(e) => setEventLocation(e.target.value)} 
              placeholder="e.g. School Main Sports Ground" 
              className="rounded-xl h-11 border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Event Details</Label>
            <Textarea 
              value={eventDetails} 
              onChange={(e) => setEventDetails(e.target.value)} 
              placeholder="Additional details about the event..." 
              className="rounded-2xl border-slate-200 dark:border-slate-700 min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Event Category</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="rounded-xl h-11 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Academic">Academic</SelectItem>
                <SelectItem value="Sports">Sports & Athletics</SelectItem>
                <SelectItem value="Exhibition">Exhibition & Fair</SelectItem>
                <SelectItem value="Ceremony">Ceremony & Assembly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
      </Modal>
    </div>
  );
}