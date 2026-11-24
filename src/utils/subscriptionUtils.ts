import { useState, useEffect } from 'react';

export interface LicenseBadgeInfo {
  badgeText: string;
  badgeVariant: string;
  daysRemaining: number;
  dueDate: string;
  isLocked: boolean;
  status: string;
}

export function getUnifiedLicenseInfo(): LicenseBadgeInfo {
  try {
    const isLocked = localStorage.getItem('isTeacherAppLocked') === 'true';
    let status = (localStorage.getItem('munyaka_billing_status') || localStorage.getItem('munyaka_payment_status') || 'ACTIVE').toUpperCase();
    
    // Unify storage keys: check munyaka_billing_due_date, munyaka_payment_due_date, munyaka_next_billing_date, school_license_expiry
    let dueDateStr = localStorage.getItem('munyaka_billing_due_date') || 
                     localStorage.getItem('munyaka_payment_due_date') || 
                     localStorage.getItem('munyaka_next_billing_date') || 
                     localStorage.getItem('school_license_expiry');

    if (!dueDateStr) {
      // Default to 29/12/2026 or +37 days from today if not set, or fallback to '2026-12-29'
      dueDateStr = '2026-12-29';
      localStorage.setItem('munyaka_billing_due_date', dueDateStr);
      localStorage.setItem('munyaka_payment_due_date', dueDateStr);
    }

    // Parse dueDateStr cleanly at midnight local time supporting YYYY-MM-DD or DD/MM/YYYY or similar
    let dueDateObj: Date;
    if (dueDateStr.includes('/')) {
      const parts = dueDateStr.split('/');
      if (parts.length === 3) {
        // e.g. 29/12/2026 -> year=2026, month=12, day=29
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        dueDateObj = new Date(year, month, day);
      } else {
        dueDateObj = new Date(dueDateStr);
      }
    } else {
      dueDateObj = new Date(dueDateStr);
    }

    if (isNaN(dueDateObj.getTime())) {
      dueDateObj = new Date(2026, 11, 29); // Dec 29, 2026
    }

    // Midnight local time for today
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueMidnight = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());

    const diffTime = dueMidnight.getTime() - todayMidnight.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Auto-sync status: if daysRemaining >= 0 or status is PAID/ACTIVE, ensure status is ACTIVE/PAID unless explicitly overridden to OVERDUE when daysRemaining < 0
    if (daysRemaining > 0 && status === 'OVERDUE') {
      status = 'ACTIVE';
      localStorage.setItem('munyaka_billing_status', 'ACTIVE');
    }

    let badgeText = '';
    let badgeVariant = '';

    if (isLocked) {
      badgeText = 'LOCKED · SUSPENDED';
      badgeVariant = 'bg-red-500/20 text-red-400 border-red-500/30 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800';
    } else if (daysRemaining < 0 || status === 'OVERDUE') {
      const pastDays = Math.abs(daysRemaining);
      badgeText = `OVERDUE · ${pastDays}D PAST DUE`;
      badgeVariant = 'bg-rose-500/20 text-rose-400 border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    } else if (daysRemaining === 0) {
      badgeText = 'LICENSED · DUE TODAY';
      badgeVariant = 'bg-amber-500/20 text-amber-400 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    } else {
      badgeText = `LICENSED · ${daysRemaining}D LEFT`;
      badgeVariant = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    }

    return {
      badgeText,
      badgeVariant,
      daysRemaining,
      dueDate: dueDateStr,
      isLocked,
      status
    };
  } catch (e) {
    console.error('Error computing unified license info:', e);
    return {
      badgeText: 'LICENSED · 37D LEFT',
      badgeVariant: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      daysRemaining: 37,
      dueDate: '29/12/2026',
      isLocked: false,
      status: 'ACTIVE'
    };
  }
}

export function useUnifiedLicense() {
  const [info, setInfo] = useState<LicenseBadgeInfo>(getUnifiedLicenseInfo);

  useEffect(() => {
    const handleUpdate = () => {
      setInfo(getUnifiedLicenseInfo());
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('billing_invoices_updated', handleUpdate);
    window.addEventListener('fee_per_seat_updated', handleUpdate);
    const interval = setInterval(handleUpdate, 3000);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('billing_invoices_updated', handleUpdate);
      window.removeEventListener('fee_per_seat_updated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  return info;
}
