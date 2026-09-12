"use client";

import React from 'react';
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, AlertCircle, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  authPassword: string;
  setAuthPassword: (value: string) => void;
  authError: string;
  setAuthError: (value: string) => void;
  isVerifying: boolean;
  setIsVerifying: (value: boolean) => void;
  studentToDelete: { id: string; name: string } | null;
  onVerify: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  authPassword,
  setAuthPassword,
  authError,
  setAuthError,
  isVerifying,
  setIsVerifying,
  studentToDelete,
  onVerify
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Admin Authorization Required"
      description={`Enter your admin password to delete learner record for "${studentToDelete?.name ?? 'Unknown'}".`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
          <Button 
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-8" 
            onClick={onVerify}
            disabled={isVerifying}
          >
            {isVerifying ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Authorize Delete
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {authError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold animate-in slide-in-from-top-2">
            <AlertCircle size={14} /> {authError}
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Admin Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              type="password" 
              value={authPassword} 
              onChange={(e) => { setAuthPassword(e.target.value); setAuthError(""); }} 
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

export default AuthModal;