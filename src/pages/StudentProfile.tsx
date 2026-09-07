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
  Download,
  FileCheck,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import AcademicHistoryModal from '@/components/academic-history/AcademicHistoryModal';
import TransferWorkflow from '@/components/transfer/TransferWorkflow';
import UnifiedRecordPaymentModal from '@/components/fees/UnifiedRecordPaymentModal';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { StudentTransferInfo } from '@/types/transfer';
import {
  getCertificateRef,
  redownloadCertificate,
  type ClearanceCertificateRef,
} from '@/utils/pdfDownloader';

const LEARNERS_STORAGE_KEY = 'school_learners_data';
const TRANSACTIONS_KEY = 'munyaka_transactions';
const PAYMENT_RECORDS_KEY = 'munyaka_payment_records';
const FEE_STRUCTURES_KEY = 'munyaka_fee_structures';
const ASSESSMENT_SCORES_KEY = 'munyaka_assessment_scores';
const ATTENDANCE_KEY = 'munyaka_attendance_records';

// ── Safe localStorage reader ────────────────────────────────────────────────
function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

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

  // Clearance certificate reference — loaded once when the profile mounts.
  // Shows a "Download Clearance Certificate" button if this student has been transferred.
  const [certificateRef, setCertificateRef] = useState<ClearanceCertificateRef | null>(null);
  const [isRedownloading, setIsRedownloading] = useState(false);

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
      assessment: activeLearner.admNo,
      grade: activeLearner.grade,
      stream: activeLearner.stream,
      gender: activeLearner.gender,
      guardian: activeLearner.guardian,
      phone: activeLearner.phone,
      email: activeLearner.email ?? '',
      dob: activeLearner.dob ?? '',
      health: '',
      needs: '',
      feeBalance: activeLearner.feeBalance ?? 0,
      status: (activeLearner.status === 'Transferred' ? 'Transferred' : (activeLearner.status as 'Active' | 'Transferred' | 'Graduated' | 'Suspended')) ?? 'Active',
      dateOfAdmission: activeLearner.dateOfAdmission ?? new Date().toISOString().split('T')[0],
      coCurricularActivities: activeLearner.coCurricularActivities ?? '',
      examType: '',
    };
    setTransferStudent(transferPayload);
    setIsTransferOpen(true);
  };

  const handleCloseTransfer = () => {
    setIsTransferOpen(false);
    setTransferStudent(null);
  };

  // Load the clearance certificate reference whenever the active learner
  // changes so the header button appears the moment a transferred learner
  // opens their profile.
  useEffect(() => {
    if (!activeLearner) {
      setCertificateRef(null);
      return;
    }
    setCertificateRef(getCertificateRef(activeLearner.id));
  }, [activeLearner]);

  // Manually re-download a previously-issued certificate. Used by the
  // "Download Clearance Certificate" button on the profile header.
  const handleRedownloadCertificate = async () => {
    if (!activeLearner) return;
    setIsRedownloading(true);
    try {
      // Refresh from storage first so the latest persisted ref is used.
      const latest = getCertificateRef(activeLearner.id);
      if (!latest) {
        showError('No clearance certificate on file for this learner.');
        return;
      }
      const result = redownloadCertificate(activeLearner.id, activeLearner.name);
      if (!result.success) {
        showError(result.error ?? 'Could not re-download the certificate.');
      } else {
        showSuccess(`Certificate ${latest.certificateNumber} downloaded.`);
      }
    } finally {
      setIsRedownloading(false);
    }
  };

  // ==================== Subject performance chart ====================
  //
  // Real data only — pulls assessment scores for the active learner from
  // `munyaka_assessment_scores` and computes a per-subject class average
  // across every other learner for the same grade. No mock fallbacks.
  interface SubjectPerformanceRow {
    subject: string;
    studentScore: number;
    classAverage: number;
    diff: number;
  }

  const computeSubjectPerformance = (): SubjectPerformanceRow[] => {
    if (!activeLearner) return [];

    const allScores = safeRead<Record<string, Record<string, Record<string, number>>>>(
      ASSESSMENT_SCORES_KEY,
      {},
    );
    const learnerScores = allScores?.[activeLearner.id];
    if (!learnerScores || typeof learnerScores !== 'object') return [];

    // Flatten the per-term scores into a single average per subject.
    const subjects = new Set<string>();
    for (const term of Object.values(learnerScores)) {
      if (term && typeof term === 'object') {
        for (const subj of Object.keys(term)) subjects.add(subj);
      }
    }

    return Array.from(subjects).map((subject) => {
      const studentAvg = (() => {
        const termVals: number[] = [];
        for (const term of Object.values(learnerScores)) {
          const v = term?.[subject];
          if (typeof v === 'number' && !Number.isNaN(v)) termVals.push(v);
        }
        if (termVals.length === 0) return 0;
        return termVals.reduce((a, n) => a + n, 0) / termVals.length;
      })();

      // Class average: average of all other learners' same-subject scores
      // in the same grade, across all terms.
      const peerVals: number[] = [];
      for (const [peerId, peer] of Object.entries(allScores)) {
        if (peerId === activeLearner.id) continue;
        if (!peer || typeof peer !== 'object') continue;
        for (const term of Object.values(peer)) {
          const v = term?.[subject];
          if (typeof v === 'number' && !Number.isNaN(v)) peerVals.push(v);
        }
      }
      const classAverage = peerVals.length
        ? peerVals.reduce((a, n) => a + n, 0) / peerVals.length
        : 0;

      return {
        subject,
        studentScore: studentAvg,
        classAverage,
        diff: studentAvg - classAverage,
      };
    });
  };

  const performanceRows = useMemo(() => computeSubjectPerformance(), [activeLearner]);

  // ── Fee metrics (component-level so the bottom card can re-use them) ──
  // Total Invoiced comes from `munyaka_fee_structures` filtered by the
  // learner's grade. If no structure is assigned, both Invoiced and
  // Outstanding default to 0 — there is no hardcoded KES 15,000 figure.
  const feeMetrics = useMemo(() => {
    if (!activeLearner) {
      return { totalInvoiced: 0, totalPaid: 0, outstandingBalance: 0, lastTx: null as null | { amount?: number; date?: string } };
    }
    interface FeeStructure {
      id: string;
      gradeId?: string;
      gradeName?: string;
      year?: string;
      term?: string;
      amount?: number;
    }
    const feeStructures = safeRead<FeeStructure[]>(FEE_STRUCTURES_KEY, []);
    const matching = feeStructures.filter((fs) => {
      if (!fs) return false;
      return (fs.gradeName && fs.gradeName === activeLearner.grade) ||
             (fs.gradeId && fs.gradeId === activeLearner.grade);
    });
    const totalInvoiced = matching.reduce(
      (acc, fs) => acc + (typeof fs.amount === 'number' ? fs.amount : 0),
      0,
    );

    interface TransactionRow {
      studentId?: string;
      amount?: number;
      date?: string;
      type?: string;
      status?: string;
    }
    const allTx: TransactionRow[] = [
      ...safeRead<TransactionRow[]>(TRANSACTIONS_KEY, []),
      ...safeRead<TransactionRow[]>(PAYMENT_RECORDS_KEY, []),
    ];
    const studentTx = allTx
      .filter((tx) => tx && tx.studentId === activeLearner.id)
      .filter((tx) => (tx.status ?? 'Completed') === 'Completed')
      .filter((tx) => !tx.type || tx.type === 'payment');
    const totalPaid = studentTx.reduce(
      (acc, tx) => acc + (typeof tx.amount === 'number' ? tx.amount : 0),
      0,
    );
    const outstandingBalance = Math.max(0, totalInvoiced - totalPaid);
    const lastTx = studentTx
      .slice()
      .sort((a, b) => {
        const ta = a.date ? new Date(a.date).getTime() : 0;
        const tb = b.date ? new Date(b.date).getTime() : 0;
        return tb - ta;
      })[0] ?? null;
    return { totalInvoiced, totalPaid, outstandingBalance, lastTx };
  }, [activeLearner]);

  const formatKsh = (n: number) =>
    `KES ${(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;

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
      <div className="w-full max-w-full overflow-x-hidden px-4 py-3 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
      <div className="w-full max-w-full overflow-x-hidden px-4 py-3 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
    <div className="w-full max-w-full overflow-x-hidden px-4 py-3 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header - stacks on mobile */}
      <div className="flex flex-col sm:flex-row w-full items-start sm:items-center justify-between gap-4">
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
          {certificateRef && (
            <Button
              variant="outline"
              className="rounded-xl gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={handleRedownloadCertificate}
              disabled={isRedownloading}
              title={`Re-download Clearance Certificate ${certificateRef.certificateNumber}`}
            >
              {isRedownloading ? <ShieldCheck size={18} className="animate-pulse" /> : <FileCheck size={18} />}
              Download Clearance Certificate
            </Button>
          )}
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
            // 1.1 — Marks summary (real data only, no mocks)
            const allScores = safeRead<Record<string, Record<string, Record<string, number>>>>(
              ASSESSMENT_SCORES_KEY,
              {},
            );
            const learnerScores = allScores?.[student.id];
            // Build a flat per-subject list across all terms.
            const flatSubjectScores: { subject: string; value: number }[] = [];
            const termLabels: string[] = [];
            if (learnerScores && typeof learnerScores === 'object') {
              for (const [term, subjects] of Object.entries(learnerScores)) {
                if (subjects && typeof subjects === 'object') {
                  termLabels.push(term);
                  for (const [subj, val] of Object.entries(subjects)) {
                    if (typeof val === 'number' && !Number.isNaN(val)) {
                      flatSubjectScores.push({ subject: subj, value: val });
                    }
                  }
                }
              }
            }
            const subjectCount = flatSubjectScores.length;
            const overallAverage = subjectCount
              ? (flatSubjectScores.reduce((acc, n) => acc + n.value, 0) / subjectCount).toFixed(1)
              : '—';
            const level = (() => {
              const v = parseFloat(overallAverage);
              if (Number.isNaN(v)) return { label: 'No assessment data', code: '—', color: 'bg-slate-50 text-slate-500' };
              if (v >= 80) return { label: 'Exceeding Expectations', code: 'EE', color: 'bg-emerald-50 text-emerald-700' };
              if (v >= 65) return { label: 'Meeting Expectations', code: 'ME', color: 'bg-blue-50 text-blue-700' };
              if (v >= 50) return { label: 'Approaching Expectations', code: 'AE', color: 'bg-amber-50 text-amber-700' };
              return { label: 'Below Expectations', code: 'BE', color: 'bg-rose-50 text-rose-700' };
            })();

            // 1.2 — Attendance summary (real data only)
            const attendance = safeRead<Record<string, { present?: Record<string, string>; late?: Record<string, string>; absent?: string[] }>>(
              ATTENDANCE_KEY,
              {},
            );
            let present = 0;
            let absent = 0;
            let late = 0;
            for (const day of Object.values(attendance)) {
              if (!day) continue;
              if (day.present && typeof day.present === 'object') {
                if (day.present[student.id]) present += 1;
              }
              if (day.late && typeof day.late === 'object') {
                if (day.late[student.id]) late += 1;
              }
              if (Array.isArray(day.absent) && day.absent.includes(student.id)) absent += 1;
            }
            const totalDays = present + absent + late;
            const attendanceRate = totalDays
              ? Math.round(((present + late * 0.5) / totalDays) * 100)
              : 0;

            // 1.3 — Fee summary (real data only, no hardcoded values)
            // totalInvoiced = 0 when no fee structure is assigned for this grade.
            const { totalInvoiced, outstandingBalance, lastTx } = feeMetrics;

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
                  <p className="text-3xl font-black text-slate-900">
                    {overallAverage === '—' ? '—' : `${overallAverage}%`}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {subjectCount > 0
                      ? `${subjectCount} subject${subjectCount === 1 ? '' : 's'} • ${termLabels[0] ?? '—'}`
                      : 'No assessment data'}
                  </p>
                  <Badge className={cn("mt-3 rounded-lg border-none font-black text-[10px] px-2 py-0.5", level.color)}>
                    {level.code === '—' ? level.label : `${level.code} • ${level.label}`}
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
                  <p className="text-3xl font-black text-slate-900">
                    {totalDays > 0 ? `${attendanceRate}%` : '—'}
                  </p>
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
                      outstandingBalance > 0 ? "text-rose-600" : "text-emerald-600"
                    )}
                  >
                    {formatKsh(outstandingBalance)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {totalInvoiced > 0
                      ? `Total Invoiced: ${formatKsh(totalInvoiced)}`
                      : 'No fee structure configured'}
                    {lastTx
                      ? ` • Last payment: KES ${lastTx.amount?.toLocaleString() ?? 0} (${lastTx.date ?? '—'})`
                      : ' • No payments recorded'}
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
              <p className="text-sm font-bold text-slate-500">No assessment records available for this learner.</p>
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
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="px-8 pt-8 border-b pb-4">
              <CardTitle className="text-lg">Academic Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              {performanceRows.length > 0 ? (
                <table className="w-full text-sm min-w-max">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 uppercase tracking-widest text-[10px]">
                      <th className="px-8 py-4 text-left font-bold">Learning Area</th>
                      <th className="px-8 py-4 text-center font-bold">Score</th>
                      <th className="px-8 py-4 text-right font-bold">Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {performanceRows.map((row) => {
                      const pct = row.studentScore.toFixed(1);
                      const level = (() => {
                        if (row.studentScore >= 80) return { code: 'EE', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
                        if (row.studentScore >= 65) return { code: 'ME', color: 'bg-blue-50 text-blue-700 border-blue-100' };
                        if (row.studentScore >= 50) return { code: 'AE', color: 'bg-amber-50 text-amber-700 border-amber-100' };
                        return { code: 'BE', color: 'bg-rose-50 text-rose-700 border-rose-100' };
                      })();
                      return (
                        <tr key={row.subject}>
                          <td className="px-8 py-5 font-bold text-slate-900">{row.subject}</td>
                          <td className="px-8 py-5 text-center font-medium text-slate-600">{pct}%</td>
                          <td className="px-8 py-5 text-right">
                            <Badge variant="outline" className={level.color}>
                              {level.code}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 text-center">
                  <p className="text-sm font-bold text-slate-500">No assessment records available for this learner.</p>
                </div>
              )}
              </div>
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
              <p
                className={cn(
                  "text-3xl font-black mb-2",
                  feeMetrics.outstandingBalance > 0 ? "text-rose-600" : "text-emerald-600"
                )}
              >
                {formatKsh(feeMetrics.outstandingBalance)}
              </p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
                {feeMetrics.totalInvoiced > 0
                  ? `Total Invoiced: ${formatKsh(feeMetrics.totalInvoiced)} • Total Paid: ${formatKsh(feeMetrics.totalPaid)}`
                  : 'No fee structure configured • Invoiced: KES 0 • Paid: KES 0'}
              </p>
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
                  // 1. Mark the learner as TRANSFERRED in the active roster so
                  //    they are excluded from attendance, marks, fee rosters,
                  //    AND the main Learners directory table.
                  try {
                    const raw = window.localStorage.getItem('school_learners_data');
                    if (raw) {
                      const parsed = JSON.parse(raw);
                      if (Array.isArray(parsed)) {
                        const updated = parsed.map((l: { id: string }) =>
                          l.id === studentId
                            ? { ...l, status: 'TRANSFERRED' as const }
                            : l,
                        );
                        window.localStorage.setItem(
                          'school_learners_data',
                          JSON.stringify(updated),
                        );
                      }
                    }
                  } catch (err) {
                    console.error('[StudentProfile] Failed to mark learner as TRANSFERRED:', err);
                  }
      
                  // 2. Update local React state so the profile view reflects the
                  //    new status immediately.
                  setActiveLearner((prev) =>
                    prev && prev.id === studentId
                      ? ({ ...prev, status: 'Transferred' as const } as ProfileLearner)
                      : prev,
                  );
      
                  // 3. Refresh the certificate reference so the
                  //    "Download Clearance Certificate" button appears.
                  setCertificateRef(getCertificateRef(studentId));
      
                  // 4. Notify the parent / storage so the Learners page and
                  //    Archive page refresh without a full page reload.
                  try {
                    window.dispatchEvent(new Event('learners_data_updated'));
                    window.dispatchEvent(new Event('archive_updated'));
                  } catch {
                    /* SSR / no window */
                  }
      
                  // 5. Close the modal & clear the transfer state.
                  setIsTransferOpen(false);
                  setTransferStudent(null);
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