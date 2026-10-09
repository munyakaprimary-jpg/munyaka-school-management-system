/**
 * Billing Auto-Lock Utility (Authoritative Server Time & Anti-Tampering)
 * 
 * Automatically locks teacher apps when payment is overdue based on:
 * - Billing due day of month (default: 5th)
 * - Grace period in days (default: 3 days)
 * - Payment status for current billing cycle
 * - Trusted authoritative server time (with offline drift detection & anti-tampering)
 */

import { showSuccess, showError } from '@/utils/toast';

const GLOBAL_LOCK_KEY = 'munyaka_global_app_lock';
const CENTRAL_DB_KEY = 'munyaka_central_db';
const BILLING_HISTORY_KEY = 'munyaka_billing_history';
const LAST_SERVER_TIME_KEY = 'munyaka_last_server_timestamp';
const LAST_DEVICE_TIME_KEY = 'munyaka_last_device_timestamp';

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

// In-memory server time offset (difference between server time and local device time)
let cachedServerTimeOffset: number = 0;
let isServerTimeSynced: boolean = false;

/**
 * Fetch authoritative server time (with fallback to local device time + drift detection)
 */
export async function getAuthoritativeTime(): Promise<Date> {
  const localNow = Date.now();
  
  try {
    const serverTimeEndpoint = '/api/server-time';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
    
    const response = await fetch(serverTimeEndpoint, {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' }
    }).catch(() => null);
    clearTimeout(timeoutId);
    
    if (response && response.ok) {
      const data = await response.json();
      if (data && data.timestamp) {
        const serverTimestamp = Number(data.timestamp);
        cachedServerTimeOffset = serverTimestamp - localNow;
        isServerTimeSynced = true;
        
        // Save verified checkpoint to localStorage for offline use
        localStorage.setItem(LAST_SERVER_TIME_KEY, String(serverTimestamp));
        localStorage.setItem(LAST_DEVICE_TIME_KEY, String(localNow));
        
        return new Date(serverTimestamp);
      }
    }
  } catch {
    // Offline or network error — fallback to offline verification with anti-tampering drift check
  }

  // ── Anti-Tampering Drift Check (Offline Mode) ──
  try {
    const lastServerTimeStr = localStorage.getItem(LAST_SERVER_TIME_KEY);
    const lastDeviceTimeStr = localStorage.getItem(LAST_DEVICE_TIME_KEY);
    
    if (lastServerTimeStr && lastDeviceTimeStr) {
      const lastServerTime = Number(lastServerTimeStr);
      const lastDeviceTime = Number(lastDeviceTimeStr);
      
      const elapsedLocalTime = localNow - lastDeviceTime;
      const estimatedServerTime = lastServerTime + elapsedLocalTime;
      
      // Check if device clock was rolled back (tampering detection)
      if (localNow < lastServerTime || (estimatedServerTime - localNow) > 12 * 60 * 60 * 1000) {
        console.warn('[Security] Device clock rollback detected! Potential tampering. Enforcing security lock.');
        localStorage.setItem(GLOBAL_LOCK_KEY, 'true');
      }
      
      return new Date(estimatedServerTime);
    }
  } catch {}

  return new Date();
}

/**
 * Synchronous version for renders (uses cached offset or fallback)
 */
export function getAuthoritativeTimeSync(): Date {
  const localNow = Date.now();
  if (isServerTimeSynced) {
    return new Date(localNow + cachedServerTimeOffset);
  }
  
  try {
    const lastServerTimeStr = localStorage.getItem(LAST_SERVER_TIME_KEY);
    const lastDeviceTimeStr = localStorage.getItem(LAST_DEVICE_TIME_KEY);
    if (lastServerTimeStr && lastDeviceTimeStr) {
      const elapsed = localNow - Number(lastDeviceTimeStr);
      return new Date(Number(lastServerTimeStr) + elapsed);
    }
  } catch {}

  return new Date();
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
 */
function isCurrentCyclePaid(): boolean {
  const now = getAuthoritativeTimeSync();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const history = getPaymentHistory();
  
  for (const record of history) {
    const recordDate = record.date; // YYYY-MM-DD
    if (recordDate.startsWith(currentMonthKey)) {
      const amount = Number(record.amount.replace(/[^0-9]/g, '')) || 0;
      const status = (record.status || '').toUpperCase();
      if (amount > 0 && (status === 'PAID' || status === 'CLEARED' || status === 'COMPLETED')) {
        return true;
      }
      if (amount > 0 && !status) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Calculate the deadline date for the current month using authoritative time
 */
function getCurrentMonthDeadline(): Date {
  const settings = getBillingSettings();
  const now = getAuthoritativeTimeSync();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const dueDate = new Date(year, month, settings.billingDueDay);
  const deadline = new Date(dueDate);
  deadline.setDate(deadline.getDate() + settings.billingGracePeriod);
  deadline.setHours(23, 59, 59, 999);
  
  return deadline;
}

/**
 * Check if auto-lock should be triggered using authoritative time
 */
export function shouldAutoLock(): boolean {
  const deadline = getCurrentMonthDeadline();
  const now = getAuthoritativeTimeSync();
  
  if (now <= deadline) {
    return false;
  }
  
  if (isCurrentCyclePaid()) {
    return false;
  }
  
  return true;
}

/**
 * Apply auto-lock if conditions are met
 */
export function applyAutoLock(): boolean {
  if (shouldAutoLock()) {
    try {
      const currentLock = localStorage.getItem(GLOBAL_LOCK_KEY);
      if (currentLock !== 'true') {
        localStorage.setItem(GLOBAL_LOCK_KEY, 'true');
        window.dispatchEvent(new Event('storage'));
        console.info('[Billing Auto-Lock] Teacher apps auto-locked due to overdue payment (Authoritative Time Verified)');
        return true;
      }
    } catch (err) {
      console.error('[Billing Auto-Lock] Failed to apply auto-lock:', err);
    }
  }
  return false;
}

/**
 * Check and apply auto-lock on app startup with authoritative time sync
 */
export async function runBillingAutoLockCheck(): Promise<void> {
  try {
    await getAuthoritativeTime();
    applyAutoLock();
  } catch (err) {
    console.error('[Billing Auto-Lock] Startup check failed:', err);
  }
}

/**
 * Record payment and unlock
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
      date: getAuthoritativeTimeSync().toISOString().split('T')[0],
      campus: paymentData.campus,
      method: paymentData.method,
      ref: paymentData.ref || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: paymentData.amount,
      period: paymentData.period,
      notes: paymentData.notes,
      status: 'PAID',
    };
    history.unshift(newRecord);
    localStorage.setItem(BILLING_HISTORY_KEY, JSON.stringify(history));

    try {
      const centralRaw = localStorage.getItem(CENTRAL_DB_KEY);
      if (centralRaw) {
        const centralDb = JSON.parse(centralRaw);
        if (!Array.isArray(centralDb.payments)) centralDb.payments = [];
        centralDb.payments.unshift(newRecord);
        localStorage.setItem(CENTRAL_DB_KEY, JSON.stringify(centralDb));
      }
    } catch {}

    localStorage.setItem(GLOBAL_LOCK_KEY, 'false');
    window.dispatchEvent(new Event('storage'));
    console.info('[Billing Auto-Lock] Payment recorded as PAID and teacher apps unlocked.');
  } catch (err) {
    console.error('[Billing Auto-Lock] Failed to record payment & unlock:', err);
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
  const now = getAuthoritativeTimeSync();
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
