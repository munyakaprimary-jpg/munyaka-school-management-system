import React, { useState } from 'react';
import { X, BookOpen, User, Calendar, Hash, ShieldCheck, Check } from 'lucide-react';
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
    category?: string;
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
  book,
  onIssueBook,
  onConfirmIssue,
  onSuccess
}) => {
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

  if (!isOpen) return null;

  const stockCount = Number(book?.quantity ?? book?.copies ?? book?.stock ?? 10);
  const borrowedCount = Number(book?.borrowed ?? 0);
  const availableCopies = Math.max(0, stockCount - borrowedCount);
  const bookTitle = String(book?.title || 'Selected Textbook');
  const bookCategory = String(book?.category || 'General Inventory');
  const bookIsbn = String(book?.isbn || 'N/A');
  const bookId = String(book?.id || `book_${Date.now()}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim()) {
      toast({ title: 'Error', description: 'Please enter the borrower name.', variant: 'destructive' });
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
            <p className="text-xs text-slate-500 mt-0.5">Record a circulation loan to a student or staff member.</p>
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
          {/* Selected Book Banner */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Selected Book</span>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">{bookTitle}</h4>
              <p className="text-xs text-slate-600 mt-0.5">{bookCategory} • ISBN: {bookIsbn}</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-emerald-700">{availableCopies}</span>
              <span className="text-[10px] text-emerald-600 font-bold block uppercase">Available</span>
            </div>
          </div>

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
              disabled={isSubmitting || availableCopies <= 0}
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
