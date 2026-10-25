"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { 
  MessageSquare, 
  Send, 
  History, 
  Sparkles, 
  Megaphone, 
  FileText, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  Bell, 
  Search, 
  Pin, 
  Calendar,
  Filter,
  Check
} from 'lucide-react';
import { CentralDataService } from '@/services/centralDataService';
import { showSuccess, showError } from '@/utils/toast';
import { useNotifications } from '@/components/ui/notification-provider';

// Unified Storage Key as requested
const COMMUNICATION_STORAGE_KEY = 'munyaka_school_communications';

export interface CommunicationItem {
  id: string;
  type: 'ANNOUNCEMENT' | 'TEACHER_DIRECT' | 'HOMEWORK' | 'FEE_CIRCULAR';
  title: string;
  content: string;
  sender: string; // e.g., "Principal's Office" or "Tr. Joseph (Grade 5)"
  targetAudience: 'ALL_PARENTS' | 'SPECIFIC_GRADE' | 'STAFF';
  priority: 'NORMAL' | 'URGENT';
  timestamp: string;
}

const getInitialCommunications = (): CommunicationItem[] => {
  try {
    const saved = CentralDataService.getData<CommunicationItem[]>(COMMUNICATION_STORAGE_KEY, []);
    if (saved && saved.length > 0) return saved;
  } catch {}

  const defaultItems: CommunicationItem[] = [
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
    },
    {
      id: 'comm-4',
      type: 'TEACHER_DIRECT',
      title: 'Staff Meeting on CBC Assessment Portals',
      content: 'All teachers are reminded to attend the departmental meeting in the main staffroom at 3:30 PM today to review formative assessment score entries.',
      sender: 'Deputy Headteacher',
      targetAudience: 'STAFF',
      priority: 'URGENT',
      timestamp: 'Today, 10:00 AM'
    }
  ];

  try {
    CentralDataService.setData(COMMUNICATION_STORAGE_KEY, defaultItems);
  } catch {}

  return defaultItems;
};

const TeacherCommunication = () => {
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
  const [communications, setCommunications] = useState<CommunicationItem[]>(getInitialCommunications());
  
  // Form state
  const [type, setType] = useState<'ANNOUNCEMENT' | 'TEACHER_DIRECT' | 'HOMEWORK' | 'FEE_CIRCULAR'>('ANNOUNCEMENT');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sender, setSender] = useState("Tr. Joseph (Grade 5)");
  const [targetAudience, setTargetAudience] = useState<'ALL_PARENTS' | 'SPECIFIC_GRADE' | 'STAFF'>('ALL_PARENTS');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CommunicationItem | null>(null);
  const { addNotification } = useNotifications();

  // Load latest on mount & storage events
  useEffect(() => {
    const handleStorage = () => {
      setCommunications(getInitialCommunications());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showError('Please provide both title and content.');
      return;
    }

    const newItem: CommunicationItem = {
      id: 'comm-' + Date.now(),
      type,
      title: title.trim(),
      content: content.trim(),
      sender: sender.trim() || 'School Administration',
      targetAudience,
      priority,
      timestamp: 'Just now'
    };

    const updated = [newItem, ...communications];
    setCommunications(updated);
    try {
      CentralDataService.setData(COMMUNICATION_STORAGE_KEY, updated);
      window.dispatchEvent(new Event('storage'));
    } catch {}

    showSuccess(`Successfully broadcasted "${title}" to ${targetAudience.replace('_', ' ')}!`);
    
    if (typeof addNotification === 'function') {
      addNotification({
        title: `School Broadcast: ${type.replace('_', ' ')}`,
        message: title,
        priority: priority === 'URGENT' ? 'high' : 'medium',
      });
    }

    setTitle('');
    setContent('');
    setActiveTab('history');
  };

  const handleDelete = (id: string) => {
    const updated = communications.filter(c => c.id !== id);
    setCommunications(updated);
    try {
      CentralDataService.setData(COMMUNICATION_STORAGE_KEY, updated);
      window.dispatchEvent(new Event('storage'));
    } catch {}
    showSuccess('Communication removed successfully.');
    setIsModalOpen(false);
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 via-purple-700 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-900/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-white/20 text-white border-transparent font-bold px-3 py-1">Teacher & Admin Portal</Badge>
            <Badge className="bg-indigo-500/30 text-white border-white/20 font-bold">Unified Broadcast System</Badge>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Communication & Announcements Center</h1>
          <p className="text-indigo-100 text-sm mt-1 max-w-xl">
            Create school announcements, homework briefs, direct teacher circulars, and fee notices. All items instantly sync to the parent and learner inbox.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setActiveTab('compose')}
            className={`rounded-2xl font-bold gap-2 ${activeTab === 'compose' ? 'bg-white text-indigo-900 hover:bg-indigo-50' : 'bg-indigo-700/60 text-white hover:bg-indigo-700'}`}
          >
            <Send size={16} /> Compose Broadcast
          </Button>
          <Button
            onClick={() => setActiveTab('history')}
            className={`rounded-2xl font-bold gap-2 ${activeTab === 'history' ? 'bg-white text-indigo-900 hover:bg-indigo-50' : 'bg-indigo-700/60 text-white hover:bg-indigo-700'}`}
          >
            <History size={16} /> All Broadcasts ({communications.length})
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full space-y-6">
        <TabsList className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-14 inline-flex gap-2">
          <TabsTrigger value="compose" className="rounded-xl px-6 h-full font-bold text-sm data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Send size={16} className="mr-2" /> Compose & Broadcast
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl px-6 h-full font-bold text-sm data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <History size={16} className="mr-2" /> Broadcast History & Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Templates / Guidelines */}
            <div className="space-y-4">
              <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-500" /> Quick Templates
                </h3>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setType('ANNOUNCEMENT');
                      setTitle('Important School Assembly & Notice');
                      setContent('All parents and learners are advised that our special assembly will be held tomorrow morning. Punctuality is required.');
                      setTargetAudience('ALL_PARENTS');
                      setPriority('NORMAL');
                    }}
                    className="w-full text-left p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-100 dark:border-slate-700 transition-all text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    📢 School Assembly Notice
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType('HOMEWORK');
                      setTitle('Weekly Homework & Revision Brief');
                      setContent('Kindly assist learners in completing their reading assignments and mathematics problem sets before the weekend review.');
                      setTargetAudience('SPECIFIC_GRADE');
                      setPriority('NORMAL');
                    }}
                    className="w-full text-left p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-100 dark:border-slate-700 transition-all text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    📚 Homework Brief
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType('FEE_CIRCULAR');
                      setTitle('Term 1 Fee Payment Circular & Deadlines');
                      setContent('Dear Parents, please clear outstanding school fee balances to ensure smooth provision of learning materials and meals.');
                      setTargetAudience('ALL_PARENTS');
                      setPriority('URGENT');
                    }}
                    className="w-full text-left p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-100 dark:border-slate-700 transition-all text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    💳 Fee Circular
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType('TEACHER_DIRECT');
                      setTitle('Staff Coordination & Briefing');
                      setContent('All faculty members are requested to submit end-of-week lesson reflections and attendance tallies by Friday afternoon.');
                      setTargetAudience('STAFF');
                      setPriority('NORMAL');
                    }}
                    className="w-full text-left p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-100 dark:border-slate-700 transition-all text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    👥 Teacher Direct Note
                  </button>
                </div>
              </Card>

              <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 bg-indigo-50/60 dark:bg-indigo-950/20 shadow-sm p-6">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm mb-1">Unified Storage Key</h4>
                <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed font-mono bg-white/60 dark:bg-indigo-900/30 p-2 rounded-xl mt-2">
                  munyaka_school_communications
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-2">
                  Broadcasts saved here automatically synchronize across the Parent & Learner Inbox in real time.
                </p>
              </Card>
            </div>

            {/* Compose Form */}
            <div className="lg:col-span-2">
              <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
                <form onSubmit={handleBroadcast} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Communication Type</Label>
                      <Select value={type} onValueChange={(v: any) => setType(v)}>
                        <SelectTrigger className="rounded-2xl h-12 border-slate-200 dark:border-slate-700 font-bold">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="ANNOUNCEMENT">📢 General Announcement</SelectItem>
                          <SelectItem value="HOMEWORK">📚 Homework / Assignment</SelectItem>
                          <SelectItem value="FEE_CIRCULAR">💳 Fee Circular</SelectItem>
                          <SelectItem value="TEACHER_DIRECT">👤 Teacher Direct / Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Target Audience</Label>
                      <Select value={targetAudience} onValueChange={(v: any) => setTargetAudience(v)}>
                        <SelectTrigger className="rounded-2xl h-12 border-slate-200 dark:border-slate-700 font-bold">
                          <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="ALL_PARENTS">🌐 All Parents & Guardians</SelectItem>
                          <SelectItem value="SPECIFIC_GRADE">🏫 Specific Grade / Class</SelectItem>
                          <SelectItem value="STAFF">👥 School Staff Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Sender Signature</Label>
                      <Input
                        value={sender}
                        onChange={(e) => setSender(e.target.value)}
                        placeholder="e.g. Principal's Office or Tr. Joseph"
                        required
                        className="rounded-2xl h-12 border-slate-200 dark:border-slate-700 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Priority Level</Label>
                      <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                        <SelectTrigger className="rounded-2xl h-12 border-slate-200 dark:border-slate-700 font-bold">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="NORMAL">🟢 Normal Priority</SelectItem>
                          <SelectItem value="URGENT">🔴 Urgent Alert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Announcement Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Term 1 Sports Day and Parent Briefing"
                      required
                      className="rounded-2xl h-12 border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Detailed Content & Instructions</Label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write the full announcement or circular text here..."
                      required
                      className="rounded-2xl border-slate-200 dark:border-slate-700 min-h-[160px] p-4 text-sm font-medium"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      type="submit"
                      size="lg"
                      className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-600/25 gap-2"
                    >
                      <Send size={18} /> Broadcast to School Inbox
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">Broadcasts History & Active Items</h3>
                  <p className="text-xs text-slate-500">All announcements stored under munyaka_school_communications.</p>
                </div>
                <Badge className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-3 py-1">
                  {communications.length} Total Records
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-max">
                  <thead>
                    <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4 text-left">Type</th>
                      <th className="px-6 py-4 text-left">Title & Summary</th>
                      <th className="px-6 py-4 text-left">Sender</th>
                      <th className="px-6 py-4 text-center">Audience</th>
                      <th className="px-6 py-4 text-center">Priority</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {communications.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <td className="px-6 py-5">
                          <Badge variant="outline" className="font-bold text-xs">
                            {item.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-bold text-slate-900 dark:text-white max-w-xs truncate">{item.title}</div>
                          <div className="text-xs text-slate-500 max-w-sm truncate mt-0.5">{item.content}</div>
                        </td>
                        <td className="px-6 py-5 font-semibold text-slate-700 dark:text-slate-300">{item.sender}</td>
                        <td className="px-6 py-5 text-center">
                          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-0 font-bold text-[10px]">
                            {item.targetAudience}
                          </Badge>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <Badge className={item.priority === 'URGENT' ? 'bg-rose-100 text-rose-700 font-bold' : 'bg-emerald-100 text-emerald-700 font-bold'}>
                            {item.priority}
                          </Badge>
                        </td>
                        <td className="px-6 py-5 text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl font-bold"
                            onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}
                          >
                            View
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-xl font-bold bg-rose-100 text-rose-700 hover:bg-rose-200 border-0"
                            onClick={() => handleDelete(item.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {communications.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-16 text-slate-400 font-medium">
                          No communications broadcasted yet. Use the compose tab to create your first announcement.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Broadcast Details">
        {selectedItem && (
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Type</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{selectedItem.type}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Target Audience</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{selectedItem.targetAudience}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Sender</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{selectedItem.sender}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Priority</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{selectedItem.priority}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Title</p>
              <p className="font-bold text-base text-slate-900 dark:text-white mt-1">{selectedItem.title}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Full Content</p>
              <div className="mt-1 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {selectedItem.content}
              </div>
            </div>
            <div className="flex justify-between items-center pt-4">
              <Button
                variant="destructive"
                className="rounded-xl font-bold bg-rose-100 text-rose-700 hover:bg-rose-200 border-0"
                onClick={() => handleDelete(selectedItem.id)}
              >
                Delete Broadcast
              </Button>
              <Button onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold">Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TeacherCommunication;
