"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Megaphone, Calendar, Pin, Plus, Send, X } from 'lucide-react';
import { NOTICES as initialNotices } from '@/lib/mock-data';
import { showSuccess } from '@/utils/toast';

const Notices = () => {
  const [noticesList, setNoticesList] = useState(initialNotices);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Notice");
  const [content, setContent] = useState("");

  const handlePostNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const categoryColors: Record<string, string> = {
      Urgent: "bg-red-50 text-red-600",
      Event: "bg-blue-50 text-blue-600",
      Notice: "bg-emerald-50 text-emerald-600",
      General: "bg-purple-50 text-purple-600"
    };

    const newNotice = {
      id: Date.now().toString(),
      title,
      content,
      description: content,
      date: "Just now",
      category,
      color: categoryColors[category] || "bg-indigo-50 text-indigo-600"
    };

    setNoticesList([newNotice, ...noticesList]);
    setIsOpen(false);
    setTitle("");
    setContent("");
    setCategory("Notice");
    showSuccess("New notice published successfully!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notice Board</h1>
          <p className="text-muted-foreground">Stay updated with official school communications and events.</p>
        </div>
        <Button 
          className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700"
          onClick={() => setIsOpen(true)}
        >
          <Plus size={18} /> Post New Notice
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {noticesList.map((notice) => (
          <Card key={notice.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white overflow-hidden group">
            <CardContent className="p-8 flex flex-col md:flex-row gap-6">
              <div className={`w-16 h-16 rounded-3xl ${notice.color} flex items-center justify-center shrink-0`}>
                <Megaphone size={28} />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`rounded-lg font-bold border-none ${notice.color}`}>
                      {notice.category}
                    </Badge>
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <Calendar size={14} /> {notice.date}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-300 hover:text-indigo-600">
                    <Pin size={18} />
                  </Button>
                </div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                  {notice.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
                  {notice.content || notice.description}
                </p>
                <div className="pt-4 flex items-center gap-4">
                  <Button variant="ghost" className="text-xs font-bold text-indigo-600 p-0 hover:bg-transparent">
                    Read Full Details →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Post New Notice Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-8 relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-full h-8 w-8 text-slate-400 hover:text-slate-600"
            onClick={() => setIsOpen(false)}
          >
            <X size={16} />
          </Button>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Post New Notice</DialogTitle>
            <DialogDescription>
              Create an official announcement for students, parents, and staff.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePostNotice} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Notice Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Notice">General Notice</SelectItem>
                  <SelectItem value="Urgent">Urgent / Alert</SelectItem>
                  <SelectItem value="Event">School Event</SelectItem>
                  <SelectItem value="General">Academic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notice Title</Label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. End of Term Examination Schedule"
                required
                className="rounded-xl h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Notice Details / Description</Label>
              <Textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write the notice description and instructions here..."
                required
                className="rounded-xl min-h-[120px]"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                className="rounded-xl font-bold"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8"
              >
                <Send size={16} className="mr-2" /> Publish Notice
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notices;