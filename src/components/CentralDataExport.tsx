import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CentralDataService } from '@/services/centralDataService';
import { calculateStaffMetrics } from '@/components/dashboards/AdminDashboard';
import { Users, GraduationCap, Briefcase, CalendarCheck, Database, Download, RefreshCw, FileText, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

export const CentralDataExport: React.FC = () => {
  const [exportStats, setExportStats] = useState({
    totalLearners: 0,
    teachingStaff: 0,
    nonTeachingStaff: 0,
    totalAttendance: 0
  });

  const [isExporting, setIsExporting] = useState(false);

  // 2. BIND DATA LISTENER IN CENTRAL MASTER EXPORT (`src/components/CentralDataExport.tsx`)
  useEffect(() => {
    const syncExportMetrics = () => {
      try {
        const db = {
          staff: CentralDataService.getStaff() || [],
          learners: CentralDataService.getLearners() || [],
          attendance: CentralDataService.getData('munyaka_attendance', [])
        };

        const staff = db.staff || [];
        const learners = db.learners || [];

        const metrics = calculateStaffMetrics(staff);

        setExportStats({
          totalLearners: learners.length,
          teachingStaff: metrics.teachingCount,
          nonTeachingStaff: metrics.nonTeachingCount,
          totalAttendance: (db.attendance || []).length
        });
      } catch (e) {
        console.error('Error syncing export metrics:', e);
      }
    };

    // Initial load
    syncExportMetrics();

    // Listen for live global mutations
    window.addEventListener('munyaka_data_changed', syncExportMetrics);
    window.addEventListener('storage', syncExportMetrics);
    window.addEventListener('munyaka:data-changed', syncExportMetrics);

    return () => {
      window.removeEventListener('munyaka_data_changed', syncExportMetrics);
      window.removeEventListener('storage', syncExportMetrics);
      window.removeEventListener('munyaka:data-changed', syncExportMetrics);
    };
  }, []);

  const handleTriggerExport = async () => {
    try {
      setIsExporting(true);
      const fullDump = CentralDataService.getFullStateDump ? CentralDataService.getFullStateDump() : {
        learners: CentralDataService.getLearners(),
        staff: CentralDataService.getStaff(),
        timestamp: new Date().toISOString()
      };

      const jsonString = JSON.stringify(fullDump, null, 2);
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `munyaka_master_export_${dateStr}.json`;

      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess("Central Master Export downloaded successfully!");
    } catch (err: any) {
      console.error("Export error:", err);
      showError("Failed to export central master data: " + (err?.message || err));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-900/60 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-medium text-emerald-200 mb-3 backdrop-blur-sm">
              <Database size={13} className="text-emerald-400" />
              Central Master Data Sync & Real-Time Export Hub
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Central Data Export</h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
              Real-time reactive summary metrics and unified backup bundle generator for Munyaka Primary School.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleTriggerExport}
              disabled={isExporting}
              className="bg-white text-emerald-900 hover:bg-emerald-50 font-semibold shadow-md transition-all flex items-center gap-2"
            >
              <Download size={16} />
              {isExporting ? 'Generating Bundle...' : 'Download Master JSON'}
            </Button>
          </div>
        </div>
      </div>

      {/* Reactive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-100 shadow-sm bg-white overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Learners</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Users size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{exportStats.totalLearners}</div>
            <p className="text-xs text-slate-500 mt-1">Live synchronized student count</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm bg-white overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Teaching Staff</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <GraduationCap size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{exportStats.teachingStaff}</div>
            <p className="text-xs text-slate-500 mt-1">Active CBC instructors</p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 shadow-sm bg-white overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Non-Teaching Staff</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Briefcase size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{exportStats.nonTeachingStaff}</div>
            <p className="text-xs text-slate-500 mt-1">Support and admin personnel</p>
          </CardContent>
        </Card>

        <Card className="border-teal-100 shadow-sm bg-white overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-600" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Attendance Records</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <CalendarCheck size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{exportStats.totalAttendance}</div>
            <p className="text-xs text-slate-500 mt-1">Logged attendance entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Database className="text-emerald-600" size={20} />
            Master System Export & Live Sync Status
          </CardTitle>
          <CardDescription>
            Whenever staff or learners are added, updated, or deleted anywhere in the system, these counts re-render instantly without requiring page reloads.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">Real-Time Event Broadcast Active</h4>
                <p className="text-slate-500 text-xs">Listening to <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">munyaka_data_changed</code> and storage events.</p>
              </div>
            </div>
            <Button
              onClick={handleTriggerExport}
              disabled={isExporting}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow"
            >
              <Download size={15} /> Export Master Package
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CentralDataExport;
