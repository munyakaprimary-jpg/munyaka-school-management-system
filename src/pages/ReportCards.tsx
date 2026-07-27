"use client";

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Download, Filter, RefreshCw, FileText } from "lucide-react";
import { 
  GRADE_BANDS, 
  LEARNING_AREAS, 
  INITIAL_STUDENTS, 
  INITIAL_MARKS, 
  DEFAULT_REMARKS,
  StudentRemarks,
  Student,
  resolveGradeBandId
} from '@/lib/report-card-store';
import { LowerPrimaryReportCard } from '@/components/report-cards/LowerPrimaryReportCard';
import { UpperPrimaryReportCard } from '@/components/report-cards/UpperPrimaryReportCard';
import { JuniorSchoolReportCard } from '@/components/report-cards/JuniorSchoolReportCard';
import { showSuccess } from '@/utils/toast';

const ReportCards = () => {
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("all");
  const [selectedStreamFilter, setSelectedStreamFilter] = useState<string>("all");
  const [remarksState, setRemarksState] = useState<Record<string, StudentRemarks>>(DEFAULT_REMARKS);

  // Filter students
  const filteredStudents = INITIAL_STUDENTS.filter(student => {
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
    showSuccess(`Preparing ${filteredStudents.length} report card(s) for printing...`);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Top Controls Bar - Hidden during printing */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dynamic Report Cards</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Auto-switch layouts based on school tier (Lower Primary, Upper Primary & Junior School).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="rounded-xl h-10 text-xs border-slate-200">
            <Download size={15} className="mr-1.5" /> Export All PDF
          </Button>
          <Button 
            onClick={handleTriggerPrint}
            className="rounded-xl h-10 px-5 text-xs font-bold shadow-md bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            <Printer size={16} /> Print Report Cards ({filteredStudents.length})
          </Button>
        </div>
      </div>

      {/* Filter Toolbar - Hidden during printing */}
      <Card className="border-none shadow-sm bg-white p-4 rounded-2xl print:hidden">
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Filter Dataset:</span>
            </div>

            <Select value={selectedGradeFilter} onValueChange={setSelectedGradeFilter}>
              <SelectTrigger className="w-36 h-9 text-xs rounded-xl bg-slate-50 border-slate-200">
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

            <Select value={selectedStreamFilter} onValueChange={setSelectedStreamFilter}>
              <SelectTrigger className="w-32 h-9 text-xs rounded-xl bg-slate-50 border-slate-200">
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

          <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
            <FileText size={14} className="text-indigo-600" />
            Showing {filteredStudents.length} Student Record(s)
          </div>
        </div>
      </Card>

      {/* Bulk Report Cards Printable Render Container */}
      <div className="space-y-8">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-8">
            <p className="text-slate-500 font-bold text-sm">No students found matching selected filters.</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 text-indigo-600 text-xs font-bold"
              onClick={() => { setSelectedGradeFilter("all"); setSelectedStreamFilter("all"); }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          filteredStudents.map((student) => {
            // Auto-assign grade band ID based on current_grade
            const bandId = resolveGradeBandId(student.current_grade);
            
            // Dynamically fetch ONLY learning areas linked to this grade_band_id
            const studentLearningAreas = LEARNING_AREAS.filter(la => la.grade_band_id === bandId);
            const studentMarks = INITIAL_MARKS[student.id] || {};
            const studentRemarks = remarksState[student.id] || { teacher_remark: '', hoi_remark: '' };

            return (
              <div key={student.id} className="print:m-0 print:p-0">
                {/* CONDITIONAL LAYOUT SWITCHER BASED ON GRADE TIER */}
                {student.current_grade >= 1 && student.current_grade <= 3 && (
                  <LowerPrimaryReportCard
                    student={student}
                    learningAreas={studentLearningAreas}
                    marks={studentMarks}
                    teacherRemark={studentRemarks.teacher_remark}
                    hoiRemark={studentRemarks.hoi_remark}
                    onSaveTeacher={(text) => handleSaveTeacherRemark(student.id, text)}
                    onSaveHOI={(text) => handleSaveHOIRemark(student.id, text)}
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