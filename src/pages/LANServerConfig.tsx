import React, { useState, useEffect, useCallback } from 'react';
import {
  Wifi,
  WifiOff,
  Server,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Activity,
  Clock,
  Database,
  Smartphone,
  ShieldCheck,
  Zap,
  ZapOff,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const LAN_SERVER_KEY = 'lan_server_url';
const DEFAULT_LAN_URL = 'http://10.28.160.196:5000';

type ConnectionStatus = 'connected' | 'offline' | 'testing' | 'starting' | 'stopping';
type ServerProcessStatus = 'online' | 'offline' | 'starting' | 'stopping' | 'error';
type ErrorType = 'port_in_use' | 'firewall' | 'timeout' | 'unauthorized' | 'server_error' | null;

interface ServerStats {
  students: number;
  teachers: number;
  attendance_today: number;
  pending_fees: number;
  connected_devices: number;
  pending_sync: number;
}

const normalizeUrl = (input: string): string => {
  let url = input.trim();
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `http://${url}`;
  }
  if (!url.includes(':5000') && !url.match(/:\d{2,5}/)) {
    url = `${url}:5000`;
  }
  return url.replace(/\/+$/, '');
};

const describeError = (type: ErrorType): { title: string; message: string } => {
  switch (type) {
    case 'port_in_use':
      return {
        title: 'Port Already in Use',
        message:
          'The selected port is already occupied by another process. Click "Change Port" to pick a different port, or stop the conflicting application.',
      };
    case 'firewall':
      return {
        title: 'Firewall Blocked',
        message:
          'The firewall prevented the server from binding to the port. Ensure your antivirus or firewall allows the application on the configured port.',
      };
    case 'timeout':
      return {
        title: 'Server Did Not Start',
        message:
          'The server failed to respond after starting. This may indicate a port conflict or insufficient permissions. Try changing the port.',
      };
    case 'unauthorized':
      return {
        title: 'Unauthorized',
        message:
          'The server refused the start command — you may not have admin privileges. Try running the server application as administrator.',
      };
    case 'server_error':
      return {
        title: 'Server Error',
        message:
          'The server encountered an error while starting. Check the server logs for details and retry.',
      };
    default:
      return {
        title: 'Connection Failed',
        message: 'An unexpected error occurred. Please try again.',
      };
  }
};

export default function LANServerConfig() {
  const [serverUrl, setServerUrl] = useState<string>(() => {
    return localStorage.getItem(LAN_SERVER_KEY) || DEFAULT_LAN_URL;
  });
  const [status, setStatus] = useState<ConnectionStatus>('unknown');
  const [serverProcess, setServerProcess] = useState<ServerProcessStatus>('offline');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [activeError, setActiveError] = useState<ErrorType>(null);
  const [showPortDialog, setShowPortDialog] = useState(false);
  const [pendingPort, setPendingPort] = useState('');
  const [portInput, setPortInput] = useState('5000');

  // Load saved URL on mount
  useEffect(() => {
    const saved = localStorage.getItem(LAN_SERVER_KEY);
    if (saved) setServerUrl(saved);
  }, []);

  // Extract port from URL
  const extractPort = (url: string): string => {
    const m = url.match(/:(\d+)/);
    return m ? m[1] : '5000';
  };

  // Auto-test connection on mount
  useEffect(() => {
    testConnectionSilent(serverUrl);
  }, []);

  const pingHealth = async (
    url: string
  ): Promise<{ ok: boolean; latency: number | null; stats: ServerStats | null }> => {
    const normalized = normalizeUrl(url);
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${normalized}/api/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const ms = Date.now() - start;

      if (!res.ok) return { ok: false, latency: null, stats: null };

      let payload: any = null;
      try { payload = await res.json(); } catch { /* non-JSON ok */ }

      const isOnline =
        !!payload &&
        (payload.status === 'ok' ||
          payload.status === 'healthy' ||
          payload.success === true);

      if (!isOnline) return { ok: false, latency: ms, stats: null };

      let stats: ServerStats | null = null;
      try {
        const statsRes = await fetch(`${normalized}/api/stats`);
        if (statsRes.ok) {
          const data = await statsRes.json();
          if (data?.data) stats = data.data;
        }
      } catch { /* best-effort */ }

      return { ok: true, latency: ms, stats };
    } catch {
      return { ok: false, latency: null, stats: null };
    }
  };

  const testConnectionSilent = async (url: string) => {
    if (!url) return;
    setActiveError(null);
    setStatus('testing');
    const result = await pingHealth(url);
    setLastChecked(new Date().toISOString());
    if (result.ok) {
      setLatency(result.latency ?? null);
      setServerProcess('online');
      setStatus('connected');
      if (result.stats) setStats(result.stats);
    } else {
      setServerProcess('offline');
      setStatus('offline');
      setLatency(null);
    }
  };

  // ── Server Lifecycle Helpers ──────────────────────────────────────────────

  /**
   * Sends POST /api/server/start to the backend LAN server.
   * The backend must implement this endpoint to spawn/start the Node process.
   * Expected success: 200 OK  { status: "started" }
   * Expected errors:
   *   409 → port_in_use (EADDRINUSE)
   *   403 → unauthorized
   *   500 → server_error / timeout
   */
  const startServer = useCallback(async (): Promise<{ ok: boolean; errorType?: ErrorType }> => {
    const normalized = normalizeUrl(serverUrl);
    try {
      const res = await fetch(`${normalized}/api/server/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        return { ok: true };
      }

      // Parse structured error body if available
      let errorType: ErrorType = 'server_error';
      try {
        const body = await res.json();
        if (body.code === 'EADDRINUSE' || body.error?.includes('port')) {
          errorType = 'port_in_use';
        } else if (body.code === 'EACCES' || res.status === 403) {
          errorType = 'unauthorized';
        } else if (res.status >= 500) {
          errorType = 'server_error';
        }
      } catch { /* use default */ }

      return { ok: false, errorType };
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('timeout')) {
        return { ok: false, errorType: 'timeout' };
      }
      // Network-level failure: server unreachable
      return { ok: false, errorType: 'server_error' };
    }
  }, [serverUrl]);

  /**
   * Sends POST /api/server/stop to the backend LAN server.
   * Expected success: 200 OK { status: "stopped" }
   */
  const stopServer = useCallback(async (): Promise<{ ok: boolean }> => {
    const normalized = normalizeUrl(serverUrl);
    try {
      const res = await fetch(`${normalized}/api/server/stop`, {
        method: 'POST',
        signal: AbortSignal.timeout(8000),
      });
      return { ok: res.ok };
    } catch {
      // Even on network error, treat as stopped (fire-and-forget)
      return { ok: true };
    }
  }, [serverUrl]);

  const handleToggleServer = async (checked: boolean) => {
    setActiveError(null);
    setIsToggling(true);

    if (checked) {
      // START
      setServerProcess('starting');
      const result = await startServer();
      if (result.ok) {
        setServerProcess('online');
        showSuccess('Server started successfully');
        // Re-test connection after brief settle period
        setTimeout(() => testConnectionSilent(serverUrl), 1500);
      } else {
        setServerProcess('offline');
        setActiveError(result.errorType ?? 'server_error');
      }
    } else {
      // STOP
      setServerProcess('stopping');
      await stopServer();
      setServerProcess('offline');
      setStatus('offline');
      setLatency(null);
      setStats(null);
      showSuccess('Server stopped');
    }

    setIsToggling(false);
  };

  // ── Connection Controls ────────────────────────────────────────────────────

  const handleSaveAndTest = async () => {
    if (!serverUrl.trim()) {
      showError('Please enter a LAN Server Address');
      return;
    }

    setIsSaving(true);
    setActiveError(null);
    const normalized = normalizeUrl(serverUrl);
    localStorage.setItem(LAN_SERVER_KEY, normalized);
    setServerUrl(normalized);
    showSuccess(`LAN Server Address saved: ${normalized}`);

    setIsTesting(true);
    setStatus('testing');
    const result = await pingHealth(normalized);
    setLastChecked(new Date().toISOString());

    if (result.ok) {
      setLatency(result.latency ?? null);
      setServerProcess('online');
      setStatus('connected');
      if (result.stats) setStats(result.stats);
      showSuccess(`Online — connected to ${normalized} (${result.latency}ms)`);
    } else {
      setServerProcess('offline');
      setStatus('offline');
      setLatency(null);
      showError(`Could not reach ${normalized}. Working offline.`);
    }

    setIsSaving(false);
    setIsTesting(false);
  };

  const handleTestOnly = async () => {
    setIsTesting(true);
    setActiveError(null);
    await testConnectionSilent(serverUrl);
    setIsTesting(false);
  };

  const handleReset = () => {
    setServerUrl(DEFAULT_LAN_URL);
    localStorage.setItem(LAN_SERVER_KEY, DEFAULT_LAN_URL);
    setServerProcess('offline');
    setStatus('offline');
    setLatency(null);
    setStats(null);
    setActiveError(null);
    showSuccess(`Reset to default: ${DEFAULT_LAN_URL}`);
    testConnectionSilent(DEFAULT_LAN_URL);
  };

  const handleChangePort = () => {
    const port = parseInt(portInput, 10);
    if (!portInput || isNaN(port) || port < 1024 || port > 65535) {
      showError('Enter a valid port between 1024 and 65535');
      return;
    }
    const hostPart = serverUrl.replace(/:\d+$/, '').replace(/\/+$/, '');
    const newUrl = `${hostPart}:${port}`;
    setShowPortDialog(false);
    setPortInput('');
    setServerUrl(newUrl);
    localStorage.setItem(LAN_SERVER_KEY, newUrl);
    showSuccess(`Port updated to ${port}. Saving & testing...`);
    setIsSaving(true);
    setStatus('testing');
    setActiveError(null);
    testConnectionSilent(newUrl).finally(() => setIsSaving(false));
  };

  const currentPort = extractPort(serverUrl);
  const isServerActive = serverProcess === 'online';
  const isBusy = serverProcess === 'starting' || serverProcess === 'stopping';
  const err = activeError ? describeError(activeError) : null;

  return (
    <div className="space-y-6 pb-20">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Server className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                Network Configuration
              </p>
              <h1 className="text-2xl font-black tracking-tight">LAN Server Config</h1>
              <p className="text-xs text-blue-100 mt-1">
                Connect this device to the school server over Wi-Fi
              </p>
            </div>
          </div>

          {/* Live Status Badge */}
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl backdrop-blur-sm font-bold text-sm",
              serverProcess === 'online' && "bg-emerald-500/30 text-emerald-100 ring-2 ring-emerald-300/50",
              serverProcess === 'offline' && "bg-red-500/30 text-red-100 ring-2 ring-red-300/50",
              serverProcess === 'starting' && "bg-amber-500/30 text-amber-100 ring-2 ring-amber-300/50",
              serverProcess === 'stopping' && "bg-amber-500/30 text-amber-100 ring-2 ring-amber-300/50",
              serverProcess === 'error' && "bg-red-500/30 text-red-100 ring-2 ring-red-300/50"
            )}
          >
            {serverProcess === 'online' && <><CheckCircle2 className="w-5 h-5" /><span>Online (Active)</span></>}
            {serverProcess === 'offline' && <><XCircle className="w-5 h-5" /><span>Offline</span></>}
            {(serverProcess === 'starting' || serverProcess === 'stopping') && <><Loader2 className="w-5 h-5 animate-spin" /><span>{serverProcess === 'starting' ? 'Starting...' : 'Stopping...'}</span></>}
            {serverProcess === 'error' && <><AlertCircle className="w-5 h-5" /><span>Error</span></>}
          </div>
        </div>

        {/* Latency / Last Checked */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Latency</p>
            <p className="text-xl font-black mt-1">
              {latency !== null ? `${latency}ms` : '—'}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Last Checked</p>
            <p className="text-sm font-bold mt-1">
              {lastChecked ? new Date(lastChecked).toLocaleTimeString() : 'Never'}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 col-span-2 md:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Base URL</p>
            <p className="text-xs font-mono font-bold mt-1 truncate">
              {normalizeUrl(serverUrl)}
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {err && (
        <Alert
          variant="destructive"
          className="rounded-2xl border-red-200 bg-red-50 dark:bg-red-950/20"
        >
          <AlertTriangle className="w-5 h-5" />
          <AlertTitle className="font-black">{err.title}</AlertTitle>
          <AlertDescription className="mt-1 text-sm">
            {err.message}
          </AlertDescription>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-xl border-red-200 text-red-600 hover:bg-red-100 font-bold text-xs"
              onClick={() => setShowPortDialog(true)}
            >
              <Settings2 className="w-3 h-3 mr-1.5" />
              Change Port
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-xl border-red-200 text-red-600 hover:bg-red-100 font-bold text-xs"
              onClick={() => {
                setActiveError(null);
                handleToggleServer(true);
              }}
            >
              <RefreshCw className="w-3 h-3 mr-1.5" />
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Server Lifecycle Card */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isServerActive ? (
                <Zap className="w-5 h-5 text-emerald-600" />
              ) : (
                <ZapOff className="w-5 h-5 text-slate-400" />
              )}
              <CardTitle className="text-lg">Server Process Control</CardTitle>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isServerActive ? 'Running' : 'Stopped'}
              </span>
              <Switch
                checked={isServerActive}
                disabled={isBusy}
                onCheckedChange={handleToggleServer}
                className={cn(
                  "data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-300",
                  isBusy && "opacity-50 cursor-not-allowed"
                )}
              />
            </div>
          </div>
          <CardDescription className="mt-1">
            {isServerActive
              ? 'The local server is running. Toggle OFF to shut it down safely.'
              : 'Toggle ON to start the local server on the configured host and port.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Status row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Status</p>
              <div className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black",
                isServerActive ? "bg-emerald-100 text-emerald-700" :
                serverProcess === 'starting' ? "bg-amber-100 text-amber-700" :
                serverProcess === 'stopping' ? "bg-amber-100 text-amber-700" :
                "bg-slate-100 text-slate-600"
              )}>
                {isServerActive && <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />Active</>}
                {serverProcess === 'starting' && <><Loader2 className="w-3 h-3 animate-spin" />Starting</>}
                {serverProcess === 'stopping' && <><Loader2 className="w-3 h-3 animate-spin" />Stopping</>}
                {!isServerActive && serverProcess === 'offline' && <><span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />Offline</>}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Host IP</p>
              <p className="text-sm font-mono font-black truncate">
                {normalizeUrl(serverUrl).replace(/:\d+$/, '').replace('http://', '')}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Port</p>
              <p className="text-sm font-mono font-black">{currentPort}</p>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setPortInput(currentPort); setShowPortDialog(true); }}
              className="rounded-xl font-bold text-xs h-9"
            >
              <Settings2 className="w-3 h-3 mr-1.5" />
              Change Port
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleTestOnly}
              disabled={isTesting}
              className="rounded-xl font-bold text-xs h-9"
            >
              <RefreshCw className={cn("w-3 h-3 mr-1.5", isTesting && "animate-spin")} />
              Re-test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connection Settings Card */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Connection Settings</CardTitle>
          </div>
          <CardDescription>
            Enter the local network address of the Admin PC running the LAN server (port 5000)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="lan-url" className="text-xs font-black uppercase tracking-widest text-slate-500">
              LAN Server Address
            </Label>
            <Input
              id="lan-url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder={DEFAULT_LAN_URL}
              className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-mono text-sm"
            />
            <p className="text-xs text-slate-500">
              Default: <span className="font-mono font-bold">{DEFAULT_LAN_URL}</span>. Get the actual IP from the Admin Control Center on the school computer.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSaveAndTest}
              disabled={isSaving || isTesting}
              className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-bold text-base shadow-lg shadow-blue-200"
            >
              {isSaving || isTesting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{isSaving ? 'Saving...' : 'Testing...'}</>
              ) : (
                <><Save className="w-5 h-5 mr-2" />Save & Test Connection</>
              )}
            </Button>
            <Button
              onClick={handleTestOnly}
              disabled={isTesting}
              variant="outline"
              className="h-14 rounded-2xl font-bold border-slate-200 px-6"
            >
              <RefreshCw className={cn("w-5 h-5 mr-2", isTesting && "animate-spin")} />
              Test
            </Button>
            <Button
              onClick={handleReset}
              variant="ghost"
              className="h-14 rounded-2xl font-bold text-slate-500 hover:text-slate-900"
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Server Stats (visible when connected) */}
      {status === 'connected' && stats && (
        <Card className="border-0 shadow-lg rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white pb-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              <CardTitle>Live Server Snapshot</CardTitle>
            </div>
            <CardDescription className="text-emerald-100">
              Data fetched directly from the connected LAN server
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <StatTile label="Students" value={stats.students} color="blue" />
              <StatTile label="Teachers" value={stats.teachers} color="emerald" />
              <StatTile label="Attendance Today" value={stats.attendance_today} color="amber" />
              <StatTile label="Pending Fees" value={stats.pending_fees} color="rose" />
              <StatTile label="Online Devices" value={stats.connected_devices} color="violet" />
              <StatTile label="Pending Sync" value={stats.pending_sync} color="cyan" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card className="border-0 shadow-lg rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <CardTitle>Quick Help</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <HelpRow
            num={1}
            title="Get the Admin PC's IP"
            desc='On the school computer, open "Admin Control Center". The IP (e.g. http://192.168.1.100:5000) is shown at the top.'
          />
          <HelpRow
            num={2}
            title="Connect to the same Wi-Fi"
            desc="Make sure this phone is on the same Wi-Fi network as the Admin PC."
          />
          <HelpRow
            num={3}
            title="Save the address"
            desc='Paste the address into "LAN Server Address" and tap "Save & Test Connection".'
          />
          <HelpRow
            num={4}
            title="Watch the status"
            desc='The badge turns green when connected. If red (Offline), data is saved locally and will sync automatically.'
          />
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-400 py-2">
        Settings are saved to <span className="font-mono font-bold">localStorage['lan_server_url']</span> and used by the global sync layer.
      </div>

      {/* Change Port Dialog */}
      <Dialog open={showPortDialog} onOpenChange={setShowPortDialog}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Change Server Port</DialogTitle>
            <DialogDescription>
              The current port is <strong className="font-mono">{currentPort}</strong>. Enter a new port number between 1024 and 65535, then save.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="port-input" className="text-xs font-black uppercase tracking-widest text-slate-500">
                New Port Number
              </Label>
              <Input
                id="port-input"
                type="number"
                min={1024}
                max={65535}
                value={portInput}
                onChange={(e) => setPortInput(e.target.value)}
                placeholder={currentPort}
                className="h-12 rounded-xl font-mono text-sm mt-1"
              />
              <p className="text-xs text-slate-500 mt-2">
                Common ports: 5000, 3000, 8080, 8000. Avoid ports below 1024 (reserved).
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPortDialog(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePort}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Apply & Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    rose: 'from-rose-500 to-rose-600',
    violet: 'from-violet-500 to-violet-600',
    cyan: 'from-cyan-500 to-cyan-600'
  };
  return (
    <div className={cn("rounded-2xl p-4 text-white bg-gradient-to-br shadow-md", colorMap[color])}>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</p>
    </div>
  );
}

function HelpRow({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
      <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
        <span className="font-black text-amber-700 dark:text-amber-400 text-xs">{num}</span>
      </div>
      <div className="min-w-0">
        <p className="font-bold text-slate-900 dark:text-white text-sm">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
