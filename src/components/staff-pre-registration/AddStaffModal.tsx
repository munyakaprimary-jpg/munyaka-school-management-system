"use client";

import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from "@/components/ui/Modal";
import { RefreshCw, Save } from 'lucide-react';
import { SYSTEM_ROLE_LABELS } from '@/types/staff-access';

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  tempAccessCode: string;
  setTempAccessCode: (value: string) => void;
  generateTempAccessCode: () => void;
}

const AddStaffModal: React.FC<AddStaffModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tempAccessCode,
  setTempAccessCode,
  generateTempAccessCode
}) => {
  const [formData, setFormData] = React.useState({
    fullName: "",
    nationalId: "",
    tscNumber: "",
    email: "",
    phone: "",
    systemRole: "subject_teacher" as keyof typeof SYSTEM_ROLE_LABELS,
    department: "",
    assignedSubjects: "",
  });

  useEffect(() => {
    if (isOpen) {
      generateTempAccessCode();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, tempAccessCode });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        // Reset form
        setFormData({
          fullName: "",
          nationalId: "",
          tscNumber: "",
          email: "",
          phone: "",
          systemRole: "subject_teacher",
          department: "",
          assignedSubjects: "",
        });
      }}
      title="Add New Staff Member"
      description="Enter staff details to pre-register for system access."
      footer={
        <div className="flex gap-2 justify-end w-full">
          <Button variant="ghost" onClick={() => {
            onClose();
            setFormData({
              fullName: "",
              nationalId: "",
              tscNumber: "",
              email: "",
              phone: "",
              systemRole: "subject_teacher",
              department: "",
              assignedSubjects: "",
            });
          }} className="rounded-xl font-bold h-12 px-6">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-12 px-8 text-white shadow-lg shadow-indigo-100 gap-2">
            <Save size={16} /> Add Staff
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Full Name *</Label>
            <Input 
              name="fullName"
              value={formData.fullName} 
              onChange={handleChange} 
              placeholder="e.g. Jane Mwangi" 
              className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">National ID Number *</Label>
            <Input 
              name="nationalId"
              value={formData.nationalId} 
              onChange={handleChange} 
              placeholder="e.g. 28374615" 
              className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">TSC Number (Optional)</Label>
            <Input 
              name="tscNumber"
              value={formData.tscNumber} 
              onChange={handleChange} 
              placeholder="e.g. 482910" 
              className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">System Access Role *</Label>
            <Select 
              name="systemRole"
              value={formData.systemRole} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, systemRole: val as keyof typeof SYSTEM_ROLE_LABELS }))} 
            >
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {Object.keys(SYSTEM_ROLE_LABELS).map(role => (
                  <SelectItem key={role} value={role}>
                    {SYSTEM_ROLE_LABELS[role as keyof typeof SYSTEM_ROLE_LABELS].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Official Email *</Label>
            <Input 
              name="email"
              type="email"
              value={formData.email} 
              onChange={handleChange} 
              placeholder="e.g. jane@munyaka.sc.ke" 
              className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Phone Number *</Label>
            <Input 
              name="phone"
              value={formData.phone} 
              onChange={handleChange} 
              placeholder="+254 700 000 000" 
              className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Department</Label>
            <Input 
              name="department"
              value={formData.department} 
              onChange={handleChange} 
              placeholder="e.g. Mathematics & Science" 
              className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Subjects / Specialization (Comma-separated)</Label>
            <Input 
              name="assignedSubjects"
              value={formData.assignedSubjects} 
              onChange={handleChange} 
              placeholder="e.g. Mathematics, Science & Tech" 
              className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
              required
            />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-50">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Access Key (Auto-generated)</Label>
          <div className="flex gap-2">
            <Input 
              value={tempAccessCode} 
              readOnly 
              className="rounded-xl h-12 bg-slate-50 border-none font-bold text-center" 
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={generateTempAccessCode} 
              className="h-12 px-3 rounded-xl border-slate-200" 
            >
              <RefreshCw size={16} /> Generate New
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-1">Click to generate a new temporary access code</p>
        </div>
      </form>
    </Modal>
  );
};

export default AddStaffModal;