import React, { useState } from 'react';
import { X, KeyRound, Mail, CheckCircle2, AlertCircle, ArrowRight, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

const ADMIN_EMAILS = ['munyaka2026', 'admin@munyaka.sc.ke', 'jndiki@munyaka.sc.ke'];

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'success' | 'admin_bypass'>('input');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  if (!open) return null;

  const handleResetPassword = async (targetEmail: string) => {
    setIsLoading(true);
    try {
      // Trim and normalize email address
      const cleanEmail = targetEmail.trim().toLowerCase();
      
      await sendPasswordResetEmail(auth, cleanEmail);
      toast.success(`Password reset email sent to ${cleanEmail}`);
      setStep('success');
    } catch (error: any) {
      console.error("Firebase Password Reset Error:", error);
      toast.error(error.message || "Failed to send password reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // Check for admin immediate recovery bypass
    if (ADMIN_EMAILS.some(adm => cleanEmail.includes(adm))) {
      setStep('admin_bypass');
      return;
    }

    await handleResetPassword(cleanEmail);
  };

  const handleAdminPinReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || newPin.length < 4) {
      toast.error('PIN must be at least 4 characters/digits.');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('PINs do not match.');
      return;
    }

    // Save admin PIN override to localStorage for local safety guard
    try {
      const cleanEmail = email.trim().toLowerCase();
      localStorage.setItem(`admin_pin_${cleanEmail}`, newPin);
      localStorage.setItem('munyaka_current_pin', newPin);
      toast.success('Admin PIN successfully reset locally!');
      setStep('success');
    } catch (err: any) {
      toast.error('Failed to save PIN locally.');
    }
  };

  const handleClose = () => {
    setEmail('');
    setStep('input');
    setNewPin('');
    setConfirmPin('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-br from-indigo-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {step === 'admin_bypass' ? 'Admin Immediate Recovery' : 'Reset Password'}
              </h2>
              <p className="text-sm text-slate-600">
                {step === 'admin_bypass' ? 'Local Safe Guard Bypass' : 'Firebase Authentication'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full hover:bg-white/60 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {step === 'success' ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {ADMIN_EMAILS.some(adm => email.trim().toLowerCase().includes(adm)) ? 'Admin PIN Reset Complete' : 'Check your inbox'}
                </h3>
                <p className="text-sm text-slate-600 max-w-xs mx-auto">
                  {ADMIN_EMAILS.some(adm => email.trim().toLowerCase().includes(adm))
                    ? `Your local administrative PIN for ${email} has been updated successfully.`
                    : `We've sent a password reset email to <span className="font-semibold text-slate-900">${email}</span>.`}
                </p>
              </div>
              <div className="pt-2">
                <Button
                  onClick={handleClose}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-11"
                >
                  Back to Sign In
                </Button>
              </div>
            </div>
          ) : step === 'admin_bypass' ? (
            <form onSubmit={handleAdminPinReset} className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-sm">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Admin Safe Guard Detected</span>
                  Account <span className="font-mono">{email}</span> is recognized as an administrator. You may bypass email delivery and reset your local PIN immediately on screen.
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  New Admin PIN / Password
                </label>
                <Input
                  type="password"
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Enter new PIN"
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Confirm Admin PIN
                </label>
                <Input
                  type="password"
                  required
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Confirm new PIN"
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('input')}
                  className="flex-1 rounded-xl h-11"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-11"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Update PIN Now
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-sm text-slate-600">
                Enter your account's email address and we will send you a secure password reset link via Firebase Auth.
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 rounded-xl h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-11"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
