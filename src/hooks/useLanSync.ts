/**
 * LAN Sync Engine Hook
 *
 * Provides a React hook that automatically starts the LAN sync engine
 * when the app loads, monitors connection status, and cleans up on unmount.
 *
 * CRITICAL: All sync-engine calls are inside a try-catch because
 * startAutoSync() internally calls localStorage, and on some mobile
 * browsers (private browsing, strict WebViews) that can throw even on read.
 * An uncaught exception here would crash the component during its first
 * render and kill the whole app on the Android WebView.
 */

import { useEffect, useState } from 'react';
import {
  startAutoSync,
  stopAutoSync,
  setupAutoSyncOnReconnect,
  subscribeToConnectionStatus,
  registerDevice,
  checkServerConnection,
  ConnectionStatus,
} from '@/services/SyncEngine';
import { useAuth } from '@/context/AuthContext';

export const useLanSync = () => {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    serverReachable: false,
    latency: null,
    lastChecked: null,
    serverUrl: null,
  });

  useEffect(() => {
    // Guard: wrap entire effect body so a single throw cannot crash the app.
    // The sync engine is best-effort — losing the heartbeat or sync interval
    // must never render the app unusable.
    let unsubscribe: (() => void) | undefined;
    let cleanupReconnect: (() => void) | undefined;

    try {
      // Setup reconnect listener
      cleanupReconnect = setupAutoSyncOnReconnect();

      // Subscribe to connection status changes.
      // subscribeToConnectionStatus calls localStorage via notifyListeners on
      // first tick; wrap so a blocked storage API cannot crash the component.
      unsubscribe = subscribeToConnectionStatus((status) => {
        try {
          setConnectionStatus((prev) =>
            status.serverUrl !== undefined ? status : { ...prev, ...status }
          );
        } catch {
          /* ignore stale-state updates */
        }
      });

      // Start auto-sync (every 30s) and heartbeat (every 60s).
      // These register intervals and immediately call checkServerConnection().
      startAutoSync(30_000, 60_000);

      // Initial connection check (fire-and-forget; errors surface in the status)
      checkServerConnection()
        .then((status) => {
          try {
            setConnectionStatus((prev) =>
              status.serverUrl !== undefined ? status : { ...prev, ...status }
            );
            // Register device if connected
            if (status.serverReachable && user) {
              registerDevice(user.name || 'Teacher Device');
            }
          } catch {
            /* component may have unmounted — best-effort */
          }
        })
        .catch(() => {
          /* network or storage error — status remains offline, no crash */
        });
    } catch {
      /* sync engine unavailable — continue with offline state */
    }

    return () => {
      try { stopAutoSync(); } catch { /* best-effort cleanup */ }
      try { unsubscribe?.(); } catch { /* best-effort cleanup */ }
      try { cleanupReconnect?.(); } catch { /* best-effort cleanup */ }
    };
  }, [user?.id]);

  return {
    connectionStatus,
    isConnected: connectionStatus.serverReachable,
    isOnline: connectionStatus.isOnline,
  };
};
