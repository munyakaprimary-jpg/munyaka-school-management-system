"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Filter, Megaphone, Calendar as CalendarIcon, AlertCircle, FileText } from 'lucide-react';
import { showSuccess } from "@/utils/toast";
import { NOTICES } from "@/lib/mock-data";

const Notices = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotices = NOTICES.filter(notice => 
    notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notice.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notice Board</h1>
          <p className="text-muted-foreground">Post announcements and important updates for the school community.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-2xl border-slate-200 gap-2" onClick={() => showSuccess('Notices exported!')}>
            <FileText size={18} />
            Export PDF
          </Button>
          <Button className="rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={() => showSuccess('Notice posted!')}>
            <Plus size={18} />
            Post New Notice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Recent Notices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    placeholder="Search notices..." 
                    className="rounded-xl h-12 pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="rounded-xl border-slate-200 gap-2">
                  <Filter size={18} />
                  Filter
                </Button>
              </div>

              <div className="space-y-3">
                {filteredNotices.map((notice) => (
                  <div key={notice.id} className="p-5 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-2xl" style={{ backgroundColor: `${notice.color}20` }}>
                          <Megaphone className={notice.color.replace('bg-', 'text-')} size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-slate-900">{notice.title}</h3>
                            <Badge className={notice.color}>
                              {notice.category}
                            </Badge>
                          </div>
                          <p className="text-slate-600 mb-3">{notice.content}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <CalendarIcon size={14} />
                              {notice.date}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Notice Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { category: 'Urgent', count: 1, color: 'bg-red-50 text-red-600' },
                  { category: 'Event', count: 1, color: 'bg-blue-50 text-blue-600' },
                  { category: 'Notice', count: 1, color: 'bg-emerald-50 text-emerald-600' },
                ].map((cat, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${cat.color.split(' ')[0]}20` }}>
                        <AlertCircle className={cat.color.split(' ')[2]} size={16} />
                      </div>
                      <span className="font-medium text-slate-700">{cat.category}</span>
                    </div>
                    <Badge className={cat.color}>{cat.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <CalendarIcon size={24} />
                </div>
                <div>
                  <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Current Date</p>
                  <p className="text-lg font-black">Oct 24, 2024</p>
                </div>
              </div>
              <p className="text-indigo-100 text-sm">
                All notices are automatically published and visible to parents, staff, and students.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Notices;