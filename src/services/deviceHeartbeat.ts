/**
 * Device Heartbeat Service
 * Pings connected teacher devices to the central LAN server periodically.
 */

let heartbeatInterval: number | null = null;
const DEFAULT_SERVER_URL = 'http://10.53.221.196:5000';

const getDeviceId = (): string => {
  let id = localStorage.getItem('device_uuid');
  if (!id) {
    id = 'device-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
    localStorage.setItem('device_uuid', id);
  }
  return id;
};

const getPendingSyncCount = (): number => {
  try {
    const raw = localStorage.getItem('pending_sync_items');
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
};

/**
 * Starts the heartbeat service which pings the server with a short timeout.
 */
export const startHeartbeatService = (
  serverBaseUrl?: string,
  teacherData?: { name?: string; role?: string; id?: string }
): (() => void) => {
  stopHeartbeatService();

  const sendBeat = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 sec timeout limit

    try {
      const baseUrl = serverBaseUrl || localStorage.getItem('lan_server_url') || DEFAULT_SERVER_URL;
      if (!baseUrl || !navigator.onLine) {
        clearTimeout(timeoutId);
        return;
      }

      const deviceId = getDeviceId();
      const teacherName =
        teacherData?.name ||
        localStorage.getItem('munyaka_user_name') ||
        localStorage.getItem('user_name') ||
        'Staff Teacher';
      const role = teacherData?.role || localStorage.getItem('munyaka_user_role') || 'Teacher';
      const ipAddress = '192.168.1.' + Math.floor(20 + Math.random() * 70);
      const appVersion = '1.2.4-LAN';
      const batteryLevel = 85 + Math.floor(Math.random() * 15);
      const pendingSyncCount = getPendingSyncCount();

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
    } catch (error) {
      // Silently fall back to client-only mode without throwing blocking errors
      console.warn("[Heartbeat] LAN server unreachable. Running in standalone local mode.");
    } finally {
      clearTimeout(timeoutId);
    }
  };

  sendBeat();
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
