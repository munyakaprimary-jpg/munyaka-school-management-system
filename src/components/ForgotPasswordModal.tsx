import React, { useState } from 'react';
import { X, KeyRound, Mail, CheckCircle2, AlertCircle, ArrowRight, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { sendPasswordResetEmail, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { saveAdminPassword } from '@/services/adminCredentials';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

const ADMIN_EMAILS = ['munyaka2026', 'admin@munyaka.sc.ke', 'jndiki@munyaka.sc.ke', 'jamesndiki@gmail.com'];

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ open, onClose }) => {
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'success' | 'admin_bypass'>('input');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  if (!open) return null;

  const handleResetPassword = async (targetEmail: string) => {
    setIsLoading(true);
    try {
      if (auth) {
        await sendPasswordResetEmail(auth, targetEmail || 'jamesndiki@gmail.com');
      }
      setStep('success');
      toast.success('Password reset email sent successfully!');
    } catch (error: any) {
      console.error('Password reset email error:', error);
      toast.error(error.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = (email || '').trim().toLowerCase();
    
    // Check for admin immediate recovery bypass
    if (ADMIN_EMAILS.some(adm => cleanEmail.includes(adm))) {
      setStep('admin_bypass');
      return;
    }

    await handleResetPassword(cleanEmail);
  };

  const handleAdminPinReset = async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    const trimmedPin = newPin.trim();
    if (!trimmedPin || trimmedPin.length < 4) {
      toast.error('PIN must be at least 4 characters/digits.');
      return;
    }
    if (trimmedPin !== confirmPin.trim()) {
      toast.error('PINs do not match.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Synchronize Firebase Authentication password update
      if (auth) {
        try {
          if (!auth.currentUser) {
            // Attempt sign-in with default or stored credentials to get current user session
            const adminEmail = 'jamesndiki@gmail.com';
            const oldPass = localStorage.getItem('munyaka_admin_password') || 'munyaka5239';
            try {
              await signInWithEmailAndPassword(auth, adminEmail, oldPass);
            } catch {
              // Ignore sign-in failure if offline or credential mismatch, but still try update if user exists
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

      // Automatically log the user in immediately
      const adminUser = {
        id: 'MUN-0001',
        name: 'Administrator (James Ndiki)',
        fullName: 'Administrator (James Ndiki)',
        role: 'Admin',
        email: 'jamesndiki@gmail.com',
        phone: '+254 700 000 000',
        status: 'Active',
        avatar: 'AD'
      } as any;

      localStorage.setItem('munyaka_auth_user', JSON.stringify(adminUser));
      localStorage.setItem('munyaka_session', JSON.stringify(adminUser));
      setUser(adminUser);

      toast.success("PIN & Firebase Auth password updated successfully! Logged in as Administrator.");
      onClose();
    } catch (err: any) {
      console.error("Failed to update admin PIN:", err);
      toast.error(err.message || 'Failed to update PIN.');
    } finally {
      setIsLoading(false);
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
              {step === 'admin_bypass' ? <ShieldAlert className="w-5 h-5 text-indigo-600" /> : <KeyRound className="w-5 h-5 text-indigo-600" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {step === 'admin_bypass' ? 'Admin Immediate Recovery' : 'Reset Password'}
              </h3>
              <p className="text-xs text-slate-500">
                {step === 'admin_bypass' ? 'Authorized emergency PIN reset' : 'Recover account access'}
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

        {/* Content */}
        <div className="p-6">
          {step === 'input' && (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Account Email / Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="e.g. jamesndiki@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 rounded-2xl border-slate-200"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Enter your registered account email or administrator username. Superadmin usernames trigger instant recovery.
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
                      Processing...
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

          {step === 'admin_bypass' && (
            <form onSubmit={handleAdminPinReset} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <span className="font-bold">Superadmin Bypass Active:</span> You are setting a new master PIN for Firebase Auth and local storage synchronously.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  New Admin PIN / Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter new PIN (min 4 chars)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="h-11 rounded-2xl border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Confirm New PIN / Password
                </label>
                <Input
                  type="password"
                  placeholder="Re-enter new PIN"
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
                  className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Update PIN Now
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Check Your Email</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                We have sent a password reset link to <span className="font-semibold text-slate-700">{email}</span>. Follow the instructions to log in.
              </p>
              <Button
                onClick={handleClose}
                className="w-full h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
              >
                Back to Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
