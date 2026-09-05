import { useState, useEffect, useCallback, useRef } from 'react';
import {
  TeacherDevice,
  getMonitoredDevices,
  toggleDeviceLock,
  MONITORED_DEVICES_KEY,
} from '@/types/device';

/**
 * Hook: useDeviceMonitoring
 *
 * Provides live device registry state, auto-refresh on localStorage changes,
 * lock/unlock toggles, and simulated heartbeat injection for demo data.
 */
export const useDeviceMonitoring = () => {
  const [devices, setDevices] = useState<TeacherDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const tickRef = useRef(0);

  const load = useCallback(() => {
    setDevices(getMonitoredDevices());
    setIsLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    load();
  }, [load]);

  // Re-fetch on localStorage changes (from heartbeat writes or other tabs)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === MONITORED_DEVICES_KEY) {
        load();
      }
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key === MONITORED_DEVICES_KEY) {
        load();
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('munyaka:data-changed', onCustom as EventListener);

    // Polling as fallback (for same-tab updates)
    const interval = setInterval(() => {
      tickRef.current += 1;
      load();
    }, 5000);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('munyaka:data-changed', onCustom as EventListener);
      clearInterval(interval);
    };
  }, [load]);

  /** Toggle app-lock for a specific device */
  const handleToggleLock = useCallback((deviceId: string) => {
    const next = toggleDeviceLock(deviceId);
    setDevices(next);
    // Notify other tabs
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', {
      detail: { key: MONITORED_DEVICES_KEY },
    }));
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
