"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, Filter, Printer, FileText, TrendingUp, Award } from 'lucide-react';
import { showSuccess } from "@/utils/toast";

const ReportCards = () => {
  const [selectedStudent, setSelectedStudent] = useState("");

  const reportData = [
    { subject: "Mathematics", score: 85, grade: "A", remarks: "Excellent performance" },
    { subject: "English", score: 78, grade: "B+", remarks: "Good effort" },
    { subject: "Kiswahili", score: 82, grade: "A-", remarks: "Very good" },
    { subject: "Science", score: 90, grade: "A", remarks: "Outstanding" },
    { subject: "Social Studies", score: 75, grade: "B", remarks: "Satisfactory" },
    { subject: "Creative Arts", score: 88, grade: "A", remarks: "Excellent" },
    { subject: "Physical Ed", score: 92, grade: "A+", remarks: "Excellent" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Report Cards</h1>
          <p className="text-muted-foreground">Generate and manage student report cards.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-2xl border-slate-200 gap-2" onClick={() => showSuccess('Report PDF generated!')}>
            <Download size={18} />
            Export PDF
          </Button>
          <Button className="rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={() => showSuccess('Report printed!')}>
            <Printer size={18} />
            Print
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-3xl bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Generate Report Card</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Student</label>
              <Select>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brian">Brian Kiptoo</SelectItem>
                  <SelectItem value="mary">Mary Atieno</SelectItem>
                  <SelectItem value="emmanuel">Emmanuel Maina</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Term</label>
              <Select>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="term1">Term 1</SelectItem>
                  <SelectItem value="term2">Term 2</SelectItem>
                  <SelectItem value="term3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Academic Year</label>
              <Select>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button className="rounded-xl px-8 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700" onClick={() => showSuccess('Report card generated!')}>
              <FileText size={18} className="mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Recent Report Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input placeholder="Search reports..." className="rounded-xl h-12 pl-10" />
              </div>
              <Button variant="outline" className="rounded-xl border-slate-200 gap-2">
                <Filter size={18} />
                Filter
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="text-slate-500">
                  <TableHead className="font-bold uppercase text-[10px] tracking-wider">Student</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-wider">Term</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-wider">Average</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-wider">Grade</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { student: "Brian Kiptoo", term: "Term 1", avg: "84%", grade: "A" },
                  { student: "Mary Atieno", term: "Term 1", avg: "91%", grade: "A+" },
                  { student: "Emmanuel Maina", term: "Term 1", avg: "78%", grade: "B+" },
                ].map((row, i) => (
                  <TableRow key={i} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-slate-900">{row.student}</TableCell>
                    <TableCell className="text-slate-600">{row.term}</TableCell>
                    <TableCell className="font-bold text-slate-900">{row.avg}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-slate-50 text-slate-700">{row.grade}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-indigo-600 font-bold" onClick={() => showSuccess('Report opened!')}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportCards;