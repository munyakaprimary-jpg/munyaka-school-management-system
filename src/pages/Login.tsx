import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Loader2,
  Shield,
  Key,
  Eye,
  EyeOff,
  Settings2,
  ShieldAlert,
  Unlock,
  Mail,
  User,
  GraduationCap,
  BookOpen,
  Package,
  Beaker,
  Monitor,
  Send,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { teacherLogin, checkServerHealth } from '@/services/mobileAuthService';
import { getApiBaseUrl } from '@/lib/apiBase';
import {
  MUNYAKA_ADMIN_PASSWORD,
  DEFAULT_ADMIN_PASSWORD,
  getActiveAdminPassword,
} from '@/services/adminCredentials';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';
import CoverPage from './CoverPage';

function getStaffRedirectPath(_systemRole: string): string {
  return '/dashboard';
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  const [showCover, setShowCover] = useState(true);

  // Admin form state
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState('');
  const [isAdminVerifying, setIsAdminVerifying] = useState(false);

  // Dev form state
  const [devPassword, setDevPassword] = useState('');
  const [showDevPassword, setShowDevPassword] = useState(false);
  const [devAuthError, setDevAuthError] = useState('');
  const [isDevVerifying, setIsDevVerifying] = useState(false);

  // Staff form state
  const [staffId, setStaffId] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffAuthError, setStaffAuthError] = useState('');
  const [isStaffVerifying, setIsStaffVerifying] = useState(false);
  const [selectedSupportRole, setSelectedSupportRole] = useState<string | null>(null);

  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'Dev' || (user as any).role === 'dev') {
        navigate('/dev/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Admin Login submission
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = String(adminPassword || '').trim().replace(/\n$/, '');
    if (!entered) {
      setAdminAuthError('Please enter your password.');
      return;
    }

    setIsAdminVerifying(true);
    setAdminAuthError('');
    await new Promise(r => setTimeout(r, 600));

    const activeStored = getActiveAdminPassword();
    const isValid = entered === activeStored || entered === DEFAULT_ADMIN_PASSWORD;

    if (!isValid) {
      setAdminAuthError('Invalid password for School Administrator.');
      showError('Authentication failed');
      setIsAdminVerifying(false);
      return;
    }

    const success = await login('sysadmin@munyaka.sc.ke', entered);
    if (success) {
      try {
        localStorage.setItem(
          'munyaka_user',
          JSON.stringify({ role: 'Admin', name: 'School Administrator', isAuthenticated: true })
        );
        localStorage.setItem(
          'munyaka_admin_session',
          JSON.stringify({ role: 'admin', roleLabel: 'School Administrator', roleIcon: 'settings', timestamp: Date.now() })
        );
      } catch { /* ignore */ }

      showSuccess('Welcome, School Administrator!');
      navigate('/admin/dashboard', { replace: true });
    } else {
      setAdminAuthError('Login failed. Please try again.');
      showError('Authentication failed');
    }
    setIsAdminVerifying(false);
  };

  // Dev Login submission
  const handleDevSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = String(devPassword || '').trim().replace(/\n$/, '');
    if (!entered) {
      setDevAuthError('Please enter your developer password.');
      return;
    }

    setIsDevVerifying(true);
    setDevAuthError('');
    await new Promise(r => setTimeout(r, 600));

    // Developer password check (default: dev2026 or override)
    const validDevPass = 'dev2026';
    const isValid = entered === validDevPass || entered === DEFAULT_ADMIN_PASSWORD;

    if (!isValid) {
      setDevAuthError('Invalid developer password.');
      showError('Authentication failed');
      setIsDevVerifying(false);
      return;
    }

    const success = await login('dev@munyaka.sc.ke', entered);
    if (success) {
      try {
        localStorage.setItem(
          'munyaka_user',
          JSON.stringify({ role: 'Dev', name: 'Developer', isAuthenticated: true })
        );
        localStorage.setItem(
          'munyaka_admin_session',
          JSON.stringify({ role: 'dev', roleLabel: 'Platform Developer', roleIcon: 'shield', timestamp: Date.now() })
        );
      } catch { /* ignore */ }

      showSuccess('Welcome, Developer!');
      navigate('/dev/dashboard', { replace: true });
    } else {
      setDevAuthError('Login failed. Please try again.');
      showError('Authentication failed');
    }
    setIsDevVerifying(false);
  };

  // Staff login submission
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = String(staffId || '').trim();
    const trimmedPass = String(staffPassword || '').trim();

    if (!trimmedId) {
      setStaffAuthError('Please enter your Email Address, TSC Number, or Staff ID.');
      return;
    }
    if (!trimmedPass) {
      setStaffAuthError('Please enter your Password.');
      return;
    }

    setIsStaffVerifying(true);
    setStaffAuthError('');

    let serverLoginSuccess = false;
    let serverLoginResult: any = null;

    try {
      const serverLoginPromise = teacherLogin(trimmedId, trimmedPass);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Server timeout')), 3000)
      );
      const result: any = await Promise.race([serverLoginPromise, timeoutPromise]);
      if (result.success) {
        serverLoginSuccess = true;
        serverLoginResult = result;
      }
    } catch {
      // Offline fallback
    }

    if (serverLoginSuccess && serverLoginResult) {
      const userData = {
        id: serverLoginResult.user.id,
        name: serverLoginResult.user.name,
        email: serverLoginResult.user.email || trimmedId,
        role: serverLoginResult.user.role || 'teacher',
        isAuthenticated: true,
      };
      try {
        localStorage.setItem('munyaka_session', JSON.stringify(userData));
        localStorage.setItem('munyaka_user', JSON.stringify(userData));
      } catch { /* ignore */ }

      showSuccess(`Welcome, ${serverLoginResult.user.name}!`);
      navigate('/dashboard', { replace: true });
      setIsStaffVerifying(false);
      return;
    }

    // Offline lookup
    let foundUser = null;
    const staffSources = ['munyaka_staff_directory', 'munyaka_staff', 'munyaka_staff_prereg'];
    for (const source of staffSources) {
      try {
        const staffData = localStorage.getItem(source);
        if (!staffData) continue;
        const staffArray = JSON.parse(staffData);
        if (!Array.isArray(staffArray)) continue;

        const userObj = staffArray.find((s: any) => {
          const emailMatch = s.email && s.email.toLowerCase().trim() === trimmedId.toLowerCase();
          const staffIdMatch = (s.staffId || s.ref || s.id) && (s.staffId || s.ref || s.id).toLowerCase() === trimmedId.toLowerCase();
          if (!emailMatch && !staffIdMatch) return false;
          const codeMatch = s.accessCode === trimmedPass || s.password === trimmedPass;
          return codeMatch;
        });
        if (userObj) {
          foundUser = userObj;
          break;
        }
      } catch {
        continue;
      }
    }

    if (foundUser) {
      const userData = {
        id: foundUser.id || foundUser.staffId || 'offline-id',
        name: foundUser.name || foundUser.fullName || 'Staff Member',
        email: foundUser.email || trimmedId,
        role: foundUser.systemRole || foundUser.role || 'staff',
        isAuthenticated: true,
      };
      try {
        localStorage.setItem('munyaka_session', JSON.stringify(userData));
        localStorage.setItem('munyaka_user', JSON.stringify(userData));
      } catch { /* ignore */ }

      showSuccess(`Welcome, ${userData.name}!`);
      navigate('/dashboard', { replace: true });
      setIsStaffVerifying(false);
      return;
    }

    setStaffAuthError('Invalid credentials or account not registered.');
    showError('Authentication failed');
    setIsStaffVerifying(false);
  };

  useEffect(() => {
    checkServerHealth().catch(() => {});
  }, []);

  if (showCover) {
    return <CoverPage onEnter={() => setShowCover(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-amber-50/20 flex flex-col overflow-y-auto">
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-2xl space-y-6 animate-in fade-in zoom-in-95 duration-500">

          {/* Header */}
          <div className="text-center space-y-3">
            <button
              type="button"
              onClick={() => setShowCover(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors mb-2 group"
            >
              <ArrowRight size={14} className="rotate-180 transition-transform group-hover:-translate-x-1" />
              <span>Back to Cover</span>
            </button>
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-600 to-amber-500 rounded-3xl shadow-2xl shadow-indigo-200 mb-2">
              <Shield size={32} className="text-white md:hidden" />
              <Shield size={40} className="text-white hidden md:inline" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Munyaka School Management
            </h1>
            <p className="text-sm md:text-base text-slate-500 font-medium max-w-md mx-auto">
              Select your role to access the appropriate portal
            </p>
          </div>

          {/* Tabs Container */}
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-12 rounded-2xl bg-slate-100 p-1 gap-1">
              <TabsTrigger
                value="admin"
                className="rounded-xl text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-slate-500 transition-all"
              >
                <Settings2 size={12} className="mr-1 shrink-0" />
                <span>ADMIN</span>
              </TabsTrigger>
              <TabsTrigger
                value="dev"
                className="rounded-xl text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm text-slate-500 transition-all"
              >
                <Shield size={12} className="mr-1 shrink-0" />
                <span>DEV</span>
              </TabsTrigger>
              <TabsTrigger
                value="staff"
                className="rounded-xl text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm text-slate-500 transition-all"
              >
                <User size={12} className="mr-1 shrink-0" />
                <span>STAFF</span>
              </TabsTrigger>
              <TabsTrigger
                value="support"
                className="rounded-xl text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm text-slate-500 transition-all"
              >
                <Briefcase size={12} className="mr-1 shrink-0" />
                <span>SUPPORT</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: ADMIN */}
            <TabsContent value="admin" className="mt-4 space-y-4">
              <Card className="border-none shadow-2xl rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl shadow-xl bg-indigo-50 text-indigo-600 shadow-indigo-100 mb-4">
                      <Settings2 size={32} />
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                      School Administrator Login
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                      Manage system settings, users, academics, RBAC permissions, and overall school operations.
                    </p>
                  </div>

                  {adminAuthError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                      <ShieldAlert size={18} className="shrink-0" />
                      <span>{adminAuthError}</span>
                    </div>
                  )}

                  <form onSubmit={handleAdminSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Password</Label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                          type={showAdminPassword ? 'text' : 'password'}
                          value={adminPassword}
                          onChange={e => { setAdminPassword(e.target.value); if (adminAuthError) setAdminAuthError(''); }}
                          placeholder="Enter admin password"
                          className="h-12 md:h-14 pl-12 pr-12 rounded-xl bg-slate-50 border-none font-bold text-base focus:bg-white focus:ring-2"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium pt-1">
                        Default PIN: <span className="font-bold">{DEFAULT_ADMIN_PASSWORD}</span>
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isAdminVerifying || !String(adminPassword || '').trim()}
                      className="w-full h-12 md:h-14 rounded-xl text-white font-black text-base shadow-xl gap-2 transition-all active:scale-95 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                    >
                      {isAdminVerifying ? (
                        <><Loader2 className="animate-spin" size={20} /> Verifying...</>
                      ) : (
                        <><Unlock size={20} /> Sign In as Admin</>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: DEV */}
            <TabsContent value="dev" className="mt-4 space-y-4">
              <Card className="border-none shadow-2xl rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl shadow-xl bg-purple-50 text-purple-600 shadow-purple-100 mb-4">
                      <Shield size={32} />
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                      Platform Developer Login
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                      Full platform debugging, API access, subscriptions, payment logs, and system metrics.
                    </p>
                  </div>

                  {devAuthError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                      <ShieldAlert size={18} className="shrink-0" />
                      <span>{devAuthError}</span>
                    </div>
                  )}

                  <form onSubmit={handleDevSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Developer Password</Label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                          type={showDevPassword ? 'text' : 'password'}
                          value={devPassword}
                          onChange={e => { setDevPassword(e.target.value); if (devAuthError) setDevAuthError(''); }}
                          placeholder="Enter developer password"
                          className="h-12 md:h-14 pl-12 pr-12 rounded-xl bg-slate-50 border-none font-bold text-base focus:bg-white focus:ring-2"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDevPassword(!showDevPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showDevPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium pt-1">
                        Default Developer Password: <span className="font-bold">dev2026</span>
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isDevVerifying || !String(devPassword || '').trim()}
                      className="w-full h-12 md:h-14 rounded-xl text-white font-black text-base shadow-xl gap-2 transition-all active:scale-95 bg-purple-600 hover:bg-purple-700 shadow-purple-100"
                    >
                      {isDevVerifying ? (
                        <><Loader2 className="animate-spin" size={20} /> Verifying...</>
                      ) : (
                        <><Unlock size={20} /> Sign In as Dev</>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: STAFF */}
            <TabsContent value="staff" className="mt-4">
              <Card className="border-none shadow-2xl rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-6">
                  {staffAuthError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                      <ShieldAlert size={18} className="shrink-0" />
                      <span>{staffAuthError}</span>
                    </div>
                  )}

                  <form onSubmit={handleStaffLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="staff-id" className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                          id="staff-id"
                          type="email"
                          value={staffId}
                          onChange={e => { setStaffId(e.target.value); if (staffAuthError) setStaffAuthError(''); }}
                          placeholder="e.g. teacher@school.com"
                          className="h-12 md:h-14 pl-12 pr-4 rounded-xl bg-slate-50 border-none font-bold text-base focus:bg-white focus:ring-2 focus:ring-emerald-200"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="staff-password" className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Access Code / Password
                      </Label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                          id="staff-password"
                          type={showStaffPassword ? 'text' : 'password'}
                          value={staffPassword}
                          onChange={e => { setStaffPassword(e.target.value); if (staffAuthError) setStaffAuthError(''); }}
                          placeholder="Enter your password"
                          className="h-12 md:h-14 pl-12 pr-12 rounded-xl bg-slate-50 border-none font-bold text-base focus:bg-white focus:ring-2 focus:ring-emerald-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowStaffPassword(!showStaffPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showStaffPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isStaffVerifying || !String(staffId || '').trim() || !String(staffPassword || '').trim()}
                      className="w-full h-12 md:h-14 rounded-xl text-white font-black text-base shadow-xl gap-2 transition-all active:scale-95 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                    >
                      {isStaffVerifying ? (
                        <><Loader2 className="animate-spin" size={20} /> Signing In...</>
                      ) : (
                        <><Unlock size={20} /> Sign In as Staff / Teacher</>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: SUPPORT */}
            <TabsContent value="support" className="mt-4">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                  Select Support Role
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setSelectedSupportRole('support_staff'); setStaffId(''); }}
                    className="p-4 rounded-2xl border-2 border-orange-200 bg-white hover:shadow-lg transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                        <Users size={20} />
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-sm">Non-Teaching Staff</div>
                        <div className="text-[11px] text-slate-500">General support</div>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedSupportRole('librarian'); setStaffId(''); }}
                    className="p-4 rounded-2xl border-2 border-orange-200 bg-white hover:shadow-lg transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-sm">Librarian</div>
                        <div className="text-[11px] text-slate-500">Library management</div>
                      </div>
                    </div>
                  </button>
                </div>

                <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden mt-4">
                  <CardContent className="p-5 space-y-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 font-medium">
                        {selectedSupportRole ? `Logging in as ${selectedSupportRole.replace('_', ' ')}` : 'Enter credentials'}
                      </p>
                    </div>

                    {staffAuthError && (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold">
                        <ShieldAlert size={16} className="shrink-0" />
                        <span>{staffAuthError}</span>
                      </div>
                    )}

                    <form onSubmit={handleStaffLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Email / Staff ID
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <Input
                            type="email"
                            value={staffId}
                            onChange={e => { setStaffId(e.target.value); if (staffAuthError) setStaffAuthError(''); }}
                            placeholder="support@munyaka.sc.ke"
                            className="h-11 pl-11 pr-4 rounded-xl bg-slate-50 border-none font-bold text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Access Code
                        </Label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <Input
                            type={showStaffPassword ? 'text' : 'password'}
                            value={staffPassword}
                            onChange={e => { setStaffPassword(e.target.value); if (staffAuthError) setStaffAuthError(''); }}
                            placeholder="Access code"
                            className="h-11 pl-11 pr-11 rounded-xl bg-slate-50 border-none font-bold text-sm"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isStaffVerifying || !String(staffId || '').trim() || !String(staffPassword || '').trim()}
                        className="w-full h-11 rounded-xl text-white font-bold text-sm shadow-lg gap-2 bg-orange-600 hover:bg-orange-700"
                      >
                        {isStaffVerifying ? <Loader2 className="animate-spin" size={16} /> : <Unlock size={16} />}
                        Sign In
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Parent & Student Portal Link */}
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gradient-to-br from-slate-50 via-indigo-50/30 to-amber-50/20 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  or
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/portal')}
              className="mt-4 w-full p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border-2 border-indigo-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 group active:scale-[0.98]"
            >
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
                  <GraduationCap size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-black text-slate-800 text-sm">Parent & Student Portal</div>
                  <div className="text-[11px] text-slate-500 font-medium">View attendance, reports & fees</div>
                </div>
                <ArrowRight size={18} className="ml-auto text-indigo-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          <div className="text-center pt-2 space-y-1">
            <button
              type="button"
              onClick={() => setForgotModalOpen(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline underline-offset-2 transition-colors"
            >
              Forgot Password / Locked Out?
            </button>
          </div>
        </div>
      </div>

      <ForgotPasswordModal open={forgotModalOpen} onClose={() => setForgotModalOpen(false)} />
    </div>
  );
};

export default Login;
