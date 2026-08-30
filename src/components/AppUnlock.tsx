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
  validityLabel,
  devBypass,
  shouldShowLicenseGate,
  isExemptRole,
  isLicenseExpiredAt,
  daysRemainingUntil,
  CURRENT_AUTH_ROLE_KEY,
  LICENSE_EXEMPT_ROLES,
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
  const remaining = daysRemainingUntil(license.expiresAt);
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

  // Auto-format: strip non-alphanumeric, uppercase, then insert dashes every 4 chars.
  // No maxLength — full keys like MUNYAKA-2026-A3B7-X9K2-M8N4-R7T1 (30 chars) paste cleanly.
  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const formatted = raw.match(/.{1,4}/g)?.join('-') ?? raw;
    setKey(formatted);
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
            className="h-14 pl-12 pr-14 rounded-2xl bg-slate-50 border-none font-mono font-bold text-sm tracking-wider text-center min-w-0"
            autoComplete="off"
            autoFocus
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

        {/* Emergency dev bypass — always visible, no key required */}
        <button
          type="button"
          onClick={() => { devBypass(); onSuccess(); }}
          className="w-full mt-1 text-[10px] font-mono text-indigo-400/70 hover:text-indigo-400 underline underline-offset-2 transition-colors"
        >
          Skip / Force Activate (dev)
        </button>
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
  /** Optional override of the currently signed-in role. When provided
   *  the lock screen uses this value instead of reading
   *  `munyaka_current_auth_role` from localStorage. This is useful for
   *  page-level components that already know the role and want to avoid
   *  the first-paint flash where the role is briefly undefined.
   */
  currentRole?: string | null;
}

const AppUnlock = ({ children, forceShow = false, currentRole }: AppUnlockProps) => {
  const [activeLicense, setActiveLicense] = useState<License | null>(() => getActiveLicense());
  const [stats, setStats] = useState(() => getAllLicenses().length);
  const [now, setNow] = useState<Date>(() => new Date());

  // Resolved current role — prefer the prop if supplied, otherwise read
  // the AuthContext value from localStorage. If neither is available we
  // fall back to `null` (no role) which the gate logic treats as
  // "non-exempt, so lock if no license".
  const [authRole, setAuthRole] = useState<string | null>(() => currentRole ?? readAuthRole());

  useEffect(() => {
    // Re-read whenever the tab regains focus or the storage changes —
    // this is how we pick up a login happening in another tab / a
    // logout that flips the role back to null.
    const onFocus = () => {
      setActiveLicense(getActiveLicense());
      setStats(getAllLicenses().length);
      setNow(new Date());
      setAuthRole(currentRole ?? readAuthRole());
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'munyaka_session' || e.key === CURRENT_AUTH_ROLE_KEY || e.key === null) {
        onFocus();
      }
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
    };
  }, [currentRole]);

  // Tick the wall clock every 30 seconds so the "11:59 PM lock" event
  // fires within at most ~30s of when the system clock crosses midnight
  // on the actual `nextBillingDate` day. (We don't want to be too
  // aggressive — 30s strikes a reasonable balance between reactivity
  // and idle-timer noise.)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const isLocked = forceShow || shouldShowLicenseGate({ currentRole: authRole });

  // ── Locked: full-screen gate ──────────────────
  if (isLocked) {
    // Surface whether the lock is exempt-able so the user knows the
    // Owner can still reach the renewal screen.
    const isExempt = isExemptRole(authRole);
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
                onSuccess={() => {
                  setActiveLicense(getActiveLicense());
                  setStats(getAllLicenses().length);
                  setNow(new Date());
                }}
              />

              {/* Exempt-role hint — visible only to Owners / Super Admins
                  so they know the renewal workflow is still available to
                  them after they sign in. */}
              {isExempt && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-bold">
                  <ShieldCheck size={14} className="shrink-0" />
                  <span>
                    You are signed in as <strong>{authRole}</strong>. After activating
                    the license above, you'll have full access to the
                    Payment & Subscriptions workspace to manage renewals.
                  </span>
                </div>
              )}

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
      <div className="fixed top-3 right-3 z-50">
        <button
          onClick={() => {
            setActiveLicense(getActiveLicense());
            setStats(getAllLicenses().length);
            setNow(new Date());
          }}
          title={`Active License: ${activeLicense ? activeLicense.activationKey.slice(0, 8) + '...' : 'None'} | ${activeLicense ? daysRemainingUntil(activeLicense.expiresAt) : 0} days remaining`}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:scale-105",
            activeLicense && daysRemainingUntil(activeLicense.expiresAt) <= 7
              ? "bg-amber-500 shadow-amber-500/30 animate-pulse"
              : "bg-emerald-600 shadow-emerald-600/30"
          )}
        >
          <ShieldCheck size={12} />
          <span>Licensed</span>
          <span className="opacity-60">·</span>
          <span>{activeLicense ? daysRemainingUntil(activeLicense.expiresAt) : 0}d left</span>
          <RefreshCw size={10} className="opacity-60" />
        </button>
      </div>

      {/* Pass children through */}
      {children}
    </div>
  );
};

/** Read the currently authenticated role from localStorage. */
function readAuthRole(): string | null {
  try {
    return localStorage.getItem(CURRENT_AUTH_ROLE_KEY);
  } catch {
    return null;
  }
}

export default AppUnlock;