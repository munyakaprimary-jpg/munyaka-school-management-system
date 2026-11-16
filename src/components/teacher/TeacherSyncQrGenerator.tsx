import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Download, Copy, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/context/AuthContext';
import { showSuccess, showError } from '@/utils/toast';

const SCHOOL_CENTRE_CODE = '26534178';
const QR_MAX_PAYLOAD_CHARS = 2000;

interface TeacherSyncQrGeneratorProps {
  label?: string;
  className?: string;
  grade?: string;
  stream?: string;
  exportDate?: string;
  disabled?: boolean;
}

const normalizeStr = (val: any) => String(val || '').trim().toLowerCase();

const isValidAttendanceMatch = (record: any, targetDate: string, targetGrade: string, targetStream: string) => {
  if (!record || typeof record !== 'object') return false;

  const recDate = String(record.date || record.updatedAt || record.timestamp || '').split('T')[0];
  if (targetDate && recDate && recDate !== targetDate) return false;

  const recGrade = normalizeStr(record.grade || record.classLevel || record.assignedGrade || '');
  const recStream = normalizeStr(record.stream || record.departmentOrStream || record.assignedStream || '');
  const normTargetGrade = normalizeStr(targetGrade);
  const normTargetStream = normalizeStr(targetStream);

  if (normTargetGrade && recGrade && recGrade !== normTargetGrade) return false;
  if (normTargetStream && recStream && recStream !== normTargetStream) return false;

  if (record.students && typeof record.students === 'object') {
    const studentEntries = Object.values(record.students);
    if (studentEntries.length > 0) {
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

export const TeacherSyncQrGenerator: React.FC<TeacherSyncQrGeneratorProps> = ({
  label = 'Generate Sync QR Code',
  className,
  grade,
  stream,
  exportDate,
  disabled = false,
}) => {
  const { user } = useAuth();
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrPayloadString, setQrPayloadString] = useState('');

  const selectedGrade = grade || (user as any)?.assignedGrade || (user as any)?.assignedClass || 'Grade 4';
  const selectedStream = stream || (user as any)?.assignedStream || (user as any)?.stream || 'Green';
  const todayLocalString = exportDate || new Date().toISOString().split('T')[0];

  const attendanceCount = (() => {
    try {
      const stored = localStorage.getItem('roll_call_records') || localStorage.getItem('munyaka_attendance_records') || '[]';
      const parsed = JSON.parse(stored);
      const list = Array.isArray(parsed) ? parsed : Object.values(parsed);
      return list.filter((r: any) => isValidAttendanceMatch(r, todayLocalString, selectedGrade, selectedStream)).length;
    } catch {
      return 0;
    }
  })();

  const marksCount = (() => {
    try {
      const records = JSON.parse(localStorage.getItem('marked_student_submissions') || localStorage.getItem('munyaka_marks_records') || '[]');
      const list = Array.isArray(records) ? records : Object.values(records);
      return list.filter((r: any) => isValidMarksMatch(r, todayLocalString, selectedGrade, selectedStream)).length;
    } catch {
      return 0;
    }
  })();

  const checkInsCount = (() => {
    try {
      const records = JSON.parse(localStorage.getItem('munyaka_teacher_checkins') || localStorage.getItem('munyaka_staff_checkins') || '[]');
      const list = Array.isArray(records) ? records : Object.values(records);
      return list.filter((r: any) => isValidCheckInMatch(r, todayLocalString, selectedGrade, selectedStream)).length;
    } catch {
      return 0;
    }
  })();

  // Exact JSON schema consumed by the Admin Dashboard "Scan Teacher Sync QR" scanner
  const buildPayload = () => {
    let rawRollCalls: any = [];
    try {
      const stored = localStorage.getItem('roll_call_records') || localStorage.getItem('munyaka_attendance_records') || '[]';
      const parsed = JSON.parse(stored);
      rawRollCalls = Array.isArray(parsed) ? parsed : Object.values(parsed);
    } catch {
      rawRollCalls = [];
    }
    const attendance = rawRollCalls.filter((r: any) => isValidAttendanceMatch(r, todayLocalString, selectedGrade, selectedStream));

    let rawMarks: any = [];
    try {
      const stored = localStorage.getItem('marked_student_submissions') || localStorage.getItem('munyaka_marks_records') || '[]';
      const parsed = JSON.parse(stored);
      rawMarks = Array.isArray(parsed) ? parsed : Object.values(parsed);
    } catch {
      rawMarks = [];
    }
    const marks = rawMarks.filter((r: any) => isValidMarksMatch(r, todayLocalString, selectedGrade, selectedStream));

    let rawCheckIns: any = [];
    try {
      const stored = localStorage.getItem('munyaka_teacher_checkins') || localStorage.getItem('munyaka_staff_checkins') || '[]';
      const parsed = JSON.parse(stored);
      rawCheckIns = Array.isArray(parsed) ? parsed : Object.values(parsed);
    } catch {
      rawCheckIns = [];
    }
    const checkIns = rawCheckIns.filter((r: any) => isValidCheckInMatch(r, todayLocalString, selectedGrade, selectedStream));

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
        exportDateFilter: todayLocalString,
        exportedAt: new Date().toISOString(),
        appVersion: '2.0.0',
      },
      data: {
        attendance,
        marks,
        checkIns,
        munyaka_central_db: centralDb,
      },
    };
  };

  const handleGenerateSyncQR = () => {
    try {
      const payload = buildPayload();
      setQrPayloadString(JSON.stringify(payload));
      setShowQrModal(true);
      showSuccess('Teacher Sync QR Code generated successfully!');
    } catch (err: any) {
      showError(err?.message || 'Failed to generate QR code');
    }
  };

  const handleDownloadJsonFallback = () => {
    try {
      const jsonString = JSON.stringify(buildPayload(), null, 2);
      const staffNameSlug = (user?.name || 'teacher').replace(/\s+/g, '_').toLowerCase();
      const filename = `munyaka_teacher_sync_${staffNameSlug}_${todayLocalString}.json`;
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess(`Teacher sync package JSON for ${todayLocalString} downloaded successfully!`);
    } catch (err: any) {
      showError(err?.message || 'Failed to download JSON fallback.');
    }
  };

  const tooLargeForQr = qrPayloadString.length > QR_MAX_PAYLOAD_CHARS;

  return (
    <>
      <Button onClick={handleGenerateSyncQR} disabled={disabled} className={className}>
        <QrCode className="w-4 h-4 shrink-0" />
        <span>{label}</span>
      </Button>

      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 my-auto animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <Badge className="bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider text-[10px]">
                  Centre Code: {SCHOOL_CENTRE_CODE} (Date: {todayLocalString})
                </Badge>
                <h3 className="text-lg font-black text-slate-900 mt-1">Teacher Sync QR Code</h3>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 flex flex-col items-center">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-800 flex items-start gap-2 w-full text-left">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  Present this QR code to the Administrator for scanning via the{' '}
                  <strong>Admin Dashboard &gt; Scan Teacher Sync QR</strong> scanner.
                </span>
              </div>

              {tooLargeForQr ? (
                <div className="w-full p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-center">
                  <p className="font-bold">Dataset too large for a single QR code.</p>
                  <p className="mt-1">
                    Use the fallback download below to transfer the full sync package to the Admin
                    Harmonization Hub.
                  </p>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-slate-200 flex flex-col items-center justify-center">
                  <QRCodeSVG
                    value={qrPayloadString}
                    size={240}
                    level="M"
                    includeMargin={true}
                  />
                </div>
              )}

              {/* Compact summary of included records */}
              <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Dataset Summary ({todayLocalString})
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-100">
                    <span className="block font-black text-indigo-600">{attendanceCount}</span>
                    <span className="text-[10px] text-slate-500 font-medium">Attendance</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100">
                    <span className="block font-black text-purple-600">{marksCount}</span>
                    <span className="text-[10px] text-slate-500 font-medium">Marks</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100">
                    <span className="block font-black text-emerald-600">{checkInsCount}</span>
                    <span className="text-[10px] text-slate-500 font-medium">Check-Ins</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 pt-1 text-center">
                  Assigned Class:{' '}
                  <strong className="text-slate-800">
                    {selectedGrade} - {selectedStream}
                  </strong>
                </p>
              </div>

              {/* Fallback JSON download if dataset is too large for a single QR */}
              <div className="w-full pt-2 border-t border-slate-100 flex flex-col gap-2">
                <p className="text-[11px] text-slate-500 text-center">
                  Dataset too large for a single QR code or scanner offline?
                </p>
                <Button
                  onClick={handleDownloadJsonFallback}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .json Fallback Package</span>
                </Button>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(qrPayloadString);
                  showSuccess('Sync JSON payload copied to clipboard!');
                }}
                variant="outline"
                className="rounded-xl text-xs font-bold"
              >
                <Copy className="w-4 h-4 mr-2" /> Copy JSON Payload
              </Button>
              <Button
                onClick={() => setShowQrModal(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-5 py-2 rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeacherSyncQrGenerator;
