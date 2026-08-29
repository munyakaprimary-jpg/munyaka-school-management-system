import React, { useState, useEffect, useMemo } from 'react';
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
  Search,
  User,
  BookOpen,
  Calculator,
  GraduationCap,
  Send,
} from 'lucide-react';
import { useAuth, normalizeEmail } from '@/context/AuthContext';
import { showError, showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { PreRegisteredStaff, SYSTEM_ROLE_LABELS } from '@/types/staff-access';

// ─── Admin role configs ─────────────────────────────────────────────────────

type AdminRole = 'system_admin' | 'super_admin';

interface RoleConfig {
  id: AdminRole;
  label: string;
  description: string;
  fullDescription: string;
  password: string;
  email: string;
  userName: string;
  userRole: 'owner' | 'super_admin';
  redirectPath: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  primaryColor: 'indigo' | 'amber';
  badgeText: string;
}

const ROLE_CONFIGS: Record<AdminRole, RoleConfig> = {
  system_admin: {
    id: 'system_admin',
    label: 'System Administrator',
    description: 'Full access: Settings, Users, Fees, Academics, RBAC, Security',
    fullDescription: 'Manage system settings, users, academics, RBAC permissions, and overall school operations.',
    password: 'sysadmin2026',
    email: 'sysadmin@munyaka.sc.ke',
    userName: 'System Administrator',
    userRole: 'super_admin',
    redirectPath: '/system-management',
    icon: Settings2,
    primaryColor: 'indigo',
    badgeText: 'PIN: sysadmin2026',
  },
  super_admin: {
    id: 'super_admin',
    label: 'Super Admin (Owner)',
    description: 'Exclusive access to Payment & Subscriptions module',
    fullDescription: 'Dedicated access to payment module, subscriptions, and financial gateway management.',
    password: 'ownerpass2026',
    email: 'munyakaprimary@gmail.com',
    userName: 'School Owner',
    userRole: 'owner',
    redirectPath: '/payment-management',
    icon: Crown,
    primaryColor: 'amber',
    badgeText: 'PIN: ownerpass2026',
  },
};

// ─── Staff role → redirect map ───────────────────────────────────────────────

function getStaffRedirectPath(systemRole: string): string {
  switch (systemRole) {
    case 'head_teacher':    return '/index';
    case 'bursar':         return '/fees';
    case 'senior_teacher': return '/dashboard';
    case 'class_teacher':
    case 'subject_teacher':
    default:               return '/dashboard';
  }
}

// ─── Role card for admin tab ─────────────────────────────────────────────────

interface RoleCardProps {
  role: RoleConfig;
  onClick: () => void;
  bgColor: string;
  textColor: string;
  borderColor: string;
  featureIcons: { Icon: React.ComponentType<{ size?: number }>; label: string }[];
}

const RoleCard: React.FC<RoleCardProps> = ({
  role, onClick, bgColor, textColor, borderColor, featureIcons,
}) => {
  const Icon = role.icon;
  return (
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
          <Icon size={28} className="md:hidden" />
          <Icon size={32} className="hidden md:inline" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="text-lg md:text-xl font-black text-slate-900">{role.label}</h3>
            <ArrowRight size={18} className={cn("shrink-0 transition-transform group-hover:translate-x-1", textColor)} />
          </div>
          <p className="text-xs md:text-sm text-slate-500 font-medium mb-3">{role.description}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {featureIcons.map(({ Icon: FeatureIcon, label }, idx) => (
              <div key={idx} className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold", bgColor, textColor)}>
                <FeatureIcon size={10} />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <Badge variant="outline" className={cn("font-bold text-[10px] border", borderColor, textColor)}>
            {role.badgeText}
          </Badge>
        </div>
      </div>
    </button>
  );
};

// ─── Main Login page ──────────────────────────────────────────────────────────

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  // ── Admin state ──────────────────────────────────────────────────────────
  const [selectedAdminRole, setSelectedAdminRole] = useState<AdminRole | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState('');
  const [isAdminVerifying, setIsAdminVerifying] = useState(false);

  // ── Staff state ──────────────────────────────────────────────────────────
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<PreRegisteredStaff | null>(null);
  const [staffAccessCode, setStaffAccessCode] = useState('');
  const [showStaffCode, setShowStaffCode] = useState(false);
  const [staffAuthError, setStaffAuthError] = useState('');
  const [isStaffVerifying, setIsStaffVerifying] = useState(false);
  const [staffDropdownOpen, setStaffDropdownOpen] = useState(false);

  // ── All pre-registered staff ──────────────────────────────────────────────
  const allStaff = useMemo<PreRegisteredStaff[]>(() => {
    const saved = localStorage.getItem('munyaka_staff_prereg');
    return saved ? JSON.parse(saved) : [];
  }, []);

  const filteredStaff = useMemo(() => {
    if (!staffSearch.trim()) return allStaff.slice(0, 8);
    const q = staffSearch.toLowerCase();
    return allStaff.filter(
      s =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.nationalId.includes(q) ||
        s.tempAccessCode.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [allStaff, staffSearch]);

  // ── Redirect already-authenticated users ───────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role;
      if (role === 'owner') {
        navigate(ROLE_CONFIGS.super_admin.redirectPath, { replace: true });
      } else if (role === 'super_admin') {
        navigate(ROLE_CONFIGS.system_admin.redirectPath, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // ── Admin handlers ────────────────────────────────────────────────────────
  const handleRoleSelect = (role: AdminRole) => {
    setSelectedAdminRole(role);
    setAdminPassword('');
    setAdminAuthError('');
  };

  const handleBackToRoleSelect = () => {
    setSelectedAdminRole(null);
    setAdminPassword('');
    setAdminAuthError('');
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminRole) return;
    if (!adminPassword.trim()) {
      setAdminAuthError('Please enter your password.');
      return;
    }

    setIsAdminVerifying(true);
    setAdminAuthError('');
    await new Promise(r => setTimeout(r, 600));

    const config = ROLE_CONFIGS[selectedAdminRole];
    if (adminPassword !== config.password) {
      setAdminAuthError(`Invalid password for ${config.label}.`);
      showError('Authentication failed');
      setIsAdminVerifying(false);
      return;
    }

    const success = await login(config.email, adminPassword);
    if (success) {
      const adminSession = {
        role: selectedAdminRole,
        roleLabel: config.label,
        roleIcon: selectedAdminRole === 'super_admin' ? 'crown' : 'settings',
        timestamp: Date.now(),
      };
      localStorage.setItem('munyaka_admin_session', JSON.stringify(adminSession));
      localStorage.setItem('munyaka_admin_pass', config.password);
      if (selectedAdminRole === 'super_admin') {
        localStorage.setItem('munyaka_owner_pass', config.password);
      } else {
        localStorage.setItem('munyaka_sysadmin_pass', config.password);
      }
      showSuccess(`Welcome, ${config.userName}!`);
      navigate(config.redirectPath, { replace: true });
    } else {
      setAdminAuthError('Login failed. Please try again.');
      showError('Authentication failed');
    }
    setIsAdminVerifying(false);
  };

  // ── Staff handlers ────────────────────────────────────────────────────────
  const handleSelectStaff = (staff: PreRegisteredStaff) => {
    setSelectedStaff(staff);
    setStaffSearch(staff.fullName);
    setStaffAccessCode('');
    setStaffAuthError('');
    setStaffDropdownOpen(false);
  };

  const handleClearStaff = () => {
    setSelectedStaff(null);
    setStaffSearch('');
    setStaffAccessCode('');
    setStaffAuthError('');
    setStaffDropdownOpen(false);
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) {
      setStaffAuthError('Please select your name from the list.');
      return;
    }
    if (!staffAccessCode.trim()) {
      setStaffAuthError('Please enter your Access Code.');
      return;
    }

    setIsStaffVerifying(true);
    setStaffAuthError('');
    await new Promise(r => setTimeout(r, 700));

    const valid =
      staffAccessCode === selectedStaff.tempAccessCode ||
      staffAccessCode === selectedStaff.nationalId ||
      staffAccessCode === 'munyaka5239';

    if (!valid) {
      setStaffAuthError('Invalid Access Code. Please check and try again.');
      showError('Access denied');
      setIsStaffVerifying(false);
      return;
    }

    const success = await login(selectedStaff.email, staffAccessCode);
    if (success) {
      showSuccess(`Welcome, ${selectedStaff.fullName}!`);
      navigate(getStaffRedirectPath(selectedStaff.systemRole), { replace: true });
    } else {
      setStaffAuthError('Login failed. Please try again.');
      showError('Authentication failed');
    }
    setIsStaffVerifying(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  Render — only shown when user is NOT authenticated
  // ─────────────────────────────────────────────────────────────────────────
  const adminConfig = selectedAdminRole ? ROLE_CONFIGS[selectedAdminRole] : null;
  const AdminIcon = adminConfig?.icon;
  const isAdminIndigo = adminConfig?.primaryColor === 'indigo';

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
          <Tabs defaultValue="staff" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 rounded-2xl bg-slate-100 p-1 gap-1">
              <TabsTrigger
                value="admin"
                className="rounded-xl text-xs font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-slate-500 transition-all"
              >
                <Settings2 size={14} className="mr-1.5 shrink-0" />
                <span className="hidden sm:inline">System Admin</span>
                <span className="sm:hidden">Admin</span>
              </TabsTrigger>
              <TabsTrigger
                value="super"
                className="rounded-xl text-xs font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm text-slate-500 transition-all"
              >
                <Crown size={14} className="mr-1.5 shrink-0" />
                <span className="hidden sm:inline">Super Admin</span>
                <span className="sm:hidden">Owner</span>
              </TabsTrigger>
              <TabsTrigger
                value="staff"
                className="rounded-xl text-xs font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm text-slate-500 transition-all"
              >
                <User size={14} className="mr-1.5 shrink-0" />
                Staff / Teacher
              </TabsTrigger>
            </TabsList>

            {/* ── SYSTEM ADMIN TAB ── */}
            <TabsContent value="admin" className="mt-4 space-y-4">
              {!selectedAdminRole ? (
                <>
                  {adminAuthError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in slide-in-from-top-2">
                      <ShieldAlert size={20} className="shrink-0" />
                      <span>{adminAuthError}</span>
                    </div>
                  )}
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                    Choose Your Role
                  </p>
                  <RoleCard
                    role={ROLE_CONFIGS.system_admin}
                    onClick={() => handleRoleSelect('system_admin')}
                    bgColor="bg-indigo-50"
                    textColor="text-indigo-700"
                    borderColor="border-indigo-200"
                    featureIcons={[
                      { Icon: Users, label: 'Users' },
                      { Icon: Settings2, label: 'Settings' },
                      { Icon: Shield, label: 'RBAC' },
                    ]}
                  />
                </>
              ) : (
                <Card className="border-none shadow-2xl rounded-3xl bg-white overflow-hidden">
                  <CardContent className="p-6 md:p-8 space-y-6">
                    <button
                      onClick={handleBackToRoleSelect}
                      className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors"
                    >
                      <ChevronLeft size={20} /> Back to role selection
                    </button>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl shadow-xl bg-indigo-50 text-indigo-600 shadow-indigo-100 mb-4">
                        {AdminIcon && <AdminIcon size={32} />}
                      </div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                        {adminConfig!.label}
                      </h2>
                      <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                        {adminConfig!.fullDescription}
                      </p>
                    </div>
                    {adminAuthError && (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                        <ShieldAlert size={18} className="shrink-0" />
                        <span>{adminAuthError}</span>
                      </div>
                    )}
                    <form onSubmit={handleAdminLogin} className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Password</Label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <Input
                            type={showAdminPassword ? 'text' : 'password'}
                            value={adminPassword}
                            onChange={e => { setAdminPassword(e.target.value); if (adminAuthError) setAdminAuthError(''); }}
                            placeholder="Enter your password"
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
                          Default: <span className="font-bold">{adminConfig!.password}</span>
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
                          <><Unlock size={20} /> Sign In</>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── SUPER ADMIN TAB ── */}
            <TabsContent value="super" className="mt-4 space-y-4">
              {!selectedAdminRole ? (
                <>
                  {adminAuthError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in slide-in-from-top-2">
                      <ShieldAlert size={20} className="shrink-0" />
                      <span>{adminAuthError}</span>
                    </div>
                  )}
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                    Choose Your Role
                  </p>
                  <RoleCard
                    role={ROLE_CONFIGS.super_admin}
                    onClick={() => handleRoleSelect('super_admin')}
                    bgColor="bg-amber-50"
                    textColor="text-amber-700"
                    borderColor="border-amber-200"
                    featureIcons={[
                      { Icon: CreditCard, label: 'Payments' },
                      { Icon: Crown, label: 'Owner' },
                      { Icon: Shield, label: 'Billing' },
                    ]}
                  />
                </>
              ) : (
                <Card className="border-none shadow-2xl rounded-3xl bg-white overflow-hidden">
                  <CardContent className="p-6 md:p-8 space-y-6">
                    <button
                      onClick={handleBackToRoleSelect}
                      className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors"
                    >
                      <ChevronLeft size={20} /> Back to role selection
                    </button>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl shadow-xl bg-amber-50 text-amber-600 shadow-amber-100 mb-4">
                        {AdminIcon && <AdminIcon size={32} />}
                      </div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                        {adminConfig!.label}
                      </h2>
                      <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                        {adminConfig!.fullDescription}
                      </p>
                    </div>
                    {adminAuthError && (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                        <ShieldAlert size={18} className="shrink-0" />
                        <span>{adminAuthError}</span>
                      </div>
                    )}
                    <form onSubmit={handleAdminLogin} className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Password</Label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <Input
                            type={showAdminPassword ? 'text' : 'password'}
                            value={adminPassword}
                            onChange={e => { setAdminPassword(e.target.value); if (adminAuthError) setAdminAuthError(''); }}
                            placeholder="Enter your password"
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
                          Default: <span className="font-bold">{adminConfig!.password}</span>
                        </p>
                      </div>
                      <Button
                        type="submit"
                        disabled={isAdminVerifying || !adminPassword.trim()}
                        className="w-full h-12 md:h-14 rounded-xl text-white font-black text-base shadow-xl gap-2 transition-all active:scale-95 bg-amber-600 hover:bg-amber-700 shadow-amber-100"
                      >
                        {isAdminVerifying ? (
                          <><Loader2 className="animate-spin" size={20} /> Verifying...</>
                        ) : (
                          <><Unlock size={20} /> Sign In</>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
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
                    {/* Staff name search */}
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Your Name / Email
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          value={staffSearch}
                          onChange={e => {
                            setStaffSearch(e.target.value);
                            if (selectedStaff) handleClearStaff();
                            setStaffDropdownOpen(true);
                          }}
                          onFocus={() => setStaffDropdownOpen(true)}
                          placeholder="Search by name, email, or National ID..."
                          className="w-full h-12 pl-11 pr-10 rounded-xl bg-slate-50 border-none font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                          autoComplete="off"
                        />
                        {selectedStaff && (
                          <button
                            type="button"
                            onClick={handleClearStaff}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <ShieldAlert size={16} />
                          </button>
                        )}
                      </div>

                      {/* Dropdown */}
                      {staffDropdownOpen && (
                        <div className="relative z-50">
                          <div className="absolute top-0 left-0 right-0 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-64 overflow-y-auto">
                            {filteredStaff.length === 0 ? (
                              <div className="p-4 text-center text-xs font-bold text-slate-400">
                                No staff members found.
                              </div>
                            ) : (
                              filteredStaff.map(staff => {
                                const roleInfo = SYSTEM_ROLE_LABELS[staff.systemRole] ?? SYSTEM_ROLE_LABELS.subject_teacher;
                                return (
                                  <button
                                    key={staff.id}
                                    type="button"
                                    onClick={() => handleSelectStaff(staff)}
                                    className={cn(
                                      'w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-start gap-3 border-b border-slate-50 last:border-0',
                                      selectedStaff?.id === staff.id && 'bg-emerald-50',
                                    )}
                                  >
                                    <User size={16} className={cn('mt-0.5 shrink-0', selectedStaff?.id === staff.id ? 'text-emerald-600' : 'text-slate-400')} />
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-900 text-sm truncate">{staff.fullName}</p>
                                      <p className="text-xs text-slate-500 font-medium truncate">{staff.email}</p>
                                      <Badge className={cn('mt-1 font-bold text-[9px] border-none px-2 py-0.5 rounded-lg', roleInfo.badgeBg, roleInfo.color)}>
                                        {roleInfo.label}
                                      </Badge>
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Selected staff info */}
                    {selectedStaff && (
                      <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <div className="p-2 bg-emerald-100 rounded-xl">
                          <User size={20} className="text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 text-sm">{selectedStaff.fullName}</p>
                          <p className="text-xs text-slate-500 font-medium">{selectedStaff.email}</p>
                          <Badge className={cn(
                            'mt-1 font-bold text-[10px] border-none px-2 py-0.5 rounded-lg',
                            SYSTEM_ROLE_LABELS[selectedStaff.systemRole]?.badgeBg ?? 'bg-slate-100 text-slate-600',
                            SYSTEM_ROLE_LABELS[selectedStaff.systemRole]?.color ?? 'text-slate-700',
                          )}>
                            {SYSTEM_ROLE_LABELS[selectedStaff.systemRole]?.label ?? selectedStaff.systemRole}
                          </Badge>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearStaff}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <ShieldAlert size={16} />
                        </button>
                      </div>
                    )}

                    {/* Access code */}
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Access Code
                      </Label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                          type={showStaffCode ? 'text' : 'password'}
                          value={staffAccessCode}
                          onChange={e => { setStaffAccessCode(e.target.value); if (staffAuthError) setStaffAuthError(''); }}
                          placeholder="e.g. MUNYAKA-9020"
                          className="h-12 md:h-14 pl-12 pr-12 rounded-xl bg-slate-50 border-none font-bold text-base focus:bg-white focus:ring-2 focus:ring-emerald-200"
                          autoFocus={!!selectedStaff}
                        />
                        <button
                          type="button"
                          onClick={() => setShowStaffCode(!showStaffCode)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showStaffCode ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Your Access Code was shared via SMS/email. Fallback: National ID or <span className="font-bold">munyaka5239</span>.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isStaffVerifying || !selectedStaff || !staffAccessCode.trim()}
                      className="w-full h-12 md:h-14 rounded-xl text-white font-black text-base shadow-xl gap-2 transition-all active:scale-95 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                    >
                      {isStaffVerifying ? (
                        <><Loader2 className="animate-spin" size={20} /> Signing In...</>
                      ) : (
                        <><Unlock size={20} /> Sign In as Staff / Teacher</>
                      )}
                    </Button>
                  </form>

                  {/* Help note */}
                  <div className="p-4 bg-slate-50 rounded-2xl flex items-start gap-3">
                    <Send size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-500 font-medium">
                      Can't find your name? Contact the School Administrator to pre-register your account and receive an Access Code via SMS or email.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-400 font-medium">
              Having trouble accessing your account? Contact the school administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
