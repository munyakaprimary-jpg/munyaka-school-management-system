"use client";

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from "@/components/ui/button";
import { GraduationCap, X, AlertCircle, Users, CheckCircle2, ShieldCheck, Loader2, ArrowRight, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';

interface Student {
  id: string;
  name: string;
  grade: string;
  stream: string;
  status: 'Active' | 'Graduated' | 'Archived';
}

interface PromoteStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onPromote: (promotedStudents: Student[]) => void;
  highestGrade: string;
}

const getNextGrade = (currentGrade: string): string => {
  const gradeMatch = currentGrade.match(/Grade (\d+)/);
  if (gradeMatch) {
    const currentNum = parseInt(gradeMatch[1]);
    return `Grade ${currentNum + 1}`;
  }
  if (currentGrade === "Grade PP2") return "Grade 1";
  if (currentGrade === "Grade PP1") return "Grade PP2";
  return currentGrade;
};

const isHighestGrade = (grade: string, highestGrade: string): boolean => {
  const gradeMatch = grade.match(/Grade (\d+)/);
  const highestMatch = highestGrade.match(/Grade (\d+)/);
  if (gradeMatch && highestMatch) {
    return parseInt(gradeMatch[1]) >= parseInt(highestMatch[1]);
  }
  return false;
};

const PromoteStudentsModal: React.FC<PromoteStudentsModalProps> = ({
  isOpen,
  onClose,
  students,
  onPromote,
  highestGrade
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [step, setStep] = useState<'review' | 'auth'>('review');

  useEffect(() => {
    if (isOpen) {
      setStep('review');
      setAdminPassword('');
      setAdminAuthError('');
      setIsExecuting(false);
    }
  }, [isOpen]);

  const handleProceedToAuth = () => {
    setStep('auth');
  };

  const handleBackToReview = () => {
    setStep('review');
    setAdminPassword('');
    setAdminAuthError('');
  };

  const handleConfirmPromotion = async () => {
    if (!adminPassword.trim()) {
      setAdminAuthError('Please enter the admin password to authorize this action.');
      return;
    }

    setIsExecuting(true);
    setAdminAuthError('');

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify admin password
    const currentAdminPass = localStorage.getItem('munyaka_admin_pass') || 'munyaka5239';
    
    if (adminPassword !== currentAdminPass) {
      setAdminAuthError('Invalid admin password. Authorization required to promote learners.');
      setIsExecuting(false);
      return;
    }

    // Perform promotion
    const promoted = students.map(student => {
      const nextGrade = getNextGrade(student.grade);
      const isHighest = isHighestGrade(student.grade, highestGrade);
      return {
        ...student,
        grade: nextGrade,
        status: (isHighest ? 'Graduated' : student.status) as 'Active' | 'Graduated' | 'Archived'
      };
    });

    onPromote(promoted);
    setIsExecuting(false);
    onClose();
    showSuccess('Students have been promoted successfully!');
  };

  const footer = step === 'review' ? (
    <>
      <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold h-12 px-6">
        Cancel
      </Button>
      <Button 
        onClick={handleProceedToAuth} 
        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 h-12 shadow-lg shadow-indigo-100 gap-2"
      >
        Proceed to Authorization <ArrowRight size={16} />
      </Button>
    </>
  ) : (
    <>
      <Button variant="ghost" onClick={handleBackToReview} disabled={isExecuting} className="rounded-xl font-bold h-12 px-6">
        Back
      </Button>
      <Button 
        onClick={handleConfirmPromotion} 
        disabled={isExecuting}
        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 h-12 shadow-lg shadow-indigo-100 gap-2"
      >
        {isExecuting ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
        Confirm Promotion
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'review' ? "Review Promotion" : "Admin Authorization"}
      description={
        step === 'review' 
          ? `Review the ${students.length} students who will be promoted to the next grade level.`
          : 'Enter your admin password to authorize this grade promotion.'
      }
      maxWidth="max-w-3xl"
      footer={footer}
    >
      {step === 'review' ? (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-bold text-amber-900">⚠️ Critical Action</p>
              <p className="text-xs text-amber-700 mt-0.5">
                This action will permanently change student grades. Students in the highest grade ({highestGrade}) will be marked as "Graduated".
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Users size={12} /> {students.length} students will be promoted
            </p>
            
            <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
              {students.map(student => {
                const nextGrade = getNextGrade(student.grade);
                const isHighest = isHighestGrade(student.grade, highestGrade);
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{student.name}</p>
                        <p className="text-[11px] text-slate-500">Stream: {student.stream}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 font-medium">{student.grade}</span>
                      <ArrowRight size={12} className="text-slate-400" />
                      <span className={cn(
                        "font-bold px-2 py-0.5 rounded-md text-xs",
                        isHighest 
                          ? "text-emerald-700 bg-emerald-50" 
                          : "text-indigo-700 bg-indigo-50"
                      )}>
                        {isHighest ? "Graduated" : nextGrade}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="text-amber-600" size={32} />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-slate-900">Admin Password Required</p>
              <p className="text-sm text-slate-500 mt-1">
                You are about to promote {students.length} students. Enter your admin password to authorize this action.
              </p>
            </div>
          </div>

          {adminAuthError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
              <AlertCircle size={16} className="shrink-0" />
              {adminAuthError}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Admin Password</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value);
                if (adminAuthError) setAdminAuthError('');
              }}
              placeholder="••••••••"
              className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-lg"
              autoFocus
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PromoteStudentsModal;