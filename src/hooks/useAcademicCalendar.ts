import { useState, useEffect, useMemo, useCallback } from 'react';
import { getLocalStorage } from '@/utils/storage';

export interface AcademicCalendar {
  activeTerm: string;
  activeYear: string;
  /** True while the hook is initially loading settings from localStorage. */
  isLoading: boolean;
}

export const ACADEMIC_SETTINGS_KEY = 'munyaka_system_settings_v3';

const FALLBACK_TERM = 'Term 3';
const FALLBACK_YEAR = '2026';

/** Normalise raw storage values into the shape returned by the hook. */
const parseSettings = (
  raw: string | null
): { activeTerm: string; activeYear: string } | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.academic) {
      return {
        activeTerm: parsed.academic.activeTerm || FALLBACK_TERM,
        activeYear: parsed.academic.activeYear || FALLBACK_YEAR,
      };
    }
  } catch {
    /* ignore parse errors */
  }
  return null;
};

/**
 * Core shared hook that reads the active academic term and year from the
 * centralised system settings storage key (`munyaka_system_settings_v3`).
 *
 * Automatically re-renders when:
 *   • A `storage` event fires (cross-tab sync)
 *   • A `munyaka:data-changed` custom event fires with this key in the detail
 *   • The browser window regains focus
 *
 * All pages should call `useAcademicCalendar()` instead of duplicating the
 * read logic or hardcoding "Term X, YYYY".
 */
export const useAcademicCalendar = (): AcademicCalendar => {
  const [rawSettings, setRawSettings] = useState<
    { activeTerm: string; activeYear: string } | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Re-read from localStorage and update state if the data changed. */
  const loadSettings = useCallback(() => {
    try {
      const ls = getLocalStorage();
      const stored = ls?.getItem(ACADEMIC_SETTINGS_KEY) ?? null;
      const parsed = parseSettings(stored);
      setRawSettings(parsed);
    } catch (e) {
      console.error('[useAcademicCalendar] Error loading settings:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load on mount
    loadSettings();

    // 1. Cross-tab storage sync
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACADEMIC_SETTINGS_KEY) loadSettings();
    };

    // 2. Same-tab custom event — fired by notifyDataChanged() whenever
    //    Settings.tsx (or any other module) saves academic config.
    //    This is the primary update path; storage events only cover cross-tab.
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<{ key?: string }>).detail;
      if (!detail?.key || detail.key === ACADEMIC_SETTINGS_KEY) {
        loadSettings();
      }
    };

    // 3. Refresh on window focus (covers the case where the user edits
    //    settings in another tab, closes it, then returns here).
    const onFocus = () => loadSettings();

    window.addEventListener('storage', onStorage);
    window.addEventListener('munyaka:data-changed', onCustom);
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('munyaka:data-changed', onCustom);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadSettings]);

  /** Human-readable term label — normalises "term1" → "Term 1". */
  const activeTerm = useMemo(() => {
    if (!rawSettings) return FALLBACK_TERM;
    const t = rawSettings.activeTerm;
    if (t.startsWith('term')) {
      const num = t.replace('term', '');
      return `Term ${num}`;
    }
    return t;
  }, [rawSettings]);

  const activeYear = useMemo(
    () => rawSettings?.activeYear || FALLBACK_YEAR,
    [rawSettings]
  );

  return { activeTerm, activeYear, isLoading };
};

/**
 * Lightweight read — does NOT subscribe to events.
 * Use this only in contexts where re-rendering on changes is unnecessary
 * (e.g., CSV headers, print footers, non-reactive server payloads).
 */
export const getActiveAcademic = (): { activeTerm: string; activeYear: string } => {
  try {
    const ls = getLocalStorage();
    const raw = ls?.getItem(ACADEMIC_SETTINGS_KEY) ?? null;
    const parsed = parseSettings(raw);
    return parsed ?? { activeTerm: FALLBACK_TERM, activeYear: FALLBACK_YEAR };
  } catch {
    return { activeTerm: FALLBACK_TERM, activeYear: FALLBACK_YEAR };
  }
};

/**
 * Format a term badge string: "{activeTerm}, {activeYear}".
 * Safe to call in any render context.
 */
export const formatTermBadge = (
  activeTerm: string,
  activeYear: string
): string => `${activeTerm}, ${activeYear}`;
