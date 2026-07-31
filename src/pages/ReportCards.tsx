import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download, School } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import BackButton from '@/components/ui/BackButton';
import { STUDENTS, GRADES_DATA } from '@/lib/mock-data';
import { MOCK_HISTORICAL_ASSESSMENTS } from '@/lib/academic-history-data';
import { PerformanceLevel } from '@/types/academic-history';

// Helper function to get performance level from score
const getLevelFromScore = (score: number): PerformanceLevel => {
  if (score >= 80) return 'EE';
  if (score >= 50) return 'ME';
  if (score >= 30) return 'AE';
  return 'BE';
};

// Helper function to average an array of numbers
const average = (arr: number[]): number => {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((a, b) => a + b, 0);
  return sum / arr.length;
};

const ReportCards = () => {
  // State for selection controls
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [selectedStreamName, setSelectedStreamName] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("term1");
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [batchMode, setBatchMode] = useState<boolean>(false);

  // Get selected grade object
  const selectedGradeObj = useMemo(() => {
    return GRADES_DATA.find(g => g.id === selectedGradeId);
  }, [selectedGradeId]);

  // Get selected stream object
  const selectedStreamObj = useMemo(() => {
    if (!selectedGradeObj) return null;
    return selectedGradeObj.streams.find(s => s.name === selectedStreamName);
  }, [selectedGradeObj, selectedStreamName]);

  // Get students in the selected grade and stream
  const filteredStudents = useMemo(() => {
    if (!selectedGradeObj || !selectedStreamName) return [];
    const gradeNum = selectedGradeObj.name.replace(/[^0-9]/g, '');
    return STUDENTS.filter(s => {
      const matchesGrade = s.grade === gradeNum || s.grade === selectedGradeObj.name;
      const matchesStream = s.stream === selectedStreamName;
      return matchesGrade && matchesStream;
    });
  }, [selectedGradeObj, selectedStreamName]);

  // Get report card data for a specific student
  const getReportCardData = (studentId: string) => {
    const student = STUDENTS.find(s => s.id === studentId);
    if (!student) return null;

    // Filter historical assessments for this student, term, year, and relevant types
    const relevantAssessments = MOCK_HISTORICAL_ASSESSMENTS.filter(a => 
      a.studentId === studentId && 
      a.term === selectedTerm && 
      a.academicYear === selectedYear &&
      (a.assessmentType === 'Formative' || a.assessmentType === 'Summative')
    );

    // Group by subject
    const subjectMap: Record<string, { formative: number[]; summative: number[]; comment: string }> = {};
    relevantAssessments.forEach(assessment => {
      if (!subjectMap[assessment.subject]) {
        subjectMap[assessment.subject] = { formative: [], summative: [], comment: assessment.comment || "" };
      }
      if (assessment.assessmentType === 'Formative') {
        subjectMap[assessment.subject].formative.push(assessment.score);
      } else if (assessment.assessmentType === 'Summative') {
        subjectMap[assessment.subject].summative.push(assessment.score);
        // We'll use the last comment from summative assessment (or first, but we'll take the last)
        subjectMap[assessment.subject].comment = assessment.comment || "";
      }
    });

    // Build subjects array for the report card
    const subjects = Object.entries(subjectMap).map(([subjectName, data]) => {
      const formativeAvg = average(data.formative);
      const summativeScore = data.summative[0] || null; // Take first summative score if exists
      const scoreForLevel = summativeScore !== null ? summativeScore : (data.formative.length > 0 ? data.formative[0] : 0);
      const level = getLevelFromScore(scoreForLevel);

      return {
        name: subjectName,
        formative: data.formative.length > 0 ? Math.round(formativeAvg) : null,
        summative: summativeScore !== null ? Math.round(summativeScore) : null,
        level: level as PerformanceLevel,
        comment: data.comment || null
      };
    });

    // Sort subjects alphabetically for consistency
    subjects.sort((a, b) => a.name.localeCompare(b.name));

    // Default comments (in a real app, these would come from the database)
    const classTeacherComment = "A very hardworking and disciplined student. Keep it up!";
    const headteacherComment = "Outstanding performance across all learning areas.";

    return {
      student: {
        name: student.name,
        assessmentNumber: student.assessment,
        grade: selectedGradeObj?.name || "",
        stream: selectedStreamName
      },
      term: selectedTerm,
      year: selectedYear,
      subjects,
      classTeacherComment,
      headteacherComment
    };
  };

  // Get report card data for the selected student (if any)
  const reportCardData = selectedStudentId ? getReportCardData(selectedStudentId) : null;

  // Get report card data for all students in the class (for batch mode)
  const batchReportCards = useMemo(() => {
    if (!batchMode || !selectedGradeObj || !selectedStreamName) return [];
    return filteredStudents.map(student => getReportCardData(student.id)).filter(Boolean);
  }, [batchMode, selectedGradeObj, selectedStreamName, filteredStudents]);

  // Handle grade change - reset stream and student
  const handleGradeChange = (gradeId: string) => {
    setSelectedGradeId(gradeId);
    setSelectedStreamName("");
    setSelectedStudentId("");
    setBatchMode(false);
  };

  // Handle stream change - reset student
  const handleStreamChange = (streamName: string) => {
    setSelectedStreamName(streamName);
    setSelectedStudentId("");
    setBatchMode(false);
  };

  // Handle student change
  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    setBatchMode(false);
  };

  // Handle term or year change - reset batch mode
  const handleTermOrYearChange = () => {
    setBatchMode(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Report Cards</h1>
            <p className="text-muted-foreground">Preview and print summative assessment reports.</p>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" className="rounded-xl" onClick={() => window.print()}>
            <Download size={18} className="mr-2" /> Export PDF
          </Button>
          <Button onClick={() => window.print()} className="rounded-xl shadow-lg shadow-primary/20">
            <Printer size={18} className="mr-2" /> Print Reports
          </Button>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Grade Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Grade/Class</label>
            <select
              value={selectedGradeId}
              onChange={(e) => handleGradeChange(e.target.value)}
              className="w-full rounded-xl h-12 bg-slate-50 border-slate-100 font-bold focus:bg-white"
            >
              <option value="">Select Grade</option>
              {GRADES_DATA.map(grade => (
                <option key={grade.id} value={grade.id}>
                  {grade.name} ({grade.category})
                </option>
              ))}
            </select>
          </div>

          {/* Stream Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Stream</label>
            <select
              value={selectedStreamName}
              onChange={(e) => handleStreamChange(e.target.value)}
              className="w-full rounded-xl h-12 bg-slate-50 border-slate-100 font-bold focus:bg-white"
              disabled={!selectedGradeId}
            >
              <option value="">Select Stream</option>
              {selectedGradeObj ? selectedGradeObj.streams.map(stream => (
                <option key={stream.id} value={stream.name}>
                  {stream.name}
                </option>
              )) : []}
            </select>
          </div>

          {/* Student Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Student</label>
            <select
              value={selectedStudentId}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full rounded-xl h-12 bg-slate-50 border-slate-100 font-bold focus:bg-white"
              disabled={!selectedStreamName}
            >
              <option value="">Select Student</option>
              {filteredStudents.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} (Assessment: {student.assessment})
                )
              ))}
            </select>
          </div>

          {/* Term and Year Selectors */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Term</label>
            <select
              value={selectedTerm}
              onChange={handleTermOrYearChange}
              className="w-full rounded-xl h-12 bg-slate-50 border-slate-100 font-bold focus:bg-white"
            >
              <option value="term1">Term 1</option>
              <option value="term2">Term 2</option>
              <option value="term3">Term 3</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Year</label>
            <select
              value={selectedYear}
              onChange={handleTermOrYearChange}
              className="w-full rounded-xl h-12 bg-slate-50 border-slate-100 font-bold focus:bg-white"
            >
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Batch Generation Button */}
          <div className="flex-col md:flex-row md:col-span-2 justify-end">
            <Button
              className="rounded-2xl h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2"
              onClick={() => setBatchMode(true)}
              disabled={batchMode || !selectedGradeId || !selectedStreamName || !filteredStudents.length}
            >
              {batchMode ? "Generating..." : "Generate Report for All Students in Class"}
            </Button>
            {!batchMode && (
              <Button
                variant="ghost"
                className="h-12 px-6 text-slate-500 hover:text-slate-900"
                onClick={() => {
                  setSelectedGradeId("");
                  setSelectedStreamName("");
                  setSelectedStudentId("");
                }}
              >
                Clear Selection
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Report Card Display */}
      {!batchMode ? (
        // Single Student View
        reportCardData ? (
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
                    <p><span className="text-muted-foreground">Year:</span> {selectedYear}</p>
                    <p><span className="text-muted-foreground">Term:</span> {selectedTerm.toUpperCase()}</p>
                  </div>
                  <div className="text-left text-xs">
                    <p><span className="text-muted-foreground">Grade:</span> {reportCardData.student.grade}</p>
                    <p><span className="text-muted-foreground">Category:</span> {selectedGradeObj?.category}</p>
                  </div>
                </div>
              </div>

              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-widest">Student Name</p>
                  <p className="font-bold text-lg">{reportCardData.student.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-widest">Assessment Number</p>
                  <p className="font-bold text-lg">{reportCardData.student.assessmentNumber}</p>
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
                    {reportCardData.subjects.map((subject, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 font-medium">{subject.name}</td>
                        <td className="px-4 py-3 text-center">
                          {subject.formative !== null ? `${subject.formative}%` : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {subject.summative !== null ? `${subject.summative}%` : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={subject.level === 'EE' ? "border-emerald-200 bg-emerald-50 text-emerald-700" : subject.level === 'ME' ? "border-blue-200 bg-blue-50 text-blue-700" : subject.level === 'AE' ? "border-amber-200 bg-amber-50 text-amber-700" : "border-rose-200 bg-rose-50 text-rose-700"}>
                            {subject.level}
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
                  <p className="text-sm italic border-b border-dotted pb-2">{reportCardData.classTeacherComment}</p>
                  <p className="text-xs font-bold pt-4">Sign: ...........................................</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase">Headteacher's Message</p>
                  <p className="text-sm italic border-b border-dotted pb-2">{reportCardData.headteacherComment}</p>
                  <p className="text-xs font-bold pt-4">Sign: ...........................................</p>
                </div>
              </div>

              <div className="text-center pt-8 text-[10px] text-slate-400">
                This is an official computer-generated report card for Munyaka Primary School.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
              <School size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Please select a student to view their report card</h3>
            <p className="text-slate-400 max-w-xs mx-auto">Use the controls above to select a grade, stream, student, term, and year.</p>
          </div>
        )
      ) : (
        // Batch View - All Students in Class
        <div className="space-y-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-black text-slate-900">Batch Report Cards</h2>
            <Button 
              variant="ghost"
              className="text-slate-500 hover:text-slate-900"
              onClick={() => setBatchMode(false)}
            >
              ← Back to Single Student View
            </Button>
          </div>
          {batchReportCards.length > 0 ? (
            <div className="space-y-4">
              {batchReportCards.map((data, index) => (
                <Card key={data.student.assessmentNumber} className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden mb-6">
                  <CardContent className="p-6">
                    {/* Mini Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{data.student.name}</h3>
                        <p className="text-sm text-slate-500">{data.student.grade} - {data.student.stream} | {data.year.toUpperCase()}, {data.term.toUpperCase()}</p>
                      </div>
                    </div>
                    {/* Performance Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="px-4 py-2 text-left font-bold text-[10px] uppercase tracking-widest">Learning Area</th>
                            <th className="px-4 py-2 text-center font-bold text-[10px] uppercase tracking-widest">Formative</th>
                            <th className="px-4 py-2 text-center font-bold text-[10px] uppercase tracking-widest">Summative</th>
                            <th className="px-4 py-2 text-center font-bold text-[10px] uppercase tracking-widest">Level</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {data.subjects.map((subject, i) => (
                            <tr key={i}>
                              <td className="px-4 py-3 font-medium">{subject.name}</td>
                              <td className="px-4 py-3 text-center">
                                {subject.formative !== null ? `${subject.formative}%` : "—"}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {subject.summative !== null ? `${subject.summative}%` : "—"}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge variant="outline" className={subject.level === 'EE' ? "border-emerald-200 bg-emerald-50 text-emerald-700" : subject.level === 'ME' ? "border-blue-200 bg-blue-50 text-blue-700" : subject.level === 'AE' ? "border-amber-200 bg-amber-50 text-amber-700" : "border-rose-200 bg-rose-50 text-rose-700"}>
                                  {subject.level}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-500">No students found for the selected grade and stream.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportCards;