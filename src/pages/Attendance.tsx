"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Check, X, Clock } from "lucide-react";

const Attendance = () => {
  const [markedStudents, setMarkedStudents] = useState<Record<number, { status: string, time: string }>>({});

  const students = [
    { id: 1, name: "Brian Kiptoo", assessment: "A827361" },
    { id: 2, name: "Mary Atieno", assessment: "A827362" },
    { id: 3, name: "Emmanuel Maina", assessment: "A827363" },
    { id: 4, name: "Sheila Chepkoech", assessment: "A827364" },
    { id: 5, name: "David Mutua", assessment: "A827365" },
  ];

  const toggleAttendance = (id: number, status: string) => {
    const timestamp = format(new Date(), "HH:mm:ss");
    setMarkedStudents(prev => ({
      ...prev,
      [id]: { status, time: timestamp }
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Class Attendance</h1>
          <p className="text-muted-foreground">Mark daily roll call with real-time timestamps.</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="grade4">
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grade4">Grade 4 - Blue</SelectItem>
              <SelectItem value="grade5">Grade 5 - Green</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-xl">
            {format(new Date(), "PP")}
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground border-b bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Student Details</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((student) => {
                  const marked = markedStudents[student.id];
                  return (
                    <tr key={student.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold">{student.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {student.assessment}</p>
                      </td>
                      <td className="px-6 py-4">
                        {marked ? (
                          <div className="flex items-center gap-2">
                            <Badge className={marked.status === 'P' ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                              {marked.status === 'P' ? 'Present' : 'Absent'}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock size={10} /> {marked.time}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not marked</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => toggleAttendance(student.id, 'P')}
                            className={marked?.status === 'P' ? "bg-green-600 text-white hover:bg-green-700" : "hover:bg-green-50 hover:text-green-600"}
                          >
                            <Check size={16} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => toggleAttendance(student.id, 'A')}
                            className={marked?.status === 'A' ? "bg-red-600 text-white hover:bg-red-700" : "hover:bg-red-50 hover:text-red-600"}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button size="lg" className="rounded-xl px-12 shadow-lg shadow-primary/20">
          Save Register
        </Button>
      </div>
    </div>
  );
};

export default Attendance;