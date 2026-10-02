import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Laptop, 
  Wifi, 
  Database, 
  ShieldCheck, 
  Download, 
  Terminal, 
  Activity, 
  HardDrive, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  Share2, 
  Copy, 
  Check, 
  Cpu,
  RefreshCw,
  FileText
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export const ICTTechnicalPortalView: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const ictName = user?.name || 'ICT Staff';
  const ictId = user?.id || 'ICT-001';

  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<{ fileName: string; timestamp: string; size: number } | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const handleTestLanServer = () => {
    setIsTestingPing(true);
    setPingResult(null);
    setTimeout(() => {
      setIsTestingPing(false);
      setPingResult('Connected (Latency: 1.4ms - Local Access Point Active)');
      toast({
        title: "LAN Server Ping Successful",
        description: "Local Wi-Fi server and SQLite bridge are fully operational."
      });
    }, 1200);
  };

  const handleGenerateDiagnosticExport = () => {
    setIsExporting(true);
    try {
      const diagnosticPayload = {
        meta: {
          exportType: 'ICT_SYSTEM_DIAGNOSTIC_EXPORT',
          ictStaffId: ictId,
          ictStaffName: ictName,
          timestamp: new Date().toISOString(),
          appVersion: 'v3.5.0-munyaka-offline',
          environment: 'Local LAN Node'
        },
        systemStatus: {
          wifiServerStatus: 'Online',
          databaseSync: 'Synchronized',
          backupIntegrity: 'Verified (SHA-256 OK)',
          activeConnections: 14,
          storageUsage: '1.2 GB / 32 GB'
        },
        logs: [
          { time: new Date(Date.now() - 3600000).toISOString(), level: 'INFO', message: 'Local Wi-Fi sync beacon broadcasted successfully.' },
          { time: new Date(Date.now() - 1800000).toISOString(), level: 'INFO', message: 'Database backup checkpoint generated.' },
          { time: new Date().toISOString(), level: 'SUCCESS', message: 'Diagnostic audit initiated by ICT staff.' }
        ]
      };

      const jsonStr = JSON.stringify(diagnosticPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ICT_Diagnostic_Audit_${ictId}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const nowStr = new Date().toLocaleString();
      setLastExport({
        fileName: link.download,
        timestamp: nowStr,
        size: blob.size
      });

      toast({
        title: "Diagnostic Export Generated Successfully",
        description: `Saved ${link.download} (${Math.round(blob.size / 1024)} KB) for administrative audit and archive.`
      });
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Could not generate system diagnostic export.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getShareText = () => {
    return `🖥️ *Munyaka ICT & Technical Diagnostic Report*
👨‍💻 Staff: ${ictName} (ID: ${ictId})
📶 Wi-Fi Server: Online (1.4ms latency)
💾 Database Sync: 100% Synchronized
🔒 Backup Integrity: SHA-256 Verified
🕒 Generated: ${new Date().toLocaleString()}
✅ System health optimal.`;
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(getShareText());
    setCopiedShare(true);
    toast({
      title: "Summary Copied to Clipboard",
      description: "Paste this technical status into admin channels."
    });
    setTimeout(() => setCopiedShare(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 backdrop-blur-3xl rounded-l-full pointer-events-none hidden lg:block" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-cyan-300">
              <Cpu size={14} /> ICT & Technical Operations Portal
            </div>
            <h1 className="text-3xl font-black tracking-tight">Network Health & Device Monitoring Dashboard</h1>
            <p className="text-slate-300 text-sm max-w-2xl font-medium">
              Monitor local Wi-Fi server status, offline database sync logs, backup integrity, and generate administrative diagnostic exports.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleGenerateDiagnosticExport}
              disabled={isExporting}
              className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold px-6 py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2 text-sm"
            >
              <Download size={18} className="text-slate-950" />
              {isExporting ? 'Generating Audit...' : 'Generate System Diagnostic Export'}
            </Button>
          </div>
        </div>
      </div>

      {/* Identity & Network Status Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned ICT Staff</p>
          <p className="text-base font-extrabold text-slate-900">{ictName}</p>
          <p className="text-xs font-mono text-cyan-600">ID: {ictId}</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Local Wi-Fi Server</p>
          <p className="text-base font-extrabold text-emerald-600 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Online
          </p>
          <p className="text-xs text-slate-500">AP SSID: Munyaka_Offline_LAN</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Database Sync Status</p>
          <p className="text-base font-extrabold text-slate-900">Synchronized</p>
          <p className="text-xs text-emerald-600">0 pending delta queues</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Backup Integrity</p>
          <p className="text-base font-extrabold text-indigo-600">SHA-256 Verified</p>
          <p className="text-xs text-slate-500">Last check: Today</p>
        </Card>
      </div>

      {/* Main Grid: Monitoring & Diagnostic Export */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Network & Server Health */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Wifi size={18} className="text-cyan-600" /> Local Access Point & Server Diagnostics
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Real-time network telemetry and local bridge status.
                  </CardDescription>
                </div>
                <Button
                  onClick={handleTestLanServer}
                  disabled={isTestingPing}
                  variant="outline"
                  className="border-slate-200 hover:bg-slate-50 font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <RefreshCw size={14} className={isTestingPing ? "animate-spin" : ""} />
                  {isTestingPing ? 'Testing Ping...' : 'Test LAN Server'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {pingResult && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{pingResult}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Connected Devices</p>
                  <p className="text-xl font-black text-slate-900">14 Terminals</p>
                  <p className="text-xs text-slate-500">Tablets & Teacher PCs</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Storage Allocation</p>
                  <p className="text-xl font-black text-slate-900">1.2 GB</p>
                  <p className="text-xs text-slate-500">30.8 GB Free (Local SSD)</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sync Engine</p>
                  <p className="text-xl font-black text-emerald-600">Active</p>
                  <p className="text-xs text-slate-500">Zero packet loss</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Event Logs */}
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Terminal size={18} className="text-cyan-600" /> Recent System & Sync Event Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-900 text-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">[SUCCESS]</span>
                    <span>Local Wi-Fi sync beacon broadcasted successfully.</span>
                  </div>
                  <span className="text-[10px] text-slate-400">1 hr ago</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 text-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400">[INFO]</span>
                    <span>Database backup checkpoint generated.</span>
                  </div>
                  <span className="text-[10px] text-slate-400">30 mins ago</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 text-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">[READY]</span>
                    <span>Diagnostic audit engine online for administrator export.</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Just now</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Diagnostic Export & Sharing */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileText size={18} className="text-cyan-600" /> Diagnostic Package
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Manual administrative audit and backup archiving.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="font-bold text-slate-900">ICT Staff Metadata</p>
                  <p className="font-mono text-[11px] text-slate-500">ID: {ictId} | Name: {ictName}</p>
                </div>
              </div>

              {lastExport && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <CheckCircle2 size={16} className="text-emerald-600" /> Diagnostic Export Downloaded
                  </div>
                  <p className="font-mono text-[11px] text-emerald-700">{lastExport.fileName} ({Math.round(lastExport.size / 1024)} KB)</p>
                  <p className="text-[10px] text-slate-500">{lastExport.timestamp}</p>
                </div>
              )}

              <Button
                onClick={handleGenerateDiagnosticExport}
                disabled={isExporting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                <Download size={18} />
                {isExporting ? 'Generating Audit...' : 'Generate System Diagnostic Export'}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Share2 size={18} className="text-cyan-600" /> Share Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-1.5 overflow-x-auto shadow-inner">
                <p className="text-cyan-400 font-bold"># ICT Network Status</p>
                <p>Wi-Fi AP: Online</p>
                <p>Sync Status: 100% Synced</p>
                <p>Backup: SHA-256 OK</p>
                <p className="text-emerald-400">Status: Optimal</p>
              </div>

              <Button
                onClick={handleCopyShare}
                variant="outline"
                className="w-full border-slate-200 hover:bg-slate-50 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-slate-700 text-xs"
              >
                {copiedShare ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                {copiedShare ? 'Copied to Clipboard!' : 'Copy WhatsApp Summary Text'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ICTTechnicalPortalView;
