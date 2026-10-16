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
import { getFormattedRoleLabel } from '@/utils/staffRoleUtils';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const centralData = useCentralData();
  const students = (centralData as any)?.students || [];
  const marks = (centralData as any)?.marks || [];
  const attendance = (centralData as any)?.attendance || [];
  const notices = (centralData as any)?.notices || [];
  const settings = (centralData as any)?.settings || {};

  const teacherName = user?.name || (user as any)?.username || 'Teacher';
  const teacherRole = user?.role || 'subject_teacher';
  const assignedClass = (user as any)?.assignedClass || (user as any)?.gradeStream || 'Grade 4 Blue';
  const assignedGrade = (user as any)?.assignedGrade || 'Grade 4';
  const assignedStream = user?.assignedStream || 'Blue';
  const fullClassTitle = `${assignedGrade} ${assignedStream}`;

  // Filter students matching the teacher's assigned class/stream
  const classStudents = (students || []).filter(s => {
    const sGrade = String(s?.grade || s?.gradeLevel || '').toLowerCase();
    const sStream = String(s?.stream || '').toLowerCase();
    return sGrade.includes(assignedGrade.toLowerCase()) && sStream.includes(assignedStream.toLowerCase());
  });

  const totalLearners = classStudents.length > 0 ? classStudents.length : 42;
  const attendanceToday = (attendance || []).filter(a => a?.date === new Date().toISOString().split('T')[0] && a?.status === 'Present').length;
  const attendanceRate = totalLearners > 0 ? Math.min(100, Math.round((attendanceToday / totalLearners) * 100)) : 96;

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white hover:bg-white/30 border-none font-bold uppercase tracking-wider text-[10px]">
              Educator Portal
            </Badge>
            <span className="text-xs text-blue-200 font-medium">• Active Session</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Welcome back, {teacherName}!
          </h1>
          <p className="text-blue-100 text-sm md:text-base max-w-xl font-medium">
            You are signed in as <span className="underline decoration-blue-400 font-bold">{teacherName}</span> ({getFormattedRoleLabel(user || { role: teacherRole })}). Your dashboard is strictly restricted to <span className="font-bold">{fullClassTitle}</span>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Button
            onClick={() => navigate('/attendance')}
            className="bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-sm"
          >
            <ClipboardCheck className="w-4 h-4 mr-2 text-indigo-600" />
            Mark Attendance
          </Button>
          <Button
            onClick={() => navigate('/assessments')}
            className="bg-indigo-600 text-white hover:bg-indigo-500 font-bold rounded-xl border border-indigo-400 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-white" />
            Enter Exam Marks
          </Button>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-none shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Class</p>
            <h3 className="text-2xl font-black text-slate-900">{fullClassTitle}</h3>
            <p className="text-xs text-emerald-600 font-bold">Active CBC Stream</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Users size={22} />
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Enrollment</p>
            <h3 className="text-2xl font-black text-slate-900">{totalLearners} Learners</h3>
            <p className="text-xs text-blue-600 font-bold">Registered Learners</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <BookOpen size={22} />
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Today</p>
            <h3 className="text-2xl font-black text-slate-900">{attendanceRate}%</h3>
            <p className="text-xs text-emerald-600 font-bold">{attendanceToday} present today</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ClipboardCheck size={22} />
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Term</p>
            <h3 className="text-2xl font-black text-slate-900">{settings?.term || settings?.academic?.activeTerm || 'Term 1'}</h3>
            <p className="text-xs text-indigo-600 font-bold">{settings?.academicYear || settings?.year || '2026'} Academic Year</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600">
            <Calendar size={22} />
          </div>
        </Card>
      </div>

      {/* Main Action Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
            <CardHeader className="px-0 pt-0 pb-4 border-b">
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="text-indigo-600" size={20} />
                Class Management & Assessment Hub
              </CardTitle>
              <CardDescription>
                Quick access tools for grading learners, managing attendance, and recording competencies.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => navigate('/attendance')}
                className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-200 transition-all cursor-pointer group flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <ClipboardCheck size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-700">Student Attendance</h4>
                  <p className="text-xs text-slate-500">Record daily register, check attendance statistics, and notify parents.</p>
                </div>
              </div>

              <div
                onClick={() => navigate('/assessments')}
                className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all cursor-pointer group flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 group-hover:text-indigo-700">Enter Exam Marks</h4>
                  <p className="text-xs text-slate-500">Input formative and summative scores, test grades, and compute report summaries.</p>
                </div>
              </div>

              <div
                onClick={() => navigate('/students')}
                className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all cursor-pointer group flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Users size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 group-hover:text-emerald-700">Learner Profiles</h4>
                  <p className="text-xs text-slate-500">Review student records, parent contacts, assessment histories, and fee statuses.</p>
                </div>
              </div>

              <div
                onClick={() => navigate('/reports')}
                className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-amber-50/50 hover:border-amber-200 transition-all cursor-pointer group flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <BookOpen size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 group-hover:text-amber-700">Report Cards</h4>
                  <p className="text-xs text-slate-500">Generate, review, and print official CBC report cards for all class learners.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Export & Records Module */}
          <TeacherExportModule />
        </div>

        {/* Sidebar Announcements & Quick Notice */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
            <CardHeader className="px-0 pt-0 pb-4 border-b">
              <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                <Megaphone className="text-indigo-600" size={18} />
                School Notices & Events
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pt-4 space-y-3">
              {notices && notices.length > 0 ? (
                notices.slice(0, 3).map((notice: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600">{notice.category || 'Announcement'}</span>
                      <span className="text-[10px] text-slate-400">{notice.date || 'Today'}</span>
                    </div>
                    <h5 className="font-bold text-xs text-slate-900">{notice.title || notice.subject}</h5>
                    <p className="text-xs text-slate-600 line-clamp-2">{notice.content || notice.message}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                  No active notices or announcements at this time.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-indigo-900 text-white p-6">
            <div className="space-y-3">
              <Badge className="bg-indigo-700 text-indigo-100 border-none text-[10px] font-bold">
                CBC Compliance
              </Badge>
              <h3 className="font-black text-lg">Strand Assessment Guidelines</h3>
              <p className="text-xs text-indigo-200 leading-relaxed">
                Remember to input formative scores across all 5 strands before end-of-term lock. Contact the Academic Registrar or DHOI if you encounter any discrepancies.
              </p>
              <Button
                onClick={() => navigate('/digital-hub')}
                variant="outline"
                className="w-full bg-white/10 text-white hover:bg-white/20 border-white/20 font-bold text-xs rounded-xl"
              >
                Access Digital Hub
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
