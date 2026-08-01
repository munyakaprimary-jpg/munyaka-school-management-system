"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { STUDENTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// Helper to determine rubric level from score
const getRubric = (score: number) => {
  if (score >= 80) return { code: "EE", label: "Exceeding Expectations", color: "text-emerald-600" };
  if (score >= 65) return { code: "ME", label: "Meeting Expectations", color: "text-blue-600" };
  if (score >= 50) return { code: "AE", label: "Approaching Expectations", color: "text-amber-600" };
  return { code: "BE", label: "Below Expectations", color: "text-rose-600" };
};

const ReportCards = () => {
  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-slate-900">Learner Report Cards</h1>
          <p className="text-slate-500">End-of-Term Assessment Reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="rounded-xl h-11 px-5">
            <Printer size={18} />
          </Button>
        </div>
      </div>

      {/* Report Cards - Each student gets their own page when printed */}
      <div className="space-y-6">
        {STUDENTS.map((student) => (
          <div key={student.id} className="print:break-after-page print:min-h-screen mb-8 print:mb-0">
            <Card className="border-none shadow-none rounded-lg bg-white overflow-hidden">
              {/* Header */}
              <CardHeader className="p-4 border-b bg-slate-50">
                <CardTitle className="text-lg font-bold text-slate-900">
                  {student.name}
                </CardTitle>
                <p className="text-sm text-slate-500">ID: {student.uli}</p>
              </CardHeader>

              {/* Grades Table */}
              <CardContent className="p-4">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b">
                    <tr className="text-slate-500">
                      <th className="px-4 py-2">Subject</th>
                      <th className="px-4 py-2 text-center">Score</th>
                      <th className="px-4 py-2 text-center">Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {student.grades.map((score, index) => {
                      const rubric = getRubric(score);
                      return (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-4 py-2">{["English", "Kiswahili", "Math"][index % 3]}</td>
                          <td className="px-4 py-2 text-center">{score}</td>
                          <td className="px-4 py-2">
                            <span className={cn("font-medium", rubric.color)}>
                              {rubric.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col md:flex-row gap-4 mt-8">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()} className="rounded-xl h-11 px-5">
            <Printer size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportCards;