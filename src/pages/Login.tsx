import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Shield,
  Key,
  KeyRound,
  Unlock,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  School,
  Settings2,
  Crown,
  User,
  Briefcase,
  GraduationCap,
  ShieldAlert,
  Send,
  HelpCircle,
  Sparkles,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { teacherLogin, checkServerHealth } from '@/services/mobileAuthService';
import { getApiBaseUrl } from '@/lib/apiBase';
import { PreRegisteredStaff, SYSTEM_ROLE_LABELS } from '@/types/staff-access';
import { verifyStaffLogin } from '@/services/staffMasterService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import type { LoginFailure, LoginSuccess } from '@/services/mobileAuthService';

const hasCustomAdminPassword = (): boolean => {
  try {
    const saved = localStorage.getItem('munyaka_admin_pass');
    return !!saved && saved.length > 0;
  } catch {
    return false;
  }
};

const DEFAULT_ADMIN_PASSWORD = 'admin';
const DEFAULT_OWNER_PASSWORD = 'admin';

type AdminRole = 'admin' | 'owner' | 'staff' | 'student';

interface RoleConfig {
  id: AdminRole;
  label: string;
  description: string;
  fullDescription: string;
  defaultPassword: string;
  storageKey: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  userName: string;
  icon: typeof Shield;
}

const ROLE_CONFIGS: Record<AdminRole, RoleConfig> = {
  admin: {
    id: 'admin',
    label: 'School Administrator',
    description: 'Manage staff, student admissions, timetable, fees, and reports.',
    fullDescription: 'Enter your admin password or PIN to access the full school administration control center.',
    defaultPassword: DEFAULT_ADMIN_PASSWORD,
    storageKey: 'munyaka_admin_pass',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    userName: 'School Administrator',
    icon: Settings2
  },
  owner: {
    id: 'owner',
    label: 'School Director / Owner',
    description: 'Financial oversight, institutional audits, and system configuration.',
    fullDescription: 'Enter director credentials for complete institutional governance and financial controls.',
    defaultPassword: DEFAULT_OWNER_PASSWORD,
    storageKey: 'munyaka_owner_pass',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-800',
    userName: 'Director',
    icon: Crown
  },
  staff: {
    id: 'staff',
    label: 'Staff & Teachers',
    description: 'Mark attendance, enter exam grades, and issue digital learning materials.',
    fullDescription: 'Sign in with your registered Teacher ID, email, or TSC number.',
    defaultPassword: '',
    storageKey: '',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    userName: 'Teacher',
    icon: Briefcase
  },
  student: {
    id: 'student',
    label: 'Learner Portal',
    description: 'Access digital hub, interactive assessments, and learning corner.',
    fullDescription: 'Learners sign in securely via student ID or class learner portal.',
    defaultPassword: '',
    storageKey: '',
    bgColor: 'bg-violet-50 dark:bg-violet-950/40',
    textColor: 'text-violet-600 dark:text-violet-400',
    borderColor: 'border-violet-200 dark:border-violet-800',
    userName: 'Learner',
    icon: GraduationCap
  }
};

function getStaffRedirectPath(_systemRole: string): string {
  return '/dashboard';
}

interface RoleCardProps {
  role: RoleConfig;
  onClick: () => void;
  featureIcons: { Icon: typeof Shield; label: string }[];
}

const RoleCard: React.FC<RoleCardProps> = ({
  role,
  onClick,
  featureIcons
}) => {
  const { id, label, description, bgColor, textColor, borderColor, icon: Icon } = role;
  const hasCustomPassword = id === 'admin' && hasCustomAdminPassword();

  return (
    <Card 
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-3xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden relative bg-white dark:bg-slate-900",
        borderColor
      )}
    >
      <CardContent className="p-6 md:p-8 flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-3 md:p-4 rounded-2xl shrink-0 transition-transform group-hover:scale-110", bgColor, textColor)}>
              <Icon size={28} className="md:hidden" />
              <Icon size={32} className="hidden md:inline" />
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight size={18} className={cn("shrink-0 transition-transform group-hover:translate-x-1", textColor)} />
            </div>
          </div>
          <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mb-1">{label}</h3>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium mb-3">{description}</p>
          
          <div className="flex flex-wrap gap-1.5 mb-6">
            {featureIcons.map(({ Icon: FeatureIcon, label }, idx) => (
              <div key={idx} className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold", bgColor, textColor)}>
                <FeatureIcon size={10} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <Badge variant="outline" className={cn("font-bold text-[10px] border", borderColor, textColor)}>
            {id === 'admin' || id === 'owner' ? (
              hasCustomPassword ? (
                <span className="flex items-center gap-1">
                  <KeyRound size={9} /> Custom PIN set
                </span>
              ) : (
                `Default PIN: ${role.defaultPassword}`
              )
            ) : (
              'Staff & Student Portal'
            )}
          </Badge>
          <span className={cn("text-xs font-black uppercase tracking-wider", textColor)}>
            Sign In →
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, setUser } = useAuth();

  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState('');
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  const [staffId, setStaffId] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffAuthError, setStaffAuthError] = useState('');
  const [isStaffLoading, setIsStaffLoading] = useState(false);

  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleRoleSelect = (role: AdminRole) => {
    setSelectedRole(role);
    setAdminPassword('');
    setAdminAuthError('');
    setStaffId('');
    setStaffPassword('');
    setStaffAuthError('');
  };

  const handleBackToRoleSelect = () => {
    setSelectedRole(null);
    setAdminAuthError('');
    setStaffAuthError('');
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || (selectedRole !== 'admin' && selectedRole !== 'owner')) return;

    const config = ROLE_CONFIGS[selectedRole];
    const entered = adminPassword.trim();

    if (!entered) {
      setAdminAuthError(`Please enter the ${config.label.toLowerCase()} password.`);
      return;
    }

    setIsAdminLoading(true);
    setAdminAuthError('');

    try {
      let customPass = '';
      try {
        customPass = localStorage.getItem(config.storageKey) || '';
      } catch {
        /* ignore */
      }

      const effectivePass = customPass || config.defaultPassword;
      const isValid = entered === effectivePass || entered === config.defaultPassword;

      if (!isValid) {
        setAdminAuthError(`Invalid password for ${config.label}.`);
        setIsAdminLoading(false);
        return;
      }

      const success = login(selectedRole, entered);
      if (success) {
        showSuccess(`Welcome, ${config.userName}!`);
        setIsAdminLoading(false);
        navigate('/dashboard', { replace: true });
      } else {
        setAdminAuthError('Authentication failed. Please check credentials.');
        setIsAdminLoading(false);
      }
    } catch {
      setAdminAuthError('An unexpected error occurred during login.');
      setIsAdminLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = staffId.trim();
    const trimmedPass = staffPassword.trim();

    if (!trimmedId) {
      setStaffAuthError('Please enter your Staff ID, email, or TSC number.');
      return;
    }
    if (!trimmedPass) {
      setStaffAuthError('Please enter your password.');
      return;
    }

    setIsStaffLoading(true);
    setStaffAuthError('');

    try {
      const serverLoginResult = await teacherLogin(trimmedId, trimmedPass);
      if (serverLoginResult.success && serverLoginResult.user) {
        const userData = {
          id: String(serverLoginResult.user.id || trimmedId),
          name: serverLoginResult.user.name || trimmedId,
          email: serverLoginResult.user.email || trimmedId,
          role: (serverLoginResult.user.role as any) || 'teacher',
          token: serverLoginResult.token
        };

        if (setUser) {
          setUser(userData);
        }
        showSuccess(`Welcome, ${serverLoginResult.user.name}!`);
        setIsStaffLoading(true);
        navigate(getStaffRedirectPath(serverLoginResult.user.role || 'subject_teacher'), { replace: true });
        return;
      }
    } catch {
      // offline fallback
    }

    try {
      const offlineResult = verifyStaffLogin(trimmedId, trimmedPass);
      if (offlineResult.success && offlineResult.user) {
        const matchedStaff = offlineResult.user;
        const userData = {
          id: matchedStaff.id || matchedStaff.staffId || `offline-${Date.now()}`,
          name: matchedStaff.name,
          email: matchedStaff.email || matchedStaff.staffId,
          role: matchedStaff.systemRole || 'teacher',
          staffId: matchedStaff.staffId
        };

        if (setUser) {
          setUser({ ...userData, role: (userData.role as any) || 'staff' });
        }

        showSuccess(`Welcome, ${userData.name}!`);
        setIsStaffLoading(false);
        navigate(getStaffRedirectPath(userData.role), { replace: true });
        return;
      } else {
        setStaffAuthError(offlineResult.message || 'Invalid staff credentials.');
        setIsStaffLoading(false);
      }
    } catch (err: any) {
      setStaffAuthError(err?.message || 'Staff login failed.');
      setIsStaffLoading(false);
    }
  };

  useEffect(() => {
    checkServerHealth().then((status) => {
      setServerOnline(status.reachable);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto w-full pt-6 md:pt-12 pb-8 flex-1 flex flex-col justify-center">
        
        {/* Header Branding */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-200 dark:shadow-none mb-4">
            <School size={40} />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            Munyaka Primary School
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
            Institutional Management System & Digital Learning Hub
          </p>

          {serverOnline !== null && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-4 border shadow-sm bg-white dark:bg-slate-900">
              {serverOnline ? (
                <>
                  <Wifi size={13} className="text-emerald-500" />
                  <span className="text-emerald-700 dark:text-emerald-400">Server Connected</span>
                </>
              ) : (
                <>
                  <WifiOff size={13} className="text-amber-500" />
                  <span className="text-amber-700 dark:text-amber-400">Offline Mode Active</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Role Selection Grid or Active Login Form */}
        {!selectedRole ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <RoleCard 
              role={ROLE_CONFIGS.admin}
              onClick={() => handleRoleSelect('admin')}
              featureIcons={[
                { Icon: User, label: 'Staff Roster' },
                { Icon: Settings2, label: 'Timetable' }
              ]}
            />
            <RoleCard 
              role={ROLE_CONFIGS.owner}
              onClick={() => handleRoleSelect('owner')}
              featureIcons={[
                { Icon: Crown, label: 'Financial Audits' },
                { Icon: Shield, label: 'Governance' }
              ]}
            />
            <RoleCard 
              role={ROLE_CONFIGS.staff}
              onClick={() => handleRoleSelect('staff')}
              featureIcons={[
                { Icon: Briefcase, label: 'Attendance' },
                { Icon: CheckCircle2, label: 'Grading' }
              ]}
            />
            <RoleCard 
              role={ROLE_CONFIGS.student}
              onClick={() => navigate('/study-corner')}
              featureIcons={[
                { Icon: GraduationCap, label: 'Digital Hub' },
                { Icon: Sparkles, label: 'Games & Practice' }
              ]}
            />
          </div>
        ) : (
          <div className="max-w-md mx-auto w-full">
            <Button 
              variant="ghost" 
              onClick={handleBackToRoleSelect}
              className="mb-6 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 rounded-xl"
            >
              <ChevronLeft size={20} className="mr-1" /> Back to Role Selection
            </Button>

            <Card className="rounded-3xl border-2 shadow-2xl overflow-hidden bg-white dark:bg-slate-900">
              <div className={cn("p-6 md:p-8 border-b text-white", ROLE_CONFIGS[selectedRole].bgColor)}>
                <div className="flex items-center gap-3">
                  {React.createElement(ROLE_CONFIGS[selectedRole].icon, { size: 32, className: ROLE_CONFIGS[selectedRole].textColor })}
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                      {ROLE_CONFIGS[selectedRole].label}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {ROLE_CONFIGS[selectedRole].fullDescription}
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 md:p-8">
                {selectedRole === 'admin' || selectedRole === 'owner' ? (
                  <form onSubmit={handleAdminLogin} className="space-y-5">
                    {adminAuthError && (
                      <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                        <ShieldAlert size={18} className="shrink-0" />
                        <span>{adminAuthError}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        Password / PIN
                      </Label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                          type={showAdminPassword ? "text" : "password"}
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="Enter admin password..."
                          className="pl-11 pr-11 h-12 rounded-2xl border-slate-200 font-semibold"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>Default PIN: <strong className="font-bold text-slate-800 dark:text-slate-200">{ROLE_CONFIGS[selectedRole].defaultPassword}</strong></span>
                      <button
                        type="button"
                        onClick={() => setForgotModalOpen(true)}
                        className="text-indigo-600 hover:underline font-bold"
                      >
                        Reset PIN?
                      </button>
                    </div>

                    <Button
                      type="submit"
                      disabled={isAdminLoading}
                      className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                      {isAdminLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="animate-spin" size={20} /> Verifying...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Unlock size={20} /> Sign In
                        </span>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleStaffLogin} className="space-y-5">
                    {staffAuthError && (
                      <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                        <ShieldAlert size={18} className="shrink-0" />
                        <span>{staffAuthError}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        Staff ID / Email / TSC No.
                      </Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                          type="text"
                          value={staffId}
                          onChange={(e) => setStaffId(e.target.value)}
                          placeholder="e.g. TSC123456 or staff@munyaka.edu"
                          className="pl-11 h-12 rounded-2xl border-slate-200 font-semibold"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        Password
                      </Label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                          type={showStaffPassword ? "text" : "password"}
                          value={staffPassword}
                          onChange={(e) => setStaffPassword(e.target.value)}
                          placeholder="Enter your password..."
                          className="pl-11 pr-11 h-12 rounded-2xl border-slate-200 font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowStaffPassword(!showStaffPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showStaffPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isStaffLoading}
                      className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg shadow-emerald-200 dark:shadow-none"
                    >
                      {isStaffLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="animate-spin" size={20} /> Signing In...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Unlock size={20} /> Sign In as Staff / Teacher
                        </span>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-xs font-medium text-slate-400 pb-4">
        Munyaka Primary School Portal &copy; {new Date().getFullYear()} • Secure Institutional Access
      </footer>

      {/* Forgot PIN / Reset Dialog */}
      <Dialog open={forgotModalOpen} onOpenChange={setForgotModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Reset Administrator PIN</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              If you forgot your custom admin password, you can reset it to the default password ('admin') using the emergency reset utility in the System Settings or via local storage clear.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium space-y-2">
            <p className="font-bold">Emergency Reset Instructions:</p>
            <p>Open browser developer console (F12) and run:</p>
            <code className="block p-2 rounded bg-amber-100 font-mono text-[11px] text-amber-900">
              localStorage.removeItem('munyaka_admin_pass');
            </code>
            <p>Then refresh and use default PIN: <strong className="font-bold">admin</strong></p>
          </div>
          <DialogFooter>
            <Button onClick={() => setForgotModalOpen(false)} className="rounded-xl font-bold">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
