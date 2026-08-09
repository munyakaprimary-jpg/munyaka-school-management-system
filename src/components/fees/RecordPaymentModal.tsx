"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { CreditCard, AlertCircle } from 'lucide-react';
import { GRADES_DATA, STUDENTS, Grade } from '@/lib/mock-data';

interface StudentItem {
  id: string;
  name: string;
  assessment: string;
  grade: string;
  stream: string;
}

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPayment: (studentId: string, amount: number) => void;
  gradesData?: Grade[];
  studentsData?: StudentItem[];
}

const RecordPaymentModal = ({
  isOpen,
  onClose,
  onSubmitPayment,
  gradesData = GRADES_DATA,
  studentsData = STUDENTS,
}: RecordPaymentModalProps) => {
  // Cascading Selection States
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [selectedStreamId, setSelectedStreamId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Reset all fields when the modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedGradeId("");
      setSelectedStreamId("");
      setSelectedStudentId("");
      setAmount("");
      setErrorMsg("");
    }
  }, [isOpen]);

  // Derived Selected Objects
  const selectedGradeObj = useMemo(() => {
    return gradesData.find(g => g.id === selectedGradeId);
  }, [selectedGradeId, gradesData]);

  const availableStreams = useMemo(() => {
    return selectedGradeObj ? selectedGradeObj.streams : [];
  }, [selectedGradeObj]);

  const selectedStreamObj = useMemo(() => {
    return availableStreams.find(s => s.id === selectedStreamId);
  }, [selectedStreamId, availableStreams]);

  // Filtered Students matching Grade & Stream
  const filteredStudents = useMemo(() => {
    if (!selectedGradeObj || !selectedStreamObj) return [];

    const gradeNum = selectedGradeObj.name.replace(/[^0-9]/g, '');

    return studentsData.filter(s => {
      const matchesGrade = s.grade === gradeNum || s.grade === selectedGradeObj.name;
      const matchesStream = s.stream.toLowerCase() === selectedStreamObj.name.toLowerCase();
      return matchesGrade && matchesStream;
    });
  }, [selectedGradeObj, selectedStreamObj, studentsData]);

  // Handler: Grade Change -> Reset Stream and Learner
  const handleGradeChange = (gradeId: string) => {
    setSelectedGradeId(gradeId);
    setSelectedStreamId("");
    setSelectedStudentId("");
    setErrorMsg("");
  };

  // Handler: Stream Change -> Reset Learner
  const handleStreamChange = (streamId: string) => {
    setSelectedStreamId(streamId);
    setSelectedStudentId("");
    setErrorMsg("");
  };

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setErrorMsg("Please select a learner.");
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Please enter a valid payment amount.");
      return;
    }

    onSubmitPayment(selectedStudentId, numAmount);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Fee Payment"
      description="Select learner details step-by-step to post a fee payment."
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-xl font-bold h-11 px-6"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-11 px-8 shadow-lg shadow-indigo-100 gap-2 text-white"
          >
            <CreditCard size={18} /> Post Payment
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2.5 text-rose-600 text-xs font-bold">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {/* Step 1: Grade Level Selector */}
        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">
            1. Select Grade Level
          </Label>
          <Select value={selectedGradeId} onValueChange={handleGradeChange}>
            <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-100 font-bold text-slate-800">
              <SelectValue placeholder="Choose Grade Level..." />
            </SelectTrigger>
            <SelectContent>
              {gradesData.map(g => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name} ({g.category})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Step 2: Stream Selector (Disabled until Grade selected) */}
        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">
            2. Select Stream
          </Label>
          <Select
            value={selectedStreamId}
            onValueChange={handleStreamChange}
            disabled={!selectedGradeId || availableStreams.length === 0}
          >
            <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-100 font-bold text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed">
              <SelectValue
                placeholder={
                  !selectedGradeId
                    ? "Select a grade first..."
                    : availableStreams.length === 0
                    ? "No streams available for this grade"
                    : "Choose Stream..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableStreams.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  Stream {s.name} ({s.studentsCount} Learners)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Step 3: Learner Selector (Disabled until Grade & Stream selected) */}
        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">
            3. Select Learner
          </Label>
          <Select
            value={selectedStudentId}
            onValueChange={val => {
              setSelectedStudentId(val);
              setErrorMsg("");
            }}
            disabled={!selectedStreamId}
          >
            <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-100 font-bold text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed">
              <SelectValue
                placeholder={
                  !selectedStreamId
                    ? "Select grade and stream first..."
                    : filteredStudents.length === 0
                    ? "No registered learners in this stream"
                    : "Choose Learner..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} — Assessment #{student.assessment}
                  </SelectItem>
                ))
              ) : (
                studentsData.map(student => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} (Grade {student.grade} - {student.stream})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Step 4: Amount (KES) */}
        <div className="space-y-1.5 pt-2">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">
            4. Payment Amount (KES)
          </Label>
          <Input
            type="number"
            min="1"
            value={amount}
            onChange={e => {
              setAmount(e.target.value);
              setErrorMsg("");
            }}
            placeholder="e.g. 5000"
            className="rounded-xl h-12 bg-slate-50 border-slate-100 font-black text-lg focus:bg-white"
          />
        </div>
      </form>
    </Modal>
  );
};

export default RecordPaymentModal;