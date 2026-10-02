import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Library, 
  BookOpen, 
  History, 
  Download, 
  Users, 
  CheckCircle2, 
  Search, 
  Upload, 
  FileText, 
  ShieldCheck, 
  Trash2,
  RefreshCw,
  Database,
  BookMarked,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Book, BorrowLog, getLogStatusInfo } from '@/types/library';
import { harmonizationService, HarmonizationAuditItem } from '@/services/harmonizationService';

export const Library: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const adminName = user?.name || 'ADMINISTRATOR';
  const adminId = user?.id || 'ADM-001';

  // State loaded from shared storage
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem('school_library_inventory_v1') || localStorage.getItem('munyaka_library_books');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [historyLogs, setHistoryLogs] = useState<BorrowLog[]>(() => {
    try {
      const saved = localStorage.getItem('school_library_logs_v1') || localStorage.getItem('munyaka_library_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [auditItems, setAuditItems] = useState<HarmonizationAuditItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isHarmonizing, setIsHarmonizing] = useState(false);
  const [harmonizationResult, setHarmonizationResult] = useState<{ successCount: number; errors: string[] } | null>(null);

  // Quick statistics
  const totalBooksCount = books.reduce((acc, b) => acc + (b.totalCopies || b.stock || 0), 0);
  const availableBooksCount = books.reduce((acc, b) => acc + (b.availableCopies || (b.totalCopies || b.stock || 0) - (b.borrowed || 0)), 0);
  const activeCirculation = historyLogs.filter(l => l.status === 'Active' || l.status === 'Issued').length;
  const lostDamagedCount = historyLogs.filter(l => l.status === 'Lost' || l.status === 'Damaged' || (l.qty_lost && l.qty_lost > 0)).length;

  const filteredBooks = useMemo(() => {
    return books.filter(b => 
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.isbn.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [books, searchQuery]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newItems: HarmonizationAuditItem[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const item = await harmonizationService.parseExportFile(files[i]);
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
        title: `Loaded ${newItems.length} Staff Package(s)`,
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
    e.target.value = '';
  };

  const handleHarmonizeAndMerge = () => {
    if (auditItems.length === 0) return;

    setIsHarmonizing(true);
    try {
      const result = harmonizationService.harmonizeAndMerge(auditItems);
      setHarmonizationResult(result);

      // Refresh local states
      const savedBooks = localStorage.getItem('school_library_inventory_v1') || localStorage.getItem('munyaka_library_books');
      if (savedBooks) setBooks(JSON.parse(savedBooks));
      const savedLogs = localStorage.getItem('school_library_logs_v1') || localStorage.getItem('munyaka_library_history');
      if (savedLogs) setHistoryLogs(JSON.parse(savedLogs));

      setAuditItems(prev => prev.map(item => ({ ...item, status: 'harmonized' })));

      toast({
        title: "Library Harmonization Complete!",
        description: `Successfully merged ${result.successCount} staff package(s) into master inventory database.`,
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

  const handleDeleteLog = (id: string, bookTitle: string) => {
    const adminPassword = prompt("🔒 Enter Admin Password to authorize circulation record cleanup:");
    if (adminPassword === null) return;

    if (adminPassword !== 'admin123' && adminPassword !== 'Munyaka2025!' && adminPassword !== 'admin') {
      toast({
        title: "Unauthorized",
        description: "Incorrect admin password. Deletion unauthorized.",
        variant: "destructive"
      });
      return;
    }

    const updated = historyLogs.filter(log => log.id !== id);
    setHistoryLogs(updated);
    localStorage.setItem('school_library_logs_v1', JSON.stringify(updated));
    localStorage.setItem('munyaka_library_history', JSON.stringify(updated));
    toast({
      title: "Circulation Log Removed",
      description: `Successfully audited and deleted record for "${bookTitle}".`
    });
  };

  const handleDeleteBook = (id: string, bookTitle: string) => {
    const adminPassword = prompt("🔒 Enter Admin Password to authorize inventory deletion:");
    if (adminPassword === null) return;

    if (adminPassword !== 'admin123' && adminPassword !== 'Munyaka2025!' && adminPassword !== 'admin') {
      toast({
        title: "Unauthorized",
        description: "Incorrect admin password. Deletion unauthorized.",
        variant: "destructive"
      });
      return;
    }

    const updated = books.filter(b => b.id !== id);
    setBooks(updated);
    localStorage.setItem('school_library_inventory_v1', JSON.stringify(updated));
    localStorage.setItem('munyaka_library_books', JSON.stringify(updated));
    toast({
      title: "Book Removed from Master Catalog",
      description: `Successfully deleted "${bookTitle}" with admin audit authorization.`
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans p-6 md:p-8">
      {/* Header Banner - Administrative Oversight */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-8 text-white shadow-2xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-blue-200">
              <ShieldCheck size={14} /> Master Administration Oversight
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Library Harmonization & Audit Hub
            </h1>
            <p className="text-blue-100 text-sm md:text-base max-w-2xl font-medium">
              Supervise institutional library resources, review aggregated circulation logs from librarian portals, and ingest offline batch delta packages with master administrative audit privileges.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="cursor-pointer bg-white text-slate-900 hover:bg-slate-100 font-bold px-6 py-3.5 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 text-xs">
              <Upload size={18} className="text-blue-600" />
              <span>{isUploading ? 'Parsing Batch...' : 'Import Staff Batch Package (.json)'}</span>
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

      {/* Oversight Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Catalog Titles</p>
              <h3 className="text-3xl font-black text-slate-900">{books.length}</h3>
              <p className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1">
                <CheckCircle2 size={12} /> {totalBooksCount} Total Volumes
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
              <BookMarked size={28} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Available on Shelf</p>
              <h3 className="text-3xl font-black text-slate-900">{availableBooksCount}</h3>
              <p className="text-xs font-medium text-blue-600 flex items-center gap-1 mt-1">
                <Database size={12} /> Ready for issue
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
              <BookOpen size={28} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Circulation</p>
              <h3 className="text-3xl font-black text-blue-600">{activeCirculation}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Checked out by students/staff
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
              <History size={28} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Damaged / Lost</p>
              <h3 className="text-3xl font-black text-rose-600">{lostDamagedCount}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Reported incidents
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner">
              <AlertCircle size={28} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Import Audit Review (When files uploaded) */}
      {auditItems.length > 0 && (
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden border-2 border-indigo-100">
          <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between bg-indigo-50/30">
            <div>
              <CardTitle className="text-lg font-black text-slate-900">Staff Batch Package Audit Queue</CardTitle>
              <CardDescription className="text-xs">Reviewing imported offline JSON packages before merging into master database</CardDescription>
            </div>
            <Button
              onClick={handleHarmonizeAndMerge}
              disabled={isHarmonizing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 text-xs"
            >
              <RefreshCw size={16} className={isHarmonizing ? "animate-spin" : ""} />
              {isHarmonizing ? 'Harmonizing...' : 'Harmonize & Merge into Master'}
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {auditItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span>{item.fileName}</span>
                      <Badge className="bg-indigo-100 text-indigo-800 text-[10px] uppercase font-bold">{item.metadata.role}</Badge>
                    </div>
                    <p className="text-slate-500 font-mono text-[11px]">Staff ID: {item.metadata.staffId} | Type: {item.metadata.packageType}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 font-medium">Status: <strong className="text-indigo-600 capitalize">{item.status}</strong></span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAuditItems(prev => prev.filter(a => a.id !== item.id))}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid: Consolidated Inventory & Master Circulation Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Master Inventory Catalog */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold">Consolidated Master Inventory Catalog</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Real-time oversight of all school books and library assets across departments.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                  <Input
                    placeholder="Search catalog..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 rounded-xl border-slate-200 text-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {filteredBooks.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <BookMarked size={32} className="text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">No books registered in the master catalog yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBooks.map((book) => {
                    const total = book.totalCopies ?? book.stock ?? 0;
                    const available = book.availableCopies ?? (total - (book.borrowed || 0));
                    return (
                      <div key={book.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{book.title}</span>
                            <Badge className="bg-slate-200 text-slate-700 text-[10px] font-bold border-0">{book.category}</Badge>
                          </div>
                          <p className="text-xs text-slate-500">Author: {book.author || 'N/A'} | ISBN: <span className="font-mono">{book.isbn}</span></p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium">
                          <div className="text-right">
                            <p className="text-slate-900 font-bold">{available} / {total} Available</p>
                            <p className="text-amber-700">{book.borrowed || (total - available)} Checked out</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBook(book.id, book.title)}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl h-8 w-8 p-0"
                            title="Admin Audit Delete"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Aggregated Master Circulation Feed with Admin Audit Deletion */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <History size={18} className="text-indigo-700" /> Master Circulation Feed
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Aggregated activity logs with administrator audit and cleanup privileges.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {historyLogs.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <p className="text-xs text-slate-500">No active circulation logs recorded across portals.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyLogs.map((log) => {
                    const statusInfo = getLogStatusInfo(log);
                    return (
                      <div key={log.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900 text-sm">{log.bookTitle}</p>
                          <Badge className={cn("font-bold text-xs border-0 px-2.5 py-0.5", statusInfo.color)}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          Borrower: <span className="font-semibold text-slate-800">{log.borrowerName}</span> ({log.borrowerType}) {log.accession_no && <span className="font-mono text-indigo-600">[{log.accession_no}]</span>}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-400">
                          <span>Due: {log.dueDate}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteLog(log.id, log.bookTitle);
                            }}
                            className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                            title="Admin Audit Delete"
                          >
                            <Trash2 size={12} /> Audit Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Library;
