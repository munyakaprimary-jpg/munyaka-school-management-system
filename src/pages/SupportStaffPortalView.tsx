import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Box, 
  Wrench, 
  Hammer, 
  CheckCircle2, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  FileText, 
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export const SupportStaffPortalView: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const supportName = user?.name || 'Support Staff';
  const supportId = user?.id || 'SUP-001';

  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<{ fileName: string; timestamp: string; size: number } | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const [maintenanceLogs, setMaintenanceLogs] = useState([
    { id: 'M-1', item: 'Classroom 4B Door Hinge', category: 'Repair', priority: 'High', status: 'Pending', reportedDate: '2025-02-14' },
    { id: 'M-2', item: 'Science Lab Water Tap Leak', category: 'Plumbing', priority: 'Medium', status: 'In Progress', reportedDate: '2025-02-13' },
    { id: 'M-3', item: 'Boarding Dormitory Bulbs Replacement', category: 'Electrical', priority: 'Low', status: 'Resolved', reportedDate: '2025-02-10' }
  ]);

  const handleExportMaintenanceBatch = () => {
    setIsExporting(true);
    try {
      const payload = {
        meta: {
          exportType: 'SUPPORT_MAINTENANCE_BATCH',
          supportStaffId: supportId,
          supportStaffName: supportName,
          timestamp: new Date().toISOString(),
          recordCounts: {
            totalLogs: maintenanceLogs.length,
            pending: maintenanceLogs.filter(m => m.status === 'Pending').length
          }
        },
        maintenanceLogs
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Support_Maintenance_Batch_${supportId}_${new Date().toISOString().slice(0, 10)}.json`;
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
        title: "Maintenance Batch Exported Successfully",
        description: `Saved ${link.download} (${Math.round(blob.size / 1024)} KB) for Admin Harmonization.`
      });
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Could not generate maintenance batch.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getShareText = () => {
    return `🔧 *Munyaka Support & Maintenance Log*
👷 Staff: ${supportName} (ID: ${supportId})
📋 Active Requisitions: ${maintenanceLogs.length}
⚠️ Pending Repairs: ${maintenanceLogs.filter(m => m.status === 'Pending').length}
🕒 Exported: ${new Date().toLocaleString()}
✅ Verified for Admin Harmonization Hub.`;
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(getShareText());
    setCopiedShare(true);
    toast({
      title: "Summary Copied to Clipboard",
      description: "Paste this maintenance summary into admin channels."
    });
    setTimeout(() => setCopiedShare(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-800 via-orange-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 backdrop-blur-3xl rounded-l-full pointer-events-none hidden lg:block" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-amber-200">
              <Wrench size={14} /> Support, Maintenance & Boarding Portal
            </div>
            <h1 className="text-3xl font-black tracking-tight">Facility Maintenance & Store Requisition Dashboard</h1>
            <p className="text-amber-100 text-sm max-w-2xl font-medium">
              Manage school repairs, utility maintenance, boarding stores, and generate offline maintenance batches for admin harmonization.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleExportMaintenanceBatch}
              disabled={isExporting}
              className="bg-white text-amber-950 hover:bg-amber-50 font-bold px-6 py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2 text-sm"
            >
              <Download size={18} className="text-amber-600" />
              {isExporting ? 'Packaging Batch...' : 'Export Maintenance Batch (.JSON)'}
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Staff</p>
          <p className="text-base font-extrabold text-slate-900">{supportName}</p>
          <p className="text-xs font-mono text-amber-600">ID: {supportId}</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Requisitions</p>
          <p className="text-base font-extrabold text-slate-900">{maintenanceLogs.length} Entries</p>
          <p className="text-xs text-slate-500">Repairs & stores inventory</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Actions</p>
          <p className="text-base font-extrabold text-amber-600">{maintenanceLogs.filter(m => m.status === 'Pending').length} Pending</p>
          <p className="text-xs text-slate-500">Requires attention</p>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <CardTitle className="text-lg font-bold">Facility Repairs & Maintenance Logs</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {maintenanceLogs.map((log) => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{log.item}</span>
                        <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold border-0">{log.category}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">Priority: <span className="font-semibold text-slate-700">{log.priority}</span> | Date: {log.reportedDate}</p>
                    </div>
                    <div>
                      <Badge className={cn(
                        "font-bold text-xs border-0 px-3 py-1",
                        log.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                        log.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
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
                <FileText size={18} className="text-amber-700" /> Maintenance Batch Generator
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
                onClick={handleExportMaintenanceBatch}
                disabled={isExporting}
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                <Download size={18} />
                {isExporting ? 'Generating Batch...' : 'Export Maintenance Batch'}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Share2 size={18} className="text-amber-700" /> Share Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-1.5 overflow-x-auto shadow-inner">
                <p className="text-amber-400 font-bold"># Maintenance Summary</p>
                <p>Total Requisitions: {maintenanceLogs.length}</p>
                <p>Pending: {maintenanceLogs.filter(m => m.status === 'Pending').length}</p>
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

export default SupportStaffPortalView;
