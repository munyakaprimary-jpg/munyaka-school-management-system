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
  Send,
  Mail,
  User,
  KeyRound,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { teacherLogin, checkServerHealth } from '@/services/mobileAuthService';
import { getApiBaseUrl } from '@/lib/apiBase';
import { PreRegisteredStaff, SYSTEM_ROLE_LABELS } from '@/types/staff-access';
import {
  MUNYAKA_ADMIN_PASSWORD,
  DEFAULT_ADMIN_PASSWORD,
  getActiveAdminPassword,
} from '@/services/adminCredentials';
import type { LoginFailure } from '@/services/mobileAuthService';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';
import CoverPage from './CoverPage';

/** True when a custom admin password has been saved to localStorage. */
const hasCustomAdminPassword = (): boolean => {
  try {
    const stored = localStorage.getItem(MUNYAKA_ADMIN_PASSWORD);
    return stored != null && stored.trim().length > 0;
  } catch {
    return false;
  }
};

// ─── Admin role configs ─────────────────────────────────────────────────────
//
// NOTE: Owner and Super Admin are TWO DISTINCT entities in this app:
//   - owner        → BILLING-ONLY role.   Lands on Owner Dashboard. Only sees
//                    subscription / payment / financial-health widgets.
//                    No access to learners, attendance, settings, etc.
//   - admin  → OPERATIONAL FULL ADMIN role.  Manages users, RBAC, ICT
//                    systems, system settings, etc.  No special billing privs.
//
// The owner and admin share the same ADMIN PIN override flow
// so they can both authenticate when the lock screen is active, but they have
// entirely separate permission matrices.

type AdminRole = 'admin' | 'owner';

interface RoleConfig {
  id: AdminRole;
  label: string;
  description: string;
  fullDescription: string;
  email: string;
  userName: string;
  userRole: 'owner' | 'admin';
  redirectPath: string;
  icon: LucideIcon;
  primaryColor: 'indigo' | 'amber';
  defaultPassword: string;
}

const ROLE_CONFIGS: Record<AdminRole, RoleConfig> = {
  admin: {
    id: 'admin',
    label: 'School Administrator',
    description: 'Full access: Settings, Users, Fees, Academics, RBAC, Security',
    fullDescription: 'Manage system settings, users, academics, RBAC permissions, and overall school operations.',
    email: 'sysadmin@munyaka.sc.ke',
    userName: 'School Administrator',
    userRole: 'admin',
    redirectPath: '/system-management',
    icon: Settings2,
    primaryColor: 'indigo',
    defaultPassword: DEFAULT_ADMIN_PASSWORD,
  },
  owner: {
    id: 'owner',
    label: 'School Owner',
    description: 'Billing & Subscription Console — Owner Dashboard',
    fullDescription: 'Dedicated access to subscriptions, payment management, financial health, and seat utilization. No access to operational routes (learners, attendance, settings).',
    email: 'munyakaprimary@gmail.com',
    userName: 'School Owner',
    userRole: 'owner',
    redirectPath: '/dashboard',
    icon: Crown,
    primaryColor: 'amber',
    defaultPassword: 'ownerpass2026',
  },
};

// ─── Post-login redirect ────────────────────────────────────────────────────
// All authenticated users (regardless of role) land on the main dashboard.
// This intentionally bypasses any secondary landing / role-selection screens.

function getStaffRedirectPath(_systemRole: string): string {
  return '/dashboard';
}

// ─── Role card for admin tab ─────────────────────────────────────────────────

interface RoleCardProps {
  role: RoleConfig;
  onClick: () => void;
  bgColor: string;
  textColor: string;
  borderColor: string;
  featureIcons: { Icon: LucideIcon; label: string }[];
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

  // ── Cover page state ────────────────────────────────────────────────────
  const [showCover, setShowCover] = useState(true);

  // ── Admin state ──────────────────────────────────────────────────────────
  const [selectedAdminRole, setSelectedAdminRole] = useState<AdminRole | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState('');
  const [isAdminVerifying, setIsAdminVerifying] = useState(false);

  // ── Staff state ──────────────────────────────────────────────────────────
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
        // Bypass any secondary landing / role-selection screens: every
        // authenticated user goes straight to the main dashboard.
        navigate('/dashboard', { replace: true });
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

    // ── Direct localStorage read on every attempt ───────────────────────────
    // We never trust React state for the active PIN — always read fresh so
    // a PIN updated from the Configuration tab is picked up immediately.
    const activeStored = getActiveAdminPassword();

    // ── Debug logging (development only) ────────────────────────────────────
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[AdminLogin]', {
        key: MUNYAKA_ADMIN_PASSWORD,
        stored: activeStored,
        entered,
        match: entered === activeStored,
        default: DEFAULT_ADMIN_PASSWORD,
        defaultMatch: entered === DEFAULT_ADMIN_PASSWORD,
      });
    }

    // ── Password verification ─────────────────────────────────────────────
    // Accept the stored PIN and also fall back to the hard-coded default,
    // so the admin can sign in regardless of which PIN they last set.
    const isValid = entered === activeStored || entered === DEFAULT_ADMIN_PASSWORD;

    if (!isValid) {
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
                roleIcon: selectedAdminRole === 'owner' ? 'crown' : 'settings',
                timestamp: Date.now(),
              };
          localStorage.setItem('munyaka_admin_session', JSON.stringify(adminSession));
          showSuccess(`Welcome, ${config.userName}!`);
          // Send every authenticated user straight to the main dashboard,
          // bypassing any role-specific landing screens.
          navigate('/dashboard', { replace: true });
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
      setStaffAuthError('Please enter your Email Address, TSC Number, or Staff ID.');
      return;
    }
    // Accept email, TSC number (digits/hyphens), or staff ID (alphanumeric)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(trimmedId);
    const isStaffId = /^[a-z0-9_-]+$/i.test(trimmedId);
    const isTscNumber = /^[0-9/-]+$/.test(trimmedId);
    if (!isEmail && !isStaffId && !isTscNumber) {
      setStaffAuthError('Please enter a valid email address, TSC Number, or Staff ID.');
      return;
    }
    if (!trimmedPass) {
      setStaffAuthError('Please enter your Password.');
      return;
    }

    setIsStaffVerifying(true);
    setStaffAuthError('');

    console.log(`[Login] Staff login attempt — server: ${getApiBaseUrl()}, identifier: ${trimmedId}`);

    // ── Authenticate against the LAN backend (mobile / APK deployments) ─────
    const result = await teacherLogin(trimmedId, trimmedPass);

    if (result.success) {
      console.log('[Login] LAN auth succeeded:', result.user);

      // Persist the authenticated user so the rest of the app can read it
      const userData = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email || trimmedId,
        phone: result.user.phone || '',
        role: result.user.role || 'teacher',
        staff_id: result.user.staff_id,
        tsc_number: result.user.tsc_number,
        avatar: result.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      };

      try {
        localStorage.setItem('munyaka_session', JSON.stringify(userData));
      } catch { /* ignore */ }

      showSuccess(`Welcome, ${result.user.name}!`);
      navigate(getStaffRedirectPath(result.user.role || 'subject_teacher'), { replace: true });
      setIsStaffVerifying(false);
      return;
    }

    // ── Server rejected the credentials or is unreachable ─────────────────
    console.warn('[Login] LAN auth failed:', result);

    // TypeScript doesn't always narrow discriminated unions across catch-all
    // conditionals, so we narrow explicitly here.
    if (result.success) return;
    const failure = result as LoginFailure;

    // ── Network errors: show as native alert (impossible to miss in APK) ──
    //    plus the inline error banner. The native alert survives screen
    //    rotation, app backgrounding, and is the first thing a field
    //    technician will see when troubleshooting an APK install.
    if (failure.code === 'NETWORK_ERROR') {
      const networkMsg = failure.error;
      setStaffAuthError(networkMsg);
      showError(networkMsg);

      // Fire a native alert on Capacitor for unmissable diagnostics.
      // On plain web this falls through to the toast/inline error.
      try {
        if ((window as any).Capacitor?.isNativePlatform?.()) {
          const { Plugins } = (window as any).Capacitor;
          if (Plugins?.Dialog?.alert) {
            await Plugins.Dialog.alert({
              title: '⚠️ Network Error',
              message: networkMsg + '\n\nCheck that:\n• The LAN server is running\n• The Server IP in Settings is correct\n• The phone is on the same Wi-Fi as the server',
            });
          }
        } else if (typeof window !== 'undefined' && (window as any).alert) {
          // Fallback: browser alert (works in dev mode on Chrome / Safari)
          window.alert(`⚠️ Network Error\n\n${networkMsg}\n\nCheck that:\n• The LAN server is running\n• The Server IP in Settings is correct\n• The phone is on the same Wi-Fi as the server`);
        }
      } catch { /* ignore alert failures */ }

      console.error(`[Login] Server unreachable: ${failure.attemptedUrl}`);
      setIsStaffVerifying(false);
      return;
    }

    // ── Credential / role / server errors: differentiated messages ──────
    let displayMessage: string;
    let alertTitle: string | null = null;

    if (failure.code === 'INVALID_CREDENTIALS') {
      displayMessage = '❌ Invalid Password — The TSC Number / Staff ID or Password is incorrect. Please check your credentials and try again.';
      alertTitle = 'Invalid Credentials';
    } else if (failure.code === 'ROLE_NOT_ALLOWED') {
      displayMessage = '🚫 Access Denied — This account type is not permitted to sign in on this device. Contact the school administrator.';
      alertTitle = 'Role Not Authorized';
    } else if (failure.code === 'SERVER_ERROR') {
      displayMessage = `🔧 Server Error — ${failure.error}`;
      alertTitle = 'Server Error';
    } else {
      displayMessage = failure.error || 'Login failed. Please try again.';
    }

    setStaffAuthError(displayMessage);
    showError(displayMessage);

    // Native alert for credential/role errors too — these are the most
    // common field issues and the technician needs an unambiguous signal
    // distinguishing "you typed the wrong password" from "the server is down".
    if (alertTitle && (window as any).Capacitor?.isNativePlatform?.()) {
      try {
        const { Plugins } = (window as any).Capacitor;
        if (Plugins?.Dialog?.alert) {
          await Plugins.Dialog.alert({ title: alertTitle, message: displayMessage });
        }
      } catch { /* ignore */ }
    }

    setIsStaffVerifying(false);
  };

  // ── Lightweight server reachability check on mount ──────────────────────
  useEffect(() => {
    let cancelled = false;
    checkServerHealth().then((status) => {
      if (cancelled) return;
      if (!status.reachable) {
        // Soft warning — the user can still try to log in, the service
        // will surface the network error in the form if the server is
        // genuinely unreachable. We just log it for diagnostics.
        console.warn(`[Login] Health check: ${status.error} — server may be offline`);
      } else {
        console.log(`[Login] Health check: server reachable in ${status.latencyMs}ms`);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
    //  Render — only shown when user is NOT authenticated
    // ─────────────────────────────────────────────────────────────────────────
    const adminConfig = selectedAdminRole ? ROLE_CONFIGS[selectedAdminRole] : null;
    const AdminIcon = adminConfig?.icon;
    const isAdminIndigo = adminConfig?.primaryColor === 'indigo';
  
    // ── Show Cover Page first ─────────────────────────────────────────────────
    if (showCover) {
      return (
        <CoverPage
          onEnter={() => setShowCover(false)}
        />
      );
    }
  
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-amber-50/20 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4 py-8">
          <div className="w-full max-w-2xl space-y-6 animate-in fade-in zoom-in-95 duration-500">
  
            {/* ── Header ── */}
                      <div className="text-center space-y-3">
                        {/* Back to Cover button */}
                        <button
                          type="button"
                          onClick={() => setShowCover(true)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors mb-2 group"
                        >
                          <ArrowRight
                            size={14}
                            className="rotate-180 transition-transform group-hover:-translate-x-1"
                          />
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

          {/* ── Portal Access Tabs ── */}
          <Tabs defaultValue="staff" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 rounded-2xl bg-slate-100 p-1 gap-1">
                          <TabsTrigger
                            value="admin"
                            className="rounded-xl text-xs font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-slate-500 transition-all"
                          >
                            <Settings2 size={14} className="mr-1.5 shrink-0" />
                            <span className="hidden sm:inline">Admin</span>
                            <span className="sm:hidden">Admin</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="super"
                            className="rounded-xl text-xs font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm text-slate-500 transition-all"
                          >
                            <Crown size={14} className="mr-1.5 shrink-0" />
                            <span className="hidden sm:inline">Owner</span>
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

            {/* ── ADMIN TAB ── */}
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
                                role={ROLE_CONFIGS.admin}
                                onClick={() => handleRoleSelect('admin')}
                                bgColor="bg-indigo-50"
                                textColor="text-indigo-700"
                                borderColor="border-indigo-200"
                                featureIcons={[
                                  { Icon: Users, label: 'Users' },
                                  { Icon: Settings2, label: 'Settings' },
                                  { Icon: Shield, label: 'RBAC' },
                                ]}
                                hasCustomPassword={hasCustomAdminPassword()}
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
                          <><Unlock size={20} /> Sign In</>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── OWNER TAB ── */}
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
                                role={ROLE_CONFIGS.owner}
                                onClick={() => handleRoleSelect('owner')}
                                bgColor="bg-amber-50"
                                textColor="text-amber-700"
                                borderColor="border-amber-200"
                                featureIcons={[
                                  { Icon: CreditCard, label: 'Payments' },
                                  { Icon: Crown, label: 'Owner' },
                                  { Icon: Shield, label: 'Billing' },
                                ]}
                                hasCustomPassword={hasCustomAdminPassword()}
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
                  {staffAuthError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                      <ShieldAlert size={18} className="shrink-0" />
                      <span>{staffAuthError}</span>
                    </div>
                  )}

                  <form onSubmit={handleStaffLogin} className="space-y-5">
                    {/* Email Address */}
                    <div className="space-y-2">
                      <Label htmlFor="staff-id" className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                          id="staff-id"
                          type="email"
                          inputMode="email"
                          autoCapitalize="none"
                          value={staffId}
                          onChange={e => { setStaffId(e.target.value); if (staffAuthError) setStaffAuthError(''); }}
                          placeholder="e.g. teacher@school.com"
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
