"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText, Printer, UserCheck, UserX, Calendar, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClearanceCertificateData } from '@/types/transfer';

interface ClearanceCertificateProps {
  data: ClearanceCertificateData;
  onPrint: () => void;
  className?: string;
}

const ClearanceCertificate: React.FC<ClearanceCertificateProps> = ({
  data,
  onPrint,
  className
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getClearanceStatusColor = (status: string) => {
    return status === 'CLEARED' 
      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
      : "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <div className={cn(
      "bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-xl max-w-4xl mx-auto",
      "print:shadow-none print:border-0 print:rounded-none print:max-w-full print:mx-0",
      className
    )}>
      {/* Document Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-slate-200">
        <div className="flex-1">
          <h1 className="text-3xl font-black text-slate-900 mb-2">MUNYAKA PRIMARY AND JUNIOR SCHOOL</h1>
          <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Knowledge is Power</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="School Logo" 
              className="object-contain h-12 w-12"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Official Document</p>
            <p className="text-lg font-black text-slate-900">SERIAL: {data.serialNumber}</p>
          </div>
        </div>
      </div>

      {/* Certificate Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-6 py-3 rounded-2xl mb-4">
          <FileText size={24} />
          <h2 className="text-2xl font-black">STUDENT TRANSFER & CLEARANCE CERTIFICATE</h2>
        </div>
        <p className="text-sm text-slate-500 font-medium">Date Issued: {formatDate(data.transferDate)}</p>
      </div>

      {/* Student Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Student Full Name</p>
            <p className="text-lg font-bold text-slate-900">{data.studentName}</p>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gender</p>
            <p className="text-lg font-bold text-slate-900">{data.gender}</p>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date of Admission</p>
            <p className="text-lg font-bold text-slate-900">{formatDate(data.admissionDate)}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Last Grade Attained</p>
            <p className="text-lg font-bold text-slate-900">{data.lastGrade} - {data.stream}</p>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fee Clearance Status</p>
            <Badge className={cn("text-sm font-bold rounded-lg border-none", getClearanceStatusColor(data.feeClearanceStatus))}>
              {data.feeClearanceStatus}
            </Badge>
            <p className="text-sm font-bold text-slate-600 mt-1">Balance: KES {data.balance.toLocaleString()}</p>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Destination School</p>
            <p className="text-lg font-bold text-slate-900">{data.destinationSchool}</p>
          </div>
        </div>
      </div>

      {/* Co-curricular Activities & Remarks */}
      {(data.coCurricularActivities || data.headteacherRemarks) && (
        <div className="mb-8 space-y-4">
          {data.coCurricularActivities && (
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">Co-curricular Activities</p>
              <p className="text-sm text-slate-700">{data.coCurricularActivities}</p>
            </div>
          )}
          
          {data.headteacherRemarks && (
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Headteacher's Remarks</p>
              <p className="text-sm text-slate-700">{data.headteacherRemarks}</p>
            </div>
          )}
        </div>
      )}

      {/* Signature Block */}
      <div className="border-t border-slate-200 pt-6 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 h-20 flex items-center justify-center mb-2">
              {data.bursarSignature ? (
                <CheckCircle className="text-emerald-600" size={32} />
              ) : (
                <div className="text-slate-400 font-bold">Bursar Signature</div>
              )}
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bursar / Finance Clearance</p>
          </div>
          
          <div className="text-center">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 h-20 flex items-center justify-center mb-2">
              {data.headteacherSignature ? (
                <CheckCircle className="text-emerald-600" size={32} />
              ) : (
                <div className="text-slate-400 font-bold">Headteacher Signature</div>
              )}
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Headteacher Signature & Stamp</p>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="mt-8 text-center">
        <Button 
          onClick={onPrint}
          className="rounded-2xl px-8 h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100 gap-2"
        >
          <Printer size={20} /> Print Certificate
        </Button>
      </div>
    </div>
  );
};

export default ClearanceCertificate;