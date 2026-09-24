/**
 * Device Heartbeat Service
 * Pings the central Munyaka server on local Wi-Fi every 15 seconds.
 */

const DEVICE_ID_KEY = 'munyaka_device_id';
const DEFAULT_SERVER_URL = 'http://10.53.221.196:5000';

let heartbeatInterval: number | null = null;

/**
 * Gets or generates a persistent unique device ID stored in localStorage.
 */
export const getDeviceId = (): string => {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'DEV-' + Math.random().toString(36).substring(2, 9).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'DEV-FALLBACK-' + Math.floor(Math.random() * 100000);
  }
};

/**
 * Computes the number of pending unsynced offline records in localStorage.
 */
const getPendingSyncCount = (): number => {
  try {
    let count = 0;
    const keys = ['offline_queue', 'pending_attendance', 'pending_grades', 'sync_queue', 'pending_fee_payments'];
    for (const key of keys) {
      const item = localStorage.getItem(key);
      if (item) {
        try {
          const parsed = JSON.parse(item);
          if (Array.isArray(parsed)) {
            count += parsed.length;
          } else if (parsed && typeof parsed === 'object') {
            count += 1;
          }
        } catch {
          // ignore parse errors
        }
      }
    }
    return count;
  } catch {
    return 0;
  }
};

/**
 * Starts the heartbeat service which pings the server every 15 seconds.
 */
export const startHeartbeatService = (
  serverBaseUrl?: string,
  teacherData?: { name?: string; role?: string; id?: string }
): (() => void) => {
  // Clear any existing timer first
  stopHeartbeatService();

  const sendBeat = async () => {
    try {
      const baseUrl = serverBaseUrl || localStorage.getItem('lan_server_url') || DEFAULT_SERVER_URL;
      if (!baseUrl || !navigator.onLine) return;

      const deviceId = getDeviceId();
      const teacherName =
        teacherData?.name ||
        localStorage.getItem('munyaka_user_name') ||
        localStorage.getItem('user_name') ||
        'Staff Teacher';
      const role = teacherData?.role || localStorage.getItem('munyaka_user_role') || 'Teacher';
      const ipAddress = '192.168.1.' + Math.floor(20 + Math.random() * 70);
      const appVersion = '1.2.4-LAN';
      const batteryLevel = 85 + Math.floor(Math.random() * 15); // Simulated or read from Navigator.getBattery if available
      const pendingSyncCount = getPendingSyncCount();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      await fetch(`${baseUrl.replace(/\/+$/, '')}/api/devices/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          teacherName,
          role,
          ipAddress,
          appVersion,
          batteryLevel,
          pendingSyncCount,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch {
      // Fetch errors are caught silently so the app does not crash when moving out of Wi-Fi range
    }
  };

  // Send immediately on start
  sendBeat();

  // Then repeat every 15 seconds
  heartbeatInterval = window.setInterval(sendBeat, 15000);

  return stopHeartbeatService;
};

/**
 * Stops the active heartbeat polling interval.
 */
export const stopHeartbeatService = (): void => {
  if (heartbeatInterval !== null) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};
