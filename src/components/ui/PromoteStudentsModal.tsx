"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Modal from '@/components/ui/Modal';
import { GraduationCap, AlertTriangle, Users, Calendar, Info, CheckCircle } from 'lucide-react';
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

const PromoteStudentsModal = ({ 
  isOpen, 
  onClose, 
  students, 
  onPromote, 
  highestGrade 
}: PromoteStudentsModalProps) => {
  const [step, setStep] = useState(1);
  const [understandChecked, setUnderstandChecked] = useState(false);
  const [promoteText, setPromoteText] = useState('');
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotedStudents, setPromotedStudents] = useState<Student[]>([]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setUnderstandChecked(false);
      setPromoteText('');
      setPromotedStudents([]);
    }
  }, [isOpen]);

  const getNextGrade = (currentGrade: string): string => {
    const gradeMatch = currentGrade.match(/Grade (\d+)/);
    if (gradeMatch) {
      const currentNum = parseInt(gradeMatch[1]);
      return `Grade ${currentNum + 1}`;
    }
    return currentGrade;
  };

  const isHighestGrade = (grade: string): boolean => {
    const gradeMatch = grade.match(/Grade (\d+)/);
    if (!gradeMatch) return false;
    
    const currentNum = parseInt(gradeMatch[1]);
    const highestNum = parseInt(highestGrade.replace('Grade ', ''));
    
    return currentNum >= highestNum;
  };

  const handlePromote = async () => {
    setIsPromoting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newPromotedStudents = students.map(student => {
      const nextGrade = getNextGrade(student.grade);
      const isHighest = isHighestGrade(student.grade);
      
      return {
        ...student,
        grade: isHighest ? nextGrade : nextGrade,
        status: isHighest ? 'Graduated' : student.status
      };
    });
    
    setPromotedStudents(newPromotedStudents);
    onPromote(newPromotedStudents);
    
    showSuccess(`Successfully promoted ${students.length} students!`);
    setIsPromoting(false);
    onClose();
  };

  const canProceed = understandChecked && promoteText === 'PROMOTE';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Promote Students to Next Grade"
      description="End-of-year grade promotion process. This action affects all active students."
      footer={
        <div className="flex gap-3 justify-end">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="rounded-xl font-bold"
            disabled={isPromoting}
          >
            Cancel
          </Button>
          {step === 1 ? (
            <Button 
              onClick={() => setStep(2)}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8"
            >
              Continue
            </Button>
          ) : (
            <Button 
              onClick={handlePromote}
              disabled={!canProceed || isPromoting}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8"
            >
              {isPromoting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Promoting...
                </div>
              ) : (
                'Execute Promotion'
              )}
            </Button>
          )}
        </div>
      }
    >
      {step === 1 ? (
        <div className="space-y-6">
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="text-amber-600 mt-1 shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-amber-800 mb-2">Critical Warning</h3>
                <p className="text-sm text-amber-700 leading-relaxed">
                  This will increment the grade of ALL active students by 1 level (e.g., Grade 6 becomes Grade 7). 
                  This action cannot be easily undone. Students in the highest grade will be marked as "Graduated".
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Users className="text-indigo-600" size={20} />
              <h4 className="font-bold text-slate-900">Promotion Summary</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Total Students:</span>
                <span className="font-bold text-slate-900">{students.length}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Highest Grade:</span>
                <span className="font-bold text-slate-900">{highestGrade}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sample Changes</p>
              {students.slice(0, 3).map((student) => {
                const nextGrade = getNextGrade(student.grade);
                const isHighest = isHighestGrade(student.grade);
                return (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-medium text-slate-700">{student.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{student.grade}</span>
                      <span className="text-slate-300">→</span>
                      <span className={cn(
                        "font-bold",
                        isHighest ? "text-emerald-600" : "text-indigo-600"
                      )}>
                        {nextGrade}
                      </span>
                      {isHighest && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                          Graduated
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Info className="text-blue-600 mt-0.5 shrink-0" size={18} />
              <div>
                <p className="text-xs font-bold text-blue-800 mb-1">What Happens During Promotion</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• All active students move up one grade level</li>
                  <li>• Students in highest grade become "Graduated"</li>
                  <li>• Streams/colors remain unchanged</li>
                  <li>• This is an irreversible action</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="text-indigo-600" size={20} />
              <h4 className="font-bold text-slate-900">Final Confirmation</h4>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">
                  I understand this is an end-of-year action*
                </Label>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="understand"
                    checked={understandChecked}
                    onCheckedChange={(checked) => setUnderstandChecked(checked as boolean)}
                    className="rounded border-slate-300"
                  />
                  <Label htmlFor="understand" className="text-sm font-medium text-slate-700">
                    I understand the consequences of this action
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promote-text" className="text-xs font-black uppercase text-slate-400 tracking-widest">
                  Type "PROMOTE" to confirm
                </Label>
                <Input
                  id="promote-text"
                  value={promoteText}
                  onChange={(e) => setPromoteText(e.target.value)}
                  placeholder="Type PROMOTE here"
                  className="rounded-xl h-12 font-mono text-center text-lg tracking-wider"
                />
              </div>
            </div>
          </div>

          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
            <p className="text-xs text-amber-800">
              <span className="font-bold">⚠️ Warning:</span> Once you execute the promotion, all changes will be applied immediately and cannot be rolled back. 
              Make sure you have a backup of your student data before proceeding.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};

// Helper function for cn (if not already imported)
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export default PromoteStudentsModal;