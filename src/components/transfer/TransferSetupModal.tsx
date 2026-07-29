"use client";

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, UserX, Calendar, FileText, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransferStudent, TransferSetupData } from '@/types/transfer';

interface TransferSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransferSetupData) => void;
  student: TransferStudent;
}

const TransferSetupModal: React.FC<TransferSetupModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  student
}) => {
  const [exitDate, setExitDate] = useState(new Date().toISOString().split('T')[0]);
  const [destinationSchool, setDestinationSchool] = useState('');
  const [reason, setReason] = useState('');

  const isFeeOutstanding = student.feeBalance > 0;

  const handleSubmit = () => {
    if (!destinationSchool.trim()) return;
    
    const setupData: TransferSetupData = {
      exitDate,
      destinationSchool: destinationSchool.trim(),
      reason: reason.trim(),
      feeBalance: student.feeBalance,
      isFeeCleared: !isFeeOutstanding
    };
    
    onSubmit(setupData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Student"
      description="Initiate student transfer process with clearance requirements"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100 gap-2"
            disabled={!destinationSchool.trim()}
          >
            <UserX size={18} /> Execute Transfer & Generate Certificate
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Student Info Card */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-4">Student Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Student Name</p>
              <p className="font-bold text-slate-900">{student.name}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assessment ID</p>
              <p className="font-bold text-slate-900">{student.assessment}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Grade</p>
              <p className="font-bold text-slate-900">{student.grade} - {student.stream}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Admission Date</p>
              <p className="font-bold text-slate-900">{student.admissionDate}</p>
            </div>
          </div>
        </div>

        {/* Transfer Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date of Exit</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                type="date" 
                value={exitDate} 
                onChange={(e) => setExitDate(e.target.value)}
                className="pl-10 rounded-xl h-12 bg-slate-50 border-slate-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Destination School</Label>
            <Input 
              value={destinationSchool} 
              onChange={(e) => setDestinationSchool(e.target.value)}
              placeholder="e.g., St. Mary's School, Nairobi"
              className="rounded-xl h-12 bg-slate-50 border-slate-100"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reason for Transfer</Label>
            <Input 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Family relocation, job transfer"
              className="rounded-xl h-12 bg-slate-50 border-slate-100"
            />
          </div>
        </div>

        {/* Financial Clearance Card */}
        <div className={cn(
          "rounded-2xl border p-6",
          isFeeOutstanding 
            ? "bg-amber-50/50 border-amber-200" 
            : "bg-emerald-50/50 border-emerald-200"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <FileText className={cn(
              "shrink-0",
              isFeeOutstanding ? "text-amber-600" : "text-emerald-600"
            )} size={24} />
            <h3 className={cn(
              "font-bold",
              isFeeOutstanding ? "text-amber-800" : "text-emerald-800"
            )}>
              Financial Clearance Status
            </h3>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-slate-700">Outstanding Fee Balance</p>
              <p className={cn(
                "text-2xl font-black",
                isFeeOutstanding ? "text-amber-600" : "text-emerald-600"
              )}>
                KES {student.feeBalance.toLocaleString()}
              </p>
            </div>
            <Badge className={cn(
              "rounded-lg font-bold",
              isFeeOutstanding 
                ? "bg-amber-100 text-amber-700 border-amber-200" 
                : "bg-emerald-100 text-emerald-700 border-emerald-200"
            )}>
              {isFeeOutstanding ? "PENDING" : "CLEARED"}
            </Badge>
          </div>

          {isFeeOutstanding && (
            <div className="bg-amber-100/50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    Attention: This student has an outstanding fee balance of KES {student.feeBalance.toLocaleString()}.
                  </p>
                  <p className="text-xs font-medium text-amber-700 mt-1">
                    Ensure clearance or settlement before issuing final documents.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isFeeOutstanding && (
            <div className="bg-emerald-100/50 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-emerald-600 shrink-0" size={20} />
                <p className="text-sm font-bold text-emerald-800">
                  Fee balance is cleared. Student is eligible for transfer.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TransferSetupModal;