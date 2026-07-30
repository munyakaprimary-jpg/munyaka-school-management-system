"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Send, Mail } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { PreRegisteredStaff, SYSTEM_ROLE_LABELS } from '@/types/staff-access';

interface DispatchInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: PreRegisteredStaff | null;
  onConfirm: () => void;
}

const DispatchInviteModal = ({ isOpen, onClose, staff, onConfirm }: DispatchInviteModalProps) => {
  if (!staff) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispatch System Access Key"
      description="Send invitation credentials directly to the registered email address."
      footer={
        <div className="flex gap-2 justify-end w-full">
          <Button variant="ghost" className="rounded-xl font-bold" onClick={onClose}>Cancel</Button>
          <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 text-white" onClick={onConfirm}>
            <Send size={16} className="mr-2" /> Dispatch Invitation
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Recipient</p>
          <p className="text-lg font-bold text-slate-900">{staff.fullName}</p>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Mail size={14} className="text-slate-400" />
            <span>{staff.email}</span>
          </div>
        </div>

        <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
          <p className="text-xs font-black uppercase text-indigo-500 tracking-widest">Message Preview</p>
          <p className="text-xs text-slate-800 leading-relaxed font-medium">
            Dear {staff.fullName}, you have been pre-registered for the Munyaka Primary System Portal ({SYSTEM_ROLE_LABELS[staff.systemRole]?.label}). 
            Use your Temporary Access Key: <strong className="font-black text-indigo-700">{staff.tempAccessCode}</strong> along with your National ID ({staff.nationalId}) to activate your account.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default DispatchInviteModal;