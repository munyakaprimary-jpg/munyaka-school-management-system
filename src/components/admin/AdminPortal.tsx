import React from 'react';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import StaffRegistry from '@/components/StaffRegistry';
import AttendanceMonitor from '@/pages/AttendanceMonitor';
import Fees from '@/pages/Fees';
import Students from '@/pages/Students';

import { Button } from '@/components/ui/button';
import { Cloud, RefreshCw } from 'lucide-react';
import { processBatchSyncExport, hydrateDataFromSupabase } from '@/hooks/useSyncQueue';
import { useState, useEffect } from 'react';

export function AdminPortal() {
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    hydrateDataFromSupabase();
  }, []);

  const handleCloudSync = async () => {
    setIsSyncing(true);
    await processBatchSyncExport();
    setIsSyncing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Supabase Cloud Sync Engine</h3>
            <p className="text-xs text-slate-500">Batch export local attendance, marks, and registry to Supabase cloud master backend.</p>
          </div>
        </div>
        <Button
          onClick={handleCloudSync}
          disabled={isSyncing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing to Cloud...' : 'Run Cloud Sync'}</span>
        </Button>
      </div>

      <AdminDashboard />
    </div>
  );
}
