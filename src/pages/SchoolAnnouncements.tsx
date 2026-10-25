"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Modal from '@/components/ui/Modal';
import { 
  MessageSquare, 
  Bell, 
  Search, 
  Megaphone, 
  BookOpen, 
  CreditCard, 
  UserCheck, 
  Calendar, 
  Sparkles, 
  ArrowUpRight, 
  CheckCircle2, 
  Filter,
  Inbox
} from 'lucide-react';
import { CentralDataService } from '@/services/centralDataService';
import { CommunicationItem } from './TeacherCommunication';

const COMMUNICATION_STORAGE_KEY = 'munyaka_school_communications';

const SchoolAnnouncements = () => {
  const [communications, setCommunications] = useState<CommunicationItem[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<CommunicationItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Load items from local storage
  const loadCommunications = () => {
    try {
      const items = CentralDataService.getData<CommunicationItem[]>(COMMUNICATION_STORAGE_KEY, []);
      if (items && Array.isArray(items) && items.length > 0) {
        setCommunications(items);
      } else {
        // Fallback default mock records if empty
        const defaults: CommunicationItem[] = [
          {
            id: 'comm-1',
            type: 'ANNOUNCEMENT',
            title: 'Term 1 Opening Dates & Reporting Instructions',
            content: 'Dear Parents and Guardians, we are delighted to welcome you to the new academic term. All learners are expected to report on Monday by 8:00 AM in full clean uniform. Kindly ensure all holiday assignments and book returns are completed.',
            sender: "Principal's Office",
            targetAudience: 'ALL_PARENTS',
            priority: 'URGENT',
            timestamp: 'Today, 08:30 AM'
          },
          {
            id: 'comm-2',
            type: 'FEE_CIRCULAR',
            title: 'Fee Payment Guidelines and Bank Account Details',
            content: 'Please note that fee balances for the current term are due by the 5th of next month. Payments should be made directly through the school bank accounts or official M-Pesa paybill. Receipt slips must be submitted to the bursar.',
            sender: 'Bursar & Finance Office',
            targetAudience: 'ALL_PARENTS',
            priority: 'NORMAL',
            timestamp: 'Yesterday, 02:15 PM'
          },
          {
            id: 'comm-3',
            type: 'HOMEWORK',
            title: 'Grade 5 Science Practical Observation Project',
            content: 'Learners are required to observe plant growth over the week and record daily heights in their science journals. Group discussions will take place during Friday lesson.',
            sender: 'Tr. Joseph (Grade 5)',
            targetAudience: 'SPECIFIC_GRADE',
            priority: 'NORMAL',
            timestamp: '3 days ago'
          }
        ];
        setCommunications(defaults);
      }
    } catch {
      setCommunications([]);
    }
  };

  useEffect(() => {
    loadCommunications();
    const handleStorage = () => loadCommunications();
    window.addEventListener('storage', handleStorage);
    // Poll storage every 2s for reactive updates within app tabs
    const interval = setInterval(loadCommunications, 2000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const filteredCommunications = useMemo(() => {
    return communications.filter(item => {
      const matchesType = filterType === 'ALL' || item.type === filterType;
      const matchesSearch = !searchQuery.trim() || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sender.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [communications, filterType, searchQuery]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ANNOUNCEMENT': return <Megaphone className="text-indigo-500" size={20} />;
      case 'HOMEWORK': return <BookOpen className="text-emerald-500" size={20} />;
      case 'FEE_CIRCULAR': return <CreditCard className="text-amber-500" size={20} />;
      case 'TEACHER_DIRECT': return <MessageSquare className="text-purple-500" size={20} />;
      default: return <Bell className="text-slate-500" size={20} />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'ANNOUNCEMENT': return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300';
      case 'HOMEWORK': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300';
      case 'FEE_CIRCULAR': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300';
      case 'TEACHER_DIRECT': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-indigo-500/30 text-white border-white/20 font-bold px-3 py-1">Parent & Learner Inbox</Badge>
            <Badge className="bg-white/20 text-white border-transparent font-bold">Live School Feed</Badge>
          </div>
          <h1 className="text-3xl font-black tracking-tight">School Announcements & Circulars</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Stay informed with official announcements, homework tasks, fee circulars, and direct teacher broadcasts synchronized in real time.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 text-center shrink-0">
          <div className="text-3xl font-black">{communications.length}</div>
          <div className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Total Notices</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements, teachers, keywords..."
            className="pl-11 h-12 rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <Button
            variant={filterType === 'ALL' ? 'default' : 'outline'}
            onClick={() => setFilterType('ALL')}
            className="rounded-xl font-bold text-xs h-10 px-4"
          >
            All Items
          </Button>
          <Button
            variant={filterType === 'ANNOUNCEMENT' ? 'default' : 'outline'}
            onClick={() => setFilterType('ANNOUNCEMENT')}
            className="rounded-xl font-bold text-xs h-10 px-4"
          >
            Announcements
          </Button>
          <Button
            variant={filterType === 'HOMEWORK' ? 'default' : 'outline'}
            onClick={() => setFilterType('HOMEWORK')}
            className="rounded-xl font-bold text-xs h-10 px-4"
          >
            Homework
          </Button>
          <Button
            variant={filterType === 'FEE_CIRCULAR' ? 'default' : 'outline'}
            onClick={() => setFilterType('FEE_CIRCULAR')}
            className="rounded-xl font-bold text-xs h-10 px-4"
          >
            Fee Circulars
          </Button>
          <Button
            variant={filterType === 'TEACHER_DIRECT' ? 'default' : 'outline'}
            onClick={() => setFilterType('TEACHER_DIRECT')}
            className="rounded-xl font-bold text-xs h-10 px-4"
          >
            Teacher Direct
          </Button>
        </div>
      </div>

      {/* Communications Grid / List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCommunications.map((item) => (
          <Card
            key={item.id}
            onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}
            className="rounded-[2rem] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all cursor-pointer group p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  {getTypeIcon(item.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`font-bold text-[10px] ${getTypeBadgeColor(item.type)}`}>
                      {item.type.replace('_', ' ')}
                    </Badge>
                    {item.priority === 'URGENT' && (
                      <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px]">
                        URGENT ALERT
                      </Badge>
                    )}
                    <span className="text-xs text-slate-400 font-medium ml-2">• {item.timestamp}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 font-medium">
                    {item.content}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{item.sender}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wide">{item.targetAudience.replace('_', ' ')}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowUpRight size={18} />
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filteredCommunications.length === 0 && (
          <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-16 text-center">
            <Inbox className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">No communications found</h3>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search query or filter category.</p>
          </Card>
        )}
      </div>

      {/* Details Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Announcement Details">
        {selectedItem && (
          <div className="space-y-6 py-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`font-bold text-xs ${getTypeBadgeColor(selectedItem.type)}`}>
                {selectedItem.type.replace('_', ' ')}
              </Badge>
              {selectedItem.priority === 'URGENT' && (
                <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold text-xs">
                  URGENT ALERT
                </Badge>
              )}
              <span className="text-xs text-slate-400 font-medium ml-auto">{selectedItem.timestamp}</span>
            </div>

            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {selectedItem.title}
            </h2>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Sender / Author</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{selectedItem.sender}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Target Audience</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{selectedItem.targetAudience.replace('_', ' ')}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Message Content</p>
              <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {selectedItem.content}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 text-white">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SchoolAnnouncements;
