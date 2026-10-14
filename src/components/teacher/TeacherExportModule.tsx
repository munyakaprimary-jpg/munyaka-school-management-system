import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload, CheckCircle2, ShieldCheck, QrCode, RefreshCw, Loader2, ArrowRight, Share2, Copy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { readGradesAndStreams, getStreamsForGrade } from '@/services/gradesStreamsConfig';
import { ExportSuccessShareModal } from './ExportSuccessShareModal';
import { importMasterSyncPackage } from '@/utils/importMasterSyncPackage';
import { showSuccess, showError } from '@/utils/toast';
import { QRCodeSVG } from 'qrcode.react';

const SCHOOL_CENTRE_CODE = '26534178';

export const TeacherExportModule: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const config = useMemo(() => readGradesAndStreams(), []);
  const grades = config.grades;
  const streams = useMemo(() => config.streams, [config]);

  const [selectedGrade, setSelectedGrade] = useState<string>(() => grades[0] || 'Grade 1');
  const availableStreams = useMemo(() => {
    const s = getStreamsForGrade(selectedGrade, config);
    return s.length > 0 ? s : config.streams;
  }, [selectedGrade, config]);

  const [selectedStream, setSelectedStream] = useState<string>(() => availableStreams[0] || 'Green');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // QR Sync State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrPayloadString, setQrPayloadString] = useState('');
  const [qrChunks, setQrChunks] = useState<string[]>([]);
  const [activeChunkIndex, setActiveChunkIndex] = useState(0);
  const [isAnimatedQr, setIsAnimatedQr] = useState(false);

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
    const checkIns = JSON.parse(localStorage.getItem('munyaka_teacher_checkins') || '[]');

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
        checkIns
      }
    };
  };

  const handleGenerateSyncQR = () => {
    setIsExporting(true);
    try {
      const payload = buildPayload();
      const jsonString = JSON.stringify(payload);
      
      // If payload is large (> 2000 chars), split into chunks for animated/multi-part QR
      if (jsonString.length > 2000) {
        const chunkSize = 1800;
        const chunks: string[] = [];
        for (let i = 0; i < jsonString.length; i += chunkSize) {
          const chunkData = jsonString.slice(i, i + chunkSize);
          const chunkEnvelope = JSON.stringify({
            chunkIndex: chunks.length,
            totalChunks: Math.ceil(jsonString.length / chunkSize),
            centreCode: SCHOOL_CENTRE_CODE,
            data: chunkData
          });
          chunks.push(chunkEnvelope);
        }
        setQrChunks(chunks);
        setIsAnimatedQr(true);
      } else {
        setQrChunks([jsonString]);
        setIsAnimatedQr(false);
      }

      setQrPayloadString(jsonString);
      setActiveChunkIndex(0);
      setShowQrModal(true);
      showSuccess('Sync QR Code package generated successfully!');
    } catch (err: any) {
      showError(err?.message || 'Failed to generate QR code');
    } finally {
      setIsExporting(false);
    }
  };

  // Auto-advance chunks if multi-part animated QR
  useEffect(() => {
    if (!showQrModal || !isAnimatedQr || qrChunks.length <= 1) return;
    const interval = setInterval(() => {
      setActiveChunkIndex((prev) => (prev + 1) % qrChunks.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [showQrModal, isAnimatedQr, qrChunks.length]);

  return (
    <>
      <Card className="rounded-3xl border-slate-200 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 shadow-sm overflow-hidden font-sans">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 font-bold uppercase tracking-wider text-[10px]">
              Offline QR-Code Batch Sync (Centre: {SCHOOL_CENTRE_CODE})
            </Badge>
            <ShieldCheck size={18} className="text-indigo-600" />
          </div>
          <CardTitle className="text-xl font-black text-slate-900 mt-2">
            Teacher Offline QR Sync & File Export
          </CardTitle>
          <CardDescription className="text-xs text-slate-600">
            Generate offline QR code batches for instant camera scanning by the Admin Hub, or export package files.
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

          {/* Action Buttons: Generate Sync QR Code & File Export */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <Button
              onClick={handleGenerateSyncQR}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all active:scale-95"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <QrCode className="w-4 h-4 shrink-0" />}
              <span>{isExporting ? 'Generating QR...' : 'Generate Sync QR Code'}</span>
            </Button>

            <Button
              onClick={() => {
                const payload = buildPayload();
                const jsonString = JSON.stringify(payload, null, 2);
                const filename = `class_package_${selectedGrade.replace(/\s+/g, '_')}_${selectedStream}_${Date.now()}.json`;
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
                showSuccess('Class package downloaded successfully!');
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4 shrink-0 text-indigo-600" />
              <span>Export Package File</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Modal for Teacher Export */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <Badge className="bg-indigo-100 text-indigo-800 font-bold uppercase tracking-wider text-[10px]">
                  Centre: {SCHOOL_CENTRE_CODE}
                </Badge>
                <h3 className="text-lg font-black text-slate-900 mt-1">Teacher Sync QR Code</h3>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 inline-block">
                <QRCodeSVG
                  value={qrChunks[activeChunkIndex] || qrPayloadString}
                  size={240}
                  level="M"
                  includeMargin={true}
                />
              </div>

              {isAnimatedQr && qrChunks.length > 1 && (
                <div className="text-center space-y-1">
                  <Badge className="bg-purple-100 text-purple-800 font-mono text-xs">
                    Multi-Part Animated QR: Part {activeChunkIndex + 1} of {qrChunks.length}
                  </Badge>
                  <p className="text-[11px] text-slate-500">
                    Displaying rotating parts for high-volume attendance & marks payload. Admin scanner will automatically assemble.
                  </p>
                </div>
              )}

              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-slate-800">{selectedGrade} - {selectedStream}</p>
                <p className="text-[11px] text-slate-500">
                  {attendanceCount} Roll Call records, {marksCount} Assessment marks queued.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(qrPayloadString);
                  showSuccess('Sync JSON payload copied to clipboard!');
                }}
                variant="outline"
                className="flex-1 rounded-xl text-xs font-bold"
              >
                <Copy className="w-4 h-4 mr-2" /> Copy JSON Payload
              </Button>
              <Button
                onClick={() => setShowQrModal(false)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeacherExportModule;
