import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, Database, RefreshCw, CheckCircle, FileCode, HardDrive, ShieldCheck, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import BackButton from '@/components/ui/BackButton';
import { useFileDownload } from '@/utils/fileDownloader';
import { useCentralData, notifyDataChanged, getActiveLearners, getActiveTeachers } from '@/hooks/useCentralData';
import { lsSet, lsRead } from '@/utils/storage';
import { tryParse } from '@/utils/storageUtils';

export default function CentralDataService() {
  const centralStats = useCentralData();
  const [stats, setStats] = useState({
    studentsCount: 0,
    staffCount: 0,
    attendanceCount: 0,
    feesCount: 0,
    lastExportDate: lsRead<string>('munyaka_last_export_date', '') || 'Never'
  });

  const [importJsonText, setImportJsonText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // ====== Unified file-download state ======
  const seedExport = useFileDownload();
  const jsonExport = useFileDownload();

  const loadStats = () => {
    try {
      const students = getActiveLearners();
      const staff = getActiveTeachers();
      const attendance = lsRead<Record<string, unknown>>('munyaka_attendance_records', {});
      const fees = lsRead<Record<string, unknown>>('munyaka_fees_records', {});

      setStats({
        studentsCount: students?.length ?? 0,
        staffCount: staff?.length ?? 0,
        attendanceCount: Object.keys(attendance ?? {}).length,
        feesCount: Object.keys(fees ?? {}).length,
        lastExportDate: lsRead<string>('munyaka_last_export_date', '') || 'Never'
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Sync stats from central data hook + refresh on every change
  useEffect(() => {
    loadStats();
  }, [centralStats.totalStudents, centralStats.totalTeachers]);

  // ====== UNIFIED EXPORT: Central database as initialSeedData.ts ======
  const handleExportDatabase = async () => {
    try {
      const dbBundle = {
        version: "4.0",
        exportDate: new Date().toISOString(),
        school: "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
        students: lsRead<unknown>('school_learners_data', lsRead<unknown>('munyaka_students', [])),
        staff: lsRead<unknown>('munyaka_staff_directory', []),
        staffPrereg: lsRead<unknown>('munyaka_staff_prereg', []),
        fees: lsRead<unknown>('munyaka_fees_records', {}),
        transactions: lsRead<unknown>('munyaka_transactions', []),
        attendance: lsRead<unknown>('munyaka_attendance_records', {}),
        grades: lsRead<unknown>('munyaka_grades', []),
        examTypes: lsRead<unknown>('munyaka_exam_types', []),
        learningAreas: lsRead<unknown>('munyaka_learning_areas', []),
        assessmentScores: lsRead<unknown>('munyaka_assessment_scores', {}),
        libraryBooks: lsRead<unknown>('munyaka_library_books', []),
        ictAssets: lsRead<unknown>('munyaka_ict_assets', []),
        settings: lsRead<unknown>('munyaka_system_settings_v3', {})
      };

      // Serialize EVERY single key stored in localStorage into a clean key-value dictionary object
      const allLocalStorageData: Record<string, any> = {};
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key !== 'app_seed_version') {
            const val = localStorage.getItem(key);
            const parsed = tryParse(val);
            allLocalStorageData[key] = parsed !== null ? parsed : val;
          }
        }
      } catch (err) {
        console.error('[CentralDataService] Failed to snapshot localStorage:', err);
      }

      const fullExportObject = {
        ...dbBundle,
        localStorageSnapshot: allLocalStorageData
      };

      const jsonString = `export const INITIAL_SEED_DATA = ${JSON.stringify(fullExportObject, null, 2)};\n`;

      const nowStr = new Date().toLocaleString();
      lsSet('munyaka_last_export_date', nowStr);
      setStats(prev => ({ ...prev, lastExportDate: nowStr }));

      await seedExport.download({
        filename: 'initialSeedData.ts',
        data: jsonString,
        mimeType: 'text/typescript;charset=utf-8;',
        fileType: 'txt',
        pendingMessage: 'Exporting central database...',
        successMessage: 'Central database successfully exported as initialSeedData.ts!',
        errorMessage: 'Failed to export database bundle.',
      });
    } catch (e) {
      console.error(e);
      showError("Failed to export database bundle.");
    }
  };

  // ====== UNIFIED EXPORT: JSON backup ======
  const handleExportJson = async () => {
    try {
      const dbBundle = {
        version: "3.5",
        exportDate: new Date().toISOString(),
        school: "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
        students: lsRead<unknown>('school_learners_data', lsRead<unknown>('munyaka_students', [])),
        staff: lsRead<unknown>('munyaka_staff_directory', []),
        fees: lsRead<unknown>('munyaka_fees_records', {}),
        attendance: lsRead<unknown>('munyaka_attendance_records', {}),
        grades: lsRead<unknown>('munyaka_grades', [])
      };

      const jsonString = JSON.stringify(dbBundle, null, 2);

      await jsonExport.download({
        filename: 'munyaka_school_db_backup.json',
        data: jsonString,
        mimeType: 'application/json;charset=utf-8;',
        fileType: 'json',
        pendingMessage: 'Generating JSON backup...',
        successMessage: 'JSON database backup downloaded!',
        errorMessage: 'Failed to export JSON.',
      });
    } catch (e) {
      console.error(e);
      showError("Failed to export JSON.");
    }
  };

  const handleImportDatabase = () => {
    if (!(importJsonText ?? '').trim()) {
      showError("Please paste or load valid JSON seed data.");
      return;
    }
    try {
      setIsImporting(true);
      const parsed = JSON.parse(importJsonText) as Record<string, unknown>;
      
      if (parsed?.students && Array.isArray(parsed.students)) {
        lsSet('school_learners_data', parsed.students);
        lsSet('munyaka_students', parsed.students);
      }
      if (parsed?.staff && Array.isArray(parsed.staff)) {
        lsSet('munyaka_staff_directory', parsed.staff);
      }
      if (parsed?.staffPrereg && Array.isArray(parsed.staffPrereg)) {
        lsSet('munyaka_staff_prereg', parsed.staffPrereg);
      }
      if (parsed?.fees) {
        lsSet('munyaka_fees_records', parsed.fees);
      }
      if (parsed?.transactions) {
        lsSet('munyaka_transactions', parsed.transactions);
      }
      if (parsed?.attendance) {
        lsSet('munyaka_attendance_records', parsed.attendance);
      }
      if (parsed?.grades) {
        lsSet('munyaka_grades', parsed.grades);
      }
      if (parsed?.examTypes) {
        lsSet('munyaka_exam_types', parsed.examTypes);
      }
      if (parsed?.learningAreas) {
        lsSet('munyaka_learning_areas', parsed.learningAreas);
      }
      if (parsed?.assessmentScores) {
        lsSet('munyaka_assessment_scores', parsed.assessmentScores);
      }

      showSuccess("Central database successfully restored and loaded!");
      notifyDataChanged('school_learners_data');
      loadStats();
      setImportJsonText('');
    } catch (e) {
      console.error(e);
      showError("Invalid JSON or TypeScript seed format.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BackButton />
            <Badge variant="outline" className="border-emerald-400 text-emerald-300 px-3 py-1 text-xs uppercase tracking-wider">
              Centralized Data & APK Backups
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Central Data Service & APK Generator</h1>
          <p className="text-emerald-100/80 text-sm max-w-2xl">
            All student and staff records are synchronized in a single unified persistent engine. Export your growing database directly into <code className="bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-300 font-mono text-xs">src/data/initialSeedData.ts</code> before building your next Android APK.
          </p>
        </div>
        <Button 
          onClick={handleExportDatabase}
          disabled={seedExport.isDownloading}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-lg flex items-center gap-2 px-5 py-3 h-auto disabled:opacity-60"
        >
          {seedExport.isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          Export as initialSeedData.ts
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-emerald-500/20 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Registered Students</div>
            <div className="text-3xl font-extrabold text-emerald-600 mt-2">{stats.studentsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Managed centrally</p>
          </CardContent>
        </Card>
        <Card className="border-teal-500/20 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Staff Members</div>
            <div className="text-3xl font-extrabold text-teal-600 mt-2">{stats.staffCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Directory & Pre-reg</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Attendance Logs</div>
            <div className="text-3xl font-extrabold text-blue-600 mt-2">{stats.attendanceCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Term records</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Fee Ledgers</div>
            <div className="text-3xl font-extrabold text-amber-600 mt-2">{stats.feesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Financial records</p>
          </CardContent>
        </Card>
        <Card className="border-purple-500/20 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Last Seed Export</div>
            <div className="text-xs font-bold text-purple-600 mt-2 truncate" title={stats.lastExportDate}>{stats.lastExportDate}</div>
            <p className="text-xs text-muted-foreground mt-1">Source backup</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-md">
          <CardHeader className="bg-slate-50/50 pb-4 border-b">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-lg">Step-by-Step Guide for Android APK Builds</CardTitle>
            </div>
            <CardDescription>How to bake your gradually added learners & staff permanently into your APK</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-sm text-slate-700">
            <div className="flex items-start gap-3">
              <div className="bg-emerald-100 text-emerald-800 font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">1</div>
              <div>
                <span className="font-semibold text-slate-900">Add learners & staff gradually:</span> Use the app normally in your daily routine to register students, update fees, take attendance, and add teachers.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-emerald-100 text-emerald-800 font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">2</div>
              <div>
                <span className="font-semibold text-slate-900">Export seed file:</span> Click the <strong className="text-emerald-700">"Export as initialSeedData.ts"</strong> button above whenever you are ready to compile a new APK version.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-emerald-100 text-emerald-800 font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">3</div>
              <div>
                <span className="font-semibold text-slate-900">Replace source file:</span> Place the downloaded file into your project at <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs text-slate-900">src/data/initialSeedData.ts</code>.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-emerald-100 text-emerald-800 font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">4</div>
              <div>
                <span className="font-semibold text-slate-900">Build APK:</span> Run your build command (e.g. Capacitor Android build) to generate the APK with all student and staff data pre-seeded and fully offline-ready!
              </div>
            </div>

            <div className="pt-4 border-t flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleExportJson}
                disabled={jsonExport.isDownloading}
                className="flex items-center gap-2 disabled:opacity-60"
              >
                {jsonExport.isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCode className="w-4 h-4 text-blue-600" />}
                Download JSON Backup
              </Button>
              <Button variant="outline" onClick={loadStats} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-slate-600" />
                Refresh Statistics
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-md">
          <CardHeader className="bg-slate-50/50 pb-4 border-b">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-teal-600" />
              <CardTitle className="text-lg">Restore / Import Seed Bundle</CardTitle>
            </div>
            <CardDescription>Paste backup JSON or seed payload to load records instantly</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">JSON / Seed Data Payload</label>
              <textarea 
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="Paste backup JSON or export object here..."
                rows={6}
                className="w-full rounded-md border border-slate-300 p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                onClick={handleImportDatabase}
                disabled={isImporting || !(importJsonText ?? '').trim()}
                className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
              >
                {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Import & Sync Database
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}