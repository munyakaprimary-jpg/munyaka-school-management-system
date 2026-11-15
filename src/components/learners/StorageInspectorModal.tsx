import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, HardDrive, RefreshCw, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import { mergeStoredLearners, saveMergedLearners } from '@/utils/learnerStorageMerge';

const STORAGE_KEYS_TO_SCAN = [
  'munyaka_learners_directory',
  'munyaka_learners',
  'munyaka_learners_v2',
  'school_learners_data',
  'munyaka_central_db',
  'munyaka_students',
  'munyaka_master_learners',
  'munyaka_app_learners_v1'
];

export const StorageInspectorModal: React.FC = () => {
  const [scanResults, setScanResults] = useState<Array<{ key: string; count: number; sample: string[]; error?: string }>>([]);
  const [unifiedLearners, setUnifiedLearners] = useState<any[]>([]);

  const runScan = () => {
    const results: any[] = [];
    for (const key of STORAGE_KEYS_TO_SCAN) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) {
          results.push({ key, count: 0, sample: [] });
          continue;
        }
        const parsed = JSON.parse(raw);
        let list: any[] = [];
        if (Array.isArray(parsed)) {
          list = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.learners)) list = parsed.learners;
          else if (Array.isArray(parsed.students)) list = parsed.students;
          else if (Array.isArray(parsed.data)) list = parsed.data;
          else if (Array.isArray(parsed.records)) list = parsed.records;
        }
        const sample = list.slice(0, 3).map((l: any) => l.fullName || l.name || l.studentName || l.admissionNo || 'Unnamed');
        results.push({ key, count: list.length, sample });
      } catch (e: any) {
        results.push({ key, count: 0, sample: [], error: e.message });
      }
    }
    setScanResults(results);
    const merged = mergeStoredLearners();
    setUnifiedLearners(merged);
  };

  useEffect(() => {
    runScan();
  }, []);

  const handleSyncAll = () => {
    const merged = mergeStoredLearners();
    saveMergedLearners(merged);
    runScan();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            Learner Storage & Database Inspector
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Scanning all browser localStorage keys for registered learners and synchronization status.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runScan} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Re-scan Keys
          </Button>
          <Button onClick={handleSyncAll} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <CheckCircle2 className="w-4 h-4" /> Consolidate & Sync All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-indigo-100 bg-indigo-50/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-indigo-900 font-medium">Unified Unique Learners</CardDescription>
            <CardTitle className="text-3xl font-bold text-indigo-600 flex items-center gap-2">
              <Users className="w-8 h-8" /> {unifiedLearners.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-indigo-700">Total deduplicated learners ready across active app sessions.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Storage Keys Breakdown</CardTitle>
          <CardDescription>Detailed count and content sample for each localStorage key.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scanResults.map((res) => (
              <div key={res.key} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-slate-500" />
                    <code className="text-xs font-mono font-bold text-slate-800 bg-slate-200/70 px-2 py-0.5 rounded">
                      {res.key}
                    </code>
                    {res.count > 0 ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">{res.count} records</Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400">Empty / Missing</Badge>
                    )}
                  </div>
                  {res.sample.length > 0 && (
                    <p className="text-xs text-slate-500 pl-6">
                      Sample: <span className="text-slate-700 font-medium">{res.sample.join(', ')}</span>
                    </p>
                  )}
                  {res.error && (
                    <p className="text-xs text-rose-600 pl-6 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Parse error: {res.error}
                    </p>
                  )}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {res.count > 0 ? `${Math.round(JSON.stringify(localStorage.getItem(res.key) || '').length / 1024)} KB` : '0 KB'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageInspectorModal;
