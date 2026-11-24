import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getActiveLicenseSync, saveActiveLicenseState, subscribeActiveLicense, ActiveLicensePayload } from '../services/activeLicenseService';

export interface LicenseBadgeInfo {
  badgeText: string;
  badgeVariant: string;
  daysRemaining: number;
  dueDate: string;
  isLocked: boolean;
  status: string;
}

export function getActiveSchoolId(): string {
  try {
    const stored = localStorage.getItem('active_school_id') || localStorage.getItem('schoolId');
    if (stored) return stored;
  } catch (e) {}
  return 'munyaka-primary-js';
}

export function getUnifiedLicenseInfo(): LicenseBadgeInfo {
  try {
    const activeLicense = getActiveLicenseSync();
    const isLocked = !!activeLicense.isLocked || localStorage.getItem('isTeacherAppLocked') === 'true';
    let status = (activeLicense.status || localStorage.getItem('munyaka_billing_status') || 'ACTIVE').toUpperCase();
    let dueDateStr = activeLicense.monthlyPaymentDueDate || activeLicense.expiresAt || localStorage.getItem('monthlyPaymentDueDate') || localStorage.getItem('munyaka_billing_due_date') || '2026-12-29';

    let dueDateObj: Date;
    if (dueDateStr.includes('/')) {
      const parts = dueDateStr.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          dueDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else {
          dueDateObj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
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

    let badgeText = '';
    let badgeVariant = '';

    if (isLocked) {
      badgeText = 'LOCKED · SUSPENDED';
      badgeVariant = 'bg-red-100 text-red-900 border border-red-300';
    } else if (daysRemaining < 0 || status === 'OVERDUE') {
      const pastDays = Math.abs(daysRemaining);
      badgeText = `LICENSED • ${pastDays}D PAST DUE`;
      badgeVariant = 'bg-amber-100 text-amber-900 border border-amber-300';
    } else if (daysRemaining <= 7) {
      badgeText = daysRemaining === 0 ? 'LICENSED • DUE TODAY' : `LICENSED • ${daysRemaining}D LEFT`;
      badgeVariant = 'bg-amber-100 text-amber-900 border border-amber-300';
    } else {
      badgeText = `LICENSED • ${daysRemaining}D LEFT`;
      badgeVariant = 'bg-emerald-100 text-emerald-900 border border-emerald-300';
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
      badgeText: 'LICENSED • 37D LEFT',
      badgeVariant: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
      daysRemaining: 37,
      dueDate: '2026-12-29',
      isLocked: false,
      status: 'ACTIVE'
    };
  }
}

// Firestore real-time listener for subscription & billing
export function initSubscriptionFirestoreSync() {
  try {
    return subscribeActiveLicense(() => {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('billing_invoices_updated'));
    });
  } catch (e) {
    console.warn('Could not initialize subscription Firestore listener:', e);
    return () => {};
  }
}

// Function to save subscription changes to Firestore & localStorage
export async function saveUnifiedSubscriptionState(payload: {
  status?: string;
  dueDate?: string;
  expiresAt?: string;
  isLocked?: boolean;
  activeSeats?: number;
  feePerSeat?: number;
}): Promise<void> {
  try {
    await saveActiveLicenseState({
      status: payload.status,
      expiresAt: payload.dueDate || payload.expiresAt,
      isLocked: payload.isLocked,
      activeSeats: payload.activeSeats,
      feePerSeat: payload.feePerSeat
    });
  } catch (e) {
    console.error('Error saving unified subscription state:', e);
  }
}

export function useUnifiedLicense() {
  const [info, setInfo] = useState<LicenseBadgeInfo>(getUnifiedLicenseInfo);

  useEffect(() => {
    // Initial load from localStorage is synchronous and non-blocking
    setInfo(getUnifiedLicenseInfo());

    // Subscribe to Firestore updates under schools/${schoolId}/subscriptions/active_license
    const unsubscribeFirestore = initSubscriptionFirestoreSync();

    const handleUpdate = () => {
      setInfo(getUnifiedLicenseInfo());
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('billing_invoices_updated', handleUpdate);
    window.addEventListener('fee_per_seat_updated', handleUpdate);
    window.addEventListener('munyaka:active_license_updated', handleUpdate as EventListener);
    const interval = setInterval(handleUpdate, 3000);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('billing_invoices_updated', handleUpdate);
      window.removeEventListener('fee_per_seat_updated', handleUpdate);
      window.removeEventListener('munyaka:active_license_updated', handleUpdate as EventListener);
      clearInterval(interval);
      if (typeof unsubscribeFirestore === 'function') {
        unsubscribeFirestore();
      }
    };
  }, []);

  return info;
}
