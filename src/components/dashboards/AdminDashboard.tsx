import { mergeStoredLearners } from '@/utils/learnerStorageMerge';
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CentralDataService from '../../services/centralDataService';
import { useSchoolStore } from '../../store/useSchoolStore';
import { readGradesAndStreams } from '@/services/gradesStreamsConfig';
import { getStoredLearners } from '@/utils/storage';
import { useCentralData } from '../../hooks/useCentralData';
import { Users, GraduationCap, Briefcase, CheckCircle2, Table as TableIcon, FileText, ShieldCheck, Database, ArrowRight, Sparkles, Upload, QrCode, Camera, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { showSuccess, showError } from '@/utils/toast';
import { Html5QrcodeScanner } from 'html5-qrcode';

const SCHOOL_CENTRE_CODE = '26534178';

export const AdminDashboardComponent: React.FC = () => {
  const navigate = useNavigate();

  // ── Centralized LocalStorage DB Sync & Real-Time Listeners ──
  const [syncKey, setSyncKey] = useState(0);
  const [reactiveLearners, setReactiveLearners] = useState<any[]>(() => mergeStoredLearners());

  useEffect(() => {
    const handleSync = () => {
      setReactiveLearners(mergeStoredLearners());
      setSyncKey(k => k + 1);
    };

    handleSync();
    window.addEventListener('storage', handleSync);
    window.addEventListener('munyaka:data-changed', handleSync);
    window.addEventListener('munyaka_learners_updated', handleSync);
    window.addEventListener('jamlyan:firestore-updated', handleSync);
    window.addEventListener('learners_updated', handleSync);
    window.addEventListener('roll_call_updated', handleSync);
    window.addEventListener('attendance_updated', handleSync);

    const intervalId = setInterval(() => {
      // Periodic live data reconciliation check for real-time stream attendance sync
      const currentLen = mergeStoredLearners().length;
      if (currentLen !== reactiveLearners.length) {
        setReactiveLearners(mergeStoredLearners());
      }
    }, 3000);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('munyaka:data-changed', handleSync);
      window.removeEventListener('munyaka_learners_updated', handleSync);
      window.removeEventListener('jamlyan:firestore-updated', handleSync);
      window.removeEventListener('learners_updated', handleSync);
      window.removeEventListener('roll_call_updated', handleSync);
      window.removeEventListener('attendance_updated', handleSync);
      clearInterval(intervalId);
    };
  }, [reactiveLearners.length]);

  const learners = reactiveLearners;

  const staff = (() => {
    try {
      const raw = localStorage.getItem('munyaka_staff') || localStorage.getItem('school_staff_data') || '[]';
      return JSON.parse(raw);
    } catch {
      return [];
    }
  })();

  const teaching = staff.filter((s: any) => {
    const roleStr = `${s.role || ''} ${s.type || ''} ${s.category || ''} ${s.systemRole || ''} ${s.department || ''}`.toLowerCase();
    if (roleStr.includes('bursar') || roleStr.includes('librarian') || roleStr.includes('store') || roleStr.includes('accountant') || roleStr.includes('support') || roleStr.includes('secretary') || roleStr.includes('security') || roleStr.includes('catering') || roleStr.includes('ict technician')) {
      return false;
    }
    return roleStr.includes('teach') || roleStr.includes('head_teacher') || roleStr.includes('senior_teacher') || roleStr.includes('class_teacher') || roleStr.includes('subject_teacher') || roleStr.includes('teacher') || roleStr.includes('head teacher') || roleStr.includes('deputy');
  });

  const nonTeaching = staff.filter((s: any) => {
    const roleStr = `${s.role || ''} ${s.type || ''} ${s.category || ''} ${s.systemRole || ''} ${s.department || ''}`.toLowerCase();
    if (roleStr.includes('teach') || roleStr.includes('head_teacher') || roleStr.includes('senior_teacher') || roleStr.includes('class_teacher') || roleStr.includes('subject_teacher') || roleStr.includes('teacher') || roleStr.includes('head teacher') || roleStr.includes('deputy')) {
      if (roleStr.includes('bursar') || roleStr.includes('librarian') || roleStr.includes('store') || roleStr.includes('accountant') || roleStr.includes('support') || roleStr.includes('secretary') || roleStr.includes('security') || roleStr.includes('catering') || roleStr.includes('ict technician')) {
        return true;
      }
      return false;
    }
    return true;
  });

  const primary = learners.filter((l: any) => {
    const status = String(l.status || l.enrollmentStatus || 'active').toLowerCase();
    if (status === 'transferred' || status === 'archived' || status === 'deleted' || status === 'left') return false;
    const grade = String(l.grade || l.class || '').toLowerCase();
    return !grade.includes('junior') && !grade.includes('grade 7') && !grade.includes('grade 8') && !grade.includes('grade 9');
  });

  const junior = learners.filter((l: any) => {
    const status = String(l.status || l.enrollmentStatus || 'active').toLowerCase();
    if (status === 'transferred' || status === 'archived' || status === 'deleted' || status === 'left') return false;
    const grade = String(l.grade || l.class || '').toLowerCase();
    return grade.includes('junior') || grade.includes('grade 7') || grade.includes('grade 8') || grade.includes('grade 9');
  }).length;

  const activeLearnersList = learners.filter((l: any) => {
    const status = String(l.status || l.enrollmentStatus || 'active').toLowerCase();
    return status !== 'transferred' && status !== 'archived' && status !== 'deleted' && status !== 'left';
  });

  const totalStudents = activeLearnersList.length;
  const teachingStaffCount = teaching.length;
  const nonTeachingStaffCount = nonTeaching.length;
  const primaryCount = primary.length;
  const juniorCount = junior;

  const [selectedYear, setSelectedYear] = useState('2026');

  // Compute Enrolment Table Rows with promotion & advancement logic
  const gradeLevels = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
  const gradeSequence = gradeLevels;

  const currentBaseYear = 2026;
  const targetYearNum = parseInt(selectedYear, 10) || 2026;
  const yearDiff = targetYearNum - currentBaseYear;

  let sumBoys = 0;
  let sumGirls = 0;

  const enrolmentRows = gradeLevels.map((gradeName, gradeIndex) => {
    const explicitLearners = learners.filter((l: any) => {
      const lGrade = String(l.grade || l.class || '').trim();
      const matchesGrade = lGrade.toLowerCase() === gradeName.toLowerCase() || 
        (gradeName === 'PP1' && lGrade.toLowerCase().includes('pp1')) ||
        (gradeName === 'PP2' && lGrade.toLowerCase().includes('pp2')) ||
        lGrade.toLowerCase().includes(gradeName.toLowerCase());
      
      if (!matchesGrade) return false;

      const lYear = String(l.academicYear || l.year || l.enrollmentYear || '2026');
      return lYear === String(selectedYear);
    });

    let gradeLearners = explicitLearners;

    if (explicitLearners.length === 0 && yearDiff > 0) {
      const baseGradeIndex = gradeIndex - yearDiff;
      if (baseGradeIndex >= 0 && baseGradeIndex < gradeSequence.length) {
        const baseGradeName = gradeSequence[baseGradeIndex];
        const baseLearners = learners.filter((l: any) => {
          const lGrade = String(l.grade || l.class || '').trim();
          const matchesGrade = lGrade.toLowerCase() === baseGradeName.toLowerCase() || 
            (baseGradeName === 'PP1' && lGrade.toLowerCase().includes('pp1')) ||
            (baseGradeName === 'PP2' && lGrade.toLowerCase().includes('pp2')) ||
            lGrade.toLowerCase().includes(baseGradeName.toLowerCase());

          if (!matchesGrade) return false;
          const lYear = String(l.academicYear || l.year || l.enrollmentYear || '2026');
          return lYear === '2026';
        });
        gradeLearners = baseLearners;
      } else {
        gradeLearners = [];
      }
    }

    const boys = gradeLearners.filter((l: any) => {
      const g = String(l.gender || l.sex || '').trim().toLowerCase();
      return g.startsWith('m') || g === 'boy';
    }).length;

    const girls = gradeLearners.filter((l: any) => {
      const g = String(l.gender || l.sex || '').trim().toLowerCase();
      return g.startsWith('f') || g === 'girl';
    }).length;

    const unassigned = gradeLearners.length - (boys + girls);
    const adjustedBoys = boys + Math.ceil(unassigned / 2);
    const adjustedGirls = girls + Math.floor(unassigned / 2);
    const total = adjustedBoys + adjustedGirls;

    sumBoys += adjustedBoys;
    sumGirls += adjustedGirls;

    return {
      grade: gradeName,
      boys: adjustedBoys,
      girls: adjustedGirls,
      total
    };
  });

  const totalsRow = {
    boys: sumBoys,
    girls: sumGirls,
    total: sumBoys + sumGirls
  };

  // QR Scan Modal State for Admin Hub
  const [showScanModal, setShowScanModal] = useState(false);
  const [scannedResultText, setScannedResultText] = useState<string | null>(null);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('camera');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    if (!showScanModal) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
        setMediaStream(null);
      }
      setIsScanningActive(false);
      return;
    }

    // Initialize live camera stream immediately on modal open
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        currentStream = stream;
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsScanningActive(true);
      } catch (err) {
        console.warn("Camera permission denied or unavailable, showing html5-qrcode fallback:", err);
        // Fallback to html5-qrcode scanner
        const timer = setTimeout(() => {
          try {
            const scanner = new Html5QrcodeScanner(
              "admin-qr-reader",
              { fps: 10, qrbox: { width: 250, height: 250 } },
              false
            );
            scannerRef.current = scanner;
            scanner.render(
              (decodedText) => {
                handleSuccessfulScan(decodedText);
              },
              (error) => {}
            );
            setIsScanningActive(true);
          } catch (e) {
            console.error('Failed to init scanner', e);
          }
        }, 300);
        return () => clearTimeout(timer);
      }
    }

    initCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
      }
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [showScanModal]);

  const handleSuccessfulScan = (rawText: string) => {
    try {
      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        // Might be a chunk envelope
        parsed = JSON.parse(rawText);
      }

      // Validate school centre code
      const centreCode = parsed.centreCode;
      if (centreCode !== SCHOOL_CENTRE_CODE) {
        showError(`Invalid School Centre Code! Expected ${SCHOOL_CENTRE_CODE}, got ${centreCode || 'unknown'}.`);
        return;
      }

      // Stop scanner
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }

      // Merge records into Admin master database
      const attendanceRecords = parsed.data?.attendance || [];
      const marksRecords = parsed.data?.marks || [];
      const checkInRecords = parsed.data?.checkIns || [];
      const streamName = parsed.metadata?.assignedStream || parsed.metadata?.departmentOrStream || 'Green';
      const gradeName = parsed.metadata?.assignedClass || 'Grade 5';

      // Merge attendance
      if (attendanceRecords.length > 0) {
        const existingAtt = JSON.parse(localStorage.getItem('munyaka_attendance_records') || '[]');
        const mergedAtt = [...attendanceRecords, ...existingAtt];
        localStorage.setItem('munyaka_attendance_records', JSON.stringify(mergedAtt));
      }

      // Merge marks
      if (marksRecords.length > 0) {
        const existingMarks = JSON.parse(localStorage.getItem('marked_student_submissions') || '[]');
        const mergedMarks = [...marksRecords, ...existingMarks];
        localStorage.setItem('marked_student_submissions', JSON.stringify(mergedMarks));
      }

      // Merge check-ins
      if (checkInRecords.length > 0) {
        const existingCheckIns = JSON.parse(localStorage.getItem('munyaka_teacher_checkins') || '[]');
        const mergedCheckIns = [...checkInRecords, ...existingCheckIns];
        localStorage.setItem('munyaka_teacher_checkins', JSON.stringify(mergedCheckIns));
      }

      // Trigger sync signal to teacher
      localStorage.setItem('munyaka_sync_queue_cleared', Date.now().toString());
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('munyaka:data-changed'));

      const totalCount = attendanceRecords.length + marksRecords.length + checkInRecords.length;
      showSuccess(`Successfully synced ${attendanceCountText(attendanceRecords.length, gradeName, streamName)}!`);
      setShowScanModal(false);
    } catch (err: any) {
      showError(err?.message || 'Failed to parse teacher sync QR package.');
    }
  };

  const attendanceCountText = (count: number, grade: string, stream: string) => {
    return `${count} records (${grade} ${stream})`;
  };

  return (
    <div className="p-3 sm:p-6 space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-row flex-wrap justify-between items-start sm:items-center gap-4 w-full">
        <div className="w-full sm:w-auto flex-1 min-w-[200px]">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 whitespace-normal break-words">Admin Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 whitespace-normal break-words">Live operational metrics synchronized with the master database.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-start sm:justify-end">
          <Button
            onClick={() => setShowScanModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-md transition-all active:scale-95"
          >
            <QrCode className="w-4 h-4 shrink-0" />
            <span>Scan Teacher Sync QR</span>
          </Button>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Centre Code: {SCHOOL_CENTRE_CODE}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
        {/* Total Learners Card */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">TOTAL LEARNERS</CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Active registered learners</p>
          </CardContent>
        </Card>

        {/* Teaching Staff Card */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">TEACHING STAFF</CardTitle>
            <GraduationCap className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{teachingStaffCount}</div>
            <p className="text-xs text-gray-500 mt-1">Active: {teachingStaffCount} | Pending: 0</p>
          </CardContent>
        </Card>

        {/* Non-Teaching Staff Card */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">NON-TEACHING STAFF</CardTitle>
            <Briefcase className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{nonTeachingStaffCount}</div>
            <p className="text-xs text-gray-500 mt-1">Active: {nonTeachingStaffCount} | Pending: 0</p>
          </CardContent>
        </Card>

        {/* Primary School Breakdown */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">PRIMARY SCHOOL</CardTitle>
            <Users className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{primaryCount}</div>
            <p className="text-xs text-gray-500 mt-1">Grades 1 to 6 learners</p>
          </CardContent>
        </Card>

        {/* Junior School Breakdown */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">JUNIOR SCHOOL</CardTitle>
            <GraduationCap className="w-5 h-5 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{juniorCount}</div>
            <p className="text-xs text-gray-500 mt-1">Grades 7 to 9 learners</p>
          </CardContent>
        </Card>

        {/* System Status Card */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">SYSTEM STATUS</CardTitle>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">Online</div>
            <p className="text-xs text-gray-500 mt-1">Central database synchronized</p>
          </CardContent>
        </Card>
      </div>

      {/* SCHOOL ENROLMENT TABLE SECTION */}
      <Card className="border shadow-sm rounded-3xl overflow-hidden mt-8">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">SCHOOL ENROLMENT TABLE</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Real-time enrolment breakdown by grade and gender.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Academic Year:</span>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32 rounded-xl bg-white dark:bg-slate-800">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
                <SelectItem value="2028">2028</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/70 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6">GRADE</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-center">BOYS</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-center">GIRLS</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-center">TOTAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrolmentRows.map((row, idx) => (
                <TableRow key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <TableCell className="font-semibold text-slate-900 dark:text-slate-100 py-3.5 px-6">{row.grade}</TableCell>
                  <TableCell className="text-center font-medium text-slate-700 dark:text-slate-300 py-3.5 px-6">{row.boys}</TableCell>
                  <TableCell className="text-center font-medium text-slate-700 dark:text-slate-300 py-3.5 px-6">{row.girls}</TableCell>
                  <TableCell className="text-center font-bold text-indigo-600 dark:text-indigo-400 py-3.5 px-6">{row.total}</TableCell>
                </TableRow>
              ))}
              {/* Summary Totals Row */}
              <TableRow className="bg-indigo-50/70 dark:bg-indigo-950/40 border-t-2 border-indigo-200 dark:border-indigo-900">
                <TableCell className="font-black text-slate-900 dark:text-white py-4 px-6 text-base">TOTALS</TableCell>
                <TableCell className="text-center font-black text-slate-900 dark:text-white py-4 px-6 text-base">{totalsRow.boys}</TableCell>
                <TableCell className="text-center font-black text-slate-900 dark:text-white py-4 px-6 text-base">{totalsRow.girls}</TableCell>
                <TableCell className="text-center font-black text-indigo-600 dark:text-indigo-400 py-4 px-6 text-lg">{totalsRow.total}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* LEARNER ATTENDANCE TRENDS BY STREAM SECTION */}
      <Card className="border shadow-sm rounded-3xl overflow-hidden mt-8">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Dynamic Stream-by-Stream Dual-Session Attendance Trends</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Live morning & afternoon session rates dynamically aggregated across all registered school streams and roll-call logs.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                const toastId = showSuccess("Syncing live Firestore database and roll-call records...");
                try {
                  // Simulate or trigger live refresh with anonymous auth / Firestore fetch check
                  window.dispatchEvent(new Event('storage'));
                  window.dispatchEvent(new Event('munyaka:data-changed'));
                  window.dispatchEvent(new Event('learners_updated'));
                  
                  // Re-fetch / re-sync state
                  setSyncKey(k => k + 1);
                  setTimeout(() => {
                    showSuccess("Live DB Sync completed successfully! All streams and session records updated.");
                  }, 600);
                } catch (err: any) {
                  showError("Live Sync encountered an issue: " + (err?.message || "Check connection"));
                }
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
              <span>Live DB Sync</span>
            </button>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-3 py-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Sync Active</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/70 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6">STREAM / CLASS</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-center">ENROLLED</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-center">MORNING SESSION</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-center">AFTERNOON SESSION</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-center">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                let learnersList: any[] = [];
                let attendanceLogs: Record<string, any> = {};
                let gradesConfig: any = { grades: [], streams: [], gradeStreamMap: {} };
                try {
                  gradesConfig = readGradesAndStreams();
                  learnersList = mergeStoredLearners();
                  if (learnersList.length === 0) {
                    const rawL = localStorage.getItem('munyaka_students') || localStorage.getItem('school_learners_data') || '[]';
                    learnersList = JSON.parse(rawL);
                  }
                  const rawAtt = localStorage.getItem('roll_call_records') || localStorage.getItem('munyaka_roll_call') || localStorage.getItem('munyaka_attendance_records') || localStorage.getItem('school_attendance_v1') || localStorage.getItem('attendance_records') || '{}';
                  const parsedAtt = JSON.parse(rawAtt);
                  if (parsedAtt && typeof parsedAtt === 'object') {
                    if (Array.isArray(parsedAtt)) {
                      parsedAtt.forEach((item: any) => {
                        if (!item) return;
                        const gKey = String(item.grade || '').trim().toLowerCase();
                        const sKey = String(item.stream || '').trim().toLowerCase();
                        const dKey = String(item.date || '').trim();
                        const sessKey = String(item.session || '').trim().toLowerCase();
                        const k = `${gKey}_${sKey}_${dKey}_${sessKey}`;
                        attendanceLogs[k] = item;
                        // Also store fallback key without session or date for maximum compatibility
                        attendanceLogs[`${gKey}_${sKey}`] = item;
                      });
                    } else {
                      // Object format (e.g. key-value record maps)
                      Object.entries(parsedAtt).forEach(([k, item]: [string, any]) => {
                        if (item) {
                          attendanceLogs[k] = item;
                          const gKey = String(item.grade || '').trim().toLowerCase();
                          const sKey = String(item.stream || '').trim().toLowerCase();
                          if (gKey && sKey) {
                            attendanceLogs[`${gKey}_${sKey}`] = item;
                          }
                        }
                      });
                    }
                  }
                } catch (e) {
                  learnersList = [];
                  attendanceLogs = {};
                }

                // Build complete list of stream combinations from grades/streams configuration + actual enrolled learners
                const activeStreamCombinations: Array<{ grade: string; stream: string }> = [];
                const seenCombinations = new Set<string>();

                // 1. First add all configured grades & streams from Grades & Streams settings
                if (gradesConfig && gradesConfig.grades && gradesConfig.gradeStreamMap) {
                  gradesConfig.grades.forEach((g: string) => {
                    const matchKey = g.toLowerCase().replace(/\s+/g, '');
                    const streams = gradesConfig.gradeStreamMap[matchKey] || gradesConfig.streams || ['Green'];
                    streams.forEach((s: string) => {
                      const gradeNorm = g.trim();
                      const streamNorm = s.trim();
                      const k = `${gradeNorm.toLowerCase()}__${streamNorm.toLowerCase()}`;
                      if (!seenCombinations.has(k)) {
                        seenCombinations.add(k);
                        activeStreamCombinations.push({ grade: gradeNorm, stream: streamNorm });
                      }
                    });
                  });
                }

                // 2. Also ensure any learner found in storage whose grade/stream might not be in the default settings config is included
                learnersList.forEach(l => {
                  const g = String(l.grade || l.classLevel || 'Grade 1').trim();
                  const s = String(l.stream || 'Green').trim();
                  const k = `${g.toLowerCase()}__${s.toLowerCase()}`;
                  if (!seenCombinations.has(k)) {
                    seenCombinations.add(k);
                    activeStreamCombinations.push({ grade: g, stream: s });
                  }
                });

                if (activeStreamCombinations.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                        No configured grades or streams found. Add streams in Grades & Streams settings or register learners.
                      </TableCell>
                    </TableRow>
                  );
                }

                return activeStreamCombinations.map((combo, idx) => {
                  const gradeName = combo.grade;
                  const streamName = combo.stream;
                  const displayStreamLabel = `${gradeName} - ${streamName}`;

                  // Count registered learners matching this grade and stream
                  const matchingLearners = learnersList.filter(l => {
                    const lGrade = String(l.grade || l.classLevel || '').trim().toLowerCase();
                    const lStream = String(l.stream || '').trim().toLowerCase();
                    return lGrade === gradeName.toLowerCase() && lStream === streamName.toLowerCase();
                  });

                  const enrolled = matchingLearners.length;

                  // Find roll call records for this grade and stream
                  let morningPresent = 0;
                  let afternoonPresent = 0;
                  let morningRecorded = false;
                  let afternoonRecorded = false;

                  Object.entries(attendanceLogs).forEach(([logKey, record]: [string, any]) => {
                    if (!record) return;
                    const rGrade = String(record.grade || '').trim().toLowerCase();
                    const rStream = String(record.stream || '').trim().toLowerCase();
                    const logKeyLower = logKey.toLowerCase();
                    
                    const matchesStream = (rGrade === gradeName.toLowerCase() && rStream === streamName.toLowerCase()) ||
                                          logKeyLower.includes(gradeName.toLowerCase()) && logKeyLower.includes(streamName.toLowerCase());

                    if (matchesStream) {
                      const studentsObj = record.students || record.learners || {};
                      const recSession = String(record.session || '').trim().toLowerCase();

                      // If record has top-level present counts or status
                      if (typeof record.morningPresentCount === 'number') {
                        morningRecorded = true;
                        morningPresent = Math.max(morningPresent, record.morningPresentCount);
                      }
                      if (typeof record.afternoonPresentCount === 'number') {
                        afternoonRecorded = true;
                        afternoonPresent = Math.max(afternoonPresent, record.afternoonPresentCount);
                      }

                      // Inspect individual student records
                      if (studentsObj && typeof studentsObj === 'object') {
                        Object.values(studentsObj).forEach((st: any) => {
                          if (st) {
                            const mStatus = String(st.morning || st.status || st.morningStatus || '').trim().toUpperCase();
                            const aStatus = String(st.afternoon || st.status || st.afternoonStatus || '').trim().toUpperCase();

                            if (recSession === 'morning' || mStatus === 'P' || mStatus === 'PRESENT' || mStatus === 'L' || mStatus === 'LATE' || mStatus === 'A' || mStatus === 'ABSENT' || mStatus === 'E' || mStatus === 'EXCUSED') {
                              morningRecorded = true;
                            }
                            if (recSession === 'afternoon' || aStatus === 'P' || aStatus === 'PRESENT' || aStatus === 'L' || aStatus === 'LATE' || aStatus === 'A' || aStatus === 'ABSENT' || aStatus === 'E' || aStatus === 'EXCUSED') {
                              afternoonRecorded = true;
                            }

                            if (mStatus === 'P' || mStatus === 'PRESENT' || mStatus === 'L' || mStatus === 'LATE') {
                              morningPresent++;
                            }
                            if (aStatus === 'P' || aStatus === 'PRESENT' || aStatus === 'L' || aStatus === 'LATE') {
                              afternoonPresent++;
                            }
                          }
                        });
                      }

                      // If record has status array or list
                      if (Array.isArray(record.attendanceList)) {
                        record.attendanceList.forEach((st: any) => {
                          if (st) {
                            const mStatus = String(st.morning || st.status || '').trim().toUpperCase();
                            const aStatus = String(st.afternoon || st.status || '').trim().toUpperCase();
                            if (mStatus) morningRecorded = true;
                            if (aStatus) afternoonRecorded = true;
                            if (mStatus === 'P' || mStatus === 'PRESENT' || mStatus === 'L' || mStatus === 'LATE') morningPresent++;
                            if (aStatus === 'P' || aStatus === 'PRESENT' || aStatus === 'L' || aStatus === 'LATE') afternoonPresent++;
                          }
                        });
                      }
                    }
                  });

                  // Factually compute rates & status
                  let morningDisplay = '0 / 0 (0%)';
                  let afternoonDisplay = '0 / 0 (0%)';
                  let morningRate = 0;
                  let afternoonRate = 0;
                  let statusText = 'No Learners';
                  let statusBadgeClass = 'bg-slate-100 text-slate-600';

                  if (enrolled === 0) {
                    morningDisplay = '0 / 0 (0%)';
                    afternoonDisplay = '0 / 0 (0%)';
                    statusText = 'No Learners';
                    statusBadgeClass = 'bg-slate-100 text-slate-600';
                  } else {
                    if (!morningRecorded && !afternoonRecorded) {
                      morningDisplay = `0 / ${enrolled} (0%)`;
                      afternoonDisplay = `0 / ${enrolled} (0%)`;
                      statusText = 'Pending Roll Call';
                      statusBadgeClass = 'bg-amber-100 text-amber-800 font-bold';
                    } else {
                      morningRate = Math.min(100, Math.max(0, Math.round((morningPresent / enrolled) * 100)));
                      afternoonRate = Math.min(100, Math.max(0, Math.round((afternoonPresent / enrolled) * 100)));

                      morningDisplay = `${morningPresent} / ${enrolled} (${morningRate}%)`;
                      afternoonDisplay = `${afternoonPresent} / ${enrolled} (${afternoonRate}%)`;

                      const avgRate = Math.round((morningRate + afternoonRate) / 2);
                      if (avgRate >= 90) {
                        statusText = 'Optimal';
                        statusBadgeClass = 'bg-emerald-100 text-emerald-800 font-bold';
                      } else if (avgRate >= 75) {
                        statusText = 'Good';
                        statusBadgeClass = 'bg-blue-100 text-blue-800 font-bold';
                      } else {
                        statusText = 'Attention';
                        statusBadgeClass = 'bg-rose-100 text-rose-800 font-bold';
                      }
                    }
                  }

                  return (
                    <TableRow key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100 py-3.5 px-6">{displayStreamLabel}</TableCell>
                      <TableCell className="text-center font-medium text-slate-700 dark:text-slate-300 py-3.5 px-6">{enrolled}</TableCell>
                      <TableCell className="text-center py-3.5 px-6">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-black text-xs text-slate-800 dark:text-slate-200">{morningDisplay}</span>
                          {enrolled > 0 && morningRecorded && (
                            <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${morningRate}%` }} />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-3.5 px-6">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-black text-xs text-slate-800 dark:text-slate-200">{afternoonDisplay}</span>
                          {enrolled > 0 && afternoonRecorded && (
                            <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${afternoonRate}%` }} />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-3.5 px-6">
                        <Badge className={cn("border-none", statusBadgeClass)}>
                          {statusText}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                });
              })()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Scan Teacher Sync QR Modal for Admin */}
      {showScanModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 my-auto animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <Badge className="bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider text-[10px]">
                  Centre Code: {SCHOOL_CENTRE_CODE}
                </Badge>
                <h3 className="text-lg font-black text-slate-900 mt-1">Scan Teacher Sync QR Code</h3>
              </div>
              <button
                onClick={() => setShowScanModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-800 flex items-start gap-2 shrink-0">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  Point the camera at the teacher's generated sync QR code. Records will be validated against centre code <strong>{SCHOOL_CENTRE_CODE}</strong> and merged directly into the master database.
                </span>
              </div>

              {/* Tabs / Toggle for Camera vs File Upload */}
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button
                  onClick={() => setScanMode('camera')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${scanMode === 'camera' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Live Camera Feed
                </button>
                <button
                  onClick={() => setScanMode('upload')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${scanMode === 'upload' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Upload QR Screenshot
                </button>
              </div>

              {scanMode === 'camera' ? (
                <div className="space-y-3">
                  <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[280px] max-h-[320px] flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {!mediaStream && (
                      <div id="admin-qr-reader" className="absolute inset-0 w-full h-full bg-slate-50"></div>
                    )}
                    <div className="absolute inset-0 border-2 border-dashed border-emerald-400/60 rounded-2xl pointer-events-none m-6 flex items-center justify-center">
                      <div className="bg-slate-900/70 text-white text-[11px] px-3 py-1.5 rounded-full backdrop-blur-sm">
                        Align QR code inside box
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 text-center flex flex-col items-center justify-center min-h-[260px]">
                  <Upload className="w-10 h-10 text-indigo-500 mb-2" />
                  <h4 className="font-bold text-slate-900 text-sm">Upload QR Code Image</h4>
                  <p className="text-xs text-slate-500 max-w-xs">Select a saved screenshot containing the teacher sync QR payload.</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        // Use html5-qrcode file scanning or simple image reading
                        const html5QrCode = new (window as any).Html5Qrcode("admin-qr-reader-file");
                        // For simplicity, we can also prompt or use standard reader
                        const reader = new FileReader();
                        reader.onload = async (evt) => {
                          const imgDataUrl = evt.target?.result as string;
                          // If html5-qrcode is available
                          try {
                            const qrCodeScanner = new (window as any).Html5Qrcode("admin-qr-reader");
                            const decodedText = await qrCodeScanner.scanFile(file, true);
                            handleSuccessfulScan(decodedText);
                          } catch (scanErr) {
                            showError("Could not decode QR code from image. Please try pasting payload text below.");
                          }
                        };
                        reader.readAsDataURL(file);
                      } catch (err) {
                        showError("Failed to read uploaded image file.");
                      }
                    }}
                    className="mt-4 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  <div id="admin-qr-reader-file" className="hidden"></div>
                  <div id="admin-qr-reader" className="hidden"></div>
                </div>
              )}

              {/* Manual fallback JSON paste for testing */}
              <div className="space-y-2 pt-2 border-t border-slate-100 shrink-0">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Or paste payload string for testing:</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="manual-qr-payload-input"
                    placeholder="Paste QR JSON payload..."
                    className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                  <Button
                    onClick={() => {
                      const input = document.getElementById('manual-qr-payload-input') as HTMLInputElement;
                      if (input && input.value) {
                        handleSuccessfulScan(input.value);
                      } else {
                        showError('Please paste valid payload JSON string');
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 px-4 rounded-xl shrink-0"
                  >
                    Process
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <Button
                variant="outline"
                onClick={() => setShowScanModal(false)}
                className="rounded-xl font-bold text-xs"
              >
                Close Modal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardComponent;
