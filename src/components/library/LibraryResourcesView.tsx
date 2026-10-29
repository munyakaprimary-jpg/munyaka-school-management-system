import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen,
  Search,
  Plus,
  FileText,
  BookmarkCheck,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Download,
  Filter,
  CheckCircle2,
  Trash2,
  Edit,
  Sparkles,
  QrCode,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { RegisterBookModal } from '@/components/library/RegisterBookModal';
import { IssueBookModal } from '@/components/library/IssueBookModal';
import { ProcessReturnModal } from '@/components/library/ProcessReturnModal';
import { AddMaterialModal } from '@/components/AddMaterialModal';
import { DocumentPreviewModal } from '@/components/DocumentPreviewModal';

const FULL_ACCESS_ROLES = ['library_teacher', 'librarian', 'admin', 'dhoi', 'super_admin'];
const VIEW_ONLY_ROLES = ['class_teacher', 'subject_teacher', 'senior_teacher', 'head_teacher'];

const hasFullAccess = (role?: string) => {
  const norm = String(role || '').toLowerCase().trim();
  return FULL_ACCESS_ROLES.includes(norm) || norm.includes('admin') || norm.includes('librar');
};

const isViewOnly = (role?: string) => {
  const norm = String(role || '').toLowerCase().trim();
  return VIEW_ONLY_ROLES.includes(norm) || norm.includes('teacher');
};

const formatRole = (role?: string) => {
  const norm = String(role || '').toLowerCase().trim();
  if (norm === 'library_teacher' || norm === 'librarian') return 'Librarian & Asset Manager';
  if (norm === 'class_teacher') return 'Class Teacher';
  if (norm === 'subject_teacher') return 'Subject Teacher';
  if (norm === 'head_teacher') return 'Head Teacher';
  if (norm === 'senior_teacher') return 'Senior Teacher';
  return role ? role.replace(/_/g, ' ').toUpperCase() : 'Staff Member';
};

export const LibraryResourcesView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('munyaka_current_user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const rbacRole = currentUser.rbacRole || currentUser.role || user?.role || 'library_teacher';
  const userName = currentUser.name || currentUser.fullName || user?.name || 'Janet Gathoni Kungu';

  const [activeTab, setActiveTab] = useState<'inventory' | 'circulation' | 'eresources'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [selectedBookForAction, setSelectedBookForAction] = useState<any>(null);
  const [previewDocument, setPreviewDocument] = useState<any>(null);

  // Data states
  const [books, setBooks] = useState<any[]>([]);
  const [circulation, setCirculation] = useState<any[]>([]);
  const [eResources, setEResources] = useState<any[]>([]);

  const loadData = () => {
    try {
      const rawBooks = localStorage.getItem('munyaka_library_inventory') || 
                       localStorage.getItem('munyaka_library_books') || 
                       localStorage.getItem('library_books');
      if (rawBooks) {
        const parsed = JSON.parse(rawBooks);
        setBooks(Array.isArray(parsed) ? parsed : []);
      } else {
        const initial = [
          { id: 'b1', title: 'BB RULERS', category: 'Stationery', isbn: '978-3705', quantity: 10, copies: 10 },
          { id: 'b2', title: 'REAM PAPERS', category: 'Stationery', isbn: '978-0140', quantity: 40, copies: 40 },
          { id: 'b3', title: 'CBC MATHEMATICS GRADE 4', category: 'Textbook', isbn: '978-9966', quantity: 25, copies: 25 }
        ];
        setBooks(initial);
        localStorage.setItem('munyaka_library_inventory', JSON.stringify(initial));
      }
    } catch {
      setBooks([]);
    }

    try {
      const rawCirc = localStorage.getItem('munyaka_library_circulation') || localStorage.getItem('munyaka_library_loans') || '[]';
      const parsed = JSON.parse(rawCirc);
      setCirculation(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCirculation([]);
    }

    try {
      const rawRes = localStorage.getItem('munyaka_library_eresources') || localStorage.getItem('munyaka_study_materials') || '[]';
      const parsed = JSON.parse(rawRes);
      setEResources(Array.isArray(parsed) ? parsed : []);
    } catch {
      setEResources([]);
    }
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(loadData, 2000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const formattedRole = formatRole(String(rbacRole));
  const canEdit = hasFullAccess(String(rbacRole));
  const isReadOnly = isViewOnly(String(rbacRole));

  const totalTitles = books.length;
  const totalVolumes = books.reduce((acc, b) => acc + Number(b.quantity || b.copies || b.stock || 1), 0);
  const activeLoans = circulation.filter(c => c?.status === 'ISSUED' || c?.status === 'ACTIVE').length;
  const overdueCount = circulation.filter(c => {
    const isIssued = c?.status === 'ISSUED' || c?.status === 'ACTIVE';
    const due = c?.dueDate;
    return isIssued && due && new Date(due) < new Date();
  }).length;
  const eresourcesCount = eResources.length;

  const handleDeleteBook = (id: string) => {
    if (!canEdit) {
      toast({ title: 'Access Denied', description: 'You do not have permission to delete inventory items.', variant: 'destructive' });
      return;
    }
    const updated = books.filter(b => b.id !== id);
    setBooks(updated);
    localStorage.setItem('munyaka_library_inventory', JSON.stringify(updated));
    toast({ title: 'Success', description: 'Item removed from library inventory.' });
  };

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="space-y-3 relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider bg-amber-700/50 px-3 py-1 rounded-full text-amber-200 border border-amber-500/30">
              {rbacRole === 'library_teacher' || rbacRole === 'librarian' ? 'Librarian & Asset Portal' : `${formattedRole} Workstation`}
            </span>
            <span className="text-xs text-amber-300 font-medium">{String(userName || '')}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">Library & E-Resources Management Hub</h1>
          <p className="text-emerald-100 text-sm md:text-base font-medium leading-relaxed">
            Manage physical textbook stock, track active student loans, monitor overdue returns, and upload digital CBC reading guides.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 mt-6 relative z-10">
          {canEdit && (
            <>
              <Button
                onClick={() => setIsRegisterOpen(true)}
                className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold rounded-xl shadow-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Register New Book / Item
              </Button>
              <Button
                onClick={() => { setSelectedBookForAction(books[0] || null); setIsIssueOpen(true); }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl border border-emerald-500 shadow-sm flex items-center gap-2"
              >
                <BookmarkCheck className="w-4 h-4" /> Issue Item
              </Button>
              <Button
                onClick={() => setIsAddMaterialOpen(true)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl border border-cyan-500 shadow-sm flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Upload E-Resource
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Metrics Cards 4-Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Book Stock</p>
            <h3 className="text-3xl font-black text-slate-900">{totalTitles} <span className="text-sm font-medium text-slate-400">({totalVolumes} vols)</span></h3>
            <p className="text-xs text-emerald-600 font-bold">Catalogued Inventory</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Loans</p>
            <h3 className="text-3xl font-black text-slate-900">{activeLoans}</h3>
            <p className="text-xs text-blue-600 font-bold">Currently Issued</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookmarkCheck className="w-6 h-6" />
          </div>
        </Card>

        <Card className={`border shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between ${overdueCount > 0 ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200/80'}`}>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue Returns</p>
            <h3 className={`text-3xl font-black ${overdueCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{overdueCount}</h3>
            <p className={`text-xs font-bold ${overdueCount > 0 ? 'text-amber-600' : 'text-slate-500'}`}>Requires Follow-up</p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${overdueCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Digital E-Resources</p>
            <h3 className="text-3xl font-black text-slate-900">{eresourcesCount}</h3>
            <p className="text-xs text-indigo-600 font-bold">Uploaded PDFs & Media</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'inventory' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Book & Item Inventory ({books.length})
        </button>
        <button
          onClick={() => setActiveTab('circulation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'circulation' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Circulation & Loans ({circulation.length})
        </button>
        <button
          onClick={() => setActiveTab('eresources')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'eresources' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Digital Study Corner ({eResources.length})
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by title, category, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-slate-200 rounded-xl text-sm"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {activeTab === 'inventory' && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="textbook">Textbooks</option>
              <option value="stationery">Stationery</option>
              <option value="reference">Reference</option>
            </select>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Title / Item</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">ISBN / Code</th>
                  <th className="py-3.5 px-4 text-center">Total Volumes</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {books.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 italic text-sm">
                      No books or items cataloged in inventory yet. Click "Register New Book / Item" above to add stock.
                    </td>
                  </tr>
                ) : (
                  books
                    .filter(b => {
                      const t = String(b.title || b.name || '').toLowerCase();
                      const cat = String(b.category || '').toLowerCase();
                      const isbn = String(b.isbn || '').toLowerCase();
                      const q = searchQuery.toLowerCase();
                      const matchesSearch = t.includes(q) || cat.includes(q) || isbn.includes(q);
                      const matchesCategory = categoryFilter === 'all' || cat.includes(categoryFilter);
                      return matchesSearch && matchesCategory;
                    })
                    .map((book, index) => {
                      const title = book.title || book.name || 'Untitled';
                      const category = book.category || 'General';
                      const isbn = book.isbn || 'N/A';
                      const copies = Number(book.quantity || book.copies || book.stock || 1);
                      return (
                        <tr key={book.id || index} className="hover:bg-slate-50/80 transition-all">
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{index + 1}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{title}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                              {category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{isbn}</td>
                          <td className="py-3.5 px-4 text-center font-bold text-emerald-700">{copies} vols</td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            {canEdit && (
                              <>
                                <Button
                                  onClick={() => { setSelectedBookForAction(book); setIsIssueOpen(true); }}
                                  size="sm"
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200"
                                >
                                  Issue
                                </Button>
                                <Button
                                  onClick={() => handleDeleteBook(book.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'circulation' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Active & Past Circulation Loans</h3>
            {canEdit && (
              <Button
                onClick={() => setIsReturnOpen(true)}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                Process Return
              </Button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Book / Item</th>
                  <th className="py-3.5 px-4">Borrower</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Issued Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {circulation.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 italic text-sm">
                      No active circulation records. Use the "Issue Item" button above to record a loan.
                    </td>
                  </tr>
                ) : (
                  circulation.map((c, index) => {
                    const isOverdue = c?.dueDate && new Date(c.dueDate) < new Date() && c?.status === 'ISSUED';
                    return (
                      <tr key={c.id || index} className="hover:bg-slate-50/80 transition-all">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{c.bookTitle || 'Textbook Loan'}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">{c.borrowerName || 'Student'}</td>
                        <td className="py-3.5 px-4 text-xs font-bold text-slate-500">{c.borrowerType || 'Student'}</td>
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-600">{c.issuedDate || 'Today'}</td>
                        <td className={`py-3.5 px-4 text-xs font-mono font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>
                          {c.dueDate || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            c.status === 'RETURNED' ? 'bg-slate-100 text-slate-600' :
                            isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {isOverdue ? 'OVERDUE' : (c.status || 'ISSUED')}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'eresources' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {eResources.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">No digital e-resources uploaded yet.</p>
              <p className="text-xs text-slate-400 mt-1">Upload study guides, PDF notes, or CBC curriculum aids for learners and staff.</p>
            </div>
          ) : (
            eResources.map((res: any, idx: number) => (
              <Card key={idx} className="border border-slate-200/80 shadow-sm rounded-2xl bg-white p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-indigo-50 text-indigo-700 font-bold border-none text-[10px]">
                    {res.grade || 'CBC E-Resource'}
                  </Badge>
                  <span className="text-[10px] font-mono text-slate-400">{res.date || 'Today'}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-base">{res.title || res.name}</h4>
                <p className="text-xs text-slate-600 line-clamp-2">{res.description || 'Uploaded digital study material.'}</p>
                <div className="pt-2 flex items-center justify-between">
                  <Button
                    onClick={() => setPreviewDocument(res)}
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold rounded-xl text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                  >
                    Preview Document
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      <RegisterBookModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={() => loadData()}
      />

      <IssueBookModal
        isOpen={isIssueOpen}
        onClose={() => setIsIssueOpen(false)}
        book={selectedBookForAction}
        onSuccess={() => loadData()}
      />

      <ProcessReturnModal
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        onSuccess={() => loadData()}
      />

      <AddMaterialModal
        isOpen={isAddMaterialOpen}
        onClose={() => setIsAddMaterialOpen(false)}
        onSuccess={() => loadData()}
      />

      {previewDocument && (
        <DocumentPreviewModal
          isOpen={Boolean(previewDocument)}
          onClose={() => setPreviewDocument(null)}
          document={previewDocument}
        />
      )}
    </div>
  );
};
