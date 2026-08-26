import { useState, useEffect, useMemo } from 'react';

interface AcademicCalendar {
  activeTerm: string;
  activeYear: string;
  isLoading: boolean;
}

const SETTINGS_KEY = 'munyaka_system_settings_v3';
const FALLBACK_TERM = 'Term 3';
const FALLBACK_YEAR = '2026';

export const useAcademicCalendar = (): AcademicCalendar => {
  const [settings, setSettings] = useState<{ activeTerm: string; activeYear: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = () => {
      try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.academic) {
            setSettings({
              activeTerm: parsed.academic.activeTerm || FALLBACK_TERM,
              activeYear: parsed.academic.activeYear || FALLBACK_YEAR,
            });
          }
        }
      } catch (e) {
        console.error('Error loading academic calendar settings:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();

    // Listen for storage changes (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SETTINGS_KEY) {
        loadSettings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const activeTerm = useMemo(() => {
    if (!settings) return FALLBACK_TERM;
    // Normalize term format: "term1" -> "Term 1", "term2" -> "Term 2", etc.
    const term = settings.activeTerm;
    if (term.startsWith('term')) {
      const num = term.replace('term', '');
      return `Term ${num}`;
    }
    return term;
  }, [settings]);

  const activeYear = useMemo(() => settings?.activeYear || FALLBACK_YEAR, [settings]);

  return {
    activeTerm,
    activeYear,
    isLoading,
  };
};