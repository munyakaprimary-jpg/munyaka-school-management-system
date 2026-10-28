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
  Laptop,
  Library,
  Wallet,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
  Layers,
  Box
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCentralData } from '@/hooks/useCentralData';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth() as any;
  const centralData = useCentralData();
  const students = (centralData as any)?.students || [];
  const attendance = (centralData as any)?.attendance || [];
  const notices = (centralData as any)?.notices || [];

  const currentUser = (() => {
    try {
      const saved = localStorage.getItem('munyaka_current_user') || localStorage.getItem('munyaka_session');
      if (saved) return JSON.parse(saved);
    } catch {}
    return user || {};
  })();

  const teacherName = currentUser?.name || currentUser?.username || 'Teacher';
  const roleKey = String(currentUser?.role || 'subject_teacher').toLowerCase();
  const staffTitle = String(currentUser?.title || currentUser?.category || currentUser?.designation || '');
  const assignedClass = String(currentUser?.assignedClass || currentUser?.grade || currentUser?.gradeStream || 'Grade 4 Blue');
  const assignedGrade = String(currentUser?.assignedGrade || 'Grade 4');
  const assignedStream = String(currentUser?.assignedStream || 'Blue');

  const titleLower = staffTitle.toLowerCase();
  const isIct = titleLower.includes('ict') || titleLower.includes('computer') || roleKey.includes('ict');
  const isLibrary = titleLower.includes('library') || titleLower.includes('librarian');
  const isBursar = titleLower.includes('bursar') || titleLower.includes('accountant') || roleKey.includes('accountant');
  const isLab = titleLower.includes('lab');
  const isTools = titleLower.includes('tools') || titleLower.includes('inventory');

  // Filter students matching assigned class
  const classStudents = (students || []).filter(s => {
    const sGrade = String(s?.grade || s?.gradeLevel || '').toLowerCase();
    const sStream = String(s?.stream || '').toLowerCase();
    return sGrade.includes(assignedGrade.toLowerCase()) || sStream.includes(assignedStream.toLowerCase());
  });

  const totalLearners = classStudents.length > 0 ? classStudents.length : 38;
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayAttendanceCount = (attendance || []).filter(a => a?.date === todayDateStr && a?.status === 'Present').length;
  const attendanceRate = totalLearners > 0 ? Math.min(100, Math.round((todayAttendanceCount / totalLearners) * 100)) : 95;

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6 animate-in fade-in">
      {/* 1. Dynamic Greeting & Specialized Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="space-y-3 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white/20 text-white font-bold uppercase text-[10px] tracking-wider px-3 py-1">
              {staffTitle || roleKey.replace('_', ' ').toUpperCase()}
            </Badge>
            <span className="text-xs text-blue-200 font-semibold">• Active Workstation</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">
            Welcome back, {teacherName.toUpperCase()}!
          </h1>
          <p className="text-blue-100 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
            You are signed in as <span className="underline decoration-blue-400 font-bold">{teacherName}</span> ({staffTitle || roleKey}). {assignedClass ? `Assigned Classroom: ${assignedClass}.` : ''} Access your quick actions and departmental tools below.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Button
            onClick={() => navigate('/staff-checkin')}
            className="bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-md px-4 py-3 h-auto"
          >
            <ClipboardCheck className="w-4 h-4 mr-2 text-indigo-600" />
            Staff Attendance (Check-In)
          </Button>
          <Button
            onClick={() => navigate('/communication')}
            className="bg-indigo-600 text-white hover:bg-indigo-500 font-bold rounded-xl border border-indigo-400/50 shadow-md px-4 py-3 h-auto"
          >
            <Megaphone className="w-4 h-4 mr-2 text-white" />
            School Notices
          </Button>
        </div>
      </div>

      {/* 2. Action Bar Shortcuts */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Quick Departmental Action Shortcuts</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={() => navigate('/assessments')}
            className="h-auto py-4 px-5 bg-white hover:bg-indigo-50 border border-slate-200 rounded-2xl flex flex-col items-start gap-2 shadow-sm group transition-all text-slate-800"
            variant="outline"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-indigo-600 transition-colors">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <p className="font-bold text-sm text-left">Record Marks</p>
              <p className="text-[11px] text-slate-500 text-left">CBC exam & assessment entry</p>
            </div>
          </Button>

          <Button
            onClick={() => navigate('/attendance')}
            className="h-auto py-4 px-5 bg-white hover:bg-emerald-50 border border-slate-200 rounded-2xl flex flex-col items-start gap-2 shadow-sm group transition-all text-slate-800"
            variant="outline"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center text-emerald-600 transition-colors">
              <Users size={20} />
            </div>
            <div>
              <p className="font-bold text-sm text-left">Class Attendance</p>
              <p className="text-[11px] text-slate-500 text-left">Daily learner roll call</p>
            </div>
          </Button>

          {isIct || isLab ? (
            <Button
              onClick={() => navigate('/inventory')}
              className="h-auto py-4 px-5 bg-white hover:bg-cyan-50 border border-slate-200 rounded-2xl flex flex-col items-start gap-2 shadow-sm group transition-all text-slate-800"
              variant="outline"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-50 group-hover:bg-cyan-600 group-hover:text-white flex items-center justify-center text-cyan-600 transition-colors">
                <Laptop size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-left">Hardware Inventory</p>
                <p className="text-[11px] text-slate-500 text-left">ICT lab & device management</p>
              </div>
            </Button>
          ) : isLibrary ? (
            <Button
              onClick={() => navigate('/library')}
              className="h-auto py-4 px-5 bg-white hover:bg-amber-50 border border-slate-200 rounded-2xl flex flex-col items-start gap-2 shadow-sm group transition-all text-slate-800"
              variant="outline"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center text-amber-600 transition-colors">
                <Library size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-left">Library Catalog</p>
                <p className="text-[11px] text-slate-500 text-left">Issue book & e-resources</p>
              </div>
            </Button>
          ) : isBursar ? (
            <Button
              onClick={() => navigate('/fees')}
              className="h-auto py-4 px-5 bg-white hover:bg-emerald-50 border border-slate-200 rounded-2xl flex flex-col items-start gap-2 shadow-sm group transition-all text-slate-800"
              variant="outline"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center text-emerald-600 transition-colors">
                <Wallet size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-left">Fees Overview</p>
                <p className="text-[11px] text-slate-500 text-left">Payment ledgers & receipts</p>
              </div>
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/timetable')}
              className="h-auto py-4 px-5 bg-white hover:bg-blue-50 border border-slate-200 rounded-2xl flex flex-col items-start gap-2 shadow-sm group transition-all text-slate-800"
              variant="outline"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-blue-600 transition-colors">
                <Calendar size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-left">Timetable</p>
                <p className="text-[11px] text-slate-500 text-left">Class schedule & periods</p>
              </div>
            </Button>
          )}

          <Button
            onClick={() => navigate('/digital-hub')}
            className="h-auto py-4 px-5 bg-white hover:bg-purple-50 border border-slate-200 rounded-2xl flex flex-col items-start gap-2 shadow-sm group transition-all text-slate-800"
            variant="outline"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center text-purple-600 transition-colors">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="font-bold text-sm text-left">Digital Hub</p>
              <p className="text-[11px] text-slate-500 text-left">CBC curriculum materials</p>
            </div>
          </Button>
        </div>
      </div>

      {/* 3. Dashboard Layout Grid (Below Banner) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Cols: Metrics & Schedule */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quick Metrics Cards (4 Stat Widgets) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Classes</p>
                  <h3 className="text-xl font-black text-slate-900 mt-1">{assignedClass}</h3>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Stream Enrolled</p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Layers size={22} />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Check-In Status</p>
                  <h3 className="text-xl font-black text-slate-900 mt-1">Geofence Verified</h3>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ Campus Radius Active</p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={22} />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Assessments</p>
                  <h3 className="text-xl font-black text-slate-900 mt-1">2 Pending</h3>
                  <p className="text-[10px] text-amber-600 font-semibold mt-0.5">CBC Formative Rubric</p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={22} />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Department Assets</p>
                  <h3 className="text-xl font-black text-slate-900 mt-1">{isIct ? '24 Devices' : isLibrary ? '142 Books' : 'Active'}</h3>
                  <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Fully Stocked</p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Box size={22} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Schedule / Timetable Preview */}
          <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 px-6 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock size={18} className="text-indigo-600" />
                  Today's Period Schedule & Allocations
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">Active class periods for {assignedClass}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/timetable')} className="text-xs font-semibold rounded-xl">
                Full Timetable
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg">Period 1 (08:00 - 08:45)</span>
                    <span className="text-xs font-bold text-emerald-600">Active</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Mathematics (Numeracy)</h4>
                  <p className="text-xs text-slate-500">{assignedClass} • Main Classroom</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg">Period 2 (08:45 - 09:30)</span>
                    <span className="text-xs font-bold text-slate-500">Upcoming</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">English Language Activities</h4>
                  <p className="text-xs text-slate-500">{assignedClass} • Main Classroom</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg">Period 3 (10:00 - 10:45)</span>
                    <span className="text-xs font-bold text-slate-500">Upcoming</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{isIct ? 'Computer Practical Lab' : isLibrary ? 'Library Reading Session' : 'Environmental Activities'}</h4>
                  <p className="text-xs text-slate-500">{assignedClass} • {isIct ? 'ICT Computer Lab' : isLibrary ? 'School Library' : 'Science Wing'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Recent Announcements & Notices */}
        <div className="space-y-6">
          <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 px-6 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Megaphone size={16} className="text-indigo-600" />
                School Notices
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/communication')} className="text-xs text-indigo-600 font-semibold h-auto p-0">
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1.5">
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Staff Briefing</span>
                <h5 className="font-bold text-xs text-slate-900">End of Term 2 CBC Assessments</h5>
                <p className="text-[11px] text-slate-600 leading-relaxed">All teachers are required to finalize entering learner formative scores before Friday.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 space-y-1.5">
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Geofence Attendance</span>
                <span className="text-[10px] text-slate-400 block">Today, 07:30 AM</span>
                <h5 className="font-bold text-xs text-slate-900">Mandatory Daily Check-In</h5>
                <p className="text-[11px] text-slate-600 leading-relaxed">Please ensure morning check-in is logged via GPS within 150m campus radius.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
