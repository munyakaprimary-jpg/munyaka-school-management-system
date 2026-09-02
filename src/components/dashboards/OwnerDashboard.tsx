import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { differenceInDays, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  Settings,
  Hash,
  Banknote,
  Coins,
  CircleDollarSign,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useCentralData, notifyDataChanged, getActiveLearners, getActiveTeachers } from '@/hooks/useCentralData';
import {
  getActiveLicense,
  getAllLicenses,
  isLicenseExpiredAt,
  validityLabel,
  daysRemainingUntil,
} from '@/services/licenseService';
import { downloadCSV } from '@/utils/downloadHelper';
import { showSuccess, showError } from '@/utils/toast';
import { formatRelativeTime } from '@/services/activityLog';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SubscriptionStatus = 'active' | 'due' | 'grace_period' | 'expired';

interface FeeTransaction {
  id: string;
  learnerId?: string;
  studentId?: string;
  learnerName?: string;
  studentName?: string;
  payerName?: string;
  invoiceTitle?: string;
  paymentFor?: string;
  billingPeriod?: string;
  amount: number;
  paidAt?: string;
  date?: string;
  paymentMethod?: string;
  method?: string;
  status?: string;
  category?: string;
  ref?: string;
  receiptNumber?: string;
  mpesaReceiptNumber?: string;
  type?: string;
  description?: string;
}

interface FeeStructure {
  year: string;
  term: string;
  gradeId: string;
  amount: number;
}

interface StudentFeeRecord {
  id: string;
  student: string;
  paid: number;
  total: number;
  balance: number;
  status: string;
}

interface LicenseInfo {
  planName: string;
  billingInterval: string;
  nextBillingDate: string | null;
  daysRemaining: number;
  expiresAt: string | null;
  maxStudentSeats: number;
  maxStaffSeats: number;
  isEnterprise: boolean;
  status: SubscriptionStatus;
  licenseId: string | null;
}

interface SeatMetrics {
  studentsUsed: number;
  studentCap: number;
  studentsPercent: number;
  staffUsed: number;
  staffCap: number;
  staffPercent: number;
}

interface FinancialMetrics {
  totalExpected: number;
  totalCollected: number;
  outstanding: number;
  transactionCount: number;
  collectionRate: number;
}

interface AuditRow {
  key: string;
  type: 'fee' | 'invoice' | 'subscription';
  label: string;
  subtext: string;
  method: string;
  ref: string;
  amount: number;
  date: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  paymentFor?: string;
  billingPeriod?: string;
  category?: string;
  rawType?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage Keys
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  TRANSACTIONS:         'munyaka_transactions',
  FEE_STRUCTURES:       'munyaka_fee_structures',
  STUDENT_FEES:         'munyaka_student_fees',
  SUBSCRIPTION_SETTINGS: 'munyaka_subscription_settings',
  LEARNERS:             'school_learners_data',
  STAFF:                'munyaka_staff_directory',
} as const;

type BillingCycle = 'monthly' | 'semi-annual' | 'annual';

interface SubscriptionSettings {
  billingCycle: BillingCycle;
  cycleStartDate: string;
}

const BILLING_CYCLE_DAYS: Record<BillingCycle, number> = {
  monthly:       30,
  'semi-annual': 183,
  annual:        365,
};

// ─────────────────────────────────────────────────────────────────────────────
// Safe localStorage Reader
// ─────────────────────────────────────────────────────────────────────────────

const safeRead = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Date / Number Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatKES = (n: number): string =>
  `KES ${Math.round(n).toLocaleString()}`;

const formatDate = (iso: string | undefined | null): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-KE', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return iso;
  }
};

const formatDateLong = (iso: string | undefined | null): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-KE', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return iso;
  }
};

const safeDate = (raw: string | undefined | null): Date | null => {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

const titleCase = (s: string): string => {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Type → Badge & Icon Mapping
// ─────────────────────────────────────────────────────────────────────────────

type RowKind = 'fee' | 'invoice' | 'subscription' | 'unknown';

interface KindPresentation {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
}

/**
 * Map a transaction's raw `type` (or `category`) value to a presentation
 * (badge label, icon, color). Falls back to the `paymentMethod` when no
 * explicit type is set, so M-Pesa / Bank / Cash each get their own icon.
 */
const mapRowKind = (
  rawType: string | undefined,
  rawCategory: string | undefined,
  method: string | undefined,
): { kind: RowKind; presentation: KindPresentation } => {
  const t = (rawType || '').toLowerCase().trim();
  const c = (rawCategory || '').toLowerCase().trim();
  const m = (method || '').toLowerCase().trim();

  // 1. Explicit fee / mpesa / payment kinds
  if (t === 'fee' || t === 'payment' || t === 'tuition' ||
      c === 'tuition' || c === 'fee' || c === 'school-fee' || c === 'school_fees') {
    return {
      kind: 'fee',
      presentation: {
        label: t === 'mpesa' || c === 'mpesa' ? 'M-Pesa Fee' : 'Fee',
        icon: Smartphone,
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
      },
    };
  }

  // 2. Subscription / system billing invoice
  if (t === 'subscription' || t === 'subscription_invoice' || t === 'billing') {
    return {
      kind: 'subscription',
      presentation: {
        label: 'Subscription',
        icon: Building2,
        iconBg: 'bg-indigo-50',
        iconColor: 'text-indigo-600',
        badgeBg: 'bg-indigo-50',
        badgeText: 'text-indigo-700',
      },
    };
  }

  // 3. Plain invoice (no explicit type)
  if (t === 'invoice' || c === 'invoice') {
    return {
      kind: 'invoice',
      presentation: {
        label: 'Invoice',
        icon: FileText,
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-600',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-700',
      },
    };
  }

  // 4. Method-based fallback (M-Pesa / Bank / Cash / Cheque)
  if (m === 'mpesa' || m.includes('m-pesa') || m.includes('mpesa')) {
    return {
      kind: 'fee',
      presentation: {
        label: 'M-Pesa / Fee',
        icon: Smartphone,
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
      },
    };
  }
  if (m === 'bank' || m.includes('bank') || m.includes('deposit')) {
    return {
      kind: 'fee',
      presentation: {
        label: 'Bank Payment',
        icon: Building2,
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-700',
      },
    };
  }
  if (m === 'cash') {
    return {
      kind: 'fee',
      presentation: {
        label: 'Cash Payment',
        icon: Banknote,
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-600',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-700',
      },
    };
  }
  if (m === 'cheque' || m.includes('cheque')) {
    return {
      kind: 'fee',
      presentation: {
        label: 'Cheque',
        icon: FileText,
        iconBg: 'bg-slate-50',
        iconColor: 'text-slate-600',
        badgeBg: 'bg-slate-100',
        badgeText: 'text-slate-700',
      },
    };
  }

  // 5. Default
  return {
    kind: 'unknown',
    presentation: {
      label: rawType ? rawType.toUpperCase() : 'Payment',
      icon: CircleDollarSign,
      iconBg: 'bg-slate-50',
      iconColor: 'text-slate-600',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-700',
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Subscription Settings Reader
// ─────────────────────────────────────────────────────────────────────────────

const getSubscriptionSettings = (issuedAt?: string): SubscriptionSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw) as SubscriptionSettings;
      if (parsed && typeof parsed.billingCycle === 'string' && parsed.cycleStartDate) {
        return parsed;
      }
    }
  } catch { /* fall through */ }

  const cycleStart = issuedAt ? new Date(issuedAt) : new Date();
  const defaults: SubscriptionSettings = {
    billingCycle: 'monthly',
    cycleStartDate: cycleStart.toISOString().slice(0, 10),
  };
  localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_SETTINGS, JSON.stringify(defaults));
  return defaults;
};

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Subscription Resolver
// ─────────────────────────────────────────────────────────────────────────────

const resolveLicenseInfo = (): LicenseInfo => {
  const license = getActiveLicense();

  // No active license → Pro Plan defaults
  if (!license) {
    const today = new Date();
    const nextBilling = addDays(today, 30).toISOString().slice(0, 10);
    return {
      planName: 'Pro Plan',
      billingInterval: 'Monthly',
      nextBillingDate: nextBilling,
      daysRemaining: 30,
      expiresAt: null,
      maxStudentSeats: 500,
      maxStaffSeats: 50,
      isEnterprise: false,
      status: 'active',
      licenseId: null,
    };
  }

  // Read billing cycle from subscription settings
  const settings = getSubscriptionSettings(license.issuedAt);
  const billingCycle: BillingCycle = settings.billingCycle;
  const cycleStartDate = settings.cycleStartDate;

  // Seat caps based on license duration
  const isEnterprise = (license.validityDays ?? 0) >= 730;
  const maxStudentSeats = isEnterprise ? 2000 : 500;
  const maxStaffSeats = isEnterprise ? 200 : 50;

  // Compute next billing date from cycle start + billing cycle days
  const billingDays = BILLING_CYCLE_DAYS[billingCycle] ?? 30;
  const cycleStart = safeDate(cycleStartDate) ?? new Date();
  const nextBillingDate = addDays(cycleStart, billingDays).toISOString().slice(0, 10);
  const today = new Date();

  // Days remaining until next billing (dynamically calculated)
  const daysRemaining = Math.max(0, differenceInDays(addDays(cycleStart, billingDays), today));

  // Determine subscription status
  let status: SubscriptionStatus = 'active';
  if (isLicenseExpiredAt(license.expiresAt ?? '')) {
    const daysSinceExpiry = Math.max(0, differenceInDays(today, safeDate(license.expiresAt) ?? today));
    status = daysSinceExpiry <= 7 ? 'grace_period' : 'expired';
  } else if (daysRemaining <= 14) {
    status = 'due';
  }

  const billingInterval: string =
    billingCycle === 'monthly'       ? 'Monthly'       :
    billingCycle === 'semi-annual'  ? 'Semi-Annual'   :
                                      'Annual';

  return {
    planName: isEnterprise ? 'Enterprise Plan' : 'Pro Plan',
    billingInterval,
    nextBillingDate,
    daysRemaining,
    expiresAt: license.expiresAt,
    maxStudentSeats,
    maxStaffSeats,
    isEnterprise,
    status,
    licenseId: license.id,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Seat Metrics
// ─────────────────────────────────────────────────────────────────────────────

const computeSeatMetrics = (
  license: LicenseInfo,
  centralStudents: number,
  centralLoading: boolean,
  staffFromHook: number,
): SeatMetrics => {
  // Use hook's central students if loaded, otherwise query directly
  const studentsUsed = !centralLoading && centralStudents > 0
    ? centralStudents
    : getActiveLearners().length;

  const studentsPercent = Math.min(100, Math.round((studentsUsed / license.maxStudentSeats) * 100));

  return {
    studentsUsed,
    studentCap: license.maxStudentSeats,
    studentsPercent,
    staffUsed: staffFromHook,
    staffCap: license.maxStaffSeats,
    staffPercent: Math.min(100, Math.round((staffFromHook / license.maxStaffSeats) * 100)),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Financial Metrics
// ─────────────────────────────────────────────────────────────────────────────

const computeFinancialMetrics = (): FinancialMetrics => {
  // Active learners
  const activeLearners = getActiveLearners();
  const learnerCount = activeLearners.length;

  // Fee structures → build grade → amount map
  const feeStructures: FeeStructure[] = safeRead(STORAGE_KEYS.FEE_STRUCTURES, []);
  const gradeFeeMap: Record<string, number> = {};
  feeStructures.forEach((f) => {
    const key = (f.gradeId || '').replace(/\s+/g, '').toLowerCase();
    const existing = gradeFeeMap[key];
    gradeFeeMap[key] = existing ? Math.max(existing, f.amount) : f.amount;
  });

  // Total expected = sum of each active learner's grade fee
  let totalExpected = 0;
  activeLearners.forEach((l) => {
    const gradeId = (l.grade || '').replace(/\s+/g, '').toLowerCase();
    totalExpected += gradeFeeMap[gradeId] ?? 0;
  });

  // Transactions → total collected
  const transactions: FeeTransaction[] = safeRead(STORAGE_KEYS.TRANSACTIONS, []);
  const paidTx = transactions.filter((t) => t.status === 'paid' || !!t.paidAt);
  const totalCollected = paidTx.reduce((s, t) => s + (Number(t.amount) || 0), 0);

  // Fallback: if no fee structures configured, use per-student ledger
  if (totalExpected === 0 && learnerCount > 0) {
    const feeRecords: StudentFeeRecord[] = safeRead(STORAGE_KEYS.STUDENT_FEES, []);
    const ledgerExpected = feeRecords.reduce((s, r) => s + (Number(r.total) || 0), 0);
    const ledgerCollected = feeRecords.reduce((s, r) => s + (Number(r.paid) || 0), 0);
    const ledgerOutstanding = Math.max(0, ledgerExpected - ledgerCollected);
    return {
      totalExpected: ledgerExpected,
      totalCollected: Math.max(totalCollected, ledgerCollected),
      outstanding: ledgerOutstanding,
      transactionCount: paidTx.length,
      collectionRate: ledgerExpected > 0
        ? Math.round((Math.max(totalCollected, ledgerCollected) / ledgerExpected) * 100)
        : 0,
    };
  }

  const outstanding = Math.max(0, totalExpected - totalCollected);
  return {
    totalExpected,
    totalCollected,
    outstanding,
    transactionCount: paidTx.length,
    collectionRate: totalExpected > 0
      ? Math.round((totalCollected / totalExpected) * 100)
      : 0,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Audit Row Builders (live from `munyaka_transactions` + license store)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a single audit row from a fee transaction record.
 * Reads dynamically from real fields: payer_name, invoice_title, payment_for,
 * billing_period, mpesa_receipt_number, payment_method, status, etc.
 */
const buildFeeRow = (t: FeeTransaction): AuditRow => {
  // Payer / Invoice label — priority: payer_name → invoice_title → learner
  const payer = t.payerName || t.invoiceTitle || t.learnerName || t.studentName;
  const label = payer || 'Unknown Payer';

  // Subtext — show payment_for, billing_period, or category
  const subParts: string[] = [];
  if (t.paymentFor)        subParts.push(t.paymentFor);
  if (t.billingPeriod)     subParts.push(t.billingPeriod);
  if (t.category && !subParts.includes(t.category)) subParts.push(t.category);
  const subtext = subParts.length > 0 ? subParts.join(' · ') : (t.description || 'School Payment');

  // Method — prefer explicit payment_method
  const method = t.paymentMethod || t.method || 'cash';

  // Reference — prefer M-Pesa receipt number, then ref, then id
  const ref = t.mpesaReceiptNumber || t.receiptNumber || t.ref || t.id || '—';

  // Icon / color from dynamic type mapper
  const { presentation } = mapRowKind(t.type, t.category, method);

  return {
    key: `tx-${t.id || Math.random().toString(36).slice(2)}`,
    type: 'fee',
    label,
    subtext,
    method,
    ref,
    amount: Number(t.amount) || 0,
    date: t.paidAt || t.date || '',
    icon: presentation.icon,
    iconBg: presentation.iconBg,
    iconColor: presentation.iconColor,
    paymentFor: t.paymentFor,
    billingPeriod: t.billingPeriod,
    category: t.category,
    rawType: t.type,
  };
};

/**
 * Build an audit row for a subscription invoice.
 * Read from license history (live data).
 */
const buildInvoiceRow = (l: ReturnType<typeof getAllLicenses>[number]): AuditRow => {
  const { presentation } = mapRowKind('subscription', undefined, l.payment?.method);
  return {
    key: `inv-${l.id}`,
    type: 'invoice',
    label: 'Subscription Invoice',
    subtext: validityLabel(l.validityDays as 30 | 365 | 730),
    method: l.payment?.method || 'cash',
    ref: l.payment?.refNumber || '—',
    amount: Number(l.payment?.amount) || 0,
    date: l.issuedAt || '',
    icon: presentation.icon,
    iconBg: presentation.iconBg,
    iconColor: presentation.iconColor,
    paymentFor: 'Subscription',
    billingPeriod: validityLabel(l.validityDays as 30 | 365 | 730),
    category: 'Subscription',
    rawType: 'subscription',
  };
};

/**
 * Compute audit rows synchronously from live localStorage.
 * (Called by the async hook below; returned through state so the table
 *  can render skeletons while the work is in flight.)
 */
const computeAuditRowsSync = (): AuditRow[] => {
  // Recent paid transactions — fully dynamic field mapping
  const transactions: FeeTransaction[] = safeRead(STORAGE_KEYS.TRANSACTIONS, []);
  const paidTx = transactions
    .filter((t) => t.status === 'paid' || !!t.paidAt)
    .sort((a, b) => {
      const da = safeDate(a.paidAt ?? a.date)?.getTime() ?? 0;
      const db = safeDate(b.paidAt ?? b.date)?.getTime() ?? 0;
      return db - da;
    })
    .slice(0, 10)
    .map(buildFeeRow);

  // Subscription invoices from license history
  const allLicenses = getAllLicenses();
  const invoices = allLicenses
    .filter((l) => l.payment?.amount)
    .sort((a, b) => (b.issuedAt || '').localeCompare(a.issuedAt || ''))
    .slice(0, 6)
    .map(buildInvoiceRow);

  // Merge and sort by date descending
  return [...paidTx, ...invoices].sort((a, b) => {
    const da = safeDate(a.date)?.getTime() ?? 0;
    const db = safeDate(b.date)?.getTime() ?? 0;
    return db - da;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Revenue Trend (last 6 months)
// ─────────────────────────────────────────────────────────────────────────────

const computeRevenueTrend = () => {
  const transactions: FeeTransaction[] = safeRead(STORAGE_KEYS.TRANSACTIONS, []);
  const paid = transactions.filter((t) => t.status === 'paid' || !!t.paidAt);
  const now = new Date();

  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleDateString('en-KE', { month: 'short' });
    const total = paid.reduce((s, t) => {
      const td = safeDate(t.paidAt ?? t.date);
      if (!td) return s;
      return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth()
        ? s + (Number(t.amount) || 0)
        : s;
    }, 0);
    return { label, total, sortKey: d.getTime() };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// useOwnerDashboardData Hook
// Reactive, real-time data aggregation for the Owner Dashboard
// ─────────────────────────────────────────────────────────────────────────────

interface OwnerDashboardData {
  license: LicenseInfo;
  seats: SeatMetrics;
  financials: FinancialMetrics;
  auditRows: AuditRow[];
  revenueTrend: ReturnType<typeof computeRevenueTrend>;
  allLicensesCount: number;
  now: string;
  isLoading: boolean;
  isTransactionsLoading: boolean;
}

const useOwnerDashboardData = (): OwnerDashboardData => {
  const { totalStudents: centralStudents, totalTeachers: centralTeachers, isLoading: centralLoading } = useCentralData();

  // Use a counter to force re-renders when localStorage changes
  const [tick, setTick] = React.useState(0);
  const tickRef = useRef(tick);
  tickRef.current = tick;

  // Async loading state for the transactions table
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);

  // Force a re-render to pick up localStorage changes
  const triggerRefresh = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    // Cross-tab storage events
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      const watchedKeys = Object.values(STORAGE_KEYS);
      if (watchedKeys.includes(e.key as typeof watchedKeys[number])) {
        triggerRefresh();
      }
    };

    // Same-tab custom events
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key) {
        const watchedKeys = Object.values(STORAGE_KEYS);
        if (watchedKeys.includes(detail.key as typeof watchedKeys[number])) {
          triggerRefresh();
        }
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('munyaka:data-changed', onCustom as EventListener);

    // Polling every 10 seconds for the clock display and any missed updates
    const interval = setInterval(triggerRefresh, 10_000);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('munyaka:data-changed', onCustom as EventListener);
      clearInterval(interval);
    };
  }, [triggerRefresh]);

  // All data is derived from localStorage; adding `tick` as dependency
  // forces a re-computation whenever the underlying data changes.
  const license = useMemo(() => resolveLicenseInfo(), [tick]);

  const seats = useMemo(
    () => computeSeatMetrics(license, centralStudents, centralLoading, centralTeachers),
    [license, centralStudents, centralLoading, centralTeachers, tick],
  );

  const financials = useMemo(() => computeFinancialMetrics(), [tick]);

  const auditRows = useMemo(() => {
    // Simulate async fetch with a microtask so the skeleton state is visible
    // on first render and any state change that empties the list.
    setIsTransactionsLoading(true);
    const rows = computeAuditRowsSync();
    // Defer the loading-off state to next tick so the UI can show skeletons.
    if (typeof window !== 'undefined') {
      window.setTimeout(() => setIsTransactionsLoading(false), 200);
    } else {
      setIsTransactionsLoading(false);
    }
    return rows;
  }, [tick]);

  const revenueTrend = useMemo(() => computeRevenueTrend(), [tick]);

  const allLicensesCount = useMemo(() => getAllLicenses().length, [tick]);

  const now = useMemo(
    () => new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
    [tick],
  );

  return {
    license,
    seats,
    financials,
    auditRows,
    revenueTrend,
    allLicensesCount,
    now,
    isLoading: centralLoading,
    isTransactionsLoading,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Status Badge Config
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; bg: string; text: string; dot: string }> = {
  active:       { label: 'Active',        bg: 'bg-emerald-50',  text: 'text-emerald-700',  dot: 'bg-emerald-500' },
  due:          { label: 'Due',           bg: 'bg-amber-50',    text: 'text-amber-700',    dot: 'bg-amber-500' },
  grace_period: { label: 'Grace Period',  bg: 'bg-orange-50',   text: 'text-orange-700',   dot: 'bg-orange-500' },
  expired:      { label: 'Expired',       bg: 'bg-red-50',      text: 'text-red-700',      dot: 'bg-red-500' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton row for the audit table (loading state)
// ─────────────────────────────────────────────────────────────────────────────

const AuditRowSkeleton: React.FC = () => (
  <tr className="border-b border-slate-50">
    <td className="px-6 py-3.5">
      <div className="flex items-center gap-2.5">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>
    </td>
    <td className="px-6 py-3.5">
      <Skeleton className="h-4 w-40 mb-1.5" />
      <Skeleton className="h-3 w-24" />
    </td>
    <td className="px-6 py-3.5"><Skeleton className="h-4 w-16" /></td>
    <td className="px-6 py-3.5"><Skeleton className="h-4 w-24" /></td>
    <td className="px-6 py-3.5">
      <Skeleton className="h-4 w-20 mb-1.5" />
      <Skeleton className="h-3 w-12" />
    </td>
    <td className="px-6 py-3.5 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
  </tr>
);

// ─────────────────────────────────────────────────────────────────────────────
// Owner Dashboard Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Executive dashboard for the `owner` role.
 *
 * All metrics are dynamically computed from live localStorage data:
 *   - Subscription: `getActiveLicense()` + subscription settings
 *   - Seats: `useCentralData` hook + `getActiveLearners()` / `getActiveTeachers()`
 *   - Financials: `munyaka_transactions` + `munyaka_fee_structures`
 *   - Audit: Combined transactions + license invoices, mapped via `mapRowKind`
 *     so badges, icons, and colors reflect each row's actual type & method.
 *
 * Transactions use a real reactive hook with a proper loading skeleton and
 * empty state, and the "Latest Receipt" / "Export Report" buttons hook into
 * live download handlers that stream the actual receipt or full CSV report.
 */
const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    license,
    seats,
    financials,
    auditRows,
    revenueTrend,
    allLicensesCount,
    now,
    isLoading: centralLoading,
    isTransactionsLoading,
  } = useOwnerDashboardData();

  const handleOpenProfileSettings = () => navigate('/settings/profile');
  const handleUpgrade = () => { window.location.hash = '#/payment-management'; };

  const handleExportReport = useCallback(async () => {
    try {
      const feeRows = auditRows.filter((r) => r.type === 'fee');
      const invoiceRows = auditRows.filter((r) => r.type === 'invoice');

      const rows = [
        ['MUNYAKA PRIMARY AND JUNIOR'],
        ['P.O. BOX 5239, ELDORET'],
        ['MOTTO: Knowledge Is Power'],
        [''],
        ['Executive Financial Report'],
        [`Generated: ${new Date().toLocaleString('en-KE')}`],
        [''],
        ['SUBSCRIPTION DETAILS'],
        ['Plan', license.planName],
        ['Billing Cycle', license.billingInterval],
        ['Next Billing / Renewal Date', formatDateLong(license.nextBillingDate)],
        ['Days Remaining in Cycle', license.daysRemaining.toString()],
        ['Status', license.status.charAt(0).toUpperCase() + license.status.slice(1)],
        [''],
        ['SEAT UTILIZATION'],
        ['Metric', 'Used', 'Maximum', 'Utilization (%)'],
        ['Student Seats', seats.studentsUsed.toString(), license.maxStudentSeats.toString(), `${seats.studentsPercent}%`],
        ['Staff Seats', seats.staffUsed.toString(), license.maxStaffSeats.toString(), `${seats.staffPercent}%`],
        [''],
        ['FINANCIAL SUMMARY'],
        ['Metric', 'KES'],
        ['Total Expected Revenue', financials.totalExpected.toString()],
        ['Total Collected', financials.totalCollected.toString()],
        ['Outstanding Unpaid', financials.outstanding.toString()],
        ['Collection Rate (%)', financials.collectionRate.toString()],
        [''],
        ['RECENT TRANSACTIONS'],
        ['Date', 'Payer / Invoice', 'Payment For', 'Billing Period', 'Method', 'Reference', 'Type', 'Amount (KES)'],
        ...feeRows.map((t) => [
          formatDate(t.date),
          t.label,
          t.paymentFor || '',
          t.billingPeriod || '',
          titleCase(t.method),
          t.ref,
          t.rawType || 'fee',
          t.amount.toString(),
        ]),
        [''],
        ['SUBSCRIPTION INVOICES'],
        ['Issued', 'Validity', 'Method', 'Reference', 'Amount (KES)'],
        ...invoiceRows.map((i) => [
          formatDate(i.date),
          i.billingPeriod || '',
          titleCase(i.method),
          i.ref,
          i.amount.toString(),
        ]),
      ];
      const csv = rows
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      await downloadCSV(csv, `Munyaka_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      showSuccess('Financial report downloaded.');
    } catch (err) {
      console.error('[OwnerDashboard] export error:', err);
      showError('Could not export the report. Please try again.');
    }
  }, [license, seats, financials, auditRows]);

  /**
   * Build & download a receipt for the most recent paid transaction.
   * Uses the real `payer_name`, `invoice_title`, `payment_for`,
   * `billing_period`, `mpesa_receipt_number` and `payment_method` fields.
   */
  const handleDownloadLatestReceipt = useCallback(() => {
    const latest = auditRows.find((r) => r.type === 'fee');
    if (!latest) {
      showError('No recent transactions available to download.');
      return;
    }
    const body = [
      'MUNYAKA PRIMARY AND JUNIOR',
      'P.O. BOX 5239, ELDORET',
      'MOTTO: Knowledge Is Power',
      '',
      'PAYMENT RECEIPT',
      '',
      `Receipt No:    ${latest.ref}`,
      `Date:          ${formatDateLong(latest.date)}`,
      `Payer:         ${latest.label}`,
      `Payment For:   ${latest.paymentFor || latest.category || 'School Fees'}`,
      `Billing Period:${latest.billingPeriod ? ' ' + latest.billingPeriod : ''}`,
      `Method:        ${titleCase(latest.method)}`,
      `Category:      ${latest.category || '—'}`,
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
  }, [auditRows]);

  const sub = STATUS_CONFIG[license.status];
  const TierIcon = license.isEnterprise ? Crown : Sparkles;
  const tierGradient = license.isEnterprise
    ? 'from-indigo-600 via-violet-600 to-fuchsia-600'
    : 'from-blue-600 via-cyan-600 to-teal-500';

  const hasFeeRows = auditRows.some((r) => r.type === 'fee');

  return (
    <div className="space-y-8 pb-10">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 bg-indigo-50 text-indigo-700 gap-1.5"
            >
              <Shield size={10} />
              Owner Console
            </Badge>
            <Badge
              variant="outline"
              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 ${sub.bg} ${sub.text} gap-1.5`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${sub.dot} animate-pulse`} />
              {sub.label}
            </Badge>
            <span className="text-[10px] text-slate-400">
              Live · {now}
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Owner Dashboard
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Subscription, billing, and high-level financial health
            {user?.name ? ` for ${user.name}` : ''}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenProfileSettings}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Settings size={14} className="mr-1.5" />
            Profile Settings
          </Button>
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
            {license.status === 'active' ? 'Manage Plan' : 'Upgrade / Renew'}
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
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <h2 className="text-2xl md:text-3xl font-black text-white">
                    {license.planName}
                  </h2>
                  <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
                    {license.billingInterval} Billing
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <div className="flex items-center gap-1.5 text-white/90 text-xs">
                    <Calendar size={12} />
                    <span>
                      Next billing:{' '}
                      <strong className="font-bold text-white">
                        {formatDateLong(license.nextBillingDate)}
                      </strong>
                    </span>
                  </div>
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <div className="flex items-center gap-1.5 text-white/90 text-xs">
                    <Clock size={12} />
                    <span>
                      {license.status === 'expired'
                        ? 'Expired'
                        : license.status === 'grace_period'
                          ? 'In grace period'
                          : `${license.daysRemaining} day${license.daysRemaining === 1 ? '' : 's'} remaining`}
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
                      {centralLoading
                        ? 'Loading…'
                        : `${seats.studentsUsed.toLocaleString()} / ${seats.studentCap.toLocaleString()} used`}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-blue-600">
                  {seats.studentsPercent}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${seats.studentsPercent}%` }}
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
                      {seats.staffUsed} / {seats.staffCap} used
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-violet-600">
                  {seats.staffPercent}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-500"
                  style={{ width: `${seats.staffPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <Mail size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">billing@munyaka.sc.ke</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Phone size={12} className="text-slate-400 shrink-0" />
              <span>+254 712 345 678</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Receipt size={12} className="text-slate-400 shrink-0" />
              <span>{allLicensesCount} license{allLicensesCount === 1 ? '' : 's'} on file</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Executive Financial Summary ──────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Executive Financial Summary
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live revenue, outstanding balances, and subscription health.
            </p>
          </div>
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 bg-slate-100 text-slate-700 gap-1.5"
          >
            <DollarSign size={10} />
            KES · Kenyan Shilling
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Expected Revenue */}
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
                Per-grade fees × {seats.studentsUsed} active learners
              </p>
            </CardContent>
          </Card>

          {/* Total Collected */}
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

          {/* Outstanding Unpaid */}
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
                Expected − Collected
              </p>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card className={`border-none shadow-sm rounded-2xl bg-gradient-to-br ${
            license.status === 'active'
              ? 'from-emerald-50 to-teal-50'
              : license.status === 'due'
                ? 'from-amber-50 to-orange-50'
                : 'from-red-50 to-rose-50'
          }`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center">
                  <CreditCard
                    size={18}
                    className={
                      license.status === 'active' ? 'text-emerald-600'
                        : license.status === 'due' ? 'text-amber-600'
                          : 'text-red-600'
                    }
                  />
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
                {license.status === 'active' && license.daysRemaining > 0
                  ? `Renews ${formatDate(license.nextBillingDate)}`
                  : license.status === 'expired'
                    ? 'Renew now to restore access'
                    : 'Action recommended'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue trend chart */}
        <Card className="border-none shadow-sm rounded-2xl bg-white mt-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">
                Revenue Collected (Last 6 Months)
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly fee collection trend in KES — live from transaction records
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
                    {revenueTrend.map((entry, idx) => (
                      <Cell
                        key={entry.label}
                        fill={idx === revenueTrend.length - 1 ? '#10b981' : '#a7f3d0'}
                      />
                    ))}
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
              Recent Transactions &amp; Payment Audit
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
              disabled={!hasFeeRows || isTransactionsLoading}
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
          {isTransactionsLoading ? (
            // Loading skeleton
            <div
              className="w-full overflow-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#6366f1 #f1f5f9' }}
            >
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Payer / Invoice</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Method</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Reference</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <AuditRowSkeleton key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : auditRows.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-center px-6" data-testid="audit-empty-state">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Receipt size={20} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">
                No recent transactions found.
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                Once fee payments and subscription invoices are recorded, they
                will appear here for executive review.
              </p>
            </div>
          ) : (
            // Live data table
            <div
              className="w-full overflow-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#6366f1 #f1f5f9' }}
            >
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Payer / Invoice</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Method</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Reference</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {auditRows.map((row) => {
                    const Icon = row.icon;
                    const { presentation } = mapRowKind(row.rawType, row.category, row.method);
                    const amountColor = row.type === 'invoice' ? 'text-indigo-600' : 'text-emerald-600';
                    return (
                      <tr key={row.key} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-lg ${row.iconBg} flex items-center justify-center shrink-0`}>
                              <Icon size={15} className={row.iconColor} />
                            </div>
                            <Badge
                              variant="outline"
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border-0 ${presentation.badgeBg} ${presentation.badgeText}`}
                            >
                              {presentation.label}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-slate-800 truncate max-w-[220px]">
                            {row.label}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate max-w-[220px]">
                            {row.subtext}
                          </p>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-xs font-medium text-slate-600">
                            {titleCase(row.method)}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <code className="text-[11px] font-mono text-slate-500 bg-slate-50 rounded-md px-1.5 py-0.5 inline-flex items-center gap-1">
                            <Hash size={10} className="text-slate-400" />
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
                          <span className={`font-black ${amountColor}`}>
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
              disabled={!hasFeeRows || isTransactionsLoading}
              className="rounded-lg text-slate-600 hover:text-slate-900"
            >
              <Receipt size={13} className="mr-1" />
              Latest Receipt
            </Button>
          </div>
        </div>
      </Card>

    </div>
  );
};

export default OwnerDashboard;
