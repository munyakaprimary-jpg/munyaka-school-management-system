import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Download, ShieldCheck, Calendar as CalendarIcon, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useClassLock } from '@/context/ClassLockContext';
import { readGradesAndStreams, getStreamsForGrade } from '@/services/gradesStreamsConfig';
import { showSuccess, showError } from '@/utils/toast';
import TeacherSyncQrGenerator from '@/components/teacher/TeacherSyncQrGenerator';

const SCHOOL_CENTRE_CODE = '26534178';

export const TeacherExportModule: React.FC = () => {
  const { user } = useAuth();
  const { activeClass, isAdmin } = useClassLock();

  const config = useMemo(() => readGradesAndStreams(), []);
  const grades = config.grades;
  const streams = useMemo(() => config.streams, [config]);

  const initialGradePart = !isAdmin && activeClass.grade ? activeClass.grade : 'Grade 4';
  const initialStreamPart = !isAdmin && activeClass.stream ? activeClass.stream : 'Yellow';

  const [selectedGrade, setSelectedGrade] = useState<string>(initialGradePart);
  const [selectedStream, setSelectedStream] = useState<string>(initialStreamPart);

  // Keep synced if class lock changes
  useEffect(() => {
    if (!isAdmin) {
      if (activeClass.grade) setSelectedGrade(activeClass.grade);
      if (activeClass.stream) setSelectedStream(activeClass.stream);
    }
  }, [isAdmin, activeClass]);

  // Optional Date Picker for Missed Syncs (defaults to today YYYY-MM-DD)
  const todayLocalString = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [exportDate, setExportDate] = useState<string>(todayLocalString);

  // Helper to normalize grade & stream strings case-insensitively
  const normalizeStr = (val: any) => String(val || '').trim().toLowerCase();

  // Helper to check if an attendance record matches today's date & class AND is not unsubmitted/blank
  const isValidAttendanceMatch = (record: any, targetDate: string, targetGrade: string, targetStream: string) => {
    if (!record || typeof record !== 'object') return false;

    // 1. Date filter (match record.date or parsed date)
    const recDate = String(record.date || record.updatedAt || record.timestamp || '').split('T')[0];
    if (targetDate && recDate && recDate !== targetDate) return false;

    // 2. Class/Grade & Stream filter
    const recGrade = normalizeStr(record.grade || record.classLevel || record.assignedGrade || '');
    const recStream = normalizeStr(record.stream || record.departmentOrStream || record.assignedStream || '');
    const normTargetGrade = normalizeStr(targetGrade);
    const normTargetStream = normalizeStr(targetStream);

    if (normTargetGrade && recGrade && recGrade !== normTargetGrade) return false;
    if (normTargetStream && recStream && recStream !== normTargetStream) return false;

    // 3. Exclude unsubmitted/blank attendance records where both morning and afternoon statuses are empty/null/blank
    if (record.students && typeof record.students === 'object') {
      const studentEntries = Object.values(record.students);
      if (studentEntries.length > 0) {
        // Check if at least one student has a non-empty morning or afternoon status
        const hasValidStatus = studentEntries.some((s: any) => {
          const m = String(s?.morning || s?.status || '').trim();
          const a = String(s?.afternoon || '').trim();
          return (m && m !== '' && m.toLowerCase() !== 'null' && m.toLowerCase() !== 'undefined') ||
                 (a && a !== '' && a.toLowerCase() !== 'null' && a.toLowerCase() !== 'undefined');
        });
        if (!hasValidStatus) return false;
      }
    } else {
      const m = String(record.morning || record.status || '').trim();
      const a = String(record.afternoon || '').trim();
      const isBlank = (!m || m.toLowerCase() === 'null') && (!a || a.toLowerCase() === 'null');
      if (isBlank) return false;
    }

    return true;
  };

  // Helper to check if a marks record matches today's date & class
  const isValidMarksMatch = (record: any, targetDate: string, targetGrade: string, targetStream: string) => {
    if (!record || typeof record !== 'object') return false;
    const recDate = String(record.date || record.updatedAt || record.timestamp || record.submittedAt || '').split('T')[0];
    if (targetDate && recDate && recDate !== targetDate) return false;

    const recGrade = normalizeStr(record.grade || record.classLevel || record.assignedGrade || '');
    const recStream = normalizeStr(record.stream || record.assignedStream || '');
    const normTargetGrade = normalizeStr(targetGrade);
    const normTargetStream = normalizeStr(targetStream);

    if (normTargetGrade && recGrade && recGrade !== normTargetGrade) return false;
    if (normTargetStream && recStream && recStream !== normTargetStream) return false;

    return true;
  };

  // Helper to check if a check-in record matches today's date & class/teacher
  const isValidCheckInMatch = (record: any, targetDate: string, targetGrade: string, targetStream: string) => {
    if (!record || typeof record !== 'object') return false;
    const recDate = String(record.date || record.checkInDate || record.timestamp || record.updatedAt || '').split('T')[0];
    if (targetDate && recDate && recDate !== targetDate) return false;

    const recGrade = normalizeStr(record.grade || record.classLevel || record.assignedGrade || '');
    const recStream = normalizeStr(record.stream || record.departmentOrStream || record.assignedStream || '');
    const normTargetGrade = normalizeStr(targetGrade);
    const normTargetStream = normalizeStr(targetStream);

    if (normTargetGrade && recGrade && recGrade !== normTargetGrade) return false;
    if (normTargetStream && recStream && recStream !== normTargetStream) return false;

    return true;
  };

  // Filtered counts for the UI counters
  const attendanceCount = useMemo(() => {
    try {
      const rawRollCalls = localStorage.getItem('roll_call_records') || localStorage.getItem('munyaka_attendance_records') || '[]';
      const parsed = JSON.parse(rawRollCalls);
      const list = Array.isArray(parsed) ? parsed : Object.values(parsed);
      const filtered = list.filter((r: any) => isValidAttendanceMatch(r, exportDate, selectedGrade, selectedStream));
      return filtered.length;
    } catch {
      return 0;
    }
  }, [exportDate, selectedGrade, selectedStream]);

  const marksCount = useMemo(() => {
    try {
      const records = JSON.parse(localStorage.getItem('marked_student_submissions') || localStorage.getItem('munyaka_marks_records') || '[]');
      const list = Array.isArray(records) ? records : Object.values(records);
      const filtered = list.filter((r: any) => isValidMarksMatch(r, exportDate, selectedGrade, selectedStream));
      return filtered.length;
    } catch {
      return 0;
    }
  }, [exportDate, selectedGrade, selectedStream]);

  const checkInsCount = useMemo(() => {
    try {
      const records = JSON.parse(localStorage.getItem('munyaka_teacher_checkins') || localStorage.getItem('munyaka_staff_checkins') || '[]');
      const list = Array.isArray(records) ? records : Object.values(records);
      const filtered = list.filter((r: any) => isValidCheckInMatch(r, exportDate, selectedGrade, selectedStream));
      return filtered.length;
    } catch {
      return 0;
    }
  }, [exportDate, selectedGrade, selectedStream]);

  // Auto-sync with teacher assigned class changes (e.g. from Dashboard Assigned Class selector)
  useEffect(() => {
    const checkAssignedClass = () => {
      try {
        const curr = JSON.parse(localStorage.getItem('munyaka_current_user') || '{}');
        const assigned = curr.assignedClass || (user as any)?.assignedClass || '';
        if (assigned && assigned !== 'No Class Assigned') {
          const parts = assigned.trim().split(' ');
          if (parts.length >= 2) {
            const g = parts.slice(0, parts.length - 1).join(' ');
            const s = parts[parts.length - 1];
            if (grades.includes(g)) {
              setSelectedGrade(g);
              const streamsForG = getStreamsForGrade(g, config);
              if (streamsForG.includes(s)) {
                setSelectedStream(s);
              }
            }
          }
        }
      } catch {}
    };

    const interval = setInterval(checkAssignedClass, 1000);
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'munyaka_current_user' || e.key === 'munyaka_attendance_records' || e.key === 'roll_call_records') {
        checkAssignedClass();
      }
      const cleared = localStorage.getItem('munyaka_sync_queue_cleared');
      if (cleared) {
        showSuccess('Admin has successfully scanned and synced your records! Local sync queue marked as clean.');
        localStorage.removeItem('munyaka_sync_queue_cleared');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [user, grades, config]);

  const buildFilteredPayload = () => {
    let rawRollCalls: any = [];
    try {
      const stored = localStorage.getItem('roll_call_records') || localStorage.getItem('munyaka_attendance_records') || '[]';
      const parsed = JSON.parse(stored);
      rawRollCalls = Array.isArray(parsed) ? parsed : Object.values(parsed);
    } catch {
      rawRollCalls = [];
    }
    const filteredAttendance = rawRollCalls.filter((r: any) => isValidAttendanceMatch(r, exportDate, selectedGrade, selectedStream));

    let rawMarks: any = [];
    try {
      const stored = localStorage.getItem('marked_student_submissions') || localStorage.getItem('munyaka_marks_records') || '[]';
      const parsed = JSON.parse(stored);
      rawMarks = Array.isArray(parsed) ? parsed : Object.values(parsed);
    } catch {
      rawMarks = [];
    }
    const filteredMarks = rawMarks.filter((r: any) => isValidMarksMatch(r, exportDate, selectedGrade, selectedStream));

    let rawCheckIns: any = [];
    try {
      const stored = localStorage.getItem('munyaka_teacher_checkins') || localStorage.getItem('munyaka_staff_checkins') || '[]';
      const parsed = JSON.parse(stored);
      rawCheckIns = Array.isArray(parsed) ? parsed : Object.values(parsed);
    } catch {
      rawCheckIns = [];
    }
    const filteredCheckIns = rawCheckIns.filter((r: any) => isValidCheckInMatch(r, exportDate, selectedGrade, selectedStream));

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
        exportDateFilter: exportDate,
        exportedAt: new Date().toISOString(),
        appVersion: '2.0.0'
      },
      data: {
        attendance: filteredAttendance,
        marks: filteredMarks,
        checkIns: filteredCheckIns,
        munyaka_central_db: centralDb
      }
    };
  };

  const handleDownloadJsonFallback = () => {
    try {
      const payload = buildFilteredPayload();
      const jsonString = JSON.stringify(payload, null, 2);
      const staffNameSlug = (user?.name || 'teacher').replace(/\s+/g, '_').toLowerCase();
      const filename = `munyaka_teacher_sync_${staffNameSlug}_${exportDate}.json`;
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess(`Teacher sync package JSON for ${exportDate} downloaded successfully!`);
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
            Package your recorded attendance, check-ins, and CBC assessment marks for your assigned class and export date.
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

          {/* Locked Assigned Class & Export Date Display Box */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Teacher: {user?.name || 'Class Teacher'}</span>
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-mono">
                ID: {(user as any)?.staffId || user?.staff_id || user?.id || 'TCH-001'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Read-Only Grade / Class */}
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-indigo-600" /> Grade / Class
                </Label>
                <div className="h-10 px-3 rounded-xl bg-white border border-slate-200 font-bold text-xs text-slate-800 flex items-center shadow-sm">
                  {selectedGrade}
                </div>
              </div>

              {/* Read-Only Stream */}
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Stream
                </Label>
                <div className="h-10 px-3 rounded-xl bg-white border border-slate-200 font-bold text-xs text-slate-800 flex items-center shadow-sm">
                  {selectedStream}
                </div>
              </div>

              {/* Export Date Selector */}
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3 text-indigo-600" /> Export Date
                </Label>
                <Input
                  type="date"
                  value={exportDate}
                  onChange={(e) => setExportDate(e.target.value)}
                  className="h-10 rounded-xl bg-white border-slate-200 font-bold text-xs text-slate-800 px-3 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons: Generate Sync QR Code + Export Class Package */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TeacherSyncQrGenerator
              grade={selectedGrade}
              stream={selectedStream}
              exportDate={exportDate}
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
