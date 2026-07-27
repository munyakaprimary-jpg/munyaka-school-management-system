"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/context/AuthContext';
import { Shield, KeyRound, Lock, Mail, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const { user, loginStage, pending2FAUser, loginWithCredentials, verify2FA, signUp, cancel2FA } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  
  // Credentials stage state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('teacher');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stage 2 2FA state
  const [totpCode, setTotpCode] = useState('');

  // If already logged in, redirect to role dashboard
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin/staff-and-roles');
      else if (user.role === 'teacher') navigate('/dashboard/teacher');
      else navigate('/dashboard/staff');
    }
  }, [user, navigate]);

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage("Please fill in both email and password.");
      return;
    }

    const res = loginWithCredentials(email, password);
    if (!res.success) {
      setErrorMessage(res.error || "Authentication failed.");
    } else {
      toast.success("Credentials verified. Complete Stage 2 Authentication.");
    }
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    const res = signUp(email, password, role);
    if (!res.success) {
      setErrorMessage(res.error || "Registration error.");
    } else {
      toast.success("Registration successful! Please log in.");
      setActiveTab('signin');
      setPassword('');
    }
  };

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = verify2FA(totpCode);
    if (!res.success) {
      setErrorMessage(res.error || "2FA verification failed.");
    } else if (res.redirectUrl) {
      toast.success("Security verification complete. Welcome back!");
      navigate(res.redirectUrl);
    }
  };

  const handleTotpChange = (val: string) => {
    // Sanitize input: digits only, max length 6
    const sanitized = val.replace(/\D/g, '').slice(0, 6);
    setTotpCode(sanitized);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-emerald-500/30">
      <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-950/50 mb-2">
            <Shield size={28} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Munyaka Secure Portal</h1>
          <p className="text-xs text-slate-400 font-medium">Closed-Loop Pre-Authorized Access System</p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* ERROR BANNER */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs font-semibold flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* STAGE 1: CREDENTIALS */}
          {loginStage === 'credentials' && (
            <div>
              {/* Tab Switcher */}
              <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl mb-6 border border-slate-800/80 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setActiveTab('signin'); setErrorMessage(null); }}
                  className={`py-2 rounded-xl transition-all ${activeTab === 'signin' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('signup'); setErrorMessage(null); }}
                  className={`py-2 rounded-xl transition-all ${activeTab === 'signup' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Register
                </button>
              </div>

              {activeTab === 'signin' ? (
                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <Input
                        type="email"
                        placeholder="e.g. admin@yourplatform.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 bg-slate-950 border-slate-800 rounded-xl h-11 text-xs text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <Input
                        type="password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 bg-slate-950 border-slate-800 rounded-xl h-11 text-xs text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 mt-2 gap-2">
                    Continue to 2FA <ArrowRight size={16} />
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignUpSubmit} className="space-y-4">
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300/90 font-medium">
                    Strict Guardrail Active: Your email must be pre-authorized by an administrator to create an account.
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <Input
                        type="email"
                        placeholder="Enter pre-authorized email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 bg-slate-950 border-slate-800 rounded-xl h-11 text-xs text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <Input
                        type="password"
                        placeholder="Choose password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 bg-slate-950 border-slate-800 rounded-xl h-11 text-xs text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Requested Role</Label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl h-11 px-3 text-xs text-slate-200 outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="teacher">Teacher</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <Button type="submit" className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 mt-2">
                    Create Account
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* STAGE 2: TOTP 2FA VERIFICATION */}
          {loginStage === '2fa' && pending2FAUser && (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold text-[10px]">
                    STAGE 2: TOTP 2FA
                  </Badge>
                  <p className="text-xs font-bold text-slate-300 mt-1">{pending2FAUser.email}</p>
                </div>
                <button
                  type="button"
                  onClick={cancel2FA}
                  className="text-xs text-slate-500 hover:text-slate-300 font-bold flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              </div>

              <form onSubmit={handle2FASubmit} className="space-y-4">
                <div className="space-y-2 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 mb-1">
                    <KeyRound size={22} />
                  </div>
                  <p className="text-xs font-bold text-slate-200">Enter 6-Digit Verification Code</p>
                  <p className="text-[11px] text-slate-400">
                    Enter authentication token or fallback test code: <code className="text-emerald-400 font-mono font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">123456</code>
                  </p>
                </div>

                <div className="space-y-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="0 0 0 0 0 0"
                    value={totpCode}
                    onChange={(e) => handleTotpChange(e.target.value)}
                    required
                    className="bg-slate-950 border-slate-800 rounded-2xl h-14 text-center font-mono text-2xl tracking-[0.5em] text-emerald-400 font-bold placeholder:text-slate-700 placeholder:tracking-normal focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                  <p className="text-[10px] text-slate-500 text-center font-medium">Numeric characters only (Capped at 6 digits)</p>
                </div>

                <Button
                  type="submit"
                  disabled={totpCode.length !== 6}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 gap-2"
                >
                  Authenticate Session <CheckCircle2 size={16} />
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Demo Credentials Footer */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-[11px] text-slate-400 space-y-1.5">
          <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Pre-Configured Accounts (Password: <code className="text-emerald-400">password123</code>):</p>
          <div className="grid grid-cols-1 gap-1 text-slate-400 font-mono">
            <div>• Admin: <span className="text-emerald-400">admin@yourplatform.com</span></div>
            <div>• Teacher: <span className="text-emerald-400">teacher@munyaka.sc.ke</span></div>
            <div>• Staff: <span className="text-emerald-400">staff@munyaka.sc.ke</span></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;