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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { PreRegisteredStaff, SYSTEM_ROLE_LABELS } from '@/types/staff-access';

// ─── Admin role configs ─────────────────────────────────────────────────────

type AdminRole = 'system_admin' | 'super_admin';
type PasswordSource = 'default' | 'custom';

interface RoleConfig {
  id: AdminRole;
  label: string;
  description: string;
  fullDescription: string;
  defaultPassword: string;
  customPasswordKey: string; // localStorage key holding the custom PIN
  email: string;
  userName: string;
  userRole: 'owner' | 'super_admin';
  redirectPath: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  primaryColor: 'indigo' | 'amber';
}

const ROLE_CONFIGS: Record<AdminRole, RoleConfig> = {
  system_admin: {
    id: 'system_admin',
    label: 'System Administrator',
    description: 'Full access: Settings, Users, Fees, Academics, RBAC, Security',
    fullDescription: 'Manage system settings, users, academics, RBAC permissions, and overall school operations.',
    defaultPassword: 'sysadmin2026',
    customPasswordKey: 'munyaka_sysadmin_pass',
    email: 'sysadmin@munyaka.sc.ke',
    userName: 'System Administrator',
    userRole: 'super_admin',
    redirectPath: '/system-management',
    icon: Settings2,
    primaryColor: 'indigo',
  },
  super_admin: {
    id: 'super_admin',
    label: 'Super Admin (Owner)',
    description: 'Exclusive access to Payment & Subscriptions module',
    fullDescription: 'Dedicated access to payment module, subscriptions, and financial gateway management.',
    defaultPassword: 'ownerpass2026',
    customPasswordKey: 'munyaka_owner_pass',
    email: 'munyakaprimary@gmail.com',
    userName: 'School Owner',
    userRole: 'owner',
    redirectPath: '/payment-management',
    icon: Crown,
    primaryColor: 'amber',
  },
};

/**
 * Resolve the active password for a given admin role — called fresh on
 * every login attempt so it always reflects the latest localStorage state.
 *
 * Priority order — checked in this exact order:
 *   1. Role-specific key used by the Configuration → Owner Security tab:
 *        • system_admin → "munyaka_sysadmin_pass"
 *        • super_admin  → "munyaka_owner_pass"
 *      This is the canonical key the Settings/Config page writes to when
 *      the admin rotates their PIN.
 *   2. Role-specific Configuration → System Security key
 *      ("munyaka_system_pass") — older key used in earlier versions of the
 *      Configuration tab, still honoured for backwards compatibility.
 *   3. Shared legacy key "munyaka_admin_pass" — written by several other
 *      modules (Fees, Grades, Attendance, ICT, etc.) and also used as the
 *      fallback for the "munyaka5239" credential.
 *   4. Hard-coded default ("sysadmin2026" / "ownerpass2026") as a
 *      last-resort fallback for brand-new devices.
 *
 * All returned values are .trim()'d to guard against accidental whitespace
 * or newline characters that could cause a comparison to silently fail.
 */
const resolveAdminPassword = (
  role: AdminRole,
): { password: string; source: PasswordSource } => {
  const config = ROLE_CONFIGS[role];

  const tryRead = (key: string | null): string | null => {
    if (!key) return null;
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) {
        // Normalise: trim whitespace and strip any trailing newlines
        const normalised = raw.trim();
        if (normalised.length > 0) {
          return normalised;
        }
      }
    } catch {
      // localStorage unavailable (private mode, quota exceeded, etc.)
    }
    return null;
  };

  // 1. Exact Configuration → Owner Security key
  // 2. Older Configuration → System Security key
  // 3. Shared legacy key (also where the "munyaka5239" fallback lives)
  const stored =
    tryRead(config.customPasswordKey) ??
    tryRead('munyaka_system_pass') ??
    tryRead('munyaka_admin_pass');

  if (stored !== null) {
    return { password: stored, source: 'custom' };
  }

  return { password: config.defaultPassword.trim(), source: 'default' };
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
  /** Whether a custom PIN has been set for this role. */
  hasCustomPassword: boolean;
}

const RoleCard: React.FC<RoleCardProps> = ({
  role, onClick, bgColor, textColor, borderColor, featureIcons, hasCustomPassword,
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
            {hasCustomPassword ? (
              <span className="flex items-center gap-1">
                <KeyRound size={9} /> Custom PIN set
              </span>
            ) : (
              `Default PIN: ${role.defaultPassword}`
            )}
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

  // Track the currently active password (and its source) for each admin
  // role. Re-read on mount and on focus so a PIN update made elsewhere
  // (e.g. via the profile settings page, or in another tab) is picked
  // up without requiring a full reload.
  const [activeCredentials, setActiveCredentials] = useState<
    Record<AdminRole, { password: string; source: PasswordSource }>
  >(() => ({
    system_admin: resolveAdminPassword('system_admin'),
    super_admin: resolveAdminPassword('super_admin'),
  }));

  useEffect(() => {
    const refresh = () => {
      setActiveCredentials({
        system_admin: resolveAdminPassword('system_admin'),
        super_admin: resolveAdminPassword('super_admin'),
      });
    };
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', (e) => {
      if (
        e.key === 'munyaka_sysadmin_pass' ||
        e.key === 'munyaka_owner_pass' ||
        e.key === 'munyaka_users' ||
        e.key === null
      ) {
        refresh();
      }
    });
    return () => {
      window.removeEventListener('focus', refresh);
    };
  }, []);

  // ── Staff state ──────────────────────────────────────────────────────────
  const [staffId, setStaffId] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffAuthError, setStaffAuthError] = useState('');
  const [isStaffVerifying, setIsStaffVerifying] = useState(false);

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

    // Normalise the entered PIN: trim whitespace and strip newlines
    const entered = adminPassword.trim().replace(/\n$/, '');

    if (!entered) {
      setAdminAuthError('Please enter your password.');
      return;
    }

    setIsAdminVerifying(true);
    setAdminAuthError('');
    await new Promise(r => setTimeout(r, 600));

    const config = ROLE_CONFIGS[selectedAdminRole];

    // ── Fresh password resolution on every attempt ─────────────────────────
    // This is NOT read from React state (which may be stale after a
    // Settings/Config page navigation).  We go straight to localStorage
    // so the latest custom PIN is always used.
    const { password: activeStored, source } = resolveAdminPassword(selectedAdminRole);
    const defaultPin = config.defaultPassword.trim();

    // ── Debug logging (development only — never in production) ─────────────
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.groupCollapsed(
        `[AdminLogin] ${selectedAdminRole} @ ${new Date().toISOString()}`,
      );
      // eslint-disable-next-line no-console
      console.log(
        '  localStorage keys read:',
        config.customPasswordKey,
        '| munyaka_admin_pass',
      );
      // eslint-disable-next-line no-console
      console.log(
        '  activeStored (from storage)  :',
        JSON.stringify(activeStored),
        '| source:',
        source,
      );
      // eslint-disable-next-line no-console
      console.log(
        '  defaultPin (hard-coded)      :',
        JSON.stringify(defaultPin),
      );
      // eslint-disable-next-line no-console
      console.log(
        '  entered (normalised)         :',
        JSON.stringify(entered),
      );
      // eslint-disable-next-line no-console
      console.log(
        '  activeMatch:',
        entered === activeStored,
        '| defaultMatch:',
        entered === defaultPin,
      );
      // eslint-disable-next-line no-console
      console.groupEnd();
    }

    // ── Password verification ─────────────────────────────────────────────
    // Accept the custom PIN (if set) AND the default as valid — so the
    // admin can sign in regardless of which PIN was set and whether they
    // remember which one they used last.
    const isActiveMatch = entered === activeStored;
    const isDefaultMatch = entered === defaultPin;
    const isValid = isActiveMatch || isDefaultMatch;

    if (!isValid) {
      // Friendly error — do not reveal which PIN is active.
      setAdminAuthError(`Invalid password for ${config.label}.`);
      showError('Authentication failed');
      setIsAdminVerifying(false);
      return;
    }

    const success = await login(config.email, entered);
    if (success) {
      const adminSession = {
        role: selectedAdminRole,
        roleLabel: config.label,
        roleIcon: selectedAdminRole === 'super_admin' ? 'crown' : 'settings',
        timestamp: Date.now(),
      };
      localStorage.setItem('munyaka_admin_session', JSON.stringify(adminSession));
      // Persist the PIN that was actually used so the profile/settings
      // pages (which also sync to these keys via AuthContext) stay in
      // sync even when the user signs in with the custom PIN.
      localStorage.setItem('munyaka_admin_pass', activeStored);
      if (selectedAdminRole === 'super_admin') {
        localStorage.setItem('munyaka_owner_pass', activeStored);
      } else {
        localStorage.setItem('munyaka_sysadmin_pass', activeStored);
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
    await new Promise(r => setTimeout(r, 700));

    // AuthContext.login accepts both the staffId (e.g. "teacher1", "T001")
    // and the email as the username field. Pass the staffId directly.
    const success = await login(trimmedId, trimmedPass);
    if (success) {
      // Look up the staff ledger (if any) so we can route based on system role
      const savedLedgerJson = localStorage.getItem('munyaka_staff_prereg');
      const staffLedger: PreRegisteredStaff[] = savedLedgerJson
        ? JSON.parse(savedLedgerJson)
        : [];
      const match = staffLedger.find(
        s => s.staffId && s.staffId.toLowerCase() === trimmedId.toLowerCase()
      );
      const systemRole = match?.systemRole ?? 'subject_teacher';
      showSuccess(match ? `Welcome, ${match.fullName}!` : 'Welcome!');
      navigate(getStaffRedirectPath(systemRole), { replace: true });
    } else {
      setStaffAuthError('Invalid Staff ID or Password. Please try again.');
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
                    hasCustomPassword={activeCredentials.system_admin.source === 'custom'}
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
                          {activeCredentials[selectedAdminRole!].source === 'custom' ? (
                            <span className="flex items-center gap-1">
                              <KeyRound size={9} />
                              Custom PIN — set via Configuration &rarr; Owner Security
                            </span>
                          ) : (
                            <>
                              Default PIN:{' '}
                              <span className="font-bold">{activeCredentials[selectedAdminRole!].password}</span>
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
                    hasCustomPassword={activeCredentials.super_admin.source === 'custom'}
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
                          {activeCredentials[selectedAdminRole!].source === 'custom' ? (
                            <span className="flex items-center gap-1">
                              <KeyRound size={9} />
                              Custom PIN — set via Configuration &rarr; Owner Security
                            </span>
                          ) : (
                            <>
                              Default PIN:{' '}
                              <span className="font-bold">{activeCredentials[selectedAdminRole!].password}</span>
                            </>
                          )}
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
                    {/* Staff ID / Username */}
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

                    {/* Password / Access Code */}
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
                      Don't have credentials? Contact the School Administrator to pre-register your account.
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
