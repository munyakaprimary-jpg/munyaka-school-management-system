import React, { useState, useEffect } from 'react';
import { X, BookOpen, User, Calendar, Hash, ShieldCheck, Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

export interface IssueBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  book?: {
    id?: string;
    title?: string;
    name?: string;
    bookTitle?: string;
    category?: string;
    type?: string;
    isbn?: string;
    quantity?: number;
    copies?: number;
    stock?: number;
    borrowed?: number;
  } | null;
  onIssueBook?: (bookId: string, borrowerName: string, borrowerType: 'Student' | 'Staff', dueDate: string, quantity: number, grade?: string, stream?: string) => Promise<void>;
  onConfirmIssue?: (issueData: any) => void;
  onSuccess?: () => void;
}

export const IssueBookModal: React.FC<IssueBookModalProps> = ({
  isOpen,
  onClose,
  book: initialBook,
  onIssueBook,
  onConfirmIssue,
  onSuccess
}) => {
  const [selectedBook, setSelectedBook] = useState<any>(initialBook || null);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);

  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerType, setBorrowerType] = useState<'Student' | 'Staff'>('Student');
  const [grade, setGrade] = useState('Grade 4');
  const [stream, setStream] = useState('Blue');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Direct synchronous getter for live inventory
  const getMasterInventory = (): any[] => {
    try {
      const keys = ['munyaka_library_inventory', 'munyaka_library_books', 'library_inventory'];
      for (const k of keys) {
        const str = localStorage.getItem(k);
        if (str) {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (err) {
      console.error('Failed reading inventory:', err);
    }
    return [];
  };

  useEffect(() => {
    if (isOpen) {
      const stock = getMasterInventory();
      if (initialBook) {
        setSelectedBook(initialBook);
        setItemSearchQuery(initialBook.title || initialBook.name || initialBook.bookTitle || '');
      } else if (stock.length > 0) {
        setSelectedBook(stock[0]);
        setItemSearchQuery(stock[0].title || stock[0].name || stock[0].bookTitle || '');
      } else {
        setSelectedBook(null);
        setItemSearchQuery('');
      }
    }
  }, [isOpen, initialBook]);

  if (!isOpen) return null;

  // 2. Filter dynamically based on search query
  const masterStock = getMasterInventory();
  const searchMatches = masterStock.filter((item: any) => {
    const title = (item.title || item.name || item.bookTitle || '').toString().toLowerCase();
    const query = (itemSearchQuery || '').toString().toLowerCase().trim();
    return query === '' || title.includes(query);
  });

  const stockCount = Number(selectedBook?.quantity ?? selectedBook?.copies ?? selectedBook?.stock ?? 10);
  const borrowedCount = Number(selectedBook?.borrowed ?? 0);
  const availableCopies = Math.max(0, stockCount - borrowedCount);
  const bookTitle = String(selectedBook?.title || selectedBook?.name || selectedBook?.bookTitle || 'Selected Textbook');
  const bookCategory = String(selectedBook?.category || selectedBook?.type || 'General Inventory');
  const bookIsbn = String(selectedBook?.isbn || 'N/A');
  const bookId = String(selectedBook?.id || `book_${Date.now()}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim()) {
      toast({ title: 'Error', description: 'Please enter the borrower name.', variant: 'destructive' });
      return;
    }
    if (!selectedBook) {
      toast({ title: 'Error', description: 'Please select a book from inventory.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const issueData = {
        bookId,
        bookTitle,
        borrowerName: borrowerName.trim(),
        borrowerType,
        dueDate,
        quantity: Number(quantity),
        grade,
        stream,
        status: 'ISSUED',
        issuedDate: new Date().toISOString().split('T')[0]
      };

      if (onConfirmIssue) {
        onConfirmIssue(issueData);
      }
      if (onIssueBook) {
        await onIssueBook(bookId, borrowerName.trim(), borrowerType, dueDate, Number(quantity), grade, stream);
      }

      // Persist in localStorage circulation log
      try {
        const rawCirc = localStorage.getItem('munyaka_library_circulation') || localStorage.getItem('munyaka_library_loans') || '[]';
        const circList = JSON.parse(rawCirc);
        circList.unshift({
          id: `circ_${Date.now()}`,
          ...issueData
        });
        localStorage.setItem('munyaka_library_circulation', JSON.stringify(circList));
        localStorage.setItem('munyaka_library_loans', JSON.stringify(circList));
      } catch (err) {
        console.error('Error saving circulation record:', err);
      }

      toast({ title: 'Success', description: `Successfully issued "${bookTitle}" to ${borrowerName.trim()}` });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to issue book.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" /> Issue Textbook / Item
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Search inventory and record a circulation loan.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-slate-200 hover:border-slate-300 flex items-center justify-center text-slate-400 hover:text-slate-600 bg-white transition-all text-lg font-medium"
          >
            &times;
          </button>
        </div>

        {/* Form Body Scroll Area */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          {/* Searchable Dropdown for Book Selection */}
          <div className="relative">
            <Label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Select Book / Item <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search book title (e.g. reams, rulers, mathematics)..."
                value={itemSearchQuery}
                onChange={(e) => {
                  setItemSearchQuery(e.target.value);
                  setIsItemDropdownOpen(true);
                }}
                onFocus={() => setIsItemDropdownOpen(true)}
                className="pl-9 w-full border-slate-200 rounded-xl text-sm font-medium bg-white"
              />
            </div>

            {isItemDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                {searchMatches.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 italic">No matching books found in inventory.</div>
                ) : (
                  searchMatches.map((book: any, idx: number) => {
                    const title = book.title || book.name || book.bookTitle || 'Untitled';
                    const avail = Number(book.quantity || book.copies || book.stock || 1);
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedBook(book);
                          setItemSearchQuery(title);
                          setIsItemDropdownOpen(false);
                        }}
                        className="px-4 py-2.5 hover:bg-emerald-50 cursor-pointer text-sm border-b border-gray-100 last:border-0 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">{title}</p>
                          <p className="text-xs text-gray-500">{book.category || book.type || 'General'} • ISBN: {book.isbn || 'N/A'}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          {avail} Avail
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Selected Book Banner Info */}
          {selectedBook && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Active Selection</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">{bookTitle}</h4>
                <p className="text-xs text-slate-600 mt-0.5">{bookCategory} • ISBN: {bookIsbn}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-emerald-700">{availableCopies}</span>
                <span className="text-[10px] text-emerald-600 font-bold block uppercase">Available</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1">Borrower Type</Label>
              <select
                value={borrowerType}
                onChange={(e) => setBorrowerType(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="Student">Student (Learner)</option>
                <option value="Staff">Staff Member</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1">Quantity</Label>
              <Input
                type="number"
                min={1}
                max={Math.max(1, availableCopies)}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1">Borrower Full Name <span className="text-rose-500">*</span></Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                required
                placeholder={borrowerType === 'Student' ? 'e.g. Brian Kiprop' : 'e.g. Mr. Omwamba'}
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                className="pl-9 border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          {borrowerType === 'Student' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1">Grade / Class</Label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-700 focus:outline-none"
                >
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                  <option value="Grade 6">Grade 6</option>
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1">Stream</Label>
                <select
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-700 focus:outline-none"
                >
                  <option value="Blue">Blue</option>
                  <option value="Red">Red</option>
                  <option value="Green">Green</option>
                  <option value="Gold">Gold</option>
                  <option value="Mercury">Mercury</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1">Due Date (Return Deadline)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="pl-9 border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Fixed Footer Actions inside form or bottom bar */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-200 text-slate-600 font-bold text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || availableCopies <= 0 || !selectedBook}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              {isSubmitting ? 'Issuing...' : 'Confirm Book Issue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
