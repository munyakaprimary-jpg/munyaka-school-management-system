import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Wallet,
  Receipt,
  AlertCircle,
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Download,
  Crown,
  Sparkles,
  Smartphone,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  getActiveLicense,
  getAllLicenses,
  daysRemainingUntil,
  isLicenseExpiredAt,
  validityLabel,
} from '@/services/licenseService';
import { downloadCSV } from '@/utils/downloadHelper';
import { showSuccess, showError } from '@/utils/toast';
import { formatRelativeTime } from '@/services/activityLog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeeTransaction {
  id: string;
  learnerId?: string;
  studentId?: string;
  learnerName?: string;
  studentName?: string;
  amount: number;
  paidAt?: string;
  date?: string;
  paymentMethod?: string;
  method?: string;
  status?: string;
  category?: string;
  ref?: string;
}

type SubscriptionStatus = 'active' | 'due' | 'grace_period' | 'expired';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safeRead = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const formatKES = (n: number): string => `KES ${Math.round(n).toLocaleString()}`;

const formatDate = (iso: string | undefined | null): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
};

const formatDateLong = (iso: string | undefined | null): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
};

const safeDate = (raw: any): Date | null => {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

// ─── Subscription Status Logic ───────────────────────────────────────────────

/**
 * Maps the active license's expiry to one of:
 *  - 'active'       : > 14 days remaining
 *  - 'due'          : 1–14 days remaining
 *  - 'grace_period' : expired within the last 7 days
 *  - 'expired'      : expired > 7 days ago
 *
 * Returns 'due' as a sensible default when no license is installed
 * (so the owner still sees a real badge rather than an empty state).
 */
const resolveSubscriptionStatus = (): {
  status: SubscriptionStatus;
  daysRemaining: number;
  expiresAt: string | null;
  validityDays: number;
} => {
  const license = getActiveLicense();
  if (!license) {
    return { status: 'due', daysRemaining: 0, expiresAt: null, validityDays: 365 };
  }
  const days = daysRemainingUntil(license.expiresAt);
  const expired = isLicenseExpiredAt(license.expiresAt);
  let status: SubscriptionStatus = 'active';
  if (expired) {
    // Compute days since expiry for grace period
    const ms = new Date(license.expiresAt).getTime() - Date.now();
    const daysSinceExpiry = Math.ceil(Math.abs(ms) / (1000 * 60 * 60 * 24));
    status = daysSinceExpiry <= 7 ? 'grace_period' : 'expired';
  } else if (days <= 14) {
    status = 'due';
  }
  return {
    status,
    daysRemaining: days,
    expiresAt: license.expiresAt,
    validityDays: license.validityDays,
  };
};

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * Executive dashboard for the `owner` role.
 *
 * Tailored for platform billing and financial oversight:
 *   1. System Subscription & Licensing Status card (tier, renewal, seats)
 *   2. Executive Financial Summary cards (revenue, outstanding, status)
 *   3. Recent Transactions & Payment Audit Logs
 *   4. Quick actions: export financial report / download PDF receipt
 *
 * Reads:
 *   - Active license + all licenses (licenseService)
 *   - School learners (school_learners_data) for seat counts
 *   - Transactions (munyaka_transactions) for fee audit
 */
const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();

  // ── Subscription / licensing ───────────────────────────────────────────────
  const [subState, setSubState] = useState(() => resolveSubscriptionStatus());
  const [history, setHistory] = useState(() => getAllLicenses());

  useEffect(() => {
    // Re-resolve on mount in case the license changed since last render
    setSubState(resolveSubscriptionStatus());
    setHistory(getAllLicenses());
  }, []);

  // ── Seat capacity: students + staff ────────────────────────────────────────
  const seatCounts = useMemo(() => {
    const learners: any[] = safeRead('school_learners_data', []);
    const activeLearners = learners.filter((l: any) => l.status !== 'TRANSFERRED').length;

    // Staff seats read from a few plausible sources
    const staffRaw = safeRead<any[]>('munyaka_staff_prereg', []);
    const activeStaff = Array.isArray(staffRaw)
      ? staffRaw.filter((s: any) => s.status !== 'Suspended').length
      : 0;

    // Cap per plan tier: Pro = 500 students / 50 staff; Enterprise = 2000 / 200
    const isEnterprise = (subState.validityDays ?? 0) >= 730;
    const studentCap = isEnterprise ? 2000 : 500;
    const staffCap = isEnterprise ? 200 : 50;

    return {
      studentsUsed: activeLearners,
      studentCap,
      studentsPercent: Math.min(100, Math.round((activeLearners / studentCap) * 100)),
      staffUsed: activeStaff,
      staffCap,
      staffPercent: Math.min(100, Math.round((activeStaff / staffCap) * 100)),
      isEnterprise,
    };
  }, [subState.validityDays]);

  // ── Financial aggregates ──────────────────────────────────────────────────
  const financials = useMemo(() => {
    const tx: FeeTransaction[] = safeRead<FeeTransaction[]>('munyaka_transactions', []);

    // Total collected
    const paid = tx.filter((t) => t.status === 'paid' || t.paidAt);
    const totalCollected = paid.reduce((s, t) => s + (Number(t.amount) || 0), 0);

    // Outstanding unpaid balances from active learners
    const learners: any[] = safeRead('school_learners_data', []);
    const paidByLearner: Record<string, number> = {};
    paid.forEach((t) => {
      const key = t.learnerId || t.studentId || '';
      paidByLearner[key] = (paidByLearner[key] || 0) + (Number(t.amount) || 0);
    });
    let outstanding = 0;
    let outstandingCount = 0;
    let totalExpected = 0;
    learners.filter((l: any) => l.status !== 'TRANSFERRED').forEach((l: any) => {
      const feeBalance = Number(l.feeBalance) || 0;
      const paidByStudent = paidByLearner[l.id] || 0;
      const remaining = feeBalance - paidByStudent;
      if (remaining > 0) {
        outstanding += remaining;
        outstandingCount += 1;
      }
      // Sum all expected fee balances across active learners
      totalExpected += feeBalance;
    });

    // Collection rate
    const collectionRate = totalExpected > 0
      ? Math.round((totalCollected / totalExpected) * 100)
      : 0;

    return {
      totalExpected,
      totalCollected,
      outstanding,
      outstandingCount,
      transactionCount: paid.length,
      collectionRate,
    };
  }, []);

  // ── Recent transactions (audit log) ────────────────────────────────────────
  const recentTransactions = useMemo(() => {
    const tx: FeeTransaction[] = safeRead<FeeTransaction[]>('munyaka_transactions', []);
    return tx
      .filter((t) => t.status === 'paid' || t.paidAt)
      .sort((a, b) => {
        const da = safeDate(a.paidAt || a.date)?.getTime() ?? 0;
        const db = safeDate(b.paidAt || b.date)?.getTime() ?? 0;
        return db - da;
      })
      .slice(0, 10)
      .map((t) => ({
        id: t.id || `${Date.now()}-${Math.random()}`,
        learner: t.learnerName || t.studentName || 'Unknown',
        amount: Number(t.amount) || 0,
        date: t.paidAt || t.date || '',
        method: t.paymentMethod || t.method || 'Cash',
        status: t.status || 'paid',
        ref: t.ref || t.id || '—',
        category: t.category || 'Tuition',
      }));
  }, []);

  // Subscription billing invoices synthesized from the license history
  const subscriptionInvoices = useMemo(() => {
    return history
      .filter((l) => l.payment?.amount)
      .slice()
      .sort((a, b) => (b.issuedAt || '').localeCompare(a.issuedAt || ''))
      .slice(0, 6)
      .map((l) => ({
        id: l.id,
        amount: Number(l.payment?.amount) || 0,
        method: l.payment?.method || 'cash',
        ref: l.payment?.refNumber || '—',
        issuedAt: l.issuedAt,
        validity: validityLabel(l.validityDays as 30 | 365 | 730),
        status: l.status,
      }));
  }, [history]);

  // Merge transactions + subscription invoices for the audit log
  const auditRows = useMemo(() => {
    const txRows = recentTransactions.map((t) => ({
      key: `tx-${t.id}`,
      type: 'fee' as const,
      label: t.learner,
      category: t.category,
      method: t.method,
      ref: t.ref,
      amount: t.amount,
      date: t.date,
      icon: Smartphone,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    }));
    const invRows = subscriptionInvoices.map((i) => ({
      key: `inv-${i.id}`,
      type: 'invoice' as const,
      label: 'Subscription Invoice',
      category: i.validity,
      method: i.method,
      ref: i.ref,
      amount: i.amount,
      date: i.issuedAt,
      icon: Building2,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    }));
    return [...txRows, ...invRows].sort((a, b) => {
      const da = safeDate(a.date)?.getTime() ?? 0;
      const db = safeDate(b.date)?.getTime() ?? 0;
      return db - da;
    });
  }, [recentTransactions, subscriptionInvoices]);

  // ── Revenue trend (last 6 months) ──────────────────────────────────────────
  const revenueTrend = useMemo(() => {
    const tx: FeeTransaction[] = safeRead<FeeTransaction[]>('munyaka_transactions', []);
    const paid = tx.filter((t) => t.status === 'paid' || t.paidAt);
    const now = new Date();
    const buckets: { label: string; total: number; sortKey: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleDateString('en-KE', { month: 'short' });
      const total = paid.reduce((s, t) => {
        const td = safeDate(t.paidAt || t.date);
        if (!td) return s;
        if (td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth()) {
          return s + (Number(t.amount) || 0);
        }
        return s;
      }, 0);
      buckets.push({ label, total, sortKey: d.getTime() });
    }
    return buckets;
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUpgrade = () => {
    // Route to payment-management page
    window.location.hash = '#/payment-management';
  };

  const handleExportReport = async () => {
    try {
      const rows = [
        ['MUNYAKA PRIMARY AND JUNIOR SCHOOL'],
        ['P.O. BOX 5239, ELDORET'],
        ['MOTTO: Knowledge Is Power'],
        [''],
        ['Executive Financial Report'],
        [`Generated: ${new Date().toLocaleString('en-KE')}`],
        [''],
        ['SUMMARY'],
        ['Metric', 'Amount (KES)'],
        ['Total Expected Revenue', financials.totalExpected.toString()],
        ['Total Collected', financials.totalCollected.toString()],
        ['Outstanding Unpaid', financials.outstanding.toString()],
        ['Collection Rate (%)', financials.collectionRate.toString()],
        [''],
        ['RECENT TRANSACTIONS'],
        ['Date', 'Payer', 'Method', 'Reference', 'Category', 'Amount (KES)'],
        ...recentTransactions.map((t) => [
          formatDate(t.date),
          t.learner,
          t.method,
          t.ref,
          t.category,
          t.amount.toString(),
        ]),
        [''],
        ['SUBSCRIPTION INVOICES'],
        ['Issued', 'Validity', 'Method', 'Reference', 'Amount (KES)'],
        ...subscriptionInvoices.map((i) => [
          formatDate(i.issuedAt),
          i.validity,
          i.method,
          i.ref,
          i.amount.toString(),
        ]),
      ];
      const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
      const filename = `Munyaka_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      await downloadCSV(csv, filename);
      showSuccess('Financial report downloaded.');
    } catch (err) {
      console.error(err);
      showError('Could not export the report. Please try again.');
    }
  };

  const handleDownloadLatestReceipt = () => {
    const latest = recentTransactions[0];
    if (!latest) {
      showError('No recent transactions available to download.');
      return;
    }
    // Build a minimal printable receipt and download as a text file
    const body = [
      'MUNYAKA PRIMARY AND JUNIOR SCHOOL',
      'P.O. BOX 5239, ELDORET',
      'MOTTO: Knowledge Is Power',
      '',
      'PAYMENT RECEIPT',
      '',
      `Receipt No:    ${latest.ref}`,
      `Date:          ${formatDateLong(latest.date)}`,
      `Payer:         ${latest.learner}`,
      `Method:        ${latest.method}`,
      `Category:      ${latest.category}`,
      '',
      `Amount Paid:   ${formatKES(latest.amount)}`,
      '',
      'Thank you for your payment.',
      '',
    ].join('\n');
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${latest.ref}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showSuccess('Latest receipt downloaded.');
  };

  // ── Subscription Status Badge Config ──────────────────────────────────────
  const statusConfig: Record<SubscriptionStatus, {
    label: string;
    bg: string;
    text: string;
    dot: string;
  }> = {
    active: {
      label: 'Active',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
    },
    due: {
      label: 'Due',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
    },
    grace_period: {
      label: 'Grace Period',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      dot: 'bg-orange-500',
    },
    expired: {
      label: 'Expired',
      bg: 'bg-red-50',
      text: 'text-red-700',
      dot: 'bg-red-500',
    },
  };
  const sub = statusConfig[subState.status];

  const tierName = seatCounts.isEnterprise ? 'Enterprise Plan' : 'Pro Plan';
  const tierIcon = seatCounts.isEnterprise ? Crown : Sparkles;
  const TierIcon = tierIcon;
  const tierGradient = seatCounts.isEnterprise
    ? 'from-indigo-600 via-violet-600 to-fuchsia-600'
    : 'from-blue-600 via-cyan-600 to-teal-500';

  return (
    <div className="space-y-8 pb-10">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 bg-indigo-50 text-indigo-700 gap-1.5">
              <Shield size={10} />
              Owner Console
            </Badge>
            <Badge variant="outline" className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 ${sub.bg} ${sub.text} gap-1.5`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sub.dot} animate-pulse`} />
              {sub.label}
            </Badge>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Owner Dashboard
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Subscription, billing, and high-level financial health
            {user?.name ? ` for ${user.name}` : ''}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportReport}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <FileText size={14} className="mr-1.5" />
            Export Report
          </Button>
          <Button
            size="sm"
            onClick={handleUpgrade}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-md"
          >
            <RefreshCw size={14} className="mr-1.5" />
            {subState.status === 'active' ? 'Manage Plan' : 'Upgrade / Renew'}
          </Button>
        </div>
      </div>

      {/* ── 1. System Subscription & Licensing Card ─────────────────────── */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
        <div className={`relative bg-gradient-to-br ${tierGradient} p-6 md:p-8`}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -ml-8 -mb-8 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 ring-1 ring-white/30">
                <TierIcon size={26} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/80">
                  Current Subscription
                </p>
                <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
                  {tierName}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <div className="flex items-center gap-1.5 text-white/90 text-xs">
                    <Calendar size={12} />
                    <span>
                      Next billing: <strong className="font-bold text-white">{formatDateLong(subState.expiresAt)}</strong>
                    </span>
                  </div>
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <div className="flex items-center gap-1.5 text-white/90 text-xs">
                    <Clock size={12} />
                    <span>
                      {subState.status === 'expired'
                        ? 'Expired'
                        : subState.status === 'grace_period'
                          ? 'In grace period'
                          : `${subState.daysRemaining} day${subState.daysRemaining === 1 ? '' : 's'} remaining`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleUpgrade}
              className="rounded-xl bg-white text-slate-900 hover:bg-white/90 font-bold shadow-lg"
              size="lg"
            >
              <Sparkles size={14} className="mr-1.5" />
              Upgrade / Renew Subscription
              <ExternalLink size={12} className="ml-1.5 opacity-60" />
            </Button>
          </div>
        </div>

        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student seats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <GraduationCap size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Student Seats
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {seatCounts.studentsUsed} / {seatCounts.studentCap.toLocaleString()} used
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-blue-600">
                  {seatCounts.studentsPercent}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                  style={{ width: `${seatCounts.studentsPercent}%` }}
                />
              </div>
            </div>

            {/* Staff seats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Briefcase size={16} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Staff Seats
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {seatCounts.staffUsed} / {seatCounts.staffCap} used
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-violet-600">
                  {seatCounts.staffPercent}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
                  style={{ width: `${seatCounts.staffPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <Mail size={12} className="text-slate-400" />
              <span className="truncate">billing@munyaka.sc.ke</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Phone size={12} className="text-slate-400" />
              <span>+254 712 345 678</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Receipt size={12} className="text-slate-400" />
              <span>{history.length} license{history.length === 1 ? '' : 's'} on file</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Executive Financial Summary Cards ───────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Executive Financial Summary
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time revenue, outstanding balances, and subscription health.
            </p>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 bg-slate-100 text-slate-700 gap-1.5">
            <DollarSign size={10} />
            KES · Kenyan Shilling
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total expected */}
          <Card className="border-none shadow-sm rounded-2xl bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Wallet size={18} className="text-blue-600" />
                </div>
                <ArrowUpRight size={14} className="text-blue-500" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Expected Revenue
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1 truncate">
                {formatKES(financials.totalExpected)}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Total fee balance across active learners
              </p>
            </CardContent>
          </Card>

          {/* Total collected */}
          <Card className="border-none shadow-sm rounded-2xl bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                </div>
                <ArrowUpRight size={14} className="text-emerald-500" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Collected
              </p>
              <p className="text-2xl font-black text-emerald-600 mt-1 truncate">
                {formatKES(financials.totalCollected)}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full px-1.5 py-0.5">
                  {financials.collectionRate}%
                </span>
                <p className="text-[10px] text-slate-400">collection rate</p>
              </div>
            </CardContent>
          </Card>

          {/* Outstanding unpaid */}
          <Card className="border-none shadow-sm rounded-2xl bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <AlertCircle size={18} className="text-amber-600" />
                </div>
                <ArrowDownRight size={14} className="text-amber-500" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Outstanding Unpaid
              </p>
              <p className="text-2xl font-black text-amber-600 mt-1 truncate">
                {formatKES(financials.outstanding)}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Across {financials.outstandingCount} account{financials.outstandingCount === 1 ? '' : 's'}
              </p>
            </CardContent>
          </Card>

          {/* Subscription status */}
          <Card className={`border-none shadow-sm rounded-2xl bg-gradient-to-br ${
            subState.status === 'active'
              ? 'from-emerald-50 to-teal-50'
              : subState.status === 'due'
                ? 'from-amber-50 to-orange-50'
                : 'from-red-50 to-rose-50'
          }`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center`}>
                  <CreditCard size={18} className={
                    subState.status === 'active' ? 'text-emerald-600'
                      : subState.status === 'due' ? 'text-amber-600'
                        : 'text-red-600'
                  } />
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${sub.dot} animate-pulse`} />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Subscription
              </p>
              <p className={`text-2xl font-black mt-1 ${sub.text}`}>
                {sub.label}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {subState.status === 'active' && subState.daysRemaining > 0
                  ? `Renews ${formatDate(subState.expiresAt)}`
                  : subState.status === 'expired'
                    ? 'Renew now to restore access'
                    : 'Action recommended'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Collection vs Expected Chart */}
        <Card className="border-none shadow-sm rounded-2xl bg-white mt-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">
                Revenue Collected (Last 6 Months)
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly fee collection trend in KES
              </p>
            </div>
            <TrendingUp size={18} className="text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueTrend} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`
                    }
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              {d.label}
                            </p>
                            <p className="text-lg font-black text-emerald-600 mt-0.5">
                              {formatKES(d.total)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                    {revenueTrend.map((entry, idx) => {
                      const isLast = idx === revenueTrend.length - 1;
                      return (
                        <Cell
                          key={entry.label}
                          fill={isLast ? '#10b981' : '#a7f3d0'}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Recent Transactions & Payment Audit Log ─────────────────── */}
      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4">
          <div>
            <CardTitle className="text-base font-bold text-slate-800">
              Recent Transactions & Payment Audit
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              M-Pesa receipts, fee collections, and system billing invoices
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadLatestReceipt}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
              disabled={recentTransactions.length === 0}
            >
              <Download size={14} className="mr-1.5" />
              Latest Receipt
            </Button>
            <Button
              size="sm"
              onClick={handleExportReport}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              <FileText size={14} className="mr-1.5" />
              Export Financial Report
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {auditRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Receipt size={20} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">
                No payment activity yet.
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                Once fee payments and subscription invoices are recorded, they will appear
                here for executive review.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6366f1 #f1f5f9' }}>
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Payer / Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Amount (KES)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {auditRows.map((row) => {
                    const Icon = row.icon;
                    return (
                      <tr
                        key={row.key}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-lg ${row.iconBg} flex items-center justify-center shrink-0`}>
                              <Icon size={15} className={row.iconColor} />
                            </div>
                            <Badge
                              variant="outline"
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border-0 ${
                                row.type === 'fee'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-indigo-50 text-indigo-700'
                              }`}
                            >
                              {row.type === 'fee' ? 'M-Pesa / Fee' : 'Invoice'}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-slate-800 truncate max-w-[220px]">
                            {row.label}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                            {row.category}
                          </p>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-xs font-medium text-slate-600 capitalize">
                            {row.method}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <code className="text-[11px] font-mono text-slate-500 bg-slate-50 rounded-md px-1.5 py-0.5">
                            {row.ref}
                          </code>
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="text-xs font-medium text-slate-700">
                            {formatDate(row.date)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatRelativeTime(row.date)}
                          </p>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className={`font-black ${
                            row.type === 'fee' ? 'text-emerald-600' : 'text-indigo-600'
                          }`}>
                            {formatKES(row.amount)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {/* Quick action footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            Showing the most recent {auditRows.length} payment event{auditRows.length === 1 ? '' : 's'}.
            Full history is available in the Payment Management console.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportReport}
              className="rounded-lg text-slate-600 hover:text-slate-900"
            >
              <FileText size={13} className="mr-1" />
              CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadLatestReceipt}
              disabled={recentTransactions.length === 0}
              className="rounded-lg text-slate-600 hover:text-slate-900"
            >
              <Receipt size={13} className="mr-1" />
              Latest PDF Receipt
            </Button>
          </div>
        </div>
      </Card>

    </div>
  );
};

export default OwnerDashboard;
