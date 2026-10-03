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
  onRegisterBook: (bookData: Partial<Omit<Book, 'id'>>) => void;
}

export const RegisterBookModal: React.FC<RegisterBookModalProps> = ({
  isOpen,
  onClose,
  onRegisterBook,
}) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [category, setCategory] = useState("Textbooks");
  const [unit, setUnit] = useState("Pieces");
  const [stock, setStock] = useState("30");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setAuthor("");
      setIsbn("");
      setCategory("Textbooks");
      setUnit("Pieces");
      setStock("30");
      setErrorMsg("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!String(title || '').trim()) {
      setErrorMsg("Item title / book name is required.");
      return;
    }
    const numStock = parseInt(stock, 10);
    if (isNaN(numStock) || numStock <= 0) {
      setErrorMsg("Please enter a valid stock quantity.");
      return;
    }

    const generatedIsbn = String(isbn || '').trim() || `978-${Math.floor(1000 + Math.random() * 9000)}`;

    onRegisterBook({
      title: String(title || '').trim(),
      author: String(author || '').trim() || 'General Inventory / School Stock',
      isbn: generatedIsbn,
      category,
      unit,
      stock: numStock,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register Library Material / Textbook"
      description="Add a new textbook, story book, exercise book, stationery, or teaching aid to the inventory."
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
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Item Title / Book Name</Label>
        <Input
          value={title}
          onChange={(e) => { setTitle(e.target.value); setErrorMsg(""); }}
          placeholder="e.g. Spark: English Grade 4 or Exercise Books 120pg"
            className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-900"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Author / Supplier (Optional)</Label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. KLB / Oxford / Stationers Ltd"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="Textbooks">Textbooks</SelectItem>
                <SelectItem value="Story Books">Story Books</SelectItem>
                <SelectItem value="Exercise Books">Exercise Books</SelectItem>
                <SelectItem value="Stationery">Stationery</SelectItem>
                <SelectItem value="Teaching Aids">Teaching Aids</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Unit</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="Pieces">Pieces</SelectItem>
                <SelectItem value="Reams">Reams</SelectItem>
                <SelectItem value="Packets">Packets</SelectItem>
                <SelectItem value="Boxes">Boxes</SelectItem>
                <SelectItem value="Sets">Sets</SelectItem>
                <SelectItem value="Rolls">Rolls</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Initial Stock Qty</Label>
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