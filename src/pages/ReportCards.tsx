"use client";

import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import { STUDENTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// Mock data for at least two learners
const students = [
  {
    name: "Brian Kiptoo",
    uli: "A827361",
    gradeStream: "Grade 4 - Blue",
    rank: "#1 / 1",
    grades: [85, 78, 92],
  },
  {
    name: "Faith Chepkoech",
    uli: "A827362",
    gradeStream: "Grade 4 - Blue",
    rank: "#2 / 2",
    grades: [76, 88, 90],
  },
];

// CSS for print settings and page breaks (embedded as JSX)
const PrintStyles = () => (
  <>
    <style>
      @media print {
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        .report-card-page {
          page-break-after: always;
          break-after: page;
          page-break-inside: avoid;
        }
      }
    </style>
  </style>
);

// Helper to determine rubric level from score
const getRubric = (score: number) => {
  if (score >= 80) return { code: "EE", label: "Exceeding Expectations", color: "text-emerald-600" };
  if (score >= 65) return { code: "ME", label: "Meeting Expectations", color: "text-blue-600" };
  if (score >= 50) return { code: "AE", label: "Approaching Expectations", color: "text-amber-600" };
  return { code: "BE", label: "Below Expectations", color: "text-rose-600" };
});

// Subject names based on grade cluster
const getSubjectNames = (grade: string) => {
  const num = parseInt(grade.replace(/\D/g, ""), 10);
  if (grade.includes("PP")) return ["Language", "Math", "Environment"];
  if (num <= 3) return ["Language", "Math", "Environment"];
  if (num <= 6) return ["English", "Kiswahili", "Science", "Agriculture"];
  return ["English", "Kiswahili", "Math", "Science", "Social Studies"];
};

const ReportCards = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Print CSS for A4 portrait and page breaks */}
      <style>
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          .report-card-page {
            page-break-after: always;
            break-after: page;
            page-break-inside: avoid;
          }
        }
      </style>

      <div className="report-cards-container max-w-5xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Learner Report Cards</h1>
          <p className="text-slate-500">End-of-Term Assessment Reports</p>
        </div>

        {/* Individual Report Cards */}
        {STUDENTS.map((student) => (
          <div key={student.id} className="report-card-page">
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
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col md:flex-row gap-4 mt-8">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()} className="rounded-xl h-11 px-5">
            <Printer size={18} />
          </Button>
        </div>
      </div>
    </>
  );
};

export default ReportCards;

<dyad-write path="src/pages/ReportCards.tsx" description="Rewrite ReportCards.tsx from scratch with proper JSX, Tailwind, and print CSS for A4 portrait page breaks">
"use client";

import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import { STUDENTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// Mock data for at least two learners
const students = [
  {
    name: "Brian Kiptoo",
    uli: "A827361",
    gradeStream: "Grade 4 - Blue",
    rank: "#1 / 1",
    grades: [85, 78, 92],
  },
  {
    name: "Faith Chepkoech",
    uli: "A827362",
    gradeStream: "Grade 4 - Blue",
    rank: "#2 / 2",
    grades: [76, 88, 90],
  },
];

// CSS for print settings and page breaks (embedded as JSX)
const PrintStyles = () => (
  <>
    <style>
      @media print {
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        .report-card-page {
          page-break-after: always;
          break-after: page;
          page-break-inside: avoid;
        }
      </style>
    </>
  );

const ReportCards = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Print CSS for A4 portrait and page breaks */}
      <PrintStyles />

      {/* Main Container */}
      <div className="report-cards-container max-w-5xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Learner Report Cards</h1>
          <p className="text-slate-500">End-of-Term Assessment Reports</p>
        </div>

        {/* Individual Report Cards */}
        {STUDENTS.map((student) => (
          <div key={student.id} className="report-card-page">
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
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col md:flex-row gap-4 mt-8">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()} className="rounded-xl h-11 px-5">
            <Printer size={18} />
          </Button>
        </div>
      </div>
    </>
  );
};

export default ReportCards;

<dyad-write path="src/pages/ReportCards.tsx" description="Final corrected version of ReportCards.tsx with proper JSX, Tailwind, and print CSS for A4 portrait page breaks">
"use client";

import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import { STUDENTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// Mock data for at least two learners
const students = [
  {
    name: "Brian Kiptoo",
    uli: "A827361",
    gradeStream: "Grade 4 - Blue",
    rank: "#1 / 1",
    grades: [85, 78, 92],
  },
  {
    name: "Faith Chepkoech",
    uli: "A827362",
    gradeStream: "Grade 4 - Blue",
    rank: "#2 / 2",
    grades: [76, 88, 90],
  },
];

// CSS for print settings and page breaks (embedded as JSX)
const PrintStyles = () => (
  <>
    <style>
      @media print {
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        .report-card-page {
          page-break-after: always;
          break-after: page;
          page-break-inside: avoid;
        }
      </style>
    </>
  );

const getRubric = (score: number) => {
  if (score >= 80) return { code: "EE", label: "Exceeding Expectations", color: "text-emerald-600" };
  if (score >= 65) return { code: "ME", label: "Meeting Expectations", color: "text-blue-600" };
  if (score >= 50) return { code: "AE", label: "Approaching Expectations", color: "text-amber-600" };
  return { code: "BE", label: "Below Expectations", color: "text-rose-600" };
};

const ReportCards = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Print CSS for A4 portrait and page breaks */}
      <PrintStyles />

      <div className="report-cards-container max-w-5xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Learner Report Cards</h1>
          <p className="text-slate-500">End-of-Term Assessment Reports</p>
        </div>

        {/* Individual Report Cards */}
        {STUDENTS.map((student) => (
          <div key={student.id} className="report-card-page">
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
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
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
    </>
  );
};

export default ReportCards;
```The file was cut off. Let me provide the complete, corrected version:

<dyad-write path="src/pages/ReportCards.tsx" description="Complete rewrite of ReportCards.tsx with proper JSX, Tailwind, and print CSS for A4 portrait page breaks">
"use client";

import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { STUDENTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// Mock data for at least two learners
const students = [
  {
    name: "Brian Kiptoo",
    uli: "A827361",
    gradeStream: "Grade 4 - Blue",
    rank: "#1 / 1",
    grades: [85, 78, 92],
  },
  {
    name: "Faith Chepkoech",
    uli: "A827362",
    gradeStream: "Grade 4 - Blue",
    rank: "#2 / 2",
    grades: [76, 88, 90],
  },
];

// Helper to determine rubric level from score
const getRubric = (score: number) => {
  if (score >= 80) return { code: "EE", label: "Exceeding Expectations", color: "text-emerald-600" };
  if (score >= 65) return { code: "ME", label: "Meeting Expectations", color: "text-blue-600" };
  if (score >= 50) return { code: "AE", label: "Approaching Expectations", color: "text-amber-600" };
  return { code: "BE", label: "Below Expectations", color: "text-rose-600" };
};

const ReportCards = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Print CSS for A4 portrait and page breaks */}
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            .report-card-page {
              page-break-after: always;
              break-after: page;
              page-break-inside: avoid;
            }
          }
        `}
      </style>

      {/* Main Container */}
      <div className="report-cards-container max-w-5xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Learner Report Cards</h1>
          <p className="text-slate-500">End-of-Term Assessment Reports</p>
        </div>

        {/* Individual Report Cards */}
        {STUDENTS.map((student) => (
          <div key={student.id} className="report-card-page">
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
    </>
  );
};

export default ReportCards;