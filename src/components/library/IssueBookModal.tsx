"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { BookOpen, AlertCircle, Loader2, Calendar, Plus, Minus } from 'lucide-react';
import { Book } from '@/types/library';

interface IssueBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
  onIssueBook: (bookId: string, borrowerName: string, borrowerType: 'Student' | 'Staff', dueDate: string, quantity: number) => Promise<void>;
}

export const IssueBookModal: React.FC<IssueBookModalProps> = ({
  isOpen,
  onClose,
  book,
  onIssueBook
}) => {
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerType, setBorrowerType] = useState<'Student' | 'Staff'>("Student");
  const [quantity, setQuantity] = useState<number>(1);
  
  // Default due date to 14 days from today
  const defaultDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [dueDate, setDueDate] = useState(defaultDueDate);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const availableCopies = book ? Math.max(0, book.stock - book.borrowed) : 0;

  useEffect(() => {
    if (isOpen) {
      setBorrowerName("");
      setBorrowerType("Student");
      setQuantity(1);
      setDueDate(defaultDueDate);
      setErrorMsg("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!book) return null;

  const handleDecreaseQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
    setErrorMsg("");
  };

  const handleIncreaseQuantity = () => {
    setQuantity(prev => Math.min(availableCopies, prev + 1));
    setErrorMsg("");
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) {
      setQuantity(1);
    } else {
      setQuantity(Math.max(1, Math.min(availableCopies, val)));
    }
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim()) {
      setErrorMsg("Please enter the name of the borrower.");
      return;
    }

    if (availableCopies <= 0) {
      setErrorMsg("No copies available for issue.");
      return;
    }

    if (quantity < 1) {
      setErrorMsg("Quantity must be at least 1.");
      return;
    }

    if (quantity > availableCopies) {
      setErrorMsg(`Quantity exceeds maximum available stock (${availableCopies} copies).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await onIssueBook(book.id, borrowerName.trim(), borrowerType, dueDate, quantity);
      onClose();
    } catch (err) {
      setErrorMsg("Failed to process book checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Issue Library Book"
      description={`Checkout "${book.title}" to a learner or staff member.`}
      maxWidth="max-w-xl"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="rounded-xl font-bold">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || availableCopies <= 0}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100 gap-2 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Processing...
              </>
            ) : (
              <>
                <BookOpen size={16} /> Issue {quantity} Copy{quantity > 1 ? 'ies' : ''}
              </>
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
            <AlertCircle size={16} className="shrink-0" /> {errorMsg}
          </div>
        )}

        {/* Selected Book Summary Card */}
        <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-900">{book.title}</p>
            <p className="text-xs font-bold text-slate-500 mt-0.5">{book.author} • ISBN: {book.isbn}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-black text-indigo-700">{availableCopies}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Stock</p>
          </div>
        </div>

        {/* Clean Balanced Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Full-width Borrower Name */}
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Borrower Name</Label>
            <Input 
              value={borrowerName} 
              onChange={e => { setBorrowerName(e.target.value); setErrorMsg(""); }}
              placeholder="e.g. Brian Kiptoo"
              className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900"
              autoFocus
            />
          </div>

          {/* Borrower Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Borrower Type</Label>
            <Select value={borrowerType} onValueChange={(val: 'Student' | 'Staff') => setBorrowerType(val)}>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="Student">Student</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Multi-copy Quantity Stepper */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Quantity</Label>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Max: {availableCopies} copies
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleDecreaseQuantity}
                disabled={quantity <= 1 || availableCopies <= 0}
                className="h-12 w-12 rounded-xl border-slate-200 shrink-0 hover:bg-slate-100"
              >
                <Minus size={16} />
              </Button>
              
              <Input 
                type="number"
                min={1}
                max={availableCopies}
                value={quantity}
                onChange={handleQuantityInputChange}
                disabled={availableCopies <= 0}
                className="h-12 rounded-xl bg-slate-50 border-none font-black text-center text-base"
              />
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleIncreaseQuantity}
                disabled={quantity >= availableCopies || availableCopies <= 0}
                className="h-12 w-12 rounded-xl border-slate-200 shrink-0 hover:bg-slate-100"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          {/* Return Due Date */}
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Return Due Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="h-12 pl-10 rounded-xl bg-slate-50 border-none font-bold"
              />
            </div>
          </div>

        </div>
      </form>
    </Modal>
  );
};