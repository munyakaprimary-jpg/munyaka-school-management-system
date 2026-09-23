import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Search, Phone, Mail, User, CheckCircle2, AlertCircle, Plus, Users, Filter, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { CentralDataService } from '@/services/centralDataService';
import { toast } from '@/utils/toast';

interface Message {
  id: string;
  recipientName: string;
  recipientRole: 'parent' | 'student' | 'colleague' | 'admin';
  recipientPhone?: string;
  subject: string;
  content: string;
  category: 'academic' | 'attendance' | 'discipline' | 'fee' | 'general';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  senderName: string;
}

const TEACHER_COMM_KEY = 'munyaka_teacher_communication_logs';

export default function TeacherCommunication() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // New message form state
  const [recipientName, setRecipientName] = useState('');
  const [recipientRole, setRecipientRole] = useState<'parent' | 'student' | 'colleague' | 'admin'>('parent');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'academic' | 'attendance' | 'discipline' | 'fee' | 'general'>('academic');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    try {
      const stored = CentralDataService.getData<Message[]>(TEACHER_COMM_KEY, [
        {
          id: 'msg-1',
          recipientName: 'Mr. & Mrs. Kiprop (Parent of Brian Kiptoo)',
          recipientRole: 'parent',
          recipientPhone: '+254712345678',
          subject: 'Academic Progress Update',
          content: 'Dear Parent, Brian has shown wonderful improvement in Mathematics this term. Keep up the great support at home.',
          category: 'academic',
          timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
          status: 'read',
          senderName: user?.name || 'Teacher'
        },
        {
          id: 'msg-2',
          recipientName: 'Grade 4 Blue Class Stream',
          recipientRole: 'parent',
          recipientPhone: 'Broadcast',
          subject: 'Mid-term Assessment Schedule Notice',
          content: 'Please be reminded that mid-term CBC assessments begin next Monday. Kindly ensure learners arrive on time.',
          category: 'general',
          timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
          status: 'delivered',
          senderName: user?.name || 'Teacher'
        }
      ]);
      setMessages(stored);
    } catch (err) {
      console.error('Failed to load teacher communication logs:', err);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !subject.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      recipientName: recipientName.trim(),
      recipientRole,
      recipientPhone: recipientPhone.trim() || undefined,
      subject: subject.trim(),
      content: content.trim(),
      category,
      timestamp: new Date().toISOString(),
      status: 'sent',
      senderName: user?.name || 'Teacher'
    };

    const updated = [newMessage, ...messages];
    setMessages(updated);
    CentralDataService.setData(TEACHER_COMM_KEY, updated);

    toast.success('Message sent successfully!');
    setIsComposeOpen(false);

    // Reset form
    setRecipientName('');
    setRecipientPhone('');
    setSubject('');
    setContent('');
    setCategory('academic');
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = msg.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          msg.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || msg.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <MessageSquare size={14} /> Teacher Portal Communication
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Parent & Student Messaging</h1>
          <p className="text-slate-300 text-sm max-w-xl">
            Directly communicate academic updates, attendance alerts, and announcements with parents and learners securely.
          </p>
        </div>

        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center gap-2 shrink-0">
              <Plus size={18} /> New Message / Broadcast
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="text-blue-400" size={22} /> Send Official Communication
              </DialogTitle>
              <CardDescription className="text-slate-400">
                Dispatch SMS or in-app message to a parent, student, or class stream.
              </CardDescription>
            </DialogHeader>

            <form onSubmit={handleSendMessage} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-bold uppercase">Recipient Type</Label>
                  <Select value={recipientRole} onValueChange={(v: any) => setRecipientRole(v)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="parent">Parent / Guardian</SelectItem>
                      <SelectItem value="student">Student / Learner</SelectItem>
                      <SelectItem value="colleague">Colleague Teacher</SelectItem>
                      <SelectItem value="admin">School Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-bold uppercase">Category</Label>
                  <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="academic">Academic Progress</SelectItem>
                      <SelectItem value="attendance">Attendance Alert</SelectItem>
                      <SelectItem value="discipline">Behavior / Discipline</SelectItem>
                      <SelectItem value="fee">Fee Reminder</SelectItem>
                      <SelectItem value="general">General Notice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 text-xs font-bold uppercase">Recipient Name / Stream</Label>
                <Input
                  placeholder="e.g. Mr. Kiprop or Grade 4 Blue"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 text-xs font-bold uppercase">Phone Number (Optional for SMS)</Label>
                <Input
                  placeholder="e.g. +254712345678"
                  value={recipientPhone}
                  onChange={e => setRecipientPhone(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 text-xs font-bold uppercase">Subject / Title</Label>
                <Input
                  placeholder="e.g. Term 2 Examination Performance"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 text-xs font-bold uppercase">Message Content</Label>
                <Textarea
                  rows={4}
                  placeholder="Type your official communication message here..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                />
              </div>

              <DialogFooter className="pt-4 border-t border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setIsComposeOpen(false)} className="text-slate-400 hover:text-white">
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
                  <Send size={16} className="mr-2" /> Dispatch Message
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Search messages by recipient or subject..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'academic', 'attendance', 'discipline', 'fee', 'general'].map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl capitalize text-xs font-bold ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Message List Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredMessages.length === 0 ? (
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-12 text-center rounded-2xl">
            <MessageSquare size={48} className="mx-auto text-slate-400 mb-3 opacity-50" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No communications found</h3>
            <p className="text-slate-500 text-sm mt-1">Get started by creating a new message or broadcast to parents and students.</p>
          </Card>
        ) : (
          filteredMessages.map(msg => (
            <Card key={msg.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base shrink-0 border border-blue-100 dark:border-blue-900">
                      {msg.recipientRole === 'parent' ? <Users size={22} /> : <User size={22} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{msg.recipientName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] uppercase font-mono">
                          {msg.recipientRole}
                        </Badge>
                        <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-[10px] uppercase font-mono">
                          {msg.category}
                        </Badge>
                        {msg.recipientPhone && (
                          <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                            <Phone size={12} /> {msg.recipientPhone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={12} /> {new Date(msg.timestamp).toLocaleDateString()} {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        <CheckCircle2 size={12} /> {msg.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{msg.subject}</h4>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
