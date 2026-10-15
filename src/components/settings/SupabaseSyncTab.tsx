import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { Database, Cloud, RefreshCw, CheckCircle2, ShieldCheck, Server, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function SupabaseSyncTab() {
  const { isSyncing, lastSynced, syncError, syncWithCloud } = useSupabaseSync();
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [tableCounts, setTableCounts] = useState<{ learners: number; assessment_marks: number; staff_members: number } | null>(null);

  const testConnection = async () => {
    setTestStatus('testing');
    try {
      const [lRes, mRes, sRes] = await Promise.all([
        supabase.from('learners').select('*', { count: 'exact', head: true }),
        supabase.from('assessment_marks').select('*', { count: 'exact', head: true }),
        supabase.from('staff_members').select('*', { count: 'exact', head: true }),
      ]);

      if (lRes.error) throw lRes.error;
      if (mRes.error) throw mRes.error;
      if (sRes.error) throw sRes.error;

      setTableCounts({
        learners: lRes.count || 0,
        assessment_marks: mRes.count || 0,
        staff_members: sRes.count || 0,
      });

      setTestStatus('success');
      showSuccess('Successfully connected to Supabase cloud tables!');
    } catch (err: any) {
      console.error('Supabase test connection error:', err);
      setTestStatus('error');
      showError(err.message || 'Connection test failed. Verify Supabase tables and RLS policies.');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
        <CardHeader className="px-0 pt-0 pb-6 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Cloud className="text-indigo-600" size={24} /> Supabase Real Cloud Sync Center
            </CardTitle>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-bold px-3 py-1">
              Connected to Project
            </Badge>
          </div>
          <CardDescription>
            Synchronize learners, assessment marks, staff members, attendance, and fee settings in real-time across all connected devices using Supabase PostgreSQL cloud database.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0 pt-6 space-y-6">
          {/* Status Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Server size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Sync Status</p>
                <p className="text-sm font-bold text-slate-900">
                  {isSyncing ? 'Syncing with cloud...' : 'Idle / Up to date'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Last Synchronized</p>
                <p className="text-sm font-bold text-slate-900">
                  {lastSynced ? lastSynced.toLocaleTimeString() : 'Not synced yet'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Database Schema</p>
                <p className="text-sm font-bold text-slate-900">learners, assessment_marks, staff_members</p>
              </div>
            </div>
          </div>

          {syncError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm">
              <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Sync Warning:</span> {syncError}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              onClick={syncWithCloud}
              disabled={isSyncing}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg gap-2 rounded-xl font-bold px-6 h-11"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Now with Cloud
            </Button>

            <Button
              onClick={testConnection}
              disabled={testStatus === 'testing'}
              variant="outline"
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold gap-2 rounded-xl h-11 px-6"
            >
              <Database size={16} />
              {testStatus === 'testing' ? 'Testing Tables...' : 'Test Cloud Tables'}
            </Button>
          </div>

          {/* Test Table Results */}
          {testStatus === 'success' && tableCounts && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Cloud Database Tables Verified Successfully!
              </div>
              <div className="grid grid-cols-3 gap-3 text-center pt-2">
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <p className="text-xs text-muted-foreground">Learners Table</p>
                  <p className="text-lg font-extrabold text-emerald-900">{tableCounts.learners} records</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <p className="text-xs text-muted-foreground">Assessment Marks Table</p>
                  <p className="text-lg font-extrabold text-emerald-900">{tableCounts.assessment_marks} records</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <p className="text-xs text-muted-foreground">Staff Members Table</p>
                  <p className="text-lg font-extrabold text-emerald-900">{tableCounts.staff_members} records</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
