// ─────────────────────────────────────────────
// License types
// ─────────────────────────────────────────────

export type LicenseMethod = 'cash' | 'bank' | 'cheque' | 'mpesa';
export type LicenseStatus = 'active' | 'expired' | 'revoked';
export type ValidityDuration = 30 | 365 | 730; // days

export interface LicensePaymentDetails {
  method: LicenseMethod;
  refNumber: string;
  amount: string;
  bankName?: string;
  branch?: string;
}

export interface License {
  id: string;
  /** Human-readable activation code, e.g. MUNYAKA-2026-A3B7-X9K2-M8N4 */
  activationKey: string;
  issuedTo: string;
  deviceId: string;
  status: LicenseStatus;
  /** License plan type, e.g. "trial" | "standard" | "premium" */
  type?: string;
  /** Display name of the active plan, e.g. "Munyaka Starter" */
  planName?: string;
  validityDays: ValidityDuration;
  issuedAt: string;     // ISO date string
  expiresAt: string;   // ISO date string
  /** When the last payment was received (ISO string). */
  paidAt?: string;
  payment: LicensePaymentDetails;
  /** Auto-renew flag — if true, system will extend on next renewal */
  autoRenew: boolean;
  notes?: string;
}

// Payment method labels
export const LICENSE_METHOD_LABELS: Record<LicenseMethod, string> = {
  cash: 'Cash',
  bank: 'Bank Transfer / EFT',
  cheque: 'Cheque',
  mpesa: 'M-Pesa',
};
