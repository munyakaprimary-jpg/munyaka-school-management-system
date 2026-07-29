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
  UserX
} from 'lucide-react';
import { STUDENTS } from '@/lib/mock-data';
import AcademicHistoryModal from '@/components/academic-history/AcademicHistoryModal';
import TransferSetupModal from '@/components/transfer/TransferSetupModal';
import ClearanceCertificate from '@/components/transfer/ClearanceCertificate';
import { TransferStudent, TransferSetupData, ClearanceCertificateData } from '@/types/transfer';

const StudentProfile = () => {
  const student = STUDENTS[0] as TransferStudent; 
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [transferData, setTransferData] = useState<TransferSetupData | null>(null);

  const handleTransferSubmit = (data: TransferSetupData) => {
    setTransferData(data);
    setIsTransferModalOpen(false);
    
    // Update student status
    const updatedStudent = { ...student, status: 'Transferred' as const };
    
    // Generate clearance certificate data
    const certificateData: ClearanceCertificateData = {
      serialNumber: `CERT-${Date.now()}`,
      studentName: updatedStudent.name,
      gender: updatedStudent.gender,
      admissionDate: updatedStudent.admissionDate,
      lastGrade: updatedStudent.grade,
      stream: updatedStudent.stream,
      feeClearanceStatus: data.isFeeCleared ? 'CLEARED' : 'PENDING',
      balance: data.feeBalance,
      bursarSignature: true,
      headteacherSignature: true,
      coCurricularActivities: "Active member of Science Club and Basketball Team",
      headteacherRemarks: "A well-behaved and diligent student. We wish them success in their future endeavors.",
      transferDate: data.exitDate,
      destinationSchool: data.destinationSchool
    };
    
    setShowCertificate(true);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton to="/students" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{student.name}</h1>
            <p className="text-muted-foreground">Detailed learner profile and history.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="rounded-xl gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={() => setIsHistoryModalOpen(true)}
          >
            <History size={18} /> View History
          </Button>
          <Button 
            className="rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => setIsTransferModalOpen(true)}
          >
            <UserX size={18} /> Transfer Student
          </Button>
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
              <Badge className={cn(
                student.status === 'Active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
              )}>
                {student.status}
              </Badge>
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
              <p className="text-3xl font-black text-slate-900 mb-2">KES {student.feeBalance.toLocaleString()}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Total Term Fee: KES 15,000</p>
              <Button className="w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800">Record Payment</Button>
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

      {/* Transfer Workflow */}
      {showCertificate && transferData && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Transfer & Clearance Certificate</h2>
          <ClearanceCertificate 
            data={{
              ...transferData,
              serialNumber: `CERT-${Date.now()}`,
              studentName: student.name,
              gender: student.gender,
              admissionDate: student.admissionDate,
              lastGrade: student.grade,
              stream: student.stream,
              feeClearanceStatus: transferData.isFeeCleared ? 'CLEARED' : 'PENDING',
              balance: transferData.feeBalance,
              bursarSignature: true,
              headteacherSignature: true,
              coCurricularActivities: "Active member of Science Club and Basketball Team",
              headteacherRemarks: "A well-behaved and diligent student. We wish them success in their future endeavors.",
              transferDate: transferData.exitDate,
              destinationSchool: transferData.destinationSchool
            }}
            onPrint={handlePrintCertificate}
          />
        </div>
      )}

      {/* Academic History Modal */}
      <AcademicHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        studentId={student.id}
        studentName={student.name}
      />

      {/* Transfer Setup Modal */}
      <TransferSetupModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSubmit={handleTransferSubmit}
        student={student}
      />
    </div>
  );
};

export default StudentProfile;