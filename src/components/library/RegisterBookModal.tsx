"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { BookPlus, AlertCircle } from 'lucide-react';
import { Book } from '@/types/library';

interface RegisterBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterBook: (bookData: Omit<Book, 'id' | 'borrowed'>) => void;
}

export const RegisterBookModal: React.FC<RegisterBookModalProps> = ({
  isOpen,
  onClose,
  onRegisterBook,
}) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [category, setCategory] = useState("Core Text");
  const [stock, setStock] = useState("30");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setAuthor("");
      setIsbn("");
      setCategory("Core Text");
      setStock("30");
      setErrorMsg("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Book title is required.");
      return;
    }
    if (!author.trim()) {
      setErrorMsg("Author name is required.");
      return;
    }
    const numStock = parseInt(stock, 10);
    if (isNaN(numStock) || numStock <= 0) {
      setErrorMsg("Please enter a valid stock quantity.");
      return;
    }

    const generatedIsbn = isbn.trim() || `978-${Math.floor(1000 + Math.random() * 9000)}`;

    onRegisterBook({
      title: title.trim(),
      author: author.trim(),
      isbn: generatedIsbn,
      category,
      stock: numStock,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Library Book"
      description="Add a new textbook or reference material to the school catalog."
      maxWidth="max-w-xl"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100 gap-2 text-white"
          >
            <BookPlus size={16} /> Save Book Title
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
            <AlertCircle size={16} className="shrink-0" /> {errorMsg}
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Book Title</Label>
          <Input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErrorMsg(""); }}
            placeholder="e.g. Spark: English Grade 4"
            className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Author / Publisher</Label>
            <Input
              value={author}
              onChange={(e) => { setAuthor(e.target.value); setErrorMsg(""); }}
              placeholder="e.g. Oxford / KLB"
              className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">ISBN (Optional)</Label>
            <Input
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="e.g. 978-0199123"
              className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="Core Text">Core Text</SelectItem>
                <SelectItem value="Reference">Reference</SelectItem>
                <SelectItem value="Supplementary">Supplementary</SelectItem>
                <SelectItem value="General Reading">General Reading</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Initial Stock Quantity</Label>
            <Input
              type="number"
              min="1"
              value={stock}
              onChange={(e) => { setStock(e.target.value); setErrorMsg(""); }}
              placeholder="e.g. 30"
              className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};