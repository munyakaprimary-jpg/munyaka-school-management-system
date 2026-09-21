import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CentralDataService } from '../services/centralDataService';
import { exportAllData, parseAndImportBackup, downloadDatabaseBackup } from '@/utils/storage';
import { Download, Upload, Users, GraduationCap, Briefcase, CheckCircle2, RefreshCw, AlertCircle, Database, Trash2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

export default function CentralDataPage() {
  const [stats, setStats] = useState({ learners: 0, teaching: 0, nonTeaching: 0 });
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const learners = CentralDataService.getLearners();
    const staff = CentralDataService.getStaff();

    const teaching = staff.filter((s: any) => {
      const roleStr = `${s?.role || ''} ${s?.type || ''}`.toLowerCase();
      return roleStr.includes('teach');
    });

    const nonTeaching = staff.filter((s: any) => {
      const roleStr = `${s?.role || ''} ${s?.type || ''}`.toLowerCase();
      return !roleStr.includes('teach');
    });

    setStats({
      learners: learners.length,
      teaching: teaching.length,
      nonTeaching: nonTeaching.length
    });
  }, []);

  const handleExport = async () => {
    try {
      const content = await CentralDataService.generateFullSnapshot();
      const blob = new Blob([content], { type: 'text/typescript;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'initialSeedData.ts';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccess("Initial seed data exported successfully!");
    } catch (e) {
      showError("Failed to export seed data.");
    }
  };

  const handleExportJsonBackup = () => {
    try {
      const backup = exportAllData();
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `munyaka_system_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccess("System backup JSON exported successfully!");
    } catch (e) {
      showError("Failed to export JSON backup.");
    }
  };

  const handleClearStaff = () => {
    if (!window.confirm("Are you sure you want to clear all staff records? This will wipe all teacher and staff personnel data and reset the list to empty.")) {
      return;
    }
    try {
      CentralDataService.clearStaff();
      setStats({
        learners: stats.learners,
        teaching: 0,
        nonTeaching: 0
      });
      showSuccess("All staff records have been successfully cleared.");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (e) {
      showError("Failed to clear staff records.");
    }
  };

  const handleFileRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileRestoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = parseAndImportBackup(content);

        if (!result.success) {
          throw new Error(result.errors.join('; ') || 'Failed to restore backup.');
        }

        setIsRestoring(true);
        showSuccess(`Backup successfully restored! ${result.keysRestored.length} data areas restored. Reloading application...`);
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } catch (err) {
        setIsRestoring(false);
        showError(err instanceof Error ? err.message : "Failed to restore backup: Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-20">
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mb-2">
            CENTRALIZED DATA & APK BACKUPS
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Central Data Service & APK Generator</h1>
          <p className="text-sm text-indigo-200 mt-1 max-w-2xl">
            All student and staff records are synchronized in a single unified persistent engine. Export your database into <code className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-xs">initialSeedData.ts</code> or perform full JSON backups and restores.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Button onClick={handleExport} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
            <Download className="w-4 h-4 mr-2" />
            Export initialSeedData.ts
          </Button>
          <Button onClick={handleExportJsonBackup} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow">
            <Database className="w-4 h-4 mr-2" />
            Export JSON Backup
          </Button>
          <Button onClick={handleFileRestoreClick} disabled={isRestoring} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow">
            {isRestoring ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Restore JSON Backup
          </Button>
          <Button onClick={handleClearStaff} variant="destructive" className="bg-red-600 hover:bg-red-500 text-white shadow">
            <Trash2 className="w-4 h-4 mr-2" />
            Reset Staff Database
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileRestoreChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border shadow-sm rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Registered Students</CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.learners}</div>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Fully synchronized centrally
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Teaching Staff</CardTitle>
            <GraduationCap className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.teaching}</div>
            <p className="text-xs text-gray-500 mt-1">Active: {stats.teaching} | Pending: 0</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Non-Teaching Staff</CardTitle>
            <Briefcase className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.nonTeaching}</div>
            <p className="text-xs text-gray-500 mt-1">Active: {stats.nonTeaching} | Pending: 0</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-sm rounded-3xl bg-white p-6">
        <CardHeader className="px-0 pt-0 pb-4 border-b">
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-indigo-600" />
            Backup & Restoration Instructions
          </CardTitle>
          <CardDescription>
            How to use the JSON backup utility for offline deployments and APK portability.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pt-4 space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            1. <strong>Export JSON Backup:</strong> Downloads all local storage keys (attendance records, student grades, fee ledgers, teacher schedules, notices, and system settings) into a single JSON file.
          </p>
          <p>
            2. <strong>Restore JSON Backup:</strong> Selects a previously exported JSON backup file. The system automatically populates device storage with all records and instantly triggers an automatic page reload to ensure the app is fully hydrated with restored state.
          </p>
          <p>
            3. <strong>APK Build Seed:</strong> Use <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-xs">initialSeedData.ts</code> export to hardcode current school records directly into the mobile APK bundle before compiling with Capacitor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
