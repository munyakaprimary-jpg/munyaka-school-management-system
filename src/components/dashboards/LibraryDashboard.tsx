import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen,
  BookmarkCheck,
  FileText,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  BookMarked
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function LibraryDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const displayName = user?.name || (user as any)?.username || 'Janet Kungu';

  const [books, setBooks] = React.useState<any[]>([]);
  const [circulation, setCirculation] = React.useState<any[]>([]);
  const [eResources, setEResources] = React.useState<any[]>([]);

  const LIBRARY_STORAGE_KEY = 'munyaka_library_books';
  const CIRCULATION_STORAGE_KEY = 'munyaka_library_circulation';
  const ERESOURCES_STORAGE_KEY = 'munyaka_library_eresources';

  const fetchDashboardInventory = () => {
    const keys = ['munyaka_library_inventory', 'munyaka_library_books', 'library_inventory', 'library_books'];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {}
      }
    }
    return [
      { id: 'BK-001', title: 'CBC Grade 4 Mathematics Pupil Book', category: 'Textbook', quantity: 45, author: 'KICD / KLB' },
      { id: 'BK-002', title: 'Integrated Science Grade 5 Revision Guide', category: 'Revision', quantity: 30, author: 'Moran Publishers' },
      { id: 'BK-003', title: 'Kiswahili Fasaha Gishi la 6', category: 'Textbook', quantity: 50, author: 'Longhorn' },
      { id: 'BK-004', title: 'English Grammar & Composition Grade 7', category: 'Textbook', quantity: 28, author: 'Oxford University Press' },
    ];
  };

  const getLibraryCirculation = () => {
    try {
      const primary = localStorage.getItem(CIRCULATION_STORAGE_KEY);
      if (primary) return JSON.parse(primary);

      const secondary = localStorage.getItem('munyaka_library_loans');
      if (secondary) return JSON.parse(secondary);

      return [
        { id: 'LOAN-101', bookTitle: 'CBC Grade 4 Mathematics Pupil Book', borrowerName: 'Brian Kiprop', grade: 'Grade 4 Blue', issueDate: '2025-02-10', dueDate: '2025-02-24', status: 'ISSUED' },
        { id: 'LOAN-102', bookTitle: 'Integrated Science Grade 5 Revision', borrowerName: 'Mercy Cheptoo', grade: 'Grade 5 Green', issueDate: '2025-01-15', dueDate: '2025-01-29', status: 'OVERDUE' },
      ];
    } catch {
      return [];
    }
  };

  const getLibraryEResources = () => {
    try {
      const primary = localStorage.getItem(ERESOURCES_STORAGE_KEY);
      if (primary) return JSON.parse(primary);

      const secondary = localStorage.getItem('munyaka_study_materials');
      if (secondary) return JSON.parse(secondary);

      return [
        { id: 'ER-01', title: 'CBC Grade 6 Integrated Science Notes.pdf', category: 'Notes', downloads: 142 },
        { id: 'ER-02', title: 'KCPE / KPSEA Past Papers 2024.pdf', category: 'Past Papers', downloads: 310 },
      ];
    } catch {
      return [];
    }
  };

  const loadLibraryData = () => {
    setBooks(fetchDashboardInventory());
    setCirculation(getLibraryCirculation());
    setEResources(getLibraryEResources());
  };

  React.useEffect(() => {
    loadLibraryData();
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || e.key.includes('library') || e.key.includes('study')) {
        loadLibraryData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(loadLibraryData, 2000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const totalTitles = books.length;
  const totalVolumes = books.reduce((acc: number, item: any) => {
    return acc + (Number(item.quantity || item.copies || item.stock || item.totalCopies || 1));
  }, 0);

  const todayDate = new Date();
  const activeLoans = circulation.filter((c: any) => {
    const st = String(c?.status || '').toUpperCase();
    return st === 'ISSUED' || st === 'ACTIVE' || st === 'BORROWED' || !c?.returnDate;
  }).length;

  const overdueReturns = circulation.filter((c: any) => {
    const st = String(c?.status || '').toUpperCase();
    const isIssued = st === 'ISSUED' || st === 'ACTIVE' || st === 'BORROWED' || st === 'OVERDUE' || !c?.returnDate;
    const due = c?.dueDate || c?.returnDeadline;
    return isIssued && (st === 'OVERDUE' || (due && new Date(due) < todayDate));
  }).length;

  const digitalResourcesCount = eResources.length;

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto px-4">
      {/* Header Banner matching ICT Workstation style */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="space-y-3 relative z-10 max-w-2xl">
          <Badge className="bg-white/20 text-white font-bold uppercase text-[10px]">LIBRARY TEACHER PORTAL & WORKSTATION</Badge>
          <h1 className="text-2xl md:text-3xl font-black">Library & Learning Resource Center</h1>
          <p className="text-emerald-100 text-sm md:text-base font-medium leading-relaxed">
            Welcome back, {displayName}! Manage textbook catalogs, student book loans, overdue returns, and digital CBC learning materials.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 mt-6 relative z-10">
          <Button
            onClick={() => {
              navigate('/library');
              window.location.href = '/library';
            }}
            className="bg-white text-emerald-950 hover:bg-emerald-50 font-black px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
          >
            Issue Book Loan <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => {
              navigate('/library');
              window.location.href = '/library';
            }}
            className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold px-5 py-2.5 rounded-xl border border-emerald-400 shadow-sm flex items-center gap-2 cursor-pointer"
          >
            Return Book
          </Button>
          <Button
            onClick={() => {
              navigate('/library');
              window.location.href = '/library';
            }}
            variant="outline"
            className="bg-white/10 text-white hover:bg-white/20 border-white/30 font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer"
          >
            Open Library & E-Resources
          </Button>
        </div>
      </div>

      {/* 4 Live Library KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Catalog Books */}
        <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Total Catalog Books</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                {totalVolumes} Volumes
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-900">
              {totalTitles} Unique Titles
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {books.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No books cataloged yet.</p>
              ) : (
                books.slice(0, 4).map((book: any, idx: number) => {
                  const title = book.title || book.name || book.bookTitle || 'Untitled Book';
                  const qty = Number(book.quantity || book.copies || book.stock || 1);
                  return (
                    <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                      <span className="font-medium text-gray-800 truncate max-w-[190px]">{idx + 1}. {title}</span>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {qty} vols
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Catalog Stock</span>
            <Button onClick={() => navigate('/library')} variant="link" className="p-0 h-auto text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer">
              Manage Catalog &rarr;
            </Button>
          </div>
        </Card>

        {/* Card 2: Active Student Loans */}
        <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Student Loans</p>
            <h3 className="text-3xl font-black text-slate-900">{activeLoans}</h3>
            <p className="text-xs text-blue-600 font-bold">Currently Borrowed</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookmarkCheck className="w-6 h-6" />
          </div>
        </Card>

        {/* Card 3: Overdue Returns */}
        <Card className={`border shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between ${overdueReturns > 0 ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200/80'}`}>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue Returns</p>
            <h3 className={`text-3xl font-black ${overdueReturns > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{overdueReturns}</h3>
            <p className={`text-xs font-bold ${overdueReturns > 0 ? 'text-amber-600' : 'text-slate-500'}`}>Past Due Date</p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${overdueReturns > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
        </Card>

        {/* Card 4: Digital E-Resources */}
        <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Digital E-Resources</p>
            <h3 className="text-3xl font-black text-slate-900">{digitalResourcesCount}</h3>
            <p className="text-xs text-indigo-600 font-bold">Uploaded CBC Notes & Papers</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Recent Circulation & Overdue Alerts Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" /> Recent Circulation & Overdue Alerts Feed
            </h3>
            <Button onClick={() => navigate('/library')} variant="outline" size="sm" className="text-xs font-bold rounded-xl cursor-pointer">
              View All Circulation
            </Button>
          </div>
          <div className="space-y-2">
            {circulation.length > 0 ? (
              circulation.slice(0, 6).map((c: any, idx: number) => {
                const isOverdue = String(c.status || '').toUpperCase() === 'OVERDUE' || (c.dueDate && new Date(c.dueDate) < todayDate);
                return (
                  <div key={idx} className={`p-3 rounded-xl flex items-center justify-between text-xs border ${isOverdue ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                    <div>
                      <p className="font-bold text-slate-900">{c.bookTitle || c.title || 'Textbook Loan'}</p>
                      <p className="text-slate-500 text-[11px]">Borrower: {c.borrowerName || c.learnerName || 'Student'} ({c.grade || 'Grade'})</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${isOverdue ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'}`}>
                        {isOverdue ? 'OVERDUE' : (c.status || 'ACTIVE')}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">Due: {c.dueDate || c.returnDate || 'N/A'}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                No active circulation loans or overdue alerts at this moment.
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions Card */}
        <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-gradient-to-br from-slate-900 to-teal-950 text-white p-6 space-y-4">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" /> Library Quick Links
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Record textbook issues, process student returns, or manage digital study materials for the school community.
          </p>
          <div className="space-y-2 pt-2">
            <Button
              onClick={() => navigate('/library')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl justify-start cursor-pointer"
            >
              <BookOpen className="w-4 h-4 mr-2" /> Open Library Workstation
            </Button>
            <Button
              onClick={() => navigate('/study-corner')}
              variant="outline"
              className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs rounded-xl justify-start cursor-pointer"
            >
              <FileText className="w-4 h-4 mr-2" /> Study Corner & E-Resources
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
