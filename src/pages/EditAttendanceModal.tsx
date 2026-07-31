"use client";

import React from 'react';
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, AlertCircle, Loader2 } from "lucide-react";

interface EditAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: () => void;
  studentId: number | null;
  verifyPassword: string;
  setVerifyPassword: (value: string) => void;
  error: string;
  setError: (value: string) => void;
  isVerifying: boolean;
  setIsVerifying: (value: boolean) => void;
}

export const EditAttendanceModal: React.FC<EditAttendanceModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  studentId,
  verifyPassword,
  setVerifyPassword,
  error,
  setError,
  isVerifying
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Admin Authorization Required"
      description="Enter admin password to modify attendance records."
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">
            Cancel
          </Button>
          <Button
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-8"
            onClick={onVerify}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold animate-in slide-in-from-top-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Admin Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              type="password"
              value={verifyPassword}
              onChange={(e) => {
                setVerifyPassword(e.target.value);
                if (error) setError("");
              }}
              placeholder="••••••••"
              className="pl-10 rounded-xl h-12 bg-slate-50 border-none font-bold"
              autoFocus
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditAttendanceModal;