"use client";

import React from 'react';
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from 'lucide-react';

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
            <Select value={regGrade} onValueChange={setRegGrade}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {[1,2,3,4,5,6,7,8].map(n => <SelectItem key={n} value={n.toString()}>Grade {n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Stream</Label>
            <Select value={regStream} onValueChange={setRegStream}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Blue">Blue</SelectItem>
                <SelectItem value="Green">Green</SelectItem>
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