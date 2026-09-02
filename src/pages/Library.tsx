"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import BackButton from '@/components/ui/BackButton';
import { Book as BookIcon, Search, Plus, BookOpen, History, AlertCircle } from 'lucide-react';
import { BOOKS } from '@/lib/mock-data';
import { Book, BorrowLog, getLogBalance } from '@/types/library';
import { IssueBookModal } from '@/components/library/IssueBookModal';
import { BookHistoryModal } from '@/components/library/BookHistoryModal';
import { RegisterBookModal } from '@/components/library/RegisterBookModal';
import { showSuccess, showError } from '@/utils/toast';
import { notifyDataChanged } from '@/utils/storage';
import { cn } from '@/lib/utils';

const DEFAULT_BORROW_LOGS: BorrowLog[] = [
  {
    id: "log-1",
    bookId: "1",
    bookTitle: "Spark: English Grade 4",
    borrowerName: "Brian Kiptoo",
    borrowerType: "Student",
    grade: "Grade 4",
    stream: "Blue",
    issuedDate: "2024-10-10",
    dueDate: "2024-10-24",
    status: "Issued",
    qty_issued: 3,
    qty_returned: 1,
    qty_lost: 0
  },
  {
    id: "log-2",
    bookId: "1",
    bookTitle: "Spark: English Grade 4",
    borrowerName: "Mary Atieno",
    borrowerType: "Student",
    grade: "Grade 4",
    stream: "Blue",
    issuedDate: "2024-09-15",
    dueDate: "2024-09-29",
    returnedDate: "2024-09-28",
    status: "Returned",
    qty_issued: 2,
    qty_returned: 2,
    qty_lost: 0
  },
  {
    id: "log-3",
    bookId: "2",
    bookTitle: "KLB Mathematics Grade 5",
    borrowerName: "Jane Mwangi",
    borrowerType: "Staff",
    issuedDate: "2024-10-01",
    dueDate: "2024-10-15",
    status: "Issued",
    qty_issued: 1,
    qty_returned: 0,
    qty_lost: 0
  }
];

const Library = () => {
  // Books State with Local Storage Persistence
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('munyaka_library_books');
    return saved ? JSON.parse(saved) : BOOKS;
  });

  // Borrowing History Logs State with Local Storage Persistence
  const [historyLogs, setHistoryLogs] = useState<BorrowLog[]>(() => {
    const saved = localStorage.getItem('munyaka_library_history');
    return saved ? JSON.parse(saved) : DEFAULT_BORROW_LOGS;
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedAreaCategory] = useState("All Categories");

  // Modal States
  const [isRegisterBookOpen, setIsRegisterBookOpen] = useState(false);
  const [selectedBookForIssue, setSelectedBookForIssue] = useState<Book | null>(null);
  const [selectedBookForHistory, setSelectedBookForHistory] = useState<Book | null>(null);

  // Sync to Local Storage
  useEffect(() => {
    localStorage.setItem('munyaka_library_books', JSON.stringify(books));
    notifyDataChanged('munyaka_library_books');
  }, [books]);

  useEffect(() => {
    localStorage.setItem('munyaka_library_history', JSON.stringify(historyLogs));
    notifyDataChanged('munyaka_library_history');
  }, [historyLogs]);

  // Derived Filtered Books
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const matchesSearch = 
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.isbn.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === "All Categories" || b.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [books, searchQuery, selectedCategory]);

  // Register New Book Handler
  const handleRegisterBook = (bookData: Omit<Book, 'id' | 'borrowed'>) => {
    const newBook: Book = {
      ...bookData,
      id: `bk-${Date.now()}`,
      borrowed: 0
    };

    setBooks(prev => [newBook, ...prev]);
    showSuccess(`Registered "${newBook.title}" (${newBook.stock} copies) into library catalog!`);
  };

  // Issue Book Action Handler (Supports multi-copy quantity, Grade, and Stream)
  const handleIssueBook = async (
    bookId: string, 
    borrowerName: string, 
    borrowerType: 'Student' | 'Staff', 
    dueDate: string,
    quantity: number = 1,
    grade?: string,
    stream?: string
  ) => {
    // Artificial delay for smooth UX transition
    await new Promise(r => setTimeout(r, 600));

    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const available = book.stock - book.borrowed;
    if (available < quantity) {
      showError(`Only ${available} copies available!`);
      return;
    }

    // 1. Increment borrowed count by quantity
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, borrowed: b.borrowed + quantity } : b));

    // 2. Create history log entry
    const newLog: BorrowLog = {
      id: `log-${Date.now()}`,
      bookId,
      bookTitle: book.title,
      borrowerName,
      borrowerType,
      grade,
      stream,
      issuedDate: new Date().toISOString().split('T')[0],
      dueDate,
      status: "Issued",
      qty_issued: quantity,
      qty_returned: 0,
      qty_lost: 0
    };

    setHistoryLogs(prev => [newLog, ...prev]);
    showSuccess(`Issued ${quantity} copy${quantity > 1 ? 'ies' : ''} of "${book.title}" to ${borrowerName}!`);
  };

  // Process Partial Return / Loss Handler
  const handleProcessReturn = (logId: string, qtyReturned: number, qtyLost: number) => {
    const log = historyLogs.find(l => l.id === logId);
    if (!log) return;

    const totalProcessed = qtyReturned + qtyLost;
    const currentReturned = log.qty_returned || 0;
    const currentLost = log.qty_lost || 0;

    const newReturnedTotal = currentReturned + qtyReturned;
    const newLostTotal = currentLost + qtyLost;
    const newBalance = log.qty_issued - (newReturnedTotal + newLostTotal);

    // 1. Update the log record
    const todayStr = new Date().toISOString().split('T')[0];
    setHistoryLogs(prev => prev.map(l => {
      if (l.id === logId) {
        return {
          ...l,
          qty_returned: newReturnedTotal,
          qty_lost: newLostTotal,
          returnedDate: newBalance === 0 ? todayStr : l.returnedDate,
          status: newBalance === 0 ? (newLostTotal > 0 ? 'Closed' : 'Returned') : 'Issued'
        };
      }
      return l;
    }));

    // 2. Update the Book stock & borrowed count:
    // - Borrowed count decreases by totalProcessed (returned + lost books are no longer on loan)
    // - Stock count decreases by qtyLost (lost books are permanently removed from inventory)
    setBooks(prev => prev.map(b => {
      if (b.id === log.bookId) {
        const newBorrowed = Math.max(0, b.borrowed - totalProcessed);
        const newStock = Math.max(0, b.stock - qtyLost);
        return { ...b, borrowed: newBorrowed, stock: newStock };
      }
      return b;
    }));

    let msg = `Processed return for ${log.borrowerName}: `;
    if (qtyReturned > 0) msg += `${qtyReturned} returned. `;
    if (qtyLost > 0) msg += `${qtyLost} declared lost. `;
    showSuccess(msg);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Library & E-Resources</h1>
            <p className="text-muted-foreground">Manage textbooks, supplementary materials, and circulation history.</p>
          </div>
        </div>
        <Button 
          onClick={() => setIsRegisterBookOpen(true)}
          className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 font-bold"
        >
          <Plus size={18} /> Register New Book
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search books by title, author, or ISBN..." 
            className="pl-12 h-14 rounded-3xl border-none shadow-sm bg-white font-medium" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedAreaCategory(e.target.value)}
          className="h-14 rounded-3xl border-none shadow-sm bg-white px-6 text-sm font-bold text-slate-600 outline-none cursor-pointer"
        >
          <option>All Categories</option>
          <option>Core Text</option>
          <option>Reference</option>
          <option>Supplementary</option>
        </select>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBooks.map((book) => {
          const available = book.stock - book.borrowed;
          const isOutOfStock = available <= 0;
          const usagePercent = Math.min(100, Math.round((book.borrowed / Math.max(1, book.stock)) * 100));

          return (
            <Card key={book.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white overflow-hidden group">
              <CardContent className="p-0 flex h-full">
                <div className="w-32 bg-slate-50 flex flex-col items-center justify-center border-r shrink-0 p-4 text-center">
                  <BookIcon size={40} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{book.category}</span>
                </div>

                <div className="p-8 flex-1 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2 rounded-lg text-[10px] uppercase font-black tracking-widest border-slate-100 bg-slate-50">
                          {book.category}
                        </Badge>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 mt-1">{book.author} • ISBN: {book.isbn}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={cn("text-lg font-black", isOutOfStock ? "text-rose-600" : "text-slate-900")}>
                          {available}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Available</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 mt-4">
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        <span>Circulation Usage</span>
                        <span className={usagePercent > 90 ? "text-rose-600" : "text-emerald-600"}>
                          {usagePercent}% Issued
                        </span>
                      </div>
                      <Progress value={usagePercent} className="h-1.5" />
                    </div>
                  </div>

                  {/* Functional Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      disabled={isOutOfStock}
                      onClick={() => setSelectedBookForIssue(book)}
                      className={cn(
                        "rounded-xl h-9 text-xs font-bold transition-all gap-1.5",
                        isOutOfStock 
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60" 
                          : "text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:scale-95"
                      )}
                    >
                      <BookOpen size={14} /> 
                      {isOutOfStock ? "Out of Stock" : "Issue Book"}
                    </Button>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedBookForHistory(book)}
                      className="rounded-xl h-9 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors gap-1.5 cursor-pointer"
                    >
                      <History size={14} /> View History
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modals */}
      <RegisterBookModal
        isOpen={isRegisterBookOpen}
        onClose={() => setIsRegisterBookOpen(false)}
        onRegisterBook={handleRegisterBook}
      />

      <IssueBookModal 
        isOpen={!!selectedBookForIssue}
        onClose={() => setSelectedBookForIssue(null)}
        book={selectedBookForIssue}
        onIssueBook={handleIssueBook}
      />

      <BookHistoryModal 
        isOpen={!!selectedBookForHistory}
        onClose={() => setSelectedBookForHistory(null)}
        book={selectedBookForHistory}
        historyLogs={historyLogs}
        onProcessReturn={handleProcessReturn}
      />
    </div>
  );
};

export default Library;