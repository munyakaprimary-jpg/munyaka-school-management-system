import React, { useEffect } from 'react';
import {
  Smartphone,
  ShieldOff,
  ShieldCheck,
  RefreshCw,
  Wifi,
  WifiOff,
  Monitor,
  Circle,
} from 'lucide-react';
import { TeacherDevice, simulateDeviceHeartbeat } from '@/types/device';
import { useDeviceMonitoring } from '@/hooks/useDeviceMonitoring';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { showSuccess, showError } from '@/utils/toast';

/** Seed demo devices on first render if the registry is empty */
const SEED_DEMO_DEVICES = (onDevicesReady: () => void) => {
  const existing = JSON.parse(localStorage.getItem('monitored_devices') || '[]');
  if (existing.length > 0) {
    onDevicesReady();
    return;
  }

  const seeds: Array<{
    deviceId: string;
    teacherId: string;
    teacherName: string;
    phoneModel: string;
    osVersion: string;
    appVersion: string;
  }> = [
    {
      deviceId: 'dev-001-samsung-a14',
      teacherId: 'teacher-001',
      teacherName: 'Jane Mwangi',
      phoneModel: 'Samsung Galaxy A14',
      osVersion: 'Android 13',
      appVersion: 'v1.2.4',
    },
    {
      deviceId: 'dev-002-tecno-spark',
      teacherId: 'teacher-002',
      teacherName: 'Peter Otieno',
      phoneModel: 'Tecno Spark 10C',
      osVersion: 'Android 12',
      appVersion: 'v1.2.3',
    },
    {
      deviceId: 'dev-003-infinix-hot',
      teacherId: 'teacher-003',
      teacherName: 'Grace Wanjiku',
      phoneModel: 'Infinix Hot 30i',
      osVersion: 'Android 13',
      appVersion: 'v1.2.4',
    },
    {
      deviceId: 'dev-004-xiaomi-redmi',
      teacherId: 'teacher-004',
      teacherName: 'Samuel Kimani',
      phoneModel: 'Xiaomi Redmi Note 12',
      osVersion: 'Android 14',
      appVersion: 'v1.3.0',
    },
    {
      deviceId: 'dev-005-oppo-a78',
      teacherId: 'teacher-005',
      teacherName: 'Emily Njeri',
      phoneModel: 'OPPO A78 5G',
      osVersion: 'Android 13',
      appVersion: 'v1.2.4',
    },
  ];

  seeds.forEach((seed, idx) => {
    const offsetMs = (seeds.length - idx) * 1000 * 60 * 3; // 3 min apart, newest first
    const lastActive = new Date(Date.now() - offsetMs).toISOString();
    simulateDeviceHeartbeat({
      ...seed,
      lastActive,
      isOnline: Math.random() > 0.3,
    });
  });

  // Mark one as locked for demo
  const devices = JSON.parse(localStorage.getItem('monitored_devices') || '[]');
  const locked = devices.map((d: TeacherDevice) =>
    d.teacherId === 'teacher-003' ? { ...d, isLocked: true } : d
  );
  localStorage.setItem('monitored_devices', JSON.stringify(locked));
  onDevicesReady();
};

const SyncStatusBadge: React.FC<{ status: TeacherDevice['syncStatus'] }> = ({ status }) => {
  const configs = {
    synced: {
      label: 'Synced',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
      pulse: false,
    },
    pending_changes: {
      label: 'Pending',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
      pulse: true,
    },
    offline: {
      label: 'Offline',
      bg: 'bg-slate-100',
      text: 'text-slate-500',
      dot: 'bg-slate-400',
      pulse: false,
    },
  };
  const c = configs[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${c.pulse ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  );
};

const DeviceRowSkeleton: React.FC = () => (
  <tr className="border-b border-gray-50">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <td key={i} className="p-3">
        <Skeleton className="h-4 w-full rounded" />
      </td>
    ))}
  </tr>
);

export interface DeviceMonitoringDashboardProps {
  /** Called with the updated device list after a lock toggle */
  onToggleLock?: (deviceId: string) => void;
  /** Called on manual refresh */
  onRefresh?: () => void;
}

export const DeviceMonitoringDashboard: React.FC<DeviceMonitoringDashboardProps> = ({
  onToggleLock,
  onRefresh,
}) => {
  const { devices, isLoading, onToggleLock: hookToggle, onRefresh: hookRefresh } = useDeviceMonitoring();
  const [seeded, setSeeded] = React.useState(false);

  useEffect(() => {
    if (!seeded) {
      SEED_DEMO_DEVICES(() => setSeeded(true));
    }
  }, [seeded]);

  const handleToggleLock = (deviceId: string) => {
    const device = devices.find((d) => d.deviceId === deviceId);
    hookToggle(deviceId);
    onToggleLock?.(deviceId);
    if (device) {
      showSuccess(
        device.isLocked
          ? `App unlocked on ${device.phoneModel}`
          : `App locked on ${device.phoneModel}`
      );
    }
  };

  const handleRefresh = () => {
    hookRefresh();
    onRefresh?.();
  };

  const onlineCount = devices.filter((d) => d.isOnline).length;
  const lockedCount = devices.filter((d) => d.isLocked).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* ── Card Header ── */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <Monitor size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 leading-tight">
                Connected Teacher Devices
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Monitor active app sessions, hardware details, and access state
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Online count */}
            <Badge className="rounded-full px-3 py-1 text-[10px] font-black bg-emerald-50 text-emerald-700 border-0 gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {onlineCount} Online
            </Badge>

            {/* Locked count */}
            {lockedCount > 0 && (
              <Badge className="rounded-full px-3 py-1 text-[10px] font-black bg-red-50 text-red-700 border-0 gap-1.5">
                <ShieldOff size={10} />
                {lockedCount} Locked
              </Badge>
            )}

            {/* Total count */}
            <Badge className="rounded-full px-3 py-1 text-[10px] font-black bg-purple-50 text-purple-700 border-0">
              {devices.length} Registered
            </Badge>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 h-8 px-3 gap-1.5"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span className="text-xs font-semibold">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-[10px] font-black uppercase tracking-widest">
              <th className="p-4 pl-6">Teacher</th>
              <th className="p-4">Device / OS</th>
              <th className="p-4">App Version</th>
              <th className="p-4">Last Active</th>
              <th className="p-4">Network</th>
              <th className="p-4">Sync</th>
              <th className="p-4 pr-6 text-right">Access Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <DeviceRowSkeleton key={i} />)
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Smartphone size={22} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-600">No devices registered</p>
                    <p className="text-xs text-gray-400 max-w-xs">
                      Teacher mobile apps will appear here once they send their first heartbeat signal.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              devices.map((device) => (
                <tr
                  key={device.deviceId}
                  className="hover:bg-indigo-50/30 transition-colors group"
                >
                  {/* Teacher */}
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-xs shadow-sm shrink-0">
                        {device.teacherName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <span className="font-semibold text-gray-900 text-sm">
                        {device.teacherName}
                      </span>
                    </div>
                  </td>

                  {/* Device / OS */}
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Smartphone className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{device.phoneModel}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{device.osVersion}</p>
                      </div>
                    </div>
                  </td>

                  {/* App Version */}
                  <td className="p-4">
                    <code className="text-xs font-mono bg-gray-100 text-gray-600 rounded-md px-2 py-1">
                      {device.appVersion}
                    </code>
                  </td>

                  {/* Last Active */}
                  <td className="p-4">
                    <div className="text-xs text-gray-500">
                      <p>{new Date(device.lastActive).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</p>
                      <p className="font-medium text-gray-700">
                        {new Date(device.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </td>

                  {/* Network */}
                  <td className="p-4">
                    {device.isOnline ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                        <Wifi className="w-3.5 h-3.5" />
                        Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                        <WifiOff className="w-3.5 h-3.5" />
                        Offline
                      </span>
                    )}
                  </td>

                  {/* Sync Status */}
                  <td className="p-4">
                    <SyncStatusBadge status={device.syncStatus} />
                  </td>

                  {/* Access Control */}
                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={() => handleToggleLock(device.deviceId)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm ${
                        device.isLocked
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                      }`}
                    >
                      {device.isLocked ? (
                        <ShieldOff className="w-3.5 h-3.5" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      {device.isLocked ? 'App Locked' : 'Active'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Card Footer ── */}
      {devices.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-gray-500">
            Showing <span className="font-semibold text-gray-700">{devices.length}</span> registered device
            {devices.length !== 1 ? 's' : ''}. Heartbeats update every 5 seconds.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Circle size={8} className="fill-emerald-400 text-emerald-400" />
            Live
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceMonitoringDashboard;
