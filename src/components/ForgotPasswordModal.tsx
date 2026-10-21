import React, { useState } from 'react';
import { X, KeyRound, ArrowRight, Loader2, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { auth, db } from '@/config/firebase';
import { signInWithEmailAndPassword, updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { saveAdminPassword } from '@/services/adminCredentials';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

const ADMIN_EMAILS = [
  'jamesndiki@gmail.com',
  'admin@munyaka.sc.ke',
  'sysadmin@munyaka.sc.ke',
  'munyaka2026',
  'ownerpass2026',
  'sysadmin2026',
];

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ open, onClose }) => {
  const [identifier, setIdentifier] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'input' | 'success' | 'admin_reset'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useAuth();

  if (!open) return null;

  const handleClose = () => {
    setIdentifier('');
    setNewPin('');
    setConfirmPin('');
    setStep('input');
    setIsLoading(false);
    onClose();
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = identifier.trim().toLowerCase();
    if (!trimmed) {
      toast.error('Please enter your email or admin username.');
      return;
    }

    setIsLoading(true);
    try {
      const isAdminMatch = ADMIN_EMAILS.some(ae => ae.toLowerCase() === trimmed);
      if (isAdminMatch) {
        setStep('admin_reset');
        setIsLoading(false);
        return;
      }

      // Standard user password reset email via Firebase Auth
      if (auth) {
        try {
          await sendPasswordResetEmail(auth, identifier.trim());
        } catch (fbErr: any) {
          console.warn('Firebase sendPasswordResetEmail warning:', fbErr);
        }
      }
      setStep('success');
    } catch (err: any) {
      console.error('Password reset lookup error:', err);
      toast.error(err.message || 'Failed to process password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminPinReset = async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    const trimmedPin = newPin.trim();
    if (!trimmedPin || trimmedPin.length < 4) {
      toast.error('Password must be at least 4 characters.');
      return;
    }
    if (trimmedPin !== confirmPin.trim()) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Synchronize Firebase Authentication password update
      if (auth) {
        try {
          if (!auth.currentUser) {
            const adminEmail = 'jamesndiki@gmail.com';
            const oldPass = localStorage.getItem('munyaka_admin_password') || 'munyaka5239';
            try {
              await signInWithEmailAndPassword(auth, adminEmail, oldPass);
            } catch {
              // Ignore offline/mismatch sign-in error
            }
          }
          if (auth.currentUser) {
            await updatePassword(auth.currentUser, trimmedPin);
          }
        } catch (fbAuthErr: any) {
          console.warn('Firebase Auth updatePassword warning:', fbAuthErr);
        }
      }

      // 2. Save admin PIN override across local storage & central adminCredentials service
      saveAdminPassword(trimmedPin);
      localStorage.setItem('munyaka_admin_pin', trimmedPin);
      localStorage.setItem('munyaka_owner_pin', trimmedPin);
      localStorage.setItem('munyaka_custom_pin', trimmedPin);
      localStorage.setItem('munyaka_admin_password', trimmedPin);
      localStorage.setItem('munyaka_owner_password', trimmedPin);
      localStorage.setItem('admin_pin', trimmedPin);

      // 3. Save to Firestore if connected
      if (db) {
        try {
          await setDoc(doc(db, 'system_config', 'admin_credentials'), {
            admin_pin: trimmedPin,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (fsErr) {
          console.warn('Firestore admin config sync warning:', fsErr);
        }
      }

      // 4. Close modal, clear any active session, and return to Login Screen
      try {
        await logout();
      } catch {
        // Fallback local cleanup
        localStorage.removeItem('munyaka_auth_user');
        localStorage.removeItem('munyaka_session');
        localStorage.removeItem('munyaka_admin_session');
      }

      toast.success("Password updated successfully. Please sign in with your new password.");
      handleClose();
    } catch (err: any) {
      console.error("Failed to update password:", err);
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-br from-indigo-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {step === 'admin_reset' ? 'Reset Admin Password' : 'Reset Password'}
              </h3>
              <p className="text-xs text-slate-500">
                {step === 'admin_reset' ? 'Set a new master password for your administrator account.' : 'Recover account access'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {step === 'input' && (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Account Email or Admin Username
                </label>
                <Input
                  type="text"
                  placeholder="e.g. jamesndiki@gmail.com or admin"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-11 rounded-2xl border-slate-200"
                  required
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Enter your registered account email or administrator username. Administrator accounts allow direct credential reset.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {step === 'admin_reset' && (
            <form onSubmit={handleAdminPinReset} className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900">
                  <span className="font-bold">Administrator Reset:</span> Setting a new master password for Firebase Auth, Firestore, and local storage simultaneously.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  New Administrator Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter new password (min 4 chars)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="h-11 rounded-2xl border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="h-11 rounded-2xl border-slate-200"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Update Password Now
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base">Check Your Inbox</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  If an account exists for <span className="font-medium text-slate-700">{identifier}</span>, a password reset email has been sent.
                </p>
              </div>
              <Button
                onClick={handleClose}
                className="w-full h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
              >
                Return to Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
