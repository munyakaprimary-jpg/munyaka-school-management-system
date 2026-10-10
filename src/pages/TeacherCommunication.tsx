"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { MessageSquare, Mail, Send, History, CheckCircle2, Users, Bell, Sparkles } from 'lucide-react';
import { CentralDataService } from '@/services/centralDataService';
import { showSuccess } from '@/utils/toast';
import { useNotifications } from '@/components/ui/notification-provider';

interface TeacherMessage {
  id: string;
  recipientGroup: string;
  subject: string;
  channel: 'SMS' | 'WhatsApp' | 'Portal Notice';
  date: string;
  status: string;
  content: string;
}

const STORAGE_KEY = 'munyaka_teacher_portal_messages_v1';

const getInitialMessages = (): TeacherMessage[] => {
  const saved = CentralDataService.getData(STORAGE_KEY, []);
  if (saved && saved.length > 0) return saved;
  return [
    {
      id: 'tm-1',
      recipientGroup: 'Grade 4 Parents (All Streams)',
      subject: 'Upcoming Mathematics Assessment Reminder',
      channel: 'SMS',
      date: 'Today, 08:30 AM',
      status: 'Delivered',
      content: 'Dear parents, please note that Grade 4 Mathematics assessment will take place this Thursday. Kindly ensure revision materials are reviewed.'
    },
    {
      id: 'tm-2',
      recipientGroup: 'Class 4A Students & Parents',
      subject: 'Science Practical Project Submission',
      channel: 'Portal Notice',
      date: 'Yesterday, 02:15 PM',
      status: 'Published',
      content: 'Reminder to all learners in Class 4A to bring recycled materials for the science practical activity.'
    }
  ];
};

const TeacherCommunication = () => {
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
  const [messages, setMessages] = useState<TeacherMessage[]>(getInitialMessages());
  const [channel, setChannel] = useState<'SMS' | 'WhatsApp' | 'Portal Notice'>('SMS');
  const [recipientGroup, setRecipientGroup] = useState('Grade 4 Parents (All Streams)');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<TeacherMessage | null>(null);
  const { addNotification } = useNotifications();

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) return;

    const newMessage: TeacherMessage = {
      id: 'tm-' + Date.now(),
      recipientGroup,
      subject: subject.trim(),
      channel,
      date: 'Just now',
      status: 'Delivered',
      content: content.trim()
    };

    const updated = [newMessage, ...messages];
    setMessages(updated);
    CentralDataService.setData(STORAGE_KEY, updated);

    showSuccess(`Successfully sent ${channel} to ${recipientGroup}!`);
    addNotification({
      title: `Teacher ${channel} Sent`,
      message: `Sent to ${recipientGroup}: ${subject}`,
      priority: 'medium',
    });

    setSubject('');
    setContent('');
    setActiveTab('history');
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 to-teal-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-900/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-emerald-500/30 text-white border-white/20 font-bold px-3 py-1">Teacher Portal</Badge>
            <Badge className="bg-white/20 text-white border-transparent font-bold">Direct Parent & Student Link</Badge>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Teacher Communication Center</h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-xl">
            Broadcast announcements, dispatch SMS notifications, and share updates directly with parents and learners in your assigned classes.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setActiveTab('compose')}
            className={`rounded-2xl font-bold gap-2 ${activeTab === 'compose' ? 'bg-white text-emerald-800 hover:bg-emerald-50' : 'bg-emerald-700/60 text-white hover:bg-emerald-700'}`}
          >
            <Send size={16} /> Compose Message
          </Button>
          <Button
            onClick={() => setActiveTab('history')}
            className={`rounded-2xl font-bold gap-2 ${activeTab === 'history' ? 'bg-white text-emerald-800 hover:bg-emerald-50' : 'bg-emerald-700/60 text-white hover:bg-emerald-700'}`}
          >
            <History size={16} /> History ({messages.length})
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full space-y-6">
        <TabsList className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-14 inline-flex gap-2">
          <TabsTrigger value="compose" className="rounded-xl px-6 h-full font-bold text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Send size={16} className="mr-2" /> Compose & Send
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl px-6 h-full font-bold text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <History size={16} className="mr-2" /> Message History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Quick Templates */}
            <div className="space-y-4">
              <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles size={18} className="text-emerald-500" /> Quick Templates
                </h3>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSubject('Homework & Assignment Reminder');
                      setContent('Dear parents, kindly ensure your child completes the assigned revision exercises before tomorrow morning.');
                    }}
                    className="w-full text-left p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-100 dark:border-slate-700 transition-all text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    📝 Homework Reminder
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubject('Upcoming Assessment Notice');
                      setContent('Please note that our class evaluation test is scheduled for this week. Regular attendance and punctuality are vital.');
                    }}
                    className="w-full text-left p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-100 dark:border-slate-700 transition-all text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    📊 Assessment Notice
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubject('Class Meeting Invitation');
                      setContent('We invite all parents for our end-of-month class progress review meeting this Friday at 2:00 PM.');
                    }}
                    className="w-full text-left p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-100 dark:border-slate-700 transition-all text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    🤝 Parent Meeting Invite
                  </button>
                </div>
              </Card>

              <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 bg-emerald-50/60 dark:bg-emerald-950/20 shadow-sm p-6">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm mb-1">Teacher Communication Guidelines</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  All messages sent here are logged securely in the school database and dispatched to verified parent contacts instantly.
                </p>
              </Card>
            </div>

            {/* Right: Compose Form */}
            <div className="lg:col-span-2">
              <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
                <form onSubmit={handleSendMessage} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Communication Channel</Label>
                      <Select value={channel} onValueChange={(v: any) => setChannel(v)}>
                        <SelectTrigger className="rounded-2xl h-12 border-slate-200 dark:border-slate-700 font-bold">
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="SMS">📱 SMS Notification</SelectItem>
                          <SelectItem value="WhatsApp">💬 WhatsApp Broadcast</SelectItem>
                          <SelectItem value="Portal Notice">📢 Portal Notice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Recipient Group</Label>
                      <Select value={recipientGroup} onValueChange={setRecipientGroup}>
                        <SelectTrigger className="rounded-2xl h-12 border-slate-200 dark:border-slate-700 font-bold">
                          <SelectValue placeholder="Select recipient" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="Grade 4 Parents (All Streams)">Grade 4 Parents (All Streams)</SelectItem>
                          <SelectItem value="Class 4A Students & Parents">Class 4A Students & Parents</SelectItem>
                          <SelectItem value="Class 4B Stream Parents">Class 4B Stream Parents</SelectItem>
                          <SelectItem value="Junior Secondary Parents">Junior Secondary Parents</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Subject / Headline</Label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Important update regarding class activities..."
                      required
                      className="rounded-2xl h-12 border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Message Content</Label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your message details here..."
                      required
                      className="rounded-2xl border-slate-200 dark:border-slate-700 min-h-[160px] p-4 text-sm font-medium"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      type="submit"
                      size="lg"
                      className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 shadow-lg shadow-emerald-600/25 gap-2"
                    >
                      <Send size={18} /> Dispatch Message
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
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">Dispatched Messages History</h3>
                  <p className="text-xs text-slate-500">Review all previously sent communications and announcements.</p>
                </div>
                <Badge className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-3 py-1">
                  {messages.length} Records
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-max">
                  <thead>
                    <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4 text-left">Recipient Group</th>
                      <th className="px-6 py-4 text-left">Subject</th>
                      <th className="px-6 py-4 text-center">Channel</th>
                      <th className="px-6 py-4 text-center">Date</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {messages.map((msg) => (
                      <tr
                        key={msg.id}
                        onClick={() => { setSelectedMessage(msg); setIsModalOpen(true); }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Users size={16} className="text-emerald-500" /> {msg.recipientGroup}
                        </td>
                        <td className="px-6 py-5 text-slate-700 dark:text-slate-300 font-semibold">{msg.subject}</td>
                        <td className="px-6 py-5 text-center">
                          <Badge variant="outline" className="font-bold text-xs">
                            {msg.channel}
                          </Badge>
                        </td>
                        <td className="px-6 py-5 text-center text-slate-500 text-xs">{msg.date}</td>
                        <td className="px-6 py-5 text-right">
                          <Badge className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 gap-1 font-bold">
                            <CheckCircle2 size={12} /> {msg.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {messages.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-16 text-slate-400 font-medium">
                          No messages sent yet. Use the compose tab to send your first notification.
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

      {/* Message Details Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Message Details">
        {selectedMessage && (
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Recipient Group</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{selectedMessage.recipientGroup}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Channel</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{selectedMessage.channel}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Subject</p>
              <p className="font-bold text-base text-slate-900 dark:text-white mt-1">{selectedMessage.subject}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Full Content</p>
              <div className="mt-1 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {selectedMessage.content}
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold">Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TeacherCommunication;
