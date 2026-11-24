import { useState, useEffect } from 'react';
import { db } from '@/services/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getActiveSchoolId } from '@/services/firestoreSync';

export interface LicenseBadgeInfo {
  badgeText: string;
  badgeVariant: string;
  daysRemaining: number;
  dueDate: string;
  isLocked: boolean;
  status: string;
}

// Global listener/sync reference for Firestore license sync
let firestoreSubscribed = false;
export function initFirestoreLicenseSync() {
  if (firestoreSubscribed) return;
  firestoreSubscribed = true;
  try {
    const schoolId = getActiveSchoolId();
    const ref = doc(db, 'schools', schoolId, 'settings', 'subscription');
    onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.dueDate) localStorage.setItem('munyaka_billing_due_date', data.dueDate);
        if (data.status) localStorage.setItem('munyaka_billing_status', data.status);
        if (data.isLocked !== undefined) localStorage.setItem('isTeacherAppLocked', String(data.isLocked));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('billing_invoices_updated'));
      }
    }, (err) => {
      console.warn('Firestore subscription license sync snapshot error:', err);
    });
  } catch (e) {
    // ignore
  }
}

export async function saveLicenseToFirestore(licenseData: { dueDate: string; status: string; isLocked: boolean }) {
  try {
    const schoolId = getActiveSchoolId();
    const ref = doc(db, 'schools', schoolId, 'settings', 'subscription');
    await setDoc(ref, {
      ...licenseData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.error('Failed to sync license state to Firestore:', e);
  }
}

export function getUnifiedLicenseInfo(): LicenseBadgeInfo {
  try {
    initFirestoreLicenseSync();
    const isLocked = localStorage.getItem('isTeacherAppLocked') === 'true';
    let status = (localStorage.getItem('munyaka_billing_status') || localStorage.getItem('munyaka_payment_status') || 'ACTIVE').toUpperCase();
    
    let dueDateStr = localStorage.getItem('munyaka_billing_due_date') ||
                     localStorage.getItem('munyaka_payment_due_date') ||
                     localStorage.getItem('munyaka_next_billing_date') ||
                     localStorage.getItem('school_license_expiry');

    if (!dueDateStr) {
      dueDateStr = '2026-12-29';
      localStorage.setItem('munyaka_billing_due_date', dueDateStr);
      localStorage.setItem('munyaka_payment_due_date', dueDateStr);
    }

    let dueDateObj: Date;
    if (dueDateStr.includes('/')) {
      const parts = dueDateStr.split('/');
      if (parts.length === 3) {
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
      dueDateObj = new Date(2026, 11, 29);
    }

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueMidnight = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());

    const diffTime = dueMidnight.getTime() - todayMidnight.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysRemaining > 0 && status === 'OVERDUE') {
      status = 'ACTIVE';
      localStorage.setItem('munyaka_billing_status', 'ACTIVE');
    }

    let badgeText = '';
    let badgeVariant = '';

    if (isLocked) {
      badgeText = 'LOCKED · SUSPENDED';
      badgeVariant = 'bg-red-100 text-red-900 border border-red-300 dark:bg-red-950/60 dark:text-red-200 dark:border-red-800';
    } else if (daysRemaining < 0 || status === 'OVERDUE') {
      const pastDays = Math.abs(daysRemaining);
      badgeText = `OVERDUE · ${pastDays}D PAST DUE`;
      badgeVariant = 'bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800';
    } else if (daysRemaining === 0) {
      badgeText = 'LICENSED · DUE TODAY';
      badgeVariant = 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800';
    } else if (daysRemaining <= 7) {
      badgeText = `LICENSED · ${daysRemaining}D LEFT`;
      badgeVariant = 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800';
    } else {
      badgeText = `LICENSED · ${daysRemaining}D LEFT`;
      badgeVariant = 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800';
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
      badgeVariant: 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800',
      daysRemaining: 37,
      dueDate: '2026-12-29',
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
