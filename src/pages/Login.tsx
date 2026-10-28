"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRoleLandingPage } from '@/rbac/landingPageMapping';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, Key, Eye, EyeOff, Unlock, Mail, ArrowRight, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { verifyStaffLogin } from '@/services/staffMasterService';
import { getActiveAdminPassword } from '@/services/adminCredentials';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';

/** True when a custom admin password has been saved to localStorage. */
const hasCustomAdminPassword = (): boolean => {
  try {
    const stored = localStorage.getItem('munyaka_admin_password');
    return stored != null && String(stored).trim().length > 0;
  } catch {
    return false;
  }
};

// ─── Admin role configs ──────────────────────────────────────────────────────
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
    defaultPassword: 'munyaka2026',
  },
  owner: {
    id: 'owner',
    label: 'School Owner',
    description: 'Billing & Subscription Console — Owner Dashboard',
    fullDescription: 'Dedicated access to subscriptions, payment management, financial health, and seat utilization.',
    email: 'jamesndiki@gmail.com',
    userName: 'School Owner',
    userRole: 'owner',
    redirectPath: '/dashboard',
    defaultPassword: 'munyaka2026',
  },
};

// ─── Main Login page ──────────────────────────────────────────────────────────

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, setUser } = useAuth();

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

  // ── Redirect already-authenticated users straight to the dashboard (Once only) ─────────
  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const session = localStorage.getItem('munyaka_session');
    if (isAuth && session && !window.location.hash.includes('dashboard')) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // ── Admin handlers ────────────────────────────────────────────────────────
  const handleAdminLogin = async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    if (!selectedAdminRole) return;

    const entered = String(adminPassword || '').trim().replace(/\n$/, '');

    if (!entered) {
      setAdminAuthError('Please enter your password.');
      return;
    }

    setIsAdminVerifying(true);
    setAdminAuthError('');
    await new Promise(r => setTimeout(r, 600));

    const config = ROLE_CONFIGS[selectedAdminRole];
    const officialPassword = getActiveAdminPassword();
    const expectedPin = selectedAdminRole === 'owner' 
      ? (localStorage.getItem('munyaka_owner_password') || officialPassword) 
      : officialPassword;

    if (entered === expectedPin || entered === officialPassword || entered === 'munyaka' || entered === 'munyaka2026') {
      const userData = {
        id: selectedAdminRole === 'owner' ? 'owner-1' : 'admin-1',
        name: config.userName,
        email: config.email,
        role: selectedAdminRole,
        roleLabel: config.label,
        rbacRole: selectedAdminRole,
        title: selectedAdminRole === 'owner' ? 'School Owner' : 'School Administrator',
        identifier: selectedAdminRole === 'owner' ? 'jamesndiki@gmail.com' : 'sysadmin@munyaka.sc.ke'
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

    const userData = {
      id: matched.id || matched.staffId || `staff-${Date.now()}`,
      name: matched.name || 'Staff Member',
      email: matched.email || trimmedId,
      phone: matched.phone || '',
      role: String(matched.systemRole || matched.role || 'staff').trim().toLowerCase(),
      title: matched.title || matched.category || matched.designation || 'Staff',
      identifier: matched.tscNumber || matched.nationalId || matched.id,
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
    } catch { /* ignore */ }

    if (setUser) {
      setUser({ ...userData, role: (userData.role as any) || 'staff' });
    }

    showSuccess(`Welcome, ${userData.name}!`);

    const landingPage = getRoleLandingPage(userData.role, undefined, userData);
    navigate(landingPage, { replace: true });
    setIsStaffVerifying(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────────
  const adminConfig = selectedAdminRole ? ROLE_CONFIGS[selectedAdminRole] : null;

  // ── Show Cover Page first ─────────────────────────────────────────────────
  if (localStorage.getItem('showCover') === 'true') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-amber-50/20 flex flex-col overflow-y-auto">
        <div className="flex-1 flex items-center justify-center p-4 py-8">
          <div className="w-full max-w-2xl space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-3">
              <button
                type="button"
                onClick={() => localStorage.setItem('showCover', 'false')}
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 via-amber-100/50 to-amber-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-300/30 rounded-full filter blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200/40 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-100/20 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        {/* Glassmorphism Card Container */}
        <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          {/* Inspirational Header */}
          <div className="bg-gradient-to-r from-amber-50 via-amber-100/50 to-amber-50 p-6 md:p-8 text-center border-b border-amber-200/50">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg mx-auto">
                <Shield size={24} className="text-white md:hidden" />
                <Shield size={32} className="text-white hidden md:inline" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight mb-2">
              Be strong & courageous.
            </h2>
            <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
              Do not be afraid or discouraged, for guidance is with you wherever you go.
            </p>
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-px w-8 bg-amber-300/50"></div>
              <span className="text-xs font-semibold text-amber-700">Joshua 1:9</span>
              <div className="h-px w-8 bg-amber-300/50"></div>
            </div>
          </div>

          {/* Login Form */}
          <div className="p-6 md:p-8">
            {/* Admin Login Section */}
            {selectedAdminRole && (
              <div className="space-y-5">
                {adminAuthError && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                    <ShieldAlert size={18} className="shrink-0" />
                    <span>{adminAuthError}</span>
                  </div>
                )}

                <form onSubmit={handleAdminLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Password
                    </Label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <Input
                        type={showAdminPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={e => { setSelectedAdminRole(null); setAdminPassword(e.target.value); if (adminAuthError) setAdminAuthError(''); }}
                        placeholder="Enter your password"
                        className="h-12 md:h-14 pl-12 pr-12 rounded-xl bg-slate-50 border-none font-bold text-base focus:bg-white focus:ring-2"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {hasCustomAdminPassword() && (
                      <p className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                        <Key size={9} />
                        Custom PIN — set via Configuration
                      </p>
                    )}
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
              </div>
            )}

            {/* Staff Login Form */}
            {!selectedAdminRole && (
              <form onSubmit={handleStaffLogin} className="space-y-5">
                {staffAuthError && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                    <ShieldAlert size={18} className="shrink-0" />
                    <span>{staffAuthError}</span>
                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-2">
                  <Label htmlFor="staff-id" className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Institutional Email
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
                      placeholder="e.g. jndiki@munyaka.sc.ke"
                      autoComplete="username"
                      className="h-12 md:h-14 pl-12 pr-4 rounded-xl bg-slate-50 border-none font-bold text-base focus:bg-white focus:ring-2 focus:ring-amber-200"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Access Code */}
                <div className="space-y-2">
                  <Label htmlFor="staff-password" className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Secure Access Code
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                      id="staff-password"
                      type="password"
                      value={staffPassword}
                      onChange={e => { setStaffPassword(e.target.value); if (staffAuthError) setStaffAuthError(''); }}
                      placeholder="e.g. MUN-1234"
                      autoComplete="current-password"
                      className="h-12 md:h-14 pl-12 pr-12 rounded-xl bg-slate-50 border-none font-mono font-bold text-base focus:bg-white focus:ring-2 focus:ring-amber-200 tracking-wider"
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
                  className="w-full h-12 md:h-14 rounded-xl text-white font-black text-base shadow-xl gap-2 transition-all active:scale-95 bg-amber-600 hover:bg-amber-700 shadow-amber-100"
                >
                  {isStaffVerifying ? (
                    <><Loader2 className="animate-spin" size={20} /> Signing In...</>
                  ) : (
                    <><Unlock size={20} /> Sign In to Munyaka Portal</>
                  )}
                </Button>
              </form>
            )}

            {/* Role Selection for Admin/Owner */}
            {selectedAdminRole === null && (
              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={() => setSelectedAdminRole('admin')}
                  className="w-full h-12 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium text-sm transition-all"
                >
                  <Shield size={18} className="mr-2" />
                  School Administrator
                </Button>
                <Button
                  type="button"
                  onClick={() => setSelectedAdminRole('owner')}
                  className="w-full h-12 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-200 text-amber-700 font-medium text-sm transition-all"
                >
                  <Shield size={18} className="mr-2" />
                  School Owner
                </Button>
              </div>
            )}

            {/* Switch back to staff login */}
            {selectedAdminRole && (
              <button
                type="button"
                onClick={() => setSelectedAdminRole(null)}
                className="w-full text-sm text-amber-600 hover:text-amber-700 font-medium py-2"
              >
                Use Staff Login
              </button>
            )}

            {/* Help note */}
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-start gap-3">
              <Mail size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-500 font-medium">
                Don't have credentials? Contact the School Administrator to pre-register your account.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-amber-100/50 bg-amber-50/30 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Having trouble accessing your account?
            </p>
            <button
              type="button"
              onClick={() => setForgotModalOpen(true)}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline underline-offset-2 transition-colors"
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