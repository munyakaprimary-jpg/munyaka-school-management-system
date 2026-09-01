import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Loader2,
  Shield,
  Key,
  Eye,
  EyeOff,
  Settings2,
  Crown,
  ChevronLeft,
  ShieldAlert,
  Unlock,
  Users,
  CreditCard,
  ArrowRight,
  BookOpen,
  Calculator,
  GraduationCap,
  Send,
  User,
  KeyRound,
  Code2,
  Bug,
  Globe,
  Server,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { PreRegisteredStaff } from '@/types/staff-access';
import {
  MUNYAKA_ADMIN_PASSWORD,
  DEFAULT_ADMIN_PASSWORD,
  getActiveAdminPassword,
} from '@/services/adminCredentials';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';

/** True when a custom admin password has been saved to localStorage. */
const hasCustomAdminPassword = (): boolean => {
  try {
    const stored = localStorage.getItem(MUNYAKA_ADMIN_PASSWORD);
    return stored != null && stored.trim().length > 0;
  } catch {
    return false;
  }
};

// ─── Developer credentials (hardcoded — platform developer only) ──────────────
const DEVELOPER_EMAIL = 'developer@munyaka-platform.ke';
const DEVELOPER_PASSWORD = 'dev_munyaka_2026';
const DEVELOPER_NAME = 'Platform Developer';
const DEVELOPER_ROLE = 'super_admin'; // maps to super_admin so routing works

// ─── Role configs ─────────────────────────────────────────────────────────────

type LoginTab = 'admin' | 'developer' | 'staff';

interface RoleCardProps {
  label: string;
  description: string;
  featureIcons: { Icon: React.ComponentType<{ size?: number }>; label: string }[];
  badgeText: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  onClick: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({
  label, description, featureIcons, badgeText, bgColor, textColor, borderColor, onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "w-full p-5 md:p-6 rounded-3xl border-2 bg-white hover:shadow-xl transition-all duration-300 text-left group active:scale-[0.98]",
      borderColor,
    )}
  >
    <div className="flex items-start gap-4">
      <div className={cn("p-3 md:p-4 rounded-2xl shrink-0 transition-transform group-hover:scale-110", bgColor, textColor)}>
        <ArrowRight size={28} className="md:hidden" />
        <ArrowRight size={32} className="hidden md:inline" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <h3 className="text-lg md:text-xl font-black text-slate-900">{label}</h3>
          <ArrowRight size={18} className={cn("shrink-0 transition-transform group-hover:translate-x-1", textColor)} />
        </div>
        <p className="text-xs md:text-sm text-slate-500 font-medium mb-3">{description}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {featureIcons.map(({ Icon, label: fLabel }, idx) => (
            <div key={idx} className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold", bgColor, textColor)}>
              <Icon size={10} />
              <span>{fLabel}</span>
            </div>
          ))}
        </div>
        <Badge variant="outline" className={cn("font-bold text-[10px] border", borderColor, textColor)}>
          {badgeText}
        </Badge>
      </div>
    </div>
  </button>
);

// ─── Main Login page ──────────────────────────────────────────────────────────

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  // ── Active tab state ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<LoginTab>('staff');

  // ── Admin state ───────────────────────────────────────────────────────────
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState('');
  const [isAdminVerifying, setIsAdminVerifying] = useState(false);

  // ── Developer state ───────────────────────────────────────────────────────
  const [devPassword, setDevPassword] = useState('');
  const [showDevPassword, setShowDevPassword] = useState(false);
  const [devAuthError, setDevAuthError] = useState('');
  const [isDevVerifying, setIsDevVerifying] = useState(false);

  // ── Staff state ───────────────────────────────────────────────────────────
  const [staffId, setStaffId] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffAuthError, setStaffAuthError] = useState('');
  const [isStaffVerifying, setIsStaffVerifying] = useState(false);

  // ── Forgot password modal ───────────────────────────────────────────────
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // ── Redirect already-authenticated users straight to the dashboard ─────────
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // ── Reset form state when switching tabs ────────────────────────────────────
  useEffect(() => {
    setAdminPassword('');
    setAdminAuthError('');
    setDevPassword('');
    setDevAuthError('');
    setStaffId('');
    setStaffPassword('');
    setStaffAuthError('');
  }, [activeTab]);

  // ── Admin login handler ────────────────────────────────────────────────────
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = adminPassword.trim();

    if (!entered) {
      setAdminAuthError('Please enter your password.');
      return;
    }

    setIsAdminVerifying(true);
    setAdminAuthError('');

    const activeStored = getActiveAdminPassword();
    const isValid = entered === activeStored || entered === DEFAULT_ADMIN_PASSWORD;

    if (!isValid) {
      setAdminAuthError('Invalid password. Check your PIN and try again.');
      showError('Authentication failed');
      setIsAdminVerifying(false);
      return;
    }

    const adminEmail = 'munyakaprimary@gmail.com';
    const success = await login(adminEmail, entered);
    if (success) {
      const adminSession = {
        role: 'admin',
        roleLabel: 'School Admin',
        timestamp: Date.now(),
      };
      localStorage.setItem('munyaka_admin_session', JSON.stringify(adminSession));
      showSuccess('Welcome, School Admin!');
      navigate('/dashboard', { replace: true });
    } else {
      setAdminAuthError('Login failed. Please try again.');
      showError('Authentication failed');
    }
    setIsAdminVerifying(false);
  };

  // ── Developer login handler ────────────────────────────────────────────────
  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = devPassword.trim();

    if (!entered) {
      setDevAuthError('Please enter your developer password.');
      return;
    }

    setIsDevVerifying(true);
    setDevAuthError('');

    const isValid = entered === DEVELOPER_PASSWORD;

    if (!isValid) {
      setDevAuthError('Invalid developer credentials.');
      showError('Developer authentication failed');
      setIsDevVerifying(false);
      return;
    }

    const success = await login(DEVELOPER_EMAIL, entered);
    if (success) {
      const devSession = {
        role: 'developer',
        roleLabel: 'Platform Developer',
        timestamp: Date.now(),
      };
      localStorage.setItem('munyaka_dev_session', JSON.stringify(devSession));
      showSuccess(`Welcome, ${DEVELOPER_NAME}!`);
      navigate('/dashboard', { replace: true });
    } else {
      setDevAuthError('Developer login failed. Please try again.');
      showError('Developer authentication failed');
    }
    setIsDevVerifying(false);
  };

  // ── Staff login handler ───────────────────────────────────────────────────
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = staffId.trim();
    const trimmedPass = staffPassword.trim();

    if (!trimmedId) {
      setStaffAuthError('Please enter your Staff ID / Username.');
      return;
    }
    if (!trimmedPass) {
      setStaffAuthError('Please enter your Password.');
      return;
    }

    setIsStaffVerifying(true);
    setStaffAuthError('');

    const success = await login(trimmedId, trimmedPass);
    if (success) {
      const savedLedgerJson = localStorage.getItem('munyaka_staff_prereg');
      const staffLedger: PreRegisteredStaff[] = savedLedgerJson
        ? JSON.parse(savedLedgerJson)
        : [];
      const match = staffLedger.find(
        s => s.staffId && s.staffId.toLowerCase() === trimmedId.toLowerCase()
      );
      showSuccess(match ? `Welcome, ${match.fullName}!` : 'Welcome!');
      navigate('/dashboard', { replace: true });
    } else {
      setStaffAuthError('Invalid Staff ID or Password. Please try again.');
      showError('Authentication failed');
    }
    setIsStaffVerifying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-amber-50/20 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-2xl space-y-6 animate-in fade-in zoom-in-95 duration-500">

          {/* ── Header ── */}
          <div className="text-center space-y-3">
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

          {/* ── Portal Access Tabs ── */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LoginTab)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 rounded-2xl bg-slate-100 p-1 gap-1">
              <TabsTrigger
                value="admin"
                className="rounded-xl text-xs font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-slate-500 transition-all"
              >
                <Settings2 size={14} className="mr-1.5 shrink-0" />
                Admin
              </TabsTrigger>
              <TabsTrigger
                value="developer"
                className="rounded-xl text-xs font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-sm text-slate-500 transition-all"
              >
                <Code2 size={14} className="mr-1.5 shrink-0" />
                <span className="hidden sm:inline">Developer</span>
                <span className="sm:hidden">Dev</span>
              </TabsTrigger>
              <TabsTrigger
                value="staff"
                className="rounded-xl text-xs font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm text-slate-500 transition-all"
              >
                <User size={14} className="mr-1.5 shrink-0" />
                Staff / Teacher
              </TabsTrigger>
            </TabsList>

            {/* ── ADMIN TAB ── */}
            <TabsContent value="admin" className="mt-4 space-y-4">
              {adminAuthError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in slide-in-from-top-2">
                  <ShieldAlert size={20} className="shrink-0" />
                  <span>{adminAuthError}</span>
                </div>
              )}

              <Card className="border-none shadow-2xl rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-6">
                  {/* Role description card */}
                  <div className="flex items-start gap-4 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
                    <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600 shrink-0">
                      <Crown size={24} />
                    </div>
                    <div>
                      <h2 className="text-base md:text-lg font-black text-slate-900 mb-1">
                        School Admin / Owner Access
                      </h2>
                      <p className="text-xs md:text-sm text-slate-600 font-medium">
                        For school directors, school owners, and school-level administrators. Grants full access to settings, user management, academics, fees, RBAC permissions, and security configuration.
                      </p>
                    </div>
                  </div>

                  {/* Role quick-select */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 border-2 border-indigo-100 rounded-2xl bg-white hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => {}}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                          <Settings2 size={18} />
                        </div>
                        <span className="font-black text-sm text-slate-900">System Administrator</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium pl-11">
                        Full access: Settings, Users, Fees, Academics, RBAC, Security
                      </p>
                    </div>
                    <div className="p-4 border-2 border-amber-100 rounded-2xl bg-white hover:border-amber-300 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => {}}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                          <CreditCard size={18} />
                        </div>
                        <span className="font-black text-sm text-slate-900">School Owner</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium pl-11">
                        Exclusive access: Payments, Subscriptions, Billing
                      </p>
                    </div>
                  </div>

                  {adminAuthError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                      <ShieldAlert size={18} className="shrink-0" />
                      <span>{adminAuthError}</span>
                    </div>
                  )}

                  <form onSubmit={handleAdminLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Password / PIN</Label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                          type={showAdminPassword ? 'text' : 'password'}
                          value={adminPassword}
                          onChange={e => { setAdminPassword(e.target.value); if (adminAuthError) setAdminAuthError(''); }}
                          placeholder="Enter your admin password"
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
                        {hasCustomAdminPassword() ? (
                          <span className="flex items-center gap-1">
                            <KeyRound size={9} />
                            Custom PIN — set via Configuration &rarr; Owner Security
                          </span>
                        ) : (
                          <>
                            Default PIN:{' '}
                            <span className="font-bold">{DEFAULT_ADMIN_PASSWORD}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={isAdminVerifying || !adminPassword.trim()}
                      className="w-full h-12 md:h-14 rounded-xl text-white font-black text-base shadow-xl gap-2 transition-all active:scale-95 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                    >
                      {isAdminVerifying ? (
                        <><Loader2 className="animate-spin" size={20} /> Verifying...</>
                      ) : (
                        <><Unlock size={20} /> Sign In as Admin</>
                      )}
                    </Button>
                  </form>

                  {/* Admin test credentials */}
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
                    <User size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-indigo-900 font-medium leading-relaxed">
                      <p className="font-black text-[10px] uppercase tracking-widest text-indigo-700 mb-1">
                        Default Test Credentials
                      </p>
                      <p>Owner / Super Admin — PIN: <span className="font-bold">{DEFAULT_ADMIN_PASSWORD}</span></p>
                      <p className="mt-0.5">Email: <span className="font-bold">munyakaprimary@gmail.com</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── DEVELOPER TAB ── */}
            <TabsContent value="developer" className="mt-4 space-y-4">
              {devAuthError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in slide-in-from-top-2">
                  <ShieldAlert size={20} className="shrink-0" />
                  <span>{devAuthError}</span>
                </div>
              )}

              <Card className="border-none shadow-2xl rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-6">
                  {/* Developer description card */}
                  <div className="flex items-start gap-4 p-5 bg-violet-50 border border-violet-100 rounded-2xl">
                    <div className="p-3 bg-violet-100 rounded-xl text-violet-600 shrink-0">
                      <Code2 size={24} />
                    </div>
                    <div>
                      <h2 className="text-base md:text-lg font-black text-slate-900 mb-1">
                        System &amp; App Developer Access
                      </h2>
                      <p className="text-xs md:text-sm text-slate-600 font-medium">
                        Reserved exclusively for the app developer for platform maintenance, global system configuration, and debugging. This access level bypasses standard role permissions.
                      </p>
                    </div>
                  </div>

                  {/* Developer feature badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { Icon: Bug, label: 'Debugging' },
                      { Icon: Server, label: 'Platform Config' },
                      { Icon: Globe, label: 'Global Settings' },
                      { Icon: Shield, label: 'RBAC Override' },
                    ].map(({ Icon, label }) => (
                      <div key={label} className="flex items-center gap-1.5 px-3 py-2 bg-violet-50 border border-violet-100 rounded-xl text-[10px] font-bold text-violet-700">
                        <Icon size={11} />
                        {label}
                      </div>
                    ))}
                  </div>

                  {devAuthError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                      <ShieldAlert size={18} className="shrink-0" />
                      <span>{devAuthError}</span>
                    </div>
                  )}

                  <form onSubmit={handleDevLogin} className="space-y-5">
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
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowDevPassword(!showDevPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showDevPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={isDevVerifying || !devPassword.trim()}
                      className="w-full h-12 md:h-14 rounded-xl text-white font-black text-base shadow-xl gap-2 transition-all active:scale-95 bg-violet-600 hover:bg-violet-700 shadow-violet-100"
                    >
                      {isDevVerifying ? (
                        <><Loader2 className="animate-spin" size={20} /> Verifying...</>
                      ) : (
                        <><Unlock size={20} /> Sign In as Developer</>
                      )}
                    </Button>
                  </form>

                  {/* Developer test credentials */}
                  <div className="p-4 bg-violet-50 border border-violet-100 rounded-2xl flex items-start gap-3">
                    <User size={16} className="text-violet-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-violet-900 font-medium leading-relaxed">
                      <p className="font-black text-[10px] uppercase tracking-widest text-violet-700 mb-1">
                        Developer Test Credentials
                      </p>
                      <p>Email: <span className="font-bold">{DEVELOPER_EMAIL}</span></p>
                      <p className="mt-0.5">Password: <span className="font-bold">{DEVELOPER_PASSWORD}</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── STAFF / TEACHER / BURSAR TAB ── */}
            <TabsContent value="staff" className="mt-4">
              <Card className="border-none shadow-2xl rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-6">
                  {/* Role legend */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { Icon: GraduationCap, label: 'Teacher', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                      { Icon: BookOpen, label: 'Head Teacher', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                      { Icon: Calculator, label: 'Bursar', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                    ].map(({ Icon: RoleIcon, label, color }) => (
                      <div key={label} className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold border', color)}>
                        <RoleIcon size={11} />
                        {label}
                      </div>
                    ))}
                  </div>

                  {staffAuthError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                      <ShieldAlert size={18} className="shrink-0" />
                      <span>{staffAuthError}</span>
                    </div>
                  )}

                  <form onSubmit={handleStaffLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="staff-id" className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Staff ID / Username
                      </Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                          id="staff-id"
                          type="text"
                          value={staffId}
                          onChange={e => { setStaffId(e.target.value); if (staffAuthError) setStaffAuthError(''); }}
                          placeholder="e.g. teacher1 or T001"
                          autoComplete="username"
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
                          autoComplete="current-password"
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
                      <p className="text-[10px] text-slate-400 font-medium">
                        Your password was shared via SMS/email. Contact your administrator if forgotten.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isStaffVerifying || !staffId.trim() || !staffPassword.trim()}
                      className="w-full h-12 md:h-14 rounded-xl text-white font-black text-base shadow-xl gap-2 transition-all active:scale-95 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                    >
                      {isStaffVerifying ? (
                        <><Loader2 className="animate-spin" size={20} /> Signing In...</>
                      ) : (
                        <><Unlock size={20} /> Sign In as Staff / Teacher</>
                      )}
                    </Button>
                  </form>

                  {/* Default test account hint */}
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                    <User size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-emerald-900 font-medium leading-relaxed">
                      <p className="font-black text-[10px] uppercase tracking-widest text-emerald-700 mb-1">
                        Default Test Account
                      </p>
                      Username: <span className="font-bold">teacher1</span> &middot; Password: <span className="font-bold">munyaka5239</span>
                    </div>
                  </div>

                  {/* Help note */}
                  <div className="p-4 bg-slate-50 rounded-2xl flex items-start gap-3">
                    <Send size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-500 font-medium">
                      Don&apos;t have credentials? Contact the School Administrator to pre-register your account.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="text-center pt-2 space-y-1">
            <p className="text-xs text-slate-400 font-medium">
              Having trouble accessing your account?
            </p>
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

      <ForgotPasswordModal
        open={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
      />
    </div>
  );
};

export default Login;
