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
  const [activeExamsCount, setActiveExamsCount] = useState<number>(0);
  const [completedExamsCount, setCompletedExamsCount] = useState<number>(0);

  const computeStudentData = () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('munyaka_current_user') || localStorage.getItem('munyaka_session') || '{}');
      
      // Load master learners list across potential keys
      let allLearners: any[] = [];
      for (const key of ['munyaka_learners', 'munyaka_learners_directory', 'munyaka_learners_v2', 'munyaka_students', 'students', 'learners', 'school_students', 'munyaka_learners_db']) {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              allLearners = parsed;
              break;
            } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.learners)) {
              allLearners = parsed.learners;
              break;
            }
          } catch {}
        }
      }

      // Match current user against master learners list
      let matchedLearner: any = null;
      if (allLearners.length > 0 && currentUser) {
        matchedLearner = allLearners.find((l: any) =>
          (currentUser.id && String(l.id) === String(currentUser.id)) ||
          (currentUser.uid && String(l.uid || l.id) === String(currentUser.uid)) ||
          (currentUser.email && l.email && String(l.email).toLowerCase() === String(currentUser.email).toLowerCase()) ||
          (currentUser.admissionNo && String(l.admissionNo || l.admNo || l.admissionNumber) === String(currentUser.admissionNo)) ||
          (currentUser.name && l.name && String(l.name).toLowerCase() === String(currentUser.name).toLowerCase())
        );
      }

      const combinedInfo = {
        ...(matchedLearner || {}),
        ...currentUser
      };

      setStudentInfo(combinedInfo);

      // Load all available exams/assessments from all_set_exams, assessments, munyaka_question_bank, question_bank
      let allExams: any[] = [];
      for (const k of ['all_set_exams', 'assessments', 'munyaka_question_bank', 'question_bank', 'munyaka_exams', 'exams']) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              allExams = [...allExams, ...parsed];
            } else if (parsed && typeof parsed === 'object') {
              // could be object map or wrapper
              const values = Object.values(parsed);
              if (values.length > 0) {
                allExams = [...allExams, ...values];
              }
            }
          } catch {}
        }
      }

      // Deduplicate exams by id or title
      const uniqueExamsMap = new Map();
      allExams.forEach(ex => {
        if (ex && typeof ex === 'object') {
          const id = ex.id || ex.examId || ex.title || JSON.stringify(ex);
          if (!uniqueExamsMap.has(id)) {
            uniqueExamsMap.set(id, ex);
          }
        }
      });
      const uniqueExams = Array.from(uniqueExamsMap.values());

      // Load all student submissions across possible storage keys
      let allSubmissions: any[] = [];
      for (const k of ['marked_student_submissions', 'munyaka_exam_submissions', 'student_submissions', 'munyaka_marks_records']) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              allSubmissions = [...allSubmissions, ...parsed];
            } else if (parsed && typeof parsed === 'object') {
              const values = Object.values(parsed);
              if (values.length > 0) {
                allSubmissions = [...allSubmissions, ...values];
              }
            }
          } catch {}
        }
      }

      // Identify student identifiers
      const studentId = String(combinedInfo.id || combinedInfo.uid || '').trim().toLowerCase();
      const studentAdm = String(combinedInfo.admissionNo || combinedInfo.admNo || combinedInfo.admissionNumber || combinedInfo.upi || '').trim().toLowerCase();
      const studentNameVal = String(combinedInfo.name || combinedInfo.fullName || '').trim().toLowerCase();
      const studentGradeVal = String(combinedInfo.grade || combinedInfo.stream || combinedInfo.classLevel || '').trim().toLowerCase();

      // Filter submissions belonging to current student
      const studentSubmissions = allSubmissions.filter((sub: any) => {
        if (!sub) return false;
        const subLearnerId = String(sub.learnerId || sub.studentId || sub.id || '').trim().toLowerCase();
        const subAdm = String(sub.admissionNo || sub.admNo || sub.admissionNumber || sub.upi || '').trim().toLowerCase();
        const subName = String(sub.learnerName || sub.studentName || sub.name || '').trim().toLowerCase();

        return (
          (studentId && subLearnerId === studentId) ||
          (studentAdm && subAdm === studentAdm) ||
          (studentNameVal && subName === studentNameVal)
        );
      });

      // Get set of completed assessment IDs or titles
      const completedIds = new Set();
      studentSubmissions.forEach((sub: any) => {
        if (sub.examId) completedIds.add(String(sub.examId));
        if (sub.id) completedIds.add(String(sub.id));
        if (sub.title) completedIds.add(String(sub.title).trim().toLowerCase());
        if (sub.assessmentTitle) completedIds.add(String(sub.assessmentTitle).trim().toLowerCase());
      });

      setCompletedAssessments(studentSubmissions);
      setCompletedExamsCount(completedIds.size || studentSubmissions.length);

      // Filter available exams: match grade/stream or general/all, active/published, not yet completed by this learner
      const filteredActiveExams = uniqueExams.filter((exam: any) => {
        if (!exam) return false;
        
        // Check if already completed
        const examId = String(exam.id || exam.examId || '').trim();
        const examTitle = String(exam.title || exam.examTitle || '').trim().toLowerCase();
        if ((examId && completedIds.has(examId)) || (examTitle && completedIds.has(examTitle))) {
          return false;
        }

        // Grade/Stream matching
        const examGrade = String(exam.grade || exam.classLevel || exam.targetGrade || exam.stream || 'all').trim().toLowerCase();
        const isGeneral = !examGrade || examGrade === 'all' || examGrade === 'general' || examGrade === 'all grades';
        const matchesGrade = isGeneral || (studentGradeVal && (examGrade.includes(studentGradeVal) || studentGradeVal.includes(examGrade)));

        return matchesGrade;
      });

      // If no strict grade match filters anything or if uniqueExams was empty, fallback or show all uncompleted unique exams
      const finalActiveExams = filteredActiveExams.length > 0 ? filteredActiveExams : uniqueExams.filter((exam: any) => {
        const examId = String(exam.id || exam.examId || '').trim();
        const examTitle = String(exam.title || exam.examTitle || '').trim().toLowerCase();
        return !((examId && completedIds.has(examId)) || (examTitle && completedIds.has(examTitle)));
      });

      setActiveAssessments(finalActiveExams);
      setActiveExamsCount(finalActiveExams.length);

    } catch (e) {
      console.error('Error computing student data:', e);
    }
  };

  useEffect(() => {
    computeStudentData();

    // Listen to storage events and custom sync events for real-time live updates
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || [
        'munyaka_current_user', 'munyaka_session', 'marked_student_submissions',
        'all_set_exams', 'assessments', 'munyaka_question_bank', 'munyaka_learners',
        'munyaka_exam_submissions', 'student_submissions', 'munyaka_marks_records'
      ].includes(e.key)) {
        computeStudentData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(() => {
      computeStudentData();
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const studentName = studentInfo?.name || studentInfo?.fullName || 'Student Learner';
  const studentGrade = studentInfo?.grade || studentInfo?.stream || studentInfo?.classLevel || 'Grade 5';
  
  const admissionNumber =
    studentInfo?.admissionNo ??
    studentInfo?.admNo ??
    studentInfo?.admissionNumber ??
    studentInfo?.upi ??
    studentInfo?.assessmentNo ??
    'Not Assigned';

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
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activeExamsCount} Available</h3>
          </div>
        </Card>

        <Card className="rounded-[2rem] border-0 shadow-lg bg-white dark:bg-slate-900 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={26} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{completedExamsCount} Submitted</h3>
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
