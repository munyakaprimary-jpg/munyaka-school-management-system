/**
 * LAN Sync Engine Hook
 * 
 * Provides a React hook that automatically starts the LAN sync engine
 * when the app loads, monitors connection status, and cleans up on unmount.
 */

import { useEffect, useState } from 'react';
import {
  startAutoSync,
  stopAutoSync,
  setupAutoSyncOnReconnect,
  subscribeToConnectionStatus,
  registerDevice,
  checkServerConnection,
  ConnectionStatus
} from '@/services/SyncEngine';
import { useAuth } from '@/context/AuthContext';

export const useLanSync = () => {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    serverReachable: false,
    latency: null,
    lastChecked: null
  });

  useEffect(() => {
    // Setup reconnect listener
    const cleanupReconnect = setupAutoSyncOnReconnect();
    
    // Subscribe to connection status changes
    const unsubscribe = subscribeToConnectionStatus(setConnectionStatus);
    
    // Start auto-sync (every 30s) and heartbeat (every 60s)
    startAutoSync(30000, 60000);
    
    // Initial connection check
    checkServerConnection().then(status => {
      setConnectionStatus(status);
      
      // Register device if connected and we have a user
      if (status.serverReachable && user) {
        registerDevice(user.name || 'Teacher Device');
      }
    });
    
    return () => {
      stopAutoSync();
      unsubscribe();
      cleanupReconnect();
    };
  }, [user?.id]);

  return {
    connectionStatus,
    isConnected: connectionStatus.serverReachable,
    isOnline: connectionStatus.isOnline
  };
};