import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download, School } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import BackButton from '@/components/ui/BackButton';

const ReportCards = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Report Cards</h1>
            <p className="text-muted-foreground">Preview and print summative assessment reports.</p>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" className="rounded-xl">
            <Download size={18} className="mr-2" /> Export PDF
          </Button>
          <Button onClick={() => window.print()} className="rounded-xl shadow-lg shadow-primary/20">
            <Printer size={18} className="mr-2" /> Print Reports
          </Button>
        </div>
      </div>

      {/* Report Card Preview */}
      <Card className="max-w-4xl mx-auto border-none shadow-xl rounded-none bg-white p-8 md:p-12 print:shadow-none print:p-0">
        <CardContent className="space-y-10 p-0">
          {/* Official Header */}
          <div className="text-center space-y-2 border-b-2 border-primary pb-6 relative">
            <div className="absolute left-0 top-0 hidden md:block">
              <School size={60} className="text-primary opacity-20" />
            </div>
            <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">Munyaka Primary and Junior School</h2>
            <p className="text-sm font-bold">P.O. Box 5239-30100 Eldoret</p>
            <p className="text-sm font-medium uppercase text-slate-500">Academic Progress Report</p>
            <div className="flex justify-center gap-8 mt-4">
              <div className="text-left text-xs">
                <p><span className="text-muted-foreground">Year:</span> 2024</p>
                <p><span className="text-muted-foreground">Term:</span> One</p>
              </div>
              <div className="text-left text-xs">
                <p><span className="text-muted-foreground">Grade:</span> 4 Blue</p>
                <p><span className="text-muted-foreground">Category:</span> Primary</p>
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-widest">Student Name</p>
              <p className="font-bold text-lg">Brian Kiptoo</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-widest">Assessment Number</p>
              <p className="font-bold text-lg">KNEC/CBC/2024/481</p>
            </div>
          </div>

          {/* Performance Table */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg border-l-4 border-primary pl-3 uppercase">Performance Summary</h3>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="px-4 py-2 text-left">Learning Area</th>
                  <th className="px-4 py-2 text-center">Formative</th>
                  <th className="px-4 py-2 text-center">Summative</th>
                  <th className="px-4 py-2 text-center">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { subject: "Mathematics", form: "85%", sum: "88%", lvl: "EE" },
                  { subject: "English Language", form: "72%", sum: "75%", lvl: "ME" },
                  { subject: "Kiswahili", form: "68%", sum: "70%", lvl: "ME" },
                  { subject: "Science & Technology", form: "90%", sum: "92%", lvl: "EE" },
                  { subject: "CRE", form: "80%", sum: "82%", lvl: "EE" },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-medium">{row.subject}</td>
                    <td className="px-4 py-3 text-center">{row.form}</td>
                    <td className="px-4 py-3 text-center">{row.sum}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={row.lvl === 'EE' ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700"}>
                        {row.lvl}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Comments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase">Class Teacher's Remarks</p>
              <p className="text-sm italic border-b border-dotted pb-2">A very hardworking and disciplined student. Keep it up!</p>
              <p className="text-xs font-bold pt-4">Sign: ...........................................</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase">Headteacher's Message</p>
              <p className="text-sm italic border-b border-dotted pb-2">Outstanding performance across all learning areas.</p>
              <p className="text-xs font-bold pt-4">Sign: ...........................................</p>
            </div>
          </div>

          <div className="text-center pt-8 text-[10px] text-slate-400">
            This is an official computer-generated report card for Munyaka Primary School.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportCards;