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
  const { totalStudents, totalTeachers } = useCentralData();
  const isOnline = true;

  const teacherName = user?.name || 'Teacher';
  const teacherRole = user?.role || 'Class Teacher';
  const assignedClass = (user as any)?.assignedClass || (user as any)?.grade || 'Grade 4';
  const assignedStream = (user as any)?.assignedStream || (user as any)?.stream || 'Green';
  const fullClassTitle = `${assignedClass} ${assignedStream}`;

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

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Learners</p>
              <h3 className="text-3xl font-black text-slate-900">{totalStudents > 0 ? totalStudents : '42'}</h3>
              <p className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1">
                <CheckCircle2 size={12} /> Active in {fullClassTitle}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
              <Users size={28} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Attendance</p>
              <h3 className="text-3xl font-black text-slate-900">39 / 42</h3>
              <p className="text-xs font-medium text-blue-600 flex items-center gap-1 mt-1">
                <Clock size={12} /> Roll call marked
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
              <ClipboardCheck size={28} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Assessments</p>
              <h3 className="text-3xl font-black text-slate-900">3</h3>
              <p className="text-xs font-medium text-amber-600 flex items-center gap-1 mt-1">
                <AlertCircle size={12} /> CBC strands awaiting scoring
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
              <Award size={28} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">System Sync Status</p>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 mt-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                {isOnline ? 'Online Sync' : 'Local Wi-Fi'}
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Central database connected
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
              <Wifi size={28} />
            </div>
          </CardContent>
        </Card>
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
