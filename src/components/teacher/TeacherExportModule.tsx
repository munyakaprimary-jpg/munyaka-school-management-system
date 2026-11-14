import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { readGradesAndStreams, getStreamsForGrade } from '@/services/gradesStreamsConfig';
import { showSuccess, showError } from '@/utils/toast';
import TeacherSyncQrGenerator from '@/components/teacher/TeacherSyncQrGenerator';

const SCHOOL_CENTRE_CODE = '26534178';

export const TeacherExportModule: React.FC = () => {
  const { user } = useAuth();

  const config = useMemo(() => readGradesAndStreams(), []);
  const grades = config.grades;
  const streams = useMemo(() => config.streams, [config]);

  const [selectedGrade, setSelectedGrade] = useState<string>(() => grades[0] || 'Grade 1');
  const availableStreams = useMemo(() => {
    const s = getStreamsForGrade(selectedGrade, config);
    return s.length > 0 ? s : config.streams;
  }, [selectedGrade, config]);

  const [selectedStream, setSelectedStream] = useState<string>(() => availableStreams[0] || 'Green');

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

  // Listen for sync_queue cleared signal from Admin
  useEffect(() => {
    const handleStorage = () => {
      const cleared = localStorage.getItem('munyaka_sync_queue_cleared');
      if (cleared) {
        showSuccess('Admin has successfully scanned and synced your records! Local sync queue marked as clean.');
        localStorage.removeItem('munyaka_sync_queue_cleared');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const buildPayload = () => {
    const attendance = JSON.parse(localStorage.getItem('munyaka_attendance_records') || '[]');
    const marks = JSON.parse(localStorage.getItem('marked_student_submissions') || '[]');
    const checkIns = JSON.parse(localStorage.getItem('munyaka_teacher_checkins') || localStorage.getItem('munyaka_staff_checkins') || '[]');
    let centralDb: any = {};
    try {
      centralDb = JSON.parse(localStorage.getItem('munyaka_central_db') || '{}');
    } catch {
      centralDb = {};
    }

    return {
      centreCode: SCHOOL_CENTRE_CODE,
      metadata: {
        senderName: user?.name || 'Class Teacher',
        staffId: (user as any)?.staffId || user?.staff_id || user?.id || 'TCH-001',
        departmentOrStream: selectedStream,
        packageType: 'TEACHER_OFFLINE_BATCH',
        assignedClass: selectedGrade,
        assignedStream: selectedStream,
        exportedAt: new Date().toISOString(),
        appVersion: '2.0.0'
      },
      data: {
        attendance,
        marks,
        checkIns,
        munyaka_central_db: centralDb
      }
    };
  };

  const handleDownloadJsonFallback = () => {
    try {
      const payload = buildPayload();
      const jsonString = JSON.stringify(payload, null, 2);
      const staffNameSlug = (user?.name || 'teacher').replace(/\s+/g, '_').toLowerCase();
      const todayDate = new Date().toISOString().split('T')[0];
      const filename = `munyaka_teacher_sync_${staffNameSlug}_${todayDate}.json`;
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Teacher sync package JSON downloaded successfully!');
    } catch (err: any) {
      showError(err?.message || 'Failed to download JSON fallback.');
    }
  };

  return (
    <>
      <Card className="rounded-3xl border-slate-200 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 shadow-sm overflow-hidden font-sans">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 font-bold uppercase tracking-wider text-[10px]">
              Teacher Class Package Export (Centre: {SCHOOL_CENTRE_CODE})
            </Badge>
            <ShieldCheck size={18} className="text-indigo-600" />
          </div>
          <CardTitle className="text-xl font-black text-slate-900 mt-2">
            Export My Class Package (.json)
          </CardTitle>
          <CardDescription className="text-xs text-slate-600">
            Package your recorded attendance, check-ins, and CBC assessment marks to send to the administrator.
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

          {/* Action Buttons: Generate Sync QR Code + Export Class Package */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TeacherSyncQrGenerator
              grade={selectedGrade}
              stream={selectedStream}
              className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-black rounded-xl shadow-md transition-all active:scale-95"
            />
            <Button
              onClick={handleDownloadJsonFallback}
              className="flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-xl shadow-md transition-all active:scale-95"
            >
              <Download className="w-5 h-5 shrink-0 text-white" />
              <span>Export Teacher Sync Package (.json)</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default TeacherExportModule;
