"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Download, Filter, Calendar, UserCheck, Layers } from "lucide-react";
import { 
  LEARNING_AREAS, 
  INITIAL_STUDENTS, 
  INITIAL_MARKS, 
  DEFAULT_REMARKS,
  DEFAULT_TERM_DATES,
  StudentRemarks,
  resolveGradeBandId
} from '@/lib/report-card-store';
import { LowerPrimaryReportCard } from '@/components/report-cards/LowerPrimaryReportCard';
import { UpperPrimaryReportCard } from '@/components/report-cards/UpperPrimaryReportCard';
import { JuniorSchoolReportCard } from '@/components/report-cards/JuniorSchoolReportCard';
import { showSuccess } from '@/utils/toast';

const ReportCards = () => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("all");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("all");
  const [selectedStreamFilter, setSelectedStreamFilter] = useState<string>("all");
  
  // Date state
  const [closingDate, setClosingDate] = useState(DEFAULT_TERM_DATES.closing_date);
  const [nextOpeningDate, setNextOpeningDate] = useState(DEFAULT_TERM_DATES.next_term_opening);

  // Remarks state
  const [remarksState, setRemarksState] = useState<Record<string, StudentRemarks>>(DEFAULT_REMARKS);

  // Filter dataset
  const filteredStudents = INITIAL_STUDENTS.filter(student => {
    if (selectedStudentId !== "all" && student.id !== selectedStudentId) {
      return false;
    }
    if (selectedGradeFilter !== "all" && student.current_grade.toString() !== selectedGradeFilter) {
      return false;
    }
    if (selectedStreamFilter !== "all" && student.stream !== selectedStreamFilter) {
      return false;
    }
    return true;
  });

  const handleSaveTeacherRemark = (studentId: string, remarkText: string) => {
    setRemarksState(prev => ({
      ...prev,
      [studentId]: {
        teacher_remark: remarkText,
        hoi_remark: prev[studentId]?.hoi_remark || ""
      }
    }));
  };

  const handleSaveHOIRemark = (studentId: string, remarkText: string) => {
    setRemarksState(prev => ({
      ...prev,
      [studentId]: {
        teacher_remark: prev[studentId]?.teacher_remark || "",
        hoi_remark: remarkText
      }
    }));
  };

  const handleTriggerPrint = () => {
    showSuccess(`Preparing ${filteredStudents.length} report card(s) for print / PDF export...`);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Top Header Bar - Hidden in Print */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Report Card Generator</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Auto-calculates Mid & End Term averages, performance levels, and tier layouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            onClick={handleTriggerPrint}
            className="rounded-xl h-10 px-5 text-xs font-bold shadow-md bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            <Printer size={16} /> Print / Save as PDF ({filteredStudents.length})
          </Button>
        </div>
      </div>

      {/* Manual Input Controls & Filters Bar - Hidden in Print */}
      <Card className="border-none shadow-sm bg-white p-4 rounded-2xl space-y-4 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Student Selector Focus */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <UserCheck size={12} className="text-indigo-600" /> Focus Student
            </Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="All Students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Registered Students</SelectItem>
                {INITIAL_STUDENTS.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} (Grade {s.current_grade} {s.stream})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grade Filter */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <Layers size={12} className="text-indigo-600" /> Grade Level
            </Label>
            <Select value={selectedGradeFilter} onValueChange={setSelectedGradeFilter}>
              <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades (1-9)</SelectItem>
                <SelectItem value="2">Grade 2 (Lower Primary)</SelectItem>
                <SelectItem value="4">Grade 4 (Upper Primary)</SelectItem>
                <SelectItem value="5">Grade 5 (Upper Primary)</SelectItem>
                <SelectItem value="7">Grade 7 (Junior School)</SelectItem>
                <SelectItem value="8">Grade 8 (Junior School)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stream Filter */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <Filter size={12} className="text-indigo-600" /> Stream
            </Label>
            <Select value={selectedStreamFilter} onValueChange={setSelectedStreamFilter}>
              <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="All Streams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Streams</SelectItem>
                <SelectItem value="Blue">Blue Stream</SelectItem>
                <SelectItem value="Green">Green Stream</SelectItem>
                <SelectItem value="Alpha">Alpha Stream</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Picker Controls */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Closing Date</Label>
              <Input 
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                className="h-9 text-xs rounded-xl bg-slate-50 border-slate-200 px-2"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Next Opening</Label>
              <Input 
                type="date"
                value={nextOpeningDate}
                onChange={(e) => setNextOpeningDate(e.target.value)}
                className="h-9 text-xs rounded-xl bg-slate-50 border-slate-200 px-2"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Report Cards Render Output */}
      <div className="space-y-8">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-8">
            <p className="text-slate-500 font-bold text-sm">No students match your selected filters.</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 text-indigo-600 text-xs font-bold"
              onClick={() => { setSelectedStudentId("all"); setSelectedGradeFilter("all"); setSelectedStreamFilter("all"); }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const bandId = resolveGradeBandId(student.current_grade);
            const studentLearningAreas = LEARNING_AREAS.filter(la => la.grade_band_id === bandId);
            const studentMarks = INITIAL_MARKS[student.id] || {};
            const studentRemarks = remarksState[student.id] || { teacher_remark: '', hoi_remark: '' };

            return (
              <div key={student.id} className="print:m-0 print:p-0">
                {student.current_grade >= 1 && student.current_grade <= 3 && (
                  <LowerPrimaryReportCard
                    student={student}
                    learningAreas={studentLearningAreas}
                    marks={studentMarks}
                    teacherRemark={studentRemarks.teacher_remark}
                    hoiRemark={studentRemarks.hoi_remark}
                    onSaveTeacher={(text) => handleSaveTeacherRemark(student.id, text)}
                    onSaveHOI={(text) => handleSaveHOIRemark(student.id, text)}
                    closingDate={closingDate}
                    nextOpeningDate={nextOpeningDate}
                  />
                )}

                {student.current_grade >= 4 && student.current_grade <= 6 && (
                  <UpperPrimaryReportCard
                    student={student}
                    learningAreas={studentLearningAreas}
                    marks={studentMarks}
                    teacherRemark={studentRemarks.teacher_remark}
                    hoiRemark={studentRemarks.hoi_remark}
                    onSaveTeacher={(text) => handleSaveTeacherRemark(student.id, text)}
                    onSaveHOI={(text) => handleSaveHOIRemark(student.id, text)}
                    closingDate={closingDate}
                    nextOpeningDate={nextOpeningDate}
                  />
                )}

                {student.current_grade >= 7 && student.current_grade <= 9 && (
                  <JuniorSchoolReportCard
                    student={student}
                    learningAreas={studentLearningAreas}
                    marks={studentMarks}
                    teacherRemark={studentRemarks.teacher_remark}
                    hoiRemark={studentRemarks.hoi_remark}
                    onSaveTeacher={(text) => handleSaveTeacherRemark(student.id, text)}
                    onSaveHOI={(text) => handleSaveHOIRemark(student.id, text)}
                    closingDate={closingDate}
                    nextOpeningDate={nextOpeningDate}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReportCards;