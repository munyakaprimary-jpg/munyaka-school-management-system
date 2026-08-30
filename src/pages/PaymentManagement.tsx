"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BackButton from '@/components/ui/BackButton';
import Modal from '@/components/ui/Modal';
import {
  CreditCard,
  ShieldCheck,
  Loader2,
  Save,
  Key,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  DollarSign,
  Building2,
  Globe,
  Lock,
  Eye,
  EyeOff,
  History,
  Plus,
  Trash2,
  Edit3,
  AlertCircle,
  Ban,
  ArrowUpCircle,
  CalendarClock,
  CreditCardIcon,
  Smartphone,
  Landmark,
  Hash,
  Link,
  RefreshCcw,
  Check,
  ChevronDown,
  Copy,
  Sparkles,
  TrendingUp,
  Calendar,
  Users,
  Zap,
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Navigate } from 'react-router-dom';
import RecordLicensePaymentModal from '@/components/RecordLicensePaymentModal';
import {
  getAllLicenses,
  revokeLicense,
  validityLabel as licenseValidityLabel,
  generateActivationKey,
  issueLicense,
} from '@/services/licenseService';
import { License, LICENSE_METHOD_LABELS } from '@/types/license';

// ─────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────
const STORAGE_KEY = 'munyaka_payment_config';

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────
interface PaymentGateway {
  id: string;
  name: string;
  provider: 'mpesa' | 'paypal' | 'stripe' | 'card' | 'bank';
  enabled: boolean;
  // M-Pesa fields
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortcode: string;         // Paybill / Till number
  // PayPal fields
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
  // Stripe fields
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  // General
  webhookUrl: string;
  status: 'active' | 'suspended' | 'pending' | 'error';
  lastSync: string;
}

interface Subscription {
  id: string;
  name: string;
  provider: string;
  plan: string;
  tier: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  nextBilling: string;
  amount: string;
  currency: string;
  interval: 'monthly' | 'annual' | 'biennial';
  autoRenew: boolean;
  billingCycleAnchor: number; // day of month 1–28
  seats: number; // institutional license seats
  features: string[];
}

interface SoftwarePayment {
  id: string;
  description: string;
  amount: string;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paidAt: string;
  invoiceId: string;
  paymentMethod: string;
}

/** A simple, offline payment log entry — no API integration required. */
interface LocalPaymentEntry {
  id: string;
  mode: 'mpesa' | 'cash' | 'bank';
  amount: string;
  currency: string;
  reference: string;
  note?: string;
  loggedAt: string;
}

/** A recorded monthly payment and its generated activation code. */
interface MonthlyPayment {
  id: string;
  subscriptionId: string;
  subscriptionName: string;
  paymentMode: 'mpesa' | 'cash' | 'bank';
  amount: string;
  currency: string;
  transactionRef: string;
  paidAt: string;       // ISO date string
  activationCode: string;
  codeStatus: 'active' | 'redeemed' | 'expired';
  issuedTo: string;
  deviceId: string;
  expiresAt: string;
}

// ─────────────────────────────────────────
// DEFAULT DATA
// ─────────────────────────────────────────
/** IDs of external / third-party services that should never appear in the
 *  Subscriptions list. Only the core institutional School License remains. */
const EXTERNAL_SUBSCRIPTION_IDS = new Set(['sub-002', 'sub-003']);

const DEFAULT_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-001',
    name: 'Munyaka School License',
    provider: 'Munyaka',
    plan: 'Enterprise Plan',
    tier: 'enterprise',
    status: 'active',
    nextBilling: '2026-05-01',
    amount: '299.00',
    currency: 'USD',
    interval: 'monthly',
    autoRenew: true,
    billingCycleAnchor: 1,
    seats: 500,
    features: ['Unlimited Students', 'Advanced Analytics', 'Priority Support', 'Offline Activation Codes'],
  },
];

const DEFAULT_GATEWAYS: PaymentGateway[] = [
  {
    id: 'gw-001',
    name: 'M-Pesa Integration',
    provider: 'mpesa',
    enabled: true,
    consumerKey: '',
    consumerSecret: '',
    passkey: '',
    shortcode: '',
    clientId: '',
    clientSecret: '',
    environment: 'live',
    stripePublishableKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    webhookUrl: '',
    status: 'active',
    lastSync: '2026-03-31 08:00:00',
  },
  {
    id: 'gw-002',
    name: 'Bank Deposit',
    provider: 'bank',
    enabled: true,
    consumerKey: '',
    consumerSecret: '',
    passkey: '',
    shortcode: '',
    clientId: '',
    clientSecret: '',
    environment: 'live',
    stripePublishableKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    webhookUrl: '',
    status: 'active',
    lastSync: '2026-03-31 08:00:00',
  },
];

const DEFAULT_PAYMENTS: SoftwarePayment[] = [
  {
    id: 'pmt-001',
    description: 'Munyaka School License - March 2026',
    amount: '299.00',
    currency: 'USD',
    status: 'paid',
    paidAt: '2026-03-01',
    invoiceId: 'INV-2026-003',
    paymentMethod: 'M-Pesa',
  },
  {
    id: 'pmt-003',
    description: 'Munyaka School License - April 2026',
    amount: '299.00',
    currency: 'USD',
    status: 'pending',
    paidAt: '',
    invoiceId: 'INV-2026-005',
    paymentMethod: 'M-Pesa',
  },
];

// ─────────────────────────────────────────
// SHARED SYNC EVENTS
// ─────────────────────────────────────────
/** Fired (via window.dispatchEvent) after any payment is recorded.
 *  Listeners re-read their data from localStorage so the UI stays in sync
 *  across tabs, components, and page refreshes. */
export const SUBSCRIPTION_UPDATED_EVENT = 'subscription-updated';

export const PAYMENT_LOGGED_EVENT = 'payment-logged';

/** Hook: dispatches a shared event and re-reads state from localStorage
 *  whenever the named event fires on window (cross-tab / cross-component sync). */
function useSyncEvent(eventName: string, callback: () => void) {
  useEffect(() => {
    const handler = () => callback();
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [eventName, callback]);
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function mask(value: string): string {
  if (!value || value.length < 6) return '••••••••••••';
  return value.slice(0, 4) + '••••••••' + value.slice(-4);
}

function getStatusBadge(status: string) {
  const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    active:   { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Active', icon: <CheckCircle2 size={10} /> },
    cancelled:{ bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'Cancelled', icon: <XCircle size={10} /> },
    failed:   { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'Failed', icon: <XCircle size={10} /> },
    pending:  { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Pending', icon: <AlertCircle size={10} /> },
    trial:    { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'Trial', icon: <CheckCircle2 size={10} /> },
    expired:  { bg: 'bg-slate-100 text-slate-600 border-slate-200', text: 'Expired', icon: <Ban size={10} /> },
    error:    { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'Error', icon: <AlertTriangle size={10} /> },
    suspended:{ bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Suspended', icon: <AlertCircle size={10} /> },
  };
  const s = styles[status] || styles.pending;
  return (
    <Badge className={cn("border font-bold text-[10px] gap-1", s.bg)}>
      {s.icon} {s.text}
    </Badge>
  );
}

// Compute days remaining until the subscription's next billing date.
function daysUntilNextBilling(nextBilling: string): number {
  if (!nextBilling) return 0;
  const today = new Date();
  const target = new Date(nextBilling);
  const diff = target.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────
const PaymentManagement = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'owner') {
    return <Navigate to="/" replace />;
  }

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('subscriptions');

  // ── State ──────────────────────────────
  const [gateways, setGateways] = useState<PaymentGateway[]>(DEFAULT_GATEWAYS);

  // Local payment log (simple manual entries — no API keys needed)
  const [localPayments, setLocalPayments] = useState<LocalPaymentEntry[]>([]);
  const [lpForm, setLpForm] = useState(() => {
    try {
      const raw = localStorage.getItem('lp_form_snapshot');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          mode: (parsed.mode ?? 'mpesa') as 'mpesa' | 'cash' | 'bank',
          amount: parsed.amount ?? '',
          currency: parsed.currency ?? 'KES',
          reference: '',
          note: parsed.note ?? '',
        };
      }
    } catch { /* ignore */ }
    return {
      mode: 'mpesa' as 'mpesa' | 'cash' | 'bank',
      amount: '',
      currency: 'KES',
      reference: '',
      note: '',
    };
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(DEFAULT_SUBSCRIPTIONS);
  const [editingSubscriptionId, setEditingSubscriptionId] = useState<string | null>(null);
  const [subscriptionForm, setSubscriptionForm] = useState<Partial<Subscription>>({});

  const [upgradeModalSub, setUpgradeModalSub] = useState<Subscription | null>(null);
  const [renewModalSub, setRenewModalSub] = useState<Subscription | null>(null);
  const [payments] = useState<SoftwarePayment[]>(DEFAULT_PAYMENTS);

  // ── License / activation key state ──
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [activeSubscriptionForLicense, setActiveSubscriptionForLicense] = useState<Subscription | null>(null);

  // ── Monthly payment & activation code state ──
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([]);
  /** Persisted form snapshot so the user's last-entered values survive
   *  page refreshes and modal close/reopen cycles. */
  const MP_FORM_SNAPSHOT_KEY = 'mp_form_snapshot';
  const [mpForm, setMpForm] = useState(() => {
    try {
      const raw = localStorage.getItem(MP_FORM_SNAPSHOT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          subscriptionId: '',
          paymentMode: (parsed.paymentMode ?? 'mpesa') as MonthlyPayment['paymentMode'],
          amount: parsed.amount ?? '299.00',
          currency: parsed.currency ?? 'USD',
          transactionRef: '',
          issuedTo: parsed.issuedTo ?? user?.name ?? 'Munyaka Primary & Junior School',
          deviceId: parsed.deviceId ?? '',
        };
      }
    } catch { /* ignore */ }
    return {
      subscriptionId: '',
      paymentMode: 'mpesa' as MonthlyPayment['paymentMode'],
      amount: '299.00',
      currency: 'USD',
      transactionRef: '',
      issuedTo: user?.name ?? 'Munyaka Primary & Junior School',
      deviceId: '',
    };
  });
  const [lastGeneratedCode, setLastGeneratedCode] = useState<string | null>(null);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // ── Load from localStorage ─────────────
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.gateways?.length) setGateways(parsed.gateways);
        if (parsed.subscriptions?.length) {
          // Filter out any external / third-party subscription cards from
          // previous sessions so only the local institutional license remains.
          const localOnly = parsed.subscriptions.filter(
            (s: Subscription) => !EXTERNAL_SUBSCRIPTION_IDS.has(s.id)
          );
          setSubscriptions(localOnly.length > 0 ? localOnly : DEFAULT_SUBSCRIPTIONS);
        }
      } catch {
        // Use defaults
      }
    }
    // Load issued licenses
    setLicenses(getAllLicenses());
    // Load monthly payment history
    const mpRaw = localStorage.getItem('munyaka_monthly_payments');
    if (mpRaw) {
      try {
        const parsed = JSON.parse(mpRaw);
        if (Array.isArray(parsed)) setMonthlyPayments(parsed);
      } catch {
        // ignore
      }
    }
  }, []);

  // ── Sync hooks ──────────────────────────────────────────────────────
  // Re-read subscriptions and licenses from localStorage whenever another
  // handler fires a payment event — covers cross-tab and cross-component sync.
  useSyncEvent(SUBSCRIPTION_UPDATED_EVENT, () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.subscriptions?.length) {
          const localOnly = parsed.subscriptions.filter(
            (s: Subscription) => !EXTERNAL_SUBSCRIPTION_IDS.has(s.id)
          );
          if (localOnly.length > 0) setSubscriptions(localOnly);
        }
      } catch { /* ignore */ }
    }
    setLicenses(getAllLicenses());
  });

  useSyncEvent(PAYMENT_LOGGED_EVENT, () => {
    const mpRaw = localStorage.getItem('munyaka_monthly_payments');
    if (mpRaw) {
      try {
        const parsed = JSON.parse(mpRaw);
        if (Array.isArray(parsed)) setMonthlyPayments(parsed);
      } catch { /* ignore */ }
    }
    const lpRaw = localStorage.getItem('munyaka_local_payments');
    if (lpRaw) {
      try {
        const parsed = JSON.parse(lpRaw);
        if (Array.isArray(parsed)) setLocalPayments(parsed);
      } catch { /* ignore */ }
    }
  });

  // Listen for cross-tab localStorage changes so a payment recorded in
  // another tab (or window) instantly reflects here as well.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.subscriptions?.length) {
              const localOnly = parsed.subscriptions.filter(
                (s: Subscription) => !EXTERNAL_SUBSCRIPTION_IDS.has(s.id)
              );
              if (localOnly.length > 0) setSubscriptions(localOnly);
            }
          } catch { /* ignore */ }
        }
        setLicenses(getAllLicenses());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // When the user switches back to the Subscriptions tab, re-read all
  // subscription data from localStorage so the card reflects the most
  // recent payment without requiring a page refresh.
  useEffect(() => {
    if (activeTab !== 'subscriptions') return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.subscriptions?.length) {
          const localOnly = parsed.subscriptions.filter(
            (s: Subscription) => !EXTERNAL_SUBSCRIPTION_IDS.has(s.id)
          );
          if (localOnly.length > 0) setSubscriptions(localOnly);
        }
      } catch { /* ignore */ }
    }
    setLicenses(getAllLicenses());
  }, [activeTab]);

  // Single, module-level guard so the prefill useEffect fires **at most
  // once per session** regardless of how many times subscriptions re-fetches
  // or how often subscriptionId is reset.
  const didPrefillRef = useRef(false);
  useEffect(() => {
    if (didPrefillRef.current) return;            // already ran this session
    if (subscriptions.length === 0) return;         // nothing to prefill from
    didPrefillRef.current = true;                  // mark as done
    setMpForm(f => ({
      ...f,
      subscriptionId: subscriptions[0].id,
      amount: f.amount || subscriptions[0].amount,
      currency: f.currency || subscriptions[0].currency,
    }));
  }, [subscriptions]);

  const markChanged = () => setHasUnsavedChanges(true);

  // ── Local payment log ──────────────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem('munyaka_local_payments');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLocalPayments(parsed);
      } catch { /* ignore */ }
    }
  }, []);

  const addLocalPayment = () => {
    if (!lpForm.amount.trim()) { showError('Enter an amount.'); return; }
    if (!lpForm.reference.trim()) { showError('Enter a reference / receipt number.'); return; }

    // Advance the subscription billing date and mark active.
    const today = new Date();
    const newNextBilling = new Date(today);
    newNextBilling.setDate(newNextBilling.getDate() + 30);
    const nextBillingStr = newNextBilling.toISOString().slice(0, 10);
    const firstSubId = subscriptions[0]?.id;
    const updatedSubscriptions = subscriptions.map(s =>
      s.id === firstSubId
        ? { ...s, status: 'active' as const, nextBilling: nextBillingStr }
        : s
    );
    setSubscriptions(updatedSubscriptions);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ gateways, subscriptions: updatedSubscriptions })
    );

    const entry: LocalPaymentEntry = {
      id: `lp-${Date.now()}`,
      mode: lpForm.mode,
      amount: lpForm.amount.trim(),
      currency: lpForm.currency,
      reference: lpForm.reference.trim(),
      note: lpForm.note.trim(),
      loggedAt: new Date().toISOString().slice(0, 10),
    };
    const next = [entry, ...localPayments];
    setLocalPayments(next);
    localStorage.setItem('munyaka_local_payments', JSON.stringify(next));
    setLpForm(f => {
      const cleared = { ...f, amount: '', reference: '', note: '' };
      localStorage.setItem('lp_form_snapshot', JSON.stringify({
        mode: cleared.mode,
        amount: cleared.amount,
        currency: cleared.currency,
        note: cleared.note,
      }));
      return cleared;
    });
    window.dispatchEvent(new Event(SUBSCRIPTION_UPDATED_EVENT));
    window.dispatchEvent(new Event(PAYMENT_LOGGED_EVENT));
    showSuccess(`Payment logged! Subscription extended to ${nextBillingStr}.`);
  };

  // ── Save ───────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 700));
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ gateways, subscriptions })
    );
    setHasUnsavedChanges(false);
    setIsSaving(false);
    showSuccess('Payment configuration saved successfully!');
  };

  // ── Subscription handlers ───────────────
  const openUpgrade = (sub: Subscription) => setUpgradeModalSub(sub);
  const openRenew = (sub: Subscription) => setRenewModalSub(sub);

  const startEditSubscription = (sub: Subscription) => {
    setEditingSubscriptionId(sub.id);
    setSubscriptionForm({ ...sub });
    markChanged();
  };

  const cancelEditSubscription = () => {
    setEditingSubscriptionId(null);
    setSubscriptionForm({});
  };

  const saveSubscriptionForm = () => {
    if (!subscriptionForm.id) return;
    setSubscriptions(prev =>
      prev.map(s => (s.id === subscriptionForm.id ? { ...s, ...subscriptionForm } as Subscription : s))
    );
    setEditingSubscriptionId(null);
    setSubscriptionForm({});
    markChanged();
    showSuccess('Subscription updated.');
  };

  const handleToggleAutoRenew = (id: string) => {
    setSubscriptions(prev =>
      prev.map(s => (s.id === id ? { ...s, autoRenew: !s.autoRenew } : s))
    );
    markChanged();
    showSuccess('Auto-renewal preference saved.');
  };

  // ── Monthly payment & activation code generator ──
  const handleSubscriptionChange = (id: string) => {
    const sub = subscriptions.find(s => s.id === id);
    setMpForm(f => {
      // Only adopt the new plan's amount / currency if the user hasn't
      // already manually changed those fields.
      const stillMatchesAPlan = subscriptions.some(
        s => s.id !== id && s.amount === f.amount && s.currency === f.currency
      );
      const shouldAdoptPlanDefaults = !stillMatchesAPlan && (
        f.amount === '299.00' || f.amount === '' ||
        f.currency === 'USD' || f.currency === ''
      );
      const next = {
        ...f,
        subscriptionId: id,
        amount: shouldAdoptPlanDefaults ? (sub?.amount ?? f.amount) : f.amount,
        currency: shouldAdoptPlanDefaults ? (sub?.currency ?? f.currency) : f.currency,
      };
      persistMpForm(next);
      return next;
    });
  };

  /** Persist MP form snapshot to localStorage so the user's exact
   *  selected values survive a page refresh / modal reopen. */
  const persistMpForm = (snapshot: any) => {
    try {
      localStorage.setItem(MP_FORM_SNAPSHOT_KEY, JSON.stringify(snapshot));
    } catch { /* storage may be unavailable in private mode */ }
  };

  const handleRecordPayment = async () => {
    if (!mpForm.subscriptionId) {
      showError('Please select a subscription.');
      return;
    }
    if (!mpForm.amount.trim() || isNaN(parseFloat(mpForm.amount))) {
      showError('Please enter a valid amount.');
      return;
    }
    if (!mpForm.transactionRef.trim()) {
      showError('Please enter the transaction reference / receipt number.');
      return;
    }
    setIsRecordingPayment(true);
    await new Promise(r => setTimeout(r, 600));

    const sub = subscriptions.find(s => s.id === mpForm.subscriptionId);
    const subName = sub?.name ?? 'Subscription';

    // 1) Issue a real license
    const issued = issueLicense({
      issuedTo: mpForm.issuedTo.trim() || 'Munyaka School',
      deviceId: mpForm.deviceId.trim() || 'OFFICE-001',
      validityDays: 30,
      payment: {
        method: mpForm.paymentMode,
        refNumber: mpForm.transactionRef.trim(),
        amount: mpForm.amount.trim(),
        bankName: mpForm.paymentMode === 'bank' ? 'Owner Bank' : undefined,
      },
      notes: `Monthly payment for ${subName}`,
    });

    // 2) Advance the subscription billing date by 30 days and mark active.
    const today = new Date();
    const newNextBilling = new Date(today);
    newNextBilling.setDate(newNextBilling.getDate() + 30);
    const nextBillingStr = newNextBilling.toISOString().slice(0, 10);

    const updatedSubscriptions = subscriptions.map(s =>
      s.id === mpForm.subscriptionId
        ? { ...s, status: 'active' as const, nextBilling: nextBillingStr }
        : s
    );
    setSubscriptions(updatedSubscriptions);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ gateways, subscriptions: updatedSubscriptions })
    );
    setHasUnsavedChanges(false);

    // 3) Persist a parallel monthly-payment record for the history table.
    const record: MonthlyPayment = {
      id: `mp-${Date.now()}`,
      subscriptionId: mpForm.subscriptionId,
      subscriptionName: subName,
      paymentMode: mpForm.paymentMode,
      amount: mpForm.amount.trim(),
      currency: mpForm.currency,
      transactionRef: mpForm.transactionRef.trim(),
      paidAt: new Date().toISOString().slice(0, 10),
      activationCode: issued.activationKey,
      codeStatus: 'active',
      issuedTo: issued.issuedTo,
      deviceId: issued.deviceId,
      expiresAt: issued.expiresAt,
    };
    const nextPayments = [record, ...monthlyPayments];
    setMonthlyPayments(nextPayments);
    localStorage.setItem('munyaka_monthly_payments', JSON.stringify(nextPayments));

    // 4) Refresh license list & reveal the generated code.
    setLicenses(getAllLicenses());
    setLastGeneratedCode(issued.activationKey);

    // 5) Persist form state to localStorage
    const finalSnapshot = {
      subscriptionId: '',
      paymentMode: mpForm.paymentMode,
      amount: mpForm.amount,
      currency: mpForm.currency,
      transactionRef: '',
      issuedTo: mpForm.issuedTo,
      deviceId: mpForm.deviceId,
    };
    try {
      localStorage.setItem(MP_FORM_SNAPSHOT_KEY, JSON.stringify(finalSnapshot));
    } catch { /* storage may be unavailable in private mode */ }

    // 6) Reset form and close the modal so it reopens in a clean default state.
    setMpForm(f => ({ ...f, transactionRef: '', subscriptionId: '' }));
    setIsRecordingPayment(false);
    setIsLicenseModalOpen(false);
    setActiveSubscriptionForLicense(null);

    window.dispatchEvent(new Event(SUBSCRIPTION_UPDATED_EVENT));
    window.dispatchEvent(new Event(PAYMENT_LOGGED_EVENT));
    showSuccess(
      `Payment recorded! License extended to ${nextBillingStr}. ` +
      `Activation code generated and ready to share.`
    );
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => showSuccess('Activation code copied to clipboard.'),
        () => showError('Could not copy. Please select and copy manually.')
      );
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        showSuccess('Activation code copied to clipboard.');
      } catch {
        showError('Could not copy. Please select and copy manually.');
      }
      document.body.removeChild(ta);
    }
  };

  const markCodeRedeemed = (id: string) => {
    const next = monthlyPayments.map(p =>
      p.id === id ? { ...p, codeStatus: 'redeemed' as const } : p
    );
    setMonthlyPayments(next);
    localStorage.setItem('munyaka_monthly_payments', JSON.stringify(next));
    showSuccess('Code marked as redeemed.');
  };

  const applyUpgrade = (subId: string, newTier: Subscription['tier']) => {
    setSubscriptions(prev =>
      prev.map(s => {
        if (s.id !== subId) return s;
        const tierAmounts: Record<Subscription['tier'], string> = {
          starter: '99.00',
          professional: '199.00',
          enterprise: '299.00',
        };
        const tierSeats: Record<Subscription['tier'], number> = {
          starter: 100,
          professional: 300,
          enterprise: 1000,
        };
        return {
          ...s,
          tier: newTier,
          amount: tierAmounts[newTier],
          seats: tierSeats[newTier],
          status: 'active' as const,
        };
      })
    );
    markChanged();
    setUpgradeModalSub(null);
    showSuccess('Subscription upgraded successfully!');
  };

  const applyRenew = (subId: string, newInterval: Subscription['interval'], newAnchor?: number) => {
    setSubscriptions(prev =>
      prev.map(s => {
        if (s.id !== subId) return s;
        const today = new Date();
        let next: Date;
        if (newInterval === 'monthly') {
          next = new Date(today.getFullYear(), today.getMonth() + 1, newAnchor ?? s.billingCycleAnchor);
        } else if (newInterval === 'annual') {
          next = new Date(today.getFullYear() + 1, today.getMonth(), newAnchor ?? s.billingCycleAnchor);
        } else {
          next = new Date(today.getFullYear() + 2, today.getMonth(), newAnchor ?? s.billingCycleAnchor);
        }
        return {
          ...s,
          interval: newInterval,
          billingCycleAnchor: newAnchor ?? s.billingCycleAnchor,
          nextBilling: next.toISOString().slice(0, 10),
          status: 'active' as const,
          autoRenew: true,
        };
      })
    );
    markChanged();
    setRenewModalSub(null);
    showSuccess('Subscription renewed!');
  };

  const tierBadge = (tier: Subscription['tier']) => {
    const colors = {
      starter: 'bg-slate-100 text-slate-600',
      professional: 'bg-blue-50 text-blue-700',
      enterprise: 'bg-indigo-100 text-indigo-700',
    };
    return (
      <Badge className={cn('border-none font-bold text-[10px] uppercase px-2.5 py-0.5', colors[tier])}>
        {tier}
      </Badge>
    );
  };

  // ── Subscriptions tab top summary derived values ────────────────────
  const primarySub = subscriptions[0];
  const daysToRenewal = primarySub ? daysUntilNextBilling(primarySub.nextBilling) : 0;
  const activeLicenses = licenses.filter(l => l.status === 'active' && l.expiresAt >= new Date().toISOString().slice(0, 10));
  const totalMonthlyPaid = monthlyPayments.reduce((acc, p) => {
    // Only count payments for the current year to keep the "monthly" label honest.
    if (new Date(p.paidAt).getFullYear() !== new Date().getFullYear()) return acc;
    const numeric = parseFloat(p.amount);
    if (isNaN(numeric)) return acc;
    // Normalize to USD (very rough; we only need a comparable number for the summary)
    const rate = p.currency === 'USD' ? 1 : p.currency === 'EUR' ? 1.08 : 0.0077;
    return acc + numeric * rate;
  }, 0);

  // ── Render ─────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
              <CreditCard size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Payment & Subscriptions</h1>
              <p className="text-xs text-slate-500 font-medium">
                Gateway configuration, license management, and billing controls.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse font-bold px-3 py-1 text-xs">
              <AlertTriangle size={12} className="mr-1.5" /> Unsaved Changes
            </Badge>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="rounded-2xl px-8 h-14 font-black shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Owner Banner */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl text-white shadow-xl shadow-indigo-100">
        <div className="p-2 bg-white/20 rounded-xl">
          <ShieldCheck size={24} className="text-white" />
        </div>
        <div>
          <p className="font-black text-sm">Super Admin / Owner Access</p>
          <p className="text-xs text-indigo-200">
            This panel is exclusively for the School Owner. Credentials are encrypted at rest and masked by default.
          </p>
        </div>
      </div>

      {/* ──────────────────────────────────────── */}
      {/* SUBSCRIPTION OVERVIEW SUMMARY (always visible at top) */}
      {/* ──────────────────────────────────────── */}
      {primarySub && (
        <Card className="border-none shadow-lg rounded-[2rem] bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white overflow-hidden">
          <CardContent className="p-7 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Plan & status */}
              <div className="md:col-span-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/15 rounded-xl">
                    <Building2 size={18} className="text-indigo-200" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
                    Active Plan
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">{primarySub.name}</h2>
                  <p className="text-sm text-indigo-200 mt-0.5">{primarySub.plan}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {getStatusBadge(primarySub.status)}
                  {tierBadge(primarySub.tier)}
                  <Badge className="bg-white/10 text-indigo-100 border-white/20 font-bold text-[10px] gap-1">
                    <RefreshCw size={10} /> {primarySub.interval}
                  </Badge>
                </div>
              </div>

              {/* Financials */}
              <div className="md:col-span-1 space-y-2 bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 flex items-center gap-1.5">
                  <TrendingUp size={10} /> Current Bill
                </p>
                <p className="text-3xl font-black">
                  {primarySub.currency} {primarySub.amount}
                  <span className="text-sm font-bold text-indigo-200/80 ml-1">/{primarySub.interval === 'monthly' ? 'mo' : primarySub.interval === 'annual' ? 'yr' : '2yr'}</span>
                </p>
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <Calendar size={12} className="text-indigo-300" />
                  <span className="text-indigo-100 font-medium">
                    Next: <strong className="text-white">{primarySub.nextBilling}</strong>
                    {daysToRenewal > 0 && (
                      <span className="ml-1 text-indigo-200/80">({daysToRenewal}d)</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Users size={12} className="text-indigo-300" />
                  <span className="text-indigo-100 font-medium">
                    {primarySub.seats.toLocaleString()} institutional seats
                  </span>
                </div>
              </div>

              {/* Quick actions */}
              <div className="md:col-span-1 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
                  Quick Actions
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setActiveTab('monthly')}
                    className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/15 rounded-2xl border border-white/10 transition-colors text-left"
                  >
                    <span className="flex items-center gap-2 font-bold text-sm">
                      <CreditCard size={14} /> Record Payment
                    </span>
                    <Zap size={14} className="text-amber-300" />
                  </button>
                  <button
                    onClick={() => setActiveTab('monthly')}
                    className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/15 rounded-2xl border border-white/10 transition-colors text-left"
                  >
                    <span className="flex items-center gap-2 font-bold text-sm">
                      <Key size={14} /> Generate License Key
                    </span>
                    <Sparkles size={14} className="text-emerald-300" />
                  </button>
                  <button
                    onClick={() => setActiveTab('monthly')}
                    className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/15 rounded-2xl border border-white/10 transition-colors text-left"
                  >
                    <span className="flex items-center gap-2 font-bold text-sm">
                      <History size={14} /> View Payment History
                    </span>
                    <RefreshCw size={14} className="text-indigo-300" />
                  </button>
                </div>
                <p className="text-[10px] text-indigo-200/70 font-medium pt-1 text-center">
                  {monthlyPayments.length} payment{monthlyPayments.length !== 1 ? 's' : ''} logged · {activeLicenses.length} active license{activeLicenses.length !== 1 ? 's' : ''}
                  {totalMonthlyPaid > 0 && ` · $${totalMonthlyPaid.toFixed(2)} paid (this year)`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1.5 rounded-2xl shadow-sm border h-auto mb-8 flex flex-wrap gap-1 w-full">
          <TabsTrigger value="subscriptions" className="rounded-xl px-5 py-2.5 font-bold text-xs gap-2 flex-shrink-0 whitespace-nowrap data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <RefreshCw size={15} /> License Details
          </TabsTrigger>
          <TabsTrigger value="monthly" className="rounded-xl px-5 py-2.5 font-bold text-xs gap-2 flex-shrink-0 whitespace-nowrap data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Sparkles size={15} /> Record & Generate
          </TabsTrigger>
          <TabsTrigger value="gateways" className="rounded-xl px-5 py-2.5 font-bold text-xs gap-2 flex-shrink-0 whitespace-nowrap data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Globe size={15} /> Payment Gateways
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-xl px-5 py-2.5 font-bold text-xs gap-2 flex-shrink-0 whitespace-nowrap data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <DollarSign size={15} /> Invoice History
          </TabsTrigger>
        </TabsList>

        {/* ──────────────────────────────────────── */}
        {/* LICENSE DETAILS TAB */}
        {/* ──────────────────────────────────────── */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptions.map(sub => (
              <Card
                key={sub.id}
                className={cn(
                  "border-none shadow-sm rounded-[2rem] overflow-hidden transition-all",
                  editingSubscriptionId === sub.id ? "ring-2 ring-indigo-400 shadow-xl" : ""
                )}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2.5 rounded-xl",
                        sub.status === 'active' ? "bg-emerald-50 text-emerald-600" :
                        sub.status === 'trial' ? "bg-blue-50 text-blue-600" :
                        "bg-slate-50 text-slate-400"
                      )}>
                        <Building2 size={20} />
                      </div>
                      <div>
                        <CardTitle className="text-base font-black text-slate-900">{sub.name}</CardTitle>
                        <p className="text-xs text-slate-400 font-medium">{sub.provider}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(sub.status)}
                      {tierBadge(sub.tier)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Plan & interval */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Plan</p>
                      <p className="text-sm font-bold text-slate-900">{sub.plan}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Interval</p>
                      <p className="text-sm font-bold text-slate-900 capitalize">{sub.interval}</p>
                    </div>
                  </div>

                  {/* Amount & billing */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</p>
                      <p className="text-xl font-black text-slate-900">{sub.currency} {sub.amount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Billing</p>
                      <p className="text-sm font-bold text-slate-900">{sub.nextBilling}</p>
                    </div>
                  </div>

                  {/* Billing cycle anchor */}
                  <div className="bg-slate-50 rounded-2xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Billing Cycle</p>
                    {editingSubscriptionId === sub.id ? (
                      <Select
                        value={String(subscriptionForm.billingCycleAnchor ?? sub.billingCycleAnchor)}
                        onValueChange={v => {
                          setSubscriptionForm(p => ({ ...p, billingCycleAnchor: parseInt(v) }));
                          markChanged();
                        }}
                      >
                        <SelectTrigger className="h-9 rounded-xl bg-white border-none font-bold text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                            <SelectItem key={d} value={String(d)}>Day {d} of each month</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm font-bold text-slate-700">
                        Day {sub.billingCycleAnchor} of each month
                      </p>
                    )}
                  </div>

                  {/* Seats */}
                  <div className="bg-slate-50 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Institutional Seats</p>
                      {editingSubscriptionId === sub.id ? (
                        <Input
                          type="number"
                          value={subscriptionForm.seats ?? sub.seats}
                          onChange={e => {
                            setSubscriptionForm(p => ({ ...p, seats: parseInt(e.target.value) || 0 }));
                            markChanged();
                          }}
                          className="h-8 rounded-xl bg-white border-none font-bold text-sm w-28"
                        />
                      ) : (
                        <p className="text-sm font-bold text-slate-900">{sub.seats.toLocaleString()} seats</p>
                      )}
                    </div>
                    <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl">
                      <Users size={16} />
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1.5">
                    {sub.features.map(f => (
                      <Badge key={f} className="bg-slate-100 text-slate-600 border-none font-bold text-[10px]">
                        <Check size={10} className="mr-1 text-emerald-500" /> {f}
                      </Badge>
                    ))}
                  </div>

                  <Separator className="my-2" />

                  {/* Controls */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-500">Auto-Renew</p>
                        <Switch
                          checked={sub.autoRenew}
                          onCheckedChange={() => handleToggleAutoRenew(sub.id)}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {sub.status === 'active' || sub.status === 'trial' ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUpgrade(sub)}
                            className="rounded-xl h-9 text-xs font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50 gap-1.5 flex-1"
                          >
                            <ArrowUpCircle size={14} /> Upgrade
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRenew(sub)}
                            className="rounded-xl h-9 text-xs font-bold border-slate-200 gap-1.5 flex-1"
                          >
                            <RefreshCcw size={14} /> Renew
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRenew(sub)}
                          className="rounded-xl h-9 text-xs font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50 gap-1.5 w-full"
                        >
                          <RefreshCcw size={14} /> Reactivate
                        </Button>
                      )}
                    </div>

                    {/* Record Payment & Generate License Key (single primary action) */}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setActiveSubscriptionForLicense(sub);
                        setActiveTab('monthly');
                        // Slight delay so the tab switch + form prefill completes
                        setTimeout(() => {
                          setIsLicenseModalOpen(true);
                        }, 50);
                      }}
                      className="rounded-xl h-10 text-xs font-black w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-100 gap-1.5"
                    >
                      <Key size={14} /> Record Payment & Generate License Key
                    </Button>

                    <div className="flex gap-2">
                      {editingSubscriptionId === sub.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditSubscription}
                            className="rounded-xl h-8 text-xs font-bold flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={saveSubscriptionForm}
                            className="rounded-xl h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex-1"
                          >
                            <Check size={12} className="mr-1" /> Save
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditSubscription(sub)}
                          className="rounded-xl h-8 text-xs font-bold w-full text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 gap-1"
                        >
                          <Edit3 size={12} /> Edit License Details
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── License History / Activation Key Log ── */}
          <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">License History & Activation Keys</h2>
                <p className="text-sm text-slate-500">
                  All issued activation keys, their payment records, and status.
                </p>
              </div>
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold text-xs gap-1.5 px-3 py-1.5">
                <Key size={12} />
                {licenses.length} key{licenses.length !== 1 ? 's' : ''} issued
              </Badge>
            </div>

            {licenses.length === 0 ? (
              <Card className="border-none shadow-sm rounded-[2rem] bg-slate-50 py-14 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center">
                    <Key size={28} />
                  </div>
                  <p className="text-base font-black text-slate-700">No Licenses Issued Yet</p>
                  <p className="text-sm text-slate-400 font-medium max-w-xs">
                    Click <span className="font-bold text-indigo-600">"Record Payment & Generate License Key"</span> above to record a payment and generate your first activation code.
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left min-w-[900px]">
                      <thead className="bg-slate-50/80 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Activation Key</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Issued To</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Device ID</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Payment</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Valid For</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Expiry</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Status</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {licenses.map((lic) => {
                          const isExpired = lic.expiresAt < new Date().toISOString().slice(0, 10);
                          const statusColor = lic.status === 'revoked'
                            ? 'bg-rose-50 text-rose-700'
                            : isExpired
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-emerald-50 text-emerald-700';
                          const statusIcon = lic.status === 'revoked'
                            ? <XCircle size={10} />
                            : isExpired
                            ? <Ban size={10} />
                            : <CheckCircle2 size={10} />;
                          return (
                            <tr key={lic.id} className="hover:bg-slate-50/40 transition-colors group">
                              <td className="px-6 py-4">
                                <p className="font-mono font-black text-indigo-600 text-[11px] leading-tight">
                                  {lic.activationKey}
                                </p>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-900">{lic.issuedTo}</td>
                              <td className="px-6 py-4">
                                <span className="font-mono text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg">
                                  {lic.deviceId}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-0.5">
                                  <p className="font-medium text-slate-700">
                                    {LICENSE_METHOD_LABELS[lic.payment.method] ?? lic.payment.method}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    {lic.payment.refNumber || '—'}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-slate-600 font-medium">{licenseValidityLabel(lic.validityDays)}</span>
                              </td>
                              <td className="px-6 py-4">
                                <p className={cn("font-bold", isExpired ? "text-slate-400 line-through" : "text-slate-700")}>
                                  {new Date(lic.expiresAt).toLocaleDateString()}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  Issued: {new Date(lic.issuedAt).toLocaleDateString()}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <Badge className={cn("border font-bold text-[10px] gap-1", statusColor)}>
                                  {statusIcon}
                                  {lic.status === 'revoked' ? 'Revoked' : isExpired ? 'Expired' : 'Active'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                                    title="Revoke license"
                                    onClick={() => {
                                      if (confirm(`Revoke license ${lic.activationKey.slice(0, 12)}...? This will lock the app.`)) {
                                        revokeLicense(lic.activationKey, 'Manually revoked by owner');
                                        setLicenses(getAllLicenses());
                                        showSuccess('License revoked. App will require reactivation.');
                                      }
                                    }}
                                  >
                                    <Ban size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ──────────────────────────────────────── */}
        {/* MONTHLY PAYMENTS / RECORD & GENERATE TAB */}
        {/* ──────────────────────────────────────── */}
        <TabsContent value="monthly" className="space-y-8">

          {/* ── Payment Entry Form ── */}
          <Card className="border-none shadow-lg rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                  <CreditCard size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg font-black text-slate-900">Record Monthly Payment</CardTitle>
                  <CardDescription>Log a payment and instantly generate an activation code for the device.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">

              {/* Success banner — shown after a code is generated */}
              {lastGeneratedCode && (
                <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-emerald-800">Activation Code Generated!</p>
                      <p className="text-xs text-emerald-600 mt-0.5 mb-3">Share this code with the device to unlock the app. The code is valid for 30 days.</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white rounded-2xl px-4 py-3 border border-emerald-200 overflow-x-auto">
                          <p className="font-mono font-black text-indigo-700 text-sm whitespace-nowrap tracking-widest">
                            {lastGeneratedCode}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(lastGeneratedCode)}
                          className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg gap-1.5 shrink-0"
                        >
                          <Copy size={14} /> Copy
                        </Button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLastGeneratedCode(null)}
                      className="text-emerald-400 hover:text-emerald-600 transition-colors shrink-0"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subscription select */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Subscription Plan
                  </Label>
                  <Select
                    value={mpForm.subscriptionId}
                    onValueChange={handleSubscriptionChange}
                  >
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base pl-4">
                      <SelectValue placeholder="Select a plan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptions.map(sub => (
                        <SelectItem key={sub.id} value={sub.id}>
                          <div className="flex items-center gap-2 py-1">
                            <span className="font-bold">{sub.name}</span>
                            <span className="text-slate-400 text-xs">·</span>
                            <span className="text-indigo-600 font-black text-sm">
                              {sub.currency} {sub.amount}
                            </span>
                            <span className="text-slate-400 text-xs">/mo</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment mode */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Payment Mode
                  </Label>
                  <Select
                    value={mpForm.paymentMode}
                    onValueChange={v => setMpForm(f => { persistMpForm({ ...f, paymentMode: v as MonthlyPayment['paymentMode'] }); return { ...f, paymentMode: v as MonthlyPayment['paymentMode'] }; })}
                  >
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base pl-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mpesa">
                        <div className="flex items-center gap-2 font-bold">
                          <Smartphone size={14} className="text-emerald-600" /> M-Pesa
                        </div>
                      </SelectItem>
                      <SelectItem value="cash">
                        <div className="flex items-center gap-2 font-bold">
                          <DollarSign size={14} className="text-blue-600" /> Cash
                        </div>
                      </SelectItem>
                      <SelectItem value="bank">
                        <div className="flex items-center gap-2 font-bold">
                          <Landmark size={14} className="text-slate-600" /> Bank Deposit
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Amount Paid
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">
                      {mpForm.currency === 'KES' ? 'KSh' : mpForm.currency === 'USD' ? '$' : mpForm.currency}
                    </span>
                    <Input
                      type="number"
                      value={mpForm.amount}
                      onChange={e => setMpForm(f => { persistMpForm({ ...f, amount: e.target.value }); return { ...f, amount: e.target.value }; })}
                      placeholder="0.00"
                      className="h-14 pl-10 rounded-2xl bg-slate-50 border-none font-black text-base pl-12"
                    />
                  </div>
                </div>

                {/* Currency */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Currency
                  </Label>
                  <Select
                    value={mpForm.currency}
                    onValueChange={v => setMpForm(f => { persistMpForm({ ...f, currency: v }); return { ...f, currency: v }; })}
                  >
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base pl-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD — US Dollar</SelectItem>
                      <SelectItem value="KES">KES — Kenyan Shilling</SelectItem>
                      <SelectItem value="EUR">EUR — Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Transaction reference */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Transaction Reference / Receipt Number
                </Label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    value={mpForm.transactionRef}
                    onChange={e => setMpForm(f => ({ ...f, transactionRef: e.target.value }))}
                    placeholder={
                      mpForm.paymentMode === 'mpesa'
                        ? 'e.g. MG23K4R5HT'
                        : mpForm.paymentMode === 'bank'
                        ? 'e.g. DEP-2026-04-001'
                        : 'e.g. REC-001'
                    }
                    className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-mono font-bold text-base"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {mpForm.paymentMode === 'mpesa'
                    ? 'Enter the M-Pesa confirmation message number or reference code.'
                    : mpForm.paymentMode === 'bank'
                    ? 'Enter the bank deposit slip reference or EFT confirmation number.'
                    : 'Enter the cash receipt number or payment voucher reference.'}
                </p>
              </div>

              {/* Issued to / Device ID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Issued To (School / Entity)
                  </Label>
                  <Input
                    value={mpForm.issuedTo}
                    onChange={e => setMpForm(f => ({ ...f, issuedTo: e.target.value }))}
                    placeholder="Munyaka Primary & Junior School"
                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Device ID / Label
                  </Label>
                  <Input
                    value={mpForm.deviceId}
                    onChange={e => setMpForm(f => ({ ...f, deviceId: e.target.value }))}
                    placeholder="e.g. HEAD-OFFICE, CLASS-1-DESK"
                    className="h-14 rounded-2xl bg-slate-50 border-none font-mono font-bold text-base"
                  />
                </div>
              </div>

              {/* Generate button */}
              <Button
                onClick={handleRecordPayment}
                disabled={isRecordingPayment}
                className="w-full rounded-2xl h-14 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 font-black text-white shadow-xl shadow-indigo-100 text-base gap-3"
              >
                {isRecordingPayment ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Sparkles size={18} />
                )}
                {isRecordingPayment ? 'Recording & Generating…' : 'Record Payment & Generate Activation Code'}
              </Button>
            </CardContent>
          </Card>

          {/* ── Activation Code Management List ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Activation Code Management</h2>
                <p className="text-sm text-slate-500">
                  All monthly payment codes. Copy and share to unlock devices. Codes expire after 30 days.
                </p>
              </div>
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold text-xs gap-1.5 px-3 py-1.5">
                <Key size={12} />
                {monthlyPayments.length} code{monthlyPayments.length !== 1 ? 's' : ''} issued
              </Badge>
            </div>

            {monthlyPayments.length === 0 ? (
              <Card className="border-none shadow-sm rounded-[2rem] bg-slate-50 py-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center">
                    <Key size={32} />
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-700">No Codes Generated Yet</p>
                    <p className="text-sm text-slate-400 font-medium mt-1">
                      Record a monthly payment above to generate your first activation code.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left min-w-[900px]">
                      <thead className="bg-slate-50/80 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Activation Code</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Subscription</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Payment</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Ref / Receipt</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Date</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Expiry</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Status</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {monthlyPayments.map((mp) => {
                          const isExpired = mp.expiresAt < new Date().toISOString().slice(0, 10);
                          const statusStyle =
                            mp.codeStatus === 'redeemed'
                              ? 'bg-blue-50 text-blue-700'
                              : isExpired
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-emerald-50 text-emerald-700';
                          const statusLabel =
                            mp.codeStatus === 'redeemed'
                              ? 'Redeemed'
                              : isExpired
                              ? 'Expired'
                              : 'Active';
                          const statusIcon =
                            mp.codeStatus === 'redeemed' ? (
                              <CheckCircle2 size={10} />
                            ) : isExpired ? (
                              <Ban size={10} />
                            ) : (
                              <CheckCircle2 size={10} />
                            );

                          const modeColors: Record<string, string> = {
                            mpesa: 'bg-emerald-50 text-emerald-700',
                            cash: 'bg-blue-50 text-blue-700',
                            bank: 'bg-slate-100 text-slate-600',
                          };
                          const modeLabels: Record<string, string> = {
                            mpesa: 'M-Pesa',
                            cash: 'Cash',
                            bank: 'Bank Deposit',
                          };

                          return (
                            <tr key={mp.id} className="hover:bg-slate-50/40 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <p className="font-mono font-black text-indigo-600 text-[11px] tracking-widest whitespace-nowrap">
                                    {mp.activationCode}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(mp.activationCode)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition-all shrink-0"
                                    title="Copy code"
                                  >
                                    <Copy size={13} />
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-700">{mp.subscriptionName}</td>
                              <td className="px-6 py-4">
                                <span className={cn('px-2.5 py-1 rounded-xl text-[10px] font-black uppercase', modeColors[mp.paymentMode] ?? modeColors.cash)}>
                                  {modeLabels[mp.paymentMode]}
                                </span>
                                <p className="text-slate-600 font-black text-sm mt-0.5">
                                  {mp.currency} {mp.amount}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-mono text-slate-600 font-medium bg-slate-50 px-2 py-0.5 rounded-lg">
                                  {mp.transactionRef}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-medium text-slate-700">
                                  {new Date(mp.paidAt).toLocaleDateString()}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium">{mp.issuedTo}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className={cn('font-bold', isExpired ? 'text-slate-400' : 'text-slate-700')}>
                                  {new Date(mp.expiresAt).toLocaleDateString()}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <Badge className={cn('border font-bold text-[10px] gap-1', statusStyle)}>
                                  {statusIcon}
                                  {statusLabel}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"
                                    title="Copy code"
                                    onClick={() => copyToClipboard(mp.activationCode)}
                                  >
                                    <Copy size={14} />
                                  </Button>
                                  {mp.codeStatus === 'active' && !isExpired && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-xl text-slate-300 hover:text-blue-600 hover:bg-blue-50"
                                      title="Mark as redeemed"
                                      onClick={() => markCodeRedeemed(mp.id)}
                                    >
                                      <CheckCircle2 size={14} />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ──────────────────────────────────────── */}
        {/* PAYMENT GATEWAYS TAB */}
        {/* ──────────────────────────────────────── */}
        <TabsContent value="gateways" className="space-y-8">

          {/* ── Local payment entry form ── */}
          <Card className="border-none shadow-lg rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                  <DollarSign size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg font-black text-slate-900">Log a Local Payment</CardTitle>
                  <CardDescription>Record cash, bank deposit, or M-Pesa payments manually — no API keys needed.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-5">

              {/* Mode selector */}
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: 'mpesa', label: 'M-Pesa', icon: <Smartphone size={18} />, color: 'emerald' },
                  { value: 'cash',  label: 'Cash',    icon: <DollarSign size={18} />, color: 'blue'   },
                  { value: 'bank',  label: 'Bank',    icon: <Landmark size={18} />,   color: 'slate' },
                ] as const).map(({ value, label, icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLpForm(f => ({ ...f, mode: value }))}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                      lpForm.mode === value
                        ? color === 'emerald' ? "border-emerald-400 bg-emerald-50 text-emerald-700" :
                          color === 'blue'   ? "border-blue-400 bg-blue-50 text-blue-700" :
                          "border-slate-400 bg-slate-100 text-slate-700"
                        : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    {icon}
                    <span className="text-xs font-black">{label}</span>
                  </button>
                ))}
              </div>

              {/* Amount + Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">
                      {lpForm.currency === 'KES' ? 'KSh' : '$'}
                    </span>
                    <Input
                      type="number"
                      value={lpForm.amount}
                      onChange={e => setLpForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0.00"
                      className="h-14 pl-10 rounded-2xl bg-slate-50 border-none font-black text-base"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Currency</Label>
                  <Select
                    value={lpForm.currency}
                    onValueChange={v => setLpForm(f => ({ ...f, currency: v }))}
                  >
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base pl-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES — Kenyan Shilling</SelectItem>
                      <SelectItem value="USD">USD — US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR — Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reference */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Transaction Reference / Receipt Number
                </Label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    value={lpForm.reference}
                    onChange={e => setLpForm(f => ({ ...f, reference: e.target.value }))}
                    placeholder={
                      lpForm.mode === 'mpesa' ? 'e.g. MG23K4R5HT' :
                      lpForm.mode === 'bank' ? 'e.g. DEP-2026-04-001' :
                      'e.g. REC-001'
                    }
                    className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-mono font-bold text-base"
                  />
                </div>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Note (optional)
                </Label>
                <Input
                  value={lpForm.note}
                  onChange={e => setLpForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="e.g. School fees for April 2026, Class 4"
                  className="h-14 rounded-2xl bg-slate-50 border-none font-medium text-base"
                />
              </div>

              <Button
                onClick={addLocalPayment}
                className="w-full rounded-2xl h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 font-black text-white shadow-xl shadow-emerald-100 text-base gap-2"
              >
                <Check size={18} /> Log Payment
              </Button>
            </CardContent>
          </Card>

          {/* ── Local payment log table ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Payment Log</h2>
                <p className="text-sm text-slate-500">All locally recorded payments — cash, bank, and M-Pesa.</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-xs gap-1.5 px-3 py-1.5">
                <DollarSign size={12} />
                {localPayments.length} record{localPayments.length !== 1 ? 's' : ''} logged
              </Badge>
            </div>

            {localPayments.length === 0 ? (
              <Card className="border-none shadow-sm rounded-[2rem] bg-slate-50 py-14 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center">
                    <DollarSign size={28} />
                  </div>
                  <p className="text-base font-black text-slate-700">No payments logged yet</p>
                  <p className="text-sm text-slate-400 font-medium">Use the form above to record a payment.</p>
                </div>
              </Card>
            ) : (
              <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left min-w-[700px]">
                      <thead className="bg-slate-50/80 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Date</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Mode</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Reference</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Amount</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Note</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {localPayments.map((lp) => {
                          const modeColors: Record<string, string> = {
                            mpesa: 'bg-emerald-50 text-emerald-700',
                            cash: 'bg-blue-50 text-blue-700',
                            bank: 'bg-slate-100 text-slate-700',
                          };
                          const modeLabels: Record<string, string> = {
                            mpesa: 'M-Pesa',
                            cash: 'Cash',
                            bank: 'Bank Deposit',
                          };
                          return (
                            <tr key={lp.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="px-6 py-4 font-medium text-slate-700">
                                {new Date(lp.loggedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                <Badge className={cn('border-none font-bold text-[10px]', modeColors[lp.mode] ?? 'bg-slate-100 text-slate-600')}>
                                  {modeLabels[lp.mode]}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-mono text-slate-600 font-medium bg-slate-50 px-2 py-0.5 rounded-lg">
                                  {lp.reference}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-black text-slate-900">
                                {lp.currency} {lp.amount}
                              </td>
                              <td className="px-6 py-4 text-slate-500 text-xs">{lp.note || '—'}</td>
                              <td className="px-6 py-4 text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"
                                  title="Delete entry"
                                  onClick={() => {
                                    if (!confirm('Delete this payment log entry?')) return;
                                    const next = localPayments.filter(p => p.id !== lp.id);
                                    setLocalPayments(next);
                                    localStorage.setItem('munyaka_local_payments', JSON.stringify(next));
                                    showSuccess('Entry deleted.');
                                  }}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ──────────────────────────────────────── */}
        {/* INVOICE HISTORY TAB */}
        {/* ──────────────────────────────────────── */}
        <TabsContent value="payments" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                  <History size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg font-black text-slate-900">Invoice History</CardTitle>
                  <CardDescription>Invoice history for platform subscriptions and software services.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-4 font-black uppercase tracking-widest text-slate-400">Invoice</th>
                      <th className="px-8 py-4 font-black uppercase tracking-widest text-slate-400">Description</th>
                      <th className="px-8 py-4 font-black uppercase tracking-widest text-slate-400">Amount</th>
                      <th className="px-8 py-4 font-black uppercase tracking-widest text-slate-400">Method</th>
                      <th className="px-8 py-4 font-black uppercase tracking-widest text-slate-400">Date</th>
                      <th className="px-8 py-4 font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map(pmt => (
                      <tr key={pmt.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-8 py-4 font-mono font-bold text-slate-700">{pmt.invoiceId}</td>
                        <td className="px-8 py-4 font-medium text-slate-900">{pmt.description}</td>
                        <td className="px-8 py-4 font-black text-slate-900">{pmt.currency} {pmt.amount}</td>
                        <td className="px-8 py-4 text-slate-600">{pmt.paymentMethod}</td>
                        <td className="px-8 py-4 font-mono text-slate-500">{pmt.paidAt || '—'}</td>
                        <td className="px-8 py-4 text-right">{getStatusBadge(pmt.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ──────────────────────────────────────── */}
      {/* UPGRADE MODAL */}
      {/* ──────────────────────────────────────── */}
      <Modal
        isOpen={!!upgradeModalSub}
        onClose={() => setUpgradeModalSub(null)}
        title="Upgrade Institutional License"
        description={`Upgrade ${upgradeModalSub?.name} to a higher tier for more seats and features.`}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="ghost" onClick={() => setUpgradeModalSub(null)} className="rounded-xl font-bold h-12 px-6">
              Cancel
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {(['starter', 'professional', 'enterprise'] as Subscription['tier'][]).map(tier => {
            const amounts: Record<Subscription['tier'], string> = {
              starter: '$99/mo',
              professional: '$199/mo',
              enterprise: '$299/mo',
            };
            const seats: Record<Subscription['tier'], number> = {
              starter: 100,
              professional: 300,
              enterprise: 1000,
            };
            const colors: Record<Subscription['tier'], string> = {
              starter: 'border-slate-200 bg-slate-50',
              professional: 'border-blue-300 bg-blue-50',
              enterprise: 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-400',
            };
            const isCurrent = upgradeModalSub?.tier === tier;
            const isDowngrade = (['starter', 'professional', 'enterprise'] as Subscription['tier'][]).indexOf(tier) <
              (['starter', 'professional', 'enterprise'] as Subscription['tier'][]).indexOf(upgradeModalSub?.tier ?? 'starter');
            return (
              <button
                key={tier}
                onClick={() => upgradeModalSub && applyUpgrade(upgradeModalSub.id, tier)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left hover:scale-[1.01] hover:shadow-md",
                  colors[tier],
                  isCurrent && "opacity-50 cursor-not-allowed"
                )}
                disabled={isCurrent}
              >
                <div>
                  <p className="font-black text-slate-900 capitalize">{tier}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{seats[tier]} seats included</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900">{amounts[tier]}</p>
                  {isCurrent ? (
                    <Badge className="bg-slate-200 text-slate-600 border-none font-bold text-[10px] mt-1">Current</Badge>
                  ) : isDowngrade ? (
                    <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-[10px] mt-1">Downgrade</Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-[10px] mt-1">
                      <ArrowUpCircle size={10} className="mr-1" /> Upgrade
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Modal>

      {/* ──────────────────────────────────────── */}
      {/* RENEW MODAL */}
      {/* ──────────────────────────────────────── */}
      <Modal
        isOpen={!!renewModalSub}
        onClose={() => setRenewModalSub(null)}
        title="Renew Subscription"
        description={`Extend ${renewModalSub?.name} and update the billing cycle.`}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="ghost" onClick={() => setRenewModalSub(null)} className="rounded-xl font-bold h-12 px-6">
              Cancel
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Billing Interval</Label>
            <Select defaultValue={renewModalSub?.interval ?? 'monthly'}>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="annual">Annual (Save ~17%)</SelectItem>
                <SelectItem value="biennial">Biennial (Save ~25%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Billing Cycle Anchor (Day of Month)</Label>
            <Select defaultValue={String(renewModalSub?.billingCycleAnchor ?? 1)}>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                  <SelectItem key={d} value={String(d)}>Day {d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {renewModalSub && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl">
              <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm font-bold text-emerald-800">Renewal Summary</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {renewModalSub.name} will be renewed and the next billing date will be updated to the selected cycle.
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => renewModalSub && applyRenew(renewModalSub.id, 'monthly')}
              className="flex-1 rounded-xl font-bold h-12 border-slate-200"
            >
              Monthly
            </Button>
            <Button
              onClick={() => renewModalSub && applyRenew(renewModalSub.id, 'annual')}
              className="flex-1 rounded-xl font-bold h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
            >
              Annual
            </Button>
            <Button
              variant="outline"
              onClick={() => renewModalSub && applyRenew(renewModalSub.id, 'biennial')}
              className="flex-1 rounded-xl font-bold h-12 border-slate-200"
            >
              2-Year
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Record License Payment Modal ── */}
      <RecordLicensePaymentModal
        isOpen={isLicenseModalOpen}
        onClose={() => { setIsLicenseModalOpen(false); setActiveSubscriptionForLicense(null); }}
        onIssued={(license) => {
          setIsLicenseModalOpen(false);
          setActiveSubscriptionForLicense(null);
          setLicenses(getAllLicenses());
        }}
        defaultIssuedTo={user?.name ?? 'Munyaka Primary & Junior School'}
        defaultSubscriptionName={activeSubscriptionForLicense?.name}
      />
    </div>
  );
};

export default PaymentManagement;