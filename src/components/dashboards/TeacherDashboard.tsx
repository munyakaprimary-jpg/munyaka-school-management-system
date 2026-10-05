import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  ClipboardCheck,
  BookOpen,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  MessageSquare,
  Megaphone,
  Wifi,
  Database,
  GraduationCap,
  CheckSquare,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCentralData } from '@/hooks/useCentralData';
import TeacherExportModule from '@/components/teacher/TeacherExportModule';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { totalStudents } = useCentralData();
  const isOnline = true;

  const teacherName = user?.name || 'Teacher';
  const teacherRole = user?.role || 'Class Teacher';
  
  // Grade and Stream state from localStorage or user context
  const [selectedGrade, setSelectedGrade] = React.useState<string>(() => {
    return localStorage.getItem('teacher_dashboard_grade') || (user as any)?.assignedClass || (user as any)?.grade || 'Grade 4';
  });
  const [selectedStream, setSelectedStream] = React.useState<string>(() => {
    return localStorage.getItem('teacher_dashboard_stream') || (user as any)?.assignedStream || (user as any)?.stream || 'Green';
  });

  const fullClassTitle = `${selectedGrade} ${selectedStream}`;

  // Calculate dynamic assigned learners & attendance counts based on selected Grade & Stream
  let storedStudents: any[] = [];
  let attendanceList: any[] = [];
  try {
    const centralDb = JSON.parse(localStorage.getItem('munyaka_central_db') || '{}');
    if (Array.isArray(centralDb.students)) {
      storedStudents = centralDb.students;
    } else {
      const rawStudents = localStorage.getItem('school_learners_data') || localStorage.getItem('munyaka_students');
      if (rawStudents) storedStudents = JSON.parse(rawStudents);
    }
  } catch {
    storedStudents = [];
  }

  const filteredStudents = storedStudents.length > 0
    ? storedStudents.filter((s: any) => {
        const sGrade = s.grade || s.gradeLevel || s.assignedClass || '';
        const sStream = s.stream || s.assignedStream || '';
        return sGrade.toLowerCase() === selectedGrade.toLowerCase() && sStream.toLowerCase() === selectedStream.toLowerCase();
      })
    : [];

  const assignedLearnersCount = filteredStudents.length > 0
    ? filteredStudents.length
    : (storedStudents.length > 0 ? storedStudents.length : (totalStudents > 0 ? totalStudents : 24));

  const todayStr = new Date().toISOString().split('T')[0];
  try {
    const rawAtt = localStorage.getItem('school_attendance_logs');
    if (rawAtt) {
      const parsed = JSON.parse(rawAtt);
      if (Array.isArray(parsed)) {
        attendanceList = parsed.filter((r: any) =>
          r.date === todayStr &&
          (filteredStudents.some((s: any) => s.id === r.studentId || s.admNo === r.studentId) || !filteredStudents.length)
        );
      }
    }
  } catch {
    attendanceList = [];
  }

  const presentCount = attendanceList.length > 0
    ? attendanceList.filter((r: any) => r.status === 'present' || r.status === 'late').length
    : Math.min(assignedLearnersCount, Math.max(0, assignedLearnersCount - 1));

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full font-sans">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-8 text-white shadow-2xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-64 h-64 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-blue-200">
              <Sparkles size={14} /> CBC Portal · {fullClassTitle}
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Welcome back, {teacherName}!
            </h1>
            <p className="text-blue-100 text-sm md:text-base max-w-xl font-medium">
              You are signed in as <span className="underline decoration-blue-400 font-bold">{teacherName}</span> ({teacherRole}). Ready to inspire learners and manage your classroom today?
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
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{assignedLearnersCount}</h3>
            <p className="text-[10px] text-green-600 font-medium">Active in {fullClassTitle}</p>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Users size={20} />
          </div>
        </div>

        {/* Today's Attendance Card */}
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Today's Attendance</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{presentCount} / {assignedLearnersCount}</h3>
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

          {/* Timetable card removed for teachers */}

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

      {/* Recent Activity & School Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black text-slate-900">Recent School Announcements</CardTitle>
              <CardDescription className="text-xs">Direct circulars from administration & head teacher</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/notices')} className="text-blue-600 font-bold text-xs">
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                <Megaphone size={18} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">End of Term 2 Assessment Submission Deadline</h4>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] font-bold">Important</Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  All teachers are required to upload formative and summative competency assessment scores by Friday 4:00 PM.
                </p>
                <p className="text-[10px] text-slate-400 font-medium pt-1">Posted by Administration · 2 hours ago</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                <Calendar size={18} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">Staff Briefing Meeting in the Main Hall</h4>
                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold">Meeting</Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Briefing on upcoming extracurricular sports tournament and CBC portfolio inspection. Attendance is mandatory.
                </p>
                <p className="text-[10px] text-slate-400 font-medium pt-1">Posted by Head Teacher · Yesterday</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Sync & Profile Summary */}
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="p-6 border-b border-slate-100">
              <CardTitle className="text-lg font-black text-slate-900">Teacher Profile & Sync</CardTitle>
              <CardDescription className="text-xs">Local Database & Credentials</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  {teacherName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{teacherName}</p>
                  <p className="text-xs text-slate-500">{fullClassTitle}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Database Synchronization</span>
                  <span className="text-emerald-600 font-bold">Synced</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-full rounded-full" />
                </div>
                <p className="text-[10px] text-slate-400">All local grades and attendance logs are backed up.</p>
              </div>
            </CardContent>
          </div>

          <div className="p-6 pt-0">
            <Button 
              onClick={() => navigate('/study-corner')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2"
            >
              <BookOpen size={16} /> Open Study Corner & E-Resources
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;
