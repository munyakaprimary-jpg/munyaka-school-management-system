"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Lock,
  Unlock,
  Key,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Smartphone,
  Eye,
  EyeOff,
  RefreshCw,
  Wifi,
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import {
  activateLicense,
  getActiveLicense,
  getLicenseStats,
  validityLabel,
  devBypass,
} from '@/services/licenseService';
import { License, LICENSE_METHOD_LABELS } from '@/types/license';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function daysRemaining(expiresAt: string): number {
  const today = new Date().toISOString().slice(0, 10);
  const diff = new Date(expiresAt).getTime() - new Date(today).getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

interface StatusBadgeProps {
  license: License;
}
const StatusBadge = ({ license }: StatusBadgeProps) => {
  if (license.status === 'revoked') {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
        <AlertCircle size={12} /> Revoked
      </span>
    );
  }
  const remaining = daysRemaining(license.expiresAt);
  if (remaining <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-xs font-bold">
        <AlertCircle size={12} /> Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
      <CheckCircle2 size={12} /> {remaining} day{remaining !== 1 ? 's' : ''} left
    </span>
  );
};

interface ActivationFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

const ActivationForm = ({ onSuccess, onCancel }: ActivationFormProps) => {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState('');

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) { setError('Please enter your activation key.'); return; }
    setIsActivating(true);
    setError('');
    await new Promise(r => setTimeout(r, 800));
    try {
      const license = activateLicense(key.trim());
      showSuccess(`License activated! Valid until ${formatDate(license.expiresAt)}`);
      onSuccess();
    } catch (err) {
      setError('Invalid, expired, or revoked activation key. Please check and try again.');
      showError('Activation failed');
    }
    setIsActivating(false);
  };

  // Auto-format: insert dashes every 4 chars
  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const formatted = raw.match(/.{1,4}/g)?.join('-') ?? raw;
    setKey(formatted.slice(0, 28));
    setError('');
  };

  return (
    <form onSubmit={handleActivate} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Key input */}
      <div className="space-y-2">
        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
          Activation Key
        </Label>
        <div className="relative">
          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            type={showKey ? 'text' : 'password'}
            value={key}
            onChange={handleKeyChange}
            placeholder="MUNYAKA-2026-XXXX-XXXX-XXXX-XXXX"
            className="h-14 pl-12 pr-14 rounded-2xl bg-slate-50 border-none font-mono font-bold text-base tracking-wider text-center"
            autoComplete="off"
            autoFocus
            maxLength={28}
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 font-medium text-center">
          Format: MUNYAKA-YYYY-XXXX-XXXX-XXXX-XXXX
        </p>
      </div>

      {/* Sample code hint */}
      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">
          Sample Format
        </p>
        <p className="font-mono font-bold text-indigo-700 text-sm tracking-widest">
          MUNYAKA-2026-A3B7-X9K2-M8N4-R7T1
        </p>
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}
            className="flex-1 rounded-xl font-bold h-12 border border-slate-200">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isActivating || !key.trim()}
          className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black h-12 shadow-xl shadow-indigo-100 text-white gap-2">
          {isActivating ? <Loader2 className="animate-spin" size={18} /> : <Unlock size={18} />}
          {isActivating ? 'Activating...' : 'Activate License'}
        </Button>
      </div>
    </form>
  );
};

// ─────────────────────────────────────────────
// Main AppUnlock component
// ─────────────────────────────────────────────
interface AppUnlockProps {
  children: React.ReactNode;
  /** If true, always show the unlock screen (force gate). Default: false (gate only when locked). */
  forceShow?: boolean;
}

const AppUnlock = ({ children, forceShow = false }: AppUnlockProps) => {
  const [activeLicense, setActiveLicense] = useState<License | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, revoked: 0 });
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => {
    setActiveLicense(getActiveLicense());
    setStats(getLicenseStats());
    setRefreshKey(k => k + 1);
  };

  useEffect(() => { refresh(); }, [refreshKey]);

  const isLocked = forceShow || !activeLicense;

  // ── Locked: full-screen gate ──────────────────
  if (isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-5 backdrop-blur-sm border border-white/20 shadow-2xl">
              <Lock size={36} className="text-indigo-300" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">App Locked</h1>
            <p className="text-indigo-300 text-sm mt-2 font-medium">
              This application requires a valid license to operate.<br />
              Enter your activation key to continue.
            </p>
          </div>

          {/* Card */}
          <Card className="border-none shadow-2xl rounded-3xl bg-white/95 backdrop-blur-md overflow-hidden">
            <CardContent className="p-7 space-y-6">
              {/* Offline / connectivity hint */}
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-xs font-bold">
                <Wifi size={14} className="shrink-0" />
                <span>Works offline — no internet required to activate. License is stored locally on this device.</span>
              </div>

              <ActivationForm
                onSuccess={() => { refresh(); }}
              />

              <div className="border-t border-slate-100 pt-4 text-center">
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  No activation key? Contact your school administrator or<br />
                  system administrator to purchase or renew a license.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <ShieldCheck size={14} className="text-indigo-400" />
            <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">
              Munyaka School Management • License Activation
            </p>
          </div>

          {/* Developer bypass — only visible in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={devBypass}
                className="text-[10px] font-mono text-indigo-500/60 hover:text-indigo-400 underline underline-offset-2 transition-colors"
              >
                Dev Bypass — activate with master key
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Unlocked: show active license indicator, render children ──
  return (
    <div className="relative">
      {/* Floating license indicator (top-right) */}
      <div className="fixed top-3 right-3 z-50" key={refreshKey}>
        <button
          onClick={refresh}
          title={`Active License: ${activeLicense.activationKey.slice(0, 8)}... | ${daysRemaining(activeLicense.expiresAt)} days remaining`}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:scale-105",
            daysRemaining(activeLicense.expiresAt) <= 7
              ? "bg-amber-500 shadow-amber-500/30 animate-pulse"
              : "bg-emerald-600 shadow-emerald-600/30"
          )}
        >
          <ShieldCheck size={12} />
          <span>Licensed</span>
          <span className="opacity-60">·</span>
          <span>{daysRemaining(activeLicense.expiresAt)}d left</span>
          <RefreshCw size={10} className="opacity-60" />
        </button>
      </div>

      {/* Pass children through */}
      {children}
    </div>
  );
};

export default AppUnlock;
