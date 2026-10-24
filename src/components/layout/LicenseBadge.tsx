import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/config/firebase';
import { doc, getDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import { getActiveLicense, daysRemainingUntil, parseDDMMYYYY } from '@/services/licenseService';

interface LicenseBadgeProps {
  className?: string;
}

export const LicenseBadge: React.FC<LicenseBadgeProps> = ({ className = '' }) => {
  const [expiryDate, setExpiryDate] = useState<string>(() => {
    const active = getActiveLicense();
    if (active?.expiresAt) return active.expiresAt;
    return localStorage.getItem('school_license_expiry') ||
           localStorage.getItem('activation_expires_at') ||
           new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  });
  const [licenseStatus, setLicenseStatus] = useState<string>(() => {
    const active = getActiveLicense();
    if (active) return 'active';
    return localStorage.getItem('school_license_status') || 'active';
  });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Dynamic Days Remaining Calculation based on monthly due date and grace period
  const calculateDaysRemaining = (dueDateStr: string, gracePeriodDays: number = 3) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(dueDateStr);
    // Add grace period to total active window
    dueDate.setDate(dueDate.getDate() + gracePeriodDays);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  const calculateDaysLeft = (expiryDateStr?: string) => {
    if (!expiryDateStr) {
      // Default to end of current month with 3-day grace period
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
      return calculateDaysRemaining(endOfMonth, 3);
    }
    return calculateDaysRemaining(expiryDateStr, 3);
  };

  const fetchLicenseFromFirestore = useCallback(async (showToast = false) => {
    setIsRefreshing(true);
    try {
      let fetchedExpiry: string | null = null;
      let fetchedStatus = 'active';

      // Fetch from Firestore (school_settings, system_config, school_settings_v1)
      if (db) {
        try {
          // Check school_settings/config
          const settingsRef = doc(db, 'school_settings', 'config');
          const settingsSnap = await getDoc(settingsRef);
          if (settingsSnap.exists()) {
            const data = settingsSnap.data();
            if (data.licenseExpiryDate) fetchedExpiry = data.licenseExpiryDate;
            if (data.expiresAt) fetchedExpiry = data.expiresAt;
            if (data.licenseStatus) fetchedStatus = data.licenseStatus;
          } else {
            // Check system_config/license
            const systemRef = doc(db, 'system_config', 'license');
            const systemSnap = await getDoc(systemRef);
            if (systemSnap.exists()) {
              const data = systemSnap.data();
              if (data.expiryDate) fetchedExpiry = data.expiryDate;
              if (data.status) fetchedStatus = data.status;
            } else {
              // Query collection fallback
              const q = query(collection(db, 'school_settings'), limit(1));
              const querySnapshot = await getDocs(q);
              if (!querySnapshot.empty) {
                const docData = querySnapshot.docs[0].data();
                if (docData.licenseExpiryDate) fetchedExpiry = docData.licenseExpiryDate;
                if (docData.expiresAt) fetchedExpiry = docData.expiresAt;
                if (docData.licenseStatus) fetchedStatus = docData.licenseStatus;
              }
            }
          }
        } catch (fbErr) {
          console.warn('Firestore fetch license warning:', fbErr);
        }
      }

      // Check activeLicense service & localStorage fallbacks
      const active = getActiveLicense();
      if (!fetchedExpiry && active?.expiresAt) {
        fetchedExpiry = active.expiresAt;
      }
      if (!fetchedExpiry) {
        fetchedExpiry = localStorage.getItem('school_license_expiry') ||
                        localStorage.getItem('activation_expires_at') ||
                        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      }

      setExpiryDate(fetchedExpiry);
      setLicenseStatus(active ? 'active' : fetchedStatus);

      localStorage.setItem('school_license_expiry', fetchedExpiry);
      localStorage.setItem('school_license_status', active ? 'active' : fetchedStatus);

      if (showToast) {
        toast.success('License status successfully refreshed from Firestore.');
      }
    } catch (error) {
      console.error('Failed to fetch license status:', error);
      if (showToast) {
        toast.error('Failed to refresh license status. Using cached settings.');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLicenseFromFirestore(false);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'school_license_expiry' && e.newValue) {
        setExpiryDate(e.newValue);
      }
      if (e.key === 'school_license_status' && e.newValue) {
        setLicenseStatus(e.newValue);
      }
      if (e.key === 'activation_expires_at' && e.newValue) {
        setExpiryDate(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchLicenseFromFirestore]);

  // Also check licenseService daysRemainingUntil
  const paymentDueDate = localStorage.getItem('munyaka_next_billing_date') || localStorage.getItem('munyaka_payment_due_date') || '2026-11-11';
  const calculateDaysRemaining = (targetDateStr: string) => {
    if (!targetDateStr) return 17;
    const target = new Date(targetDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };
  const targetDaysLeft = calculateDaysRemaining(paymentDueDate);

  const activeLic = getActiveLicense();
  const daysLeft = activeLic ? daysRemainingUntil(activeLic.expiresAt) : targetDaysLeft;
  const isExpired = licenseStatus === 'expired' || daysLeft <= 0;
  const isAmber = !isExpired && daysLeft < 30;

  // Dynamic status colors: emerald for active (>30d), amber for <30d, red for expired
  let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
  let IconComponent = ShieldCheck;

  if (isExpired) {
    badgeBg = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    IconComponent = XCircle;
  } else if (isAmber) {
    badgeBg = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    IconComponent = AlertTriangle;
  }

  const badgeText = isExpired
    ? 'LICENSE EXPIRED'
    : `LICENSED · ${daysLeft}D LEFT`;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider shadow-sm transition-all duration-200 ${badgeBg} ${className}`}
      title={`License Expiry: ${new Date(expiryDate).toLocaleDateString()} (${daysLeft} days remaining)`}
    >
      <IconComponent size={14} className="shrink-0" />
      <span>{badgeText}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          fetchLicenseFromFirestore(true);
        }}
        disabled={isRefreshing}
        className="ml-1 p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
        title="Refresh license status from Firestore"
        aria-label="Refresh license status"
      >
        <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
      </button>
    </div>
  );
};
