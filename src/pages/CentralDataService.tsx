import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSchoolStore } from '@/store/useSchoolStore';
import { showSuccess, showError } from '@/utils/toast';
import { Download, Upload, Database, RefreshCw, Layers, ShieldCheck, Users, GraduationCap, DollarSign, CalendarCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { initialSeedData } from '@/data/initialSeedData';
import { CentralDataService } from '@/services/centralDataService';

export default function CentralDataServicePage() {
  const { learners, staff, fees, attendance, exams, marks, timetable, settings, refreshStore } = useSchoolStore();

  const [stats, setStats] = useState({
    registeredStudents: 0,
    teachingStaff: 0,
    nonTeachingStaff: 0,
    attendanceRecords: 0,
    feeRecords: 0,
    examsCount: 0,
    marksCount: 0,
    timetableCount: 0,
    libraryCount: 0,
    noticesCount: 0,
    ictAssetsCount: 0,
    settingsConfigured: 0,
  });

  const [snapshotJson, setSnapshotJson] = useState('');
  const [restoreJson, setRestoreJson] = useState('');
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const refreshStats = () => {
    try {
      refreshStore();
      
      const library = JSON.parse(localStorage.getItem('munyaka_library_books') || '[]');
      const notices = JSON.parse(localStorage.getItem('munyaka_notices') || '[]');
      const ictAssets = JSON.parse(localStorage.getItem('munyaka_ict_assets') || '[]');

      // Get highest count staff array across all storage keys
      const s1 = JSON.parse(localStorage.getItem('munyaka_staff') || '[]');
      const s2 = JSON.parse(localStorage.getItem('munyaka_staff_directory') || '[]');
      const s3 = JSON.parse(localStorage.getItem('munyaka_master_staff_list') || '[]');
      const s4 = JSON.parse(localStorage.getItem('staff') || '[]');
      const candidates = [staff, s1, s2, s3, s4].filter(Array.isArray);
      const masterStaff = candidates.reduce((max, curr) => (curr.length > max.length ? curr : max), staff);

      // Learners count sync
      const l1 = JSON.parse(localStorage.getItem('munyaka_students') || '[]');
      const l2 = JSON.parse(localStorage.getItem('school_learners_data') || '[]');
      const masterLearners = [learners, l1, l2].filter(Array.isArray).reduce((max, curr) => (curr.length > max.length ? curr : max), learners);

      // Check teaching vs non-teaching staff
      const teachingStaff = masterStaff.filter((s: any) => {
        const cat = String(s.staffCategory || s.category || s.type || '').toUpperCase();
        const role = String(s.role || s.systemRole || '').toLowerCase();
        if (cat.includes('NON') || role.includes('support') || role.includes('bursar') || role.includes('accountant') || role.includes('librarian') || role.includes('ict') || role.includes('store') || role.includes('driver')) {
          return false;
        }
        return true;
      }).length;

      const nonTeachingStaff = Math.max(0, masterStaff.length - teachingStaff);

      const attendanceCount = Array.isArray(attendance)
        ? attendance.length
        : Object.keys(attendance || {}).length;

      const feeCount = Array.isArray(fees) ? fees.length : Object.keys(fees || {}).length;
      const marksCount = Array.isArray(marks) ? marks.length : Object.keys(marks || {}).length;

      setStats({
        registeredStudents: masterLearners.length,
        teachingStaff: masterStaff.length,
        nonTeachingStaff,
        attendanceRecords: attendanceCount,
        feeRecords: feeCount,
        examsCount: Array.isArray(exams) ? exams.length : 0,
        marksCount,
        timetableCount: Array.isArray(timetable) ? timetable.length : Object.keys(timetable || {}).length,
        libraryCount: Array.isArray(library) ? library.length : 0,
        noticesCount: Array.isArray(notices) ? notices.length : 0,
        ictAssetsCount: Array.isArray(ictAssets) ? ictAssets.length : 0,
        settingsConfigured: Object.keys(settings || {}).length,
      });
    } catch (e) {
      console.error('Error refreshing central data stats:', e);
    }
  };

  useEffect(() => {
    refreshStats();
    const handleDataChange = () => refreshStats();
    window.addEventListener('munyaka:data-changed', handleDataChange);
    window.addEventListener('storage', handleDataChange);
    return () => {
      window.removeEventListener('munyaka:data-changed', handleDataChange);
      window.removeEventListener('storage', handleDataChange);
    };
  }, [learners, staff, fees, attendance, exams, marks, timetable, settings]);

  const handleExportSeedData = () => {
    try {
      const generatedSeedVersion = "BUILD_OFFLINE_" + Date.now();

      // Automatically trigger a full state dump and store sync immediately before generating export
      const fullDbObject = CentralDataService.getFullStateDump();
      CentralDataService.importCentralData(fullDbObject);

      // Ensure staff and students are never sliced or omitted
      if (!fullDbObject.staff || fullDbObject.staff.length === 0) {
        fullDbObject.staff = initialSeedData.staff || [];
      }
      if (!fullDbObject.students || fullDbObject.students.length === 0) {
        fullDbObject.students = initialSeedData.students || [];
      }

      const fileContent = `export const SEED_VERSION = "${generatedSeedVersion}";

export const DEFAULT_CBC_CLUSTERS = [
  {
    id: "cluster_1",
    name: "Languages & Literacy",
    description: "English, Kiswahili, Indigenous Languages, Foreign Languages",
    color: "bg-indigo-500",
    icon: "BookOpen",
    learningAreas: [
      { id: "la_eng", name: "English Language Activities", code: "ENG-01", category: "Core", gradeLevels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"] },
      { id: "la_kisw", name: "Kiswahili Language Activities", code: "KISW-01", category: "Core", gradeLevels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"] }
    ]
  },
  {
    id: "cluster_2",
    name: "Mathematics & Science",
    description: "Mathematics, Integrated Science, Health Education",
    color: "bg-emerald-500",
    icon: "Calculator",
    learningAreas: [
      { id: "la_math", name: "Mathematics Activities", code: "MATH-01", category: "Core", gradeLevels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"] },
      { id: "la_sci", name: "Integrated Science", code: "SCI-01", category: "Core", gradeLevels: ["Grade 4", "Grade 5", "Grade 6"] }
    ]
  }
];

export const buildDefaultClusters = () => DEFAULT_CBC_CLUSTERS;

export const initialSeedData = ${JSON.stringify(fullDbObject, null, 2)};

(initialSeedData as any).learners = initialSeedData.students;

export const INITIAL_SEED_DATA = initialSeedData;

export const initialAttendance = (initialSeedData as any).attendance || {};
export const initialIctEquipment = (initialSeedData as any).ictEquipment || (initialSeedData as any).ictLabEquipment || [];
export const initialScienceInventory = (initialSeedData as any).scienceInventory || (initialSeedData as any).scienceLabInventory || [];
export const initialStoreInventory = (initialSeedData as any).storeInventory || (initialSeedData as any).storeStock || [];
export const initialSettings = (initialSeedData as any).settings || (initialSeedData as any).schoolSettings || {};
export const initialNotices = (initialSeedData as any).notices || (initialSeedData as any).munyaka_notices || [];
export const initialEvents = (initialSeedData as any).events || [];
export const initialExams = (initialSeedData as any).exams || (initialSeedData as any).all_set_exams || (initialSeedData as any).question_bank || [];
export const initialExamSchedules = (initialSeedData as any).examSchedules || (initialSeedData as any).assessment_schedules || [];
export const initialExamTypes = (initialSeedData as any).examTypes || (initialSeedData as any).exam_types || [];
export const initialMarks = (initialSeedData as any).marks || (initialSeedData as any).assessments || (initialSeedData as any).marked_student_submissions || [];
export const initialQuestions = (initialSeedData as any).questions || (initialSeedData as any).question_bank || [];
export const initialLearners = initialSeedData.students || [];
export const initialStaff = initialSeedData.staff || [];
export const initialReportCards = (initialSeedData as any).reportCards || [];
export const initialFeeStructures = (initialSeedData as any).feeStructures || (initialSeedData as any).fees_structures || [];
export const initialFeePayments = (initialSeedData as any).fees || (initialSeedData as any).payments || [];
export const initialStudyCorner = (initialSeedData as any).studyCorner || (initialSeedData as any).study_materials || [];
export const initialLibraryBooks = (initialSeedData as any).libraryBooks || (initialSeedData as any).library_books || [];
export const initialLibraryLogs = (initialSeedData as any).libraryLogs || (initialSeedData as any).library_logs || [];
export const mockLearners = initialSeedData.students || [];
export const mockStudents = initialSeedData.students || [];
export const mockStaff = initialSeedData.staff || [];
export const initialGrades = (initialSeedData as any).grades || [];
export const initialStreams = (initialSeedData as any).streams || [];
export const initialClassAssignments = (initialSeedData as any).classAssignments || [];
export const mockExams = (initialSeedData as any).exams || [];
export const mockLibrary = (initialSeedData as any).libraryBooks || [];
export const mockFinances = (initialSeedData as any).fees || [];

export default initialSeedData;
`;

      const blob = new Blob([fileContent], { type: 'text/typescript;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'initialSeedData.ts';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess(`Exported initialSeedData.ts (${generatedSeedVersion}) with full un-sliced state across all modules!`);
    } catch (err: any) {
      console.error('[CentralDataServicePage] Export seed error:', err);
      showError('Failed to generate initialSeedData.ts: ' + (err?.message || err));
    }
  };

  const handleSyncStoreToCentralData = () => {
    try {
      setLoading(true);
      // Read current store state and master lists
      const s1 = JSON.parse(localStorage.getItem('munyaka_staff') || '[]');
      const s2 = JSON.parse(localStorage.getItem('munyaka_staff_directory') || '[]');
      const s3 = JSON.parse(localStorage.getItem('munyaka_master_staff_list') || '[]');
      const s4 = JSON.parse(localStorage.getItem('staff') || '[]');
      const staffCandidates = [staff, s1, s2, s3, s4].filter(Array.isArray);
      const masterStaff = staffCandidates.reduce((max, curr) => (curr.length > max.length ? curr : max), staff);

      const l1 = JSON.parse(localStorage.getItem('munyaka_students') || '[]');
      const l2 = JSON.parse(localStorage.getItem('school_learners_data') || '[]');
      const masterLearners = [learners, l1, l2].filter(Array.isArray).reduce((max, curr) => (curr.length > max.length ? curr : max), learners);

      const f1 = JSON.parse(localStorage.getItem('munyaka_fees') || '[]');
      const f2 = JSON.parse(localStorage.getItem('munyaka_fees_records') || '[]');
      const masterFees = [fees, f1, f2].filter(Array.isArray).reduce((max, curr) => (curr.length > max.length ? curr : max), fees);

      const dump = {
        students: masterLearners,
        staff: masterStaff.length > 0 ? masterStaff : (initialSeedData.staff || []),
        fees: masterFees,
        attendance,
        exams,
        marks,
        timetable,
        settings,
        timestamp: new Date().toISOString()
      };

      // Write full updated dataset to localStorage keys
      localStorage.setItem('munyaka_students', JSON.stringify(masterLearners));
      localStorage.setItem('munyaka_staff', JSON.stringify(dump.staff));
      localStorage.setItem('munyaka_staff_directory', JSON.stringify(dump.staff));
      localStorage.setItem('munyaka_master_staff_list', JSON.stringify(dump.staff));
      localStorage.setItem('munyaka_fees', JSON.stringify(masterFees));
      localStorage.setItem('munyaka_attendance', JSON.stringify(attendance));
      localStorage.setItem('munyaka_central_db', JSON.stringify(dump));

      refreshStore();
      refreshStats();
      window.dispatchEvent(new Event('munyaka:data-changed'));
      window.dispatchEvent(new Event('staff-changed'));
      window.dispatchEvent(new Event('students-updated'));

      showSuccess('Successfully synced useSchoolStore and localStorage with latest central dataset!');
    } catch (err: any) {
      showError('Failed to sync central data: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSnapshot = async () => {
    try {
      setLoading(true);
      const snapshot = JSON.stringify({
        students: learners,
        staff,
        fees,
        attendance,
        exams,
        marks,
        timetable,
        settings,
        timestamp: new Date().toISOString()
      }, null, 2);
      setSnapshotJson(snapshot);
      showSuccess('Live useSchoolStore snapshot generated successfully.');
    } catch {
      showError('Failed to generate snapshot.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSnapshot = () => {
    if (!snapshotJson) return;
    const blob = new Blob([snapshotJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `munyaka_snapshot_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreSnapshot = async () => {
    if (!restoreJson.trim()) {
      showError('Please paste a valid JSON snapshot');
      return;
    }
    try {
      setLoading(true);
      const parsed = JSON.parse(restoreJson);
      if (parsed) {
        if (parsed.students) localStorage.setItem('munyaka_students', JSON.stringify(parsed.students));
        if (parsed.staff) localStorage.setItem('munyaka_staff', JSON.stringify(parsed.staff));
        if (parsed.fees) localStorage.setItem('munyaka_fees', JSON.stringify(parsed.fees));
        if (parsed.attendance) localStorage.setItem('munyaka_attendance', JSON.stringify(parsed.attendance));
        if (parsed.exams) localStorage.setItem('all_set_exams', JSON.stringify(parsed.exams));
        if (parsed.marks) localStorage.setItem('marked_student_submissions', JSON.stringify(parsed.marks));
        if (parsed.timetable) localStorage.setItem('school-timetable-data', JSON.stringify(parsed.timetable));
        if (parsed.settings) localStorage.setItem('munyaka_system_settings_v3', JSON.stringify(parsed.settings));

        refreshStore();
        showSuccess('System restored successfully from snapshot.');
        setIsRestoreOpen(false);
        setRestoreJson('');
        refreshStats();
        window.dispatchEvent(new Event('munyaka:data-changed'));
      } else {
        showError('Invalid JSON format or corrupted snapshot.');
      }
    } catch {
      showError('Failed to restore snapshot.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-8 shadow-xl border border-indigo-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-md border border-indigo-500/30">
              <Database className="w-3.5 h-3.5" />
              Central Storage & APK Seed Generator
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Central Data & APK Master Export</h1>
            <p className="text-indigo-200 text-sm max-w-2xl leading-relaxed">
              Connected directly to live <code className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-xs">useSchoolStore</code> state. Export your active live store directly into <code className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-xs">initialSeedData.ts</code> for offline APK builds or perform full JSON backups and restores.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleSyncStoreToCentralData}
              disabled={loading}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/30 font-semibold"
            >
              <Database className="w-4 h-4 mr-2" />
              Sync Store to Central Data
            </Button>
            <Button
              onClick={handleExportSeedData}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/30 font-semibold"
            >
              <Download className="w-4 h-4 mr-2" />
              Export initialSeedData.ts
            </Button>
          </div>
        </div>
      </div>

      {/* Live Store Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Learners</p>
              <p className="text-xl font-bold">{stats.registeredStudents}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Teaching Staff</p>
              <p className="text-xl font-bold">{stats.teachingStaff}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Non-Teaching</p>
              <p className="text-xl font-bold">{stats.nonTeachingStaff}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Attendance</p>
              <p className="text-xl font-bold">{stats.attendanceRecords}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Fee Records</p>
              <p className="text-xl font-bold">{stats.feeRecords}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Exams / Marks</p>
              <p className="text-xl font-bold">{stats.examsCount} / {stats.marksCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Snapshot & Backup Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <CardTitle>Generate JSON Backup</CardTitle>
            </div>
            <CardDescription>
              Create a structured JSON dump of all core learners, staff, attendance, and financial data from <code className="text-xs font-mono">useSchoolStore</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleGenerateSnapshot} disabled={loading} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                Generate Snapshot
              </Button>
              {snapshotJson && (
                <Button onClick={handleDownloadSnapshot} variant="outline" className="rounded-xl">
                  <Download className="w-4 h-4 mr-2" />
                  Download JSON
                </Button>
              )}
            </div>

            {snapshotJson && (
              <Textarea
                readOnly
                value={snapshotJson}
                className="font-mono text-xs h-48 bg-slate-50 dark:bg-slate-900 rounded-xl"
              />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              <CardTitle>Restore JSON Snapshot</CardTitle>
            </div>
            <CardDescription>
              Paste a previously exported snapshot to safely hydrate and overwrite live <code className="text-xs font-mono">useSchoolStore</code> state.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                  Open Restore Dialog
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl max-w-xl">
                <DialogHeader>
                  <DialogTitle>Restore System Snapshot</DialogTitle>
                  <DialogDescription>
                    Paste raw JSON snapshot contents below. This will overwrite local student, staff, fee, and attendance state.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                  <Textarea
                    placeholder="Paste valid JSON snapshot here..."
                    value={restoreJson}
                    onChange={(e) => setRestoreJson(e.target.value)}
                    className="font-mono text-xs h-56 rounded-xl bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsRestoreOpen(false)} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button onClick={handleRestoreSnapshot} disabled={loading} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                    Confirm Restore
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs text-muted-foreground flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
              <p>Restoring a snapshot will immediately update the Zustand store and dispatch global events to refresh all open dashboards in real time.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
