"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Printer, Download, Clock } from 'lucide-react';
import { TIMETABLE } from '@/lib/mock-data';

const Timetable = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">School Timetable</h1>
          <p className="text-muted-foreground">Manage and view weekly schedules for different grades.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl"><Printer size={18} className="mr-2" /> Print</Button>
          <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"><Calendar size={18} className="mr-2" /> Current Week</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Select defaultValue="grade4">
          <SelectTrigger className="rounded-2xl h-10 bg-white border-none shadow-sm">
            <SelectValue placeholder="Select Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grade4">Grade 4 - Blue</SelectItem>
            <SelectItem value="grade5">Grade 5 - Green</SelectItem>
            <SelectItem value="grade6">Grade 6 - Alpha</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b">
                  <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[8px] w-32">Time</th>
                  <th className="px-4 py-3 font-black text-slate-900 uppercase tracking-widest text-[8px]">Monday</th>
                  <th className="px-4 py-3 font-black text-slate-900 uppercase tracking-widest text-[8px]">Tuesday</th>
                  <th className="px-4 py-3 font-black text-slate-900 uppercase tracking-widest text-[8px]">Wednesday</th>
                  <th className="px-4 py-3 font-black text-slate-900 uppercase tracking-widest text-[8px]">Thursday</th>
                  <th className="px-4 py-3 font-black text-slate-900 uppercase tracking-widest text-[8px]">Friday</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {TIMETABLE.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-500 bg-slate-50/30">
                      <div className="flex items-center justify-center gap-1">
                        <Clock size={10} /> {row.time}
                      </div>
                    </td>
                    {[row.mon, row.tue, row.wed, row.thu, row.fri].map((lesson, idx) => (
                      <td key={idx} className="px-4 py-3">
                        <div className={`p-2 rounded-2xl text-xs font-bold ${
                          lesson === 'BREAK' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          ['Assembly', 'Pastoral'].includes(lesson) ? 'bg-purple-50 text-purple-700' :
                          'bg-indigo-50 text-indigo-700'
                        }`}>
                          {lesson}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Timetable;