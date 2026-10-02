import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  UserCheck, 
  Clock, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  FileText, 
  Lock,
  Search
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export const SecurityPortalView: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const guardName = user?.name || 'Security Guard';
  const guardId = user?.id || 'SEC-001';

  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<{ fileName: string; timestamp: string; size: number } | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const [visitorLogs, setVisitorLogs] = useState([
    { id: 'V-1', visitorName: 'Dr. James Mwangi', purpose: 'Parent Meeting', host: 'Headteacher', timeIn: '09:15 AM', timeOut: '10:30 AM', status: 'Exited' },
    { id: 'V-2', visitorName: 'Kenya Power Technician', purpose: 'Meter Inspection', host: 'Bursar', timeIn: '10:00 AM', status: 'On Premises' },
    { id: 'V-3', visitorName: 'Sarah Wanjiku', purpose: 'Fee Inquiry', host: 'Accounts', timeIn: '11:20 AM', timeOut: '11:45 AM', status: 'Exited' }
  ]);

  const handleExportSecurityBatch = () => {
    setIsExporting(true);
    try {
      const payload = {
        meta: {
          exportType: 'SECURITY_GATE_LOGS_BATCH',
          guardId,
          guardName,
          timestamp: new Date().toISOString(),
          recordCounts: {
            totalVisitorsToday: visitorLogs.length,
            currentlyOnPremises: visitorLogs.filter(v => v.status === 'On Premises').length
          }
        },
        visitorLogs
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Security_Gate_Logs_${guardId}_${new Date().toISOString().slice(0, 10)}.json`;
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
        title: "Security Gate Batch Exported Successfully",
        description: `Saved ${link.download} (${Math.round(blob.size / 1024)} KB) for Admin Harmonization.`
      });
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Could not generate security batch.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getShareText = () => {
    return `🛡️ *Munyaka Gate Guard & Security Log*
👮 Officer: ${guardName} (ID: ${guardId})
👥 Total Visitors Today: ${visitorLogs.length}
🟢 Currently On Premises: ${visitorLogs.filter(v => v.status === 'On Premises').length}
🕒 Exported: ${new Date().toLocaleString()}
✅ Verified for Admin Harmonization Hub.`;
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(getShareText());
    setCopiedShare(true);
    toast({
      title: "Summary Copied to Clipboard",
      description: "Paste this security summary into admin channels."
    });
    setTimeout(() => setCopiedShare(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 backdrop-blur-3xl rounded-l-full pointer-events-none hidden lg:block" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-blue-200">
              <ShieldCheck size={14} /> Security & Gate Guard Portal
            </div>
            <h1 className="text-3xl font-black tracking-tight">Visitor & Student Movement Log Dashboard</h1>
            <p className="text-blue-100 text-sm max-w-2xl font-medium">
              Track authorized visitor entries, exits, student gate movements with timestamp metadata, and generate offline security batches.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleExportSecurityBatch}
              disabled={isExporting}
              className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-6 py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2 text-sm"
            >
              <Download size={18} className="text-blue-600" />
              {isExporting ? 'Packaging Logs...' : 'Export Security Batch (.JSON)'}
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Guard</p>
          <p className="text-base font-extrabold text-slate-900">{guardName}</p>
          <p className="text-xs font-mono text-blue-600">ID: {guardId}</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Visitors Today</p>
          <p className="text-base font-extrabold text-slate-900">{visitorLogs.length} Entries</p>
          <p className="text-xs text-slate-500">Authorized entries logged</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">On Premises</p>
          <p className="text-base font-extrabold text-emerald-600">{visitorLogs.filter(v => v.status === 'On Premises').length} Active</p>
          <p className="text-xs text-slate-500">Currently inside grounds</p>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <CardTitle className="text-lg font-bold">Gate Visitor & Movement Register</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {visitorLogs.map((log) => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{log.visitorName}</span>
                        <Badge className="bg-blue-100 text-blue-800 text-[10px] font-bold border-0">{log.purpose}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">Host: <span className="font-semibold text-slate-700">{log.host}</span> | Time In: {log.timeIn}</p>
                      <p className="text-[11px] text-slate-400">{log.timeOut ? `Time Out: ${log.timeOut}` : 'Still on premises'}</p>
                    </div>
                    <div>
                      <Badge className={cn(
                        "font-bold text-xs border-0 px-3 py-1",
                        log.status === 'Exited' ? 'bg-slate-200 text-slate-700' :
                        'bg-emerald-100 text-emerald-700'
                      )}>
                        {log.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Export & Share */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileText size={18} className="text-blue-600" /> Security Batch Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {lastExport && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <CheckCircle2 size={16} className="text-emerald-600" /> Batch Downloaded
                  </div>
                  <p className="font-mono text-[11px] text-emerald-700">{lastExport.fileName} ({Math.round(lastExport.size / 1024)} KB)</p>
                </div>
              )}

              <Button
                onClick={handleExportSecurityBatch}
                disabled={isExporting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                <Download size={18} />
                {isExporting ? 'Generating Batch...' : 'Export Security Batch'}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Share2 size={18} className="text-blue-600" /> Share Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-1.5 overflow-x-auto shadow-inner">
                <p className="text-blue-400 font-bold"># Security Gate Summary</p>
                <p>Visitors Today: {visitorLogs.length}</p>
                <p>On Premises: {visitorLogs.filter(v => v.status === 'On Premises').length}</p>
                <p className="text-emerald-400">Status: Delta Ready</p>
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

export default SecurityPortalView;
