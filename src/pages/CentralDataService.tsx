import React, { useState, useEffect, useCallback } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSchoolStore } from '@/store/useSchoolStore';
import { useSchoolContext } from '@/context/SchoolContext';
import { showSuccess, showError } from '@/utils/toast';
import { Download, Upload, Database, RefreshCw, Layers, ShieldCheck, Users, GraduationCap, DollarSign, CalendarCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { initialSeedData } from '@/data/initialSeedData';
import { CentralDataService } from '@/services/centralDataService';
import { safeWrite, isQuotaExceeded, lsSizeOf } from '@/utils/storageUtils';

/**
 * Recursively strip base64-encoded blobs (images, PDFs, etc.) from a data
 * object to reduce payload size and avoid localStorage quota crashes.
 *
 * Looks for any string value that starts with a base64 data URI prefix
 * (e.g. "data:image/png;base64,") or is a long base64 string, and replaces
 * it with a short placeholder.
 */
function stripBase64Blobs(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(stripBase64Blobs);
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Detect base64 data URIs: "data:<mime>;base64,..."
      const dataUriMatch = value.match(/^data:[^;]+;base64,/i);
      if (dataUriMatch) {
        result[key] = `[stripped:${dataUriMatch[0].slice(5, 30)}...]`;
        continue;
      }
      // Detect long base64 strings (≥ 1 KB, no spaces, typical base64 charset)
      if (value.length >= 1024 && /^[A-Za-z0-9+/]+=*$/.test(value)) {
        result[key] = `[stripped:base64_${value.length}_bytes]`;
        continue;
      }
      result[key] = value;
    } else if (typeof value === 'object') {
      result[key] = stripBase64Blobs(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export default function CentralDataServicePage() {
  const { learners, staff, fees, attendance, exams, marks, timetable, settings, refreshStore } = useSchoolStore();
  const { exportMasterJSON, importMasterJSON } = useSchoolContext();

  const [pasteJsonInput, setPasteJsonInput] = useState('');
  const [snapshotJson, setSnapshotJson] = useState('');
  const [restoreJson, setRestoreJson] = useState('');
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCopyLiveStoreJson = async () => {
    try {
      const fullDump = CentralDataService.getFullStateDump();
      const jsonStr = JSON.stringify(fullDump, null, 2);
      await navigator.clipboard.writeText(jsonStr);
      showSuccess('Successfully copied all live store JSON to clipboard!');
    } catch (err: any) {
      showError('Failed to copy to clipboard: ' + (err?.message || err));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      await importMasterJSON(file);
    } finally {
      setLoading(false);
      if (e.target) e.target.value = '';
    }
  };

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

  const refreshStats = useCallback(() => {
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

      // Learners count sync with robust fallback to localStorage directly and initialSeedData
      const l1 = JSON.parse(localStorage.getItem('munyaka_students') || '[]');
      const l2 = JSON.parse(localStorage.getItem('school_learners_data') || '[]');
      const l3 = JSON.parse(localStorage.getItem('munyaka_learners') || '[]');
      const seedLearners = initialSeedData.students || [];
      const candidateLearners = [l1, l2, l3, learners, seedLearners].filter(Array.isArray);
      const masterLearners = candidateLearners.reduce((max, curr) => (curr.length > max.length ? curr : max), seedLearners);

      // Check teaching vs non-teaching staff strictly from live storage
      const staff = JSON.parse(localStorage.getItem('munyaka_master_staff_list') || '[]');
      const teachingStaff = staff.filter((s: any) => s.type === 'teaching' || s.role === 'teacher').length;
      const nonTeachingStaff = staff.filter((s: any) => s.type === 'non-teaching' || s.role === 'support').length;

      const attendanceCount = Array.isArray(attendance)
        ? attendance.length
        : Object.keys(attendance || {}).length;

      const feeRecords = Array.isArray(fees)
        ? fees.length
        : Object.keys(fees || {}).length;

      const marksCount = Array.isArray(marks)
        ? marks.length
        : Object.keys(marks || {}).length;

      setStats({
        registeredStudents: masterLearners.length,
        teachingStaff,
        nonTeachingStaff,
        attendanceRecords: attendanceCount,
        feeRecords,
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
  }, [refreshStore, learners, staff, fees, attendance, exams, marks, timetable, settings]);

  useEffect(() => {
    refreshStats();
    const handleDataChange = () => refreshStats();
    window.addEventListener('munyaka:data-changed', handleDataChange);
    window.addEventListener('storage', handleDataChange);
    return () => {
      window.removeEventListener('munyaka:data-changed', handleDataChange);
      window.removeEventListener('storage', handleDataChange);
    };
  }, [refreshStats]);

  const handleExportSeedData = async () => {
    exportMasterJSON();
  };

  const handleMasterSystemSyncAndExport = async () => {
    try {
      setLoading(true);
      const masterBundle: Record<string, any> = {};
      const allKeys = Object.keys(localStorage);

      allKeys.forEach(key => {
        try {
          const val = localStorage.getItem(key);
          if (val) {
            try {
              masterBundle[key] = JSON.parse(val);
            } catch {
              masterBundle[key] = val;
            }
          }
        } catch (e) {}
      });

      const structuredPayload = {
        timestamp: new Date().toISOString(),
        school: "Munyaka Primary School",
        version: "3.5.0",
        systemStatus: "Master Synchronized",
        data: masterBundle
      };

      const jsonString = JSON.stringify(structuredPayload, null, 2);
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `munyaka_master_backup_${dateStr}.json`;

      if (Capacitor.isNativePlatform()) {
        try {
          // Request permissions if needed
          try {
            await Filesystem.requestPermissions();
          } catch (permErr) {
            console.warn('Filesystem permission request note:', permErr);
          }

          // Write file to device Documents directory
          await Filesystem.writeFile({
            path: fileName,
            data: jsonString,
            directory: Directory.Documents,
            encoding: 'utf8' as any
          });

          showSuccess(`Master backup successfully saved to device Documents folder as ${fileName}!`);
        } catch (nativeErr: any) {
          console.error('Native filesystem write error, falling back to browser download:', nativeErr);
          triggerBrowserDownload(jsonString, fileName);
        }
      } else {
        triggerBrowserDownload(jsonString, fileName);
      }
    } catch (err: any) {
      console.error('Master export error:', err);
      showError('Failed to export master system bundle: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const triggerBrowserDownload = (jsonString: string, fileName: string) => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess(`Universal Master System Sync & Export completed successfully! Downloaded ${fileName}.`);
  };

  const handleClearOldLogs = () => {
    const confirmed = window.confirm(
      "Emergency Storage Purge: This will safely remove old logs and cached audit trails to free up storage space. Core student and staff records will remain safe. Proceed?"
    );
    if (!confirmed) return;

    try {
      // Protected core keys that must NEVER be deleted
      const protectedKeys = [
        'currentUser',
        'munyaka_session',
        'munyaka_learners_db',
        'school_learners_data',
        'munyaka_students',
        'munyaka_master_learner_list',
        'munyaka_staff',
        'munyaka_staff_directory',
        'munyaka_master_staff_list',
        'munyaka_central_db',
        'school_fees_v1',
        'school_settings_v1',
        'munyaka_admin_email',
        'munyaka_admin_password',
        'users'
      ];

      let removedCount = 0;
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        const lowerKey = key.toLowerCase();
        const isProtected = protectedKeys.includes(key);
        const matchesLogOrCache =
          lowerKey.includes('log') ||
          lowerKey.includes('cache') ||
          lowerKey.includes('debug') ||
          lowerKey.includes('temp') ||
          lowerKey.includes('audit') ||
          lowerKey.includes('history_old') ||
          lowerKey.includes('sync_queue');

        if (!isProtected && matchesLogOrCache) {
          try {
            localStorage.removeItem(key);
            removedCount++;
          } catch (e) {}
        }
      });

      // Also clean old date-based roll call records if more than 30 entries
      try {
        const rawRoll = localStorage.getItem('roll_call_records');
        if (rawRoll) {
          const parsed = JSON.parse(rawRoll);
          if (parsed && typeof parsed === 'object') {
            const entries = Object.entries(parsed);
            if (entries.length > 30) {
              const sliced = entries.slice(entries.length - 20);
              localStorage.setItem('roll_call_records', JSON.stringify(Object.fromEntries(sliced)));
            }
          }
        }
      } catch (e) {}

      showSuccess(`Emergency purge complete! Removed ${removedCount} temporary log/cache keys. Reloading safely...`);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error('Error during emergency storage purge:', err);
      showError('Failed to clear old logs: ' + (err?.message || err));
    }
  };

  const handleSyncStoreToCentralData = async () => {
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
  
        const dump = CentralDataService.getFullStateDump();
  
        // Write full updated dataset to localStorage keys with quota error handling
        const storageOps: Array<[string, unknown]> = [
          ['munyaka_students', masterLearners],
          ['munyaka_staff', dump.staff],
          ['munyaka_staff_directory', dump.staff],
          ['munyaka_master_staff_list', dump.staff],
          ['munyaka_fees', masterFees],
          ['munyaka_attendance', attendance],
          ['munyaka_central_db', dump],
        ];
  
        const failures: string[] = [];
        for (const [key, value] of storageOps) {
          const ok = safeWrite(key, value, { operation: 'sync' });
          if (!ok) {
            failures.push(key);
          }
        }
  
        if (failures.length > 0) {
          // Quota errors were already reported by safeWrite → handleQuotaError
          showError(
            'Storage quota exceeded while syncing. ' +
            'Please export your data and clear old records to free up space.'
          );
          setLoading(false);
          return;
        }
  
        // Post directly to local dev server endpoint /api/save-seed to write to src/data/initialSeedData.ts on disk
        const res = await fetch('/api/save-seed', {
          method: 'POST',
          body: JSON.stringify(useSchoolStore.getState())
        });
        if (res.ok) {
          const jsonRes = await res.json();
          if (jsonRes.success) {
            showSuccess("Master seed file saved directly to src/data/initialSeedData.ts on disk!");
          }
        }
  
        refreshStore();
        refreshStats();
        window.dispatchEvent(new Event('munyaka:data-changed'));
        window.dispatchEvent(new Event('staff-changed'));
        window.dispatchEvent(new Event('students-updated'));
  
        showSuccess(`Successfully synced useSchoolStore, localStorage, and central dataset!`);
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
          // Strip base64 blobs to reduce payload size
          const stripped = stripBase64Blobs(parsed);
  
          // Write to localStorage with quota error handling
          const storageOps: Array<[string, unknown]> = [
            ['munyaka_students', stripped.students],
            ['munyaka_staff', stripped.staff],
            ['munyaka_fees', stripped.fees],
            ['munyaka_attendance', stripped.attendance],
            ['all_set_exams', stripped.exams],
            ['marked_student_submissions', stripped.marks],
            ['school-timetable-data', stripped.timetable],
            ['munyaka_system_settings_v3', stripped.settings],
          ];
  
          const failures: string[] = [];
          for (const [key, value] of storageOps) {
            if (value === undefined || value === null) continue;
            const ok = safeWrite(key, value, { operation: 'restore' });
            if (!ok) {
              failures.push(key);
            }
          }
  
          if (failures.length > 0) {
            // Quota errors were already reported by safeWrite → handleQuotaError
            showError(
              'Storage quota exceeded while restoring snapshot. ' +
              'Please export your data and clear old records to free up space.'
            );
            setLoading(false);
            return;
          }
  
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
              Connected directly to active application state. Export your active live store into master JSON backups or perform full data synchronizations and backups.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleMasterSystemSyncAndExport}
              disabled={loading}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-900/30 font-semibold gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Master System Sync & Export JSON
            </Button>
            <Button
              onClick={handleClearOldLogs}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-900/30 font-semibold"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear Old Logs & Cache
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
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleGenerateSnapshot} disabled={loading} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                Generate Snapshot
              </Button>
              <Button onClick={handleCopyLiveStoreJson} variant="outline" className="rounded-xl border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30">
                Copy Live Store JSON
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
              <CardTitle>Upload Backup File (.json)</CardTitle>
            </div>
            <CardDescription>
              Upload a previously exported JSON backup file to instantly hydrate <code className="text-xs font-mono">useSchoolStore</code> and localStorage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-900/50 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Upload backup file (.json)</p>
                <p className="text-xs text-muted-foreground mt-0.5">Select a valid .json snapshot file from your device.</p>
              </div>
              <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-900/20 transition-all">
                <span>Upload & Hydrate Store (.json)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs text-muted-foreground flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <p>Hydrating from a backup file will immediately update the store and refresh all dashboard counters in real time.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
