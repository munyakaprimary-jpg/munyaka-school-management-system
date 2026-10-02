import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle2, AlertCircle, ShieldCheck, Database, RefreshCw, Trash2, ArrowRight } from 'lucide-react';
import { harmonizationService, HarmonizationAuditItem } from '@/services/harmonizationService';
import { useToast } from '@/components/ui/use-toast';

export const AdminHarmonizationHub: React.FC = () => {
  const { toast } = useToast();
  const [auditItems, setAuditItems] = useState<HarmonizationAuditItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isHarmonizing, setIsHarmonizing] = useState(false);
  const [harmonizationResult, setHarmonizationResult] = useState<{ successCount: number; errors: string[] } | null>(null);

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

          <div className="flex items-center gap-3">
            <label className="cursor-pointer bg-white text-emerald-900 hover:bg-emerald-50 font-bold px-6 py-3.5 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2">
              <Upload size={18} className="text-emerald-600" />
              <span>{isUploading ? 'Parsing Files...' : 'Upload Teacher Export(s)'}</span>
              <input 
                type="file" 
                accept=".json,application/json" 
                multiple 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>
          </div>
        </div>
      </div>

      {/* Audit Dashboard Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Uploaded Packages</p>
              <h3 className="text-3xl font-black text-slate-900">{auditItems.length}</h3>
              <p className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1">
                <CheckCircle2 size={12} /> Ready for audit
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
              <FileText size={28} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Records Queued</p>
              <h3 className="text-3xl font-black text-slate-900">
                {auditItems.reduce((acc, item) => acc + item.attendanceCount + item.checkInCount + item.assessmentCount + item.inventoryCount, 0)}
              </h3>
              <p className="text-xs font-medium text-blue-600 flex items-center gap-1 mt-1">
                <Database size={12} /> Stream isolated
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
              <Database size={28} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Harmonization Status</p>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 mt-1">
                <span className={`w-3 h-3 rounded-full ${auditItems.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
                {harmonizationResult ? 'Harmonized' : auditItems.length > 0 ? 'Pending Merge' : 'Awaiting Files'}
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Zero cross-stream mix-ups
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
              <ShieldCheck size={28} />
            </div>
          </CardContent>
        </Card>
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
                      <th className="py-3 px-4">Teacher & ID</th>
                      <th className="py-3 px-4">Grade & Stream</th>
                      <th className="py-3 px-4">Last Updated Timestamp</th>
                      <th className="py-3 px-4">Records Breakdown</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {auditItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-900">
                          <div>{item.header.teacherName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.header.teacherId}</div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 font-bold text-xs">
                            {item.header.assignedGrade} · {item.header.assignedStream}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-medium">
                          {new Date(item.header.timestamp).toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-medium space-x-2">
                          <span className="inline-block bg-slate-100 px-2 py-0.5 rounded-md">Att: {item.attendanceCount}</span>
                          <span className="inline-block bg-slate-100 px-2 py-0.5 rounded-md">Marks: {item.assessmentCount}</span>
                          <span className="inline-block bg-slate-100 px-2 py-0.5 rounded-md">Check-in: {item.checkInCount}</span>
                        </td>
                        <td className="py-4 px-4">
                          {item.status === 'harmonized' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-bold">Harmonized</Badge>
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
    </div>
  );
};

export default AdminHarmonizationHub;
