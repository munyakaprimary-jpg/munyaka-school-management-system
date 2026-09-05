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
  Receipt,
  CreditCard,
  Calendar,
  Clock,
  FileText,
  Download,
  Crown,
  Sparkles,
  Smartphone,
  Building2,
  ArrowUpRight,
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
  CircleDollarSign,
  Package,
  BadgeDollarSign,
  RefreshCcw,
  ShieldCheck,
  Wifi,
  WifiOff,
  Server,
  Monitor,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useCentralData, notifyDataChanged, getActiveLearners, getActiveTeachers } from '@/hooks/useCentralData';
import { useLanSync } from '@/hooks/useLanSync';
import {
  getActiveLicense,
  getAllLicenses,
  isLicenseExpiredAt,
  validityLabel,
} from '@/services/licenseService';
import { downloadCSV } from '@/utils/downloadHelper';
import { showSuccess, showError } from '@/utils/toast';
import { DeviceMonitoringDashboard } from '@/components/device-monitoring/DeviceMonitoringDashboard';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SubscriptionStatus = 'active' | 'due' | 'grace_period' | 'expired';

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

/**
 * Platform billing metrics — derived from `getAllLicenses()` (the system
 * `platform_billing` / `school_subscriptions` state). NO student fee data.
 */
interface PlatformBillingMetrics {
  /** Sum of all paid platform invoices (KES) */
  totalPaidToDate: number;
  /** Number of paid invoices contributing to `totalPaidToDate` */
  paidInvoiceCount: number;
  /** Sum of pending / failed invoices (KES) */
  outstandingPlatform: number;
  /** Next renewal date as ISO string */
  nextRenewalDate: string | null;
  /** Days remaining until next renewal */
  daysUntilRenewal: number;
  /** Number of add-on purchases (non-subscription licenses) */
  addonCount: number;
}

/**
 * A platform billing record — represents a single subscription invoice,
 * add-on charge, or license renewal sourced from the license store.
 */
interface BillingRow {
  key: string;
  /** SUBSCRIPTION | ADD-ON | LICENSE RENEWAL */
  typeLabel: string;
  /** e.g. "Pro Plan Monthly", "SMS Gateway Add-on" */
  serviceName: string;
  /** M-Pesa, Card, Bank Transfer, Cash */
  method: string;
  /** M-Pesa transaction code or invoice # */
  reference: string;
  /** Amount in KES */
  amount: number;
  /** Paid | Pending | Failed */
  status: 'paid' | 'pending' | 'failed';
  /** Date the record was issued / paid */
  date: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  /** Raw plan name for receipt generation */
  planName: string;
  /** Validity label e.g. "30 Days (Trial)" */
  validityLabel: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage Keys
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  SUBSCRIPTION_SETTINGS: 'munyaka_subscription_settings',
  LEARNERS:              'school_learners_data',
  STAFF:                 'munyaka_staff_directory',
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

const formatRelativeTime = (iso: string): string => {
  if (!iso) return '—';
  const d = safeDate(iso);
  if (!d) return '—';
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  return `${Math.floor(diffMonths / 12)} year${Math.floor(diffMonths / 12) === 1 ? '' : 's'} ago`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Platform Billing Kind → Presentation Mapping
// ─────────────────────────────────────────────────────────────────────────────

type BillingKind = 'subscription' | 'add_on' | 'renewal' | 'upgrade';

interface KindPresentation {
  typeLabel: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const mapBillingKind = (
  rawType: string | undefined,
  serviceName: string,
): { kind: BillingKind; presentation: KindPresentation } => {
  const t = (rawType || '').toLowerCase().trim();
  const s = serviceName.toLowerCase();

  if (s.includes('addon') || s.includes('add-on') || s.includes('module') || s.includes('extra')) {
    return {
      kind: 'add_on',
      presentation: {
        typeLabel: 'ADD-ON',
        icon: Package,
        iconBg: 'bg-violet-50',
        iconColor: 'text-violet-600',
      },
    };
  }
  if (t.includes('renew') || s.includes('renewal') || s.includes('renew')) {
    return {
      kind: 'renewal',
      presentation: {
        typeLabel: 'LICENSE RENEWAL',
        icon: RefreshCw,
        iconBg: 'bg-teal-50',
        iconColor: 'text-teal-600',
      },
    };
  }
  if (t.includes('upgrade') || s.includes('upgrade')) {
    return {
      kind: 'upgrade',
      presentation: {
        typeLabel: 'UPGRADE',
        icon: ArrowUpRight,
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-600',
      },
    };
  }
  return {
    kind: 'subscription',
    presentation: {
      typeLabel: 'SUBSCRIPTION',
      icon: Building2,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Status Presentation
// ─────────────────────────────────────────────────────────────────────────────

type PaymentStatus = 'paid' | 'pending' | 'failed';

interface StatusPresentation {
  label: string;
  bg: string;
  text: string;
  dot: string;
}

const STATUS_PRESENTATION: Record<PaymentStatus, StatusPresentation> = {
  paid: {
    label: 'Paid',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  pending: {
    label: 'Pending',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  failed: {
    label: 'Failed',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
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

  const settings = getSubscriptionSettings(license.issuedAt);
  const billingCycle: BillingCycle = settings.billingCycle;
  const cycleStartDate = settings.cycleStartDate;

  const isEnterprise = (license.validityDays ?? 0) >= 730;
  const maxStudentSeats = isEnterprise ? 2000 : 500;
  const maxStaffSeats = isEnterprise ? 200 : 50;

  const billingDays = BILLING_CYCLE_DAYS[billingCycle] ?? 30;
  const cycleStart = safeDate(cycleStartDate) ?? new Date();
  const nextBillingDate = addDays(cycleStart, billingDays).toISOString().slice(0, 10);
  const today = new Date();

  const daysRemaining = Math.max(0, differenceInDays(addDays(cycleStart, billingDays), today));

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
// Platform Billing Metrics
// Derived from `getAllLicenses()` — NO student fee data.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute aggregated platform billing metrics from license history.
 * Reads: planName, payment.amount, paidAt, issuedAt, validityDays, type.
 */
const computePlatformBillingMetrics = (): PlatformBillingMetrics => {
  const now = new Date();
  let totalPaidToDate = 0;
  let paidInvoiceCount = 0;
  let outstandingPlatform = 0;
  let addonCount = 0;
  let earliestPendingRenewal: Date | null = null;
  let nextRenewalDate: string | null = null;
  let daysUntilRenewal = 0;

  try {
    const allLicenses = getAllLicenses();

    allLicenses.forEach((l) => {
      const amount = Number(l.payment?.amount) || 0;
      const isAddon = (l.type || '').toLowerCase().includes('addon') ||
        (l.type || '').toLowerCase().includes('module') ||
        (l.planName || '').toLowerCase().includes('addon');

      if (isAddon) {
        addonCount += 1;
      }

      if (amount > 0) {
        totalPaidToDate += amount;
        paidInvoiceCount += 1;
      } else {
        // Unpaid / pending — add to outstanding
        outstandingPlatform += Math.max(0, Number(l.payment?.amount) || 0);
      }

      // Determine next renewal: pick the soonest future paid license expiry
      const expiresAt = safeDate(l.expiresAt);
      if (expiresAt && expiresAt > now && amount > 0) {
        if (!earliestPendingRenewal || expiresAt < earliestPendingRenewal) {
          earliestPendingRenewal = expiresAt;
        }
      }
    });

    if (earliestPendingRenewal) {
      nextRenewalDate = earliestPendingRenewal.toISOString();
      daysUntilRenewal = Math.max(0, differenceInDays(earliestPendingRenewal, now));
    }
  } catch {
    // Graceful fallback
  }

  return {
    totalPaidToDate,
    paidInvoiceCount,
    outstandingPlatform,
    nextRenewalDate,
    daysUntilRenewal,
    addonCount,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Platform Billing Row Builder
// Reads ONLY from license history — no student fee queries.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive a payment status from the license payment data.
 * A record is "paid" when `payment.amount` is present.
 */
const derivePaymentStatus = (
  paymentAmount: number | undefined,
  expiresAt: string | undefined,
): PaymentStatus => {
  if (!paymentAmount || paymentAmount <= 0) {
    // No payment recorded — check expiry to infer pending vs failed
    if (expiresAt && isLicenseExpiredAt(expiresAt)) {
      return 'failed';
    }
    return 'pending';
  }
  return 'paid';
};

/**
 * Build a BillingRow from a single license record.
 * Maps to: type badge, service name, method, reference, amount, status, date.
 */
const buildBillingRow = (
  license: ReturnType<typeof getAllLicenses>[number],
): BillingRow => {
  const { presentation } = mapBillingKind(license.type, license.planName || 'Pro Plan');
  const amount = Number(license.payment?.amount) || 0;
  const status = derivePaymentStatus(amount, license.expiresAt);
  const method = license.payment?.method || 'cash';

  // Build a descriptive service name
  const plan = license.planName || 'Pro Plan';
  const validity = validityLabel(license.validityDays as 30 | 365 | 730);
  const serviceName = amount > 0
    ? `${plan} ${validity}`
    : `${plan} (Unpaid)`;

  return {
    key: `billing-${license.id}`,
    typeLabel: presentation.typeLabel,
    serviceName,
    method,
    reference: license.payment?.refNumber || license.id || '—',
    amount,
    status,
    date: license.issuedAt || '',
    icon: presentation.icon,
    iconBg: presentation.iconBg,
    iconColor: presentation.iconColor,
    planName: plan,
    validityLabel: validity,
  };
};

/**
 * Compute platform billing rows from license history only.
 * Excludes all student fee / tuition / learner payment records.
 */
const computeBillingRowsSync = (): BillingRow[] => {
  const allLicenses = getAllLicenses();

  return allLicenses
    .filter((l) => l.payment != null)
    .sort((a, b) => (b.issuedAt || '').localeCompare(a.issuedAt || ''))
    .map(buildBillingRow);
};

// ─────────────────────────────────────────────────────────────────────────────
// Platform Billing Trend (last 6 months) — from platform subscription invoices
// Queries getAllLicenses() for paid subscription / add-on / renewal amounts,
// grouped by the month each license was issued (paidAt / issuedAt).
// Student fee transactions are NOT included here — that data belongs to the
// Administrator / Bursar role.
// ─────────────────────────────────────────────────────────────────────────────

interface BillingTrendEntry {
  /** Short month label, e.g. "Aug" */
  label: string;
  /** Total platform billing amount for this month in KES */
  amount: number;
  /** Whether this month has an active paid invoice */
  hasInvoice: boolean;
}

/**
 * Compute the monthly platform billing totals over the last 6 months.
 * Each license with a `payment.amount > 0` contributes its amount to the
 * month it was issued (paidAt / issuedAt). Months with no invoices show 0.
 */
const computeBillingTrend = (): BillingTrendEntry[] => {
  const now = new Date();

  // Build a map of month-key → amount for all paid licenses
  const monthAmounts = new Map<string, number>();

  try {
    const allLicenses = getAllLicenses();
    allLicenses.forEach((l) => {
      const amount = Number(l.payment?.amount) || 0;
      if (amount <= 0) return;

      // Use paidAt if available, otherwise fall back to issuedAt
      const dateStr = l.paidAt || l.issuedAt || '';
      const d = safeDate(dateStr);
      if (!d) return;

      // Only include dates within the 6-month window
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      if (d < sixMonthsAgo) return;

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthAmounts.set(key, (monthAmounts.get(key) ?? 0) + amount);
    });
  } catch {
    // Graceful fallback — show empty months
  }

  // Generate all 6 months (oldest → newest)
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleDateString('en-KE', { month: 'short' });
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const amount = monthAmounts.get(key) ?? 0;
    return {
      label,
      amount,
      hasInvoice: amount > 0,
    };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// useOwnerDashboardData Hook
// ─────────────────────────────────────────────────────────────────────────────

interface OwnerDashboardData {
  license: LicenseInfo;
  seats: SeatMetrics;
  platformBilling: PlatformBillingMetrics;
  billingRows: BillingRow[];
  billingTrend: BillingTrendEntry[];
  allLicensesCount: number;
  now: string;
  isLoading: boolean;
  isBillingLoading: boolean;
}

const useOwnerDashboardData = (): OwnerDashboardData => {
  const { totalStudents: centralStudents, totalTeachers: centralTeachers, isLoading: centralLoading } = useCentralData();

  const [tick, setTick] = React.useState(0);
  const tickRef = useRef(tick);
  tickRef.current = tick;

  const [isBillingLoading, setIsBillingLoading] = useState(true);

  const triggerRefresh = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      const watchedKeys = Object.values(STORAGE_KEYS);
      if (watchedKeys.includes(e.key as typeof watchedKeys[number])) {
        triggerRefresh();
      }
    };
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
    const interval = setInterval(triggerRefresh, 10_000);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('munyaka:data-changed', onCustom as EventListener);
      clearInterval(interval);
    };
  }, [triggerRefresh]);

  const license = useMemo(() => resolveLicenseInfo(), [tick]);

  const seats = useMemo(
    () => computeSeatMetrics(license, centralStudents, centralLoading, centralTeachers),
    [license, centralStudents, centralLoading, centralTeachers, tick],
  );

  const platformBilling = useMemo(() => computePlatformBillingMetrics(), [tick]);

  const billingRows = useMemo(() => {
    setIsBillingLoading(true);
    const rows = computeBillingRowsSync();
    if (typeof window !== 'undefined') {
      window.setTimeout(() => setIsBillingLoading(false), 200);
    } else {
      setIsBillingLoading(false);
    }
    return rows;
  }, [tick]);

  const billingTrend = useMemo(() => computeBillingTrend(), [tick]);

  const allLicensesCount = useMemo(() => getAllLicenses().length, [tick]);

  const now = useMemo(
    () => new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
    [tick],
  );

  return {
    license,
    seats,
    platformBilling,
    billingRows,
    billingTrend,
    allLicensesCount,
    now,
    isLoading: centralLoading,
    isBillingLoading,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Subscription Status Badge Config
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; bg: string; text: string; dot: string }> = {
  active:       { label: 'Active',        bg: 'bg-emerald-50',  text: 'text-emerald-700',  dot: 'bg-emerald-500' },
  due:          { label: 'Due',           bg: 'bg-amber-50',    text: 'text-amber-700',    dot: 'bg-amber-500' },
  grace_period: { label: 'Grace Period',  bg: 'bg-orange-50',   text: 'text-orange-700',   dot: 'bg-orange-500' },
  expired:      { label: 'Expired',       bg: 'bg-red-50',      text: 'text-red-700',      dot: 'bg-red-500' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton row for the billing table
// ─────────────────────────────────────────────────────────────────────────────

const BillingRowSkeleton: React.FC = () => (
  <tr className="border-b border-slate-50">
    <td className="px-6 py-3.5">
      <div className="flex items-center gap-2.5">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <Skeleton className="h-4 w-28 rounded-full" />
      </div>
    </td>
    <td className="px-6 py-3.5">
      <Skeleton className="h-4 w-48 mb-1.5" />
      <Skeleton className="h-3 w-24" />
    </td>
    <td className="px-6 py-3.5"><Skeleton className="h-4 w-20" /></td>
    <td className="px-6 py-3.5"><Skeleton className="h-4 w-28" /></td>
    <td className="px-6 py-3.5 text-right"><Skeleton className="h-5 w-24 ml-auto" /></td>
    <td className="px-6 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
  </tr>
);

// ─────────────────────────────────────────────────────────────────────────────
// Owner Dashboard Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Executive dashboard for the `owner` role.
 *
 * Data sources:
 *   - Subscription: `getActiveLicense()` + subscription settings
 *   - Seats: `useCentralData` + `getActiveLearners()` / `getActiveTeachers()`
 *   - Platform Billing metrics: `getAllLicenses()` — paid platform invoices,
 *     add-on counts, next renewal. NO student fee data.
 *   - Billing Trend chart: `getAllLicenses()` — platform subscription / add-on
 *     invoices, grouped by month. Shows SaaS expenses only — NO student fees.
 *   - Billing Table: `getAllLicenses()` — platform subscription invoices ONLY.
 *     Student fee collections (tuitions, learner payments) are NOT shown here;
 *     they belong to the Administrator / Bursar role.
 *
 * The "System Billing & Subscription Audit" table shows only platform-level
 * charges: subscription renewals, add-ons, and license upgrades.
 */
const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { connectionStatus, isConnected } = useLanSync();

  const {
    license,
    seats,
    platformBilling,
    billingRows,
    billingTrend,
    allLicensesCount,
    now,
    isLoading: centralLoading,
    isBillingLoading,
  } = useOwnerDashboardData();

  const handleOpenProfileSettings = () => navigate('/settings/profile');
  const handleUpgrade = () => { window.location.hash = '#/payment-management'; };
  const handleOpenLanConfig = () => navigate('/lan-config');

  // ── Export Billing Report ────────────────────────────────────────────────
  const handleExportBillingReport = useCallback(async () => {
    try {
      const rows = [
        ['MUNYAKA PRIMARY AND JUNIOR'],
        ['P.O. BOX 5239, ELDORET'],
        ['MOTTO: Knowledge Is Power'],
        [''],
        ['System Billing & Subscription Audit Report'],
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
        ['PLATFORM BILLING HISTORY'],
        ['Date', 'Type', 'Service / Plan', 'Method', 'Reference', 'Amount (KES)', 'Status'],
        ...billingRows.map((row) => [
          formatDate(row.date),
          row.typeLabel,
          row.serviceName,
          titleCase(row.method),
          row.reference,
          row.amount.toString(),
          row.status.charAt(0).toUpperCase() + row.status.slice(1),
        ]),
      ];
      const csv = rows
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      await downloadCSV(csv, `Munyaka_Billing_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      showSuccess('Billing report exported.');
    } catch (err) {
      console.error('[OwnerDashboard] export billing error:', err);
      showError('Could not export the billing report. Please try again.');
    }
  }, [license, seats, billingRows]);

  // ── Download Invoice ─────────────────────────────────────────────────────
  const handleDownloadLatestInvoice = useCallback(() => {
    const latest = billingRows.find((r) => r.status === 'paid') ?? billingRows[0];
    if (!latest) {
      showError('No platform billing records found to download.');
      return;
    }
    const statusLabel = STATUS_PRESENTATION[latest.status].label;
    const body = [
      'MUNYAKA PRIMARY AND JUNIOR',
      'P.O. BOX 5239, ELDORET',
      'MOTTO: Knowledge Is Power',
      '',
      'PLATFORM INVOICE',
      '',
      `Invoice No:    ${latest.reference}`,
      `Date Issued:   ${formatDateLong(latest.date)}`,
      `Service:       ${latest.serviceName}`,
      `Type:          ${latest.typeLabel}`,
      `Payment Method:${titleCase(latest.method)}`,
      `Plan:          ${latest.planName}`,
      `Validity:      ${latest.validityLabel}`,
      '',
      `Amount:        ${formatKES(latest.amount)}`,
      `Status:        ${statusLabel}`,
      '',
      'This invoice covers platform subscription services.',
      '',
    ].join('\n');
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${latest.reference}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showSuccess('Invoice downloaded.');
  }, [billingRows]);

  const sub = STATUS_CONFIG[license.status];
  const TierIcon = license.isEnterprise ? Crown : Sparkles;
  const tierGradient = license.isEnterprise
    ? 'from-indigo-600 via-violet-600 to-fuchsia-600'
    : 'from-blue-600 via-cyan-600 to-teal-500';

  const hasBillingRows = billingRows.length > 0;
  const hasPaidRow = billingRows.some((r) => r.status === 'paid');

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
                    onClick={handleOpenLanConfig}
                    className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    {isConnected ? (
                      <Wifi size={14} className="mr-1.5 text-emerald-600" />
                    ) : (
                      <WifiOff size={14} className="mr-1.5 text-slate-400" />
                    )}
                    LAN Server Config
                  </Button>
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
                    onClick={handleExportBillingReport}
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

      {/* ── 2. Platform Billing & License Overview ───────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Platform Billing &amp; License Overview
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active subscription tier, system billing status, and upcoming renewals.
            </p>
          </div>
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 bg-indigo-50 text-indigo-700 gap-1.5"
          >
            <BadgeDollarSign size={10} />
            KES · Kenyan Shilling
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Card 1: Active Subscription Plan */}
          <Card className="border-none shadow-sm rounded-2xl bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Sparkles size={18} className="text-indigo-600" />
                </div>
                <ArrowUpRight size={14} className="text-indigo-500" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Subscription Plan
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1 truncate">
                {license.planName.toUpperCase()}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {license.billingInterval} Billing
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Total Platform Billing Paid */}
          <Card className="border-none shadow-sm rounded-2xl bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <BadgeDollarSign size={18} className="text-emerald-600" />
                </div>
                <ArrowUpRight size={14} className="text-emerald-500" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Platform Billing Paid
              </p>
              <p className="text-2xl font-black text-emerald-600 mt-1 truncate">
                {platformBilling.totalPaidToDate > 0
                  ? formatKES(platformBilling.totalPaidToDate)
                  : '—'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full px-1.5 py-0.5">
                  {platformBilling.paidInvoiceCount}
                </span>
                <p className="text-[10px] text-slate-400">
                  {platformBilling.paidInvoiceCount === 1 ? 'invoice paid' : 'invoices paid'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Next Renewal */}
          <Card className="border-none shadow-sm rounded-2xl bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <RefreshCcw size={18} className="text-amber-600" />
                </div>
                <ArrowUpRight size={14} className="text-amber-500" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Next Renewal
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1 truncate">
                {platformBilling.daysUntilRenewal > 0
                  ? `${platformBilling.daysUntilRenewal} day${platformBilling.daysUntilRenewal === 1 ? '' : 's'}`
                  : '—'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {platformBilling.nextRenewalDate
                  ? `Renews ${formatDate(platformBilling.nextRenewalDate)}`
                  : 'No upcoming renewals'}
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Account Standing */}
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
                  <ShieldCheck
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
                Account Standing
              </p>
              <p className={`text-2xl font-black mt-1 ${sub.text}`}>
                {sub.label}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {license.status === 'active' && license.daysRemaining > 0
                  ? `${license.daysRemaining} days remaining`
                  : license.status === 'expired'
                    ? 'Renew now to restore access'
                    : 'Action recommended'}
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Platform billing trend chart */}
        <Card className="border-none shadow-sm rounded-2xl bg-white mt-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">
                Platform Billing &amp; Subscription Expenses (Last 6 Months)
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly SaaS payments, module add-ons, and system maintenance fees in KES
              </p>
            </div>
            <TrendingUp size={18} className="text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={billingTrend} barCategoryGap="35%">
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
                        const formattedAmount = formatKES(d.amount);
                        return (
                          <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              {d.label}
                            </p>
                            <p className="text-lg font-black text-indigo-600 mt-0.5">
                              {d.amount > 0
                                ? `${formattedAmount} paid`
                                : 'No invoices'}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                                      {billingTrend.map((entry, idx) => (
                                        <Cell
                                          key={entry.label}
                                          fill={entry.amount > 0
                                            ? (idx === billingTrend.length - 1 ? '#6366f1' : '#a5b4fc')
                                            : '#f1f5f9'}
                                        />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                  
                        {/* ── 2b. LAN Server Config (Owner-only) ─────────────────────────────
                            Dedicated owner-only surface for managing the platform LAN server.
                            Distinct from the Admin Control Center (admin-only operational route).
                            Clicking the card navigates to /lan-config, which is also restricted
                            to the owner role at the route guard level. */}
                          <Card
                            className="border-none shadow-sm rounded-2xl bg-white overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                            onClick={handleOpenLanConfig}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOpenLanConfig();
                              }
                            }}
                          >
                            <div className="relative bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-6 md:p-8">
                              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -ml-8 -mb-8 pointer-events-none" />
                              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-4">
                                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 ring-1 ring-white/30">
                                    {isConnected ? (
                                      <Wifi size={26} className="text-white" />
                                    ) : (
                                      <WifiOff size={26} className="text-white" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/80">
                                      Owner Portal · Network
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      <h2 className="text-2xl md:text-3xl font-black text-white">
                                        LAN Server Config
                                      </h2>
                                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${
                                            isConnected ? 'bg-emerald-300 animate-pulse' : 'bg-amber-300'
                                          }`}
                                        />
                                        {isConnected ? 'Connected' : 'Offline'}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 mt-3">
                                      <div className="flex items-center gap-1.5 text-white/90 text-xs">
                                        <Server size={12} />
                                        <span className="font-mono truncate max-w-[180px]">
                                          {(connectionStatus.serverUrl || '').replace(/^https?:\/\//, '').replace(/\/+$/, '') || 'Not configured'}
                                        </span>
                                      </div>
                                      {connectionStatus.latency !== null && connectionStatus.latency !== undefined && (
                                        <>
                                          <span className="w-1 h-1 rounded-full bg-white/40" />
                                          <div className="flex items-center gap-1.5 text-white/90 text-xs">
                                            <Clock size={12} />
                                            <span>{connectionStatus.latency} ms latency</span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                    <p className="text-xs text-white/80 mt-3 max-w-md leading-relaxed">
                                      Configure the LAN synchronization endpoint, monitor device connections,
                                      and manage offline sync behavior. Restricted to the owner role.
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenLanConfig();
                                  }}
                                  className="rounded-xl bg-white text-slate-900 hover:bg-white/90 font-bold shadow-lg"
                                  size="lg"
                                >
                                  <Wifi size={14} className="mr-1.5" />
                                  Open LAN Config
                                  <ExternalLink size={12} className="ml-1.5 opacity-60" />
                                </Button>
                              </div>
                            </div>
                  
                            <CardContent className="p-6 md:p-8">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                    <Server size={16} className="text-blue-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                      Endpoint
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 truncate">
                                      {connectionStatus.serverUrl ? 'Configured' : 'Not Set'}
                                    </p>
                                  </div>
                                </div>
                  
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                    isConnected ? 'bg-emerald-100' : 'bg-amber-100'
                                  }`}>
                                    {isConnected ? (
                                      <Wifi size={16} className="text-emerald-600" />
                                    ) : (
                                      <WifiOff size={16} className="text-amber-600" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                      Status
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 truncate">
                                      {isConnected ? 'Online' : 'Offline Mode'}
                                    </p>
                                  </div>
                                </div>
                  
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                  <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                                    <ShieldCheck size={16} className="text-indigo-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                      Access Scope
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 truncate">Owner Only</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                    
                          {/* ── 3. Teacher Device Monitoring & Control ─────────────────────────── */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h2 className="text-lg font-black text-slate-900">
                                  Teacher Device Monitoring
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Live telemetry, session status, and app lock controls for teacher mobile devices
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0 bg-indigo-50 text-indigo-700 gap-1.5"
                              >
                                <Monitor size={10} />
                                Device Control
                              </Badge>
                            </div>
                    
                            <DeviceMonitoringDashboard />
                          </div>
                    
                          {/* ── 4. System Billing & Subscription Audit ───────────────────────── */}
      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4">
          <div>
            <CardTitle className="text-base font-bold text-slate-800">
              System Billing &amp; Subscription Audit
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Platform subscription invoices, module add-ons, and system renewal receipts
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadLatestInvoice}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
              disabled={!hasBillingRows || isBillingLoading}
            >
              <Download size={14} className="mr-1.5" />
              Download Invoice
            </Button>
            <Button
              size="sm"
              onClick={handleExportBillingReport}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              disabled={!hasBillingRows || isBillingLoading}
            >
              <FileText size={14} className="mr-1.5" />
              Export Billing Report
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isBillingLoading ? (
            // Loading skeleton
            <div
              className="w-full overflow-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#6366f1 #f1f5f9' }}
            >
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Invoice / Service</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Method</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Reference / Receipt</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount (KES)</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <BillingRowSkeleton key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : billingRows.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-center px-6" data-testid="billing-empty-state">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Receipt size={20} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">
                No platform billing history found.
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                Subscription invoices, add-ons, and license renewals will appear here
                once the platform billing system records them.
              </p>
            </div>
          ) : (
            // Live billing data table
            <div
              className="w-full overflow-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#6366f1 #f1f5f9' }}
            >
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Invoice / Service</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Method</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Reference / Receipt</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount (KES)</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {billingRows.map((row) => {
                    const Icon = row.icon;
                    const status = STATUS_PRESENTATION[row.status];
                    return (
                      <tr key={row.key} className="hover:bg-slate-50/60 transition-colors">
                        {/* TYPE */}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-lg ${row.iconBg} flex items-center justify-center shrink-0`}>
                              <Icon size={15} className={row.iconColor} />
                            </div>
                            <Badge
                              variant="outline"
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border-0 ${row.iconBg} ${row.iconColor}`}
                            >
                              {row.typeLabel}
                            </Badge>
                          </div>
                        </td>

                        {/* INVOICE / SERVICE */}
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-slate-800 truncate max-w-[200px]">
                            {row.serviceName}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                            {row.planName} · {row.validityLabel}
                          </p>
                        </td>

                        {/* METHOD */}
                        <td className="px-6 py-3.5">
                          <span className="text-xs font-medium text-slate-600">
                            {titleCase(row.method)}
                          </span>
                        </td>

                        {/* REFERENCE / RECEIPT */}
                        <td className="px-6 py-3.5">
                          <code className="text-[11px] font-mono text-slate-500 bg-slate-50 rounded-md px-1.5 py-0.5 inline-flex items-center gap-1">
                            <Hash size={10} className="text-slate-400" />
                            {row.reference}
                          </code>
                        </td>

                        {/* AMOUNT */}
                        <td className="px-6 py-3.5 text-right">
                          <span className="font-black text-indigo-600">
                            {row.amount > 0 ? formatKES(row.amount) : '—'}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="px-6 py-3.5">
                          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 ${status.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${row.status === 'pending' ? 'animate-pulse' : ''}`} />
                            <span className={`text-[11px] font-bold ${status.text}`}>
                              {status.label}
                            </span>
                          </div>
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
            Showing {billingRows.length} billing record{billingRows.length === 1 ? '' : 's'}.
            Student fee collections are managed in the Fees &amp; Payments console.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportBillingReport}
              disabled={!hasBillingRows || isBillingLoading}
              className="rounded-lg text-slate-600 hover:text-slate-900"
            >
              <FileText size={13} className="mr-1" />
              CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadLatestInvoice}
              disabled={!hasBillingRows || isBillingLoading}
              className="rounded-lg text-slate-600 hover:text-slate-900"
            >
              <Receipt size={13} className="mr-1" />
              Invoice
            </Button>
          </div>
        </div>
      </Card>

    </div>
  );
};

export default OwnerDashboard;
