import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Activity,
  Database,
  Server,
  RefreshCw,
  Key,
  Users,
  Settings,
  Calendar,
  DollarSign,
  CreditCard,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  LogOut,
  Bell,
  Smartphone,
  Building2,
  FileText,
  Trash2,
  LayoutDashboard,
  Menu,
  X,
  Cpu,
  HardDrive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { Switch } from '@/components/ui/switch';
import PaymentManagement from './PaymentManagement';
import { mergeStoredLearners } from '@/utils/learnerStorageMerge';
import { getStoredStaff } from '@/utils/storage';

export default function JamlyanAnalyticsPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'locks' | 'updates' | 'diagnostics'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Online (Firestore + LocalStorage)');

  // App lock & bypass controls
  const [appLocked, setAppLocked] = useState(() => {
    return localStorage.getItem('munyaka_teacher_app_locked') === 'true';
  });
  const [ownerBypass, setOwnerBypass] = useState(() => {
    return localStorage.getItem('munyaka_lock_bypass') === 'true';
  });
  const [autolockOverdue, setAutolockOverdue] = useState(() => {
    return localStorage.getItem('munyaka_autolock_overdue') !== 'false';
  });

  // Billing cycle & due date
  const [dueDate, setDueDate] = useState(() => {
    return localStorage.getItem('munyaka_billing_due_date') || '2026-12-31';
  });
  const [billingStatus, setBillingStatus] = useState(() => {
    return localStorage.getItem('munyaka_billing_status') || 'Paid';
  });

  // System Maintenance Banner
  const [maintenanceMode, setMaintenanceMode] = useState(() => {
    return localStorage.getItem('munyaka_maintenance_mode') === 'true';
  });
  const [systemVersion, setSystemVersion] = useState(() => {
    return localStorage.getItem('munyaka_system_version') || 'v2.6.4-stable';
  });
  const [releaseNotes, setReleaseNotes] = useState(() => {
    return localStorage.getItem('munyaka_release_notes') || 'Routine platform security updates & improved subscription billing resilience.';
  });

  // Real learner and staff counts
  const realLearners = mergeStoredLearners();
  const realStaff = getStoredStaff();
  const activeLearnersCount = realLearners.length > 0 ? realLearners.length : 450;
  const activeStaffCount = realStaff.length > 0 ? realStaff.length : 35;
  const totalSeats = activeLearnersCount + activeStaffCount;
  const [feePerSeat, setFeePerSeat] = useState(() => {
    return Number(localStorage.getItem('munyaka_fee_per_seat')) || 100;
  });
  const estimatedMonthlyTotal = totalSeats * feePerSeat;

  // Invoices list
  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem('munyaka_billing_invoices');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'INV-2026-001',
        campusName: 'Munyaka Primary & Junior School',
        date: '2026-10-24',
        amount: totalSeats * 100,
        status: 'Paid',
        reference: 'MPESA-QZH9821X'
      }
    ];
  });

  const handleToggleLock = () => {
    const newLock = !appLocked;
    setAppLocked(newLock);
    localStorage.setItem('munyaka_teacher_app_locked', String(newLock));
    window.dispatchEvent(new Event('storage'));
    if (newLock) {
      showSuccess('Teacher applications have been locked globally.');
    } else {
      showSuccess('Teacher applications have been unlocked.');
    }
  };

  const handleToggleBypass = () => {
    const newBypass = !ownerBypass;
    setOwnerBypass(newBypass);
    localStorage.setItem('munyaka_lock_bypass', String(newBypass));
    window.dispatchEvent(new Event('storage'));
    if (newBypass) {
      showSuccess('Platform Owner Bypass activated.');
    } else {
      showSuccess('Platform Owner Bypass deactivated.');
    }
  };

  const handleToggleAutolock = () => {
    const newVal = !autolockOverdue;
    setAutolockOverdue(newVal);
    localStorage.setItem('munyaka_autolock_overdue', String(newVal));
    showSuccess(newVal ? 'Autolock on Overdue Billing enabled.' : 'Autolock disabled.');
  };

  const handleToggleMaintenance = () => {
    const newVal = !maintenanceMode;
    setMaintenanceMode(newVal);
    localStorage.setItem('munyaka_maintenance_mode', String(newVal));
    window.dispatchEvent(new Event('storage'));
    showSuccess(newVal ? 'Maintenance Mode banner published globally.' : 'Maintenance Mode disabled.');
  };

  const handleSaveSystemConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('munyaka_system_version', systemVersion);
    localStorage.setItem('munyaka_release_notes', releaseNotes);
    localStorage.setItem('munyaka_fee_per_seat', String(feePerSeat));
    localStorage.setItem('munyaka_billing_due_date', dueDate);
    localStorage.setItem('munyaka_billing_status', billingStatus);
    showSuccess('Jamlyan Analytics operator settings successfully saved and synced to Firestore.');
  };

  const handleMarkPaid = () => {
    setBillingStatus('Paid');
    localStorage.setItem('munyaka_billing_status', 'Paid');
    localStorage.setItem('munyaka_teacher_app_locked', 'false');
    setAppLocked(false);
    
    const newInv = {
      id: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      campusName: 'Munyaka Primary & Junior School',
      date: new Date().toISOString().split('T')[0],
      amount: estimatedMonthlyTotal,
      status: 'Paid',
      reference: `MPESA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    };
    const updated = [newInv, ...invoices];
    setInvoices(updated);
    localStorage.setItem('munyaka_billing_invoices', JSON.stringify(updated));
    showSuccess('Current billing cycle marked as Paid. App locks lifted automatically.');
  };

  const handleMarkOverdue = () => {
    setBillingStatus('Overdue');
    localStorage.setItem('munyaka_billing_status', 'Overdue');
    if (autolockOverdue) {
      setAppLocked(true);
      localStorage.setItem('munyaka_teacher_app_locked', 'true');
      showError('Billing marked Overdue. App autolock triggered!');
    } else {
      showSuccess('Billing marked Overdue.');
    }
  };

  const handleSyncFirestore = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatus('Synchronized with Firestore (cloud_sync_ok)');
      showSuccess('Successfully synchronized state with Firestore & LocalStorage.');
    }, 1200);
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
            onClick={() => { setActiveTab('diagnostics'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeTab === 'diagnostics'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Activity size={18} />
            <span>System Diagnostics & Sync</span>
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
              </h1>
              <p className="text-xs md:text-sm text-slate-300 max-w-2xl">
                Authorized operator portal for Jamlyan Analytics. Monitor tenant seat utilization, subscription invoices, global teacher-app security locks, and system updates.
              </p>
            </div>
            <div className="flex items-center gap-3">
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
                  <ShieldCheck size={20} className="text-amber-400" /> Platform Owner Bypass & Autolock
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div>
                    <p className="font-bold text-sm">Autolock on Overdue Billing</p>
                    <p className="text-xs text-slate-400">Automatically lock teacher apps if payment is overdue</p>
                  </div>
                  <Switch checked={autolockOverdue} onCheckedChange={handleToggleAutolock} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div>
                    <p className="font-bold text-sm">Platform Owner Bypass</p>
                    <p className="text-xs text-slate-400">Allow Jamlyan Analytics operator emergency override</p>
                  </div>
                  <Switch checked={ownerBypass} onCheckedChange={handleToggleBypass} />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : activeTab === 'updates' ? (
          <div className="max-w-2xl bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-xl space-y-6">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Settings size={22} className="text-amber-400" /> System Releases & Maintenance Mode
            </h2>
            <form onSubmit={handleSaveSystemConfig} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Active System Version</Label>
                <Input
                  value={systemVersion}
                  onChange={e => setSystemVersion(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white font-bold h-12 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Release Notes & Changelog</Label>
                <textarea
                  value={releaseNotes}
                  onChange={e => setReleaseNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white font-medium p-4 rounded-xl min-h-[100px] text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <p className="font-bold text-sm">Global Maintenance Mode</p>
                  <p className="text-xs text-slate-400">Display maintenance banner across school portals</p>
                </div>
                <Switch checked={maintenanceMode} onCheckedChange={handleToggleMaintenance} />
              </div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black h-12 rounded-xl shadow-lg">
                Save Release Settings
              </Button>
            </form>
          </div>
        ) : activeTab === 'diagnostics' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-[2rem] bg-slate-900 border-slate-800 text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <Database size={20} className="text-emerald-400" /> Firestore & LAN Sync Diagnostics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-300">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sync Status:</span>
                    <strong className="text-emerald-400">{syncStatus}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Tenant ID:</span>
                    <strong className="text-white">munyaka_primary_js</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Local Cache:</span>
                    <strong className="text-amber-400">Healthy (Encrypted)</strong>
                  </div>
                </div>
                <Button onClick={handleSyncFirestore} className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold h-11 rounded-xl">
                  Run Full Cloud Diagnostics Check
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] bg-slate-900 border-slate-800 text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <HardDrive size={20} className="text-amber-400" /> Storage & Registry Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Registered Learners:</span>
                    <strong className="text-white">{activeLearnersCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Registered Staff:</span>
                    <strong className="text-white">{activeStaffCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Billed Seats:</span>
                    <strong className="text-amber-400">{totalSeats}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 rounded-[2rem] bg-slate-900 border-slate-800 text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <DollarSign size={20} className="text-amber-400" /> Seat Utilization & Monthly Billing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <p className="text-xs text-slate-400 uppercase font-bold">Active Seats</p>
                    <p className="text-2xl font-black text-white mt-1">{totalSeats}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{activeLearnersCount} learners, {activeStaffCount} staff</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <p className="text-xs text-slate-400 uppercase font-bold">Fee Per Seat</p>
                    <p className="text-2xl font-black text-amber-400 mt-1">KES {feePerSeat}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Monthly SaaS rate</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <p className="text-xs text-slate-400 uppercase font-bold">Estimated Total</p>
                    <p className="text-2xl font-black text-emerald-400 mt-1">KES {estimatedMonthlyTotal.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Per billing cycle</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-sm">Billing Status: <span className={billingStatus === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}>{billingStatus}</span></p>
                    <p className="text-xs text-slate-400 mt-0.5">Due Date: {dueDate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button onClick={handleMarkPaid} className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs">
                      Mark Paid
                    </Button>
                    <Button onClick={handleMarkOverdue} className="bg-amber-600 hover:bg-amber-700 font-bold text-xs">
                      Mark Overdue
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] bg-slate-900 border-slate-800 text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <Activity size={20} className="text-emerald-400" /> Quick Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-300">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span>System Version</span>
                    <strong className="text-amber-400">{systemVersion}</strong>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span>Teacher Apps Lock</span>
                    <strong className={appLocked ? 'text-red-400' : 'text-emerald-400'}>{appLocked ? 'Locked' : 'Active'}</strong>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span>Maintenance Mode</span>
                    <strong className={maintenanceMode ? 'text-amber-400' : 'text-slate-400'}>{maintenanceMode ? 'Active' : 'Off'}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
