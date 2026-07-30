"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Sparkles } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { SystemRole, PreRegisteredStaff } from '@/types/staff-access';

interface AddPreRegModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<PreRegisteredStaff>) => void;
}

const AddPreRegModal = ({ isOpen, onClose, onSubmit }: AddPreRegModalProps) => {
  const [formData, setFormData] = useState({
    fullName: "",
    nationalId: "",
    tscNumber: "",
    email: "",
    phone: "",
    systemRole: "subject_teacher" as SystemRole,
    department: "Languages & Humanities",
    assignedSubjects: "Mathematics, Science & Tech",
    tempAccessCode: ""
  });

  const generateRandomKey = () => {
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    setFormData(prev => ({ ...prev, tempAccessCode: `MUNYAKA-${randDigits}` }));
  };

  useEffect(() => {
    if (isOpen) generateRandomKey();
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pre-Register Staff for System Access"
      description="Authorize new teacher credentials and pre-assign system roles."
      maxWidth="max-w-2xl"
      footer={
        <div className="flex gap-2 justify-end w-full">
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold h-12 px-6">Cancel</Button>
          <Button onClick={handleSubmit} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-12 px-8 text-white shadow-lg shadow-indigo-100 gap-2">
            <Sparkles size={18} /> Pre-Authorize Access
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Full Name *</Label>
            <Input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="e.g. Jane Mwangi" className="rounded-xl h-12 bg-slate-50 border-none font-bold" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">National ID Number *</Label>
            <Input value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} placeholder="e.g. 28374615" className="rounded-xl h-12 bg-slate-50 border-none font-bold" required />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">TSC Number (Optional)</Label>
            <Input value={formData.tscNumber} onChange={e => setFormData({...formData, tscNumber: e.target.value})} placeholder="e.g. 482910" className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">System Access Role *</Label>
            <Select value={formData.systemRole} onValueChange={(val: SystemRole) => setFormData({...formData, systemRole: val})}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="subject_teacher">Subject Teacher</SelectItem>
                <SelectItem value="class_teacher">Class Teacher</SelectItem>
                <SelectItem value="senior_teacher">Senior Teacher</SelectItem>
                <SelectItem value="head_teacher">Head Teacher</SelectItem>
                <SelectItem value="bursar">Bursar / Accounts</SelectItem>
                <SelectItem value="support_admin">System Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Official Email *</Label>
            <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="e.g. jane@email.com" className="rounded-xl h-12 bg-slate-50 border-none font-bold" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Phone Number *</Label>
            <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+254..." className="rounded-xl h-12 bg-slate-50 border-none font-bold" required />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Department</Label>
            <Select value={formData.department} onValueChange={val => setFormData({...formData, department: val})}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="Mathematics & Science">Mathematics & Science</SelectItem>
                <SelectItem value="Languages & Humanities">Languages & Humanities</SelectItem>
                <SelectItem value="Technical & Vocational">Technical & Vocational</SelectItem>
                <SelectItem value="Creative Arts">Creative Arts</SelectItem>
                <SelectItem value="School Administration">School Administration</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Access Key</Label>
            <div className="flex gap-2">
              <Input value={formData.tempAccessCode} readOnly className="rounded-xl h-12 bg-slate-50 border-none font-black text-center" />
              <Button type="button" variant="outline" className="h-12 px-3 rounded-xl border-slate-200" onClick={generateRandomKey}><RefreshCw size={16} /></Button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddPreRegModal;