"use client";

import React, { useState } from 'react';
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
  Download
} from 'lucide-react';
import { STUDENTS } from '@/lib/mock-data';
import AcademicHistoryModal from '@/components/academic-history/AcademicHistoryModal';
import TransferWorkflow from '@/components/transfer/TransferWorkflow';
import RecordPaymentModal from '@/components/fees/RecordPaymentModal';
import { showSuccess, showError } from '@/utils/toast';

const StudentProfile = () => {
  const student = STUDENTS[0]; 
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Enhanced student data for transfer
  const transferStudentData = {
    ...student,
    feeBalance: 3000, // Mock outstanding balance
    status: 'Active' as const,
    dateOfAdmission: '2022-01-10',
    coCurricularActivities: 'Football team captain (2023), Science fair 1st place (2022), School choir member',
  };

  const handleRecordPayment = (amount: number) => {
    console.log('Record Payment clicked, amount:', amount);
    // In a real app, this would update the fee balance
    showSuccess(`Recorded payment of KES ${amount.toLocaleString()} for ${student.name}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row w-full items-start md:items-center justify-between gap-4">
        {/* Title section with back arrow, name, and subtitle */}
        <div className="flex flex-col md:flex-row items-center gap-3 w-full min-w-0">
          <BackButton to="/students" />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-slate-900 truncate break-words whitespace-nowrap">{student.name}</h1>
            <p className="text-sm font-medium text-slate-600 truncate break-words whitespace-nowrap">Detailed learner profile and history</p>
          </div>
        </div>
        {/* Action buttons - horizontally scrollable on mobile, horizontal on desktop */}
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
          {/* Permanent Download Transfer Certificate button - visible when student is transferred */}
          {transferStudentData.status === 'Transferred' && (
            <Button 
              variant="outline" 
              className="rounded-xl gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              onClick={() => {
                // This would trigger the transfer workflow to show the certificate
                // In a real app, this would fetch the existing certificate
                setIsTransferOpen(true);
              }}
            >
              <Download size={18} /> Download Transfer Certificate
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden text-center p-10">
            <div className="w-24 h-24 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6">
              <UserCircle size={60} strokeWidth={1} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
            <p className="text-sm font-medium text-slate-400 mb-6">ID: {student.assessment}</p>
            <div className="flex justify-center gap-2 mb-8">
              <Badge className="bg-indigo-600">Grade {student.grade}</Badge>
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

          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
            <CardTitle className="text-lg mb-6">Quick Stats</CardTitle>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Attendance</span>
                <span className="text-sm font-bold text-emerald-600">96%</span>
              </div>
              <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[96%]" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Assessments</span>
                <span className="text-sm font-bold text-indigo-600">Exceeding</span>
              </div>
              <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full w-[85%]" />
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
                onClick={() => {
                  console.log('Record Payment clicked');
                  setIsPaymentModalOpen(true);
                }}
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

      {/* Academic History Modal */}
      <AcademicHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        studentId={student.id}
        studentName={student.name}
      />

      {/* Transfer Workflow Modal */}
      <TransferWorkflow
        student={transferStudentData}
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onTransferComplete={(studentId, certificateNumber) => {
          // DO NOT close modal here - let user download/print first
          // The modal handles its own close via the Close button in Stage 2
          showSuccess(`${student.name} has been transferred successfully. Certificate: ${certificateNumber}`);
        }}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmitPayment={handleRecordPayment}
        gradesData={[]}
        studentsData={[{ 
          id: student.id, 
          name: student.name, 
          assessment: student.assessment, 
          grade: student.grade, 
          stream: student.stream 
        }]}
      />
    </div>
  );
};

export default StudentProfile;