import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/apiBase';
import { CentralDataService } from '@/services/centralDataService';
import {
  Server,
  Monitor,
  Smartphone,
  Database,
  Users,
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Plus,
  Edit2,
  Shield,
  Clock,
  Activity,
  HardDrive,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Settings,
  Wifi as LanIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/utils/toast';
import { showSuccess, showError } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import LANServerConfig from '@/pages/LANServerConfig';

interface ServerInfo {
  ip: string;
  port: number;
  url: string;
  database: string;
  version: string;
  uptime: number;
  timestamp: string;
}

interface ConnectedDevice {
  id: string;
  device_id: string;
  device_name: string;
  device_type: string;
  last_seen: string;
  ip_address: string;
  current_status: 'online' | 'offline';
  created_at: string;
}

interface SyncQueueItem {
  id: string;
  device_id: string;
  data_type: string;
  data_json: string;
  synced_at: string | null;
  created_at: string;
}

interface DBStats {
  students: number;
  teachers: number;
  attendance_today: number;
  pending_fees: number;
  connected_devices: number;
  pending_sync: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  staff_id: string;
  is_active: number;
  created_at: string;
}

const LAN_SERVER_KEY = 'lan_server_url';
const ADMIN_USERS_KEY = 'munyaka_admin_users';
const getServerUrl = () => localStorage.getItem(LAN_SERVER_KEY) || getApiBaseUrl();

/** Load admin users from central persistent storage / localStorage. Falls back to default admin. */
const loadLocalUsers = (): User[] => {
  try {
    const raw = CentralDataService.getData<User[]>(ADMIN_USERS_KEY, []);
    if (raw && raw.length > 0) return raw;
    const legacy = localStorage.getItem(ADMIN_USERS_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Default admin fallback
    const defaults: User[] = [
      { id: 'usr-1', name: 'System Administrator', email: 'admin@munyaka.ac.ke', phone: '+254700000000', role: 'admin', staff_id: 'ADM001', is_active: 1, created_at: new Date().toISOString() },
      { id: 'usr-2', name: 'Head Teacher', email: 'headteacher@munyaka.ac.ke', phone: '+254711111111', role: 'head_teacher', staff_id: 'HT001', is_active: 1, created_at: new Date().toISOString() },
      { id: 'usr-3', name: 'Bursar', email: 'bursar@munyaka.ac.ke', phone: '+254722222222', role: 'bursar', staff_id: 'BUR001', is_active: 1, created_at: new Date().toISOString() }
    ];
    CentralDataService.setData(ADMIN_USERS_KEY, defaults);
    return defaults;
  } catch {
    return [];
  }
};

/** Persist admin users to central persistent storage. */
const saveLocalUsers = (users: User[]): void => {
  try {
    CentralDataService.setData(ADMIN_USERS_KEY, users);
    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
  } catch {}
};

/**
 * Detect the machine's external LAN IPv4 address via a WebRTC ICE
 * candidate gather. This works without privileged access because it
 * only uses STUN. Falls back to null when the browser blocks WebRTC
 * (e.g. some privacy modes) or when no candidate is gathered.
 */
const detectClientLanIP = (): Promise<string | null> => {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      pc.createDataChannel('');

      const tryResolve = (ip: string) => {
        if (
          ip &&
          ip !== '0.0.0.0' &&
          ip !== '127.0.0.1' &&
          ip !== '255.255.255.255'
        ) {
          try { pc.close(); } catch {}
          resolve(ip);
        }
      };

      pc.onicecandidate = (e) => {
        if (!e || !e.candidate) return;
        const cand = e.candidate.candidate || '';
        const ipMatch = cand.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (ipMatch) {
          tryResolve(ipMatch[1]);
        }
      };

      setTimeout(() => {
        try { pc.close(); } catch {}
        resolve(null);
      }, 4000);

      pc.createOffer({}).then((offer) => pc.setLocalDescription(offer)).catch(() => resolve(null));
    } catch {
      resolve(null);
    }
  });
};

/**
 * The backend's `getLocalIP()` may return 127.0.0.1 / ::1 / 0.0.0.0
 * (especially in containers or hosts without an external NIC). When this
 * happens, the `serverInfo.url` returned by `/api/server/info` is
 * useless for mobile clients on the LAN. This helper rewrites the URL
 * to point at the host machine's real LAN IPv4 address when one is
 * detectable from the browser.
 */
const resolveLanUrl = (
  serverUrl: string,
  clientLanIP: string | null
): { url: string; isLoopback: boolean; resolved: boolean } => {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const portMatch = serverUrl ? serverUrl.match(/:(\d+)/) : null;
  const port = portMatch ? portMatch[1] : (typeof window !== 'undefined' && window.location.port ? window.location.port : '5000');

  // If we have clientLanIP and it's a valid local LAN IP (e.g. 192.168.x.x or 10.x.x.x)
  if (clientLanIP && clientLanIP !== '127.0.0.1' && clientLanIP !== 'localhost') {
    return { url: `${protocol}//${clientLanIP}:${port}`, isLoopback: false, resolved: true };
  }

  // If current browser hostname is already a LAN IP or domain
  if (currentHost && currentHost !== 'localhost' && currentHost !== '127.0.0.1' && !currentHost.includes('0.0.0.0')) {
    return { url: `${protocol}//${currentHost}:${port}`, isLoopback: false, resolved: true };
  }

  if (!serverUrl || serverUrl.includes('127.') || serverUrl.includes('localhost') || serverUrl.includes('0.0.0.0') || serverUrl.includes('::1')) {
    return { url: `http://192.168.1.100:${port}`, isLoopback: true, resolved: false };
  }

  return { url: serverUrl, isLoopback: false, resolved: true };
};

const formatUptime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const formatLastSeen = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString();
};

type TabId = 'system' | 'lan';

export default function AdminControlCenter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('system');
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [stats, setStats] = useState<DBStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serverUrl, setServerUrl] = useState(getServerUrl());
  const [clientLanIP, setClientLanIP] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', role: 'teacher', password: '', staff_id: '' });
  const [showServerSettings, setShowServerSettings] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    detectClientLanIP().then((ip) => {
      if (!cancelled) setClientLanIP(ip);
    });
    return () => { cancelled = true; };
  }, []);

  const fetchData = useCallback(async () => {
    // Always load users from localStorage first (offline-first)
    setUsers(loadLocalUsers());

    if (!isOnline) {
      setIsLoading(false);
      return;
    }

    setRefreshing(true);
    const baseUrl = getServerUrl();

    try {
      const [infoRes, devicesRes, statsRes] = await Promise.all([
        fetch(`${baseUrl}/api/server/info`).catch(() => null),
        fetch(`${baseUrl}/api/devices`).catch(() => null),
        fetch(`${baseUrl}/api/stats`).catch(() => null),
      ]);

      if (infoRes?.ok) {
        const data = await infoRes.json();
        setServerInfo(data.data);
        setServerUrl(data.data.url);
      }

      if (devicesRes?.ok) {
        const data = await devicesRes.json();
        setDevices(data.data || []);
      }

      if (statsRes?.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch server data:', err);
    }

    setIsLoading(false);
    setRefreshing(false);
  }, [isOnline]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copied to clipboard');
  };

  const handleSaveServerUrl = () => {
    try {
      localStorage.setItem(LAN_SERVER_KEY, serverUrl);
      setShowServerSettings(false);
      fetchData();
      showSuccess('Server URL updated');
    } catch (e) {
      console.error('Failed to save server URL:', e);
      showError('Failed to save server URL');
    }
  };

  const handleBackup = async () => {
    try {
      // Collect all localStorage data and bundle into a single JSON file
      const all: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        const v = localStorage.getItem(k);
        if (v !== null) {
          try { all[k] = JSON.parse(v); } catch { all[k] = v; }
        }
      }
      const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `munyaka-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess('Database backup downloaded');
    } catch (e) {
      console.error('Backup failed:', e);
      showError('Failed to download backup');
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid backup file format');
      }

      // Restore each key into localStorage
      for (const [key, value] of Object.entries(data)) {
        try {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        } catch (e) {
          console.error(`Failed to restore key ${key}:`, e);
        }
      }
      showSuccess('Database restored successfully — reloading data…');
      // Refresh local user list
      setUsers(loadLocalUsers());
    } catch (e) {
      console.error('Restore failed:', e);
      showError('Failed to restore database');
    }
    event.target.value = '';
  };

  const handleCreateUser = async () => {
    try {
      const all = loadLocalUsers();
      const created: User = {
        id: `user-${Date.now()}`,
        ...newUser,
        is_active: 1,
        created_at: new Date().toISOString(),
      };
      all.push(created);
      saveLocalUsers(all);
      setUsers(all);
      showSuccess('User created successfully');
      setShowAddUser(false);
      setNewUser({ name: '', email: '', phone: '', role: 'teacher', password: '', staff_id: '' });
    } catch (e) {
      console.error('Failed to create user:', e);
      showError('Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    try {
      const all = loadLocalUsers();
      const updated = all.map(u => u.id === editUser.id ? editUser : u);
      saveLocalUsers(updated);
      setUsers(updated);
      showSuccess('User updated successfully');
      setEditUser(null);
    } catch (e) {
      console.error('Failed to update user:', e);
      showError('Failed to update user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const all = loadLocalUsers().filter(u => u.id !== id);
      saveLocalUsers(all);
      setUsers(all);
      showSuccess('User deleted successfully');
    } catch (e) {
      console.error('Failed to delete user:', e);
      showError('Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      const all = loadLocalUsers();
      const updated = all.map(u =>
        u.id === user.id ? { ...u, is_active: u.is_active ? 0 : 1 } : u
      );
      saveLocalUsers(updated);
      setUsers(updated);
      showSuccess(`User ${user.is_active ? 'deactivated' : 'activated'}`);
    } catch (e) {
      console.error('Failed to toggle user status:', e);
      showError('Failed to update user status');
    }
  };

  // Only admin (and super_admin) users can access this page.
  if (user?.role !== 'admin' && (user?.role as string) !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="w-16 h-16 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Admin Access Required</h2>
            <p className="text-slate-600 dark:text-slate-400">You need administrator privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'system', label: 'System & Academic Settings', icon: Server },
    { id: 'lan', label: 'LAN & Local Server Config', icon: LanIcon },
  ];

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-3 space-y-6 pb-20">
      {/* Page-level header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Server className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">Admin Control Center</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">System & Academic Settings</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`${isOnline ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'} border-0`}>
              {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/settings')}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl"
              title="System Settings & Preferences"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-200 shrink-0",
                  isActive
                    ? "bg-white/20 text-white shadow-lg"
                    : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab 1: System & Academic Settings ─────────────────────────────── */}
      {activeTab === 'system' && (
        <>
          {/* Server Connection Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 text-white shadow-xl -mt-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">Server Address (for Mobile APK)</p>
                  <p className="text-xl font-black font-mono truncate">{(() => {
                    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
                    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
                    const port = '5000';
                    if (currentHost && currentHost !== 'localhost' && currentHost !== '127.0.0.1' && !currentHost.includes('0.0.0.0')) {
                      return `${protocol}//${currentHost}:${port}`;
                    }
                    if (clientLanIP && clientLanIP !== '127.0.0.1') {
                      return `http://${clientLanIP}:${port}`;
                    }
                    if (serverInfo && serverInfo.url && !serverInfo.url.includes('127.0.0.1') && !serverInfo.url.includes('localhost')) {
                      return serverInfo.url;
                    }
                    return 'http://192.168.1.100:5000';
                  })()}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 mt-1">✓ Connected (Active Wi-Fi LAN Server)</p>
                </div>
                {serverInfo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(resolveLanUrl(serverInfo.url, clientLanIP).url)}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {serverInfo && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-white/10">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Port</p>
                    <p className="font-bold">{serverInfo.port}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Version</p>
                    <p className="font-bold">{serverInfo.version}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Uptime</p>
                    <p className="font-bold">{formatUptime(serverInfo.uptime)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Connected</p>
                    <p className="font-bold">{stats?.connected_devices || 0} devices</p>
                  </div>
                </div>
              )}
              {!serverInfo && !isLoading && (
                <p className="text-sm opacity-70 mt-1">Server Not Connected — make sure the LAN server is running</p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
                <CardContent className="pt-4 pb-3">
                  <Users className="w-6 h-6 mb-2 opacity-80" />
                  <p className="text-2xl font-black">{stats.students}</p>
                  <p className="text-xs font-bold opacity-80">Students</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white">
                <CardContent className="pt-4 pb-3">
                  <Activity className="w-6 h-6 mb-2 opacity-80" />
                  <p className="text-2xl font-black">{stats.teachers}</p>
                  <p className="text-xs font-bold opacity-80">Teachers</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0 text-white">
                <CardContent className="pt-4 pb-3">
                  <CheckCircle2 className="w-6 h-6 mb-2 opacity-80" />
                  <p className="text-2xl font-black">{stats.attendance_today}</p>
                  <p className="text-xs font-bold opacity-80">Attendance Today</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-rose-500 to-rose-600 border-0 text-white">
                <CardContent className="pt-4 pb-3">
                  <HardDrive className="w-6 h-6 mb-2 opacity-80" />
                  <p className="text-2xl font-black">{stats.pending_fees}</p>
                  <p className="text-xs font-bold opacity-80">Pending Fees</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-violet-500 to-violet-600 border-0 text-white">
                <CardContent className="pt-4 pb-3">
                  <Smartphone className="w-6 h-6 mb-2 opacity-80" />
                  <p className="text-2xl font-black">{stats.connected_devices}</p>
                  <p className="text-xs font-bold opacity-80">Online Devices</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 border-0 text-white">
                <CardContent className="pt-4 pb-3">
                  <RefreshCw className="w-6 h-6 mb-2 opacity-80" />
                  <p className="text-2xl font-black">{stats.pending_sync}</p>
                  <p className="text-xs font-bold opacity-80">Pending Sync</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Connected Devices */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                  <CardTitle className="text-lg">Connected Teacher Devices</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchData}
                  disabled={refreshing}
                  className="rounded-xl"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <CardDescription>Teachers currently connected to this server via mobile APK</CardDescription>
            </CardHeader>
            <CardContent>
              {devices.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No devices connected</p>
                  <p className="text-sm">Teachers will appear here when they connect their mobile APK</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          device.current_status === 'online'
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}>
                          {device.device_type === 'mobile' ? (
                            <Smartphone className={`w-6 h-6 ${
                              device.current_status === 'online' ? 'text-green-600' : 'text-slate-400'
                            }`} />
                          ) : (
                            <Monitor className={`w-6 h-6 ${
                              device.current_status === 'online' ? 'text-green-600' : 'text-slate-400'
                            }`} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {device.device_name || 'Unknown Device'}
                          </p>
                          <p className="text-sm text-slate-500 font-mono">{device.device_id}</p>
                          {device.ip_address && (
                            <p className="text-xs text-slate-400">IP: {device.ip_address}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={device.current_status === 'online' ? 'default' : 'secondary'}
                          className={`${
                            device.current_status === 'online'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {device.current_status === 'online' ? (
                            <><CheckCircle2 className="w-3 h-3 mr-1" /> Online</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" /> Offline</>
                          )}
                        </Badge>
                        <p className="text-xs text-slate-400 mt-1 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {formatLastSeen(device.last_seen)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Database & Backup */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  <CardTitle className="text-lg">Database Management</CardTitle>
                </div>
                <CardDescription>Backup and restore your school data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Download className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">Export Backup</p>
                    <p className="text-sm text-slate-500">Download complete database as JSON</p>
                  </div>
                  <Button onClick={handleBackup} className="rounded-xl bg-blue-600 hover:bg-blue-700">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">Restore Backup</p>
                    <p className="text-sm text-slate-500">Import data from a backup file</p>
                  </div>
                  <label>
                    <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                    <Button asChild className="rounded-xl bg-amber-600 hover:bg-amber-700">
                      <span><Upload className="w-4 h-4 mr-2" />Import</span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* User Account Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <CardTitle className="text-lg">User Accounts</CardTitle>
                  </div>
                  <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-1" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-3xl">
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>Create a new user account for staff access</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Full Name</Label>
                          <Input
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                            placeholder="John Kamau"
                            className="rounded-xl mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={newUser.email}
                              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                              placeholder="john@school.sc.ke"
                              className="rounded-xl mt-1"
                            />
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <Input
                              value={newUser.phone}
                              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                              placeholder="+254 700 000 000"
                              className="rounded-xl mt-1"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Role</Label>
                            <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                              <SelectTrigger className="rounded-xl mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="head_teacher">Head Teacher</SelectItem>
                                <SelectItem value="teacher">Teacher</SelectItem>
                                <SelectItem value="bursar">Bursar</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Staff ID</Label>
                            <Input
                              value={newUser.staff_id}
                              onChange={(e) => setNewUser({ ...newUser, staff_id: e.target.value })}
                              placeholder="T001"
                              className="rounded-xl mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Password</Label>
                          <Input
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            placeholder="Enter password"
                            className="rounded-xl mt-1"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddUser(false)} className="rounded-xl">
                          Cancel
                        </Button>
                        <Button onClick={handleCreateUser} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                          Create User
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <CardDescription>Manage staff access to the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-sm">
                          {u.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email || u.staff_id || 'No email'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="rounded-lg text-xs">
                          {u.role.replace('_', ' ')}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`rounded-lg text-xs cursor-pointer ${
                            u.is_active
                              ? 'border-green-200 text-green-600 hover:bg-green-50'
                              : 'border-red-200 text-red-600 hover:bg-red-50'
                          }`}
                          onClick={() => handleToggleUserStatus(u)}
                        >
                          {u.is_active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          {u.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl"
                            onClick={() => setEditUser(u)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit User Dialog */}
          <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>Update user account details</DialogDescription>
              </DialogHeader>
              {editUser && (
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={editUser.name}
                      onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={editUser.email}
                        onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                        className="rounded-xl mt-1"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={editUser.phone}
                        onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                        className="rounded-xl mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Role</Label>
                      <Select value={editUser.role} onValueChange={(v) => setEditUser({ ...editUser, role: v })}>
                        <SelectTrigger className="rounded-xl mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="head_teacher">Head Teacher</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="bursar">Bursar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Staff ID</Label>
                      <Input
                        value={editUser.staff_id}
                        onChange={(e) => setEditUser({ ...editUser, staff_id: e.target.value })}
                        className="rounded-xl mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>New Password (leave blank to keep current)</Label>
                    <Input
                      type="password"
                      value={(editUser as any).password || ''}
                      onChange={(e) => setEditUser({ ...editUser, password: e.target.value } as any)}
                      placeholder="Enter new password"
                      className="rounded-xl mt-1"
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditUser(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* ── Tab 2: LAN & Local Server Config ─────────────────────────────── */}
      {activeTab === 'lan' && (
        <LANServerConfig />
      )}

      {/* Server Settings Dialog */}
      <Dialog open={showServerSettings} onOpenChange={setShowServerSettings}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Server Connection Settings</DialogTitle>
            <DialogDescription>Configure the LAN server address for this device</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Server URL</Label>
              <Input
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://192.168.1.100:5000"
                className="rounded-xl mt-1 font-mono"
              />
              <p className="text-xs text-slate-500 mt-2">
                Enter the Admin PC's local network IP address with port 5000
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowServerSettings(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveServerUrl} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
              Save & Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
