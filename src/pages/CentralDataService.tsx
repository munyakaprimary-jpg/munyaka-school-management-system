import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, Database, RefreshCw, CheckCircle, FileCode, HardDrive, ShieldCheck, AlertCircle, Sparkles, Loader2, Users, UserCheck, Briefcase, GraduationCap, BookOpen } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import BackButton from '@/components/ui/BackButton';
import { useFileDownload } from '@/utils/fileDownloader';
import { useCentralData, notifyDataChanged, getActiveLearners, getActiveTeachers } from '@/hooks/useCentralData';
import { lsSet, lsRead } from '@/utils/storage';
import { STAFF_MASTER_KEY, getCategorizedMetrics, isTeachingRole, getStaffMaster } from '@/services/staffMasterService';
import { tryParse } from '@/utils/storageUtils';

export default function CentralDataService() {
  const centralStats = useCentralData();
  
  // Get categorized staff metrics for Teaching vs Non-Teaching display
  const staffMetrics = getCategorizedMetrics();
  
  // Staff list tab state
  const [staffListTab, setStaffListTab] = useState<'all' | 'teaching' | 'non-teaching'>('all');
  
  const [stats, setStats] = useState({
    studentsCount: 0,
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
      const studentKeys = ['school_learners_data', 'munyaka_students', 'students', 'learners', 'pupils', 'school_students', 'registered_students', 'munyaka_registered_students'];
      let studentsCount = centralStats.totalStudents;
      if (studentsCount === 0) {
        for (const k of studentKeys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = tryParse<any[]>(raw);
            if (Array.isArray(parsed) && parsed.length > studentsCount) {
              studentsCount = parsed.length;
            }
          }
        }
      }

      const attendance = lsRead<Record<string, unknown>>('munyaka_attendance_records', {});
      const fees = lsRead<Record<string, unknown>>('munyaka_fees_records', {});

      setStats({
        studentsCount,
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
        version: "5.0", // v5.0: includes munyaka_master_staff_list
        exportDate: new Date().toISOString(),
        school: "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
        students: ((): any[] => {
          const keys = ['school_learners_data', 'munyaka_students', 'students', 'learners', 'pupils', 'school_students', 'registered_students', 'munyaka_registered_students'];
          for (const k of keys) {
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed = tryParse<any[]>(raw);
              if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
          }
          return [];
        })(),
        staff: lsRead<unknown>('munyaka_staff_directory', []),
        staffPrereg: lsRead<unknown>('munyaka_staff_prereg', []),
        staffMaster: lsRead<unknown>(STAFF_MASTER_KEY, []),   // canonical master ledger
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
    if (!String(importJsonText || '').trim()) {
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
            <BackButton parentPath="/" />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border-emerald-500/20 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Registered Students</div>
            <div className="text-3xl font-extrabold text-emerald-600 mt-2">{stats.studentsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Managed centrally</p>
          </CardContent>
        </Card>
        <Card className="border-indigo-500/20 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-indigo-500" />
              <div className="text-sm font-medium text-muted-foreground">Teaching Staff</div>
            </div>
            <div className="text-3xl font-extrabold text-indigo-600 mt-2">{staffMetrics.teaching.count}</div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-emerald-600 font-medium">Active: {staffMetrics.teaching.active}</span>
              <span className="text-xs text-amber-600 font-medium">Pending: {staffMetrics.teaching.pending}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/20 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-orange-500" />
              <div className="text-sm font-medium text-muted-foreground">Non-Teaching Staff</div>
            </div>
            <div className="text-3xl font-extrabold text-orange-600 mt-2">{staffMetrics.nonTeaching.count}</div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-emerald-600 font-medium">Active: {staffMetrics.nonTeaching.active}</span>
              <span className="text-xs text-amber-600 font-medium">Pending: {staffMetrics.nonTeaching.pending}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <UserCheck size={16} className="text-blue-500" />
              <div className="text-sm font-medium text-muted-foreground">Total Staff</div>
            </div>
            <div className="text-3xl font-extrabold text-blue-600 mt-2">{staffMetrics.total.count}</div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-emerald-600 font-medium">Active: {staffMetrics.total.active}</span>
              <span className="text-xs text-amber-600 font-medium">Pending: {staffMetrics.total.pending}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-cyan-500/20 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Attendance Logs</div>
            <div className="text-3xl font-extrabold text-cyan-600 mt-2">{stats.attendanceCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Term records</p>
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
                disabled={isImporting || !String(importJsonText || '').trim()}
                className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
              >
                {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Import & Sync Database
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Staff List */}
      <Card className="border-slate-200 shadow-md">
        <CardHeader className="bg-slate-50/50 pb-0 border-b">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-lg">Staff Directory</CardTitle>
            </div>
            {/* Tab Buttons */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
              {(['all', 'teaching', 'non-teaching'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStaffListTab(tab)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    staffListTab === tab
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'all' && '👥 All Staff'}
                  {tab === 'teaching' && '👩\u200d🏫 Teaching Staff'}
                  {tab === 'non-teaching' && '👔 Non-Teaching Staff'}
                </button>
              ))}
            </div>
          </div>
          {/* Tab Counts */}
          <div className="flex gap-4 pb-3 text-xs">
            <span className="text-indigo-600 font-medium">
              All: {staffMetrics.total.count}
            </span>
            <span className="text-emerald-600 font-medium">
              Teaching: {staffMetrics.teaching.count}
            </span>
            <span className="text-orange-600 font-medium">
              Non-Teaching: {staffMetrics.nonTeaching.count}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {(() => {
            const allStaff = getStaffMaster();
            const teachingStaff = allStaff.filter(s => isTeachingRole(s.systemRole));
            const nonTeachingStaff = allStaff.filter(s => !isTeachingRole(s.systemRole));
            
            const displayStaff = staffListTab === 'teaching' ? teachingStaff
              : staffListTab === 'non-teaching' ? nonTeachingStaff
              : allStaff;
            
            if (displayStaff.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Users size={40} className="mb-3 opacity-40" />
                  <p className="font-bold text-sm">No staff in this category</p>
                </div>
              );
            }
            
            return (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-500">Staff ID</th>
                      <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-500">Name</th>
                      <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-500">System Role</th>
                      <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-500">Email</th>
                      <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-500">Department</th>
                      <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayStaff.map((staff) => (
                      <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{staff.staffId}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{staff.name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isTeachingRole(staff.systemRole)
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              : 'bg-orange-50 text-orange-700 border border-orange-100'
                          }`}>
                            {staff.systemRole}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{staff.email}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{staff.department || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            (staff.status || '').toLowerCase() === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {staff.status || 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}