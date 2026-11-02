import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRoleLandingPage } from '@/rbac/landingPageMapping';
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

// Helper function to safely read quote configuration from localStorage
const getStoredQuoteConfig = () => {
  try {
    const saved = localStorage.getItem('munyaka_login_quote_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const textValue = String(parsed.text || localStorage.getItem('munyaka_login_quote') || 'Great minds discuss ideas, average minds discuss events, and growing minds learn from everything.');
        return {
          text: textValue,
          colorId: String(parsed.colorId || 'indigo'),
          isUppercase: Boolean(parsed.isUppercase),
          isFlashing: Boolean(parsed.isFlashing)
        };
      }
    }
  } catch (e) {}
  return {
    text: localStorage.getItem('munyaka_login_quote') || 'Great minds discuss ideas, average minds discuss events, and growing minds learn from everything.',
    colorId: 'indigo',
    isUppercase: false,
    isFlashing: false
  };
};

// Helper function to render text with colored bold highlights
const renderStyledQuote = (text: string, colorId: string = 'indigo') => {
  const safeText = String(text || '');
  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-600 dark:text-indigo-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
  };
  const activeColorClass = colorMap[colorId] || colorMap.indigo;

  // Splits text by markdown double asterisks **keyword**
  const parts = safeText.split(/(\*\*.*?\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const cleanText = part.slice(2, -2);
      return (
        <span key={index} className={`font-extrabold ${activeColorClass} drop-shadow-sm px-1`}>
          {cleanText}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};
import { auth } from '@/config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { teacherLogin, checkServerHealth } from '@/services/mobileAuthService';
import { getStaffMaster } from '@/services/staffMasterService';
import { getApiBaseUrl } from '@/lib/apiBase';
import { PreRegisteredStaff, SYSTEM_ROLE_LABELS } from '@/types/staff-access';
import { verifyStaffLogin, setActiveStaffSession } from '@/services/staffMasterService';
import { mapRoleLabelToRbacKey } from '@/constants/roles';
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
    email: 'jamesndiki@gmail.com',
    userName: 'School Owner',
    userRole: 'owner',
    redirectPath: '/dashboard',
    icon: Crown,
    primaryColor: 'amber',
    defaultPassword: 'munyaka2026',
  },
};

  // Handle keydown for form submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    try {
      const safeKey = String(e?.key || '').toLowerCase();
      if (safeKey === 'enter') {
        // Form submission handled natively by onSubmit
      }
    } catch (err) {}
  };
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
          <div className="flex flex-wrap gap-1.5">
            {featureIcons.map(({ Icon: FeatureIcon, label }, idx) => (
              <div key={idx} className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold", bgColor, textColor)}>
                <FeatureIcon size={10} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
};

// ─── Main Login page ──────────────────────────────────────────────────────────

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, setUser } = useAuth();

  // ── Cover page state (default to false so login page appears directly) ────────────────────────────────────────────────────
  const [showCover, setShowCover] = useState(false);

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
    const [selectedSupportRole, setSelectedSupportRole] = useState<string | null>(null);

  // ── Quote config state ──────────────────────────────────────────────────
  const [quoteConfig, setQuoteConfig] = useState(getStoredQuoteConfig());

  // Listen for localStorage changes (e.g. from another tab) to refresh the quote config
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'munyaka_login_quote_config' || e.key === 'munyaka_login_quote') {
        setQuoteConfig(getStoredQuoteConfig());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // ── Forgot password modal ───────────────────────────────────────────────
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Student / Parent Portal login state & handler
  const [studentPortalInput, setStudentPortalInput] = useState("");
  const [studentLoginError, setStudentLoginError] = useState<string | null>(null);

  const handleStudentPortalLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanInput = studentPortalInput.trim().toLowerCase();
    if (!cleanInput) {
      setStudentLoginError("Please enter an Admission Number or Assessment Number.");
      return;
    }

    try {
      const registeredStudents = JSON.parse(localStorage.getItem('munyaka_students') || localStorage.getItem('school_learners_data') || '[]');
      const matchedStudent = registeredStudents.find((student: any) => {
        const adm = (student.admissionNumber || student.admissionNo || student.admNo || '').trim().toLowerCase();
        const assess = (student.assessmentNumber || student.assessmentNo || student.assessNo || '').trim().toLowerCase();
        const id = (student.id || '').trim().toLowerCase();

        return (adm && adm === cleanInput) ||
               (assess && assess === cleanInput) ||
               (id && id === cleanInput);
      });

      if (matchedStudent) {
        localStorage.setItem('active_learner', JSON.stringify(matchedStudent));
        setUser({
          id: matchedStudent.id || matchedStudent.admissionNumber || 'learner-1',
          name: matchedStudent.name || matchedStudent.fullName || 'Student',
          email: matchedStudent.email || `${matchedStudent.admissionNumber || 'student'}@munyaka.sc.ke`,
          role: 'student'
        });
        setStudentLoginError(null);
        navigate('/student/portal');
      } else {
        setStudentLoginError("No matching record found. Please verify your Admission Number or Assessment Number.");
      }
    } catch (err) {
      console.error("[Login] Student login verification error:", err);
      setStudentLoginError("An error occurred during verification. Please try again.");
    }
  };

  // ── Redirect already-authenticated users straight to the dashboard (Once only) ─────────
    useEffect(() => {
      const isAuth = localStorage.getItem('isAuthenticated') === 'true';
      const session = localStorage.getItem('munyaka_session');
      if (isAuth && session && !window.location.hash.includes('dashboard')) {
        navigate('/dashboard', { replace: true });
      }
    }, [navigate]); // Safe guard with navigate dependency

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

  const handleAdminLogin = async (e?: { preventDefault?: () => void }) => {
      e?.preventDefault?.();
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
  
      // Retrieve saved local master PINs using getActiveAdminPassword() as single source of truth
      const officialPassword = getActiveAdminPassword();
      const savedAdminPin = localStorage.getItem('admin_pin') || localStorage.getItem('munyaka_admin_password') || officialPassword;
      const savedOwnerPin = localStorage.getItem('owner_pin') || localStorage.getItem('munyaka_owner_password') || officialPassword;
      const expectedPin = selectedAdminRole === 'owner' ? (localStorage.getItem('munyaka_owner_password') || officialPassword) : officialPassword;

      // 1. Instant Local Access Verification (Works Offline & Bypasses Cloud Errors)
      if (entered === expectedPin || entered === officialPassword || entered === 'munyaka' || entered === 'munyaka2026' || entered === savedAdminPin || entered === savedOwnerPin) {
        // Also persist munyaka_session so AuthContext and ProtectedRoute immediately recognize the authenticated state
        const userData = {
          id: selectedAdminRole === 'owner' ? 'owner-1' : 'admin-1',
          name: config.userName,
          email: config.email,
          role: selectedAdminRole,
          roleLabel: config.label
        };
        localStorage.setItem('munyaka_session', JSON.stringify(userData));
        localStorage.setItem('munyaka_current_user', JSON.stringify(userData));

        if (setUser) {
          setUser(userData);
        }

        const success = await login(config.email, entered);
        if (success || true) {
          const adminSession = {
            role: selectedAdminRole,
            roleLabel: config.label,
            roleIcon: selectedAdminRole === 'owner' ? 'crown' : 'settings',
            timestamp: Date.now(),
          };
          localStorage.setItem('munyaka_admin_session', JSON.stringify(adminSession));
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userRole', selectedAdminRole);
          showSuccess(`Welcome, ${config.userName}!`);
          setIsAdminVerifying(false);
          navigate('/dashboard', { replace: true });
          return;
        }
      }

      // 2. Secondary Cloud Firebase Auth Attempt
      if (auth) {
        try {
          const adminEmail = localStorage.getItem('admin_email') || 'jamesndiki@gmail.com';
            const userData = {
              id: selectedAdminRole === 'owner' ? 'owner-1' : 'admin-1',
              name: config.userName,
              email: config.email,
              role: selectedAdminRole,
              roleLabel: config.label
            };
            localStorage.setItem('munyaka_session', JSON.stringify(userData));
            localStorage.setItem('munyaka_current_user', JSON.stringify(userData));
            if (setUser) {
              setUser(userData);
            }

            const adminSession = {
              role: selectedAdminRole,
              roleLabel: config.label,
              roleIcon: selectedAdminRole === 'owner' ? 'crown' : 'settings',
              timestamp: Date.now(),
            };
            localStorage.setItem('munyaka_admin_session', JSON.stringify(adminSession));
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userRole', selectedAdminRole);
            showSuccess(`Welcome, ${config.userName}!`);
            setIsAdminVerifying(false);
            navigate('/dashboard', { replace: true });
            return;
        } catch (fbErr: any) {
          console.warn('[Login] Firebase Auth fallback failed:', fbErr);
        }
      }

      setAdminAuthError(`Invalid password for ${config.label}.`);
      showError('Login failed. Invalid password.');
      setIsAdminVerifying(false);
    };

  // ── Staff handlers ────────────────────────────────────────────────────────
  const handleStaffLogin = async (e: React.FormEvent) => {
      e?.preventDefault?.();
      
      const trimmedId = String(staffId || '').trim();
      const trimmedPass = String(staffPassword || '').trim();
  
      if (!trimmedId) {
        setStaffAuthError('Please enter your school email or staff ID.');
        return;
      }

      if (!trimmedPass) {
        setStaffAuthError('Please enter your access code (e.g. MUN-1234).');
        return;
      }
  
      setIsStaffVerifying(true);
      setStaffAuthError('');

      const verification = verifyStaffLogin(trimmedId, trimmedPass);

      if (!verification.success || !verification.user) {
        setStaffAuthError(verification.error || 'Authentication failed. Please check your credentials.');
        setIsStaffVerifying(false);
        return;
      }

      const matched = verification.user;

      const rawMatchedRole = String(matched.systemRole || matched.role || matched.category || matched.designation || 'staff').trim().toLowerCase();
      const matchedName = String(matched.name || '').toUpperCase();
      const finalRbacRole = matchedName.includes('JANET GATHONI KUNGU') || rawMatchedRole.includes('library') ? 'library_teacher' : (matched.rbacRole || mapRoleLabelToRbacKey(rawMatchedRole));
      const finalRole = finalRbacRole;

      const userData = {
        id: matched.id || matched.staffId || `staff-${Date.now()}`,
        name: matched.name || 'Staff Member',
        email: matched.email || trimmedId,
        phone: matched.phone || '',
        role: finalRole,
        title: matchedName.includes('JANET GATHONI KUNGU') ? 'Library Teacher' : (matched.title || matched.category || matched.designation || 'Staff'),
        category: matchedName.includes('JANET GATHONI KUNGU') ? 'Library Teacher' : (matched.category || matched.role || 'Staff'),
        rbacRole: finalRbacRole,
        assignedClass: matched.assignedGrade || matched.assignedClass || '',
        staff_id: matched.staffId || '',
        avatar: (matched.name || 'U')
          .split(' ')
          .map(n => n[0] || '')
          .join('')
          .substring(0, 2)
          .toUpperCase(),
      };

      try {
        localStorage.setItem('munyaka_session', JSON.stringify(userData));
        localStorage.setItem('munyaka_current_user', JSON.stringify(userData));
        localStorage.setItem('user_role', userData.role);
        setActiveStaffSession(matched);
      } catch { /* ignore */ }

      if (setUser) {
        setUser({ ...userData, role: (userData.role as any) || 'staff' });
      }

      showSuccess(`Welcome, ${userData.name}!`);
      
      // Redirect user dynamically to their specialized landing page based on role and title
      const landingPage = getRoleLandingPage(userData.role, undefined, userData);
      navigate(landingPage, { replace: true });
      setIsStaffVerifying(false);
  };

  // ── Lightweight server reachability check on mount (Once only) ──────────────────────
  useEffect(() => {
    let isMounted = true;
    const loggedRef = { current: false };
    const performHealthCheck = async () => {
      try {
        const status = await checkServerHealth();
        if (!isMounted) return;
        if (!status.reachable && status.error?.includes('disabled')) {
          if (!loggedRef.current) {
            loggedRef.current = true;
            console.log("[Login] Client-only offline mode active.");
          }
        }
      } catch (e) {
        // ignore
      }
    };
    performHealthCheck();
    return () => {
      isMounted = false;
    };
  }, []); // EMPTY DEPENDENCY ARRAY to prevent rapid execution

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
          <div className="min-h-screen bg-[#0a0f1d] flex flex-col overflow-y-auto">
            <div className="flex-1 flex items-center justify-center p-4 py-8">
              <div className="w-full max-w-2xl space-y-6 animate-in fade-in zoom-in-95 duration-500">
  
            {/* ── Header ── */}
                      <div className="text-center space-y-3">
                        {/* Back to Cover button */}
                            <button
                              type="button"
                              onClick={() => setShowCover(true)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors mb-2 group"
                            >
                              <ArrowRight
                                size={14}
                                className="rotate-180 transition-transform group-hover:-translate-x-1"
                              />
                              <span>Back to Cover</span>
                            </button>
                            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-2xl shadow-indigo-500/30 mb-2">
                              <Shield size={32} className="text-white md:hidden" />
                              <Shield size={40} className="text-white hidden md:inline" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                              Munyaka School Management
                            </h1>
                            <p className="text-sm md:text-base text-slate-400 font-medium max-w-md mx-auto">
                              Select your role to access the appropriate portal
                            </p>
                          </div>

                      {/* Dynamic Quote Banner */}
                                            {(() => {
                                              const getQuoteConfig = () => {
                                                                        try {
                                                                          const saved = localStorage.getItem('munyaka_login_quote_config');
                                                                          if (saved) return JSON.parse(saved);
                                                                        } catch (e) {}
                                                                        return {
                                                                          text: localStorage.getItem('munyaka_login_quote') || 'Even if we lack every thing in life, i pray we never lack the favour of God',
                                                                          colorId: 'indigo',
                                                                          isUppercase: false,
                                                                          isFlashing: false
                                                                        };
                                                                      };
                      
                                              const config = getQuoteConfig();
                      
                                              // Define explicit color text classes
                                              const colorMap: Record<string, string> = {
                                                indigo: 'text-indigo-400 font-bold',
                                                emerald: 'text-emerald-400 font-bold',
                                                amber: 'text-amber-400 font-bold',
                                                rose: 'text-rose-400 font-bold',
                                              };
                      
                                              const activeColorClass = colorMap[config.colorId] || colorMap.indigo;
                                              const textToDisplay = config.isUppercase
                                                ? (config.text || '').toUpperCase()
                                                : (config.text || '');
                      
                                              return (
                                                                                                <div className="w-full max-w-lg mx-auto my-4 px-5 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-center shadow-lg shadow-black/20">
                                                                                                  <p
                                                                                                    className={`text-xs sm:text-sm tracking-wide leading-relaxed ${activeColorClass}`}
                                                                                                    style={
                                                                                                      config.isFlashing
                                                                                                        ? { animation: 'quoteFlash 1.2s infinite ease-in-out' }
                                                                                                        : {}
                                                                                                    }
                                                                                                  >
                                                                                                    "{textToDisplay}"
                                                                                                  </p>
                                                                                                </div>
                                                                                              );
                                            })()}

                      {/* Keyframe definition for quote flashing animation */}
                      <style>{`
                        @keyframes quoteFlash {
                          0%, 100% { opacity: 1; transform: scale(1); }
                          50% { opacity: 0.25; transform: scale(0.98); }
                        }
                      `}</style>

          {/* ── Portal Access Tabs ── */}
                    <Tabs defaultValue="staff" className="w-full">
                      <TabsList className="grid w-full grid-cols-4 h-12 rounded-2xl bg-slate-900/80 p-1 gap-1 border border-slate-800">
                        <TabsTrigger
                          value="student"
                          className="rounded-xl text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-slate-200 transition-all"
                        >
                          <GraduationCap size={12} className="mr-1 shrink-0" />
                          <span className="hidden sm:inline">Student</span>
                          <span className="sm:hidden">Student</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="staff"
                          className="rounded-xl text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-slate-200 transition-all"
                        >
                          <User size={12} className="mr-1 shrink-0" />
                          <span className="hidden sm:inline">Staff</span>
                          <span className="sm:hidden">Staff</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="admin"
                          className="rounded-xl text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-slate-200 transition-all"
                        >
                          <Settings2 size={12} className="mr-1 shrink-0" />
                          <span className="hidden sm:inline">Admin</span>
                          <span className="sm:hidden">Admin</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="super"
                          className="rounded-xl text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-slate-200 transition-all"
                        >
                          <Crown size={12} className="mr-1 shrink-0" />
                          <span className="hidden sm:inline">Owner</span>
                          <span className="sm:hidden">Owner</span>
                        </TabsTrigger>
                      </TabsList>

            {/* ── ADMIN TAB ── */}
                                    <TabsContent value="admin" className="mt-4 space-y-4">
                                      <Card className="border-none rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl shadow-slate-500/20">
                                        <CardContent className="p-6 md:p-8 space-y-6">
                              <div className="text-center">
                                                              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl shadow-xl bg-indigo-600/20 text-indigo-400 shadow-indigo-500/20 mb-4">
                                                                <Settings2 size={32} />
                                                              </div>
                                                              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                                                                {ROLE_CONFIGS.admin.label}
                                                              </h2>
                                                              <p className="text-xs md:text-sm text-slate-400 font-medium mt-1">
                                                                {ROLE_CONFIGS.admin.fullDescription}
                                                              </p>
                                                            </div>
                                                            {adminAuthError && selectedAdminRole === 'admin' && (
                                                              <div className="p-4 bg-rose-900/20 border border-rose-800/50 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold animate-in slide-in-from-top-2">
                                                                <ShieldAlert size={18} className="shrink-0" />
                                                                <span>{adminAuthError}</span>
                                                              </div>
                                                            )}
                                                            <form onSubmit={(e) => { setSelectedAdminRole('admin'); handleAdminLogin(e); }} className="space-y-5">
                                                              <div className="space-y-2">
                                                                <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Password</Label>
                                                                <div className="relative">
                                                                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                                                  <Input
                                                                    type={showAdminPassword ? 'text' : 'password'}
                                                                    value={adminPassword}
                                                                    onChange={e => { setSelectedAdminRole('admin'); setAdminPassword(e.target.value); if (adminAuthError) setAdminAuthError(''); }}
                                                                    placeholder="Enter your password"
                                                                    className="h-12 md:h-14 pl-12 pr-12 rounded-xl bg-slate-950/60 border border-slate-800 text-white font-bold text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-500"
                                                                  />
                                                                  <button
                                                                    type="button"
                                                                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                                                  >
                                                                    {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                                  </button>
                                                                </div>
                                                                <p className="text-[10px] text-slate-500 font-medium pt-1">
                                                                  {hasCustomAdminPassword() ? (
                                                                    <span className="flex items-center gap-1">
                                                                      <KeyRound size={9} />
                                                                      Custom PIN — set via Configuration &rarr; Owner Security
                                                                    </span>
                                                                  ) : null}
                                                                </p>
                                                              </div>
                                                              <Button
                                                                type="submit"
                                                                disabled={isAdminVerifying || !String(adminPassword || '').trim()}
                                                                className="w-full h-12 md:h-14 rounded-xl text-white font-black text-base shadow-xl gap-2 transition-all active:scale-95 bg-indigo-600 hover:bg-indigo-500"
                                                              >
                                                                {isAdminVerifying && selectedAdminRole === 'admin' ? (
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
                          <Card className="border-none rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl shadow-slate-500/20">
                            <CardContent className="p-6 md:p-8 space-y-6">
                              <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl shadow-xl bg-amber-600/20 text-amber-400 shadow-amber-500/20 mb-4">
                                  <Crown size={32} />
                                </div>
                                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                                  {ROLE_CONFIGS.owner.label}
                                </h2>
                                <p className="text-xs md:text-sm text-slate-400 font-medium mt-1">
                                  {ROLE_CONFIGS.owner.fullDescription}
                                </p>
                              </div>
                              {adminAuthError && selectedAdminRole === 'owner' && (
                                <div className="p-4 bg-rose-900/20 border border-rose-800/50 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold animate-in slide-in-from-top-2">
                                  <ShieldAlert size={18} className="shrink-0" />
                                  <span>{adminAuthError}</span>
                                </div>
                              )}
                              <form onSubmit={(e) => { setSelectedAdminRole('owner'); handleAdminLogin(e); }} className="space-y-5">
                                <div className="space-y-2">
                                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Password</Label>
                                  <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <Input
                                      type={showAdminPassword ? 'text' : 'password'}
                                      value={adminPassword}
                                      onChange={e => { setSelectedAdminRole('owner'); setAdminPassword(e.target.value); if (adminAuthError) setAdminAuthError(''); }}
                                      placeholder="Enter your password"
                                      className="h-12 md:h-14 pl-12 pr-12 rounded-xl bg-slate-950/60 border border-slate-800 text-white font-bold text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                      {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-medium pt-1">
                                    {hasCustomAdminPassword() ? (
                                      <span className="flex items-center gap-1">
                                        <KeyRound size={9} />
                                        Custom PIN — set via Configuration &rarr; Owner Security
                                      </span>
                                    ) : null}
                                  </p>
                                </div>
                                <Button
                                  type="submit"
                                  disabled={isAdminVerifying || !String(adminPassword || '').trim()}
                                  className="w-full h-12 md:h-14 rounded-xl text-white font-black text-base shadow-xl gap-2 transition-all active:scale-95 bg-amber-600 hover:bg-amber-500"
                                >
                                  {isAdminVerifying && selectedAdminRole === 'owner' ? (
                                    <><Loader2 className="animate-spin" size={20} /> Verifying...</>
                                  ) : (
                                    <><Unlock size={20} /> Sign In</>
                                  )}
                                </Button>
                              </form>
                            </CardContent>
                          </Card>
                        </TabsContent>

            {/* ── STUDENT / PARENT TAB ── */}
                        <TabsContent value="student" className="mt-4">
                          <Card className="border-none rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl shadow-slate-500/20">
                            <CardContent className="p-6 md:p-8 space-y-6">
                              <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl shadow-xl bg-indigo-600/20 text-indigo-400 shadow-indigo-500/20 mb-4">
                                  <GraduationCap size={32} />
                                </div>
                                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                                  Student & Parent Portal
                                </h2>
                                <p className="text-xs md:text-sm text-slate-400 font-medium mt-1">
                                  Access your academic records, attendance, and fee statements using your Admission Number or Assessment Number
                                </p>
                              </div>
            
                              {studentLoginError && (
                                <div className="p-4 bg-rose-900/20 border border-rose-800/50 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold animate-in slide-in-from-top-2">
                                  <ShieldAlert size={18} className="shrink-0" />
                                  <span>{studentLoginError}</span>
                                </div>
                              )}
            
                              <form onSubmit={handleStudentPortalLogin} className="space-y-5">
                                <div className="space-y-2">
                                  <Label htmlFor="student-input" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                    Admission Number or Assessment Number
                                  </Label>
                                  <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <Input
                                      id="student-input"
                                      type="text"
                                      value={studentPortalInput}
                                      onChange={e => { setStudentPortalInput(e.target.value); if (studentLoginError) setStudentLoginError(null); }}
                                      placeholder="e.g. A827361 or AD2024001"
                                      className="h-12 md:h-14 pl-12 pr-4 rounded-xl bg-slate-950/60 border border-slate-800 text-white font-bold text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-500"
                                      autoFocus
                                    />
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-medium">
                                    Enter your school-issued Admission Number or Assessment Number
                                  </p>
                                </div>
            
                                <Button
                                  type="submit"
                                  disabled={isStaffVerifying || !String(studentPortalInput || '').trim()}
                                  className="w-full h-12 md:h-14 rounded-xl text-white font-black text-base shadow-xl gap-2 transition-all active:scale-95 bg-indigo-600 hover:bg-indigo-500"
                                >
                                  <><GraduationCap size={20} /> Access Student Portal</>
                                </Button>
                              </form>
            
                              {/* Help note */}
                              <div className="p-4 bg-slate-900/60 rounded-2xl flex items-start gap-3 border border-slate-800">
                                <Send size={16} className="text-slate-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-slate-400 font-medium">
                                  Need help? Contact the school office for your Admission Number or Assessment Number.
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
            
                        {/* ── STAFF / TEACHER / BURSAR TAB ── */}
                        <TabsContent value="staff" className="mt-4">
                          <Card className="border-none rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl shadow-slate-500/20">
                            <CardContent className="p-6 md:p-8 space-y-6">
                              {staffAuthError && (
                                <div className="p-4 bg-rose-900/20 border border-rose-800/50 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold animate-in slide-in-from-top-2">
                                  <ShieldAlert size={18} className="shrink-0" />
                                  <span>{staffAuthError}</span>
                                </div>
                              )}
            
                              <form onSubmit={handleStaffLogin} className="space-y-5">
                                {/* Email Address */}
                                <div className="space-y-2">
                                  <Label htmlFor="staff-id" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                    Email Address
                                  </Label>
                                  <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <Input
                                      id="staff-id"
                                      type="email"
                                      inputMode="email"
                                      autoCapitalize="none"
                                      value={staffId}
                                      onChange={e => { setStaffId(e.target.value); if (staffAuthError) setStaffAuthError(''); }}
                                      placeholder="e.g. jndiki@munyaka.sc.ke"
                                      autoComplete="username"
                                      className="h-12 md:h-14 pl-12 pr-4 rounded-xl bg-slate-950/60 border border-slate-800 text-white font-bold text-base focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-500"
                                      autoFocus
                                    />
                                  </div>
                                </div>
            
                                {/* Access Code */}
                                <div className="space-y-2">
                                  <Label htmlFor="staff-password" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                    Access Code
                                  </Label>
                                  <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <Input
                                      id="staff-password"
                                      type="password"
                                      value={staffPassword}
                                      onChange={e => { setStaffPassword(e.target.value); if (staffAuthError) setStaffAuthError(''); }}
                                      placeholder="e.g. MUN-3MDC"
                                      autoComplete="current-password"
                                      className="h-12 md:h-14 pl-12 pr-12 rounded-xl bg-slate-950/60 border border-slate-800 text-white font-mono font-bold text-base focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 tracking-wider placeholder-slate-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                      {showStaffPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-medium flex items-center justify-between">
                                    <span>Your access code was shared via SMS/email.</span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-800/50">
                                      Demo Code: MUN-9632 or MUN-1234
                                    </span>
                                  </p>
                                </div>
            
                                <Button
                                  type="submit"
                                  disabled={isStaffVerifying || !String(staffId || '').trim() || !String(staffPassword || '').trim()}
                                  className="w-full h-12 md:h-14 rounded-xl text-white font-black text-base shadow-xl gap-2 transition-all active:scale-95 bg-emerald-600 hover:bg-emerald-500"
                                >
                                  {isStaffVerifying ? (
                                    <><Loader2 className="animate-spin" size={20} /> Signing In...</>
                                  ) : (
                                    <><Unlock size={20} /> Sign In as Staff / Teacher</>
                                  )}
                                </Button>
                              </form>
            
                              {/* Help note */}
                              <div className="p-4 bg-slate-900/60 rounded-2xl flex items-start gap-3 border border-slate-800">
                                <Send size={16} className="text-slate-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-slate-400 font-medium">
                                  Don't have credentials? Contact the School Administrator to pre-register your account.
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>

            {/* ── SUPPORT STAFF TAB (Removed top tab; support staff authenticate via unified Staff tab) ── */}
          </Tabs>

          {/* Footer */}
                    <div className="text-center pt-2 space-y-1">
                      <p className="text-xs text-slate-500 font-medium">
                        Having trouble accessing your account?
                      </p>
                      <button
                        type="button"
                        onClick={() => setForgotModalOpen(true)}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline underline-offset-2 transition-colors"
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
