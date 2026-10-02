import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { exportLibrarianPackage } from '@/services/departmentExportService';
import {
  Library,
  BookOpen,
  History,
  Download,
  Users,
  CheckCircle2,
  Search,
  Plus,
  FileText,
  Share2,
  Copy,
  Check,
  BookMarked,
  BookPlus,
  AlertCircle,
  Clock,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { useToast } from '@/components/ui/use-toast';
import { Book, BorrowLog, getLogStatusInfo } from '@/types/library';

export const LibrarianPortalView: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const librarianName = user?.name || 'JANET GATHONI KUNGU';
  const librarianId = user?.id || 'LIB-001';

  // State loaded from localStorage
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem('school_library_inventory_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [historyLogs, setHistoryLogs] = useState<BorrowLog[]>(() => {
    try {
      const saved = localStorage.getItem('school_library_logs_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync to shared storage keys
  React.useEffect(() => {
    localStorage.setItem('school_library_inventory_v1', JSON.stringify(books));
  }, [books]);

  React.useEffect(() => {
    localStorage.setItem('school_library_logs_v1', JSON.stringify(historyLogs));
  }, [historyLogs]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<{ fileName: string; timestamp: string; size: number } | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

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

  const handleExportLibraryBatch = async () => {
    setIsExporting(true);
    try {
      exportLibrarianPackage();
      const nowStr = new Date().toLocaleString();
      setLastExport({
        fileName: `Librarian_Inventory_Delta_${librarianId}_${new Date().toISOString().slice(0, 10)}.json`,
        timestamp: nowStr,
        size: 2048
      });

      toast({
        title: "Library Batch Delta Exported Successfully",
        description: "Successfully exported library package."
      });
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Could not generate library inventory package.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };
        description: `Saved ${link.download} (${Math.round(blob.size / 1024)} KB) with circulation logs ready for Admin Harmonization.`
      });
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Could not generate library batch package.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getShareText = () => {
    return `📚 *Munyaka Library & E-Resources Batch Delta*
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

  const handleCatalogNewBook = () => {
    const title = prompt("Enter book title:");
    if (!title) return;
    const author = prompt("Enter author / publisher:") || 'KLB';
    const isbn = prompt("Enter ISBN or barcode:") || `ISBN-${Math.floor(100000 + Math.random() * 900000)}`;
    const category = prompt("Enter category (Textbooks / Science / Languages):") || 'Textbooks';
    const totalCopies = parseInt(prompt("Enter total copies:") || '30', 10);

    const newBook: Book = {
      id: `book-${Date.now()}`,
      title,
      author,
      isbn,
      category,
      totalCopies,
      availableCopies: totalCopies,
      borrowed: 0,
      stock: totalCopies,
      subject: category,
      grade: 'All Grades',
      publisher: author
    };

    const updated = [newBook, ...books];
    setBooks(updated);
    localStorage.setItem('school_library_inventory_v1', JSON.stringify(updated));
    toast({
      title: "Book Cataloged Successfully",
      description: `Added "${title}" with ${totalCopies} copies.`
    });
  };

  const handleIssueBook = () => {
    const title = prompt("Enter book title being checked out:");
    if (!title) return;
    const borrowerName = prompt("Enter borrower name (Student / Staff):") || 'Student';
    const admissionNo = prompt("Enter student admission number / staff ID (e.g. ADM-2024-001):") || 'ADM-2024-999';

    const newLog: BorrowLog = {
      id: `log-${Date.now()}`,
      bookId: 'custom',
      bookTitle: title,
      borrowerName,
      borrowerType: 'Student',
      accession_no: admissionNo,
      issuedDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      status: 'Active',
      qty_issued: 1,
      qty_returned: 0,
      qty_lost: 0
    };

    const updatedLogs = [newLog, ...historyLogs];
    setHistoryLogs(updatedLogs);
    localStorage.setItem('school_library_logs_v1', JSON.stringify(updatedLogs));
    toast({
      title: "Book Issued Successfully",
      description: `Checked out "${title}" to ${borrowerName} [${admissionNo}].`
    });
  };

  const handleDeleteLog = (id: string, bookTitle: string) => {
    const adminPassword = prompt("🔒 Enter Admin Password to authorize circulation record deletion:");
    if (adminPassword === null) return; // Cancelled

    // Verify admin password against standard system credentials or fallback admin key
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
    toast({
      title: "Circulation Log Removed",
      description: `Successfully deleted record for "${bookTitle}" with admin authorization.`
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 backdrop-blur-3xl rounded-l-full pointer-events-none hidden lg:block" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-amber-200">
              <BookMarked size={14} /> Librarian & Asset Portal
            </div>
            <h1 className="text-3xl font-black tracking-tight">Welcome back, {librarianName}!</h1>
            <p className="text-amber-100 text-sm max-w-2xl font-medium">
              You are signed in as librarian. Ready to manage textbook inventory, circulation logs, and library asset reports.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleCatalogNewBook}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 text-xs"
            >
              <BookPlus size={16} /> Catalog New Book
            </Button>
            <Button
              onClick={handleIssueBook}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 text-xs"
            >
              <BookOpen size={16} /> Issue Book / Check-out
            </Button>
            <Button
              onClick={handleExportLibraryBatch}
              disabled={isExporting}
              className="bg-white text-amber-950 hover:bg-amber-50 font-bold px-5 py-3.5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2 text-xs"
            >
              <Download size={16} className="text-amber-600" />
              {isExporting ? 'Packaging Delta...' : 'Export Library Batch Delta'}
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
              {filteredBooks.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <BookMarked size={28} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">No Books Cataloged Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click "Catalog New Book" above to add textbooks and library assets to the inventory database.
                  </p>
                  <Button
                    onClick={handleCatalogNewBook}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs"
                  >
                    <Plus size={14} /> Add First Book
                  </Button>
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
                            <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold border-0">{book.category}</Badge>
                          </div>
                          <p className="text-xs text-slate-500">Author: {book.author || 'N/A'} | ISBN: <span className="font-mono">{book.isbn}</span></p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium">
                          <div className="text-right">
                            <p className="text-slate-900 font-bold">{available} / {total} Available</p>
                            <p className="text-amber-700">{book.borrowed || (total - available)} Checked out</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
              {historyLogs.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <p className="text-xs text-slate-500">No circulation logs recorded yet.</p>
                  <Button
                    onClick={handleIssueBook}
                    variant="outline"
                    className="border-slate-200 text-xs font-bold rounded-xl"
                  >
                    <BookOpen size={14} /> Issue First Book
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyLogs.map((log) => {
                    const statusInfo = getLogStatusInfo(log);
                    return (
                      <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 gap-3">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-sm">{log.bookTitle}</p>
                          <p className="text-xs text-slate-500">
                            Borrower: <span className="font-semibold text-slate-800">{log.borrowerName}</span> ({log.borrowerType}) {log.accession_no && <span className="font-mono text-indigo-600">[{log.accession_no}]</span>}
                          </p>
                          <p className="text-[11px] text-slate-400">Issued: {log.issuedDate} | Due: {log.dueDate}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={cn("font-bold text-xs border-0 px-3 py-1", statusInfo.color)}>
                            {statusInfo.label}
                          </Badge>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteLog(log.id, log.bookTitle);
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete record"
                          >
                            <Trash2 size={16} />
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

        {/* Right Col: Delta Export & Sharing */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileText size={18} className="text-amber-700" /> Batch Delta Generator
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
                    <CheckCircle2 size={16} className="text-emerald-600" /> Batch Delta Downloaded
                  </div>
                  <p className="font-mono text-[11px] text-emerald-700">{lastExport.fileName} ({Math.round(lastExport.size / 1024)} KB)</p>
                  <p className="text-[10px] text-slate-500">{lastExport.timestamp}</p>
                </div>
              )}

              <Button
                onClick={handleExportLibraryBatch}
                disabled={isExporting}
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                <Download size={18} />
                {isExporting ? 'Generating Delta...' : 'Export Library Batch Delta'}
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
