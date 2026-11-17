import React, { useState, useEffect } from 'react';
import { 
  Library, BookOpen, Clock, AlertTriangle, Users, ArrowRight, 
  CheckCircle2, Plus, Search, Filter, RefreshCw, HardDrive, 
  ShieldCheck, FileText, Download, Sparkles, Monitor
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface Book {
  id: string;
  title: string;
  author?: string;
  isbn?: string;
  category?: string;
  totalCopies?: number;
  availableCopies?: number;
  borrowed?: number;
  stock?: number;
}

interface BorrowLog {
  id: string;
  bookTitle?: string;
  title?: string;
  borrowerName?: string;
  studentName?: string;
  dueDate?: string;
  status: string;
  borrowDate?: string;
}

export default function LibraryDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const librarianName = user?.name || 'JANET GATHONI KUNGU';

  const [books, setBooks] = useState<Book[]>([]);
  const [historyLogs, setHistoryLogs] = useState<BorrowLog[]>([]);

  useEffect(() => {
    try {
      const savedBooks = localStorage.getItem('school_library_inventory_v1') || localStorage.getItem('textbook_inventory');
      if (savedBooks) setBooks(JSON.parse(savedBooks));

      const savedLogs = localStorage.getItem('school_library_logs_v1') || localStorage.getItem('munyaka_library_borrowings');
      if (savedLogs) setHistoryLogs(JSON.parse(savedLogs));
    } catch (e) {
      console.error("Failed to load library data", e);
    }
  }, []);

  // Quick statistics
  const totalBooksCount = books.reduce((acc, b) => acc + (b.totalCopies || b.stock || 0), 0);
  const availableBooksCount = books.reduce((acc, b) => acc + (b.availableCopies || (b.totalCopies || b.stock || 0) - (b.borrowed || 0)), 0);
  const activeCirculation = historyLogs.filter(l => l.status === 'Active' || l.status === 'Issued').length;
  const overdueCount = historyLogs.filter(l => {
    if (l.status !== 'Active' && l.status !== 'Issued') return false;
    if (!l.dueDate) return false;
    return new Date(l.dueDate).getTime() < Date.now();
  }).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/20 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-widest text-[11px] font-extrabold px-3 py-1">
                Library Teacher Portal & Workstation
              </Badge>
              <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[11px] font-semibold">
                Online & Synchronized
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Library className="w-9 h-9 text-emerald-400" />
              Library & Learning Resource Center
            </h1>
            <p className="text-slate-400 max-w-2xl text-sm md:text-base">
              Welcome, <span className="text-emerald-300 font-semibold">{librarianName}</span>. Manage textbook inventory, track student book loans, monitor overdue returns, and curate e-resources.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              onClick={() => navigate('/library')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/40 rounded-xl"
            >
              <BookOpen className="w-4 h-4 mr-2" /> Open Library Workspace
            </Button>
            <Button 
              onClick={() => navigate('/study-corner')}
              variant="outline"
              className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200 rounded-xl"
            >
              <Sparkles className="w-4 h-4 mr-2 text-emerald-400" /> Digital Study Corner
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Live KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Catalog Books</p>
              <p className="text-3xl font-extrabold text-white">{totalBooksCount}</p>
              <p className="text-[11px] text-emerald-400 font-medium">{availableBooksCount} Available for Loan</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-7 h-7" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Student Loans</p>
              <p className="text-3xl font-extrabold text-white">{activeCirculation}</p>
              <p className="text-[11px] text-cyan-400 font-medium">Currently Checked Out</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Users className="w-7 h-7" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Returns</p>
              <p className="text-3xl font-extrabold text-white">{overdueCount}</p>
              <p className="text-[11px] text-rose-400 font-medium">Require Follow-up</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Digital E-Resources</p>
              <p className="text-3xl font-extrabold text-white">48</p>
              <p className="text-[11px] text-indigo-400 font-medium">CBC Notes & Past Papers</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-7 h-7" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Circulation & Overdue Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-900/80 border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="text-emerald-400" size={20} /> Recent Circulation Activity
              </h2>
              <p className="text-xs text-slate-400">Latest book loans, returns, and library transactions</p>
            </div>
            <Button onClick={() => navigate('/library')} variant="outline" size="sm" className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="space-y-3">
            {historyLogs.slice(0, 5).map((log, idx) => (
              <div key={log.id || idx} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">{log.bookTitle || log.title || 'General Textbook Loan'}</p>
                  <p className="text-xs text-slate-400">Borrower: <span className="text-emerald-400 font-medium">{log.borrowerName || log.studentName || 'Student'}</span></p>
                </div>
                <div className="text-right space-y-1">
                  <Badge className={
                    log.status === 'Active' || log.status === 'Issued' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                    log.status === 'Overdue' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }>
                    {log.status || 'Returned'}
                  </Badge>
                  <p className="text-[10px] text-slate-500">{log.dueDate ? `Due: ${log.dueDate}` : 'Active Loan'}</p>
                </div>
              </div>
            ))}
            {historyLogs.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">
                No active circulation logs found. Click "Open Library Workspace" to issue books or register inventory.
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions & Library Notice */}
        <Card className="bg-slate-900/80 border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={20} /> Librarian Quick Actions
            </h2>
            <p className="text-xs text-slate-400">Fast shortcuts for daily library management</p>
          </div>

          <div className="space-y-3">
            <Button onClick={() => navigate('/library')} className="w-full justify-start bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl h-12">
              <BookOpen className="mr-3 text-emerald-400" size={18} /> Book Catalog & Inventory
            </Button>
            <Button onClick={() => navigate('/library')} className="w-full justify-start bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl h-12">
              <Users className="mr-3 text-cyan-400" size={18} /> Issue & Return Loans
            </Button>
            <Button onClick={() => navigate('/study-corner')} className="w-full justify-start bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl h-12">
              <Sparkles className="mr-3 text-indigo-400" size={18} /> Digital Study Corner
            </Button>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
            <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Offline Sync Ready
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              All library inventory and loan logs are safely cached for offline LAN operation and can be beamed to the Admin Harmonization Hub anytime.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
