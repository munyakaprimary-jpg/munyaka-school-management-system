"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from '@/components/ui/Modal';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';

interface DeleteAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  studentName: string | null;
  isVerifying: boolean;
  authError: string;
}

export const DeleteAuthModal: React.FC<DeleteAuthModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  studentName,
  isVerifying,
  authError
}) => {
  const [authPassword, setAuthPassword] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setAuthPassword("");
        onClose();
      }}
      title="Admin Authorization Required"
      description={`Enter your admin password to delete learner record for "${studentName}".`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
          <Button 
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-8" 
            onClick={handleSubmit}
            disabled={isVerifying}
          >
            {isVerifying ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Authorize Delete
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
              onChange={(e) => { setAuthPassword(e.target.value); }} 
              placeholder="••••••••" 
              className="pl-10 rounded-xl h-12 bg-slate-50 border-none font-bold"
              autoFocus
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};