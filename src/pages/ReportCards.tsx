"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackButton from '@/components/ui/BackButton';
import { 
  Printer, 
  School, 
  User, 
  Sparkles, 
  BookOpen, 
  FileText, 
  Award, 
  CheckCircle2, 
  Download,
  RotateCcw,
  Search
} from 'lucide-react';
import { STUDENTS, GRADES_DATA } from '@/lib/mock-data';
import { FALLBACK_CLUSTERS } from '@/lib/assessment-constants';
import { showSuccess } from '@/utils/toast';
import { cn } from "@/lib/utils";

interface CBCSubjectScore {
  id: string;
  name: string;
  score: number;
  remarks: string;
}

export type CBCBand = 'EE' | 'ME' | 'AE' | 'BE';

export interface CBCBandConfig {
  code: CBCBand;
  label: string;
  badgeStyle: string;
  printBadgeStyle: string;
}

export const getCBCBand = (score: number): CBCBandConfig => {
  if (score >= 80) {
    return {
      code: 'EE',
      label: 'Exceeding Expectations (EE)',
      badgeStyle: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
      printBadgeStyle: 'bg-emerald-50 text-emerald-900 border-emerald-400'
    };
  } else if (score >= 65) {
    return {
      code: 'ME',
      label: 'Meeting Expectations (ME)',
      badgeStyle: 'bg-blue-100 text-blue-900 border-blue-300 font-bold',
      printBadgeStyle: 'bg-blue-50 text-blue-900 border-blue-400'
    };
  } else if (score >= 50) {
    return {
      code: 'AE',
      label: 'Approaching Expectations (AE)',
      badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
      printBadgeStyle: 'bg-amber-50 text-amber-900 border-amber-400'
    };
  } else {
    return {
      code: 'BE',
      label: 'Below Expectations (BE)',
      badgeStyle: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
      printBadgeStyle: 'bg-rose-50 text-rose-900 border-rose-400'
    };
  }
};

const DEFAULT_SUBJECT_REMARKS: Record<string, string> = {
  'Mathematics': 'Demonstrates strong analytical and problem-solving skills.',
  'English': 'Articulate in oral expression and creative story writing.',
  'Kiswahili': 'Uwezo mzuri wa kusoma na kuandika insha kwa ufasaha.',
  'Science': 'Excellent scientific inquiry and practical observation.',
  'Science & Tech': 'Great understanding of digital literacy and practical tasks.',
  'Agriculture': 'Active participation in school farm project tasks.',
  'Arts': 'Very creative in drawing, modeling, and music rhythm.',
  'Creative': 'Very creative in drawing, modeling, and music rhythm.',
  'Social': 'Good awareness of community values and social duties.',
  'Religious': 'Demonstrates commendable moral uprightness and discipline.'
};

const ReportCards = () => {
  // Selector / Filter States
  const [selectedStudentId, setSelectedStudentId] = useState<string>(STUDENTS[0]?.id || "1");
  const [academicYear, setAcademicYear] = useState<string>(new Date().getFullYear().toString());
  const [term, setTerm] = useState<string>("term1");
  
  // Custom Editable Learner Meta
  const selectedStudentObj = useMemo(() => {
    return STUDENTS.find(s => s.id === selectedStudentId) || STUDENTS[0];
  }, [selectedStudentId]);

  const [learnerName, setLearnerName] = useState<string>(selectedStudentObj.name);
  const [assessmentNo, setAssessmentNo] = useState<string>(`KNEC/CBC/${selectedStudentObj.assessment}`);
  const [gradeStream, setGradeStream] = useState<string>(`Grade ${selectedStudentObj.grade} ${selectedStudentObj.stream}`);
  
  // Comments States
  const [classTeacherComment, setClassTeacherComment] = useState<string>(
    "A disciplined, focused, and hardworking learner. Consistently demonstrates great leadership and active participation in class activities."
  );
  const [headteacherComment, setHeadteacherComment] = useState<string>(
    "Outstanding overall academic progress. Keep up the high level of dedication and excellence."
  );

  // Determine subjects based on student grade
  const defaultSubjects = useMemo<CBCSubjectScore[]>(() => {
    const studentGrade = selectedStudentObj.grade;
    let clusterId = 'upper-primary';
    if (studentGrade === '1' || studentGrade === '2' || studentGrade === '3') clusterId = 'lower-primary';
    else if (studentGrade.toLowerCase().includes('pp')) clusterId = 'pre-primary';
    else if (parseInt(studentGrade) >= 7) clusterId = 'junior-school';

    const cluster = FALLBACK_CLUSTERS.find(c => c.id === clusterId) || FALLBACK_CLUSTERS[2];
    
    return cluster.learningAreas.map((la, idx) => {
      // Deterministic sample score
      const baseScore = 68 + ((idx * 7) % 28);
      const remark = DEFAULT_SUBJECT_REMARKS[la.name] || 'Shows consistent effort and steady progress in class activities.';
      return {
        id: la.id,
        name: la.name,
        score: baseScore,
        remarks: remark
      };
    });
  }, [selectedStudentObj]);

  const [subjectScores, setSubjectScores] = useState<CBCSubjectScore[]>(defaultSubjects);

  // Sync state when student selection changes
  React.useEffect(() => {
    const student = STUDENTS.find(s => s.id === selectedStudentId);
    if (student) {
      setLearnerName(student.name);
      setAssessmentNo(`KNEC/CBC/${student.assessment}`);
      setGradeStream(`Grade ${student.grade} ${student.stream}`);
      setSubjectScores(defaultSubjects);
    }
  }, [selectedStudentId, defaultSubjects]);

  // Calculations
  const averageScore = useMemo(() => {
    if (subjectScores.length === 0) return 0;
    const total = subjectScores.reduce((sum, s) => sum + s.score, 0);
    return Math.round(total / subjectScores.length);
  }, [subjectScores]);

  const overallBand = useMemo(() => {
    return getCBCBand(averageScore);
  }, [averageScore]);

  // Handlers
  const handleScoreChange = (id: string, newScoreVal: string) => {
    let scoreNum = parseInt(newScoreVal, 10);
    if (isNaN(scoreNum)) scoreNum = 0;
    if (scoreNum > 100) scoreNum = 100;

    setSubjectScores(prev => prev.map(s => s.id === id ? { ...s, score: scoreNum } : s));
  };

  const handleRemarkChange = (id: string, newRemark: string) => {
    setSubjectScores(prev => prev.map(s => s.id === id ? { ...s, remarks: newRemark } : s));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    const student = STUDENTS.find(s => s.id === selectedStudentId) || STUDENTS[0];
    setLearnerName(student.name);
    setAssessmentNo(`KNEC/CBC/${student.assessment}`);
    setGradeStream(`Grade ${student.grade} ${student.stream}`);
    setSubjectScores(defaultSubjects);
    setClassTeacherComment("A disciplined, focused, and hardworking learner. Consistently demonstrates great leadership and active participation in class activities.");
    setHeadteacherComment("Outstanding overall academic progress. Keep up the high level of dedication and excellence.");
    showSuccess("Reset report card fields to default values.");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Screen Page Header Controls (Hidden during Print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">CBC Report Card Generator</h1>
            <p className="text-muted-foreground font-medium">Generate official 4-Band CBC Learner Progress Reports formatted for print and PDF export.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={handleReset}
            className="rounded-2xl h-12 px-5 border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 gap-2 shadow-sm"
          >
            <RotateCcw size={16} /> Reset
          </Button>

          <Button 
            onClick={handlePrint}
            className="rounded-2xl h-12 px-7 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100 gap-2"
          >
            <Printer size={18} /> Print Report / Save PDF
          </Button>
        </div>
      </div>

      {/* Editor & Configuration Toolbar (Hidden during Print) */}
      <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-6 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Select Learner from Directory</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue placeholder="Choose student..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {STUDENTS.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — Grade {s.grade} ({s.stream})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Academic Year</Label>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {["2024", "2025", "2026"].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Term</Label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="term1">Term 1</SelectItem>
                <SelectItem value="term2">Term 2</SelectItem>
                <SelectItem value="term3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Class Cohort</Label>
            <Input 
              value={gradeStream} 
              onChange={e => setGradeStream(e.target.value)} 
              className="rounded-2xl h-12 bg-slate-50 border-none font-bold text-slate-800" 
            />
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* OFFICIAL CBC REPORT CARD (PRINT TARGET)                                    */}
      {/* ========================================================================= */}
      <Card className="max-w-4xl mx-auto border border-slate-200 shadow-xl rounded-3xl bg-white p-8 md:p-12 print:shadow-none print:border-none print:p-0 print:max-w-none print:w-full print:m-0">
        <CardContent className="space-y-8 p-0">
          
          {/* Header Block */}
          <div className="text-center space-y-2 border-b-2 border-slate-900 pb-6 relative">
            <div className="flex items-center justify-center gap-3 mb-1">
              <div className="w-12 h-12 bg-indigo-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-md print:bg-slate-900">
                <School size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                  MUNYAKA PRIMARY AND JUNIOR SCHOOL
                </h1>
                <p className="text-xs md:text-sm font-bold text-slate-700">
                  P.O. BOX 5239-30100, ELDORET • TEL: +254 712 345 678
                </p>
              </div>
            </div>

            <p className="text-xs font-black uppercase tracking-widest text-indigo-700 print:text-slate-800">
              MOTTO: "KNOWLEDGE IS POWER"
            </p>

            <div className="pt-2">
              <Badge className="bg-slate-900 text-white border-none rounded-lg px-4 py-1 font-black text-xs md:text-sm uppercase tracking-widest">
                END OF TERM CBC LEARNER PROGRESS REPORT
              </Badge>
            </div>
          </div>

          {/* Learner Meta Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs md:text-sm print:bg-white print:border-slate-300">
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Learner Full Name</p>
              <Input 
                value={learnerName} 
                onChange={e => setLearnerName(e.target.value)}
                className="font-bold text-slate-900 border-none bg-transparent p-0 h-auto focus-visible:ring-0 text-sm md:text-base"
              />
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Assessment / Admin No.</p>
              <Input 
                value={assessmentNo} 
                onChange={e => setAssessmentNo(e.target.value)}
                className="font-bold text-slate-900 border-none bg-transparent p-0 h-auto focus-visible:ring-0 uppercase"
              />
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Grade & Stream</p>
              <p className="font-bold text-slate-900 pt-0.5">{gradeStream}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Academic Term & Year</p>
              <p className="font-bold text-slate-900 pt-0.5">{term === 'term1' ? 'Term 1' : term === 'term2' ? 'Term 2' : 'Term 3'} • {academicYear}</p>
            </div>
          </div>

          {/* Subject Performance Scores Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                Learning Area Assessment Scoresheet
              </h3>
              <p className="text-xs font-bold text-slate-400 print:hidden">
                (Click scores or remarks below to edit before printing)
              </p>
            </div>

            <div className="border border-slate-300 rounded-2xl overflow-hidden print:rounded-none">
              <table className="w-full text-xs md:text-sm text-left border-collapse">
                <thead className="bg-slate-100 border-b border-slate-300 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-black uppercase tracking-wider border-r border-slate-300 w-1/4">Learning Area</th>
                    <th className="px-3 py-3 font-black uppercase tracking-wider text-center border-r border-slate-300 w-24">Score (%)</th>
                    <th className="px-4 py-3 font-black uppercase tracking-wider text-center border-r border-slate-300 w-44">Performance Band</th>
                    <th className="px-4 py-3 font-black uppercase tracking-wider">Subject Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {subjectScores.map((subj) => {
                    const band = getCBCBand(subj.score);
                    return (
                      <tr key={subj.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 border-r border-slate-200">
                          {subj.name}
                        </td>
                        <td className="px-3 py-3 text-center font-black text-slate-900 border-r border-slate-200">
                          <input 
                            type="number" 
                            min="0"
                            max="100"
                            value={subj.score}
                            onChange={(e) => handleScoreChange(subj.id, e.target.value)}
                            className="w-14 text-center font-black bg-slate-50 border border-slate-200 rounded-md p-1 print:border-none print:bg-transparent"
                          />
                        </td>
                        <td className="px-4 py-3 text-center border-r border-slate-200">
                          <Badge variant="outline" className={cn("px-2.5 py-1 rounded-lg border text-xs print:text-[10px]", band.badgeStyle)}>
                            {band.code} — {subj.score >= 80 ? 'Exceeding' : subj.score >= 65 ? 'Meeting' : subj.score >= 50 ? 'Approaching' : 'Below'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <input 
                            type="text" 
                            value={subj.remarks}
                            onChange={(e) => handleRemarkChange(subj.id, e.target.value)}
                            className="w-full bg-transparent border-b border-transparent focus:border-indigo-400 focus:bg-slate-50 outline-none font-medium text-xs print:border-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100/80 border-t-2 border-slate-300 font-black text-slate-900">
                  <tr>
                    <td className="px-4 py-3 text-right uppercase tracking-wider border-r border-slate-300" colSpan={1}>
                      Overall Class Mean:
                    </td>
                    <td className="px-3 py-3 text-center text-base font-black text-indigo-900 border-r border-slate-300">
                      {averageScore}%
                    </td>
                    <td className="px-4 py-3 text-center border-r border-slate-300">
                      <Badge className={cn("px-3 py-1 text-xs font-black border uppercase", overallBand.badgeStyle)}>
                        {overallBand.code} ({overallBand.label.split(' ')[0]})
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-bold uppercase tracking-tight">
                      Official CBC Rating: {overallBand.label}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Official CBC 4-Band Grading Key Legend */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs print:p-3 print:bg-white print:border-slate-300">
            <p className="font-black text-slate-500 uppercase tracking-widest text-[10px]">CBC Performance Rating Key</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-medium">
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <Badge className="bg-emerald-600 text-white font-black text-[10px]">EE</Badge>
                <div>
                  <p className="font-bold text-emerald-900 text-[11px]">80% – 100%</p>
                  <p className="text-[9px] text-emerald-700">Exceeding Expectations</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-blue-50 border border-blue-200">
                <Badge className="bg-blue-600 text-white font-black text-[10px]">ME</Badge>
                <div>
                  <p className="font-bold text-blue-900 text-[11px]">65% – 79%</p>
                  <p className="text-[9px] text-blue-700">Meeting Expectations</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200">
                <Badge className="bg-amber-600 text-white font-black text-[10px]">AE</Badge>
                <div>
                  <p className="font-bold text-amber-900 text-[11px]">50% – 64%</p>
                  <p className="text-[9px] text-amber-700">Approaching Expectations</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200">
                <Badge className="bg-rose-600 text-white font-black text-[10px]">BE</Badge>
                <div>
                  <p className="font-bold text-rose-900 text-[11px]">Below 50%</p>
                  <p className="text-[9px] text-rose-700">Below Expectations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Qualitative Remarks Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2 p-4 bg-slate-50/70 rounded-2xl border border-slate-200 print:bg-white print:border-slate-300">
              <Label className="text-xs font-black uppercase text-slate-500 tracking-widest">Class Teacher's General Remarks</Label>
              <Textarea 
                value={classTeacherComment} 
                onChange={e => setClassTeacherComment(e.target.value)}
                className="bg-transparent border-none p-0 focus-visible:ring-0 text-xs md:text-sm italic text-slate-800 leading-relaxed min-h-[70px] resize-none"
              />
            </div>

            <div className="space-y-2 p-4 bg-slate-50/70 rounded-2xl border border-slate-200 print:bg-white print:border-slate-300">
              <Label className="text-xs font-black uppercase text-slate-500 tracking-widest">Headteacher's Comments & Endorsement</Label>
              <Textarea 
                value={headteacherComment} 
                onChange={e => setHeadteacherComment(e.target.value)}
                className="bg-transparent border-none p-0 focus-visible:ring-0 text-xs md:text-sm italic text-slate-800 leading-relaxed min-h-[70px] resize-none"
              />
            </div>
          </div>

          {/* Official Signatures & Stamp Block */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 text-xs md:text-sm font-bold text-slate-800">
            <div className="space-y-4">
              <p className="uppercase tracking-wider text-[11px] text-slate-500 font-black">Class Teacher Signature</p>
              <div className="border-b-2 border-dashed border-slate-400 h-10 w-full" />
              <p className="text-[11px] text-slate-400 font-medium">Date: ....................................................</p>
            </div>

            <div className="space-y-4 text-right">
              <p className="uppercase tracking-wider text-[11px] text-slate-500 font-black">Headteacher Stamp & Signature</p>
              <div className="border-b-2 border-dashed border-slate-400 h-10 w-full flex items-center justify-end">
                <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center text-[9px] text-slate-300 uppercase font-black tracking-widest rotate-12">
                  Official Seal
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="text-center pt-4 text-[10px] text-slate-400 font-medium border-t border-slate-100">
            This is an official computer-generated Competency-Based Curriculum (CBC) Report Card for Munyaka Primary and Junior School.
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default ReportCards;