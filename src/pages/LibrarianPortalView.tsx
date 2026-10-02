import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Plus, 
  FileText, 
  ShieldCheck, 
  Share2, 
  Copy, 
  Check, 
  BookMarked,
  Layers
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Book, BorrowLog } from '@/types/library';

export const LibrarianPortalView: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const librarianName = user?.name || 'Librarian';
  const librarianId = user?.id || 'LIB-001';

  // State loaded from localStorage
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem('munyaka_library_books');
      return saved ? JSON.parse(saved) : [
        { id: '1', title: 'Spark: English Grade 4', author: 'KLB Publisher', isbn: '978-9966-56-001', category: 'Textbooks', totalCopies: 45, availableCopies: 32, borrowed: 13, subject: 'English', grade: 'Grade 4', publisher: 'KLB' },
        { id: '2', title: 'KLB Mathematics Grade 5', author: 'KLB', isbn: '978-9966-56-002', category: 'Textbooks', totalCopies: 50, availableCopies: 41, borrowed: 9, subject: 'Mathematics', grade: 'Grade 5', publisher: 'KLB' },
        { id: '3', title: 'Junior Secondary Integrated Science', author: 'Longhorn', isbn: '978-9966-56-003', category: 'Science', totalCopies: 30, availableCopies: 18, borrowed: 12, subject: 'Science', grade: 'Grade 7', publisher: 'Longhorn' },
        { id: '4', title: 'Kiswahili Mufti G7', author: 'Moran', isbn: '978-9966-56-004', category: 'Languages', totalCopies: 40, availableCopies: 35, borrowed: 5, subject: 'Kiswahili', grade: 'Grade 7', publisher: 'Moran' }
      ];
    } catch {
      return [];
    }
  });

  const [historyLogs, setHistoryLogs] = useState<BorrowLog[]>(() => {
    try {
      const saved = localStorage.getItem('munyaka_library_history');
      return saved ? JSON.parse(saved) : [
        { id: 'log-1', bookId: '1', bookTitle: 'Spark: English Grade 4', borrowerName: 'Brian Kiptoo', borrowerType: 'Student', studentAdmissionNumber: 'ADM-2024-001', grade: 'Grade 4', stream: 'Blue', issuedDate: '2025-02-10', dueDate: '2025-02-24', status: 'Active', conditionAtIssue: 'Good' },
        { id: 'log-2', bookId: '2', bookTitle: 'KLB Mathematics Grade 5', borrowerName: 'Mary Atieno', borrowerType: 'Student', studentAdmissionNumber: 'ADM-2024-045', grade: 'Grade 5', stream: 'Red', issuedDate: '2025-02-01', dueDate: '2025-02-15', returnedDate: '2025-02-14', status: 'Returned', conditionAtIssue: 'Good', conditionAtReturn: 'Good' },
        { id: 'log-3', bookId: '3', bookTitle: 'Junior Secondary Integrated Science', borrowerName: 'John Kamau', borrowerType: 'Staff', studentAdmissionNumber: 'EMP-012', issuedDate: '2025-01-20', dueDate: '2025-02-05', status: 'Lost', conditionAtIssue: 'Good' }
      ];
    } catch {
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<{ fileName: string; timestamp: string; size: number } | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  // Quick statistics
  const totalBooksCount = books.reduce((acc, b) => acc + (b.totalCopies || 0), 0);
  const availableBooksCount = books.reduce((acc, b) => acc + (b.availableCopies || 0), 0);
  const activeCirculation = historyLogs.filter(l => l.status === 'Active' || l.status === 'Issued').length;
  const lostDamagedCount = historyLogs.filter(l => l.status === 'Lost' || l.status === 'Damaged').length;

  const filteredBooks = useMemo(() => {
    return books.filter(b => 
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.isbn.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [books, searchQuery]);

  const handleExportInventoryDelta = () => {
    setIsExporting(true);
    try {
      const payload = {
        meta: {
          exportType: 'LIBRARIAN_INVENTORY_DELTA',
          librarianId,
          librarianName,
          timestamp: new Date().toISOString(),
          recordCounts: {
            totalBooks: totalBooksCount,
            activeCirculation,
            historyLogs: historyLogs.length
          }
        },
        books,
        historyLogs
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Librarian_Inventory_Delta_${librarianId}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const nowStr = new Date().toLocaleString();
      setLastExport({
        fileName: link.download,
        timestamp: nowStr,
        size: blob.size
      });

      toast({
        title: "Library Delta Package Exported Successfully",
        description: `Saved ${link.download} (${Math.round(blob.size / 1024)} KB) with circulation logs ready for Admin Harmonization.`
      });
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Could not generate inventory delta package.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getShareText = () => {
    return `📚 *Munyaka Library & E-Resources Delta Package*
👤 Librarian: ${librarianName} (ID: ${librarianId})
📖 Total Catalog Titles: ${books.length} (${totalBooksCount} physical copies)
🔄 Active Circulation: ${activeCirculation} books out
⚠️ Damaged/Lost Reports: ${lostDamagedCount}
🕒 Exported: ${new Date().toLocaleString()}
✅ Verified for Admin Harmonization Hub offline import.`;
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(getShareText());
    setCopiedShare(true);
    toast({
      title: "Summary Copied to Clipboard",
      description: "Paste this library status into WhatsApp or local chat channels."
    });
    setTimeout(() => setCopiedShare(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 backdrop-blur-3xl rounded-l-full pointer-events-none hidden lg:block" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-amber-200">
              <BookMarked size={14} /> Librarian & Asset Portal
            </div>
            <h1 className="text-3xl font-black tracking-tight">Library & E-Resources Circulation Hub</h1>
            <p className="text-amber-100 text-sm max-w-2xl font-medium">
              Manage asset circulation, textbook allocations, student borrowing logs, and generate offline inventory delta packages for admin synchronization.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleExportInventoryDelta}
              disabled={isExporting}
              className="bg-white text-amber-950 hover:bg-amber-50 font-bold px-6 py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2 text-sm"
            >
              <Download size={18} className="text-amber-600" />
              {isExporting ? 'Packaging Delta...' : 'Export Inventory Delta (.JSON)'}
            </Button>
          </div>
        </div>
      </div>

      {/* Identity & Status Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Librarian</p>
          <p className="text-base font-extrabold text-slate-900">{librarianName}</p>
          <p className="text-xs font-mono text-amber-600">ID: {librarianId}</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Book Stock</p>
          <p className="text-base font-extrabold text-slate-900">{totalBooksCount} Volumes</p>
          <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 size={12} /> {availableBooksCount} Available on Shelf
          </p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Circulation</p>
          <p className="text-base font-extrabold text-blue-600">{activeCirculation} Issued</p>
          <p className="text-xs text-slate-500">Currently checked out</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Damaged / Lost</p>
          <p className="text-base font-extrabold text-rose-600">{lostDamagedCount} Items</p>
          <p className="text-xs text-slate-500">Recorded incidents</p>
        </Card>
      </div>

      {/* Main Content & Catalog Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Catalog & Circulation Activity */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold">Textbook & Asset Inventory</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Live catalog tracking and book availability status.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                  <Input
                    placeholder="Search books, ISBN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 rounded-xl border-slate-200 text-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {filteredBooks.map((book) => (
                  <div key={book.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{book.title}</span>
                        <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold border-0">{book.category}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">Author: {book.author} | ISBN: <span className="font-mono">{book.isbn}</span></p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium">
                      <div className="text-right">
                        <p className="text-slate-900 font-bold">{book.availableCopies} / {book.totalCopies} Available</p>
                        <p className="text-amber-700">Checked out</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Circulation Logs */}
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <History size={18} className="text-amber-700" /> Recent Circulation Log
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Check-outs, returns, and incident statuses tied to student admission numbers.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {historyLogs.map((log) => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 gap-3">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 text-sm">{log.bookTitle}</p>
                      <p className="text-xs text-slate-500">
                        Borrower: <span className="font-semibold text-slate-800">{log.borrowerName}</span> ({log.borrowerType}) {log.studentAdmissionNumber && <span className="font-mono text-indigo-600">[{log.studentAdmissionNumber}]</span>}
                      </p>
                      <p className="text-[11px] text-slate-400">Issued: {log.issuedDate} | Due: {log.dueDate}</p>
                    </div>
                    <div>
                      <Badge className={cn(
                        "font-bold text-xs border-0 px-3 py-1",
                        log.status === 'Active' || log.status === 'Issued' ? 'bg-blue-100 text-blue-700' :
                        log.status === 'Returned' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-rose-100 text-rose-700'
                      )}>
                        {log.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Delta Export & Sharing */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileText size={18} className="text-amber-700" /> Delta Package Generator
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Bundle library inventory changes for offline admin synchronization.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="font-bold text-slate-900">Librarian Metadata</p>
                  <p className="font-mono text-[11px] text-slate-500">ID: {librarianId} | Name: {librarianName}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="font-bold text-slate-900">Circulation Records</p>
                  <p className="text-slate-500">{historyLogs.length} total activity logs included in package payload.</p>
                </div>
              </div>

              {lastExport && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <CheckCircle2 size={16} className="text-emerald-600" /> Delta Package Downloaded
                  </div>
                  <p className="font-mono text-[11px] text-emerald-700">{lastExport.fileName} ({Math.round(lastExport.size / 1024)} KB)</p>
                  <p className="text-[10px] text-slate-500">{lastExport.timestamp}</p>
                </div>
              )}

              <Button
                onClick={handleExportInventoryDelta}
                disabled={isExporting}
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                <Download size={18} />
                {isExporting ? 'Generating Delta...' : 'Export Inventory Delta Package'}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Share2 size={18} className="text-amber-700" /> Share Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-1.5 overflow-x-auto shadow-inner">
                <p className="text-amber-400 font-bold"># Library Status Summary</p>
                <p>Catalog Titles: {books.length}</p>
                <p>Active Circulation: {activeCirculation}</p>
                <p>Incidents: {lostDamagedCount}</p>
                <p className="text-emerald-400">Status: Delta Ready</p>
              </div>

              <Button
                onClick={handleCopyShare}
                variant="outline"
                className="w-full border-slate-200 hover:bg-slate-50 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-slate-700 text-xs"
              >
                {copiedShare ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                {copiedShare ? 'Copied to Clipboard!' : 'Copy WhatsApp Summary Text'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LibrarianPortalView;
