"use client";

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Navigate } from 'react-router-dom';

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

// ─────────────────────────────────────────
// DEFAULT DATA
// ─────────────────────────────────────────
const DEFAULT_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-001',
    name: 'Dyad Platform',
    provider: 'Dyad',
    plan: 'Enterprise Starter',
    tier: 'enterprise',
    status: 'active',
    nextBilling: '2026-05-01',
    amount: '299.00',
    currency: 'USD',
    interval: 'monthly',
    autoRenew: true,
    billingCycleAnchor: 1,
    seats: 500,
    features: ['Unlimited Students', 'Advanced Analytics', 'Priority Support', 'API Access'],
  },
  {
    id: 'sub-002',
    name: 'Supabase Backend',
    provider: 'Supabase',
    plan: 'Pro Tier',
    tier: 'professional',
    status: 'active',
    nextBilling: '2026-04-15',
    amount: '75.00',
    currency: 'USD',
    interval: 'monthly',
    autoRenew: true,
    billingCycleAnchor: 15,
    seats: 200,
    features: ['5 GB Storage', 'Database Backups', 'Real-time Subscriptions'],
  },
  {
    id: 'sub-003',
    name: 'Google Maps API',
    provider: 'Google Cloud',
    plan: 'Pay-as-you-go',
    tier: 'starter',
    status: 'trial',
    nextBilling: '2026-04-20',
    amount: '0.00',
    currency: 'USD',
    interval: 'monthly',
    autoRenew: false,
    billingCycleAnchor: 20,
    seats: 50,
    features: ['Geolocation', 'Map Tiles', 'Places API'],
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
    webhookUrl: 'https://api.munyaka.sc.ke/webhooks/mpesa',
    status: 'active',
    lastSync: '2026-03-31 08:00:00',
  },
  {
    id: 'gw-002',
    name: 'PayPal Gateway',
    provider: 'paypal',
    enabled: false,
    consumerKey: '',
    consumerSecret: '',
    passkey: '',
    shortcode: '',
    clientId: '',
    clientSecret: '',
    environment: 'sandbox',
    stripePublishableKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    webhookUrl: 'https://api.munyaka.sc.ke/webhooks/paypal',
    status: 'pending',
    lastSync: '2026-03-31 08:00:00',
  },
];

const DEFAULT_PAYMENTS: SoftwarePayment[] = [
  {
    id: 'pmt-001',
    description: 'Dyad Platform - March 2026',
    amount: '299.00',
    currency: 'USD',
    status: 'paid',
    paidAt: '2026-03-01',
    invoiceId: 'INV-2026-003',
    paymentMethod: 'PayPal',
  },
  {
    id: 'pmt-002',
    description: 'Supabase Pro - March 2026',
    amount: '75.00',
    currency: 'USD',
    status: 'paid',
    paidAt: '2026-03-15',
    invoiceId: 'INV-2026-004',
    paymentMethod: 'Credit Card',
  },
  {
    id: 'pmt-003',
    description: 'Dyad Platform - April 2026',
    amount: '299.00',
    currency: 'USD',
    status: 'pending',
    paidAt: '',
    invoiceId: 'INV-2026-005',
    paymentMethod: 'PayPal',
  },
];

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

// Secure masked input field
function SecureField({
  label,
  value,
  show,
  onToggle,
  placeholder,
  icon: Icon,
}: {
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</Label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />}
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          readOnly
          className={cn(
            "h-11 pl-9 pr-10 rounded-xl bg-slate-50 border-none font-mono text-sm text-slate-700",
            !value && "italic text-slate-400"
          )}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
          title={show ? 'Hide' : 'Reveal'}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
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
  const [editingGatewayId, setEditingGatewayId] = useState<string | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [gatewayForm, setGatewayForm] = useState<Partial<PaymentGateway>>({});

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(DEFAULT_SUBSCRIPTIONS);
  const [editingSubscriptionId, setEditingSubscriptionId] = useState<string | null>(null);
  const [subscriptionForm, setSubscriptionForm] = useState<Partial<Subscription>>({});

  const [upgradeModalSub, setUpgradeModalSub] = useState<Subscription | null>(null);
  const [renewModalSub, setRenewModalSub] = useState<Subscription | null>(null);
  const [payments] = useState<SoftwarePayment[]>(DEFAULT_PAYMENTS);

  // ── Load from localStorage ─────────────
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.gateways?.length) setGateways(parsed.gateways);
        if (parsed.subscriptions?.length) setSubscriptions(parsed.subscriptions);
      } catch {
        // Use defaults
      }
    }
  }, []);

  const markChanged = () => setHasUnsavedChanges(true);

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

  // ── Gateway handlers ───────────────────
  const toggleSecret = (id: string, field: string) => {
    const key = `${id}-${field}`;
    setVisibleSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateGatewayField = (id: string, field: keyof PaymentGateway, value: unknown) => {
    setGateways(prev =>
      prev.map(gw =>
        gw.id === id ? { ...gw, [field]: value } : gw
      )
    );
    markChanged();
  };

  const startEditGateway = (gw: PaymentGateway) => {
    setEditingGatewayId(gw.id);
    setGatewayForm({ ...gw });
    markChanged();
  };

  const cancelEditGateway = () => {
    setEditingGatewayId(null);
    setGatewayForm({});
  };

  const saveGatewayForm = () => {
    if (!gatewayForm.id) return;
    setGateways(prev =>
      prev.map(gw => (gw.id === gatewayForm.id ? { ...gw, ...gatewayForm } as PaymentGateway : gw))
    );
    setEditingGatewayId(null);
    setGatewayForm({});
    markChanged();
    showSuccess('Gateway configuration updated.');
  };

  const addGateway = () => {
    const newGw: PaymentGateway = {
      id: `gw-${Date.now()}`,
      name: 'New Gateway',
      provider: 'mpesa',
      enabled: false,
      consumerKey: '',
      consumerSecret: '',
      passkey: '',
      shortcode: '',
      clientId: '',
      clientSecret: '',
      environment: 'sandbox',
      stripePublishableKey: '',
      stripeSecretKey: '',
      stripeWebhookSecret: '',
      webhookUrl: '',
      status: 'pending',
      lastSync: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setGateways(prev => [...prev, newGw]);
    setEditingGatewayId(newGw.id);
    setGatewayForm(newGw);
    markChanged();
  };

  const removeGateway = (id: string) => {
    if (!confirm('Remove this payment gateway?')) return;
    setGateways(prev => prev.filter(gw => gw.id !== id));
    markChanged();
    showSuccess('Gateway removed.');
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

  // ── Render: gateway field by provider ───
  const renderGatewayFields = (gw: PaymentGateway) => {
    const form = editingGatewayId === gw.id ? gatewayForm : gw;

    if (gw.provider === 'mpesa') {
      const mk = (f: keyof PaymentGateway) =>
        editingGatewayId === gw.id
          ? (form[f] as string) ?? ''
          : (gw[f] as string) ?? '';
      return (
        <div className="space-y-4 p-4 bg-slate-50 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Smartphone size={14} className="text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600">M-Pesa Credentials</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shortcode (Paybill / Till)</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input
                  value={mk('shortcode')}
                  onChange={e => {
                    if (editingGatewayId === gw.id) setGatewayForm(p => ({ ...p, shortcode: e.target.value }));
                    updateGatewayField(gw.id, 'shortcode', e.target.value);
                  }}
                  placeholder="e.g. 123456"
                  className="h-11 pl-9 rounded-xl bg-white border-none font-mono text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Passkey</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input
                  type={visibleSecrets[`${gw.id}-passkey`] ? 'text' : 'password'}
                  value={mk('passkey')}
                  onChange={e => {
                    if (editingGatewayId === gw.id) setGatewayForm(p => ({ ...p, passkey: e.target.value }));
                    updateGatewayField(gw.id, 'passkey', e.target.value);
                  }}
                  placeholder="Enter passkey..."
                  className="h-11 pl-9 pr-10 rounded-xl bg-white border-none font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret(gw.id, 'passkey')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                >
                  {visibleSecrets[`${gw.id}-passkey`] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Consumer Key</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input
                  type={visibleSecrets[`${gw.id}-consumerKey`] ? 'text' : 'password'}
                  value={mk('consumerKey')}
                  onChange={e => {
                    if (editingGatewayId === gw.id) setGatewayForm(p => ({ ...p, consumerKey: e.target.value }));
                    updateGatewayField(gw.id, 'consumerKey', e.target.value);
                  }}
                  placeholder="Consumer key..."
                  className="h-11 pl-9 pr-10 rounded-xl bg-white border-none font-mono text-sm"
                />
                <button type="button" onClick={() => toggleSecret(gw.id, 'consumerKey')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                  {visibleSecrets[`${gw.id}-consumerKey`] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Consumer Secret</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input
                  type={visibleSecrets[`${gw.id}-consumerSecret`] ? 'text' : 'password'}
                  value={mk('consumerSecret')}
                  onChange={e => {
                    if (editingGatewayId === gw.id) setGatewayForm(p => ({ ...p, consumerSecret: e.target.value }));
                    updateGatewayField(gw.id, 'consumerSecret', e.target.value);
                  }}
                  placeholder="Consumer secret..."
                  className="h-11 pl-9 pr-10 rounded-xl bg-white border-none font-mono text-sm"
                />
                <button type="button" onClick={() => toggleSecret(gw.id, 'consumerSecret')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                  {visibleSecrets[`${gw.id}-consumerSecret`] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Webhook URL</Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                value={mk('webhookUrl')}
                onChange={e => {
                  if (editingGatewayId === gw.id) setGatewayForm(p => ({ ...p, webhookUrl: e.target.value }));
                  updateGatewayField(gw.id, 'webhookUrl', e.target.value);
                }}
                placeholder="https://your-domain.com/webhooks/mpesa"
                className="h-11 pl-9 rounded-xl bg-white border-none font-mono text-sm"
              />
            </div>
          </div>
        </div>
      );
    }

    if (gw.provider === 'paypal') {
      const mk = (f: keyof PaymentGateway) =>
        editingGatewayId === gw.id
          ? (form[f] as string) ?? ''
          : (gw[f] as string) ?? '';
      return (
        <div className="space-y-4 p-4 bg-slate-50 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <CreditCardIcon size={14} className="text-blue-600" />
            <span className="text-xs font-black uppercase tracking-widest text-blue-600">PayPal Credentials</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client ID</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input
                  type={visibleSecrets[`${gw.id}-clientId`] ? 'text' : 'password'}
                  value={mk('clientId')}
                  onChange={e => {
                    if (editingGatewayId === gw.id) setGatewayForm(p => ({ ...p, clientId: e.target.value }));
                    updateGatewayField(gw.id, 'clientId', e.target.value);
                  }}
                  placeholder="Client ID..."
                  className="h-11 pl-9 pr-10 rounded-xl bg-white border-none font-mono text-sm"
                />
                <button type="button" onClick={() => toggleSecret(gw.id, 'clientId')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                  {visibleSecrets[`${gw.id}-clientId`] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client Secret</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input
                  type={visibleSecrets[`${gw.id}-clientSecret`] ? 'text' : 'password'}
                  value={mk('clientSecret')}
                  onChange={e => {
                    if (editingGatewayId === gw.id) setGatewayForm(p => ({ ...p, clientSecret: e.target.value }));
                    updateGatewayField(gw.id, 'clientSecret', e.target.value);
                  }}
                  placeholder="Client secret..."
                  className="h-11 pl-9 pr-10 rounded-xl bg-white border-none font-mono text-sm"
                />
                <button type="button" onClick={() => toggleSecret(gw.id, 'clientSecret')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                  {visibleSecrets[`${gw.id}-clientSecret`] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Environment</Label>
            <Select
              value={editingGatewayId === gw.id ? (gatewayForm.environment ?? gw.environment) : gw.environment}
              onValueChange={v => {
                if (editingGatewayId === gw.id) setGatewayForm(p => ({ ...p, environment: v as 'sandbox' | 'live' }));
                updateGatewayField(gw.id, 'environment', v);
              }}
            >
              <SelectTrigger className="h-11 rounded-xl bg-white border-none font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                <SelectItem value="live">Live (Production)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Webhook URL</Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                value={mk('webhookUrl')}
                onChange={e => {
                  if (editingGatewayId === gw.id) setGatewayForm(p => ({ ...p, webhookUrl: e.target.value }));
                  updateGatewayField(gw.id, 'webhookUrl', e.target.value);
                }}
                placeholder="https://your-domain.com/webhooks/paypal"
                className="h-11 pl-9 rounded-xl bg-white border-none font-mono text-sm"
              />
            </div>
          </div>
        </div>
      );
    }

    if (gw.provider === 'stripe') {
      const mk = (f: keyof PaymentGateway) =>
        editingGatewayId === gw.id
          ? (form[f] as string) ?? ''
          : (gw[f] as string) ?? '';
      return (
        <div className="space-y-4 p-4 bg-slate-50 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <CreditCardIcon size={14} className="text-violet-600" />
            <span className="text-xs font-black uppercase tracking-widest text-violet-600">Stripe Credentials</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Publishable Key</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input
                  type={visibleSecrets[`${gw.id}-stripePublishableKey`] ? 'text' : 'password'}
                  value={mk('stripePublishableKey')}
                  onChange={e => {
                    if (editingGatewayId === gw.id) setGatewayForm(p => ({ ...p, stripePublishableKey: e.target.value }));
                    updateGatewayField(gw.id, 'stripePublishableKey', e.target.value);
                  }}
                  placeholder="pk_live_..."
                  className="h-11 pl-9 pr-10 rounded-xl bg-white border-none font-mono text-sm"
                />
                <button type="button" onClick={() => toggleSecret(gw.id, 'stripePublishableKey')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                  {visibleSecrets[`${gw.id}-stripePublishableKey`] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secret Key</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input
                  type={visibleSecrets[`${gw.id}-stripeSecretKey`] ? 'text' : 'password'}
                  value={mk('stripeSecretKey')}
                  onChange={e => {
                    if (editingGatewayId === gw.id) setGatewayForm(p => ({ ...p, stripeSecretKey: e.target.value }));
                    updateGatewayField(gw.id, 'stripeSecretKey', e.target.value);
                  }}
                  placeholder="sk_live_..."
                  className="h-11 pl-9 pr-10 rounded-xl bg-white border-none font-mono text-sm"
                />
                <button type="button" onClick={() => toggleSecret(gw.id, 'stripeSecretKey')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                  {visibleSecrets[`${gw.id}-stripeSecretKey`] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Webhook Secret</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input
                  type={visibleSecrets[`${gw.id}-stripeWebhookSecret`] ? 'text' : 'password'}
                  value={mk('stripeWebhookSecret')}
                  onChange={e => {
                    if (editingGatewayId === gw.id) setGatewayForm(p => ({ ...p, stripeWebhookSecret: e.target.value }));
                    updateGatewayField(gw.id, 'stripeWebhookSecret', e.target.value);
                  }}
                  placeholder="whsec_..."
                  className="h-11 pl-9 pr-10 rounded-xl bg-white border-none font-mono text-sm"
                />
                <button type="button" onClick={() => toggleSecret(gw.id, 'stripeWebhookSecret')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                  {visibleSecrets[`${gw.id}-stripeWebhookSecret`] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Webhook URL</Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                value={mk('webhookUrl')}
                onChange={e => {
                  if (editingGatewayId === gw.id) setGatewayForm(p => ({ ...p, webhookUrl: e.target.value }));
                  updateGatewayField(gw.id, 'webhookUrl', e.target.value);
                }}
                placeholder="https://your-domain.com/webhooks/stripe"
                className="h-11 pl-9 rounded-xl bg-white border-none font-mono text-sm"
              />
            </div>
          </div>
        </div>
      );
    }

    // Generic bank / card
    return null;
  };

  const providerIcon = (p: PaymentGateway['provider']) => {
    switch (p) {
      case 'mpesa': return <Smartphone size={20} />;
      case 'paypal': return <CreditCardIcon size={20} />;
      case 'stripe': return <CreditCardIcon size={20} />;
      case 'card': return <CreditCardIcon size={20} />;
      case 'bank': return <Landmark size={20} />;
    }
  };

  const providerColor = (p: PaymentGateway['provider']) => {
    switch (p) {
      case 'mpesa': return 'bg-emerald-50 text-emerald-600';
      case 'paypal': return 'bg-blue-50 text-blue-600';
      case 'stripe': return 'bg-violet-50 text-violet-600';
      case 'card': return 'bg-indigo-50 text-indigo-600';
      case 'bank': return 'bg-slate-100 text-slate-600';
    }
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-14 mb-8 flex overflow-x-auto">
          <TabsTrigger value="subscriptions" className="rounded-xl px-8 h-full font-bold text-xs gap-2">
            <RefreshCw size={16} /> Subscriptions
          </TabsTrigger>
          <TabsTrigger value="gateways" className="rounded-xl px-8 h-full font-bold text-xs gap-2">
            <Globe size={16} /> Payment Gateways
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-xl px-8 h-full font-bold text-xs gap-2">
            <DollarSign size={16} /> Payment History
          </TabsTrigger>
        </TabsList>

        {/* ──────────────────────────────────────── */}
        {/* SUBSCRIPTIONS TAB */}
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
        </TabsContent>

        {/* ──────────────────────────────────────── */}
        {/* PAYMENT GATEWAYS TAB */}
        {/* ──────────────────────────────────────── */}
        <TabsContent value="gateways" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Financial Gateway Configuration</h2>
              <p className="text-sm text-slate-500">
                Configure API keys, merchant credentials, and webhook endpoints for each payment processor.
              </p>
            </div>
            <Button
              onClick={addGateway}
              className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg"
            >
              <Plus size={16} /> Add Gateway
            </Button>
          </div>

          <div className="space-y-4">
            {gateways.map(gw => (
              <Card key={gw.id} className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-2xl", providerColor(gw.provider))}>
                        {providerIcon(gw.provider)}
                      </div>
                      <div>
                        <CardTitle className="text-base font-black text-slate-900">
                          {editingGatewayId === gw.id ? (
                            <Input
                              value={gatewayForm.name ?? gw.name}
                              onChange={e => {
                                setGatewayForm(p => ({ ...p, name: e.target.value }));
                                updateGatewayField(gw.id, 'name', e.target.value);
                              }}
                              className="h-8 rounded-xl bg-slate-50 border-none font-bold text-base"
                            />
                          ) : gw.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {editingGatewayId === gw.id ? (
                            <Select
                              value={gatewayForm.provider ?? gw.provider}
                              onValueChange={v => {
                                setGatewayForm(p => ({ ...p, provider: v as PaymentGateway['provider'] }));
                                updateGatewayField(gw.id, 'provider', v);
                              }}
                            >
                              <SelectTrigger className="h-7 rounded-lg bg-slate-50 border-none text-xs font-bold w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mpesa">M-Pesa</SelectItem>
                                <SelectItem value="paypal">PayPal</SelectItem>
                                <SelectItem value="stripe">Stripe</SelectItem>
                                <SelectItem value="card">Card (Generic)</SelectItem>
                                <SelectItem value="bank">Bank Transfer</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-xs text-slate-400 font-medium">
                              {gw.provider.toUpperCase()} • Last sync: {gw.lastSync}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(gw.status)}
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-500">Enabled</p>
                        <Switch
                          checked={gw.enabled}
                          onCheckedChange={() => updateGatewayField(gw.id, 'enabled', !gw.enabled)}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {renderGatewayFields(gw)}

                  <div className="flex justify-end gap-2 pt-2">
                    {editingGatewayId === gw.id ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={cancelEditGateway}
                          className="rounded-xl h-10 font-bold border-slate-200"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={saveGatewayForm}
                          className="rounded-xl h-10 bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-lg gap-1.5"
                        >
                          <Check size={14} /> Save Gateway
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeGateway(gw.id)}
                          className="rounded-xl h-9 text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50 gap-1.5"
                        >
                          <Trash2 size={14} /> Remove
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditGateway(gw)}
                          className="rounded-xl h-9 text-xs font-bold border-slate-200 gap-1.5"
                        >
                          <Edit3 size={14} /> Configure
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {gateways.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mb-4">
                  <Globe size={32} />
                </div>
                <p className="text-lg font-black text-slate-700">No Payment Gateways Configured</p>
                <p className="text-sm text-slate-400 mt-1">Add a payment gateway to start accepting digital payments.</p>
                <Button onClick={addGateway} className="mt-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2">
                  <Plus size={16} /> Add Your First Gateway
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ──────────────────────────────────────── */}
        {/* PAYMENT HISTORY TAB */}
        {/* ──────────────────────────────────────── */}
        <TabsContent value="payments" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                  <History size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg font-black text-slate-900">Software Payment History</CardTitle>
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
            <Select defaultValue={renewModalSub?.interval ?? 'monthly'} onValueChange={v => {
              // handled inline
            }}>
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
    </div>
  );
};

// Small Users icon helper
function Users({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export default PaymentManagement;
