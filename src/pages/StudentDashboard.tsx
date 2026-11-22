import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Award, CheckCircle2, Clock, FileText, ArrowRight, Sparkles, User, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [activeAssessments, setActiveAssessments] = useState<any[]>([]);
  const [completedAssessments, setCompletedAssessments] = useState<any[]>([]);

  useEffect(() => {
    try {
      const userObj = JSON.parse(localStorage.getItem('munyaka_current_user') || '{}');
      setStudentInfo(userObj);

      // Load assessments or question bank
      const questionBank = JSON.parse(localStorage.getItem('munyaka_question_bank') || '[]');
      setActiveAssessments(questionBank);

      const submissions = JSON.parse(localStorage.getItem('marked_student_submissions') || '[]');
      setCompletedAssessments(submissions);
    } catch (e) {
      console.error('Error loading student dashboard data:', e);
    }
  }, []);

  const studentName = studentInfo?.name || studentInfo?.fullName || 'Student Learner';
  const studentGrade = studentInfo?.grade || studentInfo?.stream || 'Grade 5';
  const admissionNumber = studentInfo?.admissionNumber || studentInfo?.upi || 'MUN/2026/001';

  return (
    <div className="space-y-8 pb-12">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/20 text-white font-black text-xs uppercase tracking-wider px-3 py-1 rounded-full border border-white/30">
                Student Portal
              </Badge>
              <Badge className="bg-emerald-500/30 text-emerald-200 font-bold text-xs px-3 py-1 rounded-full border border-emerald-400/30">
                {studentGrade}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Welcome back, {studentName}! 👋
            </h1>
            <p className="text-sm text-indigo-100 max-w-xl font-medium">
              Admission Number: <span className="font-bold text-white">{admissionNumber}</span> · Ready to excel in your CBC learning, assessments, and study corner.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate('/student-assessment')}
              className="bg-white text-indigo-900 hover:bg-indigo-50 font-black rounded-2xl h-12 px-6 shadow-xl flex items-center gap-2"
            >
              <FileText size={18} /> Open Assessment <ArrowRight size={16} />
            </Button>
            <Button
              onClick={() => navigate('/study-corner')}
              variant="outline"
              className="bg-indigo-950/40 border-indigo-400/40 text-white hover:bg-indigo-900 font-bold rounded-2xl h-12 px-6 shadow-xl flex items-center gap-2"
            >
              <BookOpen size={18} /> Study Corner
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="rounded-[2rem] border-0 shadow-lg bg-white dark:bg-slate-900 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
            <FileText size={26} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Exams</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activeAssessments.length} Available</h3>
          </div>
        </Card>

        <Card className="rounded-[2rem] border-0 shadow-lg bg-white dark:bg-slate-900 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={26} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{completedAssessments.length} Submitted</h3>
          </div>
        </Card>

        <Card className="rounded-[2rem] border-0 shadow-lg bg-white dark:bg-slate-900 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
            <Award size={26} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Learning Level</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{studentGrade}</h3>
          </div>
        </Card>

        <Card className="rounded-[2rem] border-0 shadow-lg bg-white dark:bg-slate-900 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles size={26} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Portal Status</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">Active</h3>
          </div>
        </Card>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[2rem] border-0 shadow-xl bg-white dark:bg-slate-900 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Active Assessments & Question Papers</h2>
                <p className="text-xs text-slate-500 mt-1">Select an assessment to begin answering questions or review instructions.</p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/student-assessment')}
                className="rounded-xl text-xs font-bold"
              >
                View All
              </Button>
            </div>

            {activeAssessments.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Active Assessment Scheduled</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  No active assessment is scheduled for your grade/stream right now. Check back later or explore your study materials.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeAssessments.slice(0, 3).map((exam, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 gap-4 hover:border-indigo-500/40 transition-all">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                          {exam.subject || 'CBC Assessment'}
                        </Badge>
                        <span className="text-xs font-bold text-slate-400">{exam.questions?.length || 0} Questions</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{exam.title || exam.examTitle || 'Term Assessment'}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{exam.instructions || 'Read all questions carefully before submitting your answers.'}</p>
                    </div>
                    <Button
                      onClick={() => navigate('/student-assessment')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 px-5 shrink-0"
                    >
                      Start Test <ArrowRight size={14} className="ml-1.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar Card */}
        <div className="space-y-6">
          <Card className="rounded-[2rem] border-0 shadow-xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 md:p-8">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <GraduationCap size={20} className="text-amber-400" /> Student Quick Links
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/student-assessment')}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-sm font-bold"
              >
                <span>My Assessment Portal</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/study-corner')}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-sm font-bold"
              >
                <span>CBC Study Corner</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/digital-hub')}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-sm font-bold"
              >
                <span>Digital Library Hub</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
