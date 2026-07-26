"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Printer, RefreshCw, Download, Edit } from 'lucide-react';
import { showSuccess } from "@/utils/toast";
import { TIMETABLE } from "@/lib/mock-data";

const Timetable = () => {
  const [selectedGrade, setSelectedGrade] = useState('4');
  const [selectedStream, setSelectedStream] = useState('Blue');

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Timetable</h1>
          <p className="text-muted-foreground">View class schedules and lesson plans.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-2xl border-slate-200 gap-2" onClick={() => showSuccess('Schedule printed!')}>
            <Printer size={18} />
            Print
          </Button>
          <Button className="rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={() => showSuccess('Week updated!')}>
            <Calendar size={18} />
            Current Week
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Filter Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Grade</label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Grade 1</SelectItem>
                  <SelectItem value="2">Grade 2</SelectItem>
                  <SelectItem value="3">Grade 3</SelectItem>
                  <SelectItem value="4">Grade 4</SelectItem>
                  <SelectItem value="5">Grade 5</SelectItem>
                  <SelectItem value="6">Grade 6</SelectItem>
                  <SelectItem value="7">Grade 7</SelectItem>
                  <SelectItem value="8">Grade 8</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Stream</label>
              <Select value={selectedStream} onValueChange={setSelectedStream}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select stream" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="alpha">Alpha</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Week Overview</CardTitle>
            <CardDescription>Grade {selectedGrade} - {selectedStream} Stream</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-500 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold uppercase text-[10px] tracking-wider">Time</th>
                    <th className="px-4 py-3 text-left font-bold uppercase text-[10px] tracking-wider">Mon</th>
                    <th className="px-4 py-3 text-left font-bold uppercase text-[10px] tracking-wider">Tue</th>
                    <th className="px-4 py-3 text-left font-bold uppercase text-[10px] tracking-wider">Wed</th>
                    <th className="px-4 py-3 text-left font-bold uppercase text-[10px] tracking-wider">Thu</th>
                    <th className="px-4 py-3 text-left font-bold uppercase text-[10px] tracking-wider">Fri</th>
                  </tr>
                </thead>
                <tbody>
                  {TIMETABLE.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-600">{row.time}</td>
                      <td className="px-4 py-3">{row.mon}</td>
                      <td className="px-4 py-3">{row.tue}</td>
                      <td className="px-4 py-3">{row.wed}</td>
                      <td className="px-4 py-3">{row.thu}</td>
                      <td className="px-4 py-3">{row.fri}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Timetable;