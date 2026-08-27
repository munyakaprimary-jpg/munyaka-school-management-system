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
  UploadCloud,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Flame,
  CheckCircle2,
  CalendarDays,
  MoreVertical,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { showSuccess } from '@/utils/toast';
import { format, isToday, isSameDay, addDays } from 'date-fns';
import { Notice, SchoolEvent } from '@/types/notice';
import { useAuth } from '@/context/AuthContext';

// Generate mock blob URLs at module load time so seed attachments are genuinely downloadable
const createMockPdfBlob = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'application/pdf' });
  return { name: filename, url: URL.createObjectURL(blob) };
};

const MOCK_ATTACHMENTS = {
  feeGuidelines: createMockPdfBlob(
    'Term3_Fee_Guidelines_2025.pdf',
    'Term 3 Fee Guidelines\n\n1. All balances must be cleared by the end of Week 10.\n2. Payment via bank slip or M-Pesa is accepted.\n3. Contact bursar@munyakaschool.ac.ke for queries.'
  ),
  examSchedule: createMockPdfBlob(
    'MidTerm_Exam_Schedule.pdf',
    'Mid-Term Examination Schedule\n\nGrade 1-3: Mon-Thu, Week 5\nGrade 4-7: Mon-Thu, Week 5\nGrade 8-9: Fri of Week 5 + Mon-Thu, Week 6\n\nAll exams start at 8:00 AM.'
  ),
};

const INITIAL_NOTICES: Notice[] = [
  {
    id: 'n1',
    title: 'Urgent: Term 3 Fee Balance Deadline & Statement Verification',
    content: 'All parents and guardians are kindly reminded that the deadline for clearing 100% of Term 3 school fee balances is Friday of next week. Please ensure bank payment slips are presented to the bursar.',
    description: 'All parents and guardians are kindly reminded that the deadline for clearing 100% of Term 3 school fee balances is Friday...',
    date: 'Today, 08:30 AM',
    category: 'Urgent',
    pinned: true,
    attachmentName: MOCK_ATTACHMENTS.feeGuidelines.name,
    attachmentUrl: MOCK_ATTACHMENTS.feeGuidelines.url,
    color: 'bg-rose-50 text-rose-600 border-rose-200',
    createdBy: 'admin-001'
  },
  {
    id: 'n2',
    title: 'Mid-Term Examination Timetable and Revision Guidelines',
    content: 'Mid-Term examinations for Grades 1 to 9 will commence on Monday. Teachers have uploaded all revision materials into the Digital Hub and E-Resources library.',
    description: 'Mid-Term examinations for Grades 1 to 9 will commence on Monday. Teachers have uploaded all revision materials...',
    date: 'Yesterday, 02:15 PM',
    category: 'General',
    pinned: false,
    attachmentName: MOCK_ATTACHMENTS.examSchedule.name,
    attachmentUrl: MOCK_ATTACHMENTS.examSchedule.url,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    createdBy: 'admin-001'
  },
  {
    id: 'n3',
    title: 'School Canteen Supplier Update & Subsidy Announcement',
    content: 'We have updated our nutritional supplier guidelines to incorporate fresh organic milk and locally sourced fruits for all Junior Secondary students.',
    description: 'We have updated our nutritional supplier guidelines to incorporate fresh organic milk and locally sourced fruits...',
    date: 'Oct 24, 2025',
    category: 'Finance',
    pinned: false,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    createdBy: 'admin-001'
  }
];

// Regenerates a valid blob: URL for a seed attachment so it survives page reloads.
// This creates a tiny placeholder file whose name reflects the original.
function regenerateAttachmentUrl(filename: string): string {
  const content = `This is a placeholder file for "${filename}" — a real file would be stored on the server.`;
  const blob = new Blob([content], { type: 'application/octet-stream' });
  return URL.createObjectURL(blob);
}

const INITIAL_EVENTS: SchoolEvent[] = [
  {
    id: 'e1',
    title: 'Annual Inter-House Athletics Championship',
    date: '2025-08-28',
    time: '08:30 AM - 03:00 PM',
    location: 'Main School Sports Ground',
    type: 'Sports',
    priority: 'high'
  },
  {
    id: 'e2',
    title: 'Grade 6 & 9 Parent-Teacher Consultation Day',
    date: '2025-08-30',
    time: '09:00 AM - 01:00 PM',
    location: 'Main Assembly Hall',
    type: 'Academic',
    priority: 'normal'
  },
  {
    id: 'e3',
    title: 'National Science & ICT Fair Exhibition',
    date: '2025-09-04',
    time: '10:00 AM - 04:00 PM',
    location: 'Computer Lab & Science Center',
    type: 'Exhibition',
    priority: 'high'
  },
  {
    id: 'e4',
    title: 'End of Term 3 Closing Ceremony',
    date: '2025-09-18',
    time: '09:00 AM - 12:00 PM',
    location: 'School Main Hall',
    type: 'Ceremony',
    priority: 'normal'
  }
];

export default function NoticeAndEvents({ defaultTab = 'announcements' }: { defaultTab?: 'announcements' | 'events' }) {
  const { user } = useAuth();

  // Permission helper: only super admins, head teachers, and the original
  // creator of the notice may delete it. All other roles see no action menu.
  const canDeleteNotice = (notice: Notice): boolean => {
    if (!user) return false;
    const isAdmin =
      user.role === 'super_admin' || user.role === 'head_teacher';
    const isCreator = notice.createdBy === user.id;
    return isAdmin || isCreator;
  };
  // LocalStorage Persistence for Notices and Events
  const [notices, setNotices] = useState<Notice[]>(() => {
    try {
      const saved = localStorage.getItem('munyaka_notices_v2');
      if (saved) {
        const parsed: Notice[] = JSON.parse(saved) as Notice[];
        // Refresh any dead blob: URLs from seed attachments so downloads keep working
        // across page reloads (blob URLs are session-scoped and don't survive).
        return parsed.map(n => {
          if (!n.attachmentName) return n;
          const urlIsDead = !n.attachmentUrl || n.attachmentUrl === '#' || n.attachmentUrl.startsWith('blob:');
          if (!urlIsDead) return n;
          const regenerated = regenerateAttachmentUrl(n.attachmentName);
          return { ...n, attachmentUrl: regenerated };
        });
      }
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

  // Separate modal states for Notice and Event
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Delete confirmation state
  const [noticePendingDelete, setNoticePendingDelete] = useState<Notice | null>(null);

  const handleDeleteNotice = (notice: Notice) => {
    setNotices(prev => prev.filter(n => n.id !== notice.id));
    setNoticePendingDelete(null);
    showSuccess('Notice deleted successfully');
  };

  // Notice Form State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticePriority, setNoticePriority] = useState<'Normal' | 'Important' | 'Urgent Alert'>('Normal');
  const [noticeAudience, setNoticeAudience] = useState<'All' | 'Staff' | 'Parents' | 'Learners'>('All');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeExpiryDate, setNoticeExpiryDate] = useState('');
  const [noticeAttachment, setNoticeAttachment] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Read a File into a base64 data URL so it can be persisted to localStorage
  // and remain downloadable after a page reload.
  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  // Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [eventType, setEventType] = useState('Academic');

  useEffect(() => {
    localStorage.setItem('munyaka_notices_v2', JSON.stringify(notices));
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
    localStorage.setItem('munyaka_events_v2', JSON.stringify(events));
  }, [events]);

  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;
    
    let badgeColor = 'bg-indigo-50 text-indigo-600 border-indigo-200';
    if (noticePriority === 'Urgent Alert') badgeColor = 'bg-rose-50 text-rose-600 border-rose-200';
    if (noticePriority === 'Important') badgeColor = 'bg-amber-50 text-amber-600 border-amber-200';

    // For uploaded files, read as a data URL so the file remains downloadable
    // across page reloads (data URLs are persisted in localStorage).
    let attachmentUrl: string | undefined;
    if (noticeAttachment) {
      try {
        attachmentUrl = await readFileAsDataUrl(noticeAttachment);
      } catch {
        attachmentUrl = URL.createObjectURL(noticeAttachment);
      }
    }

    const newNotice: Notice = {
      id: Date.now().toString(),
      title: noticeTitle.trim(),
      content: noticeContent.trim(),
      description: noticeContent.trim().substring(0, 120) + '...',
      date: 'Just now',
      category: noticePriority,
      pinned: noticePriority === 'Urgent Alert',
      color: badgeColor,
      attachmentName: noticeAttachment?.name || undefined,
      attachmentUrl,
      createdBy: user?.id
    };

    setNotices([newNotice, ...notices]);
    setNoticeTitle('');
    setNoticeContent('');
    setNoticePriority('Normal');
    setNoticeAudience('All');
    setNoticeExpiryDate('');
    setNoticeAttachment(null);
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

  // Trigger an actual file download for a notice's attachment.
  // Works for both blob: URLs (user uploads, mock seeds) and http(s) URLs.
  const handleAttachmentDownload = (notice: Notice) => {
    if (!notice.attachmentUrl) return;
    try {
      const link = document.createElement('a');
      link.href = notice.attachmentUrl;
      // The `download` attribute prompts the browser to save rather than navigate.
      // For blob: URLs the filename is respected; for cross-origin URLs the browser
      // falls back to opening the URL in a new tab.
      link.download = notice.attachmentName || 'attachment';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess(`Downloading ${notice.attachmentName}`);
    } catch (err) {
      // Fallback: open in a new tab if the programmatic click fails
      window.open(notice.attachmentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Separate banner states for each tab
  // Notice Board Banner: Latest urgent/pinned notice
  const urgentNotices = useMemo(() => {
    return notices.filter(n => n.category === 'Urgent' || n.pinned);
  }, [notices]);

  // School Calendar Banner: Next upcoming high-priority event
  const upcomingHighPriorityEvent = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return events
      .filter(e => {
        const eventDate = new Date(e.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today && (e.priority === 'high' || e.priority === 'urgent');
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [events]);

  // Fallback: next upcoming event if no high-priority events
  const nextUpcomingEvent = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return events
      .filter(e => {
        const eventDate = new Date(e.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [events]);

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
          {mobileTab === 'announcements' ? (
            <Button
              onClick={() => setIsNoticeModalOpen(true)}
              className="rounded-2xl gap-2 h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 transition-transform"
            >
              <Plus size={18} /> Publish Notice
            </Button>
          ) : (
            <Button
              onClick={() => setIsEventModalOpen(true)}
              variant="outline"
              className="rounded-2xl gap-2 h-12 px-6 border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform"
            >
              <Plus size={18} /> Add Event
            </Button>
          )}
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

      {/* School Calendar Banner - Upcoming High-Priority Event */}
      {mobileTab === 'events' && (upcomingHighPriorityEvent || nextUpcomingEvent) && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 rounded-3xl p-4 sm:p-5 text-white shadow-xl shadow-amber-500/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 animate-pulse">
              <CalendarDays size={22} className="text-amber-100" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                  {upcomingHighPriorityEvent ? 'High Priority Event' : 'Upcoming Event'}
                </span>
                <span className="text-xs font-medium text-amber-100 truncate">
                  {upcomingHighPriorityEvent || nextUpcomingEvent ? format(new Date((upcomingHighPriorityEvent || nextUpcomingEvent)!.date), 'EEEE, MMM d') : ''}
                </span>
              </div>
              <p className="font-bold text-sm sm:text-base truncate mt-0.5">
                {(upcomingHighPriorityEvent || nextUpcomingEvent)!.title}
              </p>
            </div>
          </div>
          <Button 
            onClick={() => {
              const el = document.getElementById(`event-${(upcomingHighPriorityEvent || nextUpcomingEvent)!.id}`);
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
                    <div className="absolute top-0 right-12 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-2xl shadow-sm flex items-center gap-1">
                      <Pin size={10} /> Pinned
                    </div>
                  )}

                  {canDeleteNotice(notice) && (
                    <div className="absolute top-3 right-3 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            aria-label="Notice options"
                          >
                            <MoreVertical size={18} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg">
                          <DropdownMenuItem
                            onClick={() => setNoticePendingDelete(notice)}
                            className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer rounded-lg"
                          >
                            <Trash2 size={16} className="mr-2" />
                            Delete Notice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                          <button
                            type="button"
                            onClick={() => handleAttachmentDownload(notice)}
                            data-testid={`notice-attachment-${notice.id}`}
                            aria-label={`Download ${notice.attachmentName}`}
                            title={`Download ${notice.attachmentName}`}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors active:scale-[0.98]"
                          >
                            <Paperclip size={14} />
                            <span>{notice.attachmentName}</span>
                            <ExternalLink size={12} className="ml-1 text-slate-400" />
                          </button>
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
                  <div key={event.id} id={`event-${event.id}`} className="flex items-start gap-4 group">
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
                onClick={() => setIsEventModalOpen(true)}
                variant="outline" 
                className="w-full rounded-2xl font-bold h-11 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              >
                <Plus size={16} className="mr-2" /> Add Calendar Event
              </Button>
            </div>
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

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Attach File / Document (Optional)</Label>
            {noticeAttachment ? (
              <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{noticeAttachment.name}</p>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {(noticeAttachment.size / 1024).toFixed(1)} KB · {noticeAttachment.type || 'File'}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Remove attached file"
                  onClick={() => setNoticeAttachment(null)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const dropped = e.dataTransfer.files?.[0];
                  if (dropped) setNoticeAttachment(dropped);
                }}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                data-testid="notice-attachment-zone"
                className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30'
                }`}
              >
                <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                  <UploadCloud size={22} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    <span className="text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">PDF, DOCX, images (max 10MB)</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp,.txt,.xls,.xlsx,.ppt,.pptx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setNoticeAttachment(f);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </div>
            )}
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

      {/* Delete Notice Confirmation Dialog */}
      <AlertDialog open={!!noticePendingDelete} onOpenChange={() => setNoticePendingDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">Delete Notice?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              This will permanently remove "<strong>{noticePendingDelete?.title}</strong>" from the notice board. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold border-slate-200 dark:border-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => noticePendingDelete && handleDeleteNotice(noticePendingDelete)}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold gap-2 shadow-lg shadow-rose-100"
            >
              <Trash2 size={16} />
              Delete Notice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}