"use client";

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { School, Lock, Mail, Loader2, AlertCircle, GraduationCap, KeyRound, ShieldCheck } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { UserRole } from '@/types/auth-roles';
import { getSchools, validateMonthlyCodeAndActivate } from '@/services/AccessDatabaseService';

const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  // Tab state
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'activate'>('signin');

  // Sign In
  const [signinEmail, setSigninEmail] = useState('munyakaprimary@gmail.com');
  const [signinPassword, setSigninPassword] = useState('munyaka5239');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('teacher');
  const [regSchoolId, setRegSchoolId] = useState('school-main-01');

  // Activate
  const [activateEmail, setActivateEmail] = useState('');
  const [activateCode, setActivateCode] = useState('');

  const schools = getSchools();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const success = await login(signinEmail, signinPassword);
      if (success) {
        showSuccess(`Welcome back! Logged in as ${login ? (login as any)?.user?.role : 'User'}`);
        navigate(from, { replace: true });
      } else {
        setError("Invalid email or password. Please check your credentials.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      showError("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    const success = await register({
      fullName: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      role: regRole,
      school_id: regSchoolId
    });
    setIsSubmitting(false);
    if (success) {
      showSuccess("Account created! You can now sign in.");
      setSigninEmail(regEmail);
      setActiveTab('signin');
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activateEmail || !activateCode) {
      showError("Please enter both email and monthly code.");
      return;
    }
    setIsSubmitting(true);
    const res = validateMonthlyCodeAndActivate(activateCode, activateEmail);
    setIsSubmitting(false);
    if (res.success) {
      showSuccess(res.message);
      setSigninEmail(activateEmail);
      setActiveTab('signin');
    } else {
      showError(res.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-4 relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-2xl shadow-indigo-500/30 mb-4 ring-4 ring-indigo-500/20">
            <GraduationCap className="text-white" size={30} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Munyaka SMS</h1>
          <p className="text-slate-400 text-sm mt-1">Multi-School & Role Access Management</p>
        </div>

        <Card className="border-slate-700/60 bg-slate-900/80 text-slate-100 shadow-2xl backdrop-blur-md rounded-3xl overflow-hidden">
          <CardHeader className="pb-0 px-6 pt-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800/80 text-slate-400 rounded-2xl p-1 h-auto">
                <TabsTrigger value="signin" className="rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                  Register
                </TabsTrigger>
                <TabsTrigger value="activate" className="rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  Activate
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-6">
            {/* SIGN IN */}
            <TabsContent value="signin" className="mt-0 space-y-4">
              <CardDescription className="text-slate-400 text-xs">
                Access your school management portal
              </CardDescription>

              {error && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-400 text-sm font-semibold">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <Input
                      type="email"
                      value={signinEmail}
                      onChange={(e) => setSigninEmail(e.target.value)}
                      placeholder="name@school.ac.ke"
                      required
                      className="pl-10 bg-slate-800/60 border-slate-700 text-white rounded-xl h-12 font-medium placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <Input
                      type="password"
                      value={signinPassword}
                      onChange={(e) => setSigninPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="pl-10 bg-slate-800/60 border-slate-700 text-white rounded-xl h-12 font-medium placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Sign In to Portal'}
                </Button>
              </form>

              {/* Quick demo credentials */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Quick Demo Access</p>
                {[
                  { role: 'Owner', email: 'owner@munyaka.ac.ke', pass: 'munyaka5239' },
                  { role: 'Admin', email: 'munyakaprimary@gmail.com', pass: 'munyaka5239' },
                  { role: 'Teacher', email: 'teacher@munyaka.ac.ke', pass: 'password123' },
                  { role: 'Bursar', email: 'bursar@munyaka.ac.ke', pass: 'password123' },
                ].map(creds => (
                  <button
                    key={creds.email}
                    type="button"
                    onClick={() => { setSigninEmail(creds.email); setSigninPassword(creds.pass); setActiveTab('signin'); }}
                    className="w-full text-left flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-700/60 transition-colors group"
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{creds.role}</span>
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300">{creds.email}</span>
                  </button>
                ))}
              </div>
            </TabsContent>

            {/* REGISTER */}
            <TabsContent value="register" className="mt-0 space-y-3">
              <CardDescription className="text-slate-400 text-xs">
                Create a new staff account with a specific role
              </CardDescription>

              <form onSubmit={handleRegister} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Name *</Label>
                  <Input
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="John Kamau"
                    required
                    className="bg-slate-800/60 border-slate-700 text-white rounded-xl h-11"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email *</Label>
                  <Input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="john@munyaka.ac.ke"
                    required
                    className="bg-slate-800/60 border-slate-700 text-white rounded-xl h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Role</Label>
                    <Select value={regRole} onValueChange={(v) => setRegRole(v as UserRole)}>
                      <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white rounded-xl h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        <SelectItem value="owner">Owner (Super-Admin)</SelectItem>
                        <SelectItem value="admin">Admin (School-Admin)</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="bursar">Bursar</SelectItem>
                        <SelectItem value="librarian">Librarian</SelectItem>
                        <SelectItem value="storekeeper">Storekeeper</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">School</Label>
                    <Select value={regSchoolId} onValueChange={setRegSchoolId}>
                      <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white rounded-xl h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        {schools.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.school_name.split(' ')[0]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone</Label>
                  <Input
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+254 700..."
                    className="bg-slate-800/60 border-slate-700 text-white rounded-xl h-11"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Password *</Label>
                  <Input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-slate-800/60 border-slate-700 text-white rounded-xl h-11"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm mt-1"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Create Account'}
                </Button>
              </form>
            </TabsContent>

            {/* ACTIVATE */}
            <TabsContent value="activate" className="mt-0 space-y-4">
              <CardDescription className="text-slate-400 text-xs">
                Enter a monthly access code to activate or extend your access until 11:59:59 PM on the last day of the month.
              </CardDescription>

              <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">How it works</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  1. Enter the email you registered with<br />
                  2. Enter the monthly code shared by your administrator<br />
                  3. Your access is valid until 11:59:59 PM on the last day of the calendar month
                </p>
              </div>

              <form onSubmit={handleActivate} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <Input
                      type="email"
                      value={activateEmail}
                      onChange={(e) => setActivateEmail(e.target.value)}
                      placeholder="teacher@munyaka.ac.ke"
                      required
                      className="pl-10 bg-slate-800/60 border-slate-700 text-white rounded-xl h-11"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Access Code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" size={16} />
                    <Input
                      value={activateCode}
                      onChange={(e) => setActivateCode(e.target.value.toUpperCase())}
                      placeholder="MUNY-XXXX-XXXX"
                      required
                      className="pl-10 bg-slate-800/60 border-slate-700 text-white rounded-xl h-11 font-mono uppercase tracking-widest"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm mt-1"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Validate & Activate'}
                </Button>
              </form>

              <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-xl p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Demo Code</p>
                <code className="text-xs font-mono text-indigo-300">MUNY-89X2-7A9B</code>
                <p className="text-[10px] text-slate-500 mt-1">For Munyaka Primary school — current month only</p>
              </div>
            </TabsContent>
          </CardContent>

          <CardFooter className="border-t border-slate-800/60 py-3 px-6 text-center">
            <p className="text-[11px] text-slate-500">
              Multi-Tenant School Management System &middot; Munyaka SMS Platform
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
