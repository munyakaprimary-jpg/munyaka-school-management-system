import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  ArrowRight
} from 'lucide-react';
import { useAuth, normalizeEmail } from '@/context/AuthContext';
import { showError, showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';

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
    badgeText: 'PIN: sysadmin2026'
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
    badgeText: 'PIN: ownerpass2026'
  }
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const userRole = user.role;
      if (userRole === 'owner') {
        navigate(ROLE_CONFIGS.super_admin.redirectPath, { replace: true });
      } else if (userRole === 'super_admin') {
        navigate(ROLE_CONFIGS.system_admin.redirectPath, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleRoleSelect = (role: AdminRole) => {
    setSelectedRole(role);
    setPassword('');
    setAuthError('');
  };

  const handleBackToRoleSelect = () => {
    setSelectedRole(null);
    setPassword('');
    setAuthError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    if (!password.trim()) {
      setAuthError('Please enter your password.');
      return;
    }

    setIsVerifying(true);
    setAuthError('');

    // Simulate verification delay for UX
    await new Promise(r => setTimeout(r, 600));

    const config = ROLE_CONFIGS[selectedRole];

    if (password !== config.password) {
      setAuthError(`Invalid password for ${config.label}. Please use the correct credentials for this role.`);
      showError('Authentication failed');
      setIsVerifying(false);
      return;
    }

    // Use the AuthContext login to create a proper session
    const success = await login(config.email, password);
    
    if (success) {
      // Save admin session info for the Settings page
      const adminSession = {
        role: selectedRole,
        roleLabel: config.label,
        roleIcon: selectedRole === 'super_admin' ? 'crown' : 'settings',
        timestamp: Date.now()
      };
      localStorage.setItem('munyaka_admin_session', JSON.stringify(adminSession));
      
      // Also set legacy keys for backward compatibility
      localStorage.setItem('munyaka_admin_pass', config.password);
      if (selectedRole === 'super_admin') {
        localStorage.setItem('munyaka_owner_pass', config.password);
      } else {
        localStorage.setItem('munyaka_sysadmin_pass', config.password);
      }
      
      showSuccess(`Welcome, ${config.userName}!`);
      navigate(config.redirectPath, { replace: true });
    } else {
      setAuthError('Login failed. Please try again.');
      showError('Authentication failed');
    }
    
    setIsVerifying(false);
  };

  // Role selection screen
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-amber-50/20 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4 py-8">
          <div className="w-full max-w-2xl space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-600 to-amber-500 rounded-3xl shadow-2xl shadow-indigo-200 mb-2">
                <Shield size={32} className="text-white md:hidden" />
                <Shield size={40} className="text-white hidden md:inline" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Munyaka School Management
              </h1>
              <p className="text-sm md:text-base text-slate-500 font-medium max-w-md mx-auto">
                Select your administrative role to access the system
              </p>
            </div>

            {/* Error Display */}
            {authError && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in slide-in-from-top-2">
                <ShieldAlert size={20} className="shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Role Cards */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                Choose Your Role
              </p>

              {/* System Administrator Card */}
              <RoleCard
                role={ROLE_CONFIGS.system_admin}
                onClick={() => handleRoleSelect('system_admin')}
                gradientFrom="from-indigo-500"
                gradientTo="to-indigo-700"
                bgColor="bg-indigo-50"
                textColor="text-indigo-700"
                borderColor="border-indigo-200"
                ringColor="ring-indigo-200"
                featureIcons={[
                  { Icon: Users, label: 'Users' },
                  { Icon: Settings2, label: 'Settings' },
                  { Icon: Shield, label: 'RBAC' }
                ]}
              />

              {/* Super Admin (Owner) Card */}
              <RoleCard
                role={ROLE_CONFIGS.super_admin}
                onClick={() => handleRoleSelect('super_admin')}
                gradientFrom="from-amber-500"
                gradientTo="to-amber-700"
                bgColor="bg-amber-50"
                textColor="text-amber-700"
                borderColor="border-amber-200"
                ringColor="ring-amber-200"
                featureIcons={[
                  { Icon: CreditCard, label: 'Payments' },
                  { Icon: Crown, label: 'Owner' },
                  { Icon: Shield, label: 'Billing' }
                ]}
              />
            </div>

            {/* Footer Note */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-400 font-medium">
                Each role has separate credentials. Default PINs are shown on each card.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Password entry screen
  const config = ROLE_CONFIGS[selectedRole];
  const Icon = config.icon;
  const isIndigo = config.primaryColor === 'indigo';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-amber-50/20 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-500">
          {/* Back button */}
          <button
            onClick={handleBackToRoleSelect}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors"
          >
            <ChevronLeft size={20} />
            Back to role selection
          </button>

          <Card className="border-none shadow-2xl rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-6 md:p-8">
              {/* Role Header */}
              <div className="text-center mb-6">
                <div className={cn(
                  "inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-3xl shadow-xl mb-4",
                  isIndigo 
                    ? "bg-indigo-50 text-indigo-600 shadow-indigo-100" 
                    : "bg-amber-50 text-amber-600 shadow-amber-100"
                )}>
                  <Icon size={32} className="md:hidden" />
                  <Icon size={36} className="hidden md:inline" />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  {config.label}
                </h2>
                <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                  {config.fullDescription}
                </p>
              </div>

              {/* Error Display */}
              {authError && (
                <div className="mb-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                  <ShieldAlert size={18} className="shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Password Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Password
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (authError) setAuthError('');
                      }}
                      placeholder="Enter your password"
                      className="h-12 md:h-14 pl-12 pr-12 rounded-xl bg-slate-50 border-none font-bold text-base focus:bg-white focus:ring-2"
                      autoFocus
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium pt-1">
                    Default: <span className="font-bold">{config.password}</span>
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={isVerifying || !password.trim()}
                  className={cn(
                    "w-full h-12 md:h-14 rounded-xl text-white font-black text-base shadow-xl gap-2 transition-all active:scale-95",
                    isIndigo 
                      ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100" 
                      : "bg-amber-600 hover:bg-amber-700 shadow-amber-100"
                  )}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Unlock size={20} />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              {/* Switch Role Link */}
              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500 font-medium mb-2">
                  Wrong role?
                </p>
                <button
                  type="button"
                  onClick={handleBackToRoleSelect}
                  className={cn(
                    "text-sm font-bold underline underline-offset-4 transition-colors",
                    isIndigo 
                      ? "text-indigo-600 hover:text-indigo-700" 
                      : "text-amber-600 hover:text-amber-700"
                  )}
                >
                  Choose a different role
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Role Card Component
interface RoleCardProps {
  role: RoleConfig;
  onClick: () => void;
  gradientFrom: string;
  gradientTo: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  ringColor: string;
  featureIcons: { Icon: React.ComponentType<{ size?: number }>; label: string }[];
}

const RoleCard: React.FC<RoleCardProps> = ({
  role,
  onClick,
  bgColor,
  textColor,
  borderColor,
  featureIcons
}) => {
  const Icon = role.icon;
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full p-5 md:p-6 rounded-3xl border-2 bg-white hover:shadow-xl transition-all duration-300 text-left group active:scale-[0.98]",
        borderColor,
        "hover:border-opacity-100"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          "p-3 md:p-4 rounded-2xl shrink-0 transition-transform group-hover:scale-110",
          bgColor,
          textColor
        )}>
          <Icon size={28} className="md:hidden" />
          <Icon size={32} className="hidden md:inline" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="text-lg md:text-xl font-black text-slate-900">
              {role.label}
            </h3>
            <ArrowRight 
              size={18} 
              className={cn(
                "shrink-0 transition-transform group-hover:translate-x-1",
                textColor
              )} 
            />
          </div>
          <p className="text-xs md:text-sm text-slate-500 font-medium mb-3">
            {role.description}
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {featureIcons.map(({ Icon: FeatureIcon, label }, idx) => (
              <div
                key={idx}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold",
                  bgColor,
                  textColor
                )}
              >
                <FeatureIcon size={10} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Default PIN Badge */}
          <Badge variant="outline" className={cn(
            "font-bold text-[10px] border",
            borderColor,
            textColor
          )}>
            {role.badgeText}
          </Badge>
        </div>
      </div>
    </button>
  );
};

export default Login;
