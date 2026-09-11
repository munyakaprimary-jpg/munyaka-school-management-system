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
  GraduationCap,
  BookOpen,
  Package,
  Beaker,
  Monitor,
  Briefcase,
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
import type { LoginFailure, LoginSuccess } from '@/services/mobileAuthService';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';
import CoverPage from './CoverPage';

/** True when a custom admin password has been saved to localStorage. */
const hasCustomAdminPassword = (): boolean => {
  try {
    const stored = localStorage.getItem(MUNYAKA_ADMIN_PASSWORD);
    return stored != null && String(stored).trim().length > 0;
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
    description: 'Full administrative access to manage school operations',
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
    defaultPassword: 'munyaka2026',
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
                <KeyRound size={9} /> Custom PIN
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
  const [selectedAdminRole, setSelectedAdminRole] = useState<AdminRole | null>('admin');
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
    const [selectedSupportRole, setSelectedSupportRole] = useState<string | null>(null);

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
    const entered = String(adminPassword || '').trim().replace(/\n$/, '');

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
      
      const trimmedId = String(staffId || '').trim();
      const trimmedPass = String(staffPassword || '').trim();
  
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
  
      // ── Try LAN server login with 3-second timeout ───────────────────────────────────
      let serverLoginSuccess = false;
      let serverLoginResult: LoginSuccess | null = null;
      
      try {
        // Create a promise with 3-second timeout
        const serverLoginPromise = teacherLogin(trimmedId, trimmedPass);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Server timeout')), 3000)
        );
        
        const result = await Promise.race([serverLoginPromise, timeoutPromise]);
        
        if (result.success) {
          serverLoginSuccess = true;
          serverLoginResult = result;
          console.log('[Login] LAN auth succeeded:', result.user);
        }
      } catch (error) {
        // Server login failed or timed out - proceed to offline authentication
        console.log('[Login] LAN auth failed or timed out, proceeding to offline authentication:', error);
      }
  
      // ── If server login succeeded, use it ───────────────────────────────────────────
      if (serverLoginSuccess && serverLoginResult) {
        const userData = {
          id: serverLoginResult.user.id,
          name: serverLoginResult.user.name,
          email: serverLoginResult.user.email || trimmedId,
          phone: serverLoginResult.user.phone || '',
          role: serverLoginResult.user.role || 'teacher',
          staff_id: serverLoginResult.user.staff_id,
          tsc_number: serverLoginResult.user.tsc_number,
          avatar: serverLoginResult.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        };
  
        try {
          localStorage.setItem('munyaka_session', JSON.stringify(userData));
        } catch { /* ignore */ }
  
        showSuccess(`Welcome, ${serverLoginResult.user.name}!`);
        navigate(getStaffRedirectPath(serverLoginResult.user.role || 'subject_teacher'), { replace: true });
        setIsStaffVerifying(false);
        return;
      }
  
      // ── Offline authentication strictly using localStorage munyaka_staff ─────────
      console.log('[Login] Attempting offline authentication strictly from munyaka_staff...');

      let foundUser = null;
      
      try {
        const staffData = localStorage.getItem('munyaka_staff');
        if (staffData) {
          const staffArray = JSON.parse(staffData);
          if (Array.isArray(staffArray)) {
            const inputId = trimmedId.toLowerCase().trim();
            const inputCode = trimmedPass.trim();
            const upperInputCode = inputCode.toUpperCase();
            
            foundUser = staffArray.find((s: any) => {
              const emailMatch =
                (s.email && String(s.email).toLowerCase().trim() === inputId) ||
                (s.registeredEmail && String(s.registeredEmail).toLowerCase().trim() === inputId);
              
              const staffIdMatch =
                (s.staffId && String(s.staffId).toLowerCase().trim() === inputId) ||
                (s.id && String(s.id).toLowerCase().trim() === inputId) ||
                (s.ref && String(s.ref).toLowerCase().trim() === inputId);

              const nationalIdMatch = s.nationalId && String(s.nationalId).trim() === trimmedId;
              const phoneMatch = s.phone && String(s.phone).replace(/\s/g, '') === trimmedId.replace(/\s/g, '');
              
              // If identifier matches email, registeredEmail, or code directly, authorize
              const storedAccessCode = s.accessCode ? String(s.accessCode).trim() : '';
              const storedTempCode = s.tempAccessCode ? String(s.tempAccessCode).trim() : '';
              const storedPin = s.pin ? String(s.pin).trim() : '';
              const storedPassword = s.password ? String(s.password).trim() : '';
              
              const codeMatch =
                storedAccessCode === inputCode ||
                storedAccessCode.toUpperCase() === upperInputCode ||
                storedTempCode === inputCode ||
                storedTempCode.toUpperCase() === upperInputCode ||
                storedPin === inputCode ||
                storedPin.toUpperCase() === upperInputCode ||
                storedPassword === inputCode ||
                storedPassword.toUpperCase() === upperInputCode ||
                s.ref === inputCode ||
                s.ref?.toUpperCase() === upperInputCode ||
                s.staffId === inputCode ||
                s.staffId?.toUpperCase() === upperInputCode ||
                (s.alternativePasswords && s.alternativePasswords.includes(inputCode));

              // If identifier is an email/staffId and access code matches
              const identifierMatch = emailMatch || staffIdMatch || nationalIdMatch || phoneMatch || (!emailMatch && !staffIdMatch && (inputCode === storedAccessCode || inputCode === storedTempCode));

              return identifierMatch && codeMatch;
            });
          }
        }
      } catch (error) {
        console.error('[Login] Error reading munyaka_staff:', error);
      }

      // ── Fallback to other local sources if not found in munyaka_staff ─────────
      if (!foundUser) {
        const fallbackSources = ['munyaka_staff_directory', 'munyaka_staff_prereg'];
        for (const source of fallbackSources) {
          try {
            const staffData = localStorage.getItem(source);
            if (!staffData) continue;
            const staffArray = JSON.parse(staffData);
            if (!Array.isArray(staffArray)) continue;
            
            const inputId = trimmedId.toLowerCase().trim();
            const inputCode = trimmedPass.trim();
            const upperInputCode = inputCode.toUpperCase();
            
            foundUser = staffArray.find((s: any) => {
              const emailMatch =
                (s.email && String(s.email).toLowerCase().trim() === inputId) ||
                (s.registeredEmail && String(s.registeredEmail).toLowerCase().trim() === inputId);
              
              const staffIdMatch =
                (s.staffId && String(s.staffId).toLowerCase().trim() === inputId) ||
                (s.id && String(s.id).toLowerCase().trim() === inputId) ||
                (s.ref && String(s.ref).toLowerCase().trim() === inputId);

              const nationalIdMatch = s.nationalId && String(s.nationalId).trim() === trimmedId;
              const phoneMatch = s.phone && String(s.phone).replace(/\s/g, '') === trimmedId.replace(/\s/g, '');
              
              const storedAccessCode = s.accessCode ? String(s.accessCode).trim() : '';
              const storedTempCode = s.tempAccessCode ? String(s.tempAccessCode).trim() : '';
              const storedPin = s.pin ? String(s.pin).trim() : '';
              const storedPassword = s.password ? String(s.password).trim() : '';
              
              const codeMatch =
                storedAccessCode === inputCode ||
                storedAccessCode.toUpperCase() === upperInputCode ||
                storedTempCode === inputCode ||
                storedTempCode.toUpperCase() === upperInputCode ||
                storedPin === inputCode ||
                storedPin.toUpperCase() === upperInputCode ||
                storedPassword === inputCode ||
                storedPassword.toUpperCase() === upperInputCode;
              
              return (emailMatch || staffIdMatch || nationalIdMatch || phoneMatch) && codeMatch;
            });
            if (foundUser) break;
          } catch (err) {
            console.error(`[Login] Error reading ${source}:`, err);
          }
        }
      }

      // ── If user found offline, log them in and assign session based on user.role ─
      if (foundUser) {
        const userRole = foundUser.systemRole || foundUser.role || foundUser.designation || 'staff';
        const userData = {
          id: foundUser.id || foundUser.staffId || foundUser.ref || `offline-${Date.now()}`,
          name: foundUser.name || foundUser.fullName || 'Unknown User',
          email: foundUser.email || foundUser.registeredEmail || '',
          phone: foundUser.phone || '',
          role: userRole,
          staff_id: foundUser.staffId || foundUser.ref || foundUser.id || '',
          tsc_number: foundUser.tscNumber || foundUser.tsc_no || foundUser.tsc_number || '',
          avatar: (foundUser.name || foundUser.fullName || 'U').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
        };

        // Ensure missing or blank staffId/tscNumber in directory are auto-populated if available
        if (!userData.staff_id || userData.staff_id === '-') {
          userData.staff_id = foundUser.staffId || foundUser.ref || foundUser.id || 'STF-001';
        }

        try {
          localStorage.setItem('munyaka_session', JSON.stringify(userData));
        } catch { /* ignore */ }

        showSuccess(`Welcome, ${userData.name}!`);
        navigate(getStaffRedirectPath(userRole), { replace: true });
        setIsStaffVerifying(false);
        return;
      }

      // ── Offline authentication failed ───────────────────────────────────────────────
      const errorMessage = 'Invalid credentials or account not registered.';
      
      setStaffAuthError(errorMessage);
      showError(errorMessage);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-amber-50/20 flex flex-col overflow-y-auto">
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
            <TabsList className="grid w-full grid-cols-4 h-12 rounded-2xl bg-slate-100 p-1 gap-1">
                          <TabsTrigger
                            value="admin"
                            className="rounded-xl text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-slate-500 transition-all"
                          >
                            <Settings2 size={12} className="mr-1 shrink-0" />
                            <span className="hidden sm:inline">Admin</span>
                            <span className="sm:hidden">Admin</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="super"
                            className="rounded-xl text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm text-slate-500 transition-all"
                          >
                            <Crown size={12} className="mr-1 shrink-0" />
                            <span className="hidden sm:inline">Owner</span>
                            <span className="sm:hidden">Owner</span>
                          </TabsTrigger>
              <TabsTrigger
                value="staff"
                className="rounded-xl text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm text-slate-500 transition-all"
              >
                <User size={12} className="mr-1 shrink-0" />
                <span className="hidden sm:inline">Teacher</span>
                <span className="sm:hidden">Staff</span>
              </TabsTrigger>
              <TabsTrigger
                value="support"
                className="rounded-xl text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm text-slate-500 transition-all"
              >
                <Briefcase size={12} className="mr-1 shrink-0" />
                <span className="hidden sm:inline">Support</span>
                <span className="sm:hidden">Support</span>
              </TabsTrigger>
            </TabsList>

            {/* ── ADMIN TAB ── */}
            <TabsContent value="admin" className="mt-4 space-y-4">
              <Card className="border-none shadow-2xl rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl shadow-xl bg-indigo-50 text-indigo-600 shadow-indigo-100 mb-4">
                      {AdminIcon && <AdminIcon size={32} />}
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                      {ROLE_CONFIGS.admin.label}
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                      {ROLE_CONFIGS.admin.fullDescription}
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
                    </div>
                    <Button
                      type="submit"
                      disabled={isAdminVerifying || !String(adminPassword || '').trim()}
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
            </TabsContent>

            {/* ── OWNER TAB ── */}
            <TabsContent value="super" className="mt-4 space-y-4">
              <Card className="border-none shadow-2xl rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl shadow-xl bg-amber-50 text-amber-600 shadow-amber-100 mb-4">
                      <Crown size={32} />
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                      {ROLE_CONFIGS.owner.label}
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                      {ROLE_CONFIGS.owner.fullDescription}
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
                    </div>
                    <Button
                      type="submit"
                      disabled={isAdminVerifying || !String(adminPassword || '').trim()}
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

            {/* ── SUPPORT STAFF TAB ── */}
            <TabsContent value="support" className="mt-4">
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
                      <Label htmlFor="support-staff-id" className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Email Address / Staff ID
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                          id="support-staff-id"
                          type="text"
                          autoCapitalize="none"
                          value={staffId}
                          onChange={e => { setStaffId(e.target.value); if (staffAuthError) setStaffAuthError(''); }}
                          placeholder="e.g. support@munyaka.sc.ke"
                          autoComplete="username"
                          className="h-12 md:h-14 pl-12 pr-4 rounded-xl bg-slate-50 border-none font-bold text-base focus:bg-white focus:ring-2 focus:ring-orange-200"
                        />
                      </div>
                    </div>

                    {/* Password / Access Code */}
                    <div className="space-y-2">
                      <Label htmlFor="support-staff-password" className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Access Code / Password
                      </Label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                          id="support-staff-password"
                          type={showStaffPassword ? 'text' : 'password'}
                          value={staffPassword}
                          onChange={e => { setStaffPassword(e.target.value); if (staffAuthError) setStaffAuthError(''); }}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          className="h-12 md:h-14 pl-12 pr-12 rounded-xl bg-slate-50 border-none font-bold text-base focus:bg-white focus:ring-2 focus:ring-orange-200"
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
                      className="w-full h-12 md:h-14 rounded-xl text-white font-black text-base shadow-xl gap-2 transition-all active:scale-95 bg-orange-600 hover:bg-orange-700 shadow-orange-100"
                    >
                      {isStaffVerifying ? (
                        <><Loader2 className="animate-spin" size={20} /> Signing In...</>
                      ) : (
                        <><Unlock size={20} /> Sign In as Support Staff</>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* ── Parent & Student Portal Link ── */}
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
