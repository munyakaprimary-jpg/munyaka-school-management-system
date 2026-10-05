import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload, CheckCircle2, ShieldCheck, Database, FileText, ArrowRight, School, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { exportClassPackage } from '@/services/departmentExportService';
import { readGradesAndStreams, getStreamsForGrade } from '@/services/gradesStreamsConfig';
import { ExportSuccessShareModal } from './ExportSuccessShareModal';
import { importMasterSyncPackage } from '@/utils/importMasterSyncPackage';
import { showSuccess, showError } from '@/utils/toast';

export const TeacherExportModule: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dynamically load grades and streams directly from Grades & Streams menu configuration
  const config = useMemo(() => readGradesAndStreams(), []);
  const grades = config.grades;
  const streams = useMemo(() => {
    return config.streams;
  }, [config]);

  // Initialize with teacher profile or default
  const [selectedGrade, setSelectedGrade] = useState<string>(() => {
    return grades[0] || 'Grade 1';
  });

  const availableStreams = useMemo(() => {
    const s = getStreamsForGrade(selectedGrade, config);
    return s.length > 0 ? s : config.streams;
  }, [selectedGrade, config]);

  const [selectedStream, setSelectedStream] = useState<string>(() => {
    return availableStreams[0] || 'Green';
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [successShareData, setSuccessShareData] = useState<{
    isOpen: boolean;
    filename: string;
    data: string;
    mimeType: string;
    title: string;
  }>({
    isOpen: false,
    filename: '',
    data: '',
    mimeType: 'application/json',
    title: ''
  });

  // Fetch counts of teacher records in offline local state
  const attendanceCount = (() => {
    try {
      const records = JSON.parse(localStorage.getItem('munyaka_attendance_records') || '[]');
      return Array.isArray(records) ? records.length : 0;
    } catch {
      return 0;
    }
  })();

  const marksCount = (() => {
    try {
      const records = JSON.parse(localStorage.getItem('marked_student_submissions') || '[]');
      return Array.isArray(records) ? records.length : 0;
    } catch {
      return 0;
    }
  })();

  const checkInsCount = (() => {
    try {
      const records = JSON.parse(localStorage.getItem('munyaka_teacher_checkins') || '[]');
      return Array.isArray(records) ? records.length : 0;
    } catch {
      return 0;
    }
  })();

  const handleExport = () => {
    setIsExporting(true);
    try {
      localStorage.setItem('munyaka_temp_export_override', JSON.stringify({
        assignedClass: selectedGrade,
        assignedStream: selectedStream
      }));

      const attendance = JSON.parse(localStorage.getItem('munyaka_attendance_records') || '[]');
      const marks = JSON.parse(localStorage.getItem('marked_student_submissions') || '[]');
      const checkIns = JSON.parse(localStorage.getItem('munyaka_teacher_checkins') || '[]');

      const payload = {
        metadata: {
          senderName: user?.name || 'Class Teacher',
          staffId: (user as any)?.staffId || user?.staff_id || user?.id || 'TCH-001',
          departmentOrStream: selectedStream,
          packageType: 'CLASS_PACKAGE',
          assignedClass: selectedGrade,
          assignedStream: selectedStream,
          exportedAt: new Date().toISOString(),
          appVersion: '2.0.0'
        },
        data: {
          attendance,
          marks,
          checkIns
        }
      };

      const filename = `class_package_${selectedGrade.replace(/\s+/g, '_')}_${selectedStream}_${Date.now()}.json`;
      const jsonString = JSON.stringify(payload, null, 2);

      exportClassPackage(selectedStream, {
        assignedClass: selectedGrade,
        assignedStream: selectedStream
      });

      setSuccessShareData({
        isOpen: true,
        filename,
        data: jsonString,
        mimeType: 'application/json',
        title: `Class Package (${selectedGrade} - ${selectedStream}) Exported!`
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await importMasterSyncPackage(file);
      if (result.success) {
        showSuccess('Master data synchronized successfully!');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        showError(result.message || 'Failed to import master sync package.');
      }
    } catch (err: any) {
      showError(err?.message || 'Error importing file.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <Card className="rounded-3xl border-slate-200 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 shadow-sm overflow-hidden font-sans">
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 font-bold uppercase tracking-wider text-[10px]">
            Staff Export & Sync Portal
          </Badge>
          <ShieldCheck size={18} className="text-indigo-600" />
        </div>
        <CardTitle className="text-xl font-black text-slate-900 mt-2">
          Export Class Package & Import Master Sync
        </CardTitle>
        <CardDescription className="text-xs text-slate-600">
          Export your class records with verified metadata headers, or ingest the Admin Master Sync package to update all learners and metrics instantly.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-5">
        {/* Record count summaries */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
          <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm">
            <span className="block text-lg font-black text-indigo-700">{attendanceCount}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Roll Call</span>
          </div>
          <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm">
            <span className="block text-lg font-black text-purple-700">{marksCount}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Marks</span>
          </div>
          <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm">
            <span className="block text-lg font-black text-emerald-700">{checkInsCount}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Check-Ins</span>
          </div>
        </div>

        {/* Interactive Grade & Stream Selectors */}
        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Teacher: {user?.name || 'Class Teacher'}</span>
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-mono">
              ID: {(user as any)?.staffId || user?.staff_id || user?.id || 'TCH-001'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Grade / Class
              </Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 font-bold text-xs text-slate-800">
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g} value={g} className="text-xs font-semibold">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Stream
              </Label>
              <Select value={selectedStream} onValueChange={setSelectedStream}>
                <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 font-bold text-xs text-slate-800">
                  <SelectValue placeholder="Select Stream" />
                </SelectTrigger>
                <SelectContent>
                  {availableStreams.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs font-semibold">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Action Buttons: Export & Import Master Sync (2-column side-by-side grid) */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />

        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Download className="w-4 h-4 shrink-0" />}
            <span className="truncate">{isExporting ? 'Packaging...' : 'Export Class Package'}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-emerald-600 text-emerald-700 text-xs font-medium rounded-lg shadow-sm hover:bg-emerald-50 transition-colors disabled:opacity-50"
          >
            {isImporting ? <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> : <Upload className="w-4 h-4 shrink-0 text-emerald-600" />}
            <span className="truncate">{isImporting ? 'Syncing...' : 'Import Master Sync Package'}</span>
          </button>
        </div>
      </CardContent>
    </Card>

      <ExportSuccessShareModal
        isOpen={successShareData.isOpen}
        onClose={() => setSuccessShareData(prev => ({ ...prev, isOpen: false }))}
        filename={successShareData.filename}
        data={successShareData.data}
        mimeType={successShareData.mimeType}
        title={successShareData.title}
        description="Class package generated & downloaded! Beam this package instantly to the Admin Harmonization Hub or WhatsApp."
      />
    </>
  );
};

export default TeacherExportModule;
