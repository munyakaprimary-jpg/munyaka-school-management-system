import React, { useState, useEffect, useMemo } from 'react';
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
  BookMarked,
  Download,
  Users,
  History,
  Share2,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  Eye,
  Filter,
  RotateCcw,
  Printer,
  Mail,
  BarChart2,
  Calendar,
  Package,
  BookCheck,
  BookX,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { downloadAppFile } from '@/utils/fileDownloader';
import { SCHOOL_HEADER_LINES, getSchoolHeaderCsv, renderSchoolHeaderHtml } from '@/utils/schoolHeader';
import { Book, BorrowLog, BookAllocation, getLogStatusInfo } from '@/types/library';

export default function LibraryDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const displayName = user?.name || (user as any)?.username || 'Janet Kungu';

  // State loaded from localStorage
  const [books, setBooks] = useState<Book[]>([]);
  const [circulation, setCirculation] = useState<BorrowLog[]>([]);
  const [eResources, setEResources] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<BookAllocation[]>([]);

  const LIBRARY_STORAGE_KEY = 'munyaka_library_books';
  const CIRCULATION_STORAGE_KEY = 'munyaka_library_circulation';
  const ERESOURCES_STORAGE_KEY = 'munyaka_library_eresources';
  const ALLOCATIONS_STORAGE_KEY = 'munyaka_library_allocations';

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

  const getLibraryAllocations = () => {
    try {
      const primary = localStorage.getItem(ALLOCATIONS_STORAGE_KEY);
      if (primary) return JSON.parse(primary);

      const secondary = localStorage.getItem('munyaka_book_allocations');
      if (secondary) return JSON.parse(secondary);

      return [
        {
          id: 'alloc-001',
          borrower_name: 'Brian Kiptoo',
          role: 'Student',
          grade: 'Grade 4',
          stream: 'Blue',
          book_title: 'Clay Modeling: Animals',
          accession_no: 'CLM-2023-001',
          date_issued: '2024-04-15',
          due_date: '2024-05-15',
          qty_issued: 1,
          condition_on_issue: 'New',
          condition_on_return: 'Pending',
          status: 'Active',
          notes: 'Created for art project',
        },
        {
          id: 'alloc-002',
          borrower_name: 'Mary Atieno',
          role: 'Student',
          grade: 'Grade 4',
          stream: 'Blue',
          book_title: 'Oral Narrative Audio',
          accession_no: 'ONA-2023-001',
          date_issued: '2024-04-20',
          due_date: '2024-05-20',
          qty_issued: 1,
          condition_on_issue: 'Good',
          condition_on_return: 'Pending',
          status: 'Active',
          notes: 'Storytelling activity',
        },
      ];
    } catch {
      return [];
    }
  };

  const loadLibraryData = () => {
    setBooks(fetchDashboardInventory());
    setCirculation(getLibraryCirculation());
    setEResources(getLibraryEResources());
    setAllocations(getLibraryAllocations());
  };

  React.useEffect(() => {
    loadLibraryData();
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || e.key.includes('library') || e.key.includes('study') || e.key.includes('allocation')) {
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

  // Allocation stats
  const activeAllocations = allocations.filter(a => a.status === 'Active').length;
  const overdueAllocations = allocations.filter(a => {
    if (a.status !== 'Active') return false;
    return new Date(a.due_date) < todayDate;
  }).length;
  const returnedAllocations = allocations.filter(a => a.status === 'Returned').length;
  const lostAllocations = allocations.filter(a => a.status === 'Lost' || a.condition_on_return === 'Lost').length;

  // Report generation functions
  const generateInventoryReport = async () => {
    const reportTitle = 'Library Inventory Report';
    const reportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    
    const csvHeader = getSchoolHeaderCsv(reportTitle, reportDate);
    const csvColumns = 'Title,Author,Category,ISBN,Total Copies,Available,Publisher\n';
    const csvRows = books.map((b: any) =>
      `"${b.title}","${b.author || ''}","${b.category}","${b.isbn || ''}",${b.quantity || b.copies || b.stock || 1},${b.quantity || b.copies || b.stock || 1},"${b.publisher || ''}"`
    ).join('\n');
    
    const csvContent = csvHeader + csvColumns + csvRows;
    const fileName = `Munyaka_Library_Inventory_${new Date().toISOString().slice(0,10)}.csv`;
    
    await downloadAppFile(fileName, csvContent, 'text/csv');
    showSuccess('Inventory Report exported successfully');
  };

  const generateCirculationReport = async () => {
    const reportTitle = 'Circulation & Loans Report';
    const reportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    
    const csvHeader = getSchoolHeaderCsv(reportTitle, reportDate);
    const csvColumns = 'Book Title,Borrower Name,Grade,Issue Date,Due Date,Status,Quantity Issued,Quantity Returned,Quantity Lost\n';
    const csvRows = circulation.map((c: any) =>
      `"${c.bookTitle || c.title || ''}","${c.borrowerName || c.learnerName || ''}","${c.grade || ''}","${c.issuedDate || c.issueDate || ''}","${c.dueDate || ''}","${c.status || ''}",${c.qty_issued || 1},${c.qty_returned || 0},${c.qty_lost || 0}`
    ).join('\n');
    
    const csvContent = csvHeader + csvColumns + csvRows;
    const fileName = `Munyaka_Circulation_Report_${new Date().toISOString().slice(0,10)}.csv`;
    
    await downloadAppFile(fileName, csvContent, 'text/csv');
    showSuccess('Circulation Report exported successfully');
  };

  const generateOverdueReport = async () => {
    const overdueItems = circulation.filter((c: any) => {
      const st = String(c?.status || '').toUpperCase();
      const isIssued = st === 'ISSUED' || st === 'ACTIVE' || st === 'BORROWED' || st === 'OVERDUE' || !c?.returnDate;
      const due = c?.dueDate || c?.returnDeadline;
      return isIssued && (st === 'OVERDUE' || (due && new Date(due) < todayDate));
    });

    const reportTitle = 'Overdue Books Report';
    const reportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    
    const csvHeader = getSchoolHeaderCsv(reportTitle, reportDate);
    const csvColumns = 'Book Title,Borrower Name,Grade,Issue Date,Due Date,Days Overdue,Status\n';
    const csvRows = overdueItems.map(c => {
      const due = new Date(c.dueDate || c.returnDeadline);
      const daysOverdue = Math.ceil((todayDate.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      return `"${c.bookTitle || c.title || ''}","${c.borrowerName || c.learnerName || ''}","${c.grade || ''}","${c.issueDate || ''}","${c.dueDate || ''}",${daysOverdue},"${c.status || 'OVERDUE'}"`;
    }).join('\n');
    
    const csvContent = csvHeader + csvColumns + csvRows;
    const fileName = `Munyaka_Overdue_Report_${new Date().toISOString().slice(0,10)}.csv`;
    
    await downloadAppFile(fileName, csvContent, 'text/csv');
    showSuccess('Overdue Report exported successfully');
  };

  const generateLearnerBorrowingReport = async () => {
    const reportTitle = 'Learner Borrowing Records';
    const reportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    
    const csvHeader = getSchoolHeaderCsv(reportTitle, reportDate);
    const csvColumns = 'Learner Name,Grade,Stream,Book Title,Accession No,Date Issued,Due Date,Qty Issued,Condition on Issue,Condition on Return,Status,Notes\n';
    const csvRows = allocations.map(a => 
      `"${a.borrower_name}","${a.grade}","${a.stream}","${a.book_title}","${a.accession_no}","${a.date_issued}","${a.due_date}",${a.qty_issued},"${a.condition_on_issue}","${a.condition_on_return}","${a.status}","${a.notes || ''}"`
    ).join('\n');
    
    const csvContent = csvHeader + csvColumns + csvRows;
    const fileName = `Munyaka_Learner_Borrowing_Records_${new Date().toISOString().slice(0,10)}.csv`;
    
    await downloadAppFile(fileName, csvContent, 'text/csv');
    showSuccess('Learner Borrowing Records exported successfully');
  };

  const generateFullLibraryReport = async () => {
    const reportTitle = 'Complete Library Report';
    const reportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    
    const csvHeader = getSchoolHeaderCsv(reportTitle, reportDate);
    
    // Inventory section
    const invHeader = '\n=== LIBRARY INVENTORY ===\n';
    const invColumns = 'Title,Author,Category,ISBN,Total Copies,Available,Publisher\n';
    const invRows = books.map(b => 
      `"${b.title}","${b.author || ''}","${b.category}","${b.isbn || ''}",${b.quantity || b.copies || b.stock || 1},${b.quantity || b.copies || b.stock || 1},"${b.publisher || ''}"`
    ).join('\n');
    
    // Circulation section
    const circHeader = '\n=== CIRCULATION LOGS ===\n';
    const circColumns = 'Book Title,Borrower Name,Grade,Issue Date,Due Date,Status,Qty Issued,Qty Returned,Qty Lost\n';
    const circRows = circulation.map(c => 
      `"${c.bookTitle || c.title || ''}","${c.borrowerName || c.learnerName || ''}","${c.grade || ''}","${c.issueDate || ''}","${c.dueDate || ''}","${c.status || ''}",${c.qty_issued || 1},${c.qty_returned || 0},${c.qty_lost || 0}`
    ).join('\n');
    
    // Allocations section
    const allocHeader = '\n=== LEARNER BORROWING RECORDS ===\n';
    const allocColumns = 'Learner Name,Grade,Stream,Book Title,Accession No,Date Issued,Due Date,Qty Issued,Condition on Issue,Condition on Return,Status,Notes\n';
    const allocRows = allocations.map(a => 
      `"${a.borrower_name}","${a.grade}","${a.stream}","${a.book_title}","${a.accession_no}","${a.date_issued}","${a.due_date}",${a.qty_issued},"${a.condition_on_issue}","${a.condition_on_return}","${a.status}","${a.notes || ''}"`
    ).join('\n');
    
    // E-Resources section
    const erHeader = '\n=== DIGITAL E-RESOURCES ===\n';
    const erColumns = 'Title,Category,Downloads\n';
    const erRows = eResources.map(r => 
      `"${r.title}","${r.category}","${r.downloads || 0}"`
    ).join('\n');
    
    const csvContent = csvHeader + invHeader + invColumns + invRows + circHeader + circColumns + circRows + allocHeader + allocColumns + allocRows + erHeader + erColumns + erRows;
    const fileName = `Munyaka_Complete_Library_Report_${new Date().toISOString().slice(0,10)}.csv`;
    
    await downloadAppFile(fileName, csvContent, 'text/csv');
    showSuccess('Complete Library Report exported successfully');
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'circulation' | 'allocations' | 'eresources' | 'reports'>('overview');

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4">
      {/* Header Banner matching ICT Workstation style */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="space-y-3 relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-white/20 text-white font-bold uppercase text-[10px]">LIBRARIAN DASHBOARD & WORKSTATION</Badge>
            <span className="text-xs text-emerald-200 font-medium">• {displayName}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">Library & Learning Resource Center</h1>
          <p className="text-emerald-100 text-sm md:text-base font-medium leading-relaxed">
            Manage textbook catalogs, student book loans, overdue returns, learner borrowing records, and digital CBC learning materials.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 mt-6 relative z-10">
          <Button
            onClick={() => navigate('/library')}
            className="bg-white text-emerald-950 hover:bg-emerald-50 font-black px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <BookCheck className="w-4 h-4" /> Issue Book Loan
          </Button>
          <Button
            onClick={() => navigate('/library')}
            className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold px-5 py-2.5 rounded-xl border border-emerald-400 shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <BookX className="w-4 h-4" /> Process Return
          </Button>
          <Button
            onClick={() => navigate('/library')}
            variant="outline"
            className="bg-white/10 text-white hover:bg-white/20 border-white/30 font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <Package className="w-4 h-4" /> Open Library Workstation
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <span className="flex items-center gap-1"><BarChart2 className="w-3.5 h-3.5" /> Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'inventory' ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Inventory ({totalTitles})</span>
        </button>
        <button
          onClick={() => setActiveTab('circulation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'circulation' ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <span className="flex items-center gap-1"><History className="w-3.5 h-3.5" /> Circulation ({circulation.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('allocations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'allocations' ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Borrower Records ({allocations.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('eresources')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'eresources' ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> E-Resources ({digitalResourcesCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'reports' ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <span className="flex items-center gap-1"><FileSpreadsheet className="w-3.5 h-3.5" /> Reports</span>
        </button>
      </div>

      {/* Tab Content: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
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
                <h3 className="text-xl font-bold text-gray-900">{totalTitles} Unique Titles</h3>
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
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{qty} vols</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Catalog Stock</span>
                <Button onClick={() => setActiveTab('inventory')} variant="link" className="p-0 h-auto text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer">Manage Catalog &rarr;</Button>
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

          {/* Allocation Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Allocations</p>
                  <h3 className="text-2xl font-black text-emerald-700">{activeAllocations}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <BookCheck className="w-5 h-5" />
                </div>
              </div>
            </Card>
            <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue Allocations</p>
                  <h3 className="text-2xl font-black text-amber-700">{overdueAllocations}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </Card>
            <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Returned</p>
                  <h3 className="text-2xl font-black text-blue-700">{returnedAllocations}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
              </div>
            </Card>
            <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lost / Damaged</p>
                  <h3 className="text-2xl font-black text-rose-700">{lostAllocations}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <BookX className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Circulation & Overdue Alerts Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-6 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-600" /> Recent Circulation & Overdue Alerts
                </h3>
                <Button onClick={() => setActiveTab('circulation')} variant="outline" size="sm" className="text-xs font-bold rounded-xl cursor-pointer">View All</Button>
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
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">No active circulation loans or overdue alerts at this moment.</div>
                )}
              </div>
            </Card>

            {/* Quick Actions Card */}
            <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-gradient-to-br from-slate-900 to-teal-950 text-white p-6 space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" /> Quick Actions
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">Record textbook issues, process student returns, or manage digital study materials.</p>
              <div className="space-y-2 pt-2">
                <Button onClick={() => setActiveTab('inventory')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl justify-start cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" /> Add New Book
                </Button>
                <Button onClick={() => setActiveTab('circulation')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl justify-start cursor-pointer">
                  <BookCheck className="w-4 h-4 mr-2" /> Issue Book Loan
                </Button>
                <Button onClick={() => setActiveTab('allocations')} variant="outline" className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs rounded-xl justify-start cursor-pointer">
                  <Users className="w-4 h-4 mr-2" /> View Borrower Records
                </Button>
                <Button onClick={() => setActiveTab('reports')} variant="outline" className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs rounded-xl justify-start cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Generate Reports
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab Content: INVENTORY */}
      {activeTab === 'inventory' && (
        <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold">Textbook & Instructional Material Inventory</CardTitle>
                <CardDescription className="text-xs mt-0.5">Live catalog tracking, material units, and item availability status.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                  <Input placeholder="Search books, ISBN, author..." className="pl-9 rounded-xl border-slate-200 text-xs" />
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2">
                  <Plus size={14} /> Add Book
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-700 text-sm">No textbook inventory found</h3>
                  <p className="text-xs text-slate-500 mt-1">Register new books or check back later.</p>
                </div>
              ) : (
                books.map((book: any, idx: number) => {
                  const title = book.title || book.name || 'Untitled Book';
                  const qty = Number(book.quantity || book.copies || book.stock || 1);
                  const author = book.author || 'CBC Curriculum';
                  const category = book.category || 'Textbook';
                  const isbn = book.isbn || 'N/A';
                  return (
                    <Card key={book.id || idx} className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-6 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-[10px]">{category}</Badge>
                          <span className="text-xs font-bold text-slate-500">ISBN: {isbn}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-base line-clamp-2">{title}</h3>
                        <p className="text-xs text-slate-500">Author / Publisher: {author}</p>
                      </div>
                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Stock Available</span>
                          <span className="text-sm font-black text-emerald-700">{qty} volumes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="text-xs h-8 rounded-xl font-bold">Issue</Button>
                          <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 h-8 w-8 p-0"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content: CIRCULATION */}
      {activeTab === 'circulation' && (
        <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-600" /> Circulation Logs & Issue/Return Records
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">Check-outs, returns, and incident statuses tied to student admission numbers.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2">
                  <BookCheck className="w-4 h-4" /> Issue Book
                </Button>
                <Button variant="outline" className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-slate-300">
                  <BookX className="w-4 h-4" /> Process Return
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Book Title</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Borrower</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grade</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Issue Date</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Qty Issued</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Qty Returned</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Qty Lost</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {circulation.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-xs text-slate-500">No circulation logs recorded yet.</TableCell>
                    </TableRow>
                  ) : (
                    circulation.map((c: any, idx: number) => {
                      const isOverdue = String(c.status || '').toUpperCase() === 'OVERDUE' || (c.dueDate && new Date(c.dueDate) < todayDate);
                      const statusInfo = getLogStatusInfo(c);
                      return (
                        <TableRow key={idx} className={isOverdue ? 'bg-amber-50/50' : ''}>
                          <TableCell className="font-medium text-slate-900 text-sm">{c.bookTitle || c.title || 'Textbook Loan'}</TableCell>
                          <TableCell className="text-slate-700 text-sm">{c.borrowerName || c.learnerName || 'Student'}</TableCell>
                          <TableCell className="text-slate-600 text-sm">{c.grade || 'N/A'}</TableCell>
                          <TableCell className="text-slate-600 text-sm font-mono text-xs">{c.issueDate || 'N/A'}</TableCell>
                          <TableCell className="text-slate-600 text-sm font-mono text-xs">{c.dueDate || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={cn("font-bold text-xs border-0 px-2 py-1", statusInfo.color)}>{statusInfo.label}</Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm font-medium">{c.qty_issued || 1}</TableCell>
                          <TableCell className="text-center text-sm font-medium text-emerald-600">{c.qty_returned || 0}</TableCell>
                          <TableCell className="text-center text-sm font-medium text-rose-600">{c.qty_lost || 0}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50" title="Process Return"><RotateCcw className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:bg-slate-100" title="View Details"><Eye className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600 hover:bg-rose-50" title="Delete Record"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content: ALLOCATIONS (Learner Borrowing Records) */}
      {activeTab === 'allocations' && (
        <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" /> Learner Borrowing Records
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">Detailed records of books issued to learners with condition tracking and return status.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2">
                  <Plus className="w-4 h-4" /> New Allocation
                </Button>
                <Button variant="outline" className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-slate-300">
                  <FileSpreadsheet className="w-4 h-4" /> Export Records
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Learner Name</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grade</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stream</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Book Title</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Accession No</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date Issued</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Qty Issued</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Condition on Issue</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Condition on Return</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center py-8 text-xs text-slate-500">No borrower records found.</TableCell>
                    </TableRow>
                  ) : (
                    allocations.map((a: any, idx: number) => {
                      const isOverdue = a.status === 'Active' && new Date(a.due_date) < todayDate;
                      const statusColor = a.status === 'Active' ? (isOverdue ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700') : 
                                         a.status === 'Returned' ? 'bg-emerald-100 text-emerald-700' : 
                                         a.status === 'Lost' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700';
                      return (
                        <TableRow key={idx} className={isOverdue ? 'bg-amber-50/50' : ''}>
                          <TableCell className="font-medium text-slate-900 text-sm">{a.borrower_name}</TableCell>
                          <TableCell className="text-slate-600 text-sm">{a.grade}</TableCell>
                          <TableCell className="text-slate-600 text-sm">{a.stream}</TableCell>
                          <TableCell className="text-slate-700 text-sm">{a.book_title}</TableCell>
                          <TableCell className="text-slate-600 text-sm font-mono text-xs">{a.accession_no}</TableCell>
                          <TableCell className="text-slate-600 text-sm font-mono text-xs">{a.date_issued}</TableCell>
                          <TableCell className="text-slate-600 text-sm font-mono text-xs">{a.due_date}</TableCell>
                          <TableCell className="text-center text-sm font-medium">{a.qty_issued}</TableCell>
                          <TableCell className="text-center text-sm">
                            <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-[10px]">{a.condition_on_issue}</Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            <Badge className={cn("border-none font-bold text-[10px]", a.condition_on_return === 'Good' ? 'bg-emerald-50 text-emerald-700' : a.condition_on_return === 'Damaged' ? 'bg-amber-50 text-amber-700' : a.condition_on_return === 'Lost' ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-600')}>
                              {a.condition_on_return}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColor}>{a.status}</Badge>
                          </TableCell>
                          <TableCell className="text-slate-500 text-xs max-w-xs truncate">{a.notes || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50" title="Mark Returned"><RotateCcw className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:bg-slate-100" title="View Details"><Eye className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600 hover:bg-rose-50" title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content: E-RESOURCES */}
      {activeTab === 'eresources' && (
        <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" /> Digital E-Resources
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">CBC study materials, past papers, notes, and digital learning resources.</CardDescription>
              </div>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2">
                <Plus className="w-4 h-4" /> Upload Resource
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {eResources.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-700 text-sm">No digital e-resources uploaded yet</h3>
                  <p className="text-xs text-slate-500 mt-1">Upload CBC study guides, notes, or past papers.</p>
                </div>
              ) : (
                eResources.map((res: any, idx: number) => (
                  <Card key={idx} className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-6 flex flex-col justify-between">
                    <div className="space-y-2">
                      <Badge className="bg-indigo-50 text-indigo-700 border-none font-bold text-[10px]">{res.strand || 'CBC Study Material'}</Badge>
                      <h3 className="font-bold text-slate-900 text-base">{res.title || 'Untitled Document'}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{res.description || 'No description provided.'}</p>
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">{res.grade || 'All Grades'}</span>
                      <Button variant="outline" size="sm" className="text-xs h-8 rounded-xl font-bold flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Preview
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Official Library Reports
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">Generate official reports with school letterhead for administration and audit purposes.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* School Header Preview */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-center space-y-1" dangerouslySetInnerHTML={{ __html: renderSchoolHeaderHtml() }} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Report 1: Inventory */}
                <Card className="border border-slate-200/80 shadow-sm rounded-xl bg-white p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={generateInventoryReport}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm">Library Inventory Report</h4>
                      <p className="text-xs text-slate-500 mt-1">Complete catalog of all books with stock levels, categories, and publisher details.</p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-emerald-600 font-bold">
                        <Download className="w-3.5 h-3.5" /> Export CSV
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Report 2: Circulation */}
                <Card className="border border-slate-200/80 shadow-sm rounded-xl bg-white p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={generateCirculationReport}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <History className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm">Circulation & Loans Report</h4>
                      <p className="text-xs text-slate-500 mt-1">All check-outs and returns with borrower details, dates, and quantities.</p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-blue-600 font-bold">
                        <Download className="w-3.5 h-3.5" /> Export CSV
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Report 3: Overdue */}
                <Card className="border border-slate-200/80 shadow-sm rounded-xl bg-white p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={generateOverdueReport}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm">Overdue Books Report</h4>
                      <p className="text-xs text-slate-500 mt-1">All overdue items with days past due, borrower details, and follow-up actions.</p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-amber-600 font-bold">
                        <Download className="w-3.5 h-3.5" /> Export CSV
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Report 4: Learner Borrowing Records */}
                <Card className="border border-slate-200/80 shadow-sm rounded-xl bg-white p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={generateLearnerBorrowingReport}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm">Learner Borrowing Records</h4>
                      <p className="text-xs text-slate-500 mt-1">Detailed per-learner borrowing history with condition tracking and return status.</p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-indigo-600 font-bold">
                        <Download className="w-3.5 h-3.5" /> Export CSV
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Report 5: Allocations Summary */}
                <Card className="border border-slate-200/80 shadow-sm rounded-xl bg-white p-5 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <BookCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm">Allocations Summary</h4>
                      <p className="text-xs text-slate-500 mt-1">Summary of active, returned, overdue, and lost allocations with statistics.</p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-purple-600 font-bold">
                        <Download className="w-3.5 h-3.5" /> Export CSV
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Report 6: Complete Library Report */}
                <Card className="border border-slate-200/80 shadow-sm rounded-xl bg-white p-5 hover:shadow-md transition-shadow cursor-pointer border-2 border-emerald-300" onClick={generateFullLibraryReport}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm">Complete Library Report</h4>
                      <p className="text-xs text-slate-500 mt-1">Full comprehensive report: Inventory + Circulation + Borrower Records + E-Resources.</p>
                      <div className="flex items-center gap-2 mt-3 text-xs text-emerald-600 font-bold">
                        <Download className="w-3.5 h-3.5" /> Export CSV (All)
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Report Format Options */}
          <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" /> Report Format & Options
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h5 className="font-bold text-slate-900 text-sm mb-2">Export Format</h5>
                  <Select defaultValue="csv" className="w-full">
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV (Excel Compatible)</SelectItem>
                      <SelectItem value="pdf">PDF (Print Ready)</SelectItem>
                      <SelectItem value="json">JSON (Data Export)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h5 className="font-bold text-slate-900 text-sm mb-2">Date Range</h5>
                  <Select defaultValue="all" className="w-full">
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="term">Current Term</SelectItem>
                      <SelectItem value="month">Current Month</SelectItem>
                      <SelectItem value="week">Current Week</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h5 className="font-bold text-slate-900 text-sm mb-2">Include School Header</h5>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="includeHeader" defaultChecked className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    <label htmlFor="includeHeader" className="text-xs text-slate-700 font-medium">Include official school letterhead (MUNYAKA PRIMARY AND JUNIOR SCHOOL, P.O BOX 5239-30100 ELDORET, MOTTO: KNOWLEDGE IS POWER)</label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}