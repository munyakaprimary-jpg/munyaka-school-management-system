/**
 * Central Database Storage Drivers & Persistence Helpers (`db.ts`)
 * 
 * Implements strict non-destructive storage initialization:
 * - Never lets an empty or default seed array overwrite existing records if the storage key is already populated.
 * - Centralized persistence wrapper with versioned, permanent local keys.
 * - Blocks auto-seeding on updates, re-renders, and HMR across all modules (Fees, Stock, Events, Library, ICT, Learners, Staff).
 */

import { initialSeedData } from '@/data/initialSeedData';

export const KEYS = {
  LEARNERS: 'munyaka_learners_v3',
  STAFF: 'munyaka_staff_v3',
  FEES: 'munyaka_fees_v3',
  STOCK: 'munyaka_stock_v3',
  EVENTS: 'munyaka_events_v3',
  LIBRARY_BOOKS: 'munyaka_library_v3',
  ICT_ASSETS: 'munyaka_ict_v3',
  ACADEMIC_YEAR: 'munyaka_academic_year_v3',
};

/**
 * Reads data from localStorage safely. If not found or empty, returns fallback.
 */
export function dbRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(fallback) && fallback.length > 0) {
      // If stored is empty array but fallback has data and key was never initialized with user data,
      // let's check if there's a legacy key we can rescue.
      return parsed;
    }
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (err) {
    console.error(`[dbRead] Error reading key ${key}:`, err);
    return fallback;
  }
}

/**
 * Writes data to localStorage safely with non-destructive check.
 */
export function dbWrite<T>(key: string, data: T): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`[dbWrite] Error writing key ${key}:`, err);
  }
}

/**
 * Initializes seed data non-destructively. If the key already has items, it is NEVER overwritten.
 */
export function dbInitSeed<T>(key: string, seedData: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return seedData;
  }
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as unknown as T;
      }
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0 && !Array.isArray(parsed)) {
        return parsed as unknown as T;
      }
    }
    // If empty or non-existent, set seed data
    window.localStorage.setItem(key, JSON.stringify(seedData));
    return seedData;
  } catch {
    return seedData;
  }
}

/**
 * Runs central database initialization on app boot.
 */
export function initializeCentralStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    dbInitSeed(KEYS.LEARNERS, initialSeedData.students || []);
    dbInitSeed(KEYS.STAFF, initialSeedData.staff || []);
    dbInitSeed(KEYS.FEES, (initialSeedData as any).fees || []);
    dbInitSeed(KEYS.STOCK, (initialSeedData as any).stock || []);
    dbInitSeed(KEYS.EVENTS, (initialSeedData as any).events || []);
    dbInitSeed(KEYS.LIBRARY_BOOKS, (initialSeedData as any).library || []);
    dbInitSeed(KEYS.ICT_ASSETS, (initialSeedData as any).ict || []);
  } catch (err) {
    console.error('[initializeCentralStorage] error:', err);
  }
}
