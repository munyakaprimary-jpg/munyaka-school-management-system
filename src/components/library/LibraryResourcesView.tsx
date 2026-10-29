import React, { useState, useEffect, useCallback } from 'react';
import {
  Book,
  BookOpen,
  Download,
  Plus,
  Search,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  FileText,
  Calendar,
  User,
  Trash2,
  Edit,
  Save,
  X,
  Upload,
  Eye,
  Filter,
  Grid,
  Table as TableIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================================
// Types
// ============================================================

interface LibraryBook {
  id: string;
  title: string;
  author: string;
  publisher: string;
  subject: string;
  grade: string;
  isbn: string;
  accessionNo: string;
  totalCopies: number;
  availableCopies: number;
}

interface CirculationRecord {
  id: string;
  borrowerName: string;
  borrowerRole: string; // Learner or Teacher
  bookId: string;
  bookTitle: string;
  issueDate: string;
  dueDate: string;
  status: 'ISSUED' | 'RETURNED';
}

interface EResource {
  id: string;
  title: string;
  grade: string;
  subject: string;
  description: string;
  fileSize: string;
  type: string;
  dataUrl: string;
  uploadDate: string;
}

interface LibraryData {
  books: LibraryBook[];
  circulation: CirculationRecord[];
  eresources: EResource[];
}

interface CurrentUser {
  name: string;
  rbacRole: string;
  [key: string]: unknown;
}

// ============================================================
// Constants
// ============================================================

const STORAGE_KEY = 'munyaka_library_data';
const USER_KEY = 'munyaka_current_user';

const FULL_ACCESS_ROLES = ['library_teacher', 'admin', 'dhoi'];
const VIEW_ONLY_ROLES = ['class_teacher', 'subject_teacher'];

const GRADES = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11', 'Grade 12',
];

const SUBJECTS = [
  'Mathematics', 'English', 'Kiswahili', 'Integrated Science',
  'Physics', 'Chemistry', 'Biology', 'Geography', 'History',
  'Civics', 'Computer Studies', 'Home Science', 'Art',
  'Physical Education', 'Agriculture', 'Business Studies',
];

const BORROWER_ROLES = ['Learner', 'Teacher'];

// ============================================================
// Default Seed Data
// ============================================================

const defaultBooks: LibraryBook[] = [
  {
    id: '1',
    title: 'Grade 7 Mathematics - Mentor Series',
    author: 'JKF',
    publisher: 'Mentor Publishers',
    subject: 'Mathematics',
    grade: 'Grade 7',
    isbn: '978-9966-0-256-5',
    accessionNo: 'MNK-BK-001',
    totalCopies: 45,
    availableCopies: 38,
  },
  {
    id: '2',
    title: 'Grade 8 Integrated Science Guide',
    author: 'Spotlight',
    publisher: 'Spotlight Publishers',
    subject: 'Integrated Science',
    grade: 'Grade 8',
    isbn: '978-9966-0-256-6',
    accessionNo: 'MNK-BK-002',
    totalCopies: 30,
    availableCopies: 12,
  },
  {
    id: '3',
    title: 'Grade 4 Kiswahili Insha Workbook',
    author: 'KLB',
    publisher: 'KLB Publishers',
    subject: 'Kiswahili',
    grade: 'Grade 4',
    isbn: '978-9966-0-256-7',
    accessionNo: 'MNK-BK-003',
    totalCopies: 50,
    availableCopies: 50,
  },
  {
    id: '4',
    title: 'Grade 9 English Reading Comprehension',
    author: 'Longhorn',
    publisher: 'Longhorn Publishers',
    subject: 'English',
    grade: 'Grade 9',
    isbn: '978-9966-0-256-8',
    accessionNo: 'MNK-BK-004',
    totalCopies: 25,
    availableCopies: 18,
  },
  {
    id: '5',
    title: 'Grade 6 Social Studies - Understanding Social Religions',
    author: 'Evans',
    publisher: 'Evans Publishers',
    subject: 'Social Studies',
    grade: 'Grade 6',
    isbn: '978-9966-0-256-9',
    accessionNo: 'MNK-BK-005',
    totalCopies: 20,
    availableCopies: 5,
  },
];

const defaultEResources: EResource[] = [
  {
    id: 'er-1',
    title: 'Grade 7 Mathematics - Algebra Basics',
    grade: 'Grade 7',
    subject: 'Mathematics',
    description: 'Introduction to algebraic expressions and equations for Grade 7 students.',
    fileSize: '2.4 MB',
    type: 'PDF',
    dataUrl: '',
    uploadDate: '2024-01-15',
  },
  {
    id: 'er-2',
    title: 'Grade 8 Integrated Science - Human Digestive System',
    grade: 'Grade 8',
    subject: 'Integrated Science',
    description: 'Detailed diagrams and notes on the human digestive system.',
    fileSize: '3.1 MB',
    type: 'PDF',
    dataUrl: '',
    uploadDate: '2024-01-10',
  },
  {
    id: 'er-3',
    title: 'Grade 4 Kiswahili - Insha Writing Guide',
    grade: 'Grade 4',
    subject: 'Kiswahili',
    description: 'Step-by-step guide to writing formal Kiswahili letters (insha).',
    fileSize: '1.8 MB',
    type: 'PDF',
    dataUrl: '',
    uploadDate: '2024-01-05',
  },
];

const defaultCirculation: CirculationRecord[] = [
  {
    id: 'circ-1',
    borrowerName: 'Amina Hassan',
    borrowerRole: 'Learner',
    bookId: '1',
    bookTitle: 'Grade 7 Mathematics - Mentor Series',
    issueDate: '2024-01-20',
    dueDate: '2024-02-03',
    status: 'ISSUED',
  },
  {
    id: 'circ-2',
    borrowerName: 'David Ochieng',
    borrowerRole: 'Learner',
    bookId: '2',
    bookTitle: 'Grade 8 Integrated Science Guide',
    issueDate: '2024-01-18',
    dueDate: '2024-01-25',
    status: 'ISSUED',
  },
];

// ============================================================
// Helper Functions
// ============================================================

const loadLibraryData = (): LibraryData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        books: parsed.books || defaultBooks,
        circulation: parsed.circulation || defaultCirculation,
        eresources: parsed.eresources || defaultEResources,
      };
    }
  } catch {
    // Fall through to defaults
  }
  return {
    books: defaultBooks,
    circulation: defaultCirculation,
    eresources: defaultEResources,
  };
};

const saveLibraryData = (data: LibraryData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
};

const getCurrentUser = (): CurrentUser | null => {
  try {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Fall through
  }
  return null;
};

const hasFullAccess = (role: string): boolean => {
  return FULL_ACCESS_ROLES.includes(role);
};

const isViewOnly = (role: string): boolean => {
  return VIEW_ONLY_ROLES.includes(role);
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const generateId = (): string => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const getDaysOverdue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ============================================================
// Main Component
// ============================================================

export const LibraryResourcesView: React.FC = () => {
  const [books, setBooks] = useState<LibraryBook[]>(() => loadLibraryData().books);
  const [circulation, setCirculation] = useState<CirculationRecord[]>(
    () => loadLibraryData().circulation,
  );
  const [eresources, setEResources] = useState<EResource[]>(
    () => loadLibraryData().eresources,
  );
  const [activeTab, setActiveTab] = useState<'catalog' | 'circulation' | 'eresources'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Modals
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isEditBookOpen, setIsEditBookOpen] = useState(false);
  const [isIssueBookOpen, setIsIssueBookOpen] = useState(false);
  const [isUploadResourceOpen, setIsUploadResourceOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<LibraryBook | null>(null);

  // Form states
  const [bookForm, setBookForm] = useState<Partial<LibraryBook>>({});
  const [issueForm, setIssueForm] = useState<{
    borrowerName: string;
    borrowerRole: string;
    bookId: string;
    dueDate: string;
  }>({ borrowerName: '', borrowerRole: 'Learner', bookId: '', dueDate: '' });
  const [resourceForm, setResourceForm] = useState<{
    title: string;
    grade: string;
    subject: string;
    description: string;
    file: File | null;
  }>({ title: '', grade: '', subject: '', description: '', file: null });

  // Persist to localStorage whenever data changes
  useEffect(() => {
    saveLibraryData({ books, circulation, eresources });
  }, [books, circulation, eresources]);

  // Load current user on mount
  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const rbacRole = currentUser?.rbacRole || 'guest';
  const canEdit = hasFullAccess(rbacRole);
  const isReadOnly = isViewOnly(rbacRole);

  // ============================================================
  // Computed Metrics
  // ============================================================

  const totalTitles = books.length;
  const totalVolumes = books.reduce((sum, b) => sum + b.totalCopies, 0);
  const issuedVolumes = books.reduce((sum, b) => sum + (b.totalCopies - b.availableCopies), 0);
  const availableVolumes = books.reduce((sum, b) => sum + b.availableCopies, 0);
  const activeLoans = circulation.filter((c) => c.status === 'ISSUED').length;
  const overdueLoans = circulation.filter(
    (c) => c.status === 'ISSUED' && getDaysOverdue(c.dueDate) > 0,
  ).length;
  const totalEResources = eresources.length;

  // ============================================================
  // Filtered Books
  // ============================================================

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.accessionNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeFilter === 'all' || book.grade === gradeFilter;
    const matchesSubject = subjectFilter === 'all' || book.subject === subjectFilter;
    return matchesSearch && matchesGrade && matchesSubject;
  });

  // ============================================================
  // Book CRUD Operations
  // ============================================================

  const resetBookForm = () => {
    setBookForm({});
    setEditingBook(null);
  };

  const handleAddBook = () => {
    if (!bookForm.title || !bookForm.author) return;
    const newBook: LibraryBook = {
      id: generateId(),
      title: bookForm.title,
      author: bookForm.author,
      publisher: bookForm.publisher || '',
      subject: bookForm.subject || '',
      grade: bookForm.grade || '',
      isbn: bookForm.isbn || '',
      accessionNo: bookForm.accessionNo || '',
      totalCopies: bookForm.totalCopies || 1,
      availableCopies: bookForm.totalCopies || 1,
    };
    setBooks([newBook, ...books]);
    resetBookForm();
    setIsAddBookOpen(false);
  };

  const handleEditBook = () => {
    if (!editingBook || !bookForm.title) return;
    const updatedBooks = books.map((b) =>
      b.id === editingBook.id
        ? { ...b, ...bookForm, totalCopies: bookForm.totalCopies || b.totalCopies }
        : b,
    );
    setBooks(updatedBooks);
    resetBookForm();
    setIsEditBookOpen(false);
  };

  const handleDeleteBook = (id: string) => {
    const book = books.find((b) => b.id === id);
    if (!book) return;
    // Check if book has active loans
    const hasActiveLoans = circulation.some(
      (c) => c.bookId === id && c.status === 'ISSUED',
    );
    if (hasActiveLoans) {
      alert('Cannot delete a book with active loans. Please return all copies first.');
      return;
    }
    setBooks(books.filter((b) => b.id !== id));
  };

  // ============================================================
  // Circulation Operations
  // ============================================================

  const handleIssueBook = () => {
    if (!issueForm.borrowerName || !issueForm.bookId || !issueForm.dueDate) return;
    const book = books.find((b) => b.id === issueForm.bookId);
    if (!book || book.availableCopies <= 0) {
      alert('This book is not available for issue.');
      return;
    }
    const newRecord: CirculationRecord = {
      id: generateId(),
      borrowerName: issueForm.borrowerName,
      borrowerRole: issueForm.borrowerRole,
      bookId: issueForm.bookId,
      bookTitle: book.title,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: issueForm.dueDate,
      status: 'ISSUED',
    };
    setCirculation([newRecord, ...circulation]);
    // Decrement available copies
    setBooks(
      books.map((b) =>
        b.id === issueForm.bookId
          ? { ...b, availableCopies: b.availableCopies - 1 }
          : b,
      ),
    );
    setIssueForm({
      borrowerName: '',
      borrowerRole: 'Learner',
      bookId: '',
      dueDate: '',
    });
    setIsIssueBookOpen(false);
  };

  const handleMarkReturned = (recordId: string) => {
    const record = circulation.find((c) => c.id === recordId);
    if (!record || record.status === 'RETURNED') return;
    // Increment available copies
    setBooks(
      books.map((b) =>
        b.id === record.bookId
          ? { ...b, availableCopies: b.availableCopies + 1 }
          : b,
      ),
    );
    setCirculation(
      circulation.map((c) =>
        c.id === recordId ? { ...c, status: 'RETURNED' } : c,
      ),
    );
  };

  // ============================================================
  // E-Resource Operations
  // ============================================================

  const handleUploadResource = () => {
    if (!resourceForm.title || !resourceForm.file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newResource: EResource = {
        id: generateId(),
        title: resourceForm.title,
        grade: resourceForm.grade,
        subject: resourceForm.subject,
        description: resourceForm.description,
        fileSize: formatFileSize(resourceForm.file!.size),
        type: resourceForm.file!.type.includes('pdf') ? 'PDF' : 'Document',
        dataUrl,
        uploadDate: new Date().toISOString().split('T')[0],
      };
      setEResources([newResource, ...eresources]);
      setResourceForm({
        title: '',
        grade: '',
        subject: '',
        description: '',
        file: null,
      });
      setIsUploadResourceOpen(false);
    };
    reader.readAsDataURL(resourceForm.file);
  };

  const handleDownload = (resource: EResource) => {
    if (!resource.dataUrl) {
      alert('This is a sample resource. In production, this would download the actual file.');
      return;
    }
    const link = document.createElement('a');
    link.href = resource.dataUrl;
    link.download = `${resource.title}.pdf`;
    link.click();
  };

  const handlePreview = (resource: EResource) => {
    if (!resource.dataUrl) {
      alert('This is a sample resource. In production, this would open a preview.');
      return;
    }
    window.open(resource.dataUrl, '_blank');
  };

  // ============================================================
  // Render Helpers
  // ============================================================

  const renderMetricCard = (
    title: string,
    value: string | number,
    icon: React.ReactNode,
    subtitle?: string,
    color?: string,
  ) => (
    <Card className={`border-0 shadow-lg ${color || 'bg-white'}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  // ============================================================
  // JSX
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Library & E-Resources Workstation
          </h1>
          <p className="text-slate-600">
            CBC Learning Resources Management System
            {rbacRole && (
              <span className="ml-3 text-sm text-slate-500">
                (Role: <span className="font-medium text-slate-700">{rbacRole}</span>
                {canEdit && <span className="text-green-600"> — Full Access</span>}
                {isReadOnly && <span className="text-amber-600"> — View Only</span>}
                {!canEdit && !isReadOnly && <span className="text-red-600"> — No Access</span>}
                )
              </span>
            )}
          </p>
        </div>

        {/* Metrics Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {renderMetricCard(
            'Total Titles',
            totalTitles,
            <BookOpen className="h-5 w-5 text-blue-600" />,
            'Cataloged book titles',
            'bg-white',
          )}
          {renderMetricCard(
            'Physical Volumes',
            totalVolumes,
            <Book className="h-5 w-5 text-purple-600" />,
            `${availableVolumes} in stock, ${issuedVolumes} issued`,
            'bg-white',
          )}
          {renderMetricCard(
            'Active Book Loans',
            activeLoans,
            <RefreshCw className="h-5 w-5 text-amber-600" />,
            overdueLoans > 0
              ? `${overdueLoans} overdue`
              : 'All current',
            'bg-white',
          )}
          {renderMetricCard(
            'Digital E-Resources',
            totalEResources,
            <FileText className="h-5 w-5 text-emerald-600" />,
            'PDFs & worksheets uploaded',
            'bg-white',
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-md rounded-xl p-1">
            <TabsTrigger
              value="catalog"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg py-3"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Physical Book Inventory
            </TabsTrigger>
            <TabsTrigger
              value="circulation"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg py-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Circulation Terminal
            </TabsTrigger>
            <TabsTrigger
              value="eresources"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-3"
            >
              <FileText className="h-4 w-4 mr-2" />
              Digital E-Resources Hub
            </TabsTrigger>
          </TabsList>

          {/* ============================================================
              TAB 1: Physical Book Inventory (Catalog)
          ============================================================ */}
          <TabsContent value="catalog" className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by title, author, ISBN, or accession no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-40 border-slate-300">
                    <SelectValue placeholder="Filter by Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {GRADES.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-44 border-slate-300">
                    <SelectValue placeholder="Filter by Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {canEdit && (
                  <Dialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => resetBookForm()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Book Title
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add New Book Title</DialogTitle>
                        <DialogDescription>
                          Enter the details for the new book in the library catalog.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div>
                          <Label htmlFor="title">Title *</Label>
                          <Input
                            id="title"
                            value={bookForm.title || ''}
                            onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="author">Author *</Label>
                          <Input
                            id="author"
                            value={bookForm.author || ''}
                            onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="publisher">Publisher</Label>
                          <Input
                            id="publisher"
                            value={bookForm.publisher || ''}
                            onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="subject">Subject / Learning Area</Label>
                          <Select
                            value={bookForm.subject || ''}
                            onValueChange={(v) => setBookForm({ ...bookForm, subject: v })}
                          >
                            <SelectTrigger id="subject" className="mt-1">
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {SUBJECTS.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="grade">Grade Level</Label>
                          <Select
                            value={bookForm.grade || ''}
                            onValueChange={(v) => setBookForm({ ...bookForm, grade: v })}
                          >
                            <SelectTrigger id="grade" className="mt-1">
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {GRADES.map((g) => (
                                <SelectItem key={g} value={g}>{g}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="isbn">ISBN / Accession No</Label>
                          <Input
                            id="isbn"
                            value={bookForm.isbn || ''}
                            onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                            className="mt-1"
                            placeholder="ISBN or Accession No"
                          />
                        </div>
                        <div>
                          <Label htmlFor="accessionNo">Accession No</Label>
                          <Input
                            id="accessionNo"
                            value={bookForm.accessionNo || ''}
                            onChange={(e) => setBookForm({ ...bookForm, accessionNo: e.target.value })}
                            className="mt-1"
                            placeholder="MNK-BK-XXX"
                          />
                        </div>
                        <div>
                          <Label htmlFor="totalCopies">Total Copies</Label>
                          <Input
                            id="totalCopies"
                            type="number"
                            min="1"
                            value={bookForm.totalCopies || ''}
                            onChange={(e) => setBookForm({ ...bookForm, totalCopies: parseInt(e.target.value) || 1 })}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddBookOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddBook} className="bg-blue-600 hover:bg-blue-700">
                          Save Book
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {/* Books Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100">
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Accession No</TableHead>
                    <TableHead className="text-center">Total Copies</TableHead>
                    <TableHead className="text-center">Available</TableHead>
                    <TableHead className="text-center">Issued</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBooks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                        No books found matching your search criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBooks.map((book) => {
                      const issued = book.totalCopies - book.availableCopies;
                      return (
                        <TableRow key={book.id} className="hover:bg-slate-50">
                          <TableCell className="font-medium">{book.title}</TableCell>
                          <TableCell>{book.author}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {book.subject}
                            </Badge>
                          </TableCell>
                          <TableCell>{book.grade}</TableCell>
                          <TableCell className="text-sm text-slate-500">{book.accessionNo}</TableCell>
                          <TableCell className="text-center">{book.totalCopies}</TableCell>
                          <TableCell className="text-center">
                            <span className="font-medium text-green-600">{book.availableCopies}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-medium text-amber-600">{issued}</span>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            {canEdit && (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingBook(book);
                                          setBookForm(book);
                                          setIsEditBookOpen(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit Book</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteBook(book.id)}
                                      >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete Book</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}
                            {!canEdit && isReadOnly && (
                              <Badge variant="outline" className="text-xs">
                                View Only
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ============================================================
              TAB 2: Circulation Terminal (Issue & Return)
          ============================================================ */}
          <TabsContent value="circulation" className="space-y-6">
            {/* Issue Form */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-amber-600" />
                  Issue Book to Student/Teacher
                </CardTitle>
              </CardHeader>
              <CardContent>
                {canEdit ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="borrowerName">Borrower Name</Label>
                      <Input
                        id="borrowerName"
                        value={issueForm.borrowerName}
                        onChange={(e) => setIssueForm({ ...issueForm, borrowerName: e.target.value })}
                        placeholder="Enter name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="borrowerRole">Borrower Role</Label>
                      <Select
                        value={issueForm.borrowerRole}
                        onValueChange={(v) => setIssueForm({ ...issueForm, borrowerRole: v })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BORROWER_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="bookSelect">Select Book Title</Label>
                      <Select
                        value={issueForm.bookId}
                        onValueChange={(v) => setIssueForm({ ...issueForm, bookId: v })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select a book" />
                        </SelectTrigger>
                        <SelectContent>
                          {books
                            .filter((b) => b.availableCopies > 0)
                            .map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.title} ({b.availableCopies} available)
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dueDate">Return Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={issueForm.dueDate}
                        onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>
                      {isReadOnly
                        ? 'View-only access: You can browse circulation records but cannot issue books.'
                        : 'You do not have permission to issue books.'}
                    </p>
                  </div>
                )}
              </CardContent>
              {canEdit && (
                <div className="px-6 pb-4">
                  <Button
                    onClick={handleIssueBook}
                    disabled={!issueForm.borrowerName || !issueForm.bookId || !issueForm.dueDate}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Issue Book
                  </Button>
                </div>
              )}
            </Card>

            {/* Outstanding Loans Table */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Book className="h-5 w-5 text-blue-600" />
                    Outstanding Loans
                  </span>
                  <Badge variant="secondary" className="bg-slate-100">
                    {circulation.filter((c) => c.status === 'ISSUED').length} active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-100">
                        <TableHead>Borrower Name</TableHead>
                        <TableHead>Borrower Role</TableHead>
                        <TableHead>Book Title</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {circulation.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                            No circulation records found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        circulation.map((record) => {
                          const daysOverdue = getDaysOverdue(record.dueDate);
                          const isOverdue = record.status === 'ISSUED' && daysOverdue > 0;
                          return (
                            <TableRow key={record.id} className="hover:bg-slate-50">
                              <TableCell className="font-medium">{record.borrowerName}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={record.borrowerRole === 'Teacher' ? 'default' : 'secondary'}
                                  className={
                                    record.borrowerRole === 'Teacher'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }
                                >
                                  {record.borrowerRole}
                                </Badge>
                              </TableCell>
                              <TableCell>{record.bookTitle}</TableCell>
                              <TableCell className="text-sm text-slate-600">{record.issueDate}</TableCell>
                              <TableCell className="text-sm text-slate-600">{record.dueDate}</TableCell>
                              <TableCell>
                                {record.status === 'ISSUED' ? (
                                  isOverdue ? (
                                    <Badge className="bg-red-100 text-red-800">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Overdue ({daysOverdue}d)
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-green-100 text-green-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Active
                                    </Badge>
                                  )
                                ) : (
                                  <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                    Returned
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {record.status === 'ISSUED' && canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkReturned(record.id)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Mark Returned
                                  </Button>
                                )}
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
          </TabsContent>

          {/* ============================================================
              TAB 3: Digital E-Resources Hub
          ============================================================ */}
          <TabsContent value="eresources" className="space-y-6">
            {/* Upload Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-700">
                Digital E-Resources ({totalEResources} resources)
              </h2>
              {canEdit && (
                <Dialog open={isUploadResourceOpen} onOpenChange={setIsUploadResourceOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload E-Resource
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Upload E-Resource</DialogTitle>
                      <DialogDescription>
                        Upload a PDF or worksheet for the digital library.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="resourceTitle">Resource Title *</Label>
                        <Input
                          id="resourceTitle"
                          value={resourceForm.title}
                          onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                          placeholder="e.g. Grade 7 Mathematics - Algebra Basics"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="resourceGrade">Grade Level</Label>
                        <Select
                          value={resourceForm.grade}
                          onValueChange={(v) => setResourceForm({ ...resourceForm, grade: v })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADES.map((g) => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="resourceSubject">Subject</Label>
                        <Select
                          value={resourceForm.subject}
                          onValueChange={(v) => setResourceForm({ ...resourceForm, subject: v })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBJECTS.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="resourceFile">PDF File *</Label>
                        <Input
                          id="resourceFile"
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={(e) =>
                            setResourceForm({
                              ...resourceForm,
                              file: e.target.files?.[0] || null,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="resourceDescription">Description</Label>
                        <Textarea
                          id="resourceDescription"
                          value={resourceForm.description}
                          onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                          placeholder="Brief description of this resource..."
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsUploadResourceOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUploadResource}
                        disabled={!resourceForm.title || !resourceForm.file}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Upload Resource
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* E-Resource Cards Grid */}
            {eresources.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <FileText className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No E-Resources Found</h3>
                <p className="text-slate-500">
                  {canEdit
                    ? 'Upload your first e-resource to get started.'
                    : 'No digital resources available at this time.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {eresources.map((resource) => (
                  <Card
                    key={resource.id}
                    className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-slate-800">{resource.title}</CardTitle>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {resource.grade}
                            </Badge>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                              {resource.subject}
                            </Badge>
                          </div>
                        </div>
                        <FileText className="h-8 w-8 text-emerald-500 flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                        {resource.description || 'No description available.'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {resource.type}
                        </span>
                        <span>{resource.fileSize}</span>
                        <span>{resource.uploadDate}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleDownload(resource)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                          onClick={() => handlePreview(resource)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Book Dialog */}
      <Dialog open={isEditBookOpen} onOpenChange={setIsEditBookOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Book Title</DialogTitle>
            <DialogDescription>
              Update the details for "{editingBook?.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={bookForm.title || ''}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-author">Author *</Label>
              <Input
                id="edit-author"
                value={bookForm.author || ''}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-publisher">Publisher</Label>
              <Input
                id="edit-publisher"
                value={bookForm.publisher || ''}
                onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-subject">Subject / Learning Area</Label>
              <Select
                value={bookForm.subject || ''}
                onValueChange={(v) => setBookForm({ ...bookForm, subject: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-grade">Grade Level</Label>
              <Select
                value={bookForm.grade || ''}
                onValueChange={(v) => setBookForm({ ...bookForm, grade: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-isbn">ISBN / Accession No</Label>
              <Input
                id="edit-isbn"
                value={bookForm.isbn || ''}
                onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-accessionNo">Accession No</Label>
              <Input
                id="edit-accessionNo"
                value={bookForm.accessionNo || ''}
                onChange={(e) => setBookForm({ ...bookForm, accessionNo: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-totalCopies">Total Copies</Label>
              <Input
                id="edit-totalCopies"
                type="number"
                min="1"
                value={bookForm.totalCopies || ''}
                onChange={(e) => setBookForm({ ...bookForm, totalCopies: parseInt(e.target.value) || 1 })}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetBookForm(); setIsEditBookOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={handleEditBook} className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LibraryResourcesView;
