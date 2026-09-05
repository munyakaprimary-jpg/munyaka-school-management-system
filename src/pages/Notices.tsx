"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { Megaphone, Calendar, Pin, Plus, Send } from 'lucide-react';
// Notices are managed through the app's notice board flow.
const initialNotices: unknown[] = [];
import { showSuccess } from '@/utils/toast';

const Notices = () => {
  const [noticesList, setNoticesList] = useState(initialNotices);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Notice");
  const [content, setContent] = useState("");

  const handlePostNotice = () => {
    if (!String(title || '').trim() || !String(content || '').trim()) return;
    const newNotice = { id: Date.now().toString(), title, content, date: "Just now", category, color: "bg-emerald-50 text-emerald-600" };
    setNoticesList([newNotice, ...noticesList]);
    setIsOpen(false);
    setTitle(""); setContent("");
    showSuccess("New notice published successfully!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div><h1 className="text-3xl font-bold text-slate-900">Notice Board</h1><p className="text-muted-foreground">Stay updated with official school communications.</p></div>
        <Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsOpen(true)}><Plus size={18} /> Post New Notice</Button>
      </div>

      <div className="grid grid-cols-1 gap-6">{noticesList.map((notice) => (
        <Card key={notice.id} className="rounded-[2rem] bg-white overflow-hidden group">
          <CardContent className="p-8 flex flex-col md:flex-row gap-6">
            <div className={`w-16 h-16 rounded-3xl ${notice.color} flex items-center justify-center shrink-0`}><Megaphone size={28} /></div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Badge>{notice.category}</Badge><span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Calendar size={14} /> {notice.date}</span></div><Button variant="ghost" size="icon" className="text-slate-300"><Pin size={18} /></Button></div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{notice.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{notice.content || notice.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}</div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Post New Notice" footer={<><Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button><Button onClick={handlePostNotice}><Send size={16} className="mr-2" /> Publish Notice</Button></>}>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Notice">Notice</SelectItem><SelectItem value="Urgent">Urgent</SelectItem><SelectItem value="Event">Event</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notice Title" /></div>
          <div className="space-y-2"><Label>Content</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Type notice description here..." className="min-h-[120px]" /></div>
        </div>
      </Modal>
    </div>
  );
};

export default Notices;