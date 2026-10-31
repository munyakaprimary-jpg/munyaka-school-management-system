import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle2, AlertCircle, ShieldCheck, Database, RefreshCw, Trash2, ArrowRight, PackageOpen, Download } from 'lucide-react';
import { harmonizationService, HarmonizationAuditItem } from '@/services/harmonizationService';
import { exportMasterDatabase, exportMasterSyncPackage } from '@/utils/exportMasterDatabase';
import { importMasterSyncPackage } from '@/utils/importMasterSyncPackage';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export const AdminHarmonizationHub: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = (user?.role as string) === 'admin' || (user?.role as string) === 'head_teacher' || (user?.role as string) === 'owner';
  const [auditItems, setAuditItems] = useState<HarmonizationAuditItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isHarmonizing, setIsHarmonizing] = useState(false);
  const [isImportingMaster, setIsImportingMaster] = useState(false);
  const [harmonizationResult, setHarmonizationResult] = useState<{ successCount: number; errors: string[] } | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>(() => {
    try {
      const explicitActivities = JSON.parse(localStorage.getItem('munyaka_admin_activities') || '[]');
      const libraryHistory = JSON.parse(localStorage.getItem('munyaka_library_history') || '[]');
      const libraryBooks = JSON.parse(localStorage.getItem('munyaka_library_books') || '[]');
      
      const libraryLogsAsActivities = libraryHistory.map((l: any) => ({
        id: 'lib-act-' + l.id,
        staffId: 'LIBRARIAN',
        role: 'librarian',
        packageType: 'CIRCULATION_LOG',
        fileName: 'library_circulation.json',
        timestamp: l.issuedDate || new Date().toISOString(),
        details: `Library circulation: Checked out "${l.bookTitle}" to ${l.borrowerName} (${l.borrowerType}) [Status: ${l.status}]`
      }));

      const combined = [...explicitActivities, ...libraryLogsAsActivities];
      // Sort by timestamp descending
      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return combined;
    } catch {
      return [];
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newItems: HarmonizationAuditItem[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const item = await harmonizationService.parseExportFile(files[i]);
        // Avoid duplicates by file name or teacher ID
        const exists = auditItems.some(existing => existing.fileName === item.fileName);
        if (!exists) {
          newItems.push(item);
        }
      } catch (err: any) {
        errors.push(err.message);
      }
    }

    if (newItems.length > 0) {
      setAuditItems(prev => [...prev, ...newItems]);
      toast({
        title: `Loaded ${newItems.length} Class Package(s)`,
        description: "Metadata headers parsed successfully for audit review.",
      });
    }

    if (errors.length > 0) {
      toast({
        title: "Some files failed to parse",
        description: errors[0],
        variant: "destructive"
      });
    }

    setIsUploading(false);
    // Reset input
    e.target.value = '';
  };

  const handleRemoveItem = (id: string) => {
    setAuditItems(prev => prev.filter(item => item.id !== id));
  };

  const handleHarmonizeAndMerge = () => {
    if (auditItems.length === 0) return;

    setIsHarmonizing(true);
    try {
      const result = harmonizationService.harmonizeAndMerge(auditItems);
      setHarmonizationResult(result);

      // Save activity log to localStorage for recent activities feed
      try {
        const storedActivities = JSON.parse(localStorage.getItem('munyaka_admin_activities') || '[]');
        const newActivities = auditItems.map(item => ({
          id: 'act-' + Math.random().toString(36).substring(2, 9),
          staffId: item.metadata.staffId,
          role: item.metadata.role,
          packageType: item.metadata.packageType,
          fileName: item.fileName,
          timestamp: new Date().toISOString(),
          details: `Harmonized ${item.attendanceCount} attendance, ${item.assessmentCount} assessment & ${item.inventoryCount} inventory records.`
        }));
        localStorage.setItem('munyaka_admin_activities', JSON.stringify([...newActivities, ...storedActivities]));
      } catch {}

      // Mark items as harmonized
      setAuditItems(prev => prev.map(item => ({ ...item, status: 'harmonized' })));

      toast({
        title: "Harmonization Complete!",
        description: `Successfully merged ${result.successCount} teacher package(s) into master database without stream mix-ups.`,
      });
    } catch (err: any) {
      toast({
        title: "Harmonization Error",
        description: err.message || "Failed to merge records into master database.",
        variant: "destructive"
      });
    } finally {
      setIsHarmonizing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full font-sans p-6 md:p-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 p-8 text-white shadow-2xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-emerald-200">
              <ShieldCheck size={14} /> Admin Harmonization Hub
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Offline Batch File Harmonization
            </h1>
            <p className="text-emerald-100 text-sm md:text-base max-w-xl font-medium">
              Upload or select teacher export packages (.json) to audit metadata headers and safely route attendance, check-ins, and marks into master database tables.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isAdmin && (
              <Button
                onClick={() => exportMasterSyncPackage()}
                className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold px-5 py-3.5 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2.5 border border-white/30"
              >
                <PackageOpen size={18} className="text-emerald-600" />
                <span>Export Master Sync Package</span>
              </Button>
            )}

            <label className="cursor-pointer bg-white text-teal-950 hover:bg-teal-50 font-bold px-5 py-3.5 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2.5 border border-white/30">
              <Upload size={18} className="text-teal-600" />
              <span>{isUploading ? 'Parsing Files...' : 'Upload Teacher Export(s)'}</span>
              <input
                type="file"
                accept=".json,application/json"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <label className="cursor-pointer bg-[#CCFF00] hover:bg-[#b8e600] text-slate-950 font-bold px-5 py-3.5 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2.5">
              <Upload size={18} className="text-slate-900" />
              <span>{isImportingMaster ? 'Syncing Master...' : 'Import Master Sync Package'}</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIsImportingMaster(true);
                  try {
                    const result = await importMasterSyncPackage(file);
                    if (result.success) {
                      toast({
                        title: "Success",
                        description: result.message || 'Master sync package imported successfully!',
                      });
                      setTimeout(() => window.location.reload(), 1200);
                    } else {
                      toast({
                        title: "Error",
                        description: result.message || 'Failed to import master sync package.',
                        variant: "destructive",
                      });
                    }
                  } catch (err: any) {
                    toast({
                      title: "Error",
                      description: err?.message || 'Failed to import master sync package.',
                      variant: "destructive",
                    });
                  } finally {
                    setIsImportingMaster(false);
                    e.target.value = '';
                  }
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Audit Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Uploaded Packages Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Uploaded Packages</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{auditItems.length}</h3>
            <p className="text-xs text-emerald-600 font-bold">Ready for audit</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <FileText size={24} />
          </div>
        </div>

        {/* Total Records Queued Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Records Queued</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {auditItems.reduce((acc, item) => acc + item.attendanceCount + item.assessmentCount + item.inventoryCount, 0)}
            </h3>
            <p className="text-xs text-blue-600 font-bold">Stream isolated</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Database size={24} />
          </div>
        </div>

        {/* Harmonization Status Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Harmonization Status</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {auditItems.length === 0 ? 'Awaiting Files' : `${auditItems.filter(i => i.status === 'harmonized').length} Harmonized`}
            </h3>
            <p className="text-xs text-slate-500 font-semibold">Zero cross-stream mix-ups</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <ShieldCheck size={24} />
          </div>
        </div>
      </div>

      {/* Audit Review Table */}
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black text-slate-900">Audit Review Dashboard</CardTitle>
            <CardDescription className="text-xs">Inspecting metadata headers and record counts for uploaded teacher files</CardDescription>
          </div>
          {auditItems.length > 0 && (
            <Button
              onClick={handleHarmonizeAndMerge}
              disabled={isHarmonizing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
            >
              <RefreshCw size={16} className={isHarmonizing ? "animate-spin" : ""} />
              {isHarmonizing ? 'Harmonizing...' : 'Harmonize & Merge Master Hub'}
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-6">
          {auditItems.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
                <Upload size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-lg">No Teacher Export Files Uploaded</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click the "Upload Teacher Export(s)" button above to select master class package JSON files exported by teachers from their dashboard.
                </p>
              </div>
              <label className="inline-cursor cursor-pointer inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-2xl shadow-md text-xs transition-transform active:scale-95">
                <Upload size={16} /> Select Export Files (.json)
                <input
                  type="file"
                  accept=".json,application/json"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Sender & Staff ID</th>
                      <th className="py-3 px-4">Department / Stream</th>
                      <th className="py-3 px-4">Export Timestamp</th>
                      <th className="py-3 px-4">Package Type & Details</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {auditItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-900">
                          <div>{item.metadata.senderName || item.header?.teacherName || item.metadata.staffId || 'Unknown Staff'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {item.metadata.staffId || item.header?.teacherId || 'N/A'} · <span className="uppercase text-emerald-600">{item.metadata.role || 'Staff'}</span></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 font-bold text-xs w-fit">
                              {item.metadata.assignedClass || item.metadata.departmentOrStream || item.header?.assignedGrade || 'General'} · {item.metadata.assignedStream || item.header?.assignedStream || 'Green'}
                            </Badge>
                            {item.hasStreamMismatch && (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 font-bold text-[10px] w-fit flex items-center gap-1" title={item.streamMismatchReason}>
                                <AlertCircle size={10} /> Stream Mismatch Warning
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-medium">
                          {new Date(item.metadata.exportedAt || item.metadata.timestamp || item.header?.timestamp || Date.now()).toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-medium space-x-2">
                          <span className="inline-block bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-mono text-slate-700">{item.metadata.packageType || 'PACKAGE'}</span>
                          {item.attendanceCount > 0 && <span className="inline-block bg-slate-100 px-2 py-0.5 rounded-md">Att: {item.attendanceCount}</span>}
                          {item.assessmentCount > 0 && <span className="inline-block bg-slate-100 px-2 py-0.5 rounded-md">Marks: {item.assessmentCount}</span>}
                          {item.inventoryCount > 0 && <span className="inline-block bg-slate-100 px-2 py-0.5 rounded-md">Items: {item.inventoryCount}</span>}
                        </td>
                        <td className="py-4 px-4">
                          {item.status === 'harmonized' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-bold">Harmonized</Badge>
                          ) : item.hasStreamMismatch ? (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 font-bold animate-pulse">Mismatch Lock</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 font-bold">Pending Review</Badge>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {harmonizationResult && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">Successfully Harmonized {harmonizationResult.successCount} Teacher Package(s)</p>
                      <p className="text-emerald-700">All attendance, check-ins, CBC assessment rubrics, and inventory records have been safely routed into master database tables without cross-stream mix-ups.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Staff Activities & Imported Batches Feed */}
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100">
          <CardTitle className="text-lg font-black text-slate-900">Recent Staff Activities & Imported Batches</CardTitle>
          <CardDescription className="text-xs">Chronological feed of staff batch packages harmonized into the master database</CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {recentActivities.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
                <FileText size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-sm">No Recent Activity Logged</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Import staff batch packages to harmonize records. Harmonized imports will appear here in chronological order with staff and timestamp metadata.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((act, idx) => (
                <div key={act.id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs font-mono">{act.packageType}</span>
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] font-bold uppercase">
                        {act.role || 'staff'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{act.details}</p>
                    <p className="text-[10px] text-slate-400 font-mono">File: {act.fileName} · Staff ID: {act.staffId}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-medium shrink-0">
                    {new Date(act.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHarmonizationHub;
