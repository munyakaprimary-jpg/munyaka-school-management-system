"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const { user, loginWithCredentials, signUp } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('teacher');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If user is already logged in, route immediately
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
    } else if (res.redirectUrl) {
      toast.success("Welcome back! Access granted.");
      navigate(res.redirectUrl);
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
      toast.success("Registration successful! Please sign in.");
      setActiveTab('signin');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-emerald-500/30">
      <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-950/50 mb-2">
            <Shield size={28} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Munyaka Portal</h1>
          <p className="text-xs text-slate-400 font-medium">Single-Stage Closed-Loop Authentication System</p>
        </div>

        {/* Auth Container Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* ERROR BANNER */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs font-semibold flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

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
                Sign In <ArrowRight size={16} />
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

        {/* Demo Credentials Footer */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-[11px] text-slate-400 space-y-1.5">
          <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Pre-Configured Accounts (Password: <code className="text-emerald-400">PASSWORD123</code>):</p>
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