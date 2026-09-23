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
import { MessageSquare, Mail, Send, History, CheckCircle2 } from 'lucide-react';
import { CentralDataService } from '@/services/centralDataService';
import { showSuccess } from '@/utils/toast';
import { useNotifications } from '@/components/ui/notification-provider';

interface TeacherMessageRecord {
  id: string;
  recipient: string;
  subject: string;
  type: string;
  date: string;
  status: string;
}

const TEACHER_COMM_STORAGE_KEY = 'munyaka_teacher_communication_logs';

const loadTeacherMessages = (): TeacherMessageRecord[] => {
  try {
    const raw = CentralDataService.getData<TeacherMessageRecord[]>(TEACHER_COMM_STORAGE_KEY, []);
    if (raw && raw.length > 0) return raw;
    return [
      { id: 'tmsg-1', recipient: 'Grade Parents', subject: 'Class Assessment Updates', type: 'Announcement', date: 'Yesterday', status: 'Published' },
      { id: 'tmsg-2', recipient: 'Class Stream A', subject: 'Homework Reminders', type: 'SMS', date: '3 days ago', status: 'Delivered' }
    ];
  } catch {
    return [];
  }
};

const saveTeacherMessages = (messages: TeacherMessageRecord[]) => {
  try {
    CentralDataService.setData(TEACHER_COMM_STORAGE_KEY, messages);
  } catch {}
};

const TeacherCommunication = () => {
  const [activeTab, setActiveTab] = useState("outreach");
  const [messagesList, setMessagesList] = useState<TeacherMessageRecord[]>(loadTeacherMessages());
  const [isOpen, setIsOpen] = useState(false);
  const [msgType, setMsgType] = useState<'SMS' | 'Announcement'>('Announcement');
  const [recipient, setRecipient] = useState("My Class Parents");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const { addNotification } = useNotifications();

  const handleOpenCompose = (type: 'SMS' | 'Announcement') => {
    setMsgType(type);
    setSubject(type === 'Announcement' ? "Class Update & Homework Notice" : "Important Class Reminder");
    setIsOpen(true);
  };

  const handleSend = () => {
    if (!String(subject || '').trim() || !String(body || '').trim()) return;
    const newMsg = { 
      id: Date.now().toString(), 
      recipient, 
      subject, 
      type: msgType, 
      date: "Just now", 
      status: "Delivered" 
    };
    const updated = [newMsg, ...messagesList];
    setMessagesList(updated);
    saveTeacherMessages(updated);
    setIsOpen(false);
    setSubject(""); 
    setBody("");
    showSuccess(`Teacher ${msgType} sent successfully to ${recipient}!`);

    (addNotification as any)({
      title: `Teacher ${msgType} Sent`,
      message: `Sent to ${recipient}: ${subject}`,
    });
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-3 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Teacher Communication Portal</h1>
          <p className="text-muted-foreground">Communicate with students and parents in your assigned classes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl border-slate-200 gap-2" onClick={() => setActiveTab("logs")}><History size={18} /> Message Log</Button>
          <Button className="rounded-2xl shadow-lg bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => handleOpenCompose('Announcement')}><Send size={18} /> New Notice</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-12 mb-8">
          <TabsTrigger value="outreach" className="rounded-xl px-8 h-full font-bold text-xs">Outreach</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl px-8 h-full font-bold text-xs">Message Log</TabsTrigger>
        </TabsList>
        <TabsContent value="outreach" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-[2rem] bg-white p-10 text-center hover:shadow-md cursor-pointer group" onClick={() => handleOpenCompose('SMS')}>
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><MessageSquare size={36} /></div>
            <h3 className="text-xl font-bold text-slate-900">Send Parent SMS</h3>
            <p className="text-sm text-slate-500 mt-2">Send instant SMS alerts to parents of your class.</p>
          </Card>
          <Card className="rounded-[2rem] bg-white p-10 text-center hover:shadow-md cursor-pointer group" onClick={() => handleOpenCompose('Announcement')}>
            <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><Mail size={36} /></div>
            <h3 className="text-xl font-bold text-slate-900">Class Announcement</h3>
            <p className="text-sm text-slate-500 mt-2">Publish announcements for your students and parents.</p>
          </Card>
        </TabsContent>
        <TabsContent value="logs">
          <Card className="rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-max">
                  <thead>
                    <tr className="bg-slate-50/50 border-b">
                      <th className="px-8 py-5 text-left font-black text-slate-400 text-[10px]">Recipient</th>
                      <th className="px-8 py-5 text-left font-black text-slate-400 text-[10px]">Subject</th>
                      <th className="px-8 py-5 text-center font-black text-slate-400 text-[10px]">Type</th>
                      <th className="px-8 py-5 text-right font-black text-slate-400 text-[10px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {messagesList.map((msg) => (
                      <tr key={msg.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6 font-bold">{msg.recipient}</td>
                        <td className="px-8 py-6 font-medium">{msg.subject}</td>
                        <td className="px-8 py-6 text-center"><Badge variant="outline">{msg.type}</Badge></td>
                        <td className="px-8 py-6 text-right"><Badge className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 size={12} className="mr-1.5" /> {msg.status}</Badge></td>
                      </tr>
                    ))}
                    {messagesList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-slate-400 font-medium">No messages sent yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Compose ${msgType}`}>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Recipient Group</Label>
            <Select value={recipient} onValueChange={setRecipient}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select group" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="My Class Parents">My Class Parents</SelectItem>
                <SelectItem value="Grade Students">All Grade Students</SelectItem>
                <SelectItem value="Specific Stream">Specific Stream A/B</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subject / Title</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Message subject..." className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Message Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message here..." className="rounded-xl min-h-[120px]" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSend} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">Send {msgType}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherCommunication;
