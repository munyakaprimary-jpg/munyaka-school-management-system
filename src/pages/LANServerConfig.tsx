import React, { useState, useEffect } from 'react';
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
  Activity,
  Clock,
  Database,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const LAN_SERVER_KEY = 'lan_server_url';
const DEFAULT_LAN_URL = 'http://10.28.160.196:5000';

type ConnectionStatus = 'connected' | 'offline' | 'testing' | 'unknown';

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
  // strip trailing slash
  return url.replace(/\/+$/, '');
};

export default function LANServerConfig() {
  const [serverUrl, setServerUrl] = useState<string>(() => {
    return localStorage.getItem(LAN_SERVER_KEY) || DEFAULT_LAN_URL;
  });
  const [status, setStatus] = useState<ConnectionStatus>('unknown');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Load saved URL on mount
  useEffect(() => {
    const saved = localStorage.getItem(LAN_SERVER_KEY);
    if (saved) setServerUrl(saved);
  }, []);

  // Auto-test on mount
  useEffect(() => {
    testConnectionSilent(serverUrl);
  }, []);

  const testConnectionSilent = async (url: string) => {
    if (!url) return;
    const normalized = normalizeUrl(url);
    setStatus('testing');
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${normalized}/api/stats`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const ms = Date.now() - start;
      setLatency(ms);
      setLastChecked(new Date().toISOString());
      if (res.ok) {
        setStatus('connected');
        try {
          const data = await res.json();
          if (data?.data) setStats(data.data);
        } catch {}
      } else {
        setStatus('offline');
      }
    } catch {
      setStatus('offline');
      setLatency(null);
      setLastChecked(new Date().toISOString());
    }
  };

  const handleSaveAndTest = async () => {
    if (!serverUrl.trim()) {
      showError('Please enter a LAN Server Address');
      return;
    }

    setIsSaving(true);
    const normalized = normalizeUrl(serverUrl);
    localStorage.setItem(LAN_SERVER_KEY, normalized);
    setServerUrl(normalized);
    showSuccess('LAN Server Address saved');

    // Test connection
    setIsTesting(true);
    setStatus('testing');
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${normalized}/api/stats`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const ms = Date.now() - start;
      setLatency(ms);
      setLastChecked(new Date().toISOString());
      if (res.ok) {
        setStatus('connected');
        try {
          const data = await res.json();
          if (data?.data) setStats(data.data);
        } catch {}
        showSuccess(`Connected to ${normalized} (${ms}ms)`);
      } else {
        setStatus('offline');
        showError(`Server returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      setStatus('offline');
      setLatency(null);
      setLastChecked(new Date().toISOString());
      showError(`Could not reach ${normalized}. Working offline.`);
    } finally {
      setIsSaving(false);
      setIsTesting(false);
    }
  };

  const handleTestOnly = async () => {
    setIsTesting(true);
    await testConnectionSilent(serverUrl);
    setIsTesting(false);
  };

  const handleReset = () => {
    setServerUrl(DEFAULT_LAN_URL);
    localStorage.setItem(LAN_SERVER_KEY, DEFAULT_LAN_URL);
    showSuccess(`Reset to default: ${DEFAULT_LAN_URL}`);
    testConnectionSilent(DEFAULT_LAN_URL);
  };

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
              status === 'connected' && "bg-emerald-500/30 text-emerald-100 ring-2 ring-emerald-300/50",
              status === 'offline' && "bg-red-500/30 text-red-100 ring-2 ring-red-300/50",
              status === 'testing' && "bg-amber-500/30 text-amber-100 ring-2 ring-amber-300/50",
              status === 'unknown' && "bg-white/10 text-white/70 ring-2 ring-white/20"
            )}
          >
            {status === 'connected' && (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Connected</span>
              </>
            )}
            {status === 'offline' && (
              <>
                <XCircle className="w-5 h-5" />
                <span>Offline</span>
              </>
            )}
            {status === 'testing' && (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Testing...</span>
              </>
            )}
            {status === 'unknown' && (
              <>
                <AlertCircle className="w-5 h-5" />
                <span>Not Tested</span>
              </>
            )}
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
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isSaving ? 'Saving...' : 'Testing...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save & Test Connection
                </>
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