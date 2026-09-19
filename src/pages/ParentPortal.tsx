"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GraduationCap,
  Calendar,
  FileText,
  Receipt,
  LogOut,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Users,
  BookOpen,
  Loader2,
  X,
  Gamepad2,
  BookMarked
} from "lucide-react";
import BilingualMatch from "@/components/games/BilingualMatch";
import MemoryMatch from "@/components/games/MemoryMatch";
import PatternMemory from "@/components/games/PatternMemory";
import SpeedMath from "@/components/games/SpeedMath";
import SudokuMini from "@/components/games/SudokuMini";
import TargetMath from "@/components/games/TargetMath";
import WordScramble from "@/components/games/WordScramble";
import StudyCorner from './StudyCorner';
import { cn } from "@/lib/utils";
import { showSuccess, showError } from '@/utils/toast';
import { getStudents, getPaymentRecords, readStorage, STORAGE_KEYS } from '@/utils/storage';

const PARENT_PORTAL_SESSION_KEY = 'parent_portal_session';

interface PortalSession {
  studentId: string;
  studentName: string;
  admissionNo: string;
  grade: string;
  stream: string;
  loggedInAt: string;
}

interface Student {
  id: string;
  admNo?: string;
  name?: string;
  grade?: string;
  stream?: string;
  gender?: string;
  guardian?: string;
  phone?: string;
  status?: string;
  dob?: string;
}

interface PaymentRecord {
  id: string;
  studentId?: string;
  studentName?: string;
  amount?: number;
  paid?: number;
  total?: number;
  status?: string;
  date?: string;
  method?: string;
}

interface AssessmentScore {
  id: string;
  studentId?: string;
  studentName?: string;
  examType?: string;
  grade?: string;
  subject?: string;
  score?: number;
  term?: string;
  year?: string;
  date?: string;
}

// ── Storage helpers ───────────────────────────────────────────────────────────

const savePortalSession = (session: PortalSession) => {
  localStorage.setItem(PARENT_PORTAL_SESSION_KEY, JSON.stringify(session));
};

const getPortalSession = (): PortalSession | null => {
  try {
    const raw = localStorage.getItem(PARENT_PORTAL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const clearPortalSession = () => {
  localStorage.removeItem(PARENT_PORTAL_SESSION_KEY);
};

const getAttendanceForStudent = (studentId: string): { present: number; absent: number; total: number } => {
  let present = 0;
  let absent = 0;
  let total = 0;

  try {
    // Scan all attendance v2 keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('munyaka_attendance_v2_')) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const records = JSON.parse(raw) as Record<string, { morning?: { status: string }; afternoon?: { status: string } }>;
      
      if (records[studentId]) {
        const studentRecord = records[studentId];
        if (studentRecord.morning?.status === 'P') present++;
        if (studentRecord.morning?.status === 'A') absent++;
        if (studentRecord.afternoon?.status === 'P') present++;
        if (studentRecord.afternoon?.status === 'A') absent++;
        total += 2;
      }
    }
  } catch (e) {
    console.error('Error reading attendance:', e);
  }

  return { present, absent, total };
};

const getAssessmentScoresForStudent = (studentId: string): AssessmentScore[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSESSMENT_SCORES);
    if (!raw) return [];
    const scores = JSON.parse(raw) as AssessmentScore[];
    return scores.filter(s => s.studentId === studentId);
  } catch {
    return [];
  }
};

const getFeesForStudent = (studentId: string): PaymentRecord[] => {
  try {
    const records = getPaymentRecords();
    return records.filter(r => r.studentId === studentId);
  } catch {
    return [];
  }
};

// ── Login Form ───────────────────────────────────────────────────────────────

const LoginForm = ({ onLogin, onClose }: { onLogin: (session: PortalSession) => void; onClose: () => void }) => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  // Normalize identifier: remove spaces, dashes, and convert to uppercase
  const normalizeIdentifier = (id: string): string => {
    if (!id) return '';
    return id.trim().toUpperCase().replace(/[\s-]/g, '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your Assessment Number or Birth Certificate Number');
      return;
    }

    setIsSearching(true);

    // Simulate async verification
    setTimeout(() => {
      const students = getStudents();
      const rawInput = identifier.trim();
      const normalizedId = normalizeIdentifier(rawInput);

      console.log('[Portal Login] Searching for identifier:', { rawInput, normalizedId });
      console.log('[Portal Login] Available students pool:', students.map(s => ({
        id: s.id,
        name: s.name,
        admNo: s.admNo,
        admissionNo: (s as any).admissionNo,
        assessmentNumber: (s as any).assessmentNumber,
        assessment_no: (s as any).assessment_no,
        assessmentNo: (s as any).assessmentNo,
        assessment: (s as any).assessment,
        birthCertificateNumber: (s as any).birthCertificateNumber,
        birth_cert_no: (s as any).birth_cert_no,
        birthCertificateNo: (s as any).birthCertificateNo,
        birthCertNo: (s as any).birthCertNo
      })));

      const matchedStudent = students.find(s => {
        const studentAdm = normalizeIdentifier(s.admNo || '');
        const studentAdmissionNo = normalizeIdentifier((s as any).admissionNo || '');
        const studentAssessmentNumber = normalizeIdentifier((s as any).assessmentNumber || '');
        const studentAssessmentNo = normalizeIdentifier((s as any).assessmentNo || '');
        const studentAssessment_no = normalizeIdentifier((s as any).assessment_no || '');
        const studentAssessment = normalizeIdentifier((s as any).assessment || '');
        
        const studentBirthCertNumber = normalizeIdentifier((s as any).birthCertificateNumber || '');
        const studentBirthCertNo = normalizeIdentifier((s as any).birthCertificateNo || '');
        const studentBirth_cert_no = normalizeIdentifier((s as any).birth_cert_no || '');
        const studentBirthCert = normalizeIdentifier((s as any).birthCertNo || '');

        const idMatches =
          studentAdm === normalizedId ||
          studentAdmissionNo === normalizedId ||
          studentAssessmentNumber === normalizedId ||
          studentAssessmentNo === normalizedId ||
          studentAssessment_no === normalizedId ||
          studentAssessment === normalizedId ||
          studentBirthCertNumber === normalizedId ||
          studentBirthCertNo === normalizedId ||
          studentBirth_cert_no === normalizedId ||
          studentBirthCert === normalizedId;

        return idMatches;
      });

      if (matchedStudent) {
        const session: PortalSession = {
          studentId: matchedStudent.id,
          studentName: matchedStudent.name || 'Unknown',
          admissionNo: matchedStudent.admNo || (matchedStudent as any).admissionNo || '',
          grade: matchedStudent.grade || '',
          stream: matchedStudent.stream || '',
          loggedInAt: new Date().toISOString(),
        };
        savePortalSession(session);
        onLogin(session);
        showSuccess(`Welcome, ${matchedStudent.name}!`);
      } else {
        setError('No matching record found. Please verify your Assessment Number or Birth Certificate Number.');
        setIsSearching(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-3xl shadow-xl border-0 overflow-hidden relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          title="Back to Staff Login"
        >
          <X className="w-5 h-5 text-white opacity-80 hover:opacity-100" />
        </button>

        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 text-white text-center">
          {/* Back button for mobile-friendly navigation */}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            title="Back to Staff Login"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Parent & Student Portal</h1>
          <p className="text-indigo-100 mt-1 text-sm font-medium">Access your child's academic records</p>
        </div>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2">
                <AlertCircle size={18} className="text-rose-500 shrink-0" />
                <p className="text-rose-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-slate-700 font-bold text-sm">
                Assessment Number / Birth Certificate No.
              </Label>
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g., Assessment No. or Birth Cert No."
                className="h-12 rounded-xl border-slate-200 bg-slate-50 text-slate-700 font-medium placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-100"
                autoComplete="off"
              />
            </div>

            <Button
              type="submit"
              disabled={isSearching}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold shadow-lg shadow-indigo-200 transition-all"
            >
              {isSearching ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  Access Portal
                  <ChevronRight size={18} className="ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Need help? Contact the school office for your login credentials.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard = ({
  session,
  student,
  onLogout
}: {
  session: PortalSession;
  student: Student;
  onLogout: () => void;
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'reports' | 'fees' | 'games' | 'study'>('overview');

  const attendance = useMemo(() => getAttendanceForStudent(session.studentId), [session.studentId]);
  const assessments = useMemo(() => getAssessmentScoresForStudent(session.studentId), [session.studentId]);
  const fees = useMemo(() => getFeesForStudent(session.studentId), [session.studentId]);

  const feeBalance = useMemo(() => {
    const total = fees.reduce((sum, f) => sum + (f.total || 0), 0);
    const paid = fees.reduce((sum, f) => sum + (f.paid || 0), 0);
    return { total, paid, balance: total - paid };
  }, [fees]);

  const recentAssessments = useMemo(() => {
    return [...assessments]
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 10);
  }, [assessments]);

  const getRubric = (score: number) => {
    if (score >= 80) return { code: 'EE', label: 'Exceeding', color: 'emerald' };
    if (score >= 65) return { code: 'ME', label: 'Meets', color: 'blue' };
    if (score >= 50) return { code: 'AE', label: 'Approaching', color: 'amber' };
    return { code: 'BE', label: 'Below', color: 'rose' };
  };

  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: User },
    { id: 'attendance' as const, label: 'Attendance', icon: Calendar },
    { id: 'reports' as const, label: 'Reports', icon: FileText },
    { id: 'fees' as const, label: 'Fees', icon: Receipt },
    { id: 'games' as const, label: 'Games Hub', icon: Gamepad2 },
    { id: 'study' as const, label: 'Study Corner', icon: BookMarked },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-72 bg-gradient-to-b from-indigo-900 via-indigo-800 to-purple-900 text-white flex flex-col shrink-0 shadow-xl">
        {/* Profile Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
              <GraduationCap size={24} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-black text-white text-base tracking-tight truncate">{session.studentName}</h1>
              <p className="text-indigo-200 text-xs font-medium truncate">
                {session.grade}{session.stream ? ` • ${session.stream}` : ''}
              </p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 text-xs text-indigo-100 font-mono text-center truncate">
            ID: {session.admissionNo}
          </div>
        </div>

        {/* Sidebar Links */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left",
                activeTab === item.id
                  ? "bg-white text-indigo-900 shadow-lg scale-[1.02]"
                  : "text-indigo-100 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl justify-start font-bold"
          >
            <LogOut size={16} className="mr-2" />
            Logout
          </Button>
          <Button
            onClick={() => navigate('/login')}
            variant="ghost"
            className="w-full text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl justify-start text-xs font-medium"
          >
            <X size={16} className="mr-2" />
            Back to Staff Login
          </Button>
        </div>
      </aside>

      {/* Right-Side Main Content Area */}
      <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Attendance Summary Card */}
            <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <Calendar size={20} />
                  Attendance Summary
                </h3>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <div className="text-3xl font-black text-emerald-600">{attendance.present}</div>
                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-wide mt-1">Present</div>
                  </div>
                  <div className="bg-rose-50 rounded-xl p-3">
                    <div className="text-3xl font-black text-rose-600">{attendance.absent}</div>
                    <div className="text-xs font-bold text-rose-600 uppercase tracking-wide mt-1">Absent</div>
                  </div>
                  <div className="bg-slate-100 rounded-xl p-3">
                    <div className="text-3xl font-black text-slate-600">{attendance.total}</div>
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-1">Total</div>
                  </div>
                </div>
                {attendance.total > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                      <span>Attendance Rate</span>
                      <span>{Math.round((attendance.present / attendance.total) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all"
                        style={{ width: `${(attendance.present / attendance.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fee Balance Card */}
            <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 text-white">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <Receipt size={20} />
                  Fee Balance
                </h3>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-100 rounded-xl p-3">
                    <div className="text-2xl font-black text-slate-700">KSh {feeBalance.total.toLocaleString()}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Total</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <div className="text-2xl font-black text-emerald-600">KSh {feeBalance.paid.toLocaleString()}</div>
                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-wide mt-1">Paid</div>
                  </div>
                  <div className={cn(
                    "rounded-xl p-3",
                    feeBalance.balance > 0 ? "bg-rose-50" : "bg-emerald-50"
                  )}>
                    <div className={cn(
                      "text-2xl font-black",
                      feeBalance.balance > 0 ? "text-rose-600" : "text-emerald-600"
                    )}>
                      KSh {feeBalance.balance.toLocaleString()}
                    </div>
                    <div className={cn(
                      "text-xs font-bold uppercase tracking-wide mt-1",
                      feeBalance.balance > 0 ? "text-rose-600" : "text-emerald-600"
                    )}>
                      {feeBalance.balance > 0 ? 'Balance' : 'Cleared'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Results */}
            <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4 text-white">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <TrendingUp size={20} />
                  Recent Performance
                </h3>
              </div>
              <CardContent className="p-4">
                {recentAssessments.length > 0 ? (
                  <div className="space-y-3">
                    {recentAssessments.slice(0, 5).map((a) => {
                      const rubric = getRubric(a.score || 0);
                      return (
                        <div key={a.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                          <div>
                            <div className="font-bold text-slate-700">{a.subject || a.examType || 'Exam'}</div>
                            <div className="text-xs text-slate-500">
                              {a.term || 'Term'} {a.year || new Date().getFullYear()}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={cn(
                              "font-black",
                              rubric.color === 'emerald' && "bg-emerald-100 text-emerald-700",
                              rubric.color === 'blue' && "bg-blue-100 text-blue-700",
                              rubric.color === 'amber' && "bg-amber-100 text-amber-700",
                              rubric.color === 'rose' && "bg-rose-100 text-rose-700"
                            )}>
                              {a.score}%
                            </Badge>
                            <div className="text-[10px] text-slate-500 mt-1">{rubric.label}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No assessment records yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-3">
                  <Calendar size={36} className="text-indigo-600" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Attendance Record</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Academic Year {new Date().getFullYear()}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                  <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
                  <div className="text-3xl font-black text-emerald-600">{attendance.present}</div>
                  <div className="text-xs font-bold text-emerald-600 uppercase">Present Days</div>
                </div>
                <div className="bg-rose-50 rounded-2xl p-4 text-center">
                  <XCircle size={28} className="text-rose-500 mx-auto mb-2" />
                  <div className="text-3xl font-black text-rose-600">{attendance.absent}</div>
                  <div className="text-xs font-bold text-rose-600 uppercase">Absent Days</div>
                </div>
                <div className="bg-amber-50 rounded-2xl p-4 text-center">
                  <Clock size={28} className="text-amber-500 mx-auto mb-2" />
                  <div className="text-3xl font-black text-amber-600">
                    {Math.round((attendance.present / Math.max(attendance.total, 1)) * 100)}%
                  </div>
                  <div className="text-xs font-bold text-amber-600 uppercase">Attendance Rate</div>
                </div>
                <div className="bg-slate-100 rounded-2xl p-4 text-center">
                  <Users size={28} className="text-slate-500 mx-auto mb-2" />
                  <div className="text-3xl font-black text-slate-600">{attendance.total}</div>
                  <div className="text-xs font-bold text-slate-600 uppercase">Total Days</div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-sm text-slate-600 text-center">
                  Daily attendance records are updated by class teachers.
                  Contact the school office for detailed attendance reports.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-violet-100 rounded-full mb-3">
                  <FileText size={36} className="text-violet-600" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Report Cards & Assessments</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Competency-Based & Exam Results
                </p>
              </div>

              {recentAssessments.length > 0 ? (
                <div className="space-y-3">
                  {recentAssessments.map((a) => {
                    const rubric = getRubric(a.score || 0);
                    return (
                      <div key={a.id} className="bg-slate-50 rounded-2xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-black text-slate-800">{a.subject || a.examType || 'Exam'}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {a.term ? `Term ${a.term}` : ''} {a.year || new Date().getFullYear()}
                              {a.date ? ` • ${new Date(a.date).toLocaleDateString()}` : ''}
                            </div>
                          </div>
                          <Badge className={cn(
                            "font-black text-sm px-3",
                            rubric.color === 'emerald' && "bg-emerald-100 text-emerald-700",
                            rubric.color === 'blue' && "bg-blue-100 text-blue-700",
                            rubric.color === 'amber' && "bg-amber-100 text-amber-700",
                            rubric.color === 'rose' && "bg-rose-100 text-rose-700"
                          )}>
                            {a.score}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            rubric.color === 'emerald' && "bg-emerald-500",
                            rubric.color === 'blue' && "bg-blue-500",
                            rubric.color === 'amber' && "bg-amber-500",
                            rubric.color === 'rose' && "bg-rose-500"
                          )} />
                          <span className="text-sm font-medium text-slate-600">
                            {rubric.label} Expectations
                          </span>
                          <span className="text-xs text-slate-400 ml-auto">({rubric.code})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen size={48} className="mx-auto mb-4 text-slate-300" />
                  <h4 className="font-bold text-slate-600 mb-2">No Report Cards Available</h4>
                  <p className="text-sm text-slate-500">
                    Report cards will appear here once teachers have submitted assessments.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fees Tab */}
        {activeTab === 'fees' && (
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-3">
                  <Receipt size={36} className="text-amber-600" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Fee Summary</h3>
                <p className="text-slate-500 text-sm mt-1">
                  School Fees Payment History
                </p>
              </div>

              {/* Balance Overview */}
              <div className={cn(
                "rounded-2xl p-5 mb-6",
                feeBalance.balance > 0 ? "bg-rose-50" : "bg-emerald-50"
              )}>
                <div className="text-center">
                  <div className={cn(
                    "text-5xl font-black mb-2",
                    feeBalance.balance > 0 ? "text-rose-600" : "text-emerald-600"
                  )}>
                    KSh {feeBalance.balance.toLocaleString()}
                  </div>
                  <div className={cn(
                    "text-sm font-bold uppercase tracking-wide",
                    feeBalance.balance > 0 ? "text-rose-600" : "text-emerald-600"
                  )}>
                    {feeBalance.balance > 0 ? 'Outstanding Balance' : 'Fully Paid'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-white/50">
                  <div className="text-center">
                    <div className="text-2xl font-black text-slate-700">KSh {feeBalance.total.toLocaleString()}</div>
                    <div className="text-xs font-medium text-slate-500">Total Billed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-emerald-600">KSh {feeBalance.paid.toLocaleString()}</div>
                    <div className="text-xs font-medium text-slate-500">Total Paid</div>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              {fees.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Payment History</h4>
                  {fees.slice(0, 10).map((f) => (
                    <div key={f.id} className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-700">
                          KSh {f.paid?.toLocaleString() || 0}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {f.date ? new Date(f.date).toLocaleDateString() : 'N/A'}
                          {f.method && ` • ${f.method}`}
                        </div>
                      </div>
                      <Badge className={cn(
                        "font-bold",
                        (f.status || '').toLowerCase().includes('paid') || (f.status || '').toLowerCase().includes('complete')
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      )}>
                        {f.status || 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Receipt size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No fee records found for this learner.</p>
                </div>
              )}

              <div className="mt-6 bg-indigo-50 rounded-xl p-4">
                <p className="text-sm text-indigo-700 text-center">
                  For fee payments, please contact the school bursar or use the official payment channels provided by the school.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Games Hub Tab */}
        {activeTab === 'games' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Gamepad2 size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Learner Games Hub</h2>
                  <p className="text-indigo-100 text-sm">Interactive educational games & brain exercises</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-3xl border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold">1</div>
                    <h3 className="text-lg font-black text-slate-800">Speed Math</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">Test your arithmetic speed with rapid-fire math challenges.</p>
                  <SpeedMath onBack={() => {}} />
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-bold">2</div>
                    <h3 className="text-lg font-black text-slate-800">Target Math</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">Reach the target number using addition, subtraction, multiplication, and division.</p>
                  <TargetMath onBack={() => {}} />
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-bold">3</div>
                    <h3 className="text-lg font-black text-slate-800">Memory Match</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">Flip cards and match pairs to test your memory skills.</p>
                  <MemoryMatch onBack={() => {}} />
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 font-bold">4</div>
                    <h3 className="text-lg font-black text-slate-800">Word Scramble</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">Unscramble letters to find the correct vocabulary words.</p>
                  <WordScramble onBack={() => {}} />
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 font-bold">5</div>
                    <h3 className="text-lg font-black text-slate-800">Pattern Memory</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">Remember and repeat the flashing pattern sequence.</p>
                  <PatternMemory onBack={() => {}} />
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 font-bold">6</div>
                    <h3 className="text-lg font-black text-slate-800">Bilingual Match</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">Match words across languages to expand your vocabulary.</p>
                  <BilingualMatch onBack={() => {}} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Study Corner Tab */}
        {activeTab === 'study' && (
          <div className="space-y-6">
            <StudyCorner />
          </div>
        )}
      </div>
    </main>
  </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────

export default function ParentPortal() {
  const navigate = useNavigate();
  const [session, setSession] = useState<PortalSession | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const existingSession = getPortalSession();
    if (existingSession) {
      // Verify student still exists
      const students = getStudents();
      const foundStudent = students.find(s => s.id === existingSession.studentId);
      if (foundStudent) {
        setSession(existingSession);
        setStudent(foundStudent);
      } else {
        clearPortalSession();
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = useCallback((newSession: PortalSession) => {
    const students = getStudents();
    const foundStudent = students.find(s => s.id === newSession.studentId);
    setSession(newSession);
    setStudent(foundStudent || null);
  }, []);

  const handleLogout = useCallback(() => {
    clearPortalSession();
    setSession(null);
    setStudent(null);
    showSuccess('You have been logged out successfully.');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session || !student) {
    return <LoginForm onLogin={handleLogin} onClose={() => navigate('/login')} />;
  }

  return <Dashboard session={session} student={student} onLogout={handleLogout} />;
}
