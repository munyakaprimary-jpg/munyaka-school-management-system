/**
 * Teacher Device Tracking Schema
 * Tracks heartbeat signals from mobile teacher app installations.
 */

export interface TeacherDevice {
  deviceId: string;
  teacherId: string;
  teacherName: string;
  phoneModel: string;        // e.g., "Samsung Galaxy A14", "Techno Spark"
  osVersion: string;         // e.g., "Android 13"
  appVersion: string;        // e.g., "v1.2.4"
  lastActive: string;        // ISO timestamp
  isOnline: boolean;
  syncStatus: 'synced' | 'pending_changes' | 'offline';
  isLocked: boolean;
}

/** Key used in localStorage for the device registry */
export const MONITORED_DEVICES_KEY = 'monitored_devices';

/**
 * Device Telemetry Heartbeat Payload
 * Lightweight payload sent on app open or sync.
 */
export interface DeviceHeartbeat {
  deviceId: string;
  teacherId: string;
  phoneModel: string;
  osVersion: string;
  appVersion: string;
  lastActive: string;
  isOnline: boolean;
}

/** Read all registered devices from localStorage */
export const getMonitoredDevices = (): TeacherDevice[] => {
  try {
    const raw = localStorage.getItem(MONITORED_DEVICES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TeacherDevice[];
  } catch {
    return [];
  }
};

/** Save a heartbeat into the monitored devices registry */
export const saveDeviceHeartbeat = (heartbeat: DeviceHeartbeat, teacherName: string): TeacherDevice[] => {
  const devices = getMonitoredDevices();
  const existing = devices.find((d) => d.deviceId === heartbeat.deviceId);

  const updated: TeacherDevice = existing
    ? { ...existing, ...heartbeat, teacherName }
    : {
        ...heartbeat,
        teacherName,
        syncStatus: heartbeat.isOnline ? 'synced' : 'offline',
        isLocked: existing?.isLocked ?? false,
      };

  const next = [
    ...devices.filter((d) => d.deviceId !== heartbeat.deviceId),
    updated,
  ];

  localStorage.setItem(MONITORED_DEVICES_KEY, JSON.stringify(next));
  return next;
};

/** Toggle the app-lock state for a specific device */
export const toggleDeviceLock = (deviceId: string): TeacherDevice[] => {
  const devices = getMonitoredDevices();
  const next = devices.map((d) =>
    d.deviceId === deviceId ? { ...d, isLocked: !d.isLocked } : d
  );
  localStorage.setItem(MONITORED_DEVICES_KEY, JSON.stringify(next));
  return next;
};

/**
 * Simulate a device heartbeat for demo/testing purposes.
 * In production, this would be called from the mobile app via Capacitor.
 */
export const simulateDeviceHeartbeat = (
  partial: Partial<DeviceHeartbeat> & { teacherId: string; teacherName: string }
): TeacherDevice[] => {
  const heartbeat: DeviceHeartbeat = {
    deviceId: partial.deviceId ?? `device-${Date.now()}`,
    teacherId: partial.teacherId,
    phoneModel: partial.phoneModel ?? 'Unknown Device',
    osVersion: partial.osVersion ?? 'Unknown OS',
    appVersion: partial.appVersion ?? '1.0.0',
    lastActive: new Date().toISOString(),
    isOnline: navigator.onLine,
  };
  return saveDeviceHeartbeat(heartbeat, partial.teacherName);
};
