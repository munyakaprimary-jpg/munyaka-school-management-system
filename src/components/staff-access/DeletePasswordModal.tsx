"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle } from 'lucide-react';
import Modal from "@/components/ui/Modal";
import { PreRegisteredStaff } from '@/types/staff-access';

interface DeletePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: PreRegisteredStaff | null;
  onConfirm: () => void;
}

export const DeletePasswordModal: React.FC<DeletePasswordModalProps> = ({
  isOpen,
  onClose,
  staff,
  onConfirm
}) => {
  if (!staff) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Admin Password"
      description="This will reset the temporary access key for this staff member. This action cannot be undone."
      footer={
        <div className="flex gap-2 justify-end w-full">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
          <Button className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold px-8" onClick={onConfirm}>
            <AlertTriangle size={16} className="mr-2" /> Delete Password
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3">
          <AlertTriangle className="text-rose-600" size={20} />
          <div>
            <p className="font-bold text-rose-800">Warning: This action is irreversible</p>
            <p className="text-sm text-rose-700">The temporary access key will be reset to a new random code.</p>
          </div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-600">
            Staff: <span className="font-bold">{staff.fullName}</span><br />
            Current Key: <span className="font-mono font-bold">{staff.tempAccessCode}</span>
          </p>
        </div>
      </div>
    </Modal>
  );
};