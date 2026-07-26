"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Calendar, Pin, Plus } from 'lucide-react';
import { NOTICES } from '@/lib/mock-data';

const Notices = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notice Board</h1>
          <p className="text-muted-foreground">Stay updated with official school communications and events.</p>
        </div>
        <Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700">
          <Plus size={18} /> Post New Notice
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {NOTICES.map((notice) => (
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
    </div>
  );
};

export default Notices;