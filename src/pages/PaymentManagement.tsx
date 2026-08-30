"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import BackButton from '@/components/ui/BackButton';
import {
  CreditCard,
  Crown,
  Calendar,
  TrendingUp,
  ShieldCheck,
  Receipt,
  Download,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  Filter,
  BarChart3,
  Lock,
  Key,
  Wallet,
  Building2,
  Mail,
  Smartphone,
  Landmark,
  Banknote,
  CheckCircle,
  CircleDollarSign,
  History,
  FileText,
  PieChart,
  Activity,
  Loader2
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import InvoiceHistoryTable from '@/components/fees/InvoiceHistoryTable';
import RecordLicensePaymentModal from '@/components/RecordLicensePaymentModal';
import { License, LICENSE_METHOD_LABELS, ValidityDuration } from '@/types/license';
import {
  getAllLicenses,
  getActiveLicense,
  getLicenseStats,
  validityLabel,
  revokeLicense,
  activateLicense,
  daysRemainingUntil,
  isLicenseExpiredAt,
} from '@/services/licenseService';

/* =========================================================================
   SOFTWARE-PAYMENT & INVOICE TYPES
   ========================================================================= */

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'bank' | 'cheque' | 'mpesa';

export interface SoftwarePayment {
  id: string;
  invoiceId: string;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paidAt: string;       // ISO 8601 timestamp
  status: PaymentStatus;
  licenseKey?: string;
  notes?: string;
}

export const PAYMENT_LOGGED_EVENT = 'munyaka_payments_logged';

const MONTHLY_PAYMENTS_KEY = 'munyaka_monthly_payments';
const LOCAL_PAYMENTS_KEY = 'munyaka_local_payments';

/* =========================================================================
   HELPERS
   ========================================================================= */

const readPayments = (): SoftwarePayment[] => {
  const merged: SoftwarePayment[] = [];

  try {
    const monthlyRaw = localStorage.getItem(MONTHLY_PAYMENTS_KEY);
    if (monthlyRaw) {
      const parsed = JSON.parse(monthlyRaw);
      if (Array.isArray(parsed)) merged.push(...parsed);
    }
  } catch { /* noop */ }

  try {
    const localRaw = localStorage.getItem(LOCAL_PAYMENTS_KEY);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      if (Array.isArray(parsed)) merged.push(...parsed);
    }
  } catch { /* noop */ }

  // Sort newest first
  return merged.sort((a, b) => {
    const at = new Date(a.paidAt).getTime();
    const bt = new Date(b.paidAt).getTime();
    return bt - at;
  });
};

const formatKES = (n: number) => `KES ${n.toLocaleString()}`;
const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch {
    return iso;
  }
};

/* =========================================================================
   PAYMENT MANAGEMENT COMPONENT
   ========================================================================= */

const PaymentManagement = () => {
  /* ----------------------------------------------------------------
     STATE
     ---------------------------------------------------------------- */

  // Empty initial state — no hardcoded entries
  const [payments, setPayments] = useState<SoftwarePayment[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [activeLicense, setActiveLicense] = useState<License | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, revoked: 0 });

  // Modal state
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<License | null>(null);

  // Filter state for invoice table
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  /* ----------------------------------------------------------------
     EFFECTS
     ---------------------------------------------------------------- */

  // Sync payments + license data from localStorage on mount and on
  // any of the standard storage update events.
  useEffect(() => {
    const refresh = () => {
      setPayments(readPayments());
      setLicenses(getAllLicenses());
      setActiveLicense(getActiveLicense());
      setStats(getLicenseStats());
    };
    refresh();

    window.addEventListener(PAYMENT_LOGGED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener(PAYMENT_LOGGED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  /* ----------------------------------------------------------------
     DERIVED DATA
     ---------------------------------------------------------------- */

  const totalPaid = useMemo(
    () => payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    [payments]
  );

  const pendingAmount = useMemo(
    () => payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
    [payments]
  );

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const term = searchQuery.trim().toLowerCase();
      const matchesSearch = !term ||
        p.invoiceId.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [payments, statusFilter, searchQuery]);

  /* ----------------------------------------------------------------
     HANDLERS
     ---------------------------------------------------------------- */

  const handleLicenseIssued = useCallback((license: License) => {
    setLicenses(getAllLicenses());
    setActiveLicense(getActiveLicense());
    setStats(getLicenseStats());

    // Persist a corresponding software-payment row for the invoice
    // table so the Owner can see the payment in the invoice history.
    try {
      const monthlyRaw = localStorage.getItem(MONTHLY_PAYMENTS_KEY);
      const monthly: SoftwarePayment[] = monthlyRaw ? JSON.parse(monthlyRaw) : [];
      const paymentMethod = (license.payment.method ?? 'cash') as PaymentMethod;

      const newPayment: SoftwarePayment = {
        id: `PMT-${Date.now()}`,
        invoiceId: `INV-${new Date().getFullYear()}-${String(monthly.length + 1).padStart(3, '0')}`,
        description: license.notes
          ? `Munyaka School License - ${license.notes}`
          : `Munyaka School License - ${validityLabel(license.validityDays)} Subscription`,
        amount: parseFloat(license.payment.amount) || 0,
        currency: 'KES',
        paymentMethod,
        paidAt: new Date().toISOString(),
        status: 'paid',
        licenseKey: license.activationKey,
        notes: license.notes,
      };

      monthly.push(newPayment);
      localStorage.setItem(MONTHLY_PAYMENTS_KEY, JSON.stringify(monthly));
      setPayments(readPayments());
      window.dispatchEvent(new Event(PAYMENT_LOGGED_EVENT));
      showSuccess('License payment recorded as an invoice.');
    } catch (err) {
      console.error('Failed to persist license payment to invoice log:', err);
    }
  }, []);

  const handleRevokeConfirm = useCallback(() => {
    if (!revokeTarget) return;
    revokeLicense(revokeTarget.activationKey, 'Manually revoked from Payment Management');
    setLicenses(getAllLicenses());
    setActiveLicense(getActiveLicense());
    setStats(getLicenseStats());
    setRevokeTarget(null);
    showSuccess(`License ${revokeTarget.activationKey} revoked. App is now locked.`);
  }, [revokeTarget]);

  const handleReactivate = useCallback((key: string) => {
    try {
      activateLicense(key);
      setLicenses(getAllLicenses());
      setActiveLicense(getActiveLicense());
      setStats(getLicenseStats());
      showSuccess(`License ${key.slice(0, 8)}... reactivated.`);
    } catch (err) {
      showError('Could not reactivate this license. Please check the key.');
    }
  }, []);

  /* ----------------------------------------------------------------
    RENDER
    ---------------------------------------------------------------- */

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* ========== HEADER ========== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                Payment & Subscriptions
              </h1>
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-black px-3 py-1 text-[10px]">
                <Crown size={12} className="mr-1 inline" /> SUPER ADMIN (OWNER)
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Manage software subscription, license keys, and invoice history.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsRecordOpen(true)}
          className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-100"
        >
          <Plus size={18} /> Record License Payment
        </Button>
      </div>

      {/* ========== ACTIVE LICENSE BANNER ========== */}
      {activeLicense && (
        <Card className={cn(
          "border-2 shadow-md rounded-3xl overflow-hidden",
          daysRemainingUntil(activeLicense.expiresAt) <= 30
            ? "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
            : "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50"
        )}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-2xl",
                  daysRemainingUntil(activeLicense.expiresAt) <= 30 ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                )}>
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Active License
                  </p>
                  <p className="font-mono font-black text-slate-900 text-sm tracking-wider break-all">
                    {activeLicense.activationKey}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Issued to <strong className="text-slate-700">{activeLicense.issuedTo}</strong>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Expires
                  </p>
                  <p className="font-bold text-slate-900 text-sm">{formatDate(activeLicense.expiresAt)}</p>
                </div>
                <Badge className={cn(
                  "border font-bold text-xs gap-1",
                  daysRemainingUntil(activeLicense.expiresAt) <= 30
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                )}>
                  <Clock size={12} />
                  {daysRemainingUntil(activeLicense.expiresAt)} day{daysRemainingUntil(activeLicense.expiresAt) !== 1 ? 's' : ''} left
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRevokeTarget(activeLicense)}
                  className="rounded-xl h-9 text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50 gap-1.5"
                >
                  <Lock size={12} /> Revoke
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== SUMMARY METRICS ========== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm rounded-2xl bg-indigo-600 text-white p-6 relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-10">
            <CircleDollarSign size={80} />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-200">Total Revenue</p>
          <h3 className="text-3xl font-black mt-1">{formatKES(totalPaid)}</h3>
          <p className="text-[10px] font-bold text-indigo-200 mt-1">Across {payments.filter(p => p.status === 'paid').length} invoices</p>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Licenses</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.active}</h3>
              <p className="text-[10px] font-bold text-emerald-600 mt-1">Currently installed</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <ShieldCheck size={22} />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expired</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.expired}</h3>
              <p className="text-[10px] font-bold text-rose-500 mt-1">Awaiting renewal</p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <AlertCircle size={22} />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Balance</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{formatKES(pendingAmount)}</h3>
              <p className="text-[10px] font-bold text-amber-600 mt-1">Unpaid invoices</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Clock size={22} />
            </div>
          </div>
        </Card>
      </div>

      {/* ========== TABS: INVOICES + LICENSE HISTORY ========== */}
      <Tabs defaultValue="invoices" className="w-full space-y-4">
        <TabsList className="bg-white p-1 rounded-xl shadow-sm border h-11 mb-4 inline-flex">
          <TabsTrigger value="invoices" className="rounded-lg px-5 h-full font-bold text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-600">
            <Receipt size={15} className="mr-1.5" /> Invoice History ({filteredPayments.length})
          </TabsTrigger>
          <TabsTrigger value="licenses" className="rounded-lg px-5 h-full font-bold text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-600">
            <Key size={15} className="mr-1.5" /> License Keys ({licenses.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Invoice History Tab ── */}
        <TabsContent value="invoices" className="space-y-4">
          {/* Search & filter bar */}
          <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by invoice ID, description, or payment ID..."
                className="pl-11 h-11 rounded-xl border-slate-200"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: 'all' | PaymentStatus) => setStatusFilter(v)}>
              <SelectTrigger className="h-11 w-[180px] rounded-xl border-slate-200 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredPayments.length > 0 ? (
            <InvoiceHistoryTable
              transactions={filteredPayments}
              onViewReceipt={() => showSuccess('Receipt details available below.')}
              onDownload={() => showSuccess('Downloaded payment receipt.')}
              onPrint={() => showSuccess('Sent receipt to printer.')}
            />
          ) : (
            <Card className="rounded-xl bg-white border border-slate-200/80 shadow-sm p-12 text-center">
              <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
                <div className="p-4 bg-amber-50 rounded-full">
                  <Receipt className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No Invoice Records</h3>
                <p className="text-sm text-slate-500">
                  No software payment invoices have been recorded yet. Click
                  <strong className="text-slate-800"> Record License Payment </strong>
                  to add your first invoice.
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ── License Keys Tab ── */}
        <TabsContent value="licenses" className="space-y-4">
          {licenses.length > 0 ? (
            <div className="space-y-3">
              {licenses.slice().reverse().map((lic) => {
                const isActive = activeLicense?.activationKey === lic.activationKey;
                const isExpired = isLicenseExpiredAt(lic.expiresAt);
                const remaining = daysRemainingUntil(lic.expiresAt);
                return (
                  <Card key={lic.id} className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <Key size={15} className="text-indigo-600" />
                            <p className="font-mono font-black text-slate-900 text-sm tracking-wider truncate">
                              {lic.activationKey}
                            </p>
                            {isActive && (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                                <CheckCircle size={10} className="mr-1" /> ACTIVE
                              </Badge>
                            )}
                            {isExpired && !isActive && (
                              <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold">
                                <AlertCircle size={10} className="mr-1" /> EXPIRED
                              </Badge>
                            )}
                            {lic.status === 'revoked' && (
                              <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] font-bold">
                                <Lock size={10} className="mr-1" /> REVOKED
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            Issued to <strong className="text-slate-700">{lic.issuedTo}</strong> •
                            {formatDate(lic.issuedAt)} →
                            {formatDate(lic.expiresAt)} ({validityLabel(lic.validityDays)})
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            via {LICENSE_METHOD_LABELS[lic.payment.method] ?? lic.payment.method} •
                            {formatKES(parseFloat(lic.payment.amount) || 0)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {!isActive && lic.status !== 'revoked' && remaining > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReactivate(lic.activationKey)}
                              className="rounded-xl h-9 text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1.5"
                            >
                              <CheckCircle2 size={12} /> Reactivate
                            </Button>
                          )}
                          {isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRevokeTarget(lic)}
                              className="rounded-xl h-9 text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50 gap-1.5"
                            >
                              <Lock size={12} /> Revoke
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="rounded-xl bg-white border border-slate-200/80 shadow-sm p-12 text-center">
              <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
                <div className="p-4 bg-indigo-50 rounded-full">
                  <Key className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No License Keys</h3>
                <p className="text-sm text-slate-500">
                  No license keys have been generated yet. Click
                  <strong className="text-slate-800"> Record License Payment </strong>
                  to issue a new activation key.
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ========== RECORD LICENSE PAYMENT MODAL ========== */}
      <RecordLicensePaymentModal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        onIssued={handleLicenseIssued}
        defaultIssuedTo="Munyaka Primary & Junior School"
        defaultSubscriptionName=""
      />

      {/* ========== REVOKE CONFIRMATION MODAL ========== */}
      {revokeTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in"
          onClick={() => setRevokeTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border max-w-md w-full p-6 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Revoke License?</h3>
                <p className="text-sm text-slate-500 font-medium">
                  This will immediately lock the app until a new key is activated.
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Revoking <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                {revokeTarget.activationKey}
              </code> will immediately lock the app for all users.
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setRevokeTarget(null)}
                className="flex-1 rounded-xl font-bold h-11 border border-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRevokeConfirm}
                className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold h-11 shadow-lg shadow-rose-100"
              >
                <Lock size={14} className="mr-1.5" /> Revoke License
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;