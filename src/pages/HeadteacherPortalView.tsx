import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Users, 
  ClipboardCheck, 
  BarChart3, 
  ShieldCheck, 
  Award, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  CheckCircle2, 
  Activity,
  Layers
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export const HeadteacherPortalView: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const headName = user?.name || 'Headteacher';
  const headId = user?.id || 'HEAD-001';

  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<{ fileName: string; timestamp: string; size: number } | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const handleExportExecutiveReport = () => {
    setIsExporting(true);
    try {
      const payload = {
        meta: {
          exportType: 'HEADTEACHER_EXECUTIVE_SUMMARY',
          headteacherId: headId,
          headteacherName: headName,
          timestamp: new Date().toISOString()
        },
        schoolMetrics: {
          totalStudents: 480,
          attendanceAverage: '96.4%',
          staffCheckInCompliance: '98.2% (Within 150m geofence)',
          academicPerformanceMean: '74.8 (B+)'
        }
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Headteacher_Executive_Report_${headId}_${new Date().toISOString().slice(0, 10)}.json`;
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
        title: "Executive Report Exported Successfully",
        description: `Saved ${link.download} (${Math.round(blob.size / 1024)} KB) with school-wide telemetry.`
      });
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Could not generate executive report.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getShareText = () => {
    return `🏫 *Munyaka Executive School Performance Report*
👤 Headteacher: ${headName} (ID: ${headId})
👥 Enrolled Students: 480
📈 School Attendance Average: 96.4%
📍 Staff Check-In Compliance: 98.2% (150m Geofence Verified)
📊 Academic Mean Score: 74.8 (B+)
🕒 Generated: ${new Date().toLocaleString()}
✅ Verified for Admin Harmonization Hub.`;
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(getShareText());
    setCopiedShare(true);
    toast({
      title: "Summary Copied to Clipboard",
      description: "Paste this executive summary into board or management chats."
    });
    setTimeout(() => setCopiedShare(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 backdrop-blur-3xl rounded-l-full pointer-events-none hidden lg:block" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-purple-200">
              <Building size={14} /> Senior Management & Headteacher Portal
            </div>
            <h1 className="text-3xl font-black tracking-tight">Executive Overview & School Performance Dashboard</h1>
            <p className="text-purple-100 text-sm max-w-2xl font-medium">
              Monitor school-wide attendance averages, staff check-in compliance (based on the 150m geofence), and academic performance metrics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleExportExecutiveReport}
              disabled={isExporting}
              className="bg-white text-purple-950 hover:bg-purple-50 font-bold px-6 py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2 text-sm"
            >
              <Download size={18} className="text-purple-600" />
              {isExporting ? 'Packaging Report...' : 'Export Executive Report (.JSON)'}
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Enrolled Students</p>
            <p className="text-3xl font-black text-slate-900 mt-1">480</p>
            <p className="text-xs text-slate-500 mt-1">Across all primary & JSS streams</p>
          </div>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ClipboardCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance Average</p>
            <p className="text-3xl font-black text-slate-900 mt-1">96.4%</p>
            <p className="text-xs text-emerald-600 mt-1 font-semibold">High student turnout</p>
          </div>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Staff Check-In Compliance</p>
            <p className="text-3xl font-black text-slate-900 mt-1">98.2%</p>
            <p className="text-xs text-blue-600 mt-1 font-semibold">Verified within 150m geofence</p>
          </div>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Award size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Mean Score</p>
            <p className="text-3xl font-black text-slate-900 mt-1">74.8 (B+)</p>
            <p className="text-xs text-slate-500 mt-1">Term 1 CBC assessments</p>
          </div>
        </Card>
      </div>

      {/* Main Export & Share Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
            <CardTitle className="text-lg font-bold">Executive Report Generator</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Compile school-wide telemetry into a secure JSON report.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {lastExport && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 size={16} className="text-emerald-600" /> Executive Report Downloaded
                </div>
                <p className="font-mono text-[11px] text-emerald-700">{lastExport.fileName} ({Math.round(lastExport.size / 1024)} KB)</p>
              </div>
            )}

            <Button
              onClick={handleExportExecutiveReport}
              disabled={isExporting}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm"
            >
              <Download size={18} />
              {isExporting ? 'Generating Report...' : 'Export Executive Report (.JSON)'}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Share2 size={18} className="text-purple-700" /> Share Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-1.5 overflow-x-auto shadow-inner">
              <p className="text-purple-400 font-bold"># Headteacher Summary</p>
              <p>Attendance: 96.4%</p>
              <p>Staff Compliance: 98.2% (150m Geofence)</p>
              <p>Academic Mean: 74.8 (B+)</p>
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
  );
};

export default HeadteacherPortalView;
