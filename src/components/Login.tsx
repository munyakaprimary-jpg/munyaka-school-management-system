import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, ShieldCheck, KeyRound, UserCheck, Lock, Mail } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { UserRole } from '@/types/auth-roles';
import { getSchools, validateMonthlyCodeAndActivate } from '@/services/AccessDatabaseService';

export const Login = () => {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'activate'>('login');

  // Login form
  const [loginEmail, setLoginEmail] = useState('munyakaprimary@gmail.com');
  const [loginPassword, setLoginPassword] = useState('munyaka5239');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('teacher');
  const [regSchoolId, setRegSchoolId] = useState('school-main-01');

  // Activate code form
  const [activateEmail, setActivateEmail] = useState('');
  const [activateCode, setActivateCode] = useState('');

  const schools = getSchools();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await login(loginEmail, loginPassword);
    setIsSubmitting(false);
    if (success) {
      showSuccess("Welcome back!");
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
      setActiveTab('login');
      setLoginEmail(regEmail);
      setLoginPassword(regPassword);
    }
  };

  const handleActivateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activateEmail || !activateCode) {
      showError("Please enter your email and monthly access code.");
      return;
    }
    setIsSubmitting(true);
    const res = validateMonthlyCodeAndActivate(activateCode, activateEmail);
    setIsSubmitting(false);
    if (res.success) {
      showSuccess(res.message);
      setLoginEmail(activateEmail);
      setActiveTab('login');
    } else {
      showError(res.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-xl mb-4 ring-4 ring-indigo-500/30">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Munyaka SMS</h1>
          <p className="text-slate-300 text-sm mt-1">Multi-School & Role Access Management Platform</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/90 text-slate-100 shadow-2xl backdrop-blur-md">
          <CardHeader className="space-y-1 pb-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid grid-cols-3 bg-slate-800 text-slate-300">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
                <TabsTrigger value="activate">Activate</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="pt-2">
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email Address / Username</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="login-email"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@school.ac.ke"
                      className="pl-10 bg-slate-800/80 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-pass">Password</Label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="login-pass"
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 bg-slate-800/80 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="text-xs text-slate-400 bg-indigo-950/60 p-3 rounded-lg border border-indigo-900/50">
                  <p className="font-semibold text-indigo-300 mb-1">Demo Quick Logins:</p>
                  <p>• Owner: <span className="text-white font-mono">owner@munyaka.ac.ke</span> (munyaka5239)</p>
                  <p>• Admin: <span className="text-white font-mono">munyakaprimary@gmail.com</span> (munyaka5239)</p>
                  <p>• Teacher: <span className="text-white font-mono">teacher@munyaka.ac.ke</span> (password123)</p>
                  <p>• Bursar: <span className="text-white font-mono">bursar@munyaka.ac.ke</span> (password123)</p>
                </div>

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : "Sign In to Portal"}
                </Button>
              </form>
            )}

            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="reg-name">Full Name</Label>
                  <Input
                    id="reg-name"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="John Doe"
                    className="bg-slate-800/80 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-email">Email Address</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="john@school.ac.ke"
                    className="bg-slate-800/80 border-slate-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="reg-role">Role</Label>
                    <Select value={regRole} onValueChange={(v) => setRegRole(v as UserRole)}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        <SelectItem value="owner">Owner (Super Admin)</SelectItem>
                        <SelectItem value="admin">Admin (School Admin)</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="bursar">Bursar</SelectItem>
                        <SelectItem value="librarian">Librarian</SelectItem>
                        <SelectItem value="storekeeper">Storekeeper</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reg-school">School</Label>
                    <Select value={regSchoolId} onValueChange={setRegSchoolId}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        {schools.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.school_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-phone">Phone Number</Label>
                  <Input
                    id="reg-phone"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+254 700..."
                    className="bg-slate-800/80 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-pass">Password</Label>
                  <Input
                    id="reg-pass"
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-slate-800/80 border-slate-700 text-white"
                  />
                </div>

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 mt-2" disabled={isSubmitting}>
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            )}

            {activeTab === 'activate' && (
              <form onSubmit={handleActivateCode} className="space-y-4">
                <div className="text-xs text-slate-300 bg-blue-950/40 p-3 rounded-lg border border-blue-900/60 leading-relaxed">
                  <p className="font-semibold text-blue-300 mb-1">Monthly Access Verification</p>
                  Enter your registered account email and the current monthly access code (e.g. <code className="text-indigo-300 font-mono">MUNY-89X2-7A9B</code>) to validate your access until 11:59:59 PM on the last day of the calendar month.
                </div>

                <div className="space-y-2">
                  <Label htmlFor="act-email">Account Email</Label>
                  <Input
                    id="act-email"
                    type="email"
                    required
                    value={activateEmail}
                    onChange={(e) => setActivateEmail(e.target.value)}
                    placeholder="teacher@munyaka.ac.ke"
                    className="bg-slate-800/80 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="act-code">Monthly Access Code</Label>
                  <Input
                    id="act-code"
                    required
                    value={activateCode}
                    onChange={(e) => setActivateCode(e.target.value)}
                    placeholder="MUNY-XXXX-XXXX"
                    className="bg-slate-800/80 border-slate-700 text-white font-mono uppercase tracking-wider"
                  />
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5" disabled={isSubmitting}>
                  {isSubmitting ? "Verifying..." : "Validate & Activate Access"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-800/80 py-3 text-xs text-slate-400">
            Secure Multi-Tenant School Management System
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
