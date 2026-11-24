import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

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

    // Badge styling requirements:
    // Warm Amber (bg-amber-100 text-amber-900 border border-amber-300 with text-amber-700 icon) when <= 7 days left, or overdue, or locked, or due today.
    // Emerald when > 7 days left.
    // whitespace-nowrap handled by caller or badge class.
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
      dueDate: '29/12/2026',
      isLocked: false,
      status: 'ACTIVE'
    };
  }
}

// Firestore real-time listener for subscription & billing under schools/${schoolId}/subscription/main
export function initSubscriptionFirestoreSync() {
  try {
    const schoolId = getActiveSchoolId();
    const ref = doc(db, 'schools', schoolId, 'subscription', 'main');
    
    // Listen via onSnapshot wrapped in try/catch
    const unsubscribe = onSnapshot(
      ref,
      (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data) {
              if (data.status) localStorage.setItem('munyaka_billing_status', data.status);
              if (data.paymentStatus) localStorage.setItem('munyaka_payment_status', data.paymentStatus);
              if (data.dueDate || data.expiryDate) {
                const due = data.dueDate || data.expiryDate;
                localStorage.setItem('munyaka_billing_due_date', due);
                localStorage.setItem('munyaka_payment_due_date', due);
              }
              if (data.isLocked !== undefined) localStorage.setItem('isTeacherAppLocked', String(data.isLocked));
              if (data.activeSeats !== undefined) localStorage.setItem('munyaka_active_seats', String(data.activeSeats));
              if (data.feePerSeat !== undefined) localStorage.setItem('munyaka_fee_per_seat', String(data.feePerSeat));
              
              window.dispatchEvent(new Event('storage'));
              window.dispatchEvent(new Event('billing_invoices_updated'));
            }
          }
        } catch (innerErr) {
          console.error('Error processing subscription snapshot:', innerErr);
        }
      },
      (err) => {
        // Non-blocking error handling
        console.warn('Subscription Firestore listener warning:', err?.message || err);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn('Could not initialize subscription Firestore listener:', e);
    return () => {};
  }
}

// Function to save subscription changes to Firestore & localStorage
export async function saveUnifiedSubscriptionState(payload: {
  status?: string;
  dueDate?: string;
  isLocked?: boolean;
  activeSeats?: number;
  feePerSeat?: number;
}): Promise<void> {
  const schoolId = getActiveSchoolId();
  try {
    if (payload.status) {
      localStorage.setItem('munyaka_billing_status', payload.status);
      localStorage.setItem('munyaka_payment_status', payload.status);
    }
    if (payload.dueDate) {
      localStorage.setItem('munyaka_billing_due_date', payload.dueDate);
      localStorage.setItem('munyaka_payment_due_date', payload.dueDate);
      localStorage.setItem('school_license_expiry', payload.dueDate);
    }
    if (payload.isLocked !== undefined) {
      localStorage.setItem('isTeacherAppLocked', String(payload.isLocked));
    }
    if (payload.activeSeats !== undefined) {
      localStorage.setItem('munyaka_active_seats', String(payload.activeSeats));
    }
    if (payload.feePerSeat !== undefined) {
      localStorage.setItem('munyaka_fee_per_seat', String(payload.feePerSeat));
    }

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('billing_invoices_updated'));

    if (navigator.onLine) {
      const ref = doc(db, 'schools', schoolId, 'subscription', 'main');
      await setDoc(ref, {
        ...payload,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (e) {
    console.error('Error saving unified subscription state:', e);
  }
}

export function useUnifiedLicense() {
  const [info, setInfo] = useState<LicenseBadgeInfo>(getUnifiedLicenseInfo);

  useEffect(() => {
    // Initial load from localStorage is synchronous and non-blocking
    setInfo(getUnifiedLicenseInfo());

    // Subscribe to Firestore updates under schools/${schoolId}/subscription/main
    const unsubscribeFirestore = initSubscriptionFirestoreSync();

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
      if (typeof unsubscribeFirestore === 'function') {
        unsubscribeFirestore();
      }
    };
  }, []);

  return info;
}
