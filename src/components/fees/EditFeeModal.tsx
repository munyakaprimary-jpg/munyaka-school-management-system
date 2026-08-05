"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Modal from '@/components/ui/Modal';
import { Save, Loader2, AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from "@/lib/utils";

interface EditFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any; // The fee record being edited
  onSave: (studentId: string, termFee: number, feePaid: number, reason: string) => void;
}

const EditFeeModal: React.FC<EditFeeModalProps> = ({
  isOpen,
  onClose,
  student,
  onSave
}) => {
  const [termFee, setTermFee] = useState("");
  const [feePaid, setFeePaid] = useState("");
  const [reason, setReason] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [authError, setAuthError] = useState("");

  // Initialize form with current values when modal opens
  useEffect(() => {
    if (isOpen && student) {
      setTermFee(student.total.toString());
      setFeePaid(student.paid.toString());
      setReason("");
      setAdminPassword("");
      setAuthError("");
    }
  }, [isOpen, student]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminPassword.trim()) {
      setAuthError("Admin password is required");
      return;
    }

    const termFeeNum = parseFloat(termFee);
    const feePaidNum = parseFloat(feePaid);

    if (isNaN(termFeeNum) || termFeeNum < 0) {
      showError("Please enter a valid Term Fee");
      return;
    }

    if (isNaN(feePaidNum) || feePaidNum < 0) {
      showError("Please enter a valid Fee Paid amount");
      return;
    }

    setIsSaving(true);
    setAuthError("");

    // Simulate admin password verification
    await new Promise(resolve => setTimeout(resolve, 800));

    const currentAdminPass = localStorage.getItem('munyaka_admin_pass') || 'munyaka5239';

    if (adminPassword !== currentAdminPass) {
      setAuthError("Incorrect Admin Password");
      showError("Incorrect Admin Password");
      setIsSaving(false);
      return;
    }

    // Success - call the onSave callback
    if (student) {
      onSave(student.id, termFeeNum, feePaidNum, reason.trim());
    }

    setIsSaving(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setAdminPassword("");
        setAuthError("");
        onClose();
      }}
      title="Edit Fee Record"
      description={`Modify fee details for ${student?.student || 'student'}`}
      footer={
        <div className="flex gap-2 justify-end w-full">
          <Button variant="ghost" onClick={onClose} disabled={isSaving} className="rounded-xl font-bold h-11 px-6">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-11 px-8 text-white shadow-lg shadow-indigo-100 gap-2"
          >
            {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} />}
            Save Changes
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-5">
        <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-start gap-3">
          <Shield className="text-amber-600 shrink-0 mt-1" size={20} />
          <p className="text-xs text-amber-800/80 leading-relaxed font-medium">
            This action requires admin authorization. Changes will update the student's balance and status immediately.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Term Fee (KES)</Label>
            <Input 
              type="number"
              min="0"
              value={termFee}
              onChange={(e) => { setTermFee(e.target.value); setAuthError(""); }}
              placeholder="e.g. 15000"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-900"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Fee Paid (KES)</Label>
            <Input 
              type="number"
              min="0"
              value={feePaid}
              onChange={(e) => { setFeePaid(e.target.value); setAuthError(""); }}
              placeholder="e.g. 10000"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-900"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Adjustment Reason / Notes</Label>
          <Textarea 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Partial payment received, fee waiver, correction..."
            className="rounded-xl bg-slate-50 border-none min-h-[80px]"
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Admin Password</Label>
          <div className="relative">
            <Input 
              type={showPassword ? "text" : "password"}
              value={adminPassword}
              onChange={(e) => { setAdminPassword(e.target.value); setAuthError(""); }}
              placeholder="••••••••"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold text-lg pr-12"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {authError && (
            <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
              <AlertCircle size={12} /> {authError}
            </p>
          )}
        </div>

        {/* Preview of calculated balance */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Term Fee</p>
              <p className="text-lg font-black text-slate-900">KES {parseFloat(termFee || "0").toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Fee Paid</p>
              <p className="text-lg font-black text-emerald-600">KES {parseFloat(feePaid || "0").toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Balance</p>
              <p className={cn("text-lg font-black", parseFloat(termFee || "0") - parseFloat(feePaid || "0") > 0 ? "text-rose-600" : "text-emerald-600")}>
                KES {Math.max(0, parseFloat(termFee || "0") - parseFloat(feePaid || "0")).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditFeeModal;