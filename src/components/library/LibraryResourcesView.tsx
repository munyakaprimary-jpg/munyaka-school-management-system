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
import AddMaterialModal from '@/components/AddMaterialModal';
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
  if (norm === 'senior_teacher') return 'Senior Teacher';
  if (norm === 'head_teacher') return 'Head Teacher';
  if (norm === 'dhoi') return 'Deputy Head of Institution';
  if (norm === 'admin') return 'System Administrator';
  return 'Staff Member';
};

export default function LibraryResourcesView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserRole = user?.role || (user as any)?.rbacRole || 'subject_teacher';

  const [activeTab, setActiveTab] = useState<'inventory' | 'circulation' | 'eresources'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [selectedBookForAction, setSelectedBookForAction] = useState<any>(null);
  const [previewDocument, setPreviewDocument] = useState<any>(null);

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
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBooks(parsed);
        } else {
          setBooks([]);
        }
      } else {
        setBooks([]);
      }

      const rawCirc = localStorage.getItem('munyaka_library_circulation') || localStorage.getItem('munyaka_library_loans');
      if (rawCirc) {
        setCirculation(JSON.parse(rawCirc));
      } else {
        setCirculation([]);
      }

      const rawRes = localStorage.getItem('munyaka_library_eresources') || localStorage.getItem('munyaka_study_materials');
      if (rawRes) {
        setEResources(JSON.parse(rawRes));
      } else {
        setEResources([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.includes('library') || e.key.includes('study')) {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(loadData, 2000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const handleRegisterBook = (bookData: any) => {
    const updated = [{ ...bookData, id: 'b_' + Date.now() }, ...books];
    setBooks(updated);
    localStorage.setItem('munyaka_library_inventory', JSON.stringify(updated));
    toast({ title: "Success", description: "Book cataloged successfully." });
    setIsRegisterOpen(false);
  };

  const handleConfirmReturn = (logId: string, qtyReturned: number, qtyLost: number) => {
    const updated = circulation.map(c => {
      if (c.id === logId) {
        const returned = (c.returnedQuantity || 0) + qtyReturned;
        const lost = (c.lostQuantity || 0) + qtyLost;
        const totalQty = c.quantity || c.copies || 1;
        const status = returned + lost >= totalQty ? 'RETURNED' : 'PARTIAL';
        return { ...c, returnedQuantity: returned, lostQuantity: lost, status };
      }
      return c;
    });
    setCirculation(updated);
    localStorage.setItem('munyaka_library_circulation', JSON.stringify(updated));
    toast({ title: "Return Processed", description: `Recorded ${qtyReturned} returned and ${qtyLost} lost.` });
    setIsReturnOpen(false);
  };

  const handleDeleteBook = (id: string) => {
    const updated = books.filter(b => b.id !== id);
    setBooks(updated);
    localStorage.setItem('munyaka_library_inventory', JSON.stringify(updated));
    toast({ title: "Deleted", description: "Book removed from inventory." });
  };

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const matchSearch = String(b.title || b.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          String(b.isbn || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'all' || String(b.category || '').toLowerCase() === categoryFilter.toLowerCase();
      return matchSearch && matchCategory;
    });
  }, [books, searchQuery, categoryFilter]);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white font-bold uppercase text-[10px]">Librarian & Asset Portal</Badge>
            <span className="text-xs text-emerald-200 font-medium">• Role: {formatRole(currentUserRole)}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">Library & E-Resources Workstation</h1>
          <p className="text-emerald-100 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
            Manage school textbook inventory, track student book loans, and upload CBC digital reading materials.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 mt-6 relative z-10">
          {hasFullAccess(currentUserRole) && (
            <>
              <Button
                onClick={() => setIsRegisterOpen(true)}
                className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold rounded-xl shadow-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Register New Book
              </Button>
              <Button
                onClick={() => { setSelectedBookForAction(books[0] || null); setIsIssueOpen(true); }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 border border-emerald-500"
              >
                <BookmarkCheck className="w-4 h-4" /> Issue Book Loan
              </Button>
              <Button
                onClick={() => setIsAddMaterialOpen(true)}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 border border-teal-500"
              >
                <FileText className="w-4 h-4" /> Upload E-Resource PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs / Filter Navigation */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            📚 Textbook Inventory ({books.length})
          </button>
          <button
            onClick={() => setActiveTab('circulation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'circulation' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            🔄 Circulation & Loans ({circulation.length})
          </button>
          <button
            onClick={() => setActiveTab('eresources')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'eresources' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            💻 Digital E-Resources ({eResources.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-64 rounded-xl text-xs bg-white"
            />
          </div>
        </div>
      </div>

      {/* Tab Content: INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-sm">No textbook inventory found</h3>
              <p className="text-xs text-slate-500 mt-1">Register new books or check back later.</p>
            </div>
          ) : (
            filteredBooks.map((book: any, idx: number) => {
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
                      {hasFullAccess(currentUserRole) && (
                        <>
                          <Button onClick={() => { setSelectedBookForAction(book); setIsIssueOpen(true); }} size="sm" variant="outline" className="text-xs h-8 rounded-xl font-bold">
                            Issue
                          </Button>
                          <Button onClick={() => handleDeleteBook(book.id)} size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700 h-8 w-8 p-0">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Tab Content: CIRCULATION */}
      {activeTab === 'circulation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Active Textbook Loans & Circulation</h3>
            {hasFullAccess(currentUserRole) && (
              <Button onClick={() => setIsReturnOpen(true)} size="sm" className="bg-emerald-600 text-xs font-bold rounded-xl">
                Process Return
              </Button>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {circulation.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No active circulation loans recorded.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {circulation.map((c: any, idx: number) => (
                  <div key={idx} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{c.bookTitle || c.title || 'Textbook Loan'}</p>
                      <p className="text-slate-500">Borrower: {c.borrowerName || c.learnerName || 'Student'} ({c.grade || 'Grade'})</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${c.status === 'ISSUED' || c.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {c.status || 'Active'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">Due: {c.dueDate || c.returnDate || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: E-RESOURCES */}
      {activeTab === 'eresources' && (
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
                  <Button onClick={() => setPreviewDocument(res)} size="sm" variant="outline" className="text-xs h-8 rounded-xl font-bold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Preview PDF
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
        onRegisterBook={handleRegisterBook}
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
        log={selectedBookForAction}
        onConfirmReturn={handleConfirmReturn}
      />

      {isAddMaterialOpen && (
        <AddMaterialModal
          onClose={() => setIsAddMaterialOpen(false)}
          onSave={() => loadData()}
        />
      )}

      {previewDocument && (
        <DocumentPreviewModal
          file={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </div>
  );
};
