/**
 * Hook: useDeviceMonitoring
 *
 * Provides live device registry state, auto-refresh on localStorage changes,
 * lock/unlock toggles, and simulated heartbeat injection for demo data.
 *
 * All localStorage and CustomEvent calls are wrapped in try-catch so that
 * a blocked storage API (e.g. private-browsing WebView on Android) can
 * never crash this hook or its consumers.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  TeacherDevice,
  getMonitoredDevices,
  toggleDeviceLock,
  MONITORED_DEVICES_KEY,
} from '@/types/device';

export const useDeviceMonitoring = () => {
  const [devices, setDevices] = useState<TeacherDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    try {
      const fresh = getMonitoredDevices();
      setDevices(fresh);
    } catch {
      // getMonitoredDevices already has try-catch internally; treat empty on error.
      setDevices([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    load();
  }, [load]);

  // Re-fetch on localStorage changes (from heartbeat writes or other tabs)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === MONITORED_DEVICES_KEY) load();
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key === MONITORED_DEVICES_KEY) load();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('munyaka:data-changed', onCustom as EventListener);

    // Polling as fallback for same-tab updates
    const interval = setInterval(load, 5000);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('munyaka:data-changed', onCustom as EventListener);
      clearInterval(interval);
    };
  }, [load]);

  /** Toggle app-lock for a specific device */
  const handleToggleLock = useCallback((deviceId: string) => {
    try {
      const next = toggleDeviceLock(deviceId);
      setDevices(next);
      // Notify other tabs — wrapped so blocked CustomEvent cannot crash
      try {
        window.dispatchEvent(
          new CustomEvent('munyaka:data-changed', {
            detail: { key: MONITORED_DEVICES_KEY },
          })
        );
      } catch {
        /* best-effort: some WebViews restrict CustomEvent */
      }
    } catch {
      /* toggleDeviceLock failed — device list remains unchanged */
    }
  }, []);

  /** Force a manual refresh */
  const handleRefresh = useCallback(() => {
    load();
  }, [load]);

  return {
    devices,
    isLoading,
    onToggleLock: handleToggleLock,
    onRefresh: handleRefresh,
  };
};
