import { db } from "../config/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { getActiveSchoolId } from "./firestoreSync";

export interface ActiveLicensePayload {
  schoolId: string;
  status: string;
  expiresAt: string;
  daysRemaining: number;
  activeSeats: number;
  feePerSeat: number;
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
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading active license sync from localStorage:", e);
  }

  // Fallback defaults matching Munyaka Primary & JS subscription
  const status = localStorage.getItem('munyaka_billing_status') || 'ACTIVE';
  const expiresAt = localStorage.getItem('munyaka_billing_due_date') || '2026-12-29';
  const activeSeats = Number(localStorage.getItem('munyaka_active_seats') || '480');
  const feePerSeat = Number(localStorage.getItem('munyaka_fee_per_seat') || '150');
  const isLocked = localStorage.getItem('isTeacherAppLocked') === 'true';

  // Compute days remaining
  let dueDateObj = new Date(expiresAt);
  if (isNaN(dueDateObj.getTime())) dueDateObj = new Date(2026, 11, 29);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueMidnight = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());
  const daysRemaining = Math.ceil((dueMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

  return {
    schoolId: getActiveSchoolId(),
    status,
    expiresAt,
    daysRemaining,
    activeSeats,
    feePerSeat,
    isLocked,
    lastSyncedAt: new Date().toISOString()
  };
}

/**
 * Save and sync subscription active_license state to Firestore and localStorage:
 * - schools/munyaka-primary-js/subscriptions/active_license
 * - schools/munyaka-primary-js/system_settings/active_license
 * - system_settings/active_license
 * via setDoc(..., { merge: true }).
 */
export async function saveActiveLicenseState(payload: Partial<ActiveLicensePayload>): Promise<void> {
  const schoolId = getActiveSchoolId();
  const current = getActiveLicenseSync();

  const expiresAt = payload.expiresAt || payload.dueDate || current.expiresAt;
  let dueDateObj = new Date(expiresAt);
  if (isNaN(dueDateObj.getTime())) dueDateObj = new Date(2026, 11, 29);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueMidnight = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());
  const daysRemaining = Math.ceil((dueMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

  const enhanced: ActiveLicensePayload = {
    ...current,
    ...payload,
    schoolId,
    expiresAt,
    daysRemaining,
    activeSeats: payload.activeSeats ?? current.activeSeats,
    feePerSeat: payload.feePerSeat ?? current.feePerSeat,
    status: payload.status || current.status,
    isLocked: payload.isLocked ?? current.isLocked,
    lastSyncedAt: new Date().toISOString()
  };

  // 1. Immediate localStorage caching & event dispatch
  try {
    localStorage.setItem(LOCAL_STORAGE_LICENSE_KEY, JSON.stringify(enhanced));
    localStorage.setItem('munyaka_billing_status', enhanced.status);
    localStorage.setItem('munyaka_payment_status', enhanced.status);
    localStorage.setItem('munyaka_billing_due_date', enhanced.expiresAt);
    localStorage.setItem('munyaka_payment_due_date', enhanced.expiresAt);
    localStorage.setItem('school_license_expiry', enhanced.expiresAt);
    localStorage.setItem('munyaka_active_seats', String(enhanced.activeSeats));
    localStorage.setItem('munyaka_fee_per_seat', String(enhanced.feePerSeat));
    if (enhanced.isLocked !== undefined) {
      localStorage.setItem('isTeacherAppLocked', String(enhanced.isLocked));
    }

    window.dispatchEvent(new CustomEvent('munyaka_license_updated', { detail: enhanced }));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('billing_invoices_updated'));
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
 * Subscribe to schools/munyaka-primary-js/subscriptions/active_license via onSnapshot (wrapped in try/catch)
 * so Operator Console and admin headers stay in lockstep.
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
              if (merged.status) localStorage.setItem('munyaka_billing_status', merged.status);
              if (merged.expiresAt) {
                localStorage.setItem('munyaka_billing_due_date', merged.expiresAt);
                localStorage.setItem('school_license_expiry', merged.expiresAt);
              }
              if (merged.activeSeats !== undefined) localStorage.setItem('munyaka_active_seats', String(merged.activeSeats));
              if (merged.feePerSeat !== undefined) localStorage.setItem('munyaka_fee_per_seat', String(merged.feePerSeat));
              if (merged.isLocked !== undefined) localStorage.setItem('isTeacherAppLocked', String(merged.isLocked));

              window.dispatchEvent(new CustomEvent('munyaka_license_updated', { detail: merged }));
              window.dispatchEvent(new Event('storage'));
              window.dispatchEvent(new Event('billing_invoices_updated'));
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
