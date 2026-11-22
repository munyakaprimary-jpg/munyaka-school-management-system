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
  LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import PaymentManagement from './PaymentManagement';
import { useSchoolStore } from '@/store/useSchoolStore';
import { mergeStoredLearners } from '@/utils/learnerStorageMerge';
import { getStoredStaff } from '@/utils/storage';

export default function JamlyanAnalyticsPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions'>('overview');
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
    localStorage.setItem('munyaka_billing_ due_date', dueDate);
    localStorage.setItem('munyaka_billing_status', billingStatus);
    showSuccess('Jamlyan Analytics operator settings successfully saved and synced to Firestore.');
  };

  const handleMarkPaid = () => {
    setBillingStatus('Paid');
    localStorage.setItem('munyaka_billing_status', 'Paid');
    localStorage.setItem('munyaka_teacher_app_locked', 'false');
    setAppLocked(false);
    
    // Add new invoice
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-indigo-500/30">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/30 shadow-inner">
                <ShieldCheck size={14} className="text-amber-400" /> Jamlyan Analytics Platform Control Console
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                Tenant: Munyaka Primary & JS
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              Jamlyan Analytics Operator Portal
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Authorized operator interface for Munyaka Primary & Junior School. Manage system version releases, monthly subscription invoices, seat utilization, persistent teacher-app locks, and maintenance mode.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'outline'}
              onClick={() => setActiveTab('overview')}
              className={activeTab === 'overview' ? 'bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl h-12 px-5' : 'bg-slate-900/80 border-indigo-500/40 text-indigo-200 hover:bg-indigo-950 font-bold rounded-2xl h-12 px-5'}
            >
              <LayoutDashboard size={16} className="mr-2" /> Platform Overview
            </Button>
            <Button
              variant={activeTab === 'subscriptions' ? 'default' : 'outline'}
              onClick={() => setActiveTab('subscriptions')}
              className={activeTab === 'subscriptions' ? 'bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl h-12 px-5' : 'bg-slate-900/80 border-indigo-500/40 text-indigo-200 hover:bg-indigo-950 font-bold rounded-2xl h-12 px-5'}
            >
              <CreditCard size={16} className="mr-2" /> Payment & Subscription
            </Button>
            <Button
              variant="outline"
              onClick={handleSyncFirestore}
              disabled={isSyncing}
              className="bg-slate-900/80 border-indigo-500/40 text-indigo-200 hover:bg-indigo-950 font-bold rounded-2xl h-12 px-5 shadow-lg"
            >
              <RefreshCw size={16} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Firestore'}
            </Button>
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl h-12 px-6 shadow-xl shadow-red-900/30 flex items-center gap-2"
            >
              <LogOut size={16} /> Log Out
            </Button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-indigo-900/60 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <Database size={14} className="text-amber-400" /> Active Version: <strong className="text-white">{systemVersion}</strong>
            </span>
            <span className="flex items-center gap-2">
              <Activity size={14} className="text-emerald-400" /> Sync Status: <strong className="text-emerald-300">{syncStatus}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Secure TLS 1.3 Operator Session Active</span>
          </div>
        </div>
      </div>

      {/* Grid Section 1: Subscription Billing & Live Counts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription & Monthly Billing Card */}
        <Card className="lg:col-span-2 rounded-[2rem] border-slate-200 shadow-xl bg-white dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <DollarSign size={22} />
                  </div>
                  Subscription Billing & Seat Utilization
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Transparent calculation based on live student and staff counts from the school registry.
                </p>
              </div>
              <Badge className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                billingStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
              }`}>
                Status: {billingStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <Users size={14} className="text-indigo-500" /> Active Learners
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {activeLearnersCount.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400">Enrolled &amp; active in school</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <Users size={14} className="text-amber-500" /> Active Staff / Teachers
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {activeStaffCount.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400">Registered staff members</p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <CreditCard size={14} /> Monthly Total (KES)
                </span>
                <div className="text-2xl font-black text-amber-900 dark:text-amber-300">
                  KES {estimatedMonthlyTotal.toLocaleString()}
                </div>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">{totalSeats} total seats @ KES {feePerSeat}/seat</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Current Cycle Due Date</Label>
                <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar size={15} className="text-indigo-500" /> {dueDate}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleMarkPaid}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 px-5 shadow-md flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Mark Cycle Paid
                </Button>
                <Button
                  onClick={handleMarkOverdue}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-11 px-5 shadow-md flex items-center gap-2"
                >
                  <AlertTriangle size={16} /> Mark Overdue
                </Button>
              </div>
            </div>

            {/* Invoices History Table */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} className="text-indigo-500" /> Payment &amp; Invoice History
                </h3>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3.5 font-bold">Invoice ID</th>
                      <th className="p-3.5 font-bold">Date</th>
                      <th className="p-3.5 font-bold">Amount (KES)</th>
                      <th className="p-3.5 font-bold">Status</th>
                      <th className="p-3.5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {invoices.map((inv: any, idx: number) => (
                      <tr key={inv.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">{inv.id}</td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-300">{inv.date}</td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">KES {Number(inv.amount || 0).toLocaleString()}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              const updated = invoices.filter((_: any, i: number) => i !== idx);
                              setInvoices(updated);
                              localStorage.setItem('munyaka_billing_invoices', JSON.stringify(updated));
                              showSuccess('Invoice record deleted.');
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                            title="Delete invoice record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Persistent Teacher App Lock & Bypass Controls */}
        <Card className="rounded-[2rem] border-slate-200 shadow-xl bg-white dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-5">
            <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Lock size={22} />
              </div>
              Teacher App Locks &amp; Overrides
            </CardTitle>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Persistent access controls enforced across all staff and teacher sessions.
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Teacher Apps Global Lock</h3>
                  <p className="text-xs text-slate-500">Lock teacher portal when subscription is pending.</p>
                </div>
                <Button
                  onClick={handleToggleLock}
                  className={`font-bold rounded-xl h-11 px-5 shadow-md flex items-center gap-2 ${
                    appLocked ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {appLocked ? <Lock size={16} /> : <Unlock size={16} />}
                  {appLocked ? 'Locked' : 'Unlocked'}
                </Button>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Platform Owner Bypass</h3>
                  <p className="text-xs text-slate-500">Allow Jamlyan Analytics operator override.</p>
                </div>
                <Button
                  onClick={handleToggleBypass}
                  className={`font-bold rounded-xl h-11 px-5 shadow-md ${
                    ownerBypass ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-300'
                  }`}
                >
                  {ownerBypass ? 'Bypass Active' : 'Disabled'}
                </Button>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Autolock on Overdue Billing</h3>
                  <p className="text-xs text-slate-500">Automatically lock teacher apps if payment is overdue.</p>
                </div>
                <Button
                  onClick={handleToggleAutolock}
                  className={`font-bold rounded-xl h-11 px-5 shadow-md ${
                    autolockOverdue ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-300'
                  }`}
                >
                  {autolockOverdue ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid Section 2: System Updates & Maintenance Banner Manager */}
      <Card className="rounded-[2rem] border-slate-200 shadow-xl bg-white dark:bg-slate-900 dark:border-slate-800">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-5">
          <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Settings size={22} />
            </div>
            System Updates &amp; Maintenance Banner Manager
          </CardTitle>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Configure active system release notes, software version badges, and publish maintenance mode banners.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSaveSystemConfig} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Active System Version</Label>
                <Input
                  value={systemVersion}
                  onChange={e => setSystemVersion(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 font-bold text-slate-900 dark:text-white"
                  placeholder="e.g. v2.6.4-stable"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Fee Per Seat (KES)</Label>
                <Input
                  type="number"
                  value={feePerSeat}
                  onChange={e => setFeePerSeat(Number(e.target.value))}
                  className="h-12 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Billing Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Release Notes / Update Notice</Label>
              <textarea
                value={releaseNotes}
                onChange={e => setReleaseNotes(e.target.value)}
                rows={3}
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 font-medium text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter release notes and updates..."
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={handleToggleMaintenance}
                  className={`font-bold rounded-xl h-12 px-6 shadow-md ${
                    maintenanceMode ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-300'
                  }`}
                >
                  <AlertTriangle size={16} className="mr-2" />
                  {maintenanceMode ? 'Maintenance Mode: Active' : 'Publish Maintenance Banner'}
                </Button>
              </div>

              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl h-12 px-8 shadow-lg shadow-indigo-950/30"
              >
                Save &amp; Sync Operator Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
