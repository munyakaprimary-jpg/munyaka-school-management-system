// Central Data Export component for Munyaka Portal
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CentralDataService } from '@/services/centralDataService';
import { getStaffCategoryCounts } from '@/utils/staffMetrics';
import { exportMasterDatabase } from '@/utils/exportMasterDatabase';
import { Database, Download, Users, GraduationCap, Briefcase, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CentralDataExport() {
  const [dbStats, setDbStats] = useState({
    learnersCount: 0,
    staffCount: 0,
    teachingCount: 0,
    nonTeachingCount: 0,
    attendanceCount: 0,
    feesCount: 0,
    marksCount: 0
  });

  const loadMetrics = () => {
    try {
      const db = CentralDataService.getDB();
      const staffList = Array.isArray(db.staff) ? db.staff : [];
      const staffMetrics = getStaffCategoryCounts(staffList);

      setDbStats({
        learnersCount: Array.isArray(db.learners) ? db.learners.length : 0,
        staffCount: staffList.length,
        teachingCount: staffMetrics.teachingCount,
        nonTeachingCount: staffMetrics.nonTeachingCount,
        attendanceCount: Array.isArray(db.attendance) ? db.attendance.length : 0,
        feesCount: Array.isArray(db.fees) ? db.fees.length : 0,
        marksCount: Array.isArray(db.marks) ? db.marks.length : 0
      });
    } catch (e) {
      console.error("Error loading central data metrics:", e);
    }
  };

  useEffect(() => {
    loadMetrics();

    const handleDataChanged = () => {
      loadMetrics();
    };

    window.addEventListener('munyaka_data_changed', handleDataChanged);
    window.addEventListener('munyaka:data-changed', handleDataChanged);
    window.addEventListener('staff-changed', handleDataChanged);

    return () => {
      window.removeEventListener('munyaka_data_changed', handleDataChanged);
      window.removeEventListener('munyaka:data-changed', handleDataChanged);
      window.removeEventListener('staff-changed', handleDataChanged);
    };
  }, []);

  const handleExport = () => {
    try {
      exportMasterDatabase();
      toast.success("Master database successfully exported!");
    } catch (e) {
      toast.error("Failed to export master database.");
    }
  };

  const handleResetDB = () => {
    if (confirm("Are you sure you want to reset the central database? All custom records will be reinitialized.")) {
      CentralDataService.initializeDefaultDB();
      loadMetrics();
      toast.success("Central database reset successfully.");
      window.dispatchEvent(new Event('munyaka_data_changed'));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" /> Central Data & Master Database Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sole authority engine (<span className="font-mono font-semibold text-indigo-600">munyaka_central_db</span>) for school system records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={loadMetrics}
            variant="outline"
            className="rounded-xl flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Stats
          </Button>
          <Button
            onClick={handleExport}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" /> Export Master Sync Package
          </Button>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase text-slate-500">Total Learners</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{dbStats.learnersCount}</div>
            <p className="text-xs text-slate-500 mt-1">Registered students</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase text-slate-500">Teaching Staff</CardTitle>
            <GraduationCap className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{dbStats.teachingCount}</div>
            <p className="text-xs text-slate-500 mt-1">Teachers & academic staff</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase text-slate-500">Non-Teaching Staff</CardTitle>
            <Briefcase className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{dbStats.nonTeachingCount}</div>
            <p className="text-xs text-slate-500 mt-1">Support & administration</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase text-slate-500">Total Staff Registered</CardTitle>
            <Users className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{dbStats.staffCount}</div>
            <p className="text-xs text-slate-500 mt-1">Total combined staff</p>
          </CardContent>
        </Card>
      </div>

      {/* Database Operations Card */}
      <Card className="border shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> System Synchronization Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-2xl border bg-slate-50 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Master Key</span>
              <p className="font-mono text-sm font-bold text-slate-800">munyaka_central_db</p>
              <p className="text-xs text-slate-500">Single unified state tree for all modules.</p>
            </div>
            <div className="p-4 rounded-2xl border bg-slate-50 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Legacy Purge</span>
              <p className="font-mono text-sm font-bold text-rose-600">Active</p>
              <p className="text-xs text-slate-500">Automatically purges legacy localStorage keys on save.</p>
            </div>
            <div className="p-4 rounded-2xl border bg-slate-50 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Real-Time Events</span>
              <p className="font-mono text-sm font-bold text-emerald-600">Listening</p>
              <p className="text-xs text-slate-500">Dispatches and listens to <code className="text-xs">munyaka_data_changed</code>.</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-xs text-slate-500">Need to reset store or reinitialize default seed data?</span>
            <Button
              onClick={handleResetDB}
              variant="destructive"
              className="rounded-xl text-xs"
            >
              Reset Central Database
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
