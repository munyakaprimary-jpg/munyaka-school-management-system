import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, XCircle, RotateCw } from 'lucide-react';
import { getActiveLicense } from '@/services/licenseService';

interface LicenseBadgeProps {
  className?: string;
}

export const LicenseBadge: React.FC<LicenseBadgeProps> = ({ className = '' }) => {
  const [expiryDate, setExpiryDate] = useState<string>(() => {
    const active = getActiveLicense();
    if (active?.expiresAt) return active.expiresAt;
    const paymentDueDate = localStorage.getItem('munyaka_next_billing_date') || localStorage.getItem('munyaka_payment_due_date') || '2026-10-30';
    return paymentDueDate;
  });
  const [licenseStatus, setLicenseStatus] = useState<string>(() => {
    const active = getActiveLicense();
    if (active) return 'active';
    return localStorage.getItem('school_license_status') || 'active';
  });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [daysLeft, setDaysLeft] = useState<number>(() => {
    const dueDateStr = localStorage.getItem('munyaka_next_billing_date') || localStorage.getItem('munyaka_payment_due_date') || '2026-10-30';
    const target = new Date(dueDateStr).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  });

  useEffect(() => {
    const updateDays = () => {
      const dueDateStr = localStorage.getItem('munyaka_next_billing_date') || localStorage.getItem('munyaka_payment_due_date') || '2026-10-30';
      const target = new Date(dueDateStr).getTime();
      const now = new Date().getTime();
      const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      setDaysLeft(diffDays >= 0 ? diffDays : 0);
      setExpiryDate(dueDateStr);
    };

    updateDays();
    window.addEventListener('billing_invoices_updated', updateDays);
    window.addEventListener('fee_per_seat_updated', updateDays);
    window.addEventListener('storage', updateDays);
    return () => {
      window.removeEventListener('billing_invoices_updated', updateDays);
      window.removeEventListener('fee_per_seat_updated', updateDays);
      window.removeEventListener('storage', updateDays);
    };
  }, []);

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
      <RotateCw size={12} className="ml-0.5 opacity-70 animate-spin-slow" />
    </div>
  );
};
