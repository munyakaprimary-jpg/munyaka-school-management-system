import { showError } from './toast';

/**
 * storageUtils.ts — Shared safe storage primitives and quota error handling
 *
 * All components and hooks should import from here instead of calling
 * localStorage / sessionStorage / JSON.parse directly.
 *
 * Guarantees:
 *   • Every read returns a typed fallback, never throws
 *   • Every write catches quota errors and shows a user-facing toast
 *   • All JSON.parse / JSON.stringify is wrapped
 *   • Optional chaining (?.) used throughout to guard against null/undefined
 */

// ─── Quota Error Detection & User Alert ──────────────────────────────────────

/**
 * Detect whether an error is a DOMException with code 22 / "QuotaExceededError".
 * These are thrown when localStorage runs out of space (typically 5–10 MB).
 */
export function isQuotaExceeded(err: unknown): boolean {
  if (err instanceof DOMException) {
    return (
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err.code === 22
    );
  }
  if (err instanceof Error) {
    const msg = err.message ?? '';
    return (
      /quota exceeded/i.test(msg) ||
      /quota_reached/i.test(msg) ||
      /not enough space/i.test(msg) ||
      /storage.*full/i.test(msg)
    );
  }
  return false;
}

/**
 * Show a user-friendly toast warning when a storage write fails due to quota.
 * Call this from every write path that can hit localStorage.
 *
 * We import lazily inside the function to avoid circular dependency issues.
 */
export function handleQuotaError(key: string, operation = 'save'): void {
  try {
    showError(
      `Storage is full. Could not ${operation} "${key}". ` +
        'Please export your data and clear old records to free up space.',
      8000
    );
  } catch {
    // Fallback: at least log to console so admins know what happened
    console.error(
      `[storage] QuotaExceededError on key "${key}". ` +
        'User could not be notified via toast. ' +
        'Advise: export data and clear old records.'
    );
  }
}

/**
 * Wrap a localStorage write and handle quota errors gracefully.
 * Returns true on success, false on any error (including quota).
 * Fires the quota toast on QuotaExceededError.
 */
export function safeWrite(
  key: string,
  value: unknown,
  options: { operation?: string; onSuccess?: () => void } = {}
): boolean {
  try {
    const ls = window.localStorage;
    ls.setItem(key, JSON.stringify(value));
    options.onSuccess?.();
    return true;
  } catch (err) {
    if (isQuotaExceeded(err)) {
      handleQuotaError(key, options.operation ?? 'save');
    } else {
      console.error(`[storage] Failed to write "${key}":`, err);
    }
    return false;
  }
}

// ─── Safe JSON Primitives ────────────────────────────────────────────────────

/**
 * Wrap JSON.parse with a guaranteed fallback.
 * Returns `fallback` (not null) on any parse error or null/undefined input.
 * Ensures arrays default to [] when parsing storage keys like school_learners_data / munyaka_students.
 */
export function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (raw == null) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (parsed === undefined || parsed === null) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * Like safeParse but returns null instead of a fallback on failure.
 * Use this when you need to distinguish "null input" from "parse error".
 */
export function tryParse<T>(raw: string | null | undefined): T | null {
  if (raw == null) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Wrap JSON.stringify with a guaranteed string output.
 * Falls back to `"null"` (the string) if serialization fails.
 */
export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return 'null';
  }
}

// ─── Safe localStorage Accessor ──────────────────────────────────────────────

/**
 * Get the window.localStorage reference, or null in SSR / restricted iframes.
 *
 * On some mobile browsers (e.g. iOS Private Browsing, some Android WebViews
 * in private/incognito mode) `localStorage` exists but throws
 * QuotaExceededError on every write. The old probe-write approach could
 * surface that as a crash if the error is not a QuotaExceededError.
 *
 * The new approach: read-only probe (JSON.parse on the raw string) avoids
 * triggering quota-related throws while still confirming the API is functional.
 */
export function getLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    if (!window.localStorage) return null;
    // Confirm read access by parsing the raw string of a test key.
    // This does NOT throw on QuotaExceededError (only writes do) and
    // catches cases where localStorage is present but completely blocked.
    const ls = window.localStorage;
    const TEST_KEY = '__ls_probe__';
    ls.setItem(TEST_KEY, '1');
    ls.removeItem(TEST_KEY);
    return ls;
  } catch (err) {
    // Any error (QuotaExceededError, SecurityError, etc.) → treat as unavailable.
    // This prevents the app from crashing on browsers with strict storage policies.
    return null;
  }
}

// ─── Safe Read / Write Helpers ───────────────────────────────────────────────

/**
 * Read a JSON value from localStorage with a typed fallback.
 * Never throws; always returns `fallback` on any error.
 */
export function lsRead<T>(key: string, fallback: T): T {
  const ls = getLocalStorage();
  if (!ls) return fallback;
  const raw = ls.getItem(key);
  if (raw == null) return fallback;
  return safeParse(raw, fallback);
}

/**
 * Write a JSON value to localStorage, handling quota errors.
 * Returns true on success, false on failure (including quota exceeded).
 */
export function lsWrite<T>(key: string, value: T): boolean {
  const ls = getLocalStorage();
  if (!ls) return false;
  try {
    ls.setItem(key, safeStringify(value));
    return true;
  } catch (err) {
    if (isQuotaExceeded(err)) {
      handleQuotaError(key);
    } else {
      console.error(`[storage] lsWrite failed for "${key}":`, err);
    }
    return false;
  }
}

/**
 * Remove a key from localStorage. Errors are swallowed silently.
 */
export function lsRemove(key: string): void {
  const ls = getLocalStorage();
  if (!ls) return;
  try {
    ls.removeItem(key);
  } catch {
    // No-op — remove is non-critical
  }
}

/**
 * Get the approximate storage usage for a key, in bytes.
 */
export function lsSizeOf(key: string): number {
  const ls = getLocalStorage();
  if (!ls) return 0;
  try {
    return (ls.getItem(key) ?? '').length;
  } catch {
    return 0;
  }
}

/**
 * Estimate the total bytes used by all localStorage keys.
 */
export function lsTotalSize(): number {
  const ls = getLocalStorage();
  if (!ls) return 0;
  let total = 0;
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i);
    if (k) total += lsSizeOf(k);
  }
  return total;
}

/**
 * Check whether a specific key exists in localStorage.
 */
export function lsHas(key: string): boolean {
  const ls = getLocalStorage();
  if (!ls) return false;
  return ls.getItem(key) !== null;
}
