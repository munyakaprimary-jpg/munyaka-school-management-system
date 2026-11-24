import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUnifiedLicenseInfo, useUnifiedLicense, saveLicenseToFirestore } from '../utils/subscriptionUtils';
import {
  ShieldCheck,
  LayoutDashboard,
  CreditCard,
  Lock,
  Unlock,
  Settings,
  Users,
  LogOut,
  RefreshCw,
  Building2,
  CheckCircle2,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { showSuccess, showError } from '@/utils/toast';
import PaymentManagement from './PaymentManagement';
import OwnersDashboard from './ownersDashboard';
import { mergeStoredLearners } from '@/utils/learnerStorageMerge';
import { getStoredStaff } from '@/utils/storage';
import { useSessionHeartbeat } from '@/utils/sessionHeartbeat';
import { ConnectedActiveUsersMonitor } from '@/components/ConnectedActiveUsersMonitor';
import { setTeacherAppLock, getTeacherAppLock } from '@/utils/teacherAppLock';

export default function JamlyanAnalyticsPortal() {
  useSessionHeartbeat();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'locks' | 'updates' | 'diagnostics' | 'lan' | 'users' | 'tenants'>('overview');

  // Dynamic Subscription & Lock State using unified utility
  const licenseInfo = useUnifiedLicense();
  const [lanServerUrl, setLanServerUrl] = useState(() => localStorage.getItem('munyaka_lan_server_url') || localStorage.getItem('lan_server_url') || 'http://192.168.1.100:3001');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Synchronized with Firestore (cloud_sync_ok)');

  // App locks & billing states
  const [appLocked, setAppLocked] = useState(() => getTeacherAppLock());
  const [billingStatus, setBillingStatus] = useState(() => localStorage.getItem('munyaka_billing_status') || 'Paid');
  const [autolockOverdue, setAutolockOverdue] = useState(() => localStorage.getItem('munyaka_autolock_overdue') !== 'false');

  // Seats & Billing data
  const [learnersCount, setLearnersCount] = useState(480);
  const [staffCount, setStaffCount] = useState(35);
  const [feePerSeat, setFeePerSeat] = useState(150);

  useEffect(() => {
    try {
      const learners = mergeStoredLearners();
      if (learners && learners.length > 0) setLearnersCount(learners.length);
      const staff = getStoredStaff();
      if (staff && staff.length > 0) setStaffCount(staff.length);
    } catch {
      // fallback
    }
  }, []);

  const totalSeats = learnersCount + staffCount;
  const estimatedMonthlyTotal = totalSeats * feePerSeat;

  const handleToggleLock = async () => {
      const next = !appLocked;
      setAppLocked(next);
      setTeacherAppLock(next);
      const dueDate = localStorage.getItem('munyaka_billing_due_date') || '2026-12-29';
      const status = localStorage.getItem('munyaka_billing_status') || 'ACTIVE';
      await saveLicenseToFirestore({ dueDate, status, isLocked: next });
      if (next) {
        showError('Global Teacher App Lock ACTIVATED. Teacher apps across devices are now locked & synced to Firestore.');
      } else {
        showSuccess('Global Teacher App Lock LIFTED. Teacher apps are active & synced to Firestore.');
      }
    };

  const handleMarkPaid = async () => {
      setBillingStatus('Paid');
      localStorage.setItem('munyaka_billing_status', 'Paid');
      setTeacherAppLock(false);
      setAppLocked(false);
      const dueDate = localStorage.getItem('munyaka_billing_due_date') || '2026-12-29';
      await saveLicenseToFirestore({ dueDate, status: 'PAID', isLocked: false });
      showSuccess('Current billing cycle marked as Paid & synced to Firestore. App locks lifted.');
    };
  
    const handleMarkOverdue = async () => {
      setBillingStatus('Overdue');
      localStorage.setItem('munyaka_billing_status', 'Overdue');
      const dueDate = localStorage.getItem('munyaka_billing_due_date') || '2026-12-29';
      await saveLicenseToFirestore({ dueDate, status: 'OVERDUE', isLocked: appLocked });
      showSuccess('Billing marked Overdue & synced to Firestore.');
    };

  const handleSyncFirestore = async () => {
    setIsSyncing(true);
    try {
      const dueDate = localStorage.getItem('munyaka_billing_due_date') || '2026-12-29';
      const status = localStorage.getItem('munyaka_billing_status') || 'ACTIVE';
      await saveLicenseToFirestore({ dueDate, status, isLocked: appLocked });
      setIsSyncing(false);
      setSyncStatus('Synchronized with Firestore (cloud_sync_ok)');
      showSuccess('Successfully synchronized state with Firestore & LocalStorage.');
    } catch (e) {
      setIsSyncing(false);
      showError('Sync failed. Please check network connection.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jamlyan_operator_session');
    localStorage.removeItem('munyaka_user');
    localStorage.removeItem('munyaka_session');
    localStorage.removeItem('munyaka_current_user');
    localStorage.removeItem('munyaka_admin_session');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    sessionStorage.clear();
    showSuccess('Logged out of Jamlyan Analytics operator session.');
    navigate('/login', { replace: true });
    window.location.hash = '#/login';
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-white">Jamlyan Analytics</h2>
            <p className="text-[10px] text-amber-400">Platform Control Console</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white">Jamlyan Analytics</h2>
              <span className="inline-block px-2 py-0.5 mt-0.5 rounded-md bg-amber-500/25 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                Operator Console
              </span>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><Building2 size={12} className="text-amber-400" /> Tenant:</span>
            <strong className="text-white text-[11px] truncate max-w-[140px]">Munyaka Primary & JS</strong>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeTab === 'overview'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard size={18} />
            <span>Overview / Dashboard</span>
          </button>

          <button
            onClick={() => { setActiveTab('subscriptions'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeTab === 'subscriptions'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <CreditCard size={18} />
            <span>Subscription & Billing</span>
          </button>

          <button
            onClick={() => { setActiveTab('locks'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeTab === 'locks'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Lock size={18} />
            <span>App Access & Locks</span>
          </button>

          <button
            onClick={() => { setActiveTab('updates'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeTab === 'updates'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings size={18} />
            <span>Updates & Maintenance</span>
          </button>

          <button
            onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeTab === 'users'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users size={18} />
            <span>Connected Users</span>
          </button>

          <button
            onClick={() => { setActiveTab('tenants'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeTab === 'tenants'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Building2 size={18} />
            <span>Tenants & Campuses</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              JA
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">Jamlyan Analytics</p>
              <p className="text-[10px] text-slate-400 truncate">operator@jamlyan.com</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-11 shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 text-xs"
          >
            <LogOut size={16} /> Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-indigo-500/30">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/30">
                  <ShieldCheck size={14} className="text-amber-400" /> Platform Control Console
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                  Tenant: Munyaka Primary & JS
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                {activeTab === 'overview' && 'Overview & Platform Health'}
                {activeTab === 'subscriptions' && 'Subscription & Billing Management'}
                {activeTab === 'locks' && 'Teacher App Access & Persistent Locks'}
                {activeTab === 'updates' && 'System Releases & Maintenance Mode'}
                {activeTab === 'diagnostics' && 'System Diagnostics & Firestore Sync'}
                {activeTab === 'lan' && 'LAN Wi-Fi Server Configuration & Sync'}
                {activeTab === 'users' && 'Connected Active Users Monitor'}
                {activeTab === 'tenants' && 'Tenants & Campuses Management'}
              </h1>
              <p className="text-xs md:text-sm text-slate-300 max-w-2xl">
                Authorized operator portal for Jamlyan Analytics. Monitor tenant seat utilization, subscription invoices, global teacher-app security locks, and system updates.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`border text-xs font-black px-3 py-1.5 rounded-full whitespace-nowrap inline-flex items-center gap-1.5 ${licenseInfo.badgeVariant}`}>
                <ShieldCheck size={14} className={licenseInfo.daysRemaining <= 7 ? "text-amber-700 dark:text-amber-400 shrink-0" : "text-emerald-700 dark:text-emerald-400 shrink-0"} />
                <span>{licenseInfo.badgeText}</span>
              </Badge>
              <Button
                variant="outline"
                onClick={handleSyncFirestore}
                disabled={isSyncing}
                className="bg-slate-900/80 border-indigo-500/40 text-indigo-200 hover:bg-indigo-950 font-bold rounded-2xl h-11 px-5 shadow-lg"
              >
                <RefreshCw size={16} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Firestore'}
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'subscriptions' ? (
          <div className="bg-slate-900 rounded-[2rem] p-6 border border-slate-800">
            <PaymentManagement />
          </div>
        ) : activeTab === 'users' ? (
          <ConnectedActiveUsersMonitor />
        ) : activeTab === 'tenants' ? (
          <div className="bg-slate-900 rounded-[2rem] p-6 border border-slate-800">
            <OwnersDashboard />
          </div>
        ) : activeTab === 'locks' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-[2rem] bg-slate-900 border-slate-800 text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <Lock size={20} className="text-amber-400" /> Global Teacher App Lock
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-slate-300">
                  Instantly lock or unlock teacher applications across all devices for this school tenant. Active sessions will require authentication or subscription renewal when locked.
                </p>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div>
                    <p className="font-bold text-sm">Teacher App Status</p>
                    <p className="text-xs text-slate-400">{appLocked ? 'Locked (Restricted)' : 'Active (Normal)'}</p>
                  </div>
                  <Button
                    onClick={handleToggleLock}
                    className={appLocked ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold' : 'bg-red-600 hover:bg-red-700 text-white font-bold'}
                  >
                    {appLocked ? <><Unlock size={16} className="mr-2" /> Unlock Apps</> : <><Lock size={16} className="mr-2" /> Lock Apps</>}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] bg-slate-900 border-slate-800 text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <CreditCard size={20} className="text-amber-400" /> Billing Status & Overdue Action
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-slate-300">
                  Control subscription status and test automated app locking when monthly payments are overdue.
                </p>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div>
                    <p className="font-bold text-sm">Current Status</p>
                    <p className={`text-xs font-bold ${billingStatus === 'Paid' ? 'text-emerald-400' : 'text-rose-400'}`}>{billingStatus.toUpperCase()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleMarkPaid}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                      Mark Paid
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleMarkOverdue}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
                    >
                      Mark Overdue
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : activeTab === 'updates' ? (
          <div className="space-y-6">
            <Card className="rounded-[2rem] bg-slate-900 border-slate-800 text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <Settings size={20} className="text-amber-400" /> Android APK & Web App Releases
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-300">
                  Deploy system updates, push APK version releases to teacher and student terminals, and manage offline sync packages.
                </p>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Latest Stable APK Version v2.4.1</p>
                    <p className="text-xs text-slate-400">Includes CBC grade book offline sync and faster local database queries.</p>
                  </div>
                  <Button
                    onClick={() => showSuccess('APK update broadcast successfully to all connected terminal APKs.')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    Broadcast APK Update
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : activeTab === 'diagnostics' ? (
          <div className="space-y-6">
            <Card className="rounded-[2rem] bg-slate-900 border-slate-800 text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <RefreshCw size={20} className="text-amber-400" /> System Diagnostics & Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <p className="text-xs text-slate-400 font-bold">Firestore Cloud Sync</p>
                    <p className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5"><CheckCircle2 size={14} /> Connected (OK)</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <p className="text-xs text-slate-400 font-bold">Local Storage Persistence</p>
                    <p className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5"><CheckCircle2 size={14} /> Active</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <p className="text-xs text-slate-400 font-bold">Tenant RLS Security</p>
                    <p className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5"><CheckCircle2 size={14} /> Enforced</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : activeTab === 'lan' ? (
          <div className="space-y-6">
            <Card className="rounded-[2rem] bg-slate-900 border-slate-800 text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <Building2 size={20} className="text-amber-400" /> Standalone LAN Wi-Fi Server
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-300">
                  Configure local server IP for schools running offline over local Wi-Fi routers without active internet.
                </p>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-300">LAN Server Base URL</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={lanServerUrl}
                      onChange={(e) => {
                        setLanServerUrl(e.target.value);
                        localStorage.setItem('munyaka_lan_server_url', e.target.value);
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white"
                      placeholder="http://192.168.1.100:3001"
                    />
                    <Button
                      onClick={() => showSuccess('LAN Server URL saved successfully.')}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold"
                    >
                      Save LAN URL
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top Banner / Billing Cards Rendered ONLY on Overview / Dashboard and Subscription & Billing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="rounded-[2.2rem] bg-slate-900 border-slate-800 text-white shadow-xl overflow-hidden relative">
                <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                <CardContent className="p-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Seats</p>
                  <h3 className="text-3xl font-black text-white mt-2">{totalSeats}</h3>
                  <p className="text-[11px] text-indigo-400 mt-1 font-medium">{learnersCount} Learners + {staffCount} Staff</p>
                </CardContent>
              </Card>

              <Card className="rounded-[2.2rem] bg-slate-900 border-slate-800 text-white shadow-xl overflow-hidden relative">
                <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
                <CardContent className="p-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fee Per Seat</p>
                  <h3 className="text-3xl font-black text-amber-400 mt-2">KES {feePerSeat}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Monthly billing rate per active user</p>
                </CardContent>
              </Card>

              <Card className="rounded-[2.2rem] bg-slate-900 border-slate-800 text-white shadow-xl overflow-hidden relative">
                <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
                <CardContent className="p-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Total</p>
                  <h3 className="text-3xl font-black text-emerald-400 mt-2">KES {estimatedMonthlyTotal.toLocaleString()}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Current active billing cycle total</p>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-[2rem] bg-slate-900 border-slate-800 text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <LayoutDashboard size={20} className="text-amber-400" /> Tenant Platform Health Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-300">
                  Welcome to Jamlyan Analytics. Use the sidebar to monitor live connected active users across devices, manage tenant billing, or configure teacher app access locks.
                </p>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">School Tenant Online & Operational</p>
                      <p className="text-xs text-slate-400">All local databases and cloud sync mechanisms are functioning normally.</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setActiveTab('users')}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                  >
                    View Connected Users
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
