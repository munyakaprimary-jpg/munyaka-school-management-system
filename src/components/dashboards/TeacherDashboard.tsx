import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  ClipboardCheck,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  Megaphone,
  Lock,
  Bell,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCentralData } from '@/hooks/useCentralData';
import TeacherExportModule from '@/components/teacher/TeacherExportModule';
import { Wifi, Copy, Check, QrCode, Monitor } from 'lucide-react';
import { useState } from 'react';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { totalStudents } = useCentralData();

  const teacherName = user?.name || 'Lawrence Mwangi';
  const teacherRole = user?.role || 'Class Teacher';
  const roleLower = String(teacherRole).toLowerCase();
  const isAdmin = roleLower.includes('admin') || roleLower.includes('head') || roleLower.includes('owner');

  // Strict class restriction for teacher Lawrence / non-admins: always Grade 1 Blue
  const assignedTeacherGrade = (!isAdmin && (teacherName.toLowerCase().includes('lawrence') || !isAdmin)) ? 'Grade 1' : ((user as any)?.grade || (user as any)?.assignedClass || 'Grade 1');
  const assignedTeacherStream = (!isAdmin && (teacherName.toLowerCase().includes('lawrence') || !isAdmin)) ? 'Blue' : ((user as any)?.stream || (user as any)?.assignedStream || 'Blue');

  const activeGrade = assignedTeacherGrade;
  const activeStream = assignedTeacherStream;
  const fullClassTitle = `${activeGrade} ${activeStream}`;

  // Get student records
  let students: any[] = [];
  try {
    const centralDb = JSON.parse(localStorage.getItem('munyaka_central_db') || '{}');
    if (Array.isArray(centralDb.students)) {
      students = centralDb.students;
    } else {
      const rawStudents = localStorage.getItem('school_learners_data') || localStorage.getItem('munyaka_students');
      if (rawStudents) students = JSON.parse(rawStudents);
    }
  } catch {
    students = [];
  }

  // Get attendance records
  let attendanceRecords: any[] = [];
  try {
    const rawAtt = localStorage.getItem('school_attendance_logs');
    if (rawAtt) {
      const parsed = JSON.parse(rawAtt);
      if (Array.isArray(parsed)) {
        attendanceRecords = parsed;
      }
    }
  } catch {
    attendanceRecords = [];
  }

  // Filter real student records matching the assigned grade and stream strictly
  const matchingStudents = students.filter(
    (s) => String(s.grade || s.gradeLevel || s.assignedClass || "").trim().toLowerCase() === String(activeGrade).trim().toLowerCase() &&
           String(s.stream || s.assignedStream || "").trim().toLowerCase() === String(activeStream).trim().toLowerCase()
  );

  const realLearnerCount = matchingStudents.length;

  // Calculate attendance for these specific filtered students
  const todayKey = new Date().toISOString().split('T')[0];
  const presentLearners = attendanceRecords.filter(
    (r) => matchingStudents.some((s) => s.id === r.studentId || s.admNo === r.studentId) && r.date === todayKey && (r.status === 'present' || r.status === 'late')
  ).length;

  const [copiedUrl, setCopiedUrl] = useState(false);
  const lanUrl = "http://192.168.182.181:4173";

  const handleCopyLanUrl = () => {
    navigator.clipboard.writeText(lanUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full font-sans">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-8 text-white shadow-2xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-64 h-64 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-blue-200">
                <Sparkles size={14} /> CBC Portal
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-xs font-bold text-emerald-200">
                <Lock size={12} /> Class Locked: {fullClassTitle}
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Welcome back, {teacherName}!
            </h1>
            <p className="text-blue-100 text-sm md:text-base max-w-xl font-medium">
              You are signed in as <span className="underline decoration-blue-400 font-bold">{teacherName}</span> ({teacherRole}). Your dashboard is strictly restricted to <span className="font-bold">{fullClassTitle}</span>.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => navigate('/attendance')}
              className="bg-white text-blue-900 hover:bg-blue-50 font-bold px-5 py-3 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
            >
              <ClipboardCheck size={18} className="text-blue-600" />
              Take Attendance
            </Button>
            <Button
              onClick={() => navigate('/assessments')}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-bold px-5 py-3 rounded-2xl backdrop-blur-md transition-transform active:scale-95 flex items-center gap-2"
            >
              <FileSpreadsheet size={18} className="text-blue-300" />
              Enter Marks
            </Button>
          </div>
        </div>
      </div>
        
      {/* Teacher Batch Export Module */}
      <div id="teacher-export-module">
        <TeacherExportModule />
      </div>

      {/* Assigned Learners & Today's Attendance Cards (2-Column Horizontal Grid) */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Assigned Learners Card */}
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Assigned Learners</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{realLearnerCount}</h3>
            <p className="text-[10px] text-green-600 font-medium">
              Active in {activeGrade} {activeStream}
            </p>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Users size={20} />
          </div>
        </div>

        {/* Today's Attendance Card */}
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Today's Attendance</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{presentLearners} / {realLearnerCount}</h3>
            <p className="text-[10px] text-blue-600 font-medium">Roll call marked</p>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <ClipboardCheck size={20} />
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Quick Action Shortcuts</h2>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Teaching Tools</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div 
            onClick={() => navigate('/attendance')}
            className="group cursor-pointer bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardCheck size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Take Attendance</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mark daily learner attendance, check-ins, and absenteeism records for your stream.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-600 group-hover:gap-3 transition-all">
              <span>Open Roll Call</span> <ArrowRight size={14} />
            </div>
          </div>

          <div 
            onClick={() => navigate('/assessments')}
            className="group cursor-pointer bg-white p-6 rounded-3xl border border-slate-200 hover:border-indigo-500 hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">CBC Strand Progress</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter formative assessment scores, strand and sub-strand competencies for learners.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-indigo-600 group-hover:gap-3 transition-all">
              <span>Enter Marks</span> <ArrowRight size={14} />
            </div>
          </div>

          <div 
            onClick={() => navigate('/students')}
            className="group cursor-pointer bg-white p-6 rounded-3xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Class Nominal Roll</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Browse student profiles, assessment portfolios, and parent contacts in {fullClassTitle}.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-600 group-hover:gap-3 transition-all">
              <span>View Learners</span> <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Sync & Profile Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="p-6 border-b border-slate-100">
              <CardTitle className="text-lg font-black text-slate-900">Teacher Profile & Sync</CardTitle>
              <CardDescription className="text-xs">Active Session & Offline Store</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      {teacherName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{teacherName}</p>
                      <p className="text-xs text-slate-500">{teacherRole}</p>
                    </div>
                  </div>

                  {/* Locked Assigned Grade & Stream Badge */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Authorized Class Access</span>
                    <Badge className="bg-indigo-600 text-white font-mono text-xs px-3 py-1 rounded-xl">
                      {fullClassTitle}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center justify-between">
                  <span>No active teacher session found.</span>
                  <Button size="sm" variant="outline" onClick={() => navigate('/auth')} className="text-xs font-bold bg-white">Sign In</Button>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Local Offline Store</span>
                  <span className="text-blue-600 font-bold">{students.length} Learners · {attendanceRecords.length} Logs</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(100, Math.max(10, students.length * 5))}%` }} />
                </div>
                <p className="text-[10px] text-slate-400">Records are securely persisted in local storage for offline operations.</p>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* LAN Network Connection Widget */}
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-emerald-100">
                <Wifi size={14} className="text-emerald-300 animate-pulse" /> LAN Server Active
              </div>
              <span className="text-xs font-mono bg-black/20 px-2.5 py-1 rounded-lg text-emerald-200">Port 4173</span>
            </div>
            <h3 className="text-xl font-black tracking-tight">LAN Network Connection</h3>
            <p className="text-xs text-emerald-100 mt-1">
              Connect other devices on your Wi-Fi or router to access this portal.
            </p>
          </div>

          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Server URL</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-mono text-sm font-bold text-slate-800 flex items-center gap-2 overflow-x-auto">
                  <Monitor size={16} className="text-emerald-600 shrink-0" />
                  <span className="truncate">{lanUrl}</span>
                </div>
                <Button
                  onClick={handleCopyLanUrl}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-3 rounded-2xl shrink-0 flex items-center gap-1.5 transition-all shadow-sm"
                >
                  {copiedUrl ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <QrCode size={14} className="text-slate-600" /> Connection Instructions:
              </p>
              <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc font-medium">
                <li>Ensure your phone, tablet, or laptop is connected to the same local Wi-Fi or router.</li>
                <li>Open your mobile or workstation browser and enter <span className="font-mono font-bold text-emerald-700">{lanUrl}</span>.</li>
                <li>Bookmark the page on your device for quick daily access to the teacher portal.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;
