"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BackButton from '@/components/ui/BackButton';
import {
  UserCircle,
  Mail,
  Phone,
  Calendar,
  FileText,
  CreditCard,
  ArrowLeft,
  History,
  UserX,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertCircle,
  Award,
  Receipt,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import AcademicHistoryModal from '@/components/academic-history/AcademicHistoryModal';
import TransferWorkflow from '@/components/transfer/TransferWorkflow';
import UnifiedRecordPaymentModal from '@/components/fees/UnifiedRecordPaymentModal';
import { showSuccess } from '@/utils/toast';
import { marks as mockMarks } from '@/data/mockMarks';
import { attendance as mockAttendance } from '@/data/mockAttendance';
import { transactions as mockTransactions } from '@/data/mockTransactions';
import { cn } from '@/lib/utils';
import { StudentTransferInfo } from '@/types/transfer';

const LEARNERS_STORAGE_KEY = 'school_learners_data';

interface ProfileLearner {
  id: string;
  admNo: string;
  name: string;
  grade: string;
  stream: string;
  gender: 'Male' | 'Female' | 'Other';
  guardian: string;
  phone: string;
  email?: string;
  dob?: string;
  birthCertificateNo?: string;
  dateOfAdmission?: string;
  feeBalance?: number;
  coCurricularActivities?: string;
  status?: 'Active' | 'Transferred' | 'Graduated' | 'Suspended';
}

const StudentProfile = () => {
  const { id } = useParams<{ id: string }>();

  // ── FIX 1: Look up the ACTIVE learner from localStorage using the URL param.
  // The previous version always fell back to `INITIAL_SEED_DATA.students[0]`
  // (MUTWIKA KILONZO) when no real ID was provided. Now we resolve the learner
  // from the school_learners_data localStorage key, and only fall back to
  // the seed if the localStorage lookup truly returns nothing (e.g. on
  // first run before any learners have been registered). The first seed
  // student is the most natural default in that case.
  const [activeLearner, setActiveLearner] = useState<ProfileLearner | null>(null);

  useEffect(() => {
    if (!id) {
      setActiveLearner(null);
      return;
    }

    try {
      const saved = localStorage.getItem(LEARNERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Try to find the learner by id, then by admNo (in case the URL
          // uses the human-readable identifier instead of the internal row id)
          const match = parsed.find((l: any) => l.id === id || l.admNo === id);
          if (match) {
            setActiveLearner(match as ProfileLearner);
            return;
          }
        }
      }
    } catch (e) {
      console.error('Failed to resolve learner from localStorage', e);
    }

    setActiveLearner(null);
  }, [id]);

  // If the URL doesn't resolve to any learner, show a friendly empty state
  // rather than silently rendering a different student's profile.
  const [showNotFound, setShowNotFound] = useState(false);
  useEffect(() => {
    if (!id) return;
    const t = setTimeout(() => {
      if (!activeLearner) setShowNotFound(true);
    }, 250);
    return () => clearTimeout(t);
  }, [id, activeLearner]);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // The profile page no longer needs a hardcoded "transferStudentData"
  // object that defaulted to MUTWIKA KILONZO. Instead, we build a real
  // StudentTransferInfo object from the ACTIVE learner the moment the
  // user opens the transfer modal. If there is no active learner yet we
  // pass `null` and the modal stays closed.
  const [transferStudent, setTransferStudent] = useState<StudentTransferInfo | null>(null);

  const handleRecordPayment = (result: { transaction: any }) => {
    if (!activeLearner) return;
    showSuccess(
      `Recorded payment of KES ${result.transaction.amount.toLocaleString()} for ${activeLearner.name}`
    );
  };

  const handleOpenTransfer = () => {
    if (!activeLearner) return;

    // Build a fully-populated StudentTransferInfo from the active learner.
    // No fallback to any seed student — every field is sourced from the
    // row the user actually clicked on in the directory.
    const transferPayload: StudentTransferInfo = {
      id: activeLearner.id,
      admNo: activeLearner.admNo,
      name: activeLearner.name,
      grade: activeLearner.grade,
      stream: activeLearner.stream,
      gender: activeLearner.gender,
      guardian: activeLearner.guardian,
      phone: activeLearner.phone,
      email: activeLearner.email ?? '',
      dob: activeLearner.dob ?? '',
      feeBalance: activeLearner.feeBalance ?? 0,
      status: activeLearner.status ?? 'Active',
      dateOfAdmission: activeLearner.dateOfAdmission ?? new Date().toISOString().split('T')[0],
      coCurricularActivities: activeLearner.coCurricularActivities ?? '',
    };
    setTransferStudent(transferPayload);
    setIsTransferOpen(true);
  };

  const handleCloseTransfer = () => {
    setIsTransferOpen(false);
    setTransferStudent(null);
  };

  // ==================== Subject performance chart ====================
  interface SubjectPerformanceRow {
    subject: string;
    studentScore: number;
    classAverage: number;
    diff: number;
  }

  const computeSubjectPerformance = (): SubjectPerformanceRow[] => {
    if (!activeLearner) return [];
    const studentRecord = mockMarks.studentRecords[activeLearner.id];
    if (!studentRecord) return [];

    const studentMarks = studentRecord.terms?.[studentRecord.currentTerm] ?? {};
    const studentScores = studentRecord.terms?.[studentRecord.currentTerm]?.scores ?? {};

    return Object.keys(studentScores).map((subject) => {
      const studentScore = studentScores[subject] ?? 0;
      const classAverage = mockMarks.classAverages?.[subject]?.[studentRecord.currentTerm] ?? 0;
      return {
        subject,
        studentScore,
        classAverage,
        diff: studentScore - classAverage,
      };
    });
  };

  const performanceRows = useMemo(() => computeSubjectPerformance(), [activeLearner]);

  const getDeltaMeta = (diff: number) => {
    if (diff >= 5) return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: TrendingUp, label: `+${diff.toFixed(1)} above` };
    if (diff <= -5) return { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: TrendingDown, label: `${diff.toFixed(1)} below` };
    return { color: 'bg-slate-50 text-slate-600 border-slate-200', icon: Minus, label: 'On par' };
  };

  const getBarWidth = (score: number) => `${Math.min(100, Math.max(0, score))}%`;

  // ── Early-return guards: render the right "missing learner" copy if the
  // URL doesn't resolve. This prevents the previous behavior of silently
  // swapping in a hardcoded student.
  if (!id) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3">
          <BackButton to="/students" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Learner Profile</h1>
            <p className="text-sm font-medium text-slate-500">No learner was selected.</p>
          </div>
        </div>
        <Card className="border-none shadow-sm rounded-[2rem] bg-white p-12 text-center">
          <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
            <div className="p-4 bg-amber-50 rounded-full">
              <AlertCircle className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Learner Selected</h3>
            <p className="text-sm text-slate-500">
              Please choose a learner from the directory to view their profile.
            </p>
            <Button asChild className="mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              <a href="/students">Back to Learners</a>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // While we're loading (or if the URL has no match), show a skeleton
  // placeholder so the user doesn't see a flash of the old hardcoded data.
  if (!activeLearner && !showNotFound) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <BackButton to="/students" />
          <div className="flex-1 min-w-0">
            <div className="h-7 w-48 bg-slate-100 rounded mb-2 animate-pulse" />
            <div className="h-3 w-64 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 animate-pulse">
              <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
              <div className="h-7 w-20 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-32 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!activeLearner && showNotFound) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3">
          <BackButton to="/students" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Learner Not Found</h1>
            <p className="text-sm font-medium text-slate-500">
              The requested learner is no longer in the active directory.
            </p>
          </div>
        </div>
        <Card className="border-none shadow-sm rounded-[2rem] bg-white p-12 text-center">
          <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
            <div className="p-4 bg-amber-50 rounded-full">
              <AlertCircle className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Learner Not Found</h3>
            <p className="text-sm text-slate-500">
              We couldn't find a learner with the ID <code className="font-mono text-slate-700">{id}</code>.
              They may have been removed from the directory.
            </p>
            <Button asChild className="mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              <a href="/students">Back to Learners</a>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── Active learner is now guaranteed to be non-null below this line.
  const student = activeLearner!;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row w-full items-start md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full min-w-0">
          <BackButton to="/students" />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-slate-900 truncate break-words whitespace-nowrap">{student.name}</h1>
            <p className="text-sm font-medium text-slate-600 truncate break-words whitespace-nowrap">
              Detailed learner profile and history
            </p>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto shrink-0">
          <Button
            variant="outline"
            className="rounded-xl gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={() => setIsHistoryModalOpen(true)}
          >
            <History size={18} /> View History
          </Button>
          <Button
            variant="outline"
            className="rounded-xl gap-2 border-rose-200 text-rose-600 hover:bg-rose-50"
            onClick={handleOpenTransfer}
          >
            <UserX size={18} /> Transfer Student
          </Button>
        </div>
      </div>

      {/* Consolidated Summary */}
      <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
        <CardHeader className="px-0 pt-0 pb-4 border-b">
          <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Activity size={20} className="text-indigo-600" />
            Consolidated Summary
          </CardTitle>
          <p className="text-sm text-slate-500">A consolidated view of this learner's academic, attendance, and financial status.</p>
        </CardHeader>

        <CardContent className="px-0 pt-6 space-y-6">
          {(() => {
            // 1.1 — Marks summary
            const record = mockMarks.studentRecords[student.id];
            const currentTermMarks = record?.terms?.[record.currentTerm];
            const scores = currentTermMarks?.scores ?? {};
            const subjectCount = Object.keys(scores).length;
            const overallAverage = subjectCount
              ? (Object.values(scores).reduce((acc, n) => acc + n, 0) / subjectCount).toFixed(1)
              : '—';
            const level = (() => {
              const v = parseFloat(overallAverage);
              if (v >= 80) return { label: 'Exceeding Expectations', code: 'EE', color: 'bg-emerald-50 text-emerald-700' };
              if (v >= 65) return { label: 'Meeting Expectations', code: 'ME', color: 'bg-blue-50 text-blue-700' };
              if (v >= 50) return { label: 'Approaching Expectations', code: 'AE', color: 'bg-amber-50 text-amber-700' };
              return { label: 'Below Expectations', code: 'BE', color: 'bg-rose-50 text-rose-700' };
            })();

            // 1.2 — Attendance summary
            const att = mockAttendance.byStudent[student.id];
            const present = att?.present ?? 0;
            const absent = att?.absent ?? 0;
            const late = att?.late ?? 0;
            const totalDays = present + absent + late;
            const attendanceRate = totalDays
              ? Math.round(((present + late * 0.5) / totalDays) * 100)
              : 0;

            // 1.3 — Fee summary
            const studentTx = mockTransactions.filter(
              (tx) => tx.studentId === student.id
            );
            const totalPaid = studentTx.reduce((acc, tx) => acc + tx.amount, 0);
            const termFee = 15000;
            const balance = Math.max(0, termFee - totalPaid);
            const lastTx = studentTx
              .slice()
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Marks summary card */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                      <Award size={18} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Current Marks
                    </p>
                  </div>
                  <p className="text-3xl font-black text-slate-900">{overallAverage}%</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {subjectCount} subjects • {currentTermMarks?.examType ?? '—'}
                  </p>
                  <Badge className={cn("mt-3 rounded-lg border-none font-black text-[10px] px-2 py-0.5", level.color)}>
                    {level.code} • {level.label}
                  </Badge>
                </div>

                {/* Attendance summary card */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                      <CheckCircle2 size={18} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Attendance (Term)
                    </p>
                  </div>
                  <p className="text-3xl font-black text-slate-900">{attendanceRate}%</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] font-bold text-slate-500">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                      {present} Present
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700">
                      {absent} Absent
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">
                      {late} Late
                    </span>
                  </div>
                </div>

                {/* Fee summary card */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                      <Receipt size={18} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Fee Balance
                    </p>
                  </div>
                  <p
                    className={cn(
                      "text-3xl font-black",
                      balance > 0 ? "text-rose-600" : "text-emerald-600"
                    )}
                  >
                    KES {balance.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {lastTx
                      ? `Last payment: KES ${lastTx.amount.toLocaleString()} (${lastTx.date})`
                      : "No payments recorded this term"}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 h-8 text-xs rounded-lg font-bold border-slate-200 hover:bg-slate-100"
                    onClick={() => setIsPaymentModalOpen(true)}
                  >
                    Record Payment
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* Subject performance chart vs class average */}
          {performanceRows.length > 0 ? (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-600" />
                  Subject Performance — vs Class Average
                </h4>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Current Term
                </span>
              </div>

              <div className="space-y-3">
                {performanceRows.map((row) => {
                  const delta = getDeltaMeta(row.diff);
                  const DeltaIcon = delta.icon;
                  return (
                    <div
                      key={row.subject}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-bold text-slate-900 text-sm">{row.subject}</p>
                        <Badge
                          variant="outline"
                          className={cn("font-black text-[10px] gap-1 px-2 py-0.5", delta.color)}
                        >
                          <DeltaIcon size={10} />
                          {delta.label}
                        </Badge>
                      </div>

                      <div className="space-y-2.5">
                        {/* Student bar */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                            <span className="uppercase tracking-widest text-[9px] text-indigo-600">
                              {student.name.split(' ')[0]}
                            </span>
                            <span className="text-slate-900 font-black">
                              {row.studentScore.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all"
                              style={{ width: getBarWidth(row.studentScore) }}
                            />
                          </div>
                        </div>

                        {/* Class average bar */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                            <span className="uppercase tracking-widest text-[9px] text-slate-500">
                              Class Average
                            </span>
                            <span className="text-slate-700 font-bold">
                              {row.classAverage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-400 rounded-full transition-all"
                              style={{ width: getBarWidth(row.classAverage) }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center">
              <p className="text-sm font-bold text-slate-500">No subject marks recorded for this term yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden text-center p-10">
            <div className="w-24 h-24 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6">
              <UserCircle size={60} strokeWidth={1} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
            <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-6">ID: {student.admNo}</p>
            <div className="flex justify-center gap-2 mb-8">
              <Badge className="bg-indigo-600">Grade {student.grade}</Badge>
              <Badge variant="outline">{student.stream}</Badge>
            </div>
            <div className="space-y-4 text-left border-t pt-8">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Calendar size={16} className="text-slate-400" />
                <span>Born: {student.dob || '—'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone size={16} className="text-slate-400" />
                <span>{student.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={16} className="text-slate-400" />
                <span>{student.email || '—'}</span>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-[2rem] bg-indigo-900 text-white p-8 overflow-hidden relative">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
              <ShieldCheck size={140} />
            </div>
            <CardTitle className="text-lg mb-4">Account Security</CardTitle>
            <p className="text-sm text-indigo-200 mb-6">User has administrative access to assessment records.</p>
            <Button className="w-full bg-white/10 hover:bg-white/20 text-white border-none rounded-xl">
              Reset Credentials
            </Button>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="px-8 pt-8 border-b pb-4">
              <CardTitle className="text-lg">Academic Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 uppercase tracking-widest text-[10px]">
                    <th className="px-8 py-4 text-left font-bold">Learning Area</th>
                    <th className="px-8 py-4 text-center font-bold">Score</th>
                    <th className="px-8 py-4 text-right font-bold">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    { subject: "Mathematics", score: "88%", lvl: "EE" },
                    { subject: "English", score: "75%", lvl: "ME" },
                    { subject: "Science & Tech", score: "92%", lvl: "EE" },
                    { subject: "Agriculture", score: "84%", lvl: "EE" },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="px-8 py-5 font-bold text-slate-900">{row.subject}</td>
                      <td className="px-8 py-5 text-center font-medium text-slate-600">{row.score}</td>
                      <td className="px-8 py-5 text-right">
                        <Badge variant="outline" className={row.lvl === 'EE' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-blue-50 text-blue-700 border-blue-100"}>
                          {row.lvl}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                  <CreditCard size={24} />
                </div>
                <CardTitle className="text-lg">Fee Balance</CardTitle>
              </div>
              <p className="text-3xl font-black text-slate-900 mb-2">KES 3,000</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Total Term Fee: KES 15,000</p>
              <Button
                className="w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                Record Payment
              </Button>
            </Card>

            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <FileText size={24} />
                </div>
                <CardTitle className="text-lg">Documents</CardTitle>
              </div>
              <div className="space-y-3">
                <Button variant="ghost" className="w-full justify-between rounded-xl h-12 bg-slate-50 border-none group">
                  <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Term 3 2023 Report</span>
                  <ArrowLeft size={16} className="rotate-180 text-slate-300" />
                </Button>
                <Button variant="ghost" className="w-full justify-between rounded-xl h-12 bg-slate-50 border-none group">
                  <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Birth Certificate</span>
                  <ArrowLeft size={16} className="rotate-180 text-slate-300" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AcademicHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        studentId={student.id}
        studentName={student.name}
      />

      {/* Transfer Workflow — receives the FULL student object, never a fallback. */}
      {isTransferOpen && transferStudent && (
        <TransferWorkflow
          student={transferStudent}
          isOpen={isTransferOpen}
          onClose={handleCloseTransfer}
          onTransferComplete={(studentId, certificateNumber) => {
            setIsTransferOpen(false);
            setTransferStudent(null);
            showSuccess(`${student.name} has been transferred successfully. Certificate: ${certificateNumber}`);
          }}
        />
      )}

      <UnifiedRecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmitPayment={handleRecordPayment}
        gradesData={[]}
        studentsData={[
          {
            id: student.id,
            name: student.name,
            assessment: student.admNo,
            grade: student.grade,
            stream: student.stream,
          },
        ]}
        hideActivationKey={true}
      />
    </div>
  );
};

export default StudentProfile;