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
  CalendarDays
} from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { format, isToday, isSameDay } from 'date-fns';
import { Notice, SchoolEvent } from '@/types/notice';

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

const INITIAL_EVENTS: SchoolEvent[] = [
  {
    id: 'e1',
    title: 'Annual Inter-House Athletics Championship',
    date: '2025-08-28',
    time: '08:30 AM - 03:00 PM',
    location: 'Main School Sports Ground',
    type: 'Sports'
  },
  {
    id: 'e2',
    title: 'Grade 6 & 9 Parent-Teacher Consultation Day',
    date: '2025-08-30',
    time: '09:00 AM - 01:00 PM',
    location: 'Main Assembly Hall',
    type: 'Academic'
  },
  {
    id: 'e3',
    title: 'National Science & ICT Fair Exhibition',
    date: '2025-09-04',
    time: '10:00 AM - 04:00 PM',
    location: 'Computer Lab & Science Center',
    type: 'Exhibition'
  },
  {
    id: 'e4',
    title: 'End of Term 3 Closing Ceremony',
    date: '2025-09-18',
    time: '09:00 AM - 12:00 PM',
    location: 'School Main Hall',
    type: 'Ceremony'
  }
];

export default function NoticeAndEvents({ defaultTab = 'announcements' }: { defaultTab?: 'announcements' | 'events' }) {
  // LocalStorage Persistence for Notices and Events
  const [notices, setNotices] = useState<Notice[]>(() => {
    try {
      const saved = localStorage.getItem('munyaka_notices_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_NOTICES;
  });

  const [events, setEvents] = useState<SchoolEvent[]>(() => {
    try {
      const saved = localStorage.getItem('munyaka_events_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_EVENTS;
  });

  // Mobile/responsive segmented toggle: 'announcements' | 'events'
  const [mobileTab, setMobileTab] = useState<'announcements' | 'events'>(defaultTab);

  // Update tab when route changes or defaultTab prop updates
  useEffect(() => {
    setMobileTab(defaultTab);
  }, [defaultTab]);

  // Determine header title & subtext based on current tab / route context
  const headerTitle = mobileTab === 'announcements' ? 'Notice Board' : 'School Calendar';
  const headerSubtext = mobileTab === 'announcements'
    ? 'Official school announcements and urgent alerts'
    : 'Upcoming events, schedules, and important dates';

  // Publish Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [publishType, setPublishType] = useState<'notice' | 'event'>('notice');

  // Notice Form State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<'Urgent' | 'General' | 'Finance'>('General');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeAttachment, setNoticeAttachment] = useState('');

  // Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventType, setEventType] = useState('Academic');

  useEffect(() => {
    localStorage.setItem('munyaka_notices_v2', JSON.stringify(notices));
  }, [notices]);

  useEffect(() => {
    localStorage.setItem('munyaka_events_v2', JSON.stringify(events));
  }, [events]);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (publishType === 'notice') {
      if (!noticeTitle.trim() || !noticeContent.trim()) return;
      
      let badgeColor = 'bg-indigo-50 text-indigo-600 border-indigo-200';
      if (noticeCategory === 'Urgent') badgeColor = 'bg-rose-50 text-rose-600 border-rose-200';
      if (noticeCategory === 'Finance') badgeColor = 'bg-amber-50 text-amber-600 border-amber-200';

      const newNotice: Notice = {
        id: Date.now().toString(),
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        description: noticeContent.trim().substring(0, 120) + '...',
        date: 'Just now',
        category: noticeCategory,
        pinned: noticeCategory === 'Urgent',
        attachmentName: noticeAttachment ? noticeAttachment.split(/(\\|\/)/g).pop() : undefined,
        attachmentUrl: noticeAttachment ? '#' : undefined,
        color: badgeColor
      };

      setNotices([newNotice, ...notices]);
      setNoticeTitle('');
      setNoticeContent('');
      setNoticeAttachment('');
      showSuccess("New Notice published successfully!");
    } else {
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
      showSuccess("New Event added to School Calendar!");
    }
    setIsModalOpen(false);
  };

  // Urgent notices for sticky top banner
  const urgentNotices = useMemo(() => {
    return notices.filter(n => n.category === 'Urgent' || n.pinned);
  }, [notices]);

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
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{headerTitle}</h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{headerSubtext}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => { setPublishType('notice'); setIsModalOpen(true); }}
            className="rounded-2xl gap-2 h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 transition-transform"
          >
            <Plus size={18} /> Publish Notice
          </Button>
          <Button 
            onClick={() => { setPublishType('event'); setIsModalOpen(true); }}
            variant="outline"
            className="rounded-2xl gap-2 h-12 px-6 border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform"
          >
            <CalendarDays size={18} /> Add Event
          </Button>
        </div>
      </div>

      {/* Sticky Top Banner for Urgent / Pinned Notices */}
      {urgentNotices.length > 0 && (
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
          <CalendarDays size={16} /> Upcoming Events ({events.length})
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

        {/* Right Column: Upcoming Events Feed Sidebar */}
        <div className={`lg:col-span-4 space-y-6 ${mobileTab !== 'events' ? 'hidden lg:block' : ''}`}>
          <Card className="rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <CalendarDays size={18} />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Upcoming Events</h3>
              </div>
              <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full">
                {events.length} Dates
              </span>
            </div>

            <div className="space-y-5">
              {events.map((event) => {
                const dateObj = new Date(event.date);
                const monthStr = !isNaN(dateObj.getTime()) ? format(dateObj, 'MMM').toUpperCase() : 'AUG';
                const dayStr = !isNaN(dateObj.getTime()) ? format(dateObj, 'dd') : '28';

                return (
                  <div key={event.id} className="flex items-start gap-4 group">
                    {/* Bold Date Badge */}
                    <div className="w-14 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex flex-col items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 group-hover:text-indigo-200">{monthStr}</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white group-hover:text-white">{dayStr}</span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                          {event.type || 'School Event'}
                        </span>
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
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <Button 
                onClick={() => { setPublishType('event'); setIsModalOpen(true); }}
                variant="outline" 
                className="w-full rounded-2xl font-bold h-11 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              >
                <Plus size={16} className="mr-2" /> Add Calendar Event
              </Button>
            </div>
          </Card>
        </div>

      </div>

      {/* Publish Modal (Supports Notice or Event based on state) */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={publishType === 'notice' ? 'Publish New Notice' : 'Add New Calendar Event'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button 
              onClick={handlePublish} 
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-100"
            >
              <Send size={16} /> {publishType === 'notice' ? 'Publish Notice' : 'Schedule Event'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          {/* Switcher inside modal */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-4">
            <button
              type="button"
              onClick={() => setPublishType('notice')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${publishType === 'notice' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              Notice Announcement
            </button>
            <button
              type="button"
              onClick={() => setPublishType('event')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${publishType === 'event' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              Calendar Event
            </button>
          </div>

          {publishType === 'notice' ? (
            <>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Priority & Category</Label>
                <Select value={noticeCategory} onValueChange={(v: any) => setNoticeCategory(v)}>
                  <SelectTrigger className="rounded-xl h-11 border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Urgent">Urgent (Red Badge)</SelectItem>
                    <SelectItem value="General">General (Blue Badge)</SelectItem>
                    <SelectItem value="Finance">Finance (Yellow Badge)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notice Title</Label>
                <Input 
                  value={noticeTitle} 
                  onChange={(e) => setNoticeTitle(e.target.value)} 
                  placeholder="e.g. Term 3 Closing Date & Report Card Collections" 
                  className="rounded-xl h-11 border-slate-200 dark:border-slate-700"
                />
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
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Attachment (Optional PDF / Document)</Label>
                <Input 
                  type="file" 
                  onChange={(e) => setNoticeAttachment(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-700 cursor-pointer"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Event Title</Label>
                <Input 
                  value={eventTitle} 
                  onChange={(e) => setEventTitle(e.target.value)} 
                  placeholder="e.g. Annual Sports Day & Prize Giving" 
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
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
