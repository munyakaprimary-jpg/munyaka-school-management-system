"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { BookOpen, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { Book } from '@/types/library';

interface IssueBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
  onIssueBook: (bookId: string, borrowerName: string, borrowerType: 'Student' | 'Staff', dueDate: string) => Promise<void>;
}

export const IssueBookModal: React.FC<IssueBookModalProps> = ({
  isOpen,
  onClose,
  book,
  onIssueBook
}) => {
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerType, setBorrowerType] = useState<'Student' | 'Staff'>("Student");
  
  // Default due date to 14 days from today
  const defaultDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [dueDate, setDueDate] = useState(defaultDueDate);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setBorrowerName("");
      setBorrowerType("Student");
      setDueDate(defaultDueDate);
      setErrorMsg("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!book) return null;

  const availableCopies = book.stock - book.borrowed;

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

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await onIssueBook(book.id, borrowerName.trim(), borrowerType, dueDate);
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
                <BookOpen size={16} /> Issue Book
              </>
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-900">{book.title}</p>
            <p className="text-xs font-bold text-slate-500 mt-0.5">{book.author} • ISBN: {book.isbn}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-black text-indigo-700">{availableCopies}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Available</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Borrower Name</Label>
            <Input 
              value={borrowerName} 
              onChange={e => { setBorrowerName(e.target.value); setErrorMsg(""); }}
              placeholder="e.g. Brian Kiptoo"
              className="h-12 rounded-xl bg-slate-50 border-none font-bold"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Borrower Type</Label>
            <Select value={borrowerType} onValueChange={(val: 'Student' | 'Staff') => setBorrowerType(val)}>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Student">Student</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
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
      </form>
    </Modal>
  );
};