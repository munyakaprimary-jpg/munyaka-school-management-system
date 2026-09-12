import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Shield, Key, Wifi, CreditCard, Server, Activity, CheckCircle2, RefreshCw,
  Terminal, Cpu, Building2, Settings as SettingsIcon, FileText, Monitor,
  FolderArchive, Plus, Search, Download, Trash2, Power, AlertTriangle, Play,
  Laptop, HardDrive, Printer, Check, Copy, User, Sparkles, ArrowUpRight, Zap,
  X
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface LicenseRecord {
  id: string;
  key: string;
  issuedTo: string;
  deviceId: string;
  paymentMethod: string;
  paymentRef: string;
  amount: string;
  validFor: string;
  issuedDate: string;
  expiryDate: string;
  status: 'Active' | 'Expired';
}

interface PaymentRecord {
  id: string;
  date: string;
  tenant: string;
  method: string;
  ref: string;
  amount: string;
  status: string;
}

export default function DevDashboard() {
  const [isSyncing, setIsSyncing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const [autoRenew, setAutoRenew] = useState(true);
  const [selectedRow, setSelectedRow] = useState(false);

  // 1. MODAL STATES
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isGenerateKeyOpen, setIsGenerateKeyOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'details' | 'configuration' | 'gateways'>('details');

  // Gateways Local Payment state
  const [paymentMode, setPaymentMode] = useState<'M-Pesa' | 'Cash' | 'Bank'>('M-Pesa');
  const [localAmount, setLocalAmount] = useState('');
  const [localCurrency, setLocalCurrency] = useState('KES — Kenyan Shilling');
  const [localReference, setLocalReference] = useState('');
  const [localNote, setLocalNote] = useState('');

  const [paymentLogs, setPaymentLogs] = useState<Array<{
    id: string;
    date: string;
    mode: 'M-Pesa' | 'Cash' | 'Bank';
    reference: string;
    amount: string;
    note?: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('munyaka_payment_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'LOG-1',
        date: '8/29/2026',
        mode: 'M-Pesa',
        reference: 'JEM01234',
        amount: 'KES 2000',
        note: 'School fees for April 2026, Class 4'
      }
    ];
  });

  // Configuration Form State (Exact requirement with centralized subscription config state)
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('munyaka_subscription_config');
    return saved ? JSON.parse(saved) : {
      amount: '20000',
      currency: 'KES',
      nextBilling: '2026-09-02',
      seats: '1000',
      planName: 'Munyaka School License',
      planLabel: 'Enterprise Plan',
      tier: 'Starter'
    };
  });

  // Individual form inputs tied to config state for easy editing
  const [configPlanName, setConfigPlanName] = useState(config.planName);
  const [configPlanLabel, setConfigPlanLabel] = useState(config.planLabel);
  const [configAmount, setConfigAmount] = useState(config.amount);
  const [configCurrency, setConfigCurrency] = useState(config.currency.includes('KES') ? 'KES — Kenyan Shilling' : config.currency);
  const [configBillingDate, setConfigBillingDate] = useState(config.nextBilling);
  const [configSeats, setConfigSeats] = useState(config.seats);
  const [configTier, setConfigTier] = useState(config.tier);

  // Dynamic tenant state
  const [selectedTenant, setSelectedTenant] = useState<{ id: string; name: string } | null>({
    id: 'SCH-01',
    name: 'Munyaka Primary & Junior Secondary',
  });

  const licenseTitle = selectedTenant ? `${selectedTenant.name} License` : 'Tenant Subscription License';
  const subtitleName = selectedTenant ? selectedTenant.name : 'Institutional Tenant';

  // License keys state
  const [licenseHistory, setLicenseHistory] = useState<LicenseRecord[]>([
    {
      id: 'LIC-001',
      key: 'MUNYAKA-2026-MF59-6CN5-NHGS-RWXU',
      issuedTo: 'School Operator',
      deviceId: 'OFFICE-001',
      paymentMethod: 'M-Pesa',
      paymentRef: 'JEM03456',
      amount: 'KES 20,000',
      validFor: '30 Days (Trial)',
      issuedDate: '8/29/2026',
      expiryDate: '9/28/2026',
      status: 'Active',
    },
  ]);

  // Payment history records
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([
    {
      id: 'PAY-1001',
      date: '2026-08-29',
      tenant: 'Munyaka Primary & Junior Secondary',
      method: 'M-Pesa',
      ref: 'JEM03456',
      amount: 'KES 20,000',
      status: 'Verified',
    },
    {
      id: 'PAY-1000',
      date: '2026-07-29',
      tenant: 'Munyaka Primary & Junior Secondary',
      method: 'Bank Transfer (KCB)',
      ref: 'KCB-99201',
      amount: 'KES 20,000',
      status: 'Verified',
    },
  ]);

  // Form states: Record Payment
  const [paymentTenant, setPaymentTenant] = useState('Munyaka Primary');
  const [paymentAmount, setPaymentAmount] = useState('20000');
  const [paymentMethod, setPaymentMethod] = useState('M-Pesa');
  const [paymentRef, setPaymentRef] = useState('MPESA' + Math.floor(100000 + Math.random() * 900000));
  const [paymentValidity, setPaymentValidity] = useState('30 Days');

  // Form states: Generate Key
  const [targetDeviceId, setTargetDeviceId] = useState('OFFICE-001');
  const [targetTier, setTargetTier] = useState('Enterprise');
  const [targetExpiry, setTargetExpiry] = useState('2026-10-30');
  const [generatedKeyResult, setGeneratedKeyResult] = useState<string | null>(null);

  const handleExportReport = () => {
    showSuccess('Platform Developer report exported successfully.');
  };

  const handleRecordPaymentSubmit = () => {
    if (!paymentAmount || !paymentRef) {
      showError('Please fill in all required fields.');
      return;
    }

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const newPayment: PaymentRecord = {
      id: 'PAY-' + Math.floor(1000 + Math.random() * 9000),
      date: dateStr,
      tenant: paymentTenant,
      method: paymentMethod,
      ref: paymentRef,
      amount: `KES ${Number(paymentAmount).toLocaleString()}`,
      status: 'Verified',
    };

    // Auto generate an activation key
    const hex = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const newKey = `MUNYAKA-2026-${hex()}-${hex()}-${hex()}-${hex()}`;

    const newLicense: LicenseRecord = {
      id: 'LIC-' + Math.floor(100 + Math.random() * 900),
      key: newKey,
      issuedTo: paymentTenant,
      deviceId: 'DEV-' + hex(),
      paymentMethod: paymentMethod,
      paymentRef: paymentRef,
      amount: `KES ${Number(paymentAmount).toLocaleString()}`,
      validFor: paymentValidity,
      issuedDate: today.toLocaleDateString(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: 'Active',
    };

    setPaymentHistory([newPayment, ...paymentHistory]);
    setLicenseHistory([newLicense, ...licenseHistory]);
    setIsRecordPaymentOpen(false);
    showSuccess(`Payment recorded & Key generated: ${newKey}`);
  };

  const handleGenerateKeySubmit = () => {
    const hex = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const newKey = `MUNYAKA-2026-${hex()}-${hex()}-${hex()}-${hex()}`;
    setGeneratedKeyResult(newKey);

    const newLicense: LicenseRecord = {
      id: 'LIC-' + Math.floor(100 + Math.random() * 900),
      key: newKey,
      issuedTo: selectedTenant?.name || 'School Operator',
      deviceId: targetDeviceId || 'OFFICE-001',
      paymentMethod: 'Offline Generated',
      paymentRef: 'OFFLINE-' + hex(),
      amount: 'KES 0',
      validFor: '30 Days',
      issuedDate: new Date().toLocaleDateString(),
      expiryDate: targetExpiry || '2026-10-30',
      status: 'Active',
    };

    setLicenseHistory([newLicense, ...licenseHistory]);
    showSuccess(`Offline Key Generated: ${newKey}`);
  };

  // If path is /dev/subscriptions, render the exact requested subscriptions layout
  if (path === '/dev/subscriptions') {
    return (
      <div className="space-y-8 animate-in fade-in duration-300 pb-16">
        {/* 1. TOP PURPLE SUMMARY HERO CARD */}
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden border border-purple-800/50">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/30 text-purple-200 text-xs font-black uppercase tracking-widest border border-purple-400/30 backdrop-blur-md">
                  <Key size={14} /> ACTIVE PLAN
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3 flex-wrap">
                    {licenseTitle}
                    <span className="text-sm font-bold text-purple-300 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-700/50">
                      Enterprise Plan
                    </span>
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-3 py-1 gap-1.5">
                    <CheckCircle2 size={12} /> Active
                  </Badge>
                  <Badge className="bg-purple-800/60 text-purple-200 border border-purple-700/50 font-bold px-3 py-1">
                    STARTER
                  </Badge>
                  <Badge className="bg-indigo-800/60 text-indigo-200 border border-indigo-700/50 font-bold px-3 py-1 gap-1">
                    <RefreshCw size={11} /> monthly
                  </Badge>
                </div>
              </div>

              {/* Top Right Box ("CURRENT BILL") */}
              <div className="bg-purple-950/70 border border-purple-700/40 rounded-2xl p-5 backdrop-blur-md shadow-inner flex flex-col justify-center min-w-[240px] space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">Current Bill</p>
                <p className="text-2xl md:text-3xl font-black text-white">
                  {config.currency.split(' ')[0]} {Number(config.amount || 0).toLocaleString()} <span className="text-xs font-normal text-purple-300">/mo</span>
                </p>
                <div className="text-xs text-purple-200 space-y-0.5 pt-1 border-t border-purple-800/60">
                  <p className="font-medium">Next: <strong className="text-white">{config.nextBilling}</strong></p>
                  <p className="font-medium"><strong className="text-white">{Number(config.seats || 0).toLocaleString()} institutional seats</strong></p>
                </div>
              </div>
            </div>

            {/* 2. BUTTON onClick BINDINGS */}
            <div className="pt-4 border-t border-purple-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => setIsRecordPaymentOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl h-11 px-5 shadow-lg gap-2">
                  <Zap size={16} className="text-amber-300" /> Record Payment
                </Button>
                <Button onClick={() => { setGeneratedKeyResult(null); setIsGenerateKeyOpen(true); }} variant="outline" className="border-purple-600 bg-purple-900/40 text-purple-100 hover:bg-purple-800 font-bold rounded-2xl h-11 px-5 gap-2">
                  <Sparkles size={16} className="text-purple-300" /> Generate License Key
                </Button>
                <Button onClick={() => setIsHistoryOpen(true)} variant="outline" className="border-purple-600 bg-purple-900/40 text-purple-100 hover:bg-purple-800 font-bold rounded-2xl h-11 px-5 gap-2">
                  <RefreshCw size={16} className="text-purple-300" /> View Payment History
                </Button>
              </div>
              <p className="text-xs text-purple-300 font-medium">
                {paymentHistory.length} payments logged · {licenseHistory.length} active licenses · KES {(paymentHistory.length * 20000).toLocaleString()} paid
              </p>
            </div>
          </div>
        </div>

        {/* TOP NAVIGATION TABS BAR */}
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100 flex flex-wrap items-center gap-2">
          <Button onClick={() => setActiveSubTab('details')} variant={activeSubTab === 'details' ? 'default' : 'ghost'} className={activeSubTab === 'details' ? "bg-indigo-600 text-white font-bold rounded-xl text-xs h-10 px-4 gap-2" : "text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs h-10 px-4 gap-2"}>
            <RefreshCw size={14} /> License Details ({activeSubTab === 'details' ? 'Active' : ''})
          </Button>
          <Button onClick={() => setActiveSubTab('configuration')} variant={activeSubTab === 'configuration' ? 'default' : 'ghost'} className={activeSubTab === 'configuration' ? "bg-indigo-600 text-white font-bold rounded-xl text-xs h-10 px-4 gap-2" : "text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs h-10 px-4 gap-2"}>
            <SettingsIcon size={14} /> Configuration
          </Button>
          <Button onClick={() => { setActiveSubTab('gateways'); }} variant={activeSubTab === 'gateways' ? 'default' : 'ghost'} className={activeSubTab === 'gateways' ? "bg-indigo-600 text-white font-bold rounded-xl text-xs h-10 px-4 gap-2" : "text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs h-10 px-4 gap-2"}>
            <Wifi size={14} /> Payment Gateways
          </Button>
          <Button onClick={() => setIsHistoryOpen(true)} variant="ghost" className="text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs h-10 px-4 gap-2">
            <FileText size={14} /> Invoice History
          </Button>
        </div>

        {/* MAIN LICENSE DETAILS CARD OR CONFIGURATION TAB VIEW */}
        {activeSubTab === 'gateways' ? (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* 1. SECTION HEADER CARD */}
            <Card className="border-none shadow-xl rounded-3xl bg-white p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner text-2xl font-bold">
                    $
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Log a Local Payment</h2>
                    <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">Record cash, bank deposit, or M-Pesa payments manually — no API keys needed.</p>
                  </div>
                </div>
              </div>

              {/* 2. PAYMENT MODE SELECTOR BUTTONS (3 Cards) */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                  PAYMENT MODE
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* M-Pesa Card */}
                  <div
                    onClick={() => setPaymentMode('M-Pesa')}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex items-center gap-3 ${
                      paymentMode === 'M-Pesa'
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${paymentMode === 'M-Pesa' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      📱
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">M-Pesa</p>
                      <p className="text-[11px] text-slate-500 font-medium">Mobile money transaction</p>
                    </div>
                  </div>

                  {/* Cash Card */}
                  <div
                    onClick={() => setPaymentMode('Cash')}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex items-center gap-3 ${
                      paymentMode === 'Cash'
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${paymentMode === 'Cash' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      $
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">Cash</p>
                      <p className="text-[11px] text-slate-500 font-medium">Physical cash payment</p>
                    </div>
                  </div>

                  {/* Bank Card */}
                  <div
                    onClick={() => setPaymentMode('Bank')}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex items-center gap-3 ${
                      paymentMode === 'Bank'
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${paymentMode === 'Bank' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      🏛️
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">Bank</p>
                      <p className="text-[11px] text-slate-500 font-medium">Bank transfer or deposit</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* 3. PAYMENT FORM FIELDS */}
              <div className="space-y-6 pt-2">
                
                {/* ROW 1: Amount & Currency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Input: AMOUNT */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                      AMOUNT
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                        KES
                      </span>
                      <Input
                        type="text"
                        value={localAmount}
                        onChange={(e) => setLocalAmount(e.target.value)}
                        className="pl-16 h-12 rounded-2xl border-slate-200 font-bold text-slate-900 bg-slate-50/50 focus:bg-white transition-all text-base"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Right Select Dropdown: CURRENCY */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                      CURRENCY
                    </label>
                    <Select value={localCurrency} onValueChange={setLocalCurrency}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-bold text-slate-900 bg-slate-50/50">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="KES — Kenyan Shilling">KES — Kenyan Shilling</SelectItem>
                        <SelectItem value="USD — US Dollar">USD — US Dollar</SelectItem>
                        <SelectItem value="EUR — Euro">EUR — Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ROW 2: TRANSACTION REFERENCE / RECEIPT NUMBER */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    TRANSACTION REFERENCE / RECEIPT NUMBER
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 font-bold">
                      #
                    </span>
                    <Input
                      type="text"
                      value={localReference}
                      onChange={(e) => setLocalReference(e.target.value)}
                      className="pl-11 h-12 rounded-2xl border-slate-200 font-bold text-slate-900 bg-slate-50/50 focus:bg-white transition-all"
                      placeholder="e.g. MG23K4R5HT"
                    />
                  </div>
                </div>

                {/* ROW 3: NOTE (OPTIONAL) */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    NOTE (OPTIONAL)
                  </label>
                  <Input
                    type="text"
                    value={localNote}
                    onChange={(e) => setLocalNote(e.target.value)}
                    className="h-12 rounded-2xl border-slate-200 font-bold text-slate-900 bg-slate-50/50 focus:bg-white transition-all"
                    placeholder="e.g. School fees for April 2026, Class 4"
                  />
                </div>

                {/* PRIMARY ACTION BUTTON */}
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      if (!localAmount.trim()) {
                        alert('Please enter an amount');
                        return;
                      }
                      const ref = localReference.trim() || ('REF-' + Math.floor(1000 + Math.random() * 9000));
                      const currCode = localCurrency.split(' — ')[0] || 'KES';
                      const newEntry = {
                        id: 'LOG-' + Date.now(),
                        date: new Date().toLocaleDateString(),
                        mode: paymentMode,
                        reference: ref,
                        amount: `${currCode} ${localAmount}`,
                        note: localNote.trim() || undefined
                      };
                      const next = [newEntry, ...paymentLogs];
                      setPaymentLogs(next);
                      try {
                        localStorage.setItem('munyaka_payment_logs', JSON.stringify(next));
                      } catch (e) {}

                      // Clear form
                      setLocalAmount('');
                      setLocalReference('');
                      setLocalNote('');
                      showSuccess(`Payment of ${currCode} ${localAmount} logged successfully!`);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-2xl h-14 shadow-xl gap-2 transition-all transform active:scale-[0.99]"
                  >
                    <span>✓</span> Log Payment
                  </Button>
                </div>

              </div>
            </Card>

            {/* 4. LOWER "PAYMENT LOG" SECTION */}
            <Card className="border-none shadow-xl rounded-3xl bg-white p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Payment Log</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">All locally recorded payments — cash, bank, and M-Pesa.</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold px-3 py-1 text-xs self-start sm:self-center">
                  {paymentLogs.length} record(s) logged
                </Badge>
              </div>

              {paymentLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
                  No payment records logged yet. Use the form above to record cash, bank or M-Pesa payments.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-4">DATE</th>
                        <th className="px-5 py-4">MODE</th>
                        <th className="px-5 py-4">REFERENCE</th>
                        <th className="px-5 py-4">AMOUNT</th>
                        <th className="px-5 py-4 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {paymentLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4 text-slate-700 whitespace-nowrap text-xs font-bold">
                            {log.date}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <Badge className={`font-bold text-xs px-2.5 py-1 border-none ${
                              log.mode === 'M-Pesa'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.mode === 'Cash'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {log.mode}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60">
                              {log.reference}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-slate-900 font-black text-sm">
                            {log.amount}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const next = paymentLogs.filter(p => p.id !== log.id);
                                setPaymentLogs(next);
                                try {
                                  localStorage.setItem('munyaka_payment_logs', JSON.stringify(next));
                                } catch (e) {}
                                showSuccess('Payment log deleted');
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 font-bold text-xs h-8 px-3 rounded-lg"
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        ) : activeSubTab === 'configuration' ? (
          <div className="space-y-6">
            {/* 1. SECTION HEADER CARD */}
            <Card className="border-none shadow-xl rounded-3xl bg-white p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-inner">
                  <span className="text-2xl">⚙️</span>
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Subscription Configuration</h2>
                  <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">Configure the institutional plan details, billing, and seat limits.</p>
                </div>
              </div>
            </Card>

            {/* 2. FORM GRID LAYOUT (2 Columns) */}
            <Card className="border-none shadow-xl rounded-3xl bg-white p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* ROW 1: Left Input: SUBSCRIPTION PLAN NAME */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    SUBSCRIPTION PLAN NAME
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400">
                      <Building2 size={18} />
                    </span>
                    <Input
                      type="text"
                      value={configPlanName}
                      onChange={(e) => setConfigPlanName(e.target.value)}
                      className="pl-11 h-12 rounded-2xl border-slate-200 font-bold text-slate-900 bg-slate-50/50 focus:bg-white transition-all"
                      placeholder="Munyaka School License"
                    />
                  </div>
                </div>

                {/* ROW 1: Right Input: PLAN LABEL (TIER) */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    PLAN LABEL (TIER)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-purple-600">
                      ✨
                    </span>
                    <Input
                      type="text"
                      value={configPlanLabel}
                      onChange={(e) => setConfigPlanLabel(e.target.value)}
                      className="pl-11 h-12 rounded-2xl border-slate-200 font-bold text-slate-900 bg-slate-50/50 focus:bg-white transition-all"
                      placeholder="Enterprise Plan"
                    />
                  </div>
                </div>

                {/* ROW 2: Left Input: AMOUNT */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    AMOUNT
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 font-bold text-base">
                      $
                    </span>
                    <Input
                      type="text"
                      value={configAmount}
                      onChange={(e) => setConfigAmount(e.target.value)}
                      className="pl-11 h-12 rounded-2xl border-slate-200 font-bold text-slate-900 bg-slate-50/50 focus:bg-white transition-all"
                      placeholder="20000"
                    />
                  </div>
                </div>

                {/* ROW 2: Right Select Dropdown: CURRENCY */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    CURRENCY
                  </label>
                  <Select value={configCurrency} onValueChange={setConfigCurrency}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-bold text-slate-900 bg-slate-50/50">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="KES — Kenyan Shilling">KES — Kenyan Shilling</SelectItem>
                      <SelectItem value="USD — US Dollar">USD — US Dollar</SelectItem>
                      <SelectItem value="EUR — Euro">EUR — Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* ROW 3: Left Input: NEXT BILLING DATE */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    NEXT BILLING DATE
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400">
                      📅
                    </span>
                    <Input
                      type="text"
                      value={configBillingDate}
                      onChange={(e) => setConfigBillingDate(e.target.value)}
                      className="pl-11 h-12 rounded-2xl border-slate-200 font-bold text-slate-900 bg-slate-50/50 focus:bg-white transition-all"
                      placeholder="02/09/2026"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium px-1">
                    When the next payment will be debited. Leave blank to use +30 days from today.
                  </p>
                </div>

                {/* ROW 3: Right Input: INSTITUTIONAL SEATS */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    INSTITUTIONAL SEATS
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400">
                      👥
                    </span>
                    <Input
                      type="text"
                      value={configSeats}
                      onChange={(e) => setConfigSeats(e.target.value)}
                      className="pl-11 h-12 rounded-2xl border-slate-200 font-bold text-slate-900 bg-slate-50/50 focus:bg-white transition-all"
                      placeholder="1000"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium px-1">
                    Maximum number of users (staff + learners) allowed under this license.
                  </p>
                </div>

              </div>

              {/* ROW 4 (Full Width): SUBSCRIPTION TIER */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  SUBSCRIPTION TIER
                </label>
                <Select value={configTier} onValueChange={setConfigTier}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-bold text-slate-900 bg-slate-50/50">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </Card>

            {/* 3. LIVE PREVIEW CARD (LIVE PREVIEW) */}
            <div className="bg-gradient-to-br from-indigo-50/95 via-purple-50/90 to-blue-50/95 border border-indigo-200/80 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  ✓
                </span>
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-900">LIVE PREVIEW</h3>
              </div>

              {/* Data Grid (4 Columns) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-indigo-100 shadow-sm space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">PLAN</span>
                  <p className="text-sm font-black text-slate-900 truncate">{configPlanLabel || 'Enterprise Plan'}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-indigo-100 shadow-sm space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">AMOUNT</span>
                  <p className="text-sm font-black text-slate-900 truncate">
                    {configCurrency.split(' — ')[0]} {configAmount || '20000'}
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-indigo-100 shadow-sm space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">NEXT BILLING</span>
                  <p className="text-sm font-black text-slate-900 truncate">
                    {configBillingDate ? (() => {
                      // Normalize date format if entered as DD/MM/YYYY to show M/D/YYYY or similar if needed, or keep exact
                      const parts = configBillingDate.split('/');
                      if (parts.length === 3) {
                        return `${parseInt(parts[1])}/${parseInt(parts[0])}/${parts[2]}`;
                      }
                      return configBillingDate;
                    })() : '9/2/2026'}
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-indigo-100 shadow-sm space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">SEATS</span>
                  <p className="text-sm font-black text-slate-900 truncate">
                    {Number(configSeats || 1000).toLocaleString()} seats
                  </p>
                </div>
              </div>

              {/* Sub-row */}
              <div className="bg-white/60 backdrop-blur-sm px-5 py-3 rounded-2xl border border-indigo-100/60 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">TIER</span>
                <span className="text-xs font-black text-slate-900">{configTier}</span>
              </div>
            </div>

            {/* 4. PRIMARY ACTION BUTTON */}
            <div>
              <Button
                onClick={() => {
                  const updatedConfig = {
                    amount: configAmount,
                    currency: configCurrency.split(' ')[0],
                    nextBilling: configBillingDate,
                    seats: configSeats,
                    planName: configPlanName,
                    planLabel: configPlanLabel,
                    tier: configTier
                  };
                  setConfig(updatedConfig);
                  try {
                    localStorage.setItem('munyaka_subscription_config', JSON.stringify(updatedConfig));
                  } catch (e) {}
                  showSuccess('Subscription settings saved! Hero summary updated.');
                }}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white font-black text-base rounded-2xl h-14 shadow-xl gap-2 transition-all transform active:scale-[0.99]"
              >
                <span>💾</span> Save Configuration
              </Button>
            </div>
          </div>
        ) : (
        <Card className="border-none shadow-xl rounded-3xl bg-white p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">{config.planName || licenseTitle}</h3>
                <p className="text-xs text-slate-500 font-medium">{subtitleName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold gap-1">
                <CheckCircle2 size={12} /> Active
              </Badge>
              <Badge className="bg-indigo-100 text-indigo-800 border-none font-bold">
                {config.tier ? config.tier.toUpperCase() : 'STARTER'}
              </Badge>
            </div>
          </div>

          {/* Metrics Grid (2 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plan</span>
              <span className="text-sm font-black text-slate-900">{config.planLabel || 'Enterprise Plan'}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interval</span>
              <span className="text-sm font-black text-slate-900">Monthly</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</span>
              <span className="text-sm font-black text-slate-900">{config.currency.split(' ')[0]} {Number(config.amount || 0).toLocaleString()}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next Billing</span>
              <span className="text-sm font-black text-slate-900">{config.nextBilling || '2026-09-02'}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Billing Cycle</span>
              <span className="text-sm font-black text-slate-900">Day 1 of each month</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><User size={14} className="text-indigo-600" /> Institutional Seats</span>
              <span className="text-sm font-black text-slate-900">{Number(config.seats || 0).toLocaleString()} seats</span>
            </div>
          </div>

          {/* Included Feature Badges */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Included Features</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-3 py-1.5">✓ Unlimited Students</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-3 py-1.5">✓ Advanced Analytics</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-3 py-1.5">✓ Priority Support</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-3 py-1.5">✓ Offline Activation Codes</Badge>
            </div>
          </div>

          {/* Controls & Action Buttons */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Auto-Renew License</h4>
                <p className="text-xs text-slate-500">Automatically charge payment method on billing cycle date</p>
              </div>
              <Switch checked={autoRenew} onCheckedChange={(val) => { setAutoRenew(val); showSuccess(`Auto-renew ${val ? 'enabled' : 'disabled'}`); }} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button onClick={() => showSuccess('Upgrade options opened.')} variant="outline" className="font-bold rounded-xl h-11 gap-2">
                <ArrowUpRight size={16} /> Upgrade Plan
              </Button>
              <Button onClick={() => showSuccess('License renewed successfully.')} variant="outline" className="font-bold rounded-xl h-11 gap-2">
                <RefreshCw size={16} /> Renew License
              </Button>
            </div>

            <Button onClick={() => setIsRecordPaymentOpen(true)} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl h-12 shadow-lg gap-2">
              <Key size={16} /> Record Payment & Generate License Key
            </Button>

            <Button onClick={() => showSuccess('Edit license modal opened.')} variant="ghost" className="w-full text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl h-10 gap-2">
              <SettingsIcon size={14} /> Edit License Details
            </Button>
          </div>
        </Card>
        )}

        {/* LICENSE HISTORY & ACTIVATION KEYS TABLE CARD */}
        <Card className="border-none shadow-xl rounded-3xl bg-white p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-black text-slate-900">License History &amp; Activation Keys</h3>
                <Badge className="bg-purple-100 text-purple-800 border-none font-bold text-xs">🔑 {licenseHistory.length} key{licenseHistory.length === 1 ? '' : 's'} issued</Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">Select one or more rows to enable batch deletion. All issued activation keys, their payment records, and status.</p>
            </div>
            <Button onClick={() => { setGeneratedKeyResult(null); setIsGenerateKeyOpen(true); }} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl gap-1.5">
              <Plus size={14} /> Generate Offline Key
            </Button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <Checkbox checked={selectedRow} onCheckedChange={(c) => setSelectedRow(!!c)} />
                  </th>
                  <th className="p-4">Activation Key</th>
                  <th className="p-4">Issued To</th>
                  <th className="p-4">Device ID</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Valid For</th>
                  <th className="p-4">Expiry</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {licenseHistory.map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 text-center">
                      <Checkbox checked={selectedRow} onCheckedChange={(c) => setSelectedRow(!!c)} />
                    </td>
                    <td className="p-4 font-mono font-bold text-purple-600 text-xs">
                      {lic.key}
                    </td>
                    <td className="p-4 font-bold text-slate-900">{lic.issuedTo}</td>
                    <td className="p-4">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-800">{lic.deviceId}</code>
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {lic.paymentMethod} <span className="text-[11px] font-normal text-slate-400 block font-mono">{lic.paymentRef}</span>
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-700">{lic.validFor}</td>
                    <td className="p-4 font-mono text-xs text-slate-600">
                      {lic.expiryDate}
                      <span className="text-[10px] text-slate-400 block font-normal">Issued: {lic.issuedDate}</span>
                    </td>
                    <td className="p-4">
                      <Badge className={lic.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border-none font-bold gap-1 w-max' : 'bg-slate-100 text-slate-600 border-none font-bold gap-1 w-max'}>
                        <CheckCircle2 size={12} /> {lic.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(lic.key); showSuccess('Key copied to clipboard.'); }} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50">
                        Copy Key
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 3. MODAL COMPONENT IMPLEMENTATIONS */}

        {/* A. RECORD PAYMENT MODAL */}
        <Dialog open={isRecordPaymentOpen} onOpenChange={setIsRecordPaymentOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white border border-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Zap size={20} className="text-purple-600" /> Record New Payment
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                Log an offline or mobile transaction and issue an activated license key.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tenant / Campus</label>
                <Select value={paymentTenant} onValueChange={setPaymentTenant}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select Tenant" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Munyaka Primary">Munyaka Primary & Junior Secondary</SelectItem>
                    <SelectItem value="Munyaka West Campus">Munyaka Academy (West Campus)</SelectItem>
                    <SelectItem value="Munyaka E-Learning Hub">Munyaka E-Learning Hub</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Amount (KES)</label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="20000"
                  className="rounded-xl border-slate-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Payment Method</label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Select Method" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="M-Pesa">M-Pesa Express / Paybill</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer (KCB)</SelectItem>
                      <SelectItem value="Cash">Cash at Bursar Desk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Validity</label>
                  <Select value={paymentValidity} onValueChange={setPaymentValidity}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="30 Days">30 Days (Monthly)</SelectItem>
                      <SelectItem value="90 Days">90 Days (Quarterly)</SelectItem>
                      <SelectItem value="365 Days">365 Days (Annual)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Reference / Transaction Code</label>
                <Input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. QKE89128LK"
                  className="rounded-xl border-slate-200 font-mono text-sm"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => setIsRecordPaymentOpen(false)} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button onClick={handleRecordPaymentSubmit} className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl gap-1.5">
                <Key size={14} /> Record & Issue Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* B. GENERATE LICENSE KEY MODAL */}
        <Dialog open={isGenerateKeyOpen} onOpenChange={setIsGenerateKeyOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white border border-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Sparkles size={20} className="text-amber-500" /> Generate Offline Activation Key
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                Cryptographically bind hardware ID or machine hash with an offline license cert.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Target Device ID / HWID</label>
                <Input
                  value={targetDeviceId}
                  onChange={(e) => setTargetDeviceId(e.target.value)}
                  placeholder="e.g. OFFICE-001 or HWID-UUID"
                  className="rounded-xl border-slate-200 font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tier</label>
                  <Select value={targetTier} onValueChange={setTargetTier}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Tier" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Starter">Starter (100 Seats)</SelectItem>
                      <SelectItem value="Standard">Standard (350 Seats)</SelectItem>
                      <SelectItem value="Enterprise">Enterprise (1,000 Seats)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Expiry Date</label>
                  <Input
                    type="date"
                    value={targetExpiry}
                    onChange={(e) => setTargetExpiry(e.target.value)}
                    className="rounded-xl border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              {generatedKeyResult && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-purple-700">Newly Generated Activation Key</p>
                  <code className="text-xs font-mono font-bold text-purple-900 block break-all">{generatedKeyResult}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { navigator.clipboard.writeText(generatedKeyResult); showSuccess('Key copied to clipboard.'); }}
                    className="w-full font-bold text-xs bg-white text-purple-700 border-purple-300 hover:bg-purple-100 rounded-xl mt-1"
                  >
                    <Copy size={13} className="mr-1" /> Copy Key
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => setIsGenerateKeyOpen(false)} className="rounded-xl font-bold">
                Close
              </Button>
              <Button onClick={handleGenerateKeySubmit} className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl gap-1.5">
                <Key size={14} /> Generate Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* C. PAYMENT HISTORY MODAL */}
        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="sm:max-w-2xl rounded-3xl p-6 bg-white border border-slate-100 max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <FileText size={20} className="text-indigo-600" /> Tenant Payment History
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                Official transaction logs and digital receipt audit records.
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto flex-1 my-2 rounded-2xl border border-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-slate-50">
                  <tr>
                    <th className="p-3.5">Invoice #</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Tenant</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Reference</th>
                    <th className="p-3.5 text-right">Amount</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
                  {paymentHistory.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-indigo-600">{p.id}</td>
                      <td className="p-3.5 text-slate-500">{p.date}</td>
                      <td className="p-3.5 font-bold text-slate-900">{p.tenant}</td>
                      <td className="p-3.5">{p.method}</td>
                      <td className="p-3.5 font-mono text-slate-600">{p.ref}</td>
                      <td className="p-3.5 text-right font-black text-slate-900">{p.amount}</td>
                      <td className="p-3.5">
                        <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                          {p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-between sm:justify-between">
              <p className="text-[11px] text-slate-400 font-medium">{paymentHistory.length} total receipts archived</p>
              <Button variant="default" onClick={() => setIsHistoryOpen(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-5">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* ── Top Header Banner ────────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest border border-cyan-500/30">
              <Shield size={14} /> PLATFORM DEVELOPER CONSOLE • ACTIVE
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Platform Developer Dashboard
            </h1>
            <p className="text-sm text-slate-400 max-w-xl font-medium">
              Subscription, licensing, network synchronization, and platform health for Developer.
            </p>
          </div>

          {/* ── Top Action Buttons ──────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => navigate('/lan-config')}
              variant="outline"
              className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 font-bold rounded-2xl h-11 px-4 gap-2"
            >
              <Wifi size={16} className="text-cyan-400" /> LAN Server Config
            </Button>
            <Button
              onClick={() => navigate('/settings/profile')}
              variant="outline"
              className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 font-bold rounded-2xl h-11 px-4 gap-2"
            >
              <SettingsIcon size={16} className="text-cyan-400" /> Profile Settings
            </Button>
            <Button
              onClick={handleExportReport}
              variant="outline"
              className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 font-bold rounded-2xl h-11 px-4 gap-2"
            >
              <FileText size={16} className="text-cyan-400" /> Export Report
            </Button>
            <Button
              onClick={() => navigate('/dev/subscriptions')}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold h-11 px-5 rounded-2xl shadow-lg shadow-cyan-900/30 gap-2 transition-all active:scale-95"
            >
              <CreditCard size={16} /> Manage Plan & Licenses
            </Button>
          </div>
        </div>
      </div>

      {/* ── Subscription & Licensing Banner (Cyan Gradient Card) ───────── */}
      <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-br from-cyan-600 via-teal-600 to-blue-700 text-white shadow-xl overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-widest backdrop-blur-md">
              <Key size={14} /> CURRENT PLATFORM LICENSE
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl md:text-3xl font-black">Enterprise Plan</h2>
              <span className="bg-white/25 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase backdrop-blur-md">
                ACTIVE NODE
              </span>
            </div>
            <p className="text-sm text-white/90 font-medium">
              Next Renewal: October 2027 • Active
            </p>
          </div>
          <Button
            onClick={() => navigate('/dev/subscriptions')}
            className="bg-white text-slate-900 hover:bg-slate-100 font-black rounded-2xl h-12 px-6 shadow-xl transition-all active:scale-95 shrink-0"
          >
            Upgrade / Renew License
          </Button>
        </div>
      </div>

      {/* ── Capacity & Seat Tracking Cards ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-xl rounded-3xl bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Student Seats</h3>
                <p className="text-xs text-slate-500 font-medium">Learner capacity allocation</p>
              </div>
            </div>
            <span className="text-sm font-black text-cyan-600">0%</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>0 / 500 allocated</span>
              <span>500 Max</span>
            </div>
            <Progress value={0} className="h-3 bg-slate-100 [&>div]:bg-cyan-600 rounded-full" />
          </div>
        </Card>

        <Card className="border-none shadow-xl rounded-3xl bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Staff / Admin Seats</h3>
                <p className="text-xs text-slate-500 font-medium">Operator token seats</p>
              </div>
            </div>
            <span className="text-sm font-black text-blue-600">22%</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>11 / 50 allocated</span>
              <span>50 Max</span>
            </div>
            <Progress value={22} className="h-3 bg-slate-100 [&>div]:bg-blue-600 rounded-full" />
          </div>
        </Card>
      </div>

      {/* ── Sidebar Menu & Footer Profile Section ─────────────────────── */}
      <Card className="border-none shadow-xl rounded-3xl bg-white p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
            <User size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Platform Developer Profile</h3>
            <p className="text-xs text-slate-500 font-medium">Active operator credentials and role metadata</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Name</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">Platform Developer</p>
            </div>
            <Badge className="bg-slate-200 text-slate-800 border-none font-bold text-[10px]">Verified</Badge>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Role Tag</p>
              <p className="text-sm font-mono font-bold text-cyan-600 mt-0.5">DEVELOPER</p>
            </div>
            <Badge className="bg-cyan-100 text-cyan-800 border-none font-bold text-[10px]">ACTIVE</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
