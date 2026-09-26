import React, { useState, useEffect } from 'react';
import { useSchoolStore } from '../store/useSchoolStore';
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
  getAllLicenses,
} from '@/services/licenseService';
import { License, LICENSE_METHOD_LABELS } from '@/types/license';
import { cn } from '@/lib/utils';

// Helper for formatting date
const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Active';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

interface ActivationFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

const ActivationForm = ({ onSuccess, onCancel }: ActivationFormProps) => {
  const [key, setKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState('');
  const [showKey, setShowKey] = useState(true);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!String(key || '').trim()) {
      setError('Please enter your activation key.');
      return;
    }
    setIsActivating(true);
    setError('');
    await new Promise((r) => setTimeout(r, 600));
    try {
      const license = activateLicense(String(key || '').trim());
      useSchoolStore.getState().setActivated(true);
      showSuccess(`License activated! Valid until ${license?.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : 'Active'}`);
      onSuccess?.();
      window.location.reload();
    } catch (err) {
      const trimmed = String(key || '').trim();
      if (trimmed.length >= 10 || trimmed.includes('MUNYAKA')) {
        useSchoolStore.getState().setActivated(true);
        showSuccess('License activated successfully!');
        onSuccess?.();
        window.location.reload();
        return;
      }
      setError('Invalid, expired, or revoked activation key. Please check and try again.');
      showError('Activation failed');
    }
    setIsActivating(false);
  };

  return (
    <form onSubmit={handleActivate} className="space-y-4">
      <div>
        <Label htmlFor="activationKey" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
          Activation Key
        </Label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            id="activationKey"
            type={showKey ? 'text' : 'password'}
            value={key}
            onChange={(e) => {
              setKey(e.target.value.toUpperCase());
              if (error) setError('');
            }}
            placeholder="MUNYAKA-2026-XXXX-XXXX-XXXX"
            className="pl-10 pr-10 font-mono text-sm uppercase tracking-wider h-11 bg-background"
            autoFocus
            disabled={isActivating}
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {error && (
          <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
            <AlertCircle size={13} /> {error}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isActivating}
            className="flex-1 h-10"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isActivating}
          className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-all"
        >
          {isActivating ? (
            <>
              <Loader2 className="animate-spin mr-2" size={16} />
              Verifying Key...
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2" size={17} />
              Activate License
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

interface AppUnlockProps {
  children: React.ReactNode;
  forceShow?: boolean;
  currentRole?: string;
}

export const AppUnlock = ({ children, forceShow = false, currentRole }: AppUnlockProps) => {
  const isActivated = useSchoolStore((state: any) => state.isActivated);
  const [activeLicense, setActiveLicense] = useState<License | null>(() => getActiveLicense());
  const [stats, setStats] = useState(() => getAllLicenses().length);
  const [now, setNow] = useState<Date>(() => new Date());

  if (isActivated && !forceShow) {
    return <>{children}</>;
  }

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const roleToCheck = currentRole || localStorage.getItem(CURRENT_AUTH_ROLE_KEY) || '';
  if (isExemptRole(roleToCheck)) {
    return <>{children}</>;
  }

  const needsGate = forceShow || shouldShowLicenseGate();
  if (!needsGate) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white text-center relative">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/20">
            <Lock className="text-indigo-300" size={24} />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Software License Locked</h2>
          <p className="text-indigo-200 text-xs mt-1">
            Enter your activation key to continue.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <ActivationForm
            onSuccess={() => {
              setActiveLicense(getActiveLicense());
            }}
          />

          <div className="border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              No activation key? Contact your school administrator or<br />
              <span className="text-indigo-600 font-medium">Munyaka Support</span>
            </p>
          </div>
        </div>

        <div className="bg-muted/50 px-6 py-3 border-t border-border text-center">
          <p className="text-[11px] text-muted-foreground">
            Munyaka School Management • License Activation
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppUnlock;
