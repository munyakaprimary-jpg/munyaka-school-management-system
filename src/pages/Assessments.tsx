"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Plus, Download, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';
import { showSuccess } from "@/utils/toast";

const Assessments = () => {
  const [selectedClass, setSelectedClass] = useState("4-Blue");

  const assessments = [
    { id: "1", student: "Brian Kiptoo", subject: "Mathematics", score: 85, max: 100, grade: "A", status: "Graded" },
    { id: "2", student: "Mary Atieno", subject: "Mathematics", score: 92, max: 100, grade: "A+", status: "Graded" },
    { id: "3", student: "Emmanuel Maina", subject: "Mathematics", score: 78, max: 100, grade: "B+", status: "Graded" },
    { id: "4", student: "Sheila Chepkoech", subject: "Mathematics", score: 0, max: 100, grade: "-", status: "Pending" },
    { id: "5", student: "David Mutua", subject: "Mathematics", score: 65, max: 100, grade: "C+", status: "Graded" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Assessments</h1>
          <p className="text-muted-foreground">Manage student assessments, marks, and grades.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-2xl border-slate-200 gap-2" onClick={() => showSuccess('Assessments exported!')}>
            <Download size={18} />
            Export
          </Button>
          <Button className="rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={() => showSuccess('New assessment created!')}>
            <Plus size={18} />
            New Assessment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Graded</p>
              <h3 className="text-2xl font-bold text-slate-900">4</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <h3 className="text-2xl font-bold text-slate-900">1</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Upload size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
              <h3 className="text-2xl font-bold text-slate-900">84%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Assessment Results</CardTitle>
          <CardDescription>Class: {selectedClass} - Mathematics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input placeholder="Search students..." className="rounded-xl h-12 pl-10" />
              </div>
              <Select>
                <SelectTrigger className="rounded-xl h-12 w-[180px]">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="math">Mathematics</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="kiswahili">Kiswahili</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-slate-500">
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Student</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Subject</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Score</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Grade</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((assessment) => (
                    <TableRow key={assessment.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-900">{assessment.student}</TableCell>
                      <TableCell className="text-slate-600">{assessment.subject}</TableCell>
                      <TableCell className="font-bold text-slate-900">{assessment.score}/{assessment.max}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700">
                          {assessment.grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={assessment.status === 'Graded' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                          {assessment.status === 'Graded' ? 'Graded' : 'Pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Assessments;