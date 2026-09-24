/**
 * Billing Auto-Lock Utility
 * 
 * Automatically locks teacher apps when payment is overdue based on:
 * - Billing due day of month (default: 5th)
 * - Grace period in days (default: 3 days)
 * - Payment status for current billing cycle
 * 
 * Runs on app startup and can be called daily.
 */

import { showSuccess, showError } from '@/utils/toast';

const GLOBAL_LOCK_KEY = 'munyaka_global_app_lock';
const CENTRAL_DB_KEY = 'munyaka_central_db';
const BILLING_HISTORY_KEY = 'munyaka_billing_history';

interface BillingSettings {
  billingDueDay: number;
  billingGracePeriod: number;
  updatedAt?: string;
}

interface PaymentRecord {
  id: string;
  date: string;
  campus: string;
  method: string;
  ref: string;
  amount: string;
  period: string;
  notes: string;
  status?: string;
}

/**
 * Get billing settings from central DB
 */
function getBillingSettings(): BillingSettings {
  try {
    const centralRaw = localStorage.getItem(CENTRAL_DB_KEY);
    if (centralRaw) {
      const centralDb = JSON.parse(centralRaw);
      if (centralDb.billingSettings) {
        return {
          billingDueDay: centralDb.billingSettings.billingDueDay ?? 5,
          billingGracePeriod: centralDb.billingSettings.billingGracePeriod ?? 3,
          updatedAt: centralDb.billingSettings.updatedAt,
        };
      }
    }
  } catch {}
  return { billingDueDay: 5, billingGracePeriod: 3 };
}

/**
 * Get payment history from localStorage
 */
function getPaymentHistory(): PaymentRecord[] {
  try {
    const raw = localStorage.getItem(BILLING_HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

/**
 * Check if there's a PAID/CLEARED payment for the current billing cycle
 * Current billing cycle = current month
 */
function isCurrentCyclePaid(): boolean {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const history = getPaymentHistory();
  
  // Check for any payment in current month with PAID/CLEARED status
  // Also check if amount > 0 (indicating a real payment)
  for (const record of history) {
    const recordDate = record.date; // YYYY-MM-DD
    if (recordDate.startsWith(currentMonthKey)) {
      const amount = Number(record.amount.replace(/[^0-9]/g, '')) || 0;
      const status = (record.status || '').toUpperCase();
      if (amount > 0 && (status === 'PAID' || status === 'CLEARED' || status === 'COMPLETED')) {
        return true;
      }
      // Also consider payments without explicit status but with valid amount as paid
      if (amount > 0 && !status) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Calculate the deadline date for the current month
 * Deadline = due day + grace period
 */
function getCurrentMonthDeadline(): Date {
  const settings = getBillingSettings();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Due date is the billingDueDay of current month
  const dueDate = new Date(year, month, settings.billingDueDay);
  
  // Add grace period
  const deadline = new Date(dueDate);
  deadline.setDate(deadline.getDate() + settings.billingGracePeriod);
  deadline.setHours(23, 59, 59, 999); // End of day
  
  return deadline;
}

/**
 * Check if auto-lock should be triggered
 * Returns true if:
 * - Current date is past the deadline (due day + grace period)
 * - Current billing cycle is NOT marked as PAID/CLEARED
 */
export function shouldAutoLock(): boolean {
  const deadline = getCurrentMonthDeadline();
  const now = new Date();
  
  // Check if past deadline
  if (now <= deadline) {
    return false;
  }
  
  // Check if current cycle is paid
  if (isCurrentCyclePaid()) {
    return false;
  }
  
  return true;
}

/**
 * Apply auto-lock if conditions are met
 * Sets munyaka_global_app_lock to 'true' in localStorage
 */
export function applyAutoLock(): boolean {
  if (shouldAutoLock()) {
    try {
      const currentLock = localStorage.getItem(GLOBAL_LOCK_KEY);
      if (currentLock !== 'true') {
        localStorage.setItem(GLOBAL_LOCK_KEY, 'true');
        // Dispatch storage event so other tabs/components react
        window.dispatchEvent(new Event('storage'));
        console.log('[Billing Auto-Lock] Teacher apps auto-locked due to overdue payment');
        return true;
      }
    } catch (err) {
      console.error('[Billing Auto-Lock] Failed to apply auto-lock:', err);
    }
  }
  return false;
}

/**
 * Check and apply auto-lock on app startup
 * This should be called once when the app initializes
 */
export function runBillingAutoLockCheck(): void {
  try {
    const wasLocked = applyAutoLock();
    if (wasLocked) {
      // Show notification to user (if they're on the owner/admin dashboard)
      // The lock will be enforced by AppUnlock component
      console.log('[Billing Auto-Lock] Auto-lock applied on startup');
    }
  } catch (err) {
    console.error('[Billing Auto-Lock] Startup check failed:', err);
  }
}

/**
 * Manual override: Unlock teacher apps after payment verification
 * Called when owner manually toggles the switch to UNLOCKED
 */
export function recordPaymentAndUnlock(paymentData: {
  campus: string;
  amount: string;
  method: string;
  ref: string;
  period: string;
  notes: string;
}): void {
  try {
    const history = getPaymentHistory();
    const newRecord: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      campus: paymentData.campus,
      method: paymentData.method,
      ref: paymentData.ref || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      amount: paymentData.amount,
      period: paymentData.period,
      notes: paymentData.notes,
      status: 'PAID',
    };
    history.unshift(newRecord);
    localStorage.setItem(BILLING_HISTORY_KEY, JSON.stringify(history));

    // Also update central db payment records if present
    try {
      const centralRaw = localStorage.getItem(CENTRAL_DB_KEY);
      if (centralRaw) {
        const centralDb = JSON.parse(centralRaw);
        if (!Array.isArray(centralDb.payments)) centralDb.payments = [];
        centralDb.payments.unshift(newRecord);
        localStorage.setItem(CENTRAL_DB_KEY, JSON.stringify(centralDb));
      }
    } catch {}

    // Instantly unlock teacher apps upon successful payment recording
    localStorage.setItem(GLOBAL_LOCK_KEY, 'false');
    window.dispatchEvent(new Event('storage'));
    console.info('[Billing Auto-Lock] Payment recorded as PAID and teacher apps unlocked.');
  } catch (err) {
    console.error('[Billing Auto-Lock] Failed to record payment & unlock:', err);
  }
}

/**
 * Manual override: Lock teacher apps
 * Called when owner manually toggles the switch to LOCKED
 */
export function manualLock(): void {
  try {
    localStorage.setItem(GLOBAL_LOCK_KEY, 'true');
    window.dispatchEvent(new Event('storage'));
    showSuccess('Teacher apps manually locked.');
  } catch (err) {
    console.error('[Billing Auto-Lock] Manual lock failed:', err);
    showError('Failed to lock teacher apps.');
  }
}

/**
 * Get auto-lock status info for display
 */
export function getAutoLockStatus(): {
  isLocked: boolean;
  deadline: Date;
  daysUntilDeadline: number;
  isPastDeadline: boolean;
  isCurrentCyclePaid: boolean;
  settings: BillingSettings;
} {
  const settings = getBillingSettings();
  const deadline = getCurrentMonthDeadline();
  const now = new Date();
  const isPastDeadline = now > deadline;
  const isPaid = isCurrentCyclePaid();
  const isLocked = localStorage.getItem(GLOBAL_LOCK_KEY) === 'true';
  
  const diffTime = deadline.getTime() - now.getTime();
  const daysUntilDeadline = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    isLocked,
    deadline,
    daysUntilDeadline: Math.max(0, daysUntilDeadline),
    isPastDeadline,
    isCurrentCyclePaid: isPaid,
    settings,
  };
}

/**
 * Format deadline for display
 */
export function formatDeadline(deadline: Date): string {
  return deadline.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}