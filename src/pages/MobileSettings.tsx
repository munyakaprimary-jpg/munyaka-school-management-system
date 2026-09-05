import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Smartphone,
  Monitor,
  Database,
  Clock,
  ChevronRight,
  Save,
  AlertCircle,
  Loader2,
  HardDrive,
  Users,
  Activity,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { showSuccess, showError } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const SERVER_URL_KEY = 'lan_server_url';
const DEVICE_ID_KEY = 'munyaka_device_id';
const SYNC_QUEUE_KEY = 'munyaka_sync_queue';
const LAST_SYNC_KEY = 'munyaka_last_sync';

interface SyncQueueItem {
  id: string;
  type: 'attendance' | 'fee' | 'student';
  data: any;
  createdAt: string;
  synced: boolean;
  syncAttempts: number;
}

interface ConnectionStatus {
  isOnline: boolean;
  latency: number | null;
  lastChecked: string | null;
  serverReachable: boolean;
}

const getServerUrl = (): string => localStorage.getItem(SERVER_URL_KEY) || '';
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

export default function MobileSettings() {
  const { user } = useAuth();
  const [serverUrl, setServerUrl] = useState(getServerUrl());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    latency: null,
    lastChecked: null,
    serverReachable: false
  });
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(localStorage.getItem(LAST_SYNC_KEY));
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setConnectionStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setConnectionStatus(prev => ({ ...prev, isOnline: false, serverReachable: false }));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load sync queue
  useEffect(() => {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY);
    if (queue) {
      const items: SyncQueueItem[] = JSON.parse(queue);
      setSyncQueue(items);
      setPendingSyncCount(items.filter(i => !i.synced).length);
    }
  }, []);

  // Auto-check connection when server URL changes
  useEffect(() => {
    if (serverUrl && connectionStatus.isOnline) {
      const timer = setTimeout(() => checkConnection(), 1000);
      return () => clearTimeout(timer);
    }
  }, [serverUrl, connectionStatus.isOnline]);

  // Ping the dedicated /api/health endpoint. Treat status:"ok" (or any 2xx
    // response from that path) as Online. Persist the URL when reachable
    // so it becomes the active base URL for the rest of the app.
    const checkConnection = useCallback(async () => {
      if (!serverUrl) {
        setConnectionStatus(prev => ({ ...prev, serverReachable: false, latency: null }));
        return;
      }
  
      setIsTesting(true);
      const startTime = Date.now();
  
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
  
        const response = await fetch(`${serverUrl}/api/health`, {
          method: 'GET',
          signal: controller.signal
        });
  
        clearTimeout(timeoutId);
        const latency = Date.now() - startTime;
  
        if (response.ok) {
          // Confirm the body really says we're online — guards against a
          // captive portal or proxy that returns 200 but wrong content.
          let isReallyOnline = true;
          try {
            const payload = await response.clone().json();
            isReallyOnline =
              payload?.status === 'ok' ||
              payload?.status === 'healthy' ||
              payload?.success === true;
          } catch { /* non-JSON body is still fine if 2xx */ }
  
          if (isReallyOnline) {
            setConnectionStatus({
              isOnline: navigator.onLine,
              latency,
              lastChecked: new Date().toISOString(),
              serverReachable: true
            });
            // Persist as the active base URL so the global sync layer picks it up.
            localStorage.setItem(SERVER_URL_KEY, serverUrl);
          } else {
            setConnectionStatus(prev => ({
              ...prev,
              isOnline: navigator.onLine,
              latency: null,
              lastChecked: new Date().toISOString(),
              serverReachable: false
            }));
          }
        } else {
          setConnectionStatus(prev => ({
            ...prev,
            isOnline: navigator.onLine,
            latency: null,
            lastChecked: new Date().toISOString(),
            serverReachable: false
          }));
        }
      } catch {
        setConnectionStatus(prev => ({
          ...prev,
          isOnline: navigator.onLine,
          latency: null,
          lastChecked: new Date().toISOString(),
          serverReachable: false
        }));
      }
  
      setIsTesting(false);
    }, [serverUrl]);

  const testConnection = async () => {
    if (!serverUrl.trim()) {
      showError('Please enter a server IP address');
      return;
    }

    // Validate URL format
    let testUrl = serverUrl.trim();
    if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
      testUrl = `http://${testUrl}`;
    }
    if (!testUrl.includes(':')) {
      testUrl = `${testUrl}:5000`;
    }
    
    // Update state with corrected URL
    setServerUrl(testUrl);

    await checkConnection();
  };

  const saveServerUrl = async () => {
    if (!serverUrl.trim()) {
      showError('Please enter a server IP address');
      return;
    }

    setIsSaving(true);
    
    // Normalize URL
    let normalizedUrl = serverUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `http://${normalizedUrl}`;
    }
    if (!normalizedUrl.includes(':') && !normalizedUrl.includes('/api')) {
      normalizedUrl = `${normalizedUrl}:5000`;
    }

    localStorage.setItem(SERVER_URL_KEY, normalizedUrl);
    setServerUrl(normalizedUrl);

    // Register device with server
    if (connectionStatus.isOnline) {
      try {
        await fetch(`${normalizedUrl}/api/devices/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            device_id: getDeviceId(),
            device_name: user?.name || 'Teacher Device',
            device_type: 'mobile',
            ip_address: ''
          })
        });
      } catch (err) {
        console.error('Failed to register device:', err);
      }
    }

    showSuccess('Server configuration saved');
    setIsSaving(false);
    
    // Test connection after saving
    setTimeout(checkConnection, 500);
  };

  const triggerSync = async () => {
    if (!connectionStatus.serverReachable) {
      showError('Server is not reachable. Please check connection.');
      return;
    }

    const queue = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!queue) {
      showSuccess('Nothing to sync');
      return;
    }

    const items: SyncQueueItem[] = JSON.parse(queue);
    const unsyncedItems = items.filter(i => !i.synced);

    if (unsyncedItems.length === 0) {
      showSuccess('All data is already synced');
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: getDeviceId(),
          records: unsyncedItems.map(item => ({
            type: item.type,
            data: item.data
          }))
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Mark synced items
        const updatedQueue = items.map(item => {
          if (!item.synced) {
            const syncedItem = result.results?.find((r: any) => r.originalId === item.id);
            if (syncedItem && syncedItem.status !== 'error') {
              return { ...item, synced: true };
            }
          }
          return item;
        });

        // Remove old synced items (keep last 50)
        const recentQueue = updatedQueue.slice(-50);
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(recentQueue));
        setSyncQueue(recentQueue);
        setPendingSyncCount(recentQueue.filter(i => !i.synced).length);

        const syncTime = new Date().toISOString();
        localStorage.setItem(LAST_SYNC_KEY, syncTime);
        setLastSync(syncTime);

        showSuccess(`Synced ${unsyncedItems.length} items successfully`);
      } else {
        throw new Error('Sync failed');
      }
    } catch (err) {
      showError('Failed to sync data. Will retry when connection is restored.');
    }
  };

  const clearSyncQueue = () => {
    if (!confirm('Are you sure you want to clear all pending sync items?')) return;
    localStorage.removeItem(SYNC_QUEUE_KEY);
    setSyncQueue([]);
    setPendingSyncCount(0);
    showSuccess('Sync queue cleared');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Settings</h1>
            <p className="text-xs text-slate-300 font-medium">Configure your connection</p>
          </div>
        </div>

        {/* Connection Status Banner */}
        <div className={cn(
          "p-4 rounded-2xl backdrop-blur-sm flex items-center justify-between gap-4",
          connectionStatus.serverReachable 
            ? "bg-emerald-500/20" 
            : connectionStatus.isOnline 
              ? "bg-amber-500/20" 
              : "bg-red-500/20"
        )}>
          <div className="flex items-center gap-3">
            {connectionStatus.serverReachable ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            ) : connectionStatus.isOnline ? (
              <AlertCircle className="w-8 h-8 text-amber-400" />
            ) : (
              <XCircle className="w-8 h-8 text-red-400" />
            )}
            <div>
              <p className="font-bold text-sm">
                {connectionStatus.serverReachable 
                  ? 'Connected to Server' 
                  : connectionStatus.isOnline 
                    ? 'Server Not Reachable' 
                    : 'Offline Mode'}
              </p>
              <p className="text-xs text-slate-300">
                {connectionStatus.serverReachable 
                  ? `Latency: ${connectionStatus.latency}ms`
                  : connectionStatus.isOnline 
                    ? 'Check the server IP address'
                    : 'Working offline - data will sync when connected'}
              </p>
            </div>
          </div>
          <Badge className={cn(
            "shrink-0",
            connectionStatus.serverReachable 
              ? "bg-emerald-500/20 text-emerald-300 border-0" 
              : connectionStatus.isOnline 
                ? "bg-amber-500/20 text-amber-300 border-0" 
                : "bg-red-500/20 text-red-300 border-0"
          )}>
            {connectionStatus.serverReachable ? (
              <><Wifi className="w-3 h-3 mr-1" /> Online</>
            ) : connectionStatus.isOnline ? (
              <><RefreshCw className="w-3 h-3 mr-1" /> Limited</>
            ) : (
              <><WifiOff className="w-3 h-3 mr-1" /> Offline</>
            )}
          </Badge>
        </div>
      </div>

      {/* Server Configuration */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white pb-4">
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Server Connection
          </CardTitle>
          <CardDescription className="text-indigo-100">
            Enter the Admin PC's local network IP address
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server-ip" className="text-xs font-black uppercase tracking-widest text-slate-500">
              Server IP Address
            </Label>
            <div className="flex gap-2">
              <Input
                id="server-ip"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://192.168.1.100:5000"
                className="flex-1 h-12 rounded-xl bg-slate-50 border-slate-200 font-mono text-sm"
              />
            </div>
            <p className="text-xs text-slate-500">
              Ask the Admin to share their PC's IP address shown in the Admin Control Center
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={testConnection}
              disabled={isTesting || !serverUrl.trim()}
              variant="outline"
              className="flex-1 h-12 rounded-xl font-bold"
            >
              {isTesting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing...</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" /> Test Connection</>
              )}
            </Button>
            <Button
              onClick={saveServerUrl}
              disabled={isSaving}
              className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync Status */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white pb-4">
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Data Sync Status
          </CardTitle>
          <CardDescription className="text-emerald-100">
            Offline entries will sync when connection is restored
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Last Sync Info */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-sm">Last Sync</p>
                <p className="text-xs text-slate-500">
                  {lastSync ? new Date(lastSync).toLocaleString() : 'Never synced'}
                </p>
              </div>
            </div>
            {pendingSyncCount > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-0">
                {pendingSyncCount} pending
              </Badge>
            )}
          </div>

          {/* Sync Queue Preview */}
          {syncQueue.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Pending Items ({pendingSyncCount})
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {syncQueue.slice(-5).reverse().map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl text-sm",
                      item.synced 
                        ? "bg-slate-50 dark:bg-slate-800/50 text-slate-500" 
                        : "bg-amber-50 dark:bg-amber-900/20 text-amber-700"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {item.type === 'attendance' && <Activity className="w-4 h-4" />}
                      {item.type === 'fee' && <HardDrive className="w-4 h-4" />}
                      {item.type === 'student' && <Users className="w-4 h-4" />}
                      <span className="capitalize font-medium">{item.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      {item.synced ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <RefreshCw className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={triggerSync}
              disabled={!connectionStatus.serverReachable || pendingSyncCount === 0}
              className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Now
            </Button>
            {pendingSyncCount > 0 && (
              <Button
                onClick={clearSyncQueue}
                variant="outline"
                className="h-12 rounded-xl text-red-500 border-red-200 hover:bg-red-50 font-bold"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Device Info */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white pb-4">
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Device Information
          </CardTitle>
          <CardDescription className="text-slate-200">
            Your device ID for server registration
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Device ID</span>
              <span className="text-sm font-mono text-slate-900 dark:text-white truncate max-w-[200px]">
                {getDeviceId().substring(0, 20)}...
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Device Type</span>
              <span className="text-sm text-slate-900 dark:text-white">Mobile APK</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Current User</span>
              <span className="text-sm text-slate-900 dark:text-white">{user?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">User Role</span>
              <Badge className="bg-indigo-100 text-indigo-700 border-0 capitalize">
                {user?.role?.replace('_', ' ') || 'Unknown'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Help */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white pb-4">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Quick Help
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4 text-sm">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center shrink-0">
                <span className="font-bold text-amber-600 text-xs">1</span>
              </div>
              <div>
                <p className="font-bold">Get the Admin PC's IP</p>
                <p className="text-slate-500 text-xs">Open the Admin Control Center on the school computer - the IP is shown at the top</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center shrink-0">
                <span className="font-bold text-amber-600 text-xs">2</span>
              </div>
              <div>
                <p className="font-bold">Enter the IP address</p>
                <p className="text-slate-500 text-xs">Type the IP in the Server IP Address field above (e.g., 192.168.1.100:5000)</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center shrink-0">
                <span className="font-bold text-amber-600 text-xs">3</span>
              </div>
              <div>
                <p className="font-bold">Test & Save</p>
                <p className="text-slate-500 text-xs">Tap "Test Connection" to verify, then "Save" to store the setting</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center shrink-0">
                <span className="font-bold text-amber-600 text-xs">4</span>
              </div>
              <div>
                <p className="font-bold">Offline Support</p>
                <p className="text-slate-500 text-xs">When offline, your entries are saved locally and sync automatically when Wi-Fi reconnects</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
