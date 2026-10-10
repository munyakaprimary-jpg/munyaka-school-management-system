"use client";

import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { MessageSquare, Mail, Send, History, UserCheck } from 'lucide-react';
import { CentralDataService } from '@/services/centralDataService';
interface MessageRecord {
  id: string;
  recipient: string;
  subject: string;
  type: string;
  date: string;
  status: string;
}
const COMMUNICATION_STORAGE_KEY = 'munyaka_communication_logs';
const loadLocalMessages = (): MessageRecord[] => {
  try {
      const raw = CentralDataService.getData(COMMUNICATION_STORAGE_KEY, []);
      if (raw && raw.length > 0) return raw;
    return [
      { id: 'msg-1', recipient: 'All Parents', subject: 'Welcome to Term 1 Academic Year', type: 'Email', date: 'Yesterday', status: 'Opened' },
      { id: 'msg-2', recipient: 'Grade 8 Parents', subject: 'KCPE / Junior Secondary Assessment Prep', type: 'SMS', date: '3 days ago', status: 'Delivered' }
    ];
  } catch {
    return [];
  }
};
const saveLocalMessages = (messages: MessageRecord[]) => {
  try {
    CentralDataService.setData(COMMUNICATION_STORAGE_KEY, messages);
  } catch {}
};
import { showSuccess } from '@/utils/toast';
import { useNotifications } from '@/components/ui/notification-provider'; // Import the notification hook

const Communication = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("outreach");
  const [messagesList, setMessagesList] = useState<MessageRecord[]>(loadLocalMessages());
  const [isOpen, setIsOpen] = useState(false);
  const [msgType, setMsgType] = useState<'SMS' | 'Email'>('Email');
  const [recipient, setRecipient] = useState("All Parents");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const { addNotification } = useNotifications(); // Get the addNotification function

  const handleOpenCompose = (type: 'SMS' | 'Email') => {
    setMsgType(type);
    setSubject(type === 'Email' ? "Term 1 Academic Newsletter" : "Notice from School");
    setIsOpen(true);
  };

  const handleSend = () => {
    if (!String(subject || '').trim() || !String(body || '').trim()) return;
    const newMsg = { id: Date.now().toString(), recipient, subject, type: msgType, date: "Just now", status: msgType === 'SMS' ? "Delivered" : "Opened" };
    const updated = [newMsg, ...messagesList];
    setMessagesList(updated);
    saveLocalMessages(updated);
    setIsOpen(false);
    setSubject(""); setBody("");
    showSuccess(`${msgType} message broadcasted successfully!`);

    // Add a notification for the sent message
    (addNotification as any)({
      title: `New ${msgType} Message Sent`,
      message: `Sent to ${recipient}: ${subject}`,
    });
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-3 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Communication Center</h1>
          <p className="text-muted-foreground">Broadcast messages and track parent outreach.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl border-slate-200 gap-2" onClick={() => setActiveTab("logs")}><History size={18} /> Logs</Button>
          <Button className="rounded-2xl shadow-lg bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={() => handleOpenCompose('Email')}><Send size={18} /> Compose</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-12 mb-8">
          <TabsTrigger value="outreach" className="rounded-xl px-8 h-full font-bold text-xs">Outreach</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl px-8 h-full font-bold text-xs">Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="outreach" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-[2rem] bg-white p-10 text-center hover:shadow-md cursor-pointer group" onClick={() => handleOpenCompose('SMS')}>
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><MessageSquare size={36} /></div>
            <h3 className="text-xl font-bold text-slate-900">Send SMS Alert</h3>
          </Card>
          <Card className="rounded-[2rem] bg-white p-10 text-center hover:shadow-md cursor-pointer group" onClick={() => handleOpenCompose('Email')}>
            <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><Mail size={36} /></div>
            <h3 className="text-xl font-bold text-slate-900">Email Newsletter</h3>
          </Card>
        </TabsContent>
        <TabsContent value="logs">
                  <Card className="rounded-3xl bg-white overflow-hidden">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-max">
                <thead><tr className="bg-slate-50/50 border-b"><th className="px-8 py-5 text-left font-black text-slate-400 text-[10px]">Recipient</th><th className="px-8 py-5 text-left font-black text-slate-400 text-[10px]">Subject</th><th className="px-8 py-5 text-center font-black text-slate-400 text-[10px]">Type</th><th className="px-8 py-5 text-right font-black text-slate-400 text-[10px]">Status</th></tr></thead>
                <tbody className="divide-y">{messagesList.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50 transition-colors"><td className="px-8 py-6 font-bold">{msg.recipient}</td><td className="px-8 py-6 font-medium">{msg.subject}</td><td className="px-8 py-6 text-center"><Badge variant="outline">{msg.type}</Badge></td><td className="px-8 py-6 text-right"><Badge><UserCheck size={12} className="mr-1.5" /> {msg.status}</Badge></td></tr>
                ))}</tbody>
              </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Compose ${msgType === 'Email' ? 'Email' : 'SMS'}`}
        description="Send an official communication."
        footer={
          <>
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8" onClick={handleSend}><Send size={16} className="mr-2" /> Dispatch Message</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Communication Mode</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={msgType === 'Email' ? 'default' : 'outline'} className="rounded-xl h-11 font-bold" onClick={() => setMsgType('Email')}><Mail size={16} className="mr-2" /> Email</Button>
              <Button type="button" variant={msgType === 'SMS' ? 'default' : 'outline'} className="rounded-xl h-11 font-bold" onClick={() => setMsgType('SMS')}><MessageSquare size={16} className="mr-2" /> SMS</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{msgType === 'Email' ? 'Email Subject' : 'Alert Header'}</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. End of Term Notice" className="rounded-xl h-12" />
          </div>
          <div className="space-y-2">
            <Label>Message Content</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type content here..." className="rounded-xl min-h-[120px]" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Communication;