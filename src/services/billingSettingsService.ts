/**
 * =============================================================================
 *  Billing Settings Service
 * =============================================================================
 *
 * Reads and writes billing contact details (email, phone) to the
 * `munyaka_subscription_settings` localStorage key — the same key used by
 * OwnerDashboard for the billing cycle.  Billing contacts persist alongside
 * the cycle configuration so everything stays in one place.
 *
 * Defaults:
 *   billingEmail   → jamesndiki@gmail.com
 *   billingPhone   → +254740583662
 */

export interface BillingContacts {
  billingEmail: string;
  billingPhone: string;
}

const BILLING_CONTACTS_KEY = 'billingContacts';

const BILLING_SETTINGS_KEY = 'munyaka_subscription_settings';

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_BILLING_CONTACTS: BillingContacts = {
  billingEmail: 'jamesndiki@gmail.com',
  billingPhone: '+254740583662',
};

// ─── Read / Write ───────────────────────────────────────────────────────────

/**
 * Load billing contacts from localStorage.
 * Falls back to defaults and writes them back if the key is absent or corrupt.
 */
export function getBillingContacts(): BillingContacts {
  try {
    const raw = localStorage.getItem(BILLING_CONTACTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BillingContacts;
      if (
        parsed &&
        typeof parsed.billingEmail === 'string' &&
        typeof parsed.billingPhone === 'string'
      ) {
        return parsed;
      }
    }
  } catch { /* fall through to defaults */ }

  localStorage.setItem(BILLING_CONTACTS_KEY, JSON.stringify(DEFAULT_BILLING_CONTACTS));
  return { ...DEFAULT_BILLING_CONTACTS };
}

/**
 * Persist updated billing contacts to localStorage.
 */
export function setBillingContacts(contacts: BillingContacts): void {
  localStorage.setItem(BILLING_CONTACTS_KEY, JSON.stringify(contacts));
}

/**
 * Update a single field (billingEmail or billingPhone) and persist.
 */
export function updateBillingField<K extends keyof BillingContacts>(
  field: K,
  value: BillingContacts[K],
): BillingContacts {
  const current = getBillingContacts();
  const updated = { ...current, [field]: value };
  setBillingContacts(updated);
  return updated;
}
