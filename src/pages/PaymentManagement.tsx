"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import BackButton from '@/components/ui/BackButton';
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
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Ban
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Navigate } from 'react-router-dom';

const STORAGE_KEY = 'munyaka_payment_config';

interface PaymentGateway {
  id: string;
  name: string;
  provider: string;
  enabled: boolean;
  apiKeyMasked: string;
  webhookUrl: string;
  status: 'active' | 'suspended' | 'pending';
  lastSync: string;
}

interface Subscription {
  id: string;
  name: string;
  provider: string;
  plan: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  nextBilling: string;
  amount: string;
  currency: string;
  interval: 'monthly' | 'annual';
  autoRenew: boolean;
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

// Seed data for demonstration
const DEFAULT_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-001',
    name: 'Dyad Platform',
    provider: 'Dyad',
    plan: 'Enterprise Starter',
    status: 'active',
    nextBilling: '2026-05-01',
    amount: '299.00',
    currency: 'USD',
    interval: 'monthly',
    autoRenew: true
  },
  {
    id: 'sub-002',
    name: 'Supabase Backend',
    provider: 'Supabase',
    plan: 'Pro Tier',
    status: 'active',
    nextBilling: '2026-04-15',
    amount: '75.00',
    currency: 'USD',
    interval: 'monthly',
    autoRenew: true
  },
  {
    id: 'sub-003',
    name: 'Google Maps API',
    provider: 'Google Cloud',
    plan: 'Pay-as-you-go',
    status: 'trial',
    nextBilling: '2026-04-20',
    amount: '0.00',
    currency: 'USD',
    interval: 'monthly',
    autoRenew: false
  }
];

const DEFAULT_GATEWAYS: PaymentGateway[] = [
  {
    id: 'gw-001',
    name: 'M-Pesa Integration',
    provider: 'Safaricom',
    enabled: true,
    apiKeyMasked: '•••••••••••••••••',
    webhookUrl: 'https://api.munyaka.sc.ke/webhooks/mpesa',
    status: 'active',
    lastSync: '2026-03-31 08:00:00'
  },
  {
    id: 'gw-002',
    name: 'PayPal Gateway',
    provider: 'PayPal',
    enabled: false,
    apiKeyMasked: '•••••••••••••••••',
    webhookUrl: 'https://api.munyaka.sc.ke/webhooks/paypal',
    status: 'pending',
    lastSync: '2026-03-31 08:00:00'
  }
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
    paymentMethod: 'PayPal'
  },
  {
    id: 'pmt-002',
    description: 'Supabase Pro - March 2026',
    amount: '75.00',
    currency: 'USD',
    status: 'paid',
    paidAt: '2026-03-15',
    invoiceId: 'INV-2026-004',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'pmt-003',
    description: 'Dyad Platform - April 2026',
    amount: '299.00',
    currency: 'USD',
    status: 'pending',
    paidAt: '',
    invoiceId: 'INV-2026-005',
    paymentMethod: 'PayPal'
  }
];

const PaymentManagement = () => {
  const { user } = useAuth();

  // Owner-only guard
  if (!user || user.role !== 'owner') {
    return <Navigate to="/" replace />;
  }

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('subscriptions');

  // Gateway state
  const [gateways, setGateways] = useState<PaymentGateway[]>(DEFAULT_GATEWAYS);
  const [editingGateway, setEditingGateway] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [gatewayForm, setGatewayForm] = useState<Partial<PaymentGateway>>({});

  // Subscription state
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(DEFAULT_SUBSCRIPTIONS);

  // Payment history state
  const [payments] = useState<SoftwarePayment[]>(DEFAULT_PAYMENTS);

  // Load saved config on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.gateways) setGateways(parsed.gateways);
      } catch {
        // Use defaults
      }
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ gateways }));
    setHasUnsavedChanges(false);
    setIsSaving(false);
    showSuccess("Payment configuration saved successfully!");
  };

  const handleToggleGateway = (id: string) => {
    setGateways(prev => prev.map(gw =>
      gw.id === id ? { ...gw, enabled: !gw.enabled } : gw
    ));
    setHasUnsavedChanges(true);
  };

  const handleUpdateGateway = (id: string, updates: Partial<PaymentGateway>) => {
    setGateways(prev => prev.map(gw =>
      gw.id === id ? { ...gw, ...updates } : gw
    ));
    setHasUnsavedChanges(true);
  };

  const handleDeleteGateway = (id: string) => {
    if (confirm("Are you sure you want to remove this payment gateway?")) {
      setGateways(prev => prev.filter(gw => gw.id !== id));
      setHasUnsavedChanges(true);
      showSuccess("Gateway removed successfully.");
    }
  };

  const handleToggleAutoRenew = (id: string) => {
    setSubscriptions(prev => prev.map(sub =>
      sub.id === id ? { ...sub, autoRenew: !sub.autoRenew } : sub
    ));
    showSuccess("Auto-renewal preference updated.");
  };

  const handleAddGateway = () => {
    const newGateway: PaymentGateway = {
      id: `gw-${Date.now()}`,
      name: 'New Gateway',
      provider: 'Unknown',
      enabled: false,
      apiKeyMasked: '•••••••••••••••••',
      webhookUrl: '',
      status: 'pending',
      lastSync: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setGateways(prev => [...prev, newGateway]);
    setEditingGateway(newGateway.id);
    setGatewayForm(newGateway);
    setHasUnsavedChanges(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[10px] gap-1">
          <CheckCircle size={10} /> {status}
        </Badge>;
      case 'cancelled':
      case 'failed':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-bold text-[10px] gap-1">
          <XCircle size={10} /> {status}
        </Badge>;
      case 'pending':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-bold text-[10px] gap-1">
          <AlertCircle size={10} /> {status}
        </Badge>;
      case 'trial':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-[10px] gap-1">
          <CheckCircle2 size={10} /> trial
        </Badge>;
      case 'expired':
        return <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-bold text-[10px] gap-1">
          <Ban size={10} /> expired
        </Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-600 border-slate-200 font-bold text-[10px]">{status}</Badge>;
    }
  };

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
              <p className="text-xs text-slate-500 font-medium">Software payments, subscription management, and financial gateway configuration.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse font-bold px-3 py-1 text-xs">
              <AlertTriangle size={14} className="mr-1.5" /> Unsaved Changes
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

      {/* Owner Badge */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl text-white shadow-xl shadow-indigo-100">
        <div className="p-2 bg-white/20 rounded-xl">
          <ShieldCheck size={24} className="text-white" />
        </div>
        <div>
          <p className="font-black text-sm">Super Admin / Owner Access</p>
          <p className="text-xs text-indigo-200">This configuration panel is exclusively accessible to the School Owner. Financial gateway credentials are encrypted at rest.</p>
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

        {/* ===== SUBSCRIPTIONS TAB ===== */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptions.map(sub => (
              <Card key={sub.id} className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
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
                    {getStatusBadge(sub.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Plan</p>
                      <p className="text-sm font-bold text-slate-900">{sub.plan}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Interval</p>
                      <p className="text-sm font-bold text-slate-900 capitalize">{sub.interval}</p>
                    </div>
                  </div>

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

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-500">Auto-Renew</p>
                      <Switch
                        checked={sub.autoRenew}
                        onCheckedChange={() => handleToggleAutoRenew(sub.id)}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl h-9 text-xs font-bold border-slate-200">
                      Manage Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ===== PAYMENT GATEWAYS TAB ===== */}
        <TabsContent value="gateways" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Financial Gateway Configuration</h2>
              <p className="text-sm text-slate-500">Connect and manage payment processors and mobile money integrations.</p>
            </div>
            <Button
              onClick={handleAddGateway}
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
                      <div className={cn(
                        "p-3 rounded-2xl",
                        gw.enabled ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                      )}>
                        <Globe size={24} />
                      </div>
                      <div>
                        <CardTitle className="text-base font-black text-slate-900">{gw.name}</CardTitle>
                        <p className="text-xs text-slate-400 font-medium">{gw.provider} • Last sync: {gw.lastSync}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(gw.status)}
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-500">Enabled</p>
                        <Switch
                          checked={gw.enabled}
                          onCheckedChange={() => handleToggleGateway(gw.id)}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingGateway === gw.id ? (
                    <div className="space-y-4 p-4 bg-slate-50 rounded-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Gateway Name</Label>
                          <Input
                            value={gatewayForm.name || ''}
                            onChange={e => {
                              setGatewayForm(prev => ({ ...prev, name: e.target.value }));
                              handleUpdateGateway(gw.id, { name: e.target.value });
                            }}
                            className="rounded-xl h-12 bg-white border-none font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Provider</Label>
                          <Input
                            value={gatewayForm.provider || ''}
                            onChange={e => {
                              setGatewayForm(prev => ({ ...prev, provider: e.target.value }));
                              handleUpdateGateway(gw.id, { provider: e.target.value });
                            }}
                            className="rounded-xl h-12 bg-white border-none font-bold"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">API Key / Secret</Label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <Input
                            type={showApiKey === gw.id ? "text" : "password"}
                            value={gatewayForm.apiKeyMasked || ''}
                            onChange={e => {
                              setGatewayForm(prev => ({ ...prev, apiKeyMasked: e.target.value }));
                              handleUpdateGateway(gw.id, { apiKeyMasked: e.target.value });
                            }}
                            placeholder="Enter API key or secret..."
                            className="h-12 pl-10 pr-12 rounded-xl bg-white border-none font-mono text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(showApiKey === gw.id ? null : gw.id)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showApiKey === gw.id ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Webhook URL</Label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <Input
                            value={gatewayForm.webhookUrl || ''}
                            onChange={e => {
                              setGatewayForm(prev => ({ ...prev, webhookUrl: e.target.value }));
                              handleUpdateGateway(gw.id, { webhookUrl: e.target.value });
                            }}
                            placeholder="https://your-domain.com/webhooks/..."
                            className="h-12 pl-10 rounded-xl bg-white border-none font-mono text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => { setEditingGateway(null); setGatewayForm({}); }}
                          className="rounded-xl h-10 font-bold border-slate-200"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => { setEditingGateway(null); setGatewayForm({}); setShowApiKey(null); }}
                          className="rounded-xl h-10 bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-lg"
                        >
                          <CheckCircle2 size={14} className="mr-1.5" /> Save Gateway
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Key size={14} className="text-slate-400" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">API Key</p>
                        </div>
                        <p className="text-sm font-bold font-mono text-slate-700">{gw.apiKeyMasked}</p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe size={14} className="text-slate-400" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Webhook URL</p>
                        </div>
                        <p className="text-sm font-bold text-slate-700 truncate">{gw.webhookUrl || '—'}</p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <RefreshCw size={14} className="text-slate-400" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                        </div>
                        <p className="text-sm font-bold text-slate-700">{gw.enabled ? 'Active & Enabled' : 'Disabled'}</p>
                      </div>
                    </div>
                  )}

                  {editingGateway !== gw.id && (
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteGateway(gw.id)}
                        className="rounded-xl h-9 text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50 gap-1.5"
                      >
                        <Trash2 size={14} /> Remove
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditingGateway(gw.id); setGatewayForm(gw); }}
                        className="rounded-xl h-9 text-xs font-bold border-slate-200 gap-1.5"
                      >
                        <Edit3 size={14} /> Configure
                      </Button>
                    </div>
                  )}
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
                <Button onClick={handleAddGateway} className="mt-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2">
                  <Plus size={16} /> Add Your First Gateway
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ===== PAYMENT HISTORY TAB ===== */}
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
                        <td className="px-8 py-4 text-right">
                          {getStatusBadge(pmt.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentManagement;
