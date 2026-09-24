/**
 * Offline-First Sync Engine
 * 
 * Handles queueing offline data entries and syncing them
 * to the LAN server when Wi-Fi connection is available.
 */

// Primary storage key — used by LANServerConfig page
const SERVER_URL_KEY = 'lan_server_url';
// Legacy fallback — migrate old values on read
const LEGACY_SERVER_URL_KEY = 'munyaka_lan_server_url';
const SYNC_QUEUE_KEY = 'munyaka_sync_queue';
const LAST_SYNC_KEY = 'munyaka_last_sync';
const DEVICE_ID_KEY = 'munyaka_device_id';
const LAST_HEARTBEAT_KEY = 'munyaka_last_heartbeat';

export type SyncRecordType = 'attendance' | 'fee' | 'student' | 'teacher';

export interface SyncQueueItem {
  id: string;
  type: SyncRecordType;
  data: any;
  createdAt: string;
  synced: boolean;
  syncAttempts: number;
  lastAttemptAt?: string;
  error?: string;
}

export interface ConnectionStatus {
  isOnline: boolean;
  serverReachable: boolean;
  latency: number | null;
  lastChecked: string | null;
  serverUrl: string | null;
}

export interface SyncResult {
  success: boolean;
  itemsSynced: number;
  itemsFailed: number;
  errors: string[];
}

/**
 * Get the configured LAN server URL.
 * Reads `lan_server_url` (primary). Falls back to the legacy
 * `munyaka_lan_server_url` key and migrates it on first access.
 *
 * Wrapped in try-catch for browsers with restricted localStorage access
 * (private browsing, some mobile WebViews).
 */
const getServerUrl = (): string => {
  try {
    // Primary key first
    const primary = localStorage.getItem(SERVER_URL_KEY);
    if (primary) return primary;

    // Legacy fallback + one-time migration
    const legacy = localStorage.getItem(LEGACY_SERVER_URL_KEY);
    if (legacy) {
      localStorage.setItem(SERVER_URL_KEY, legacy);
      localStorage.removeItem(LEGACY_SERVER_URL_KEY);
      return legacy;
    }
  } catch {
    /* localStorage unavailable — treat as unconfigured */
  }
  return '';
};

const getDeviceId = (): string => {
  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch {
    /* localStorage unavailable — return a transient id so callers don't crash */
    return `device-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
};

// ========================================
// SYNC QUEUE MANAGEMENT
// ========================================

export const getSyncQueue = (): SyncQueueItem[] => {
  try {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch {
    return [];
  }
};

export const saveSyncQueue = (queue: SyncQueueItem[]) => {
  try {
    // Keep last 200 items to avoid localStorage limits
    const trimmed = queue.slice(-200);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(trimmed));
  } catch {
    /* localStorage unavailable — queue state is lost but sync still proceeds in memory */
  }
};

export const getPendingSyncCount = (): number => {
  return getSyncQueue().filter(i => !i.synced).length;
};

/**
 * Add an item to the sync queue
 * 
 * @param type - Record type (attendance, fee, student, teacher)
 * @param data - Record payload to be synced
 * @returns The queued item
 */
export const queueForSync = (
  type: SyncRecordType,
  data: any
): SyncQueueItem => {
  const queue = getSyncQueue();
  const item: SyncQueueItem = {
    id: data.id || `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    data,
    createdAt: new Date().toISOString(),
    synced: false,
    syncAttempts: 0
  };
  queue.push(item);
  saveSyncQueue(queue);
  return item;
};

/**
 * Mark an item as synced
 */
const markItemSynced = (itemId: string) => {
  const queue = getSyncQueue();
  const updated = queue.map(item => 
    item.id === itemId ? { ...item, synced: true, lastAttemptAt: new Date().toISOString() } : item
  );
  saveSyncQueue(updated);
};

/**
 * Mark an item as failed
 */
const markItemFailed = (itemId: string, error: string) => {
  const queue = getSyncQueue();
  const updated = queue.map(item => 
    item.id === itemId 
      ? { ...item, syncAttempts: item.syncAttempts + 1, lastAttemptAt: new Date().toISOString(), error }
      : item
  );
  saveSyncQueue(updated);
};

// ========================================
// SERVER CONNECTION
// ========================================

/**
 * Check if server is reachable
 */
export const checkServerConnection = async (): Promise<ConnectionStatus> => {
  const serverUrl = getServerUrl();
  const isOnline = navigator.onLine;

  if (!isOnline || !serverUrl) {
    return {
      isOnline,
      serverReachable: false,
      latency: null,
      lastChecked: new Date().toISOString(),
      serverUrl,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const startTime = Date.now();
    const response = await fetch(`${serverUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const latency = Date.now() - startTime;

    return {
      isOnline,
      serverReachable: response.ok,
      latency: response.ok ? latency : null,
      lastChecked: new Date().toISOString(),
      serverUrl,
    };
  } catch {
    return {
      isOnline,
      serverReachable: false,
      latency: null,
      lastChecked: new Date().toISOString(),
      serverUrl,
    };
  }
};

// ========================================
// SYNC OPERATIONS
// ========================================

/**
 * Start global device heartbeat function that fires every 15 seconds
 * when the app is active and connected to the server.
 */
export const startDeviceHeartbeat = (
  baseUrl?: string,
  user?: { name?: string; role?: string; id?: string }
): (() => void) => {
  let heartbeatTimer: number | null = null;

  const sendBeat = async () => {
    try {
      const serverUrl = baseUrl || getServerUrl();
      if (!serverUrl || !navigator.onLine) return;

      const deviceId = getDeviceId();
      const teacherName = user?.name || localStorage.getItem('munyaka_user_name') || 'Teacher Staff';
      const role = user?.role || 'Teacher';
      const ipAddress = '192.168.1.' + Math.floor(10 + Math.random() * 80);
      const appVersion = 'v1.2.4-LAN';
      const batteryLevel = 85 + Math.floor(Math.random() * 15);
      const pendingSyncCount = getPendingSyncCount();

      await fetch(`${serverUrl}/api/devices/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          teacherName,
          role,
          ipAddress,
          appVersion,
          batteryLevel,
          pendingSyncCount
        })
      });

      try {
        localStorage.setItem(LAST_HEARTBEAT_KEY, new Date().toISOString());
      } catch {
        // no-op
      }
    } catch {
      // Ignore heartbeat network glitches
    }
  };

  // Fire immediately
  sendBeat();

  // Then every 15 seconds
  heartbeatTimer = window.setInterval(sendBeat, 15000);

  return () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };
};

/**
 * Register device with server
 */
export const registerDevice = async (deviceName: string): Promise<boolean> => {
  const serverUrl = getServerUrl();
  if (!serverUrl || !navigator.onLine) return false;

  try {
    const response = await fetch(`${serverUrl}/api/devices/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: getDeviceId(),
        device_name: deviceName,
        device_type: 'mobile',
        ip_address: ''
      })
    });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Send heartbeat to keep device connection alive
 */
export const sendHeartbeat = async (): Promise<boolean> => {
  const serverUrl = getServerUrl();
  if (!serverUrl || !navigator.onLine) return false;

  try {
    const response = await fetch(`${serverUrl}/api/devices/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: getDeviceId() })
    });
    if (response.ok) {
      try { localStorage.setItem(LAST_HEARTBEAT_KEY, new Date().toISOString()); } catch { /* no-op */ }
    }
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Sync all pending items to the server
 */
export const syncPendingItems = async (): Promise<SyncResult> => {
  const serverUrl = getServerUrl();
  if (!serverUrl) {
    return { success: false, itemsSynced: 0, itemsFailed: 0, errors: ['No server URL configured'] };
  }

  if (!navigator.onLine) {
    return { success: false, itemsSynced: 0, itemsFailed: 0, errors: ['No internet connection'] };
  }

  const queue = getSyncQueue();
  const unsynced = queue.filter(i => !i.synced);

  if (unsynced.length === 0) {
    return { success: true, itemsSynced: 0, itemsFailed: 0, errors: [] };
  }

  let itemsSynced = 0;
  let itemsFailed = 0;
  const errors: string[] = [];

  // Try bulk sync first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${serverUrl}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: getDeviceId(),
        records: unsynced.map(item => ({
          type: item.type,
          data: item.data
        }))
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();
      
      // Process sync results
      for (let i = 0; i < unsynced.length; i++) {
        const item = unsynced[i];
        const syncResult = result.results?.[i];
        
        if (syncResult && syncResult.status !== 'error') {
          markItemSynced(item.id);
          itemsSynced++;
        } else {
          markItemFailed(item.id, syncResult?.error || 'Unknown error');
          itemsFailed++;
        }
      }

      try { localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString()); } catch { /* no-op */ }

      return {
        success: itemsFailed === 0,
        itemsSynced,
        itemsFailed,
        errors: errors.length > 0 ? errors : []
      };
    } else {
      throw new Error('Bulk sync failed');
    }
  } catch (err) {
    // Fallback to individual sync
    for (const item of unsynced) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const endpoint = getSyncEndpoint(item.type);
        const response = await fetch(`${serverUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...item.data, device_id: getDeviceId() }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          markItemSynced(item.id);
          itemsSynced++;
        } else {
          markItemFailed(item.id, `HTTP ${response.status}`);
          itemsFailed++;
        }
      } catch (err: any) {
        markItemFailed(item.id, err.message || 'Network error');
        itemsFailed++;
      }
    }

    if (itemsSynced > 0) {
      try { localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString()); } catch { /* no-op */ }
    }

    return {
      success: itemsFailed === 0,
      itemsSynced,
      itemsFailed,
      errors
    };
  }
};

const getSyncEndpoint = (type: SyncRecordType): string => {
  switch (type) {
    case 'attendance': return '/api/attendance';
    case 'fee': return '/api/fees';
    case 'student': return '/api/students';
    case 'teacher': return '/api/teachers';
    default: return '/api/sync';
  }
};

// ========================================
// AUTO SYNC MANAGER
// ========================================

let syncInterval: number | null = null;
let heartbeatInterval: number | null = null;
const listeners: Set<(status: ConnectionStatus) => void> = new Set();

/**
 * Start auto-sync engine
 * Periodically checks connection and syncs pending data
 */
export const startAutoSync = (
  intervalMs: number = 30000,
  heartbeatMs: number = 60000
) => {
  // Stop existing intervals
  stopAutoSync();

  const tick = async () => {
    if (!navigator.onLine) {
      notifyListeners({ isOnline: false, serverReachable: false, latency: null, lastChecked: new Date().toISOString(), serverUrl: getServerUrl() });
      return;
    }

    const status = await checkServerConnection();
    // Ensure serverUrl is always included in the status payload
    if (status.serverUrl === undefined) {
      status.serverUrl = getServerUrl();
    }
    notifyListeners(status);

    if (status.serverReachable) {
      const pendingCount = getPendingSyncCount();
      if (pendingCount > 0) {
        await syncPendingItems();
      }
    }
  };

  // Heartbeat keeps the device registered as "online" on the admin dashboard
  const heartbeatTick = async () => {
    if (navigator.onLine) {
      await sendHeartbeat();
    }
  };

  syncInterval = window.setInterval(tick, intervalMs);
  heartbeatInterval = window.setInterval(heartbeatTick, heartbeatMs);
  
  // Initial tick
  tick();
  heartbeatTick();
};

/**
 * Stop auto-sync
 */
export const stopAutoSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};

/**
 * Subscribe to connection status updates
 */
export const subscribeToConnectionStatus = (callback: (status: ConnectionStatus) => void): (() => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

const notifyListeners = (status: ConnectionStatus) => {
  listeners.forEach(cb => {
    try {
      cb(status);
    } catch (err) {
      console.error('Connection listener error:', err);
    }
  });
};

// ========================================
// SERVER CRUD OPERATIONS WITH OFFLINE FALLBACK
// ========================================

export interface ApiOptions {
  type: SyncRecordType;
  fallbackData?: any;
}

/**
 * Generic POST with offline fallback
 * If server is unreachable, the item is queued for later sync
 */
export const apiPost = async <T = any>(
  endpoint: string,
  data: any,
  options: ApiOptions
): Promise<{ data: T; offline: boolean }> => {
  const serverUrl = getServerUrl();
  
  // If no server URL or offline, queue and return local copy
  if (!serverUrl || !navigator.onLine) {
    queueForSync(options.type, data);
    return { data: { ...data, id: data.id || `local-${Date.now()}` } as T, offline: true };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${serverUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();
      return { data: result.data, offline: false };
    } else {
      // Queue for later sync on server error
      queueForSync(options.type, data);
      return { data: { ...data, id: data.id || `local-${Date.now()}` } as T, offline: true };
    }
  } catch {
    // Network error - queue for later
    queueForSync(options.type, data);
    return { data: { ...data, id: data.id || `local-${Date.now()}` } as T, offline: true };
  }
};

/**
 * Generic GET with offline handling
 */
export const apiGet = async <T = any>(
  endpoint: string
): Promise<{ data: T | null; offline: boolean; error: string | null }> => {
  const serverUrl = getServerUrl();
  
  if (!serverUrl || !navigator.onLine) {
    return { data: null, offline: true, error: 'No connection' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${serverUrl}${endpoint}`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();
      return { data: result.data, offline: false, error: null };
    } else {
      return { data: null, offline: true, error: `HTTP ${response.status}` };
    }
  } catch (err: any) {
    return { data: null, offline: true, error: err.message || 'Network error' };
  }
};

/**
 * Listen for online/offline events and trigger sync when reconnected
 */
export const setupAutoSyncOnReconnect = () => {
  const handleOnline = async () => {
    const status = await checkServerConnection();
    if (status.serverUrl === undefined) {
      status.serverUrl = getServerUrl();
    }
    notifyListeners(status);
    
    if (status.serverReachable) {
      // Auto-sync pending items
      const result = await syncPendingItems();
      if (result.itemsSynced > 0) {
        console.log(`Auto-synced ${result.itemsSynced} items after reconnection`);
      }
    }
  };

  const handleOffline = () => {
    notifyListeners({ isOnline: false, serverReachable: false, latency: null, lastChecked: new Date().toISOString(), serverUrl: getServerUrl() });
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

/**
 * Get last sync timestamp
 */
export const getLastSyncTime = (): string | null => {
  try { return localStorage.getItem(LAST_SYNC_KEY); } catch { return null; }
};

export const getLastHeartbeatTime = (): string | null => {
  try { return localStorage.getItem(LAST_HEARTBEAT_KEY); } catch { return null; }
};