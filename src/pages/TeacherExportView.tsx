import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Database, 
  FileText, 
  HardDrive, 
  Users, 
  ClipboardCheck, 
  BookOpen, 
  Share2, 
  Copy, 
  Check, 
  Calendar,
  Layers,
  Award,
  ArrowRight
} from 'lucide-react';
import { batchExportService, ClassPackageData } from '@/services/batchExportService';
import { useToast } from '@/components/ui/use-toast';

export const TeacherExportView: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [packagePreview, setPackagePreview] = useState<ClassPackageData | null>(null);
  const [lastExportInfo, setLastExportInfo] = useState<{ fileName: string; timestamp: string; size: number } | null>(null);
  const [copiedShareText, setCopiedShareText] = useState(false);

  const teacherName = user?.name || 'Teacher';
  const teacherId = user?.id || 'TCH-001';
  const assignedGrade = (user as any)?.assignedClass || (user as any)?.grade || 'Grade 4';
  const assignedStream = (user as any)?.stream || 'Green';

  // Load live summary metrics on mount
  useEffect(() => {
    loadPreview();
  }, []);

  const loadPreview = async () => {
    try {
      const data = await batchExportService.generateClassPackage({
        id: teacherId,
        name: teacherName,
        assignedClass: assignedGrade,
        stream: assignedStream
      });
      setPackagePreview(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportPackage = async () => {
    setIsExporting(true);
    try {
      const result = await batchExportService.exportAndSavePackage({
        id: teacherId,
        name: teacherName,
        assignedClass: assignedGrade,
        stream: assignedStream
      });

      const nowStr = new Date().toLocaleString();
      setLastExportInfo({ fileName: result.fileName, timestamp: nowStr, size: result.size });

      // Refresh preview stats
      await loadPreview();

      toast({
        title: "Teacher Offline Package Exported!",
        description: `Successfully saved ${result.fileName} (${Math.round(result.size / 1024)} KB) with verified metadata headers.`,
      });
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Could not generate offline class package.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getShareSnippet = () => {
    const studentCount = packagePreview?.learners?.length || 0;
    const attCount = packagePreview?.attendanceRecords?.length || 0;
    const cbcCount = packagePreview?.cbcAssessments?.length || 0;
    const time = new Date().toLocaleTimeString();

    return `📦 *Munyaka CBC Offline Class Package*
👨‍🏫 Teacher: ${teacherName} (ID: ${teacherId})
🏫 Grade/Stream: ${assignedGrade} - Stream ${assignedStream}
👥 Students Enrolled: ${studentCount}
📋 Attendance Logs: ${attCount}
📊 CBC Rubrics / Marks: ${cbcCount}
🕒 Generated: ${new Date().toLocaleDateString()} at ${time}
✅ Ready for secure offline import into Admin Harmonization Hub.`;
  };

  const handleCopyShareText = () => {
    navigator.clipboard.writeText(getShareSnippet());
    setCopiedShareText(true);
    toast({
      title: "Summary Copied to Clipboard",
      description: "You can now paste this offline package summary into WhatsApp or SMS."
    });
    setTimeout(() => setCopiedShareText(false), 3000);
  };

  const studentCount = packagePreview?.learners?.length || 0;
  const attendanceCount = packagePreview?.attendanceRecords?.length || 0;
  const cbcCount = packagePreview?.cbcAssessments?.length || 0;
  const checkInCount = packagePreview?.teacherCheckInLogs?.length || 0;
  const totalRecords = studentCount + attendanceCount + cbcCount + checkInCount;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 backdrop-blur-3xl rounded-l-full pointer-events-none hidden lg:block" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-blue-200">
              <Sparkles size={14} /> Offline Teacher Hub
            </div>
            <h1 className="text-3xl font-black tracking-tight">Teacher Offline Export Dashboard</h1>
            <p className="text-blue-100 text-sm max-w-2xl font-medium">
              Prepare, review, and export your stream's operational records into a secure, validated JSON package for offline transfer to the Admin Harmonization Hub.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleExportPackage}
              disabled={isExporting}
              className="bg-white text-blue-900 hover:bg-blue-50 font-bold px-6 py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2 text-sm"
            >
              <Download size={18} className="text-blue-600" />
              {isExporting ? 'Packaging...' : 'Export Batch Package'}
            </Button>
          </div>
        </div>
      </div>

      {/* Teacher & Stream Identity Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Teacher</p>
          <p className="text-base font-extrabold text-slate-900">{teacherName}</p>
          <p className="text-xs font-mono text-indigo-600">ID: {teacherId}</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Grade & Stream</p>
          <p className="text-base font-extrabold text-slate-900">{assignedGrade}</p>
          <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <ShieldCheck size={12} /> Stream: {assignedStream}
          </p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Bundle Records</p>
          <p className="text-base font-extrabold text-slate-900">{totalRecords} Records</p>
          <p className="text-xs text-slate-500">Live indexed state</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Metadata Header</p>
          <p className="text-base font-extrabold text-emerald-700">v1.0.0 Verified</p>
          <p className="text-xs text-slate-500">SHA-256 payload ready</p>
        </Card>
      </div>

      {/* Summary Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Students in Stream</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{studentCount}</p>
            <p className="text-xs text-slate-500 mt-1">Enrolled learners in {assignedGrade} - {assignedStream}</p>
          </div>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ClipboardCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance Status</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{attendanceCount}</p>
            <p className="text-xs text-slate-500 mt-1">Logged roll-call & check-in items</p>
          </div>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Award size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">CBC Assessments</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{cbcCount}</p>
            <p className="text-xs text-slate-500 mt-1">8-tier rubrics & scored marks</p>
          </div>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <HardDrive size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Teacher Check-Ins</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{checkInCount}</p>
            <p className="text-xs text-slate-500 mt-1">Daily attendance logs verified</p>
          </div>
        </Card>
      </div>

      {/* Main Export & Share Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Generator Action */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Batch JSON Package Generator</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Compiles local state into a secure offline JSON package with strict metadata headers.
                  </CardDescription>
                </div>
                <Badge className="bg-blue-100 text-blue-700 font-bold border-0 px-3 py-1">
                  Offline Ready
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">Strict Metadata Headers Enforced</p>
                    <p className="text-xs text-slate-500 font-mono">
                      Includes: teacherId ("{teacherId}"), stream ("{assignedStream}"), grade ("{assignedGrade}"), timestamp, and recordCounts.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">Comprehensive Stream Bundling</p>
                    <p className="text-xs text-slate-500">
                      Bundles student enrollment profiles, daily attendance registers, 8-tier CBC rubrics, and staff check-in history.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">Zero Internet Required</p>
                    <p className="text-xs text-slate-500">
                      Files are generated locally in browser storage or device Documents folder, ready for flash drive or WhatsApp transfer.
                    </p>
                  </div>
                </div>
              </div>

              {lastExportInfo && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold">Package Successfully Generated & Downloaded</p>
                      <p className="font-mono text-[11px] text-emerald-700">{lastExportInfo.fileName} ({Math.round(lastExportInfo.size / 1024)} KB)</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-200 text-emerald-800 font-bold border-0 text-[10px]">
                    {lastExportInfo.timestamp}
                  </Badge>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                <Button
                  onClick={handleExportPackage}
                  disabled={isExporting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-base"
                >
                  <Download size={20} />
                  {isExporting ? 'Generating Secure Package...' : 'Export Batch Package (.JSON)'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Download & Share Interface */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Share2 size={18} className="text-blue-600" /> Share & Channels
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Quick options for local distribution over WhatsApp or peer transfer.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2 leading-relaxed overflow-x-auto shadow-inner">
                  <div className="text-blue-400 font-bold border-b border-slate-800 pb-1 flex items-center justify-between">
                    <span>Summary Preview</span>
                    <span className="text-[10px] text-slate-400">UTF-8 JSON</span>
                  </div>
                  <p>Teacher: {teacherName}</p>
                  <p>ID: {teacherId}</p>
                  <p>Grade/Stream: {assignedGrade} - {assignedStream}</p>
                  <p>Records: {totalRecords} items</p>
                  <p className="text-emerald-400">Status: Ready for Harmonization</p>
                </div>

                <p className="text-xs text-slate-500">
                  Copy this confirmation summary to your clipboard to paste into WhatsApp admin groups or local teacher chat channels.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleCopyShareText}
                  variant="outline"
                  className="w-full border-slate-200 hover:bg-slate-50 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-slate-700"
                >
                  {copiedShareText ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  {copiedShareText ? 'Copied to Clipboard!' : 'Copy WhatsApp Share Text'}
                </Button>

                <div className="text-center">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Carrying records? Take the downloaded JSON file to the <span className="text-blue-600 font-bold">Admin Harmonization Hub</span>.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherExportView;
