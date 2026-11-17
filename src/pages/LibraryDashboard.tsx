import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Library,
  BookOpen,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookMarked,
  BookPlus,
  RefreshCw,
  Sparkles,
  FileText,
  Monitor,
  ArrowUpRight,
  BookCopy,
  CalendarClock,
  BookOpenCheck,
  Layers
} from 'lucide-react';
import { Book, BorrowRecord as BorrowLog } from '@/types/library';
import { BookAllocation } from '@/types/library';

export const LibraryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [historyLogs, setHistoryLogs] = useState<BorrowLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const librarianName = user?.name || user?.fullName || 'Librarian';

  useEffect(() => {
    try {
      const savedBooks = localStorage.getItem('school_library_inventory_v1') || localStorage.getItem('textbook_inventory');
      const savedLogs = localStorage.getItem('school_library_logs_v1') || localStorage.getItem('munyaka_library_borrowings');
      setBooks(savedBooks ? JSON.parse(savedBooks) : []);
      setHistoryLogs(savedLogs ? JSON.parse(savedLogs) : []);
    } catch (err) {
      console.error('Failed to load library data:', err);
      setBooks([]);
      setHistoryLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Live KPIs
  const totalCatalogBooks = books.reduce((acc, b) => acc + (b.totalCopies || b.stock || 0), 0);
  const totalTitles = books.length;
  const activeStudentLoans = historyLogs.filter(l => l.status === 'Active' || l.status === 'Issued').length;
  const overdueReturns = historyLogs.filter(l => {
    if (l.status === 'Lost' || l.status === 'Damaged') return true;
    if (l.status === 'Active' || l.status === 'Issued') {
      if (!l.due_date) return false;
      const due = new Date(l.due_date);
      return due < new Date();
    }
    return false;
  }).length;
  const digitalResources = books.filter(b => b.isDigital || b.type === 'Digital' || b.category === 'E-Resource' || b.category === 'Past Papers' || b.category === 'CBC Notes').length;

  const recentCirculation = [...historyLogs]
    .sort((a, b) => new Date(b.issued_date || b.createdAt || 0).getTime() - new Date(a.issued_date || a.createdAt || 0).getTime())
    .slice(0, 5);

  const overdueAlerts = historyLogs.filter(l => {
    if (l.status === 'Lost' || l.status === 'Damaged') return true;
    if (l.status === 'Active' || l.status === 'Issued') {
      if (!l.due_date) return false;
      const due = new Date(l.due_date);
      return due < new Date();
    }
    return false;
  }).slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/20 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 uppercase tracking-widest text-[11px] font-extrabold px-3 py-1">
                Library Teacher Portal & Workstation
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-semibold">
                Online & Connected
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Library className="w-9 h-9 text-indigo-400" />
              Library & Learning Resource Center
            </h1>
            <p className="text-slate-400 max-w-2xl text-sm md:text-base">
              Welcome, <span className="text-indigo-300 font-semibold">{librarianName}</span>. Track student book loans, manage catalog inventory, monitor overdue returns, and access digital CBC study materials.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => navigate('/library')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-900/40 rounded-xl"
            >
              <BookMarked className="w-4 h-4 mr-2" /> Issue Book Loan
            </Button>
            <Button
              onClick={() => navigate('/library')}
              variant="outline"
              className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200 rounded-xl"
            >
              <CheckCircle2 className="w-4 h-4 mr-2 text-indigo-400" /> Return Book
            </Button>
            <Button
              onClick={() => navigate('/library')}
              variant="outline"
              className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200 rounded-xl"
            >
              <Layers className="w-4 h-4 mr-2 text-indigo-400" /> Open Library & E-Resources
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Live Library KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Catalog Books</p>
              <p className="text-3xl font-extrabold text-white">{isLoading ? '—' : totalCatalogBooks}</p>
              <p className="text-[11px] text-indigo-400 font-medium">{totalTitles} Unique Titles</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BookCopy className="w-7 h-7" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Student Loans</p>
              <p className="text-3xl font-extrabold text-white">{isLoading ? '—' : activeStudentLoans}</p>
              <p className="text-[11px] text-emerald-400 font-medium">Currently Borrowed</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-7 h-7" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Returns</p>
              <p className="text-3xl font-extrabold text-white">{isLoading ? '—' : overdueReturns}</p>
              <p className="text-[11px] text-rose-400 font-medium">Past Due Date</p>
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
              <p className="text-3xl font-extrabold text-white">{isLoading ? '—' : digitalResources}</p>
              <p className="text-[11px] text-cyan-400 font-medium">CBC Notes & Past Papers</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-7 h-7" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Circulation & Overdue Alerts Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Circulation */}
        <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                Recent Circulation Activity
              </CardTitle>
              <Badge variant="outline" className="text-indigo-400 border-indigo-500/30 text-xs">
                Last 5 Transactions
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading circulation logs...
              </div>
            ) : recentCirculation.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No recent book loans or returns recorded yet.
              </div>
            ) : (
              recentCirculation.map((log, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.status === 'Returned' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                      {log.status === 'Returned' ? <CheckCircle2 size={16} /> : <BookOpenCheck size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{log.bookTitle || log.book_title || 'Unknown Book'}</p>
                      <p className="text-[11px] text-slate-400">{log.borrowerName || log.borrower_name || log.studentName || 'Student'} • {log.issued_date || log.createdAt ? new Date(log.issued_date || log.createdAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                  <Badge className={log.status === 'Returned' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'}>
                    {log.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Overdue Alerts */}
        <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Overdue & Lost Book Alerts
              </CardTitle>
              <Badge variant="outline" className="text-rose-400 border-rose-500/30 text-xs">
                {overdueReturns} Active Alerts
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Checking overdue records...
              </div>
            ) : overdueAlerts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No overdue or lost books at this time. Great job!
              </div>
            ) : (
              overdueAlerts.map((log, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-rose-950/20 border border-rose-800/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                      <CalendarClock size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{log.bookTitle || log.book_title || 'Unknown Book'}</p>
                      <p className="text-[11px] text-rose-300">{log.borrowerName || log.borrower_name || log.studentName || 'Student'} • Due: {log.due_date ? new Date(log.due_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                  <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">
                    {log.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={() => navigate('/library')}
          className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg gap-2"
        >
          <BookPlus className="w-5 h-5" /> Register New Book
        </Button>
        <Button
          onClick={() => navigate('/library')}
          variant="outline"
          className="w-full h-14 rounded-xl border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200 font-bold gap-2"
        >
          <FileText className="w-5 h-5 text-indigo-400" /> View Full Catalog
        </Button>
        <Button
          onClick={() => navigate('/study-corner')}
          variant="outline"
          className="w-full h-14 rounded-xl border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200 font-bold gap-2"
        >
          <Monitor className="w-5 h-5 text-cyan-400" /> Digital Study Corner
        </Button>
      </div>
    </div>
  );
};

export default LibraryDashboard;
