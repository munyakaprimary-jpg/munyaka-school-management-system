"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "@/components/ui/Modal";
import { Lock, AlertCircle, Loader2 } from 'lucide-react';

interface DeleteAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: () => void;
  isVerifying: boolean;
  authPassword: string;
  setAuthPassword: (value: string) => void;
  authError: string;
  setAuthError: (value: string) => void;
  targetName: string | null;
}

const DeleteAuthModal: React.FC<DeleteAuthModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  isVerifying,
  authPassword,
  setAuthPassword,
  authError,
  setAuthError,
  targetName
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Admin Authorization Required"
      description={`Enter your admin password to delete "${targetName}".`}
      footer={
        <>
          <Button variant="ghost" className="rounded-xl font-bold" onClick={onClose}>Cancel</Button>
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

export default DeleteAuthModal;