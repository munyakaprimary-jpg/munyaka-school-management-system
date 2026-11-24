import { db } from "../config/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { getActiveSchoolId } from "./firestoreSync";

export interface ActiveLicensePayload {
  schoolId: string;
  status: string;
  expiresAt: string;
  monthlyPaymentDueDate: string;
  daysRemaining: number;
  activeSeats: number;
  feePerSeat: number;
  monthlyLicenseFeePerSeat: number;
  billingDueDayOfMonth: number;
  gracePeriodDays: number;
  isLocked?: boolean;
  lastSyncedAt: string;
  [key: string]: any;
}

const LOCAL_STORAGE_LICENSE_KEY = "munyaka_active_license_payload_v1";

/**
 * Read cached active license payload synchronously from localStorage.
 * Ensures app boot never hangs on "Loading Munyaka Portal...".
 */
export function getActiveLicenseSync(): ActiveLicensePayload {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_LICENSE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const monthlyPaymentDueDate = localStorage.getItem('monthlyPaymentDueDate') || localStorage.getItem('munyaka_billing_due_date') || parsed.monthlyPaymentDueDate || parsed.expiresAt || '2026-12-29';
      const monthlyLicenseFeePerSeat = Number(localStorage.getItem('monthlyLicenseFeePerSeat') || localStorage.getItem('munyaka_fee_per_seat') || parsed.monthlyLicenseFeePerSeat || parsed.feePerSeat || 150);
      
      return {
        ...parsed,
        monthlyPaymentDueDate,
        expiresAt: monthlyPaymentDueDate,
        monthlyLicenseFeePerSeat,
        feePerSeat: monthlyLicenseFeePerSeat,
      };
    }
  } catch (e) {
    console.error("Error reading active license sync from localStorage:", e);
  }

  // Fallback defaults
  const status = localStorage.getItem('munyaka_billing_status') || 'ACTIVE';
  const monthlyPaymentDueDate = localStorage.getItem('monthlyPaymentDueDate') || localStorage.getItem('munyaka_billing_due_date') || '2026-12-29';
  const activeSeats = Number(localStorage.getItem('munyaka_active_seats') || '480');
  const monthlyLicenseFeePerSeat = Number(localStorage.getItem('monthlyLicenseFeePerSeat') || localStorage.getItem('munyaka_fee_per_seat') || '150');
  const billingDueDayOfMonth = Number(localStorage.getItem('billingDueDayOfMonth') || '5');
  const gracePeriodDays = Number(localStorage.getItem('gracePeriodDays') || '7');
  const isLocked = localStorage.getItem('isTeacherAppLocked') === 'true';

  // Compute days remaining from monthlyPaymentDueDate
  let dueDateObj: Date;
  if (monthlyPaymentDueDate.includes('/')) {
    const parts = monthlyPaymentDueDate.split('/');
    if (parts.length === 3) {
      // DD/MM/YYYY or YYYY/MM/DD
      if (parts[0].length === 4) {
        dueDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        dueDateObj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
    } else {
      dueDateObj = new Date(monthlyPaymentDueDate);
    }
  } else {
    dueDateObj = new Date(monthlyPaymentDueDate);
  }

  if (isNaN(dueDateObj.getTime())) dueDateObj = new Date(2026, 11, 29);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueMidnight = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());
  const daysRemaining = Math.ceil((dueMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

  return {
    schoolId: getActiveSchoolId(),
    status,
    expiresAt: monthlyPaymentDueDate,
    monthlyPaymentDueDate,
    daysRemaining,
    activeSeats,
    feePerSeat: monthlyLicenseFeePerSeat,
    monthlyLicenseFeePerSeat,
    billingDueDayOfMonth,
    gracePeriodDays,
    isLocked,
    lastSyncedAt: new Date().toISOString()
  };
}

/**
 * Save and sync subscription active_license state to Firestore and localStorage
 */
export async function saveActiveLicenseState(payload: Partial<ActiveLicensePayload>): Promise<void> {
  const schoolId = getActiveSchoolId();
  const current = getActiveLicenseSync();

  const monthlyPaymentDueDate = payload.monthlyPaymentDueDate || payload.expiresAt || payload.dueDate || current.monthlyPaymentDueDate || current.expiresAt;
  const monthlyLicenseFeePerSeat = payload.monthlyLicenseFeePerSeat ?? payload.feePerSeat ?? current.monthlyLicenseFeePerSeat ?? current.feePerSeat;
  const activeSeats = payload.activeSeats ?? current.activeSeats;
  const billingDueDayOfMonth = payload.billingDueDayOfMonth ?? current.billingDueDayOfMonth;
  const gracePeriodDays = payload.gracePeriodDays ?? current.gracePeriodDays;
  const status = payload.status || current.status;
  const isLocked = payload.isLocked ?? current.isLocked;

  // Compute days remaining from monthlyPaymentDueDate
  let dueDateObj: Date;
  if (monthlyPaymentDueDate.includes('/')) {
    const parts = monthlyPaymentDueDate.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        dueDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        dueDateObj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
    } else {
      dueDateObj = new Date(monthlyPaymentDueDate);
    }
  } else {
    dueDateObj = new Date(monthlyPaymentDueDate);
  }

  if (isNaN(dueDateObj.getTime())) dueDateObj = new Date(2026, 11, 29);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueMidnight = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());
  const daysRemaining = Math.ceil((dueMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

  const enhanced: ActiveLicensePayload = {
    ...current,
    ...payload,
    schoolId,
    monthlyPaymentDueDate,
    expiresAt: monthlyPaymentDueDate,
    daysRemaining,
    activeSeats,
    monthlyLicenseFeePerSeat,
    feePerSeat: monthlyLicenseFeePerSeat,
    billingDueDayOfMonth,
    gracePeriodDays,
    status,
    isLocked,
    lastSyncedAt: new Date().toISOString()
  };

  // 1. Immediate localStorage caching & event dispatch
  try {
    localStorage.setItem(LOCAL_STORAGE_LICENSE_KEY, JSON.stringify(enhanced));
    localStorage.setItem('monthlyPaymentDueDate', monthlyPaymentDueDate);
    localStorage.setItem('munyaka_billing_due_date', monthlyPaymentDueDate);
    localStorage.setItem('munyaka_payment_due_date', monthlyPaymentDueDate);
    localStorage.setItem('school_license_expiry', monthlyPaymentDueDate);
    localStorage.setItem('monthlyLicenseFeePerSeat', String(monthlyLicenseFeePerSeat));
    localStorage.setItem('munyaka_fee_per_seat', String(monthlyLicenseFeePerSeat));
    localStorage.setItem('billingDueDayOfMonth', String(billingDueDayOfMonth));
    localStorage.setItem('gracePeriodDays', String(gracePeriodDays));
    localStorage.setItem('munyaka_billing_status', status);
    localStorage.setItem('munyaka_payment_status', status);
    localStorage.setItem('munyaka_active_seats', String(activeSeats));
    if (isLocked !== undefined) {
      localStorage.setItem('isTeacherAppLocked', String(isLocked));
    }

    window.dispatchEvent(new CustomEvent('munyaka_license_updated', { detail: enhanced }));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('billing_invoices_updated'));
    window.dispatchEvent(new Event('fee_per_seat_updated'));
  } catch (e) {
    console.error("Error caching active license in localStorage:", e);
  }

  // 2. Persist to Firestore across all subscription paths with merge: true
  try {
    const mainRef = doc(db, "schools", schoolId, "subscriptions", "active_license");
    const mirrorRef1 = doc(db, "schools", schoolId, "system_settings", "active_license");
    const mirrorRef2 = doc(db, "schools", schoolId, "subscription", "main");
    const legacyGlobalRef = doc(db, "system_settings", "active_license");

    await Promise.all([
      setDoc(mainRef, enhanced, { merge: true }),
      setDoc(mirrorRef1, enhanced, { merge: true }),
      setDoc(mirrorRef2, enhanced, { merge: true }),
      setDoc(legacyGlobalRef, enhanced, { merge: true }).catch(() => {})
    ]);
  } catch (e) {
    console.error("Error saving active license state to Firestore:", e);
  }
}

/**
 * Subscribe to schools/munyaka-primary-js/subscriptions/active_license via onSnapshot
 */
export function subscribeActiveLicense(onUpdate: (payload: ActiveLicensePayload) => void): () => void {
  const schoolId = getActiveSchoolId();

  try {
    onUpdate(getActiveLicenseSync());
  } catch (e) {}

  try {
    const mainRef = doc(db, "schools", schoolId, "subscriptions", "active_license");
    const unsubscribe = onSnapshot(
      mainRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as ActiveLicensePayload;
          if (data) {
            try {
              const current = getActiveLicenseSync();
              const merged: ActiveLicensePayload = { ...current, ...data };
              localStorage.setItem(LOCAL_STORAGE_LICENSE_KEY, JSON.stringify(merged));
              
              const dueDate = merged.monthlyPaymentDueDate || merged.expiresAt;
              if (dueDate) {
                localStorage.setItem('monthlyPaymentDueDate', dueDate);
                localStorage.setItem('munyaka_billing_due_date', dueDate);
                localStorage.setItem('school_license_expiry', dueDate);
              }
              const fee = merged.monthlyLicenseFeePerSeat ?? merged.feePerSeat;
              if (fee !== undefined) {
                localStorage.setItem('monthlyLicenseFeePerSeat', String(fee));
                localStorage.setItem('munyaka_fee_per_seat', String(fee));
              }
              if (merged.status) localStorage.setItem('munyaka_billing_status', merged.status);
              if (merged.activeSeats !== undefined) localStorage.setItem('munyaka_active_seats', String(merged.activeSeats));
              if (merged.isLocked !== undefined) localStorage.setItem('isTeacherAppLocked', String(merged.isLocked));

              window.dispatchEvent(new CustomEvent('munyaka_license_updated', { detail: merged }));
              window.dispatchEvent(new Event('storage'));
              window.dispatchEvent(new Event('billing_invoices_updated'));
              window.dispatchEvent(new Event('fee_per_seat_updated'));
              onUpdate(merged);
            } catch (e) {
              onUpdate(data);
            }
          }
        }
      },
      (err) => {
        console.warn("Firestore active_license onSnapshot warning:", err?.message || err);
      }
    );

    const handleStorage = () => {
      onUpdate(getActiveLicenseSync());
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('munyaka_license_updated', handleStorage as EventListener);

    return () => {
      try {
        unsubscribe();
      } catch (e) {}
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('munyaka_license_updated', handleStorage as EventListener);
    };
  } catch (e) {
    console.error("Error setting up active_license subscription:", e);
    return () => {};
  }
}
