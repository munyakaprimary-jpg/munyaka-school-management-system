"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from 'lucide-react';
import { useGradesStreams } from '@/hooks/useGradesStreams';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullName: string;
  setFullName: (value: string) => void;
  assessmentNo: string;
  setAssessmentNo: (value: string) => void;
  regGrade: string;
  setRegGrade: (value: string) => void;
  regStream: string;
  setRegStream: (value: string) => void;
  guardianName: string;
  setGuardianName: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  onRegister: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  fullName,
  setFullName,
  assessmentNo,
  setAssessmentNo,
  regGrade,
  setRegGrade,
  regStream,
  setRegStream,
  guardianName,
  setGuardianName,
  phone,
  setPhone,
  address,
  setAddress,
  onRegister
}) => {
  const { grades, streams, isLoading } = useGradesStreams();

  // Dynamically get streams for the selected grade from central store
  const availableStreams = useMemo(() => {
    if (!regGrade) return [];
    return streams.filter(s => s.gradeId === regGrade);
  }, [streams, regGrade]);

  // Reset stream when grade changes and no longer matches available streams
  useEffect(() => {
    if (regStream && availableStreams.length > 0 && !availableStreams.some(s => s.name === regStream)) {
      setRegStream(availableStreams[0]?.name || '');
    }
  }, [regGrade, availableStreams, regStream, setRegStream]);

  // Set default grade when modal opens
  useEffect(() => {
    if (isOpen && !regGrade && grades.length > 0) {
      setRegGrade(grades[0].id);
    }
  }, [isOpen, grades, regGrade, setRegGrade]);

  // Get unique streams for the filter dropdown
  const uniqueStreams = useMemo(() => {
    const streamNames = new Set<string>();
    streams.forEach(s => streamNames.add(s.name));
    return Array.from(streamNames).sort();
  }, [streams]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register New Student" description="Enroll learner into the academic system." footer={<><Button variant="ghost" className="rounded-xl h-12 px-6 font-bold" onClick={onClose}>Cancel</Button><Button className="rounded-xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black gap-2 shadow-lg shadow-indigo-100" onClick={onRegister}><UserPlus size={18} /> Register Student</Button></>} maxWidth="max-w-xl">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Assessment No.</Label>
            <Input value={assessmentNo} onChange={(e) => setAssessmentNo(e.target.value)} placeholder="A100200" className="uppercase rounded-xl h-12 bg-slate-50 border-none font-bold" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Grade Level</Label>
            <Select value={regGrade} onValueChange={(val) => {
              setRegGrade(val);
              setRegStream('');
            }} disabled={isLoading}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold disabled:opacity-50">
                <SelectValue placeholder={isLoading ? "Loading grades..." : "Select grade"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {isLoading ? (
                  <SelectItem disabled value="">Loading grades...</SelectItem>
                ) : grades.length === 0 ? (
                  <SelectItem disabled value="">No grades configured</SelectItem>
                ) : (
                  grades.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name} ({g.category})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Stream</Label>
            <Select value={regStream} onValueChange={setRegStream} disabled={!regGrade || availableStreams.length === 0 || isLoading}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                <SelectValue placeholder={!regGrade ? "Select grade first..." : availableStreams.length === 0 ? "No streams available" : "Choose stream..."} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {availableStreams.map(s => (
                  <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Guardian Name</Label>
            <Input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Name" className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254" className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Physical Location</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Eldoret" className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
        </div>
      </div>
    </Modal>
  );
};

export default RegisterModal;