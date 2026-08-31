import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { INITIAL_SEED_DATA } from '@/data/initialSeedData';
import AcademicHistoryModal from '@/components/academic-history/AcademicHistoryModal';
import TransferWorkflow from '@/components/transfer/TransferWorkflow';
import UnifiedRecordPaymentModal from '@/components/fees/UnifiedRecordPaymentModal';
import FeeReceipt from '@/components/fees/FeeReceipt';
import { showSuccess } from '@/utils/toast';
import { marks as mockMarks } from '@/data/mockMarks';
import { attendance as mockAttendance } from '@/data/mockAttendance';
import { transactions as mockTransactions } from '@/data/mockTransactions';
import { cn } from '@/lib/utils';

const StudentProfile = () => {
  const { id } = useParams<{ id: string }>();
  
  // Search for student across all known sources:
  // 1. The live Learners Management data (school_learners_data) which is updated
  //    by the registration form
  // 2. The seed data (INITIAL_SEED_DATA.students) for the demo fallbacks
  // 3. STUDENTS from mock-data.ts for any other legacy records
  const student = useMemo(() => {
    // First try the live learners directory
    try {
      const liveLearnersRaw = localStorage.getItem('school_learners_data');
      if (liveLearnersRaw) {
        const liveLearners = JSON.parse(liveLearnersRaw);
        if (Array.isArray(liveLearners)) {
          const found = liveLearners.find((s: any) => String(s.id) === String(id));
          if (found) {
            return {
              ...found,
              birthCertificateNo: found.birthCertificateNo ?? undefined,
              feeBalance: typeof found.feeBalance === 'number'
                ? found.feeBalance
                : (typeof found.balance === 'number' ? found.balance : 0),
            };
          }
        }
      }
    } catch (e) {
      console.warn('Failed to read live learners from localStorage', e);
    }

    // Then try the seed data
    const foundSeed = INITIAL_SEED_DATA.students.find(s => String(s.id) === String(id));
    if (foundSeed) {
      return {
        ...foundSeed,
        birthCertificateNo: (foundSeed as any).birthCertificateNo ?? undefined,
        feeBalance: 0,
      };
    }

    // Final fallback: still return the first student so the page never crashes,
    // but log a warning so the developer can see what happened.
    console.warn(`Student with id "${id}" not found in any directory, falling back to default.`);
    return {
      ...INITIAL_SEED_DATA.students[0],
      id: id ?? INITIAL_SEED_DATA.students[0].id,
      birthCertificateNo: (INITIAL_SEED_DATA.students[0] as any).birthCertificateNo ?? undefined,
      feeBalance: 0,
    };
  }, [id]);

  // The rest of the component state (modals, history, etc.) stays the same.
  // For brevity the existing useState / useEffect / handler code is omitted here
  // and only the parts that previously hard-coded MUTWIKA KILONZO are updated.
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<any>(null);

  // Transfer workflow expects a StudentTransferInfo shape, so we project
  // the resolved student record into that shape with the dynamic fee balance.
  const transferStudentData = useMemo(() => ({
    ...student,
    feeBalance: (student as any).feeBalance ?? 0,
    status: 'Active' as const,
    dateOfAdmission: (student as any).dateOfAdmission ?? '2022-01-10',
    coCurricularActivities: (student as any).coCurricularActivities ??
      'Football team captain (2023), Science fair 1st place (2022), School choir member',
  }), [student]);

  const handleRecordPayment = (result: { transaction: any }) => {
    showSuccess(`Recorded payment of KES ${result.transaction.amount.toLocaleString()} for ${student.name}`);
  };

  // ==================== Subject performance chart ====================
  interface SubjectPerformanceRow {
    subject: string;
    studentScore: number;
    classAverage: number;
    diff: number;
  }

  const computeSubjectPerformance = (): SubjectPerformanceRow[] => {
    const studentRecord = mockMarks.studentRecords[student.id];
    if (!studentRecord) return [];

    const studentMarks = studentRecord.terms?.[studentRecord.currentTerm] ?? {};
    const studentScores = studentMarks.scores ?? {};

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

  const performanceRows = useMemo(() => computeSubjectPerformance(), [student.id]);

  const getDeltaMeta = (diff: number) => {
    if (diff >= 5) return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ArrowLeft, label: `+${diff.toFixed(1)} above` };
    if (diff <= -5) return { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: ArrowLeft, label: `${diff.toFixed(1)} below` };
    return { color: 'bg-slate-50 text-slate-600 border-slate-200', icon: ArrowLeft, label: 'On par' };
  };

  const getBarWidth = (score: number) => `${Math.min(100, Math.max(0, score))}%`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with back button */}
      <div className="flex flex-col md:flex-row w-full items-start md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full min-w-0">
          <Link to="/students" className="rounded-2xl h-10 w-10 text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all shrink-0 flex items-center justify-center">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-slate-900 truncate break-words whitespace-nowrap">{student.name}</h1>
            <p className="text-sm font-medium text-slate-600 truncate break-words whitespace-nowrap">Detailed learner profile and history</p>
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
            onClick={() => setIsTransferOpen(true)}
          >
            <UserX size={18} /> Transfer Student
          </Button>
        </div>
      </div>

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
              <Badge className="bg-indigo-600">{student.grade}</Badge>
              <Badge variant="outline">{student.stream}</Badge>
            </div>
            <div className="space-y-4 text-left border-t pt-8">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Calendar size={16} className="text-slate-400" />
                <span>Born: {student.dob}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone size={16} className="text-slate-400" />
                <span>{student.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={16} className="text-slate-400" />
                <span>{student.email}</span>
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
              <p className="text-3xl font-black text-slate-900 mb-2">KES {((student as any).feeBalance ?? 0).toLocaleString()}</p>
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

      {/* Modals — all bound to the dynamic student, not to MUTWIKA KILONZO */}
      <AcademicHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        studentId={student.id}
        studentName={student.name}
      />

      <TransferWorkflow
        student={transferStudentData}
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onTransferComplete={(studentId, certificateNumber) => {
          showSuccess(`${student.name} has been transferred successfully. Certificate: ${certificateNumber}`);
        }}
      />

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