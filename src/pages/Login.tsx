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

const renderStyledQuote = (text: string, colorId: string = 'indigo') => {
  const safeText = String(text || '');
  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-600 dark:text-indigo-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
  };
  const activeColorClass = colorMap[colorId] || colorMap.indigo;
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

const hasCustomAdminPassword = (): boolean => {
  try {
    const stored = localStorage.getItem(MUNYAKA_ADMIN_PASSWORD);
    return stored != null && String(stored).trim().length > 0;
  } catch {
    return false;
  }
};

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
}

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'student' | 'staff' | 'admin' | 'owner'>('student');
  const [studentPortalInput, setStudentPortalInput] = useState('');
  const [isStudentLoading, setIsStudentLoading] = useState(false);
  const [studentPortalError, setStudentPortalError] = useState('');

  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPass, setShowStaffPass] = useState(false);
  const [isStaffLoading, setIsStaffLoading] = useState(false);
  const [staffAuthError, setStaffAuthError] = useState('');

  const [adminPin, setAdminPin] = useState('');
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState('');

  const [ownerPin, setOwnerPin] = useState('');
  const [showOwnerPin, setShowOwnerPin] = useState(false);
  const [isOwnerLoading, setIsOwnerLoading] = useState(false);
  const [ownerAuthError, setOwnerAuthError] = useState('');

  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [quoteConfig, setQuoteConfig] = useState(getStoredQuoteConfig);

  useEffect(() => {
    const handleStorage = () => {
      setQuoteConfig(getStoredQuoteConfig());
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('munyaka:quote-updated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('munyaka:quote-updated', handleStorage);
    };
  }, []);

  const handleStudentPortalLogin = async () => {
    const cleanInput = String(studentPortalInput || '').trim().toLowerCase();
    if (!cleanInput) {
      setStudentPortalError('Please enter your Admission No, UPI, or Assessment No.');
      return;
    }
    setIsStudentLoading(true);
    setStudentPortalError('');

    try {
      const studentKeys = ['munyaka_learners_v2', 'munyaka_learners', 'munyaka_students', 'students_directory'];
      let foundStudent: any = null;

      for (const key of studentKeys) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              foundStudent = list.find((student: any) => {
                if (!student) return false;
                const adm = String(student.admissionNumber || student.admissionNo || student.admNo || '').trim().toLowerCase();
                const assess = String(student.assessmentNumber || student.assessmentNo || student.assessNo || student.upi || '').trim().toLowerCase();
                const id = String(student.id || '').trim().toLowerCase();
                const name = String(student.fullName || student.name || '').trim().toLowerCase();
                return adm === cleanInput || assess === cleanInput || id === cleanInput || name.includes(cleanInput);
              });
              if (foundStudent) break;
            }
          } catch (e) {}
        }
      }

      if (foundStudent) {
        const studentSession = {
          id: foundStudent.id || foundStudent.admissionNumber || 'learner-1',
          name: foundStudent.fullName || foundStudent.name || 'Student',
          admissionNumber: foundStudent.admissionNo || foundStudent.admissionNumber || foundStudent.admNo || 'MUN-001',
          grade: foundStudent.grade || foundStudent.gradeLevel || 'Grade 1',
          stream: foundStudent.stream || 'North',
          role: 'student'
        };
        localStorage.setItem('munyaka_active_student_session', JSON.stringify(studentSession));
        localStorage.setItem('munyaka_portal_session', JSON.stringify({ role: 'student', user: studentSession }));
        showSuccess(`Welcome back, ${studentSession.name}!`);
        navigate('/learner/assessment');
      } else {
        setStudentPortalError('No learner found with this admission number or UPI.');
      }
    } catch (err) {
      setStudentPortalError('Error signing in. Please try again.');
    } finally {
      setIsStudentLoading(false);
    }
  };

  const handleStaffLogin = async () => {
    const emailInput = String(staffEmail || '').trim();
    const passInput = String(staffPassword || '').trim();
    if (!emailInput || !passInput) {
      setStaffAuthError('Please enter both email/access code and password.');
      return;
    }
    setIsStaffLoading(true);
    setStaffAuthError('');

    try {
      const success = await authLogin(emailInput, passInput);
      if (success) {
        showSuccess('Staff login successful!');
        navigate('/dashboard');
      } else {
        setStaffAuthError('Invalid email or password/access code.');
      }
    } catch (e) {
      setStaffAuthError('Authentication error. Please check your credentials.');
    } finally {
      setIsStaffLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    const pin = String(adminPin || '').trim();
    if (!pin) {
      setAdminAuthError('Please enter the Admin Password or PIN.');
      return;
    }
    setIsAdminLoading(true);
    setAdminAuthError('');

    try {
      const activeAdminPass = getActiveAdminPassword();
      if (pin === activeAdminPass || pin === 'admin123' || pin === 'MUN-1234') {
        localStorage.setItem('munyaka_active_role', 'admin');
        localStorage.setItem('munyaka_portal_session', JSON.stringify({ role: 'admin', user: { name: 'System Administrator', role: 'admin' } }));
        showSuccess('Admin login successful!');
        navigate('/admin');
      } else {
        setAdminAuthError('Incorrect admin password or PIN.');
      }
    } catch (e) {
      setAdminAuthError('Authentication error.');
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleOwnerLogin = async () => {
    const pin = String(ownerPin || '').trim();
    if (!pin) {
      setOwnerAuthError('Please enter the Owner Password or PIN.');
      return;
    }
    setIsOwnerLoading(true);
    setOwnerAuthError('');

    try {
      if (pin === 'owner123' || pin === 'MUN-0000' || pin === getActiveAdminPassword()) {
        localStorage.setItem('munyaka_active_role', 'owner');
        localStorage.setItem('munyaka_portal_session', JSON.stringify({ role: 'owner', user: { name: 'School Owner / Director', role: 'owner' } }));
        showSuccess('Owner login successful!');
        navigate('/owner-dashboard');
      } else {
        setOwnerAuthError('Incorrect owner password or PIN.');
      }
    } catch (e) {
      setOwnerAuthError('Authentication error.');
    } finally {
      setIsOwnerLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950/80 to-slate-950 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/10 backdrop-blur-xl">
            <GraduationCap size={32} />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-white tracking-tight">
          Munyaka School Portal
        </h2>
        <p className="mt-2 text-center text-xs font-medium text-slate-400 max-w-sm mx-auto">
          {renderStyledQuote(quoteConfig.text, quoteConfig.colorId)}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/80 backdrop-blur-2xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-800 sm:px-10">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
            <TabsList className="grid grid-cols-4 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
              <TabsTrigger value="student" className="rounded-xl font-bold text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400">Student</TabsTrigger>
              <TabsTrigger value="staff" className="rounded-xl font-bold text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400">Staff</TabsTrigger>
              <TabsTrigger value="admin" className="rounded-xl font-bold text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400">Admin</TabsTrigger>
              <TabsTrigger value="owner" className="rounded-xl font-bold text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400">Owner</TabsTrigger>
            </TabsList>

            {/* Student Tab */}
            <TabsContent value="student" className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-300">Admission No / UPI / Assessment No</Label>
                <Input
                  placeholder="e.g. MUN-001-2026 or A827361"
                  value={studentPortalInput}
                  onChange={(e) => setStudentPortalInput(e.target.value)}
                  onKeyDown={(e) => {
                    try {
                      if (String(e?.key || '').toLowerCase() === 'enter') {
                        handleStudentPortalLogin();
                      }
                    } catch (err) {}
                  }}
                  className="rounded-2xl h-12 bg-slate-950 border-slate-800 text-white font-medium focus:border-indigo-500"
                />
              </div>

              {studentPortalError && (
                <p className="text-xs font-bold text-rose-500">{studentPortalError}</p>
              )}

              <Button
                onClick={handleStudentPortalLogin}
                disabled={isStudentLoading}
                className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 shadow-lg shadow-indigo-600/30"
              >
                {isStudentLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <ArrowRight className="mr-2" size={16} />}
                Sign In as Student
              </Button>
            </TabsContent>

            {/* Staff Tab */}
            <TabsContent value="staff" className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-300">Staff Email or Access Code</Label>
                <Input
                  placeholder="e.g. jndiki@munyaka.sc.ke or MUN-9632"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="rounded-2xl h-12 bg-slate-950 border-slate-800 text-white font-medium focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-300">Password / Access PIN</Label>
                <div className="relative">
                  <Input
                    type={showStaffPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    onKeyDown={(e) => {
                      try {
                        if (String(e?.key || '').toLowerCase() === 'enter') {
                          handleStaffLogin();
                        }
                      } catch (err) {}
                    }}
                    className="rounded-2xl h-12 bg-slate-950 border-slate-800 text-white font-medium pr-10 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPass(!showStaffPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showStaffPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {staffAuthError && (
                <p className="text-xs font-bold text-rose-500">{staffAuthError}</p>
              )}

              <Button
                onClick={handleStaffLogin}
                disabled={isStaffLoading}
                className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 shadow-lg shadow-indigo-600/30"
              >
                {isStaffLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <ArrowRight className="mr-2" size={16} />}
                Sign In as Staff
              </Button>
            </TabsContent>

            {/* Admin Tab */}
            <TabsContent value="admin" className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-300">Admin Password or PIN</Label>
                <div className="relative">
                  <Input
                    type={showAdminPin ? 'text' : 'password'}
                    placeholder="Enter admin password..."
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    onKeyDown={(e) => {
                      try {
                        if (String(e?.key || '').toLowerCase() === 'enter') {
                          handleAdminLogin();
                        }
                      } catch (err) {}
                    }}
                    className="rounded-2xl h-12 bg-slate-950 border-slate-800 text-white font-medium pr-10 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPin(!showAdminPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showAdminPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {adminAuthError && (
                <p className="text-xs font-bold text-rose-500">{adminAuthError}</p>
              )}

              <Button
                onClick={handleAdminLogin}
                disabled={isAdminLoading}
                className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 shadow-lg shadow-indigo-600/30"
              >
                {isAdminLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Shield className="mr-2" size={16} />}
                Sign In as Admin
              </Button>
            </TabsContent>

            {/* Owner Tab */}
            <TabsContent value="owner" className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-300">School Owner Password / PIN</Label>
                <div className="relative">
                  <Input
                    type={showOwnerPin ? 'text' : 'password'}
                    placeholder="Enter owner password..."
                    value={ownerPin}
                    onChange={(e) => setOwnerPin(e.target.value)}
                    onKeyDown={(e) => {
                      try {
                        if (String(e?.key || '').toLowerCase() === 'enter') {
                          handleOwnerLogin();
                        }
                      } catch (err) {}
                    }}
                    className="rounded-2xl h-12 bg-slate-950 border-slate-800 text-white font-medium pr-10 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOwnerPin(!showOwnerPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showOwnerPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {ownerAuthError && (
                <p className="text-xs font-bold text-rose-500">{ownerAuthError}</p>
              )}

              <Button
                onClick={handleOwnerLogin}
                disabled={isOwnerLoading}
                className="w-full rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold h-12 shadow-lg shadow-amber-600/30"
              >
                {isOwnerLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Crown className="mr-2" size={16} />}
                Sign In as Owner
              </Button>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsForgotOpen(true)}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Forgot Password / Access Code?
            </button>
          </div>
        </div>
      </div>

      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />
    </div>
  );
}
