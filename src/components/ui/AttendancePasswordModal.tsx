"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface AttendancePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  session: 'morning' | 'afternoon';
  onVerify: () => void;
  authError: string;
  setAuthError: (msg: string) => void;
  isVerifying: boolean;
  setIsVerifying: (val: boolean) => void;
}

const AttendancePasswordModal: React.FC<AttendancePasswordModalProps> = ({
  isOpen,
  onClose,
  studentId,
  session,
  onVerify,
  authError,
  setAuthError,
  isVerifying,
  setIsVerifying,
}) => {
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setAuthError('Password is required');
      return;
    }

    setIsVerifying(true);
    setAuthError('');

    const adminPass = localStorage.getItem('munyaka_admin_pass') || 'admin123';

    if (password === adminPass) {
      setIsVerifying(false);
      setAuthError('');
      onVerify();
      onClose();
    } else {
      setAuthError('Invalid admin password');
      setIsVerifying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Admin Verification Required"
      description={`Enter your admin password to modify ${session === 'morning' ? 'morning' : 'afternoon'} attendance for student ${studentId}.`}
      footer={
        <>
          {authError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold">
              <AlertCircle size={14} /> {authError}
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400">Admin Password</Label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 rounded-xl h-12 bg-slate-50 border-none font-bold"
                autoFocus
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl h-11 font-bold"
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8"
              onClick={handleSubmit}
              disabled={isVerifying || !password.trim()}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Verifying...
                </Button>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Authorize
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AttendancePasswordModal;