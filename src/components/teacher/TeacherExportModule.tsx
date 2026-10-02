import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Sparkles, CheckCircle2, ShieldCheck, Database, FileText, HardDrive, AlertCircle, PackageOpen } from 'lucide-react';
import { batchExportService } from '@/services/batchExportService';
import { useToast } from '@/components/ui/use-toast';

export const TeacherExportModule: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportInfo, setLastExportInfo] = useState<{ fileName: string; timestamp: string } | null>(null);

  const teacherName = user?.name || 'Teacher';
  const teacherId = user?.id || 'TCH-001';
  const assignedGrade = (user as any)?.assignedClass || (user as any)?.grade || 'Grade 4';
  const assignedStream = (user as any)?.stream || 'Green';

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
      setLastExportInfo({ fileName: result.fileName, timestamp: nowStr });

      toast({
        title: "Master Class Package Exported Successfully!",
        description: `Saved ${result.fileName} (${Math.round(result.size / 1024)} KB) with attendance, check-ins, and CBC records.`,
      });
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Could not generate class package file.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-blue-200">
              <Sparkles size={14} /> Offline Batch File Export
            </div>
            <h2 className="text-xl font-black tracking-tight">Master Class Package Export</h2>
            <p className="text-blue-100 text-xs font-medium">
              Bundle your stream's attendance, check-ins, CBC assessment rubrics, and inventory into a secure offline JSON package.
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 hidden sm:flex">
            <HardDrive size={28} />
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Teacher</p>
            <p className="text-sm font-bold text-slate-900">{teacherName}</p>
            <p className="text-xs text-slate-500">ID: {teacherId}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Class & Stream</p>
            <p className="text-sm font-bold text-slate-900">{assignedGrade} · Stream {assignedStream}</p>
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck size={12} /> Stream Isolated
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Package Contents</p>
            <p className="text-sm font-bold text-slate-900">Attendance, Marks, Check-ins</p>
            <p className="text-xs text-slate-500">Embedded metadata header</p>
          </div>
        </div>

        {lastExportInfo && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold">Last Export Successful ({lastExportInfo.timestamp})</p>
              <p className="font-mono text-[11px] text-emerald-700">{lastExportInfo.fileName}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 flex-wrap">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Database size={14} className="text-blue-600" />
            <span>Primary offline workflow for carrying stream-isolated records to Admin Harmonization Hub.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            <Button
              onClick={handleExportPackage}
              disabled={isExporting}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Download size={18} />
              {isExporting ? 'Packaging Records...' : 'Export Class Package'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeacherExportModule;
