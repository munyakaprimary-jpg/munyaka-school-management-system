"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import BackButton from '@/components/ui/BackButton';
import { Book, Search, Plus, BookOpen } from 'lucide-react';
import { BOOKS } from '@/lib/mock-data';
import Modal from '@/components/ui/Modal';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showSuccess } from '@/utils/toast';

const Library = () => {
  const [books, setBooks] = useState(BOOKS);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState('Core Text');
  const [stock, setStock] = useState('');
  const [borrowed, setBorrowed] = useState('');

  const handleAddBook = () => {
    if (!title.trim() || !author.trim() || !isbn.trim() || !stock.trim()) {
      showError('Please fill in all required fields');
      return;
    }
    const newBook = {
      id: Date.now().toString(),
      title: title.trim(),
      author: author.trim(),
      isbn: isbn.trim(),
      category,
      stock: parseInt(stock),
      borrowed: borrowed ? parseInt(borrowed) : 0,
    };
    setBooks(prev => [...prev, newBook]);
    setIsOpen(false);
    // reset form
    setTitle('');
    setAuthor('');
    setIsbn('');
    setCategory('Core Text');
    setStock('');
    setBorrowed('');
    showSuccess('Book added successfully!');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Library & E-Resources</h1>
            <p className="text-muted-foreground">Manage textbooks, supplementary materials, and digital learning assets.</p>
          </div>
        </div>
        <Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsOpen(true)}>
          <Plus size={18} /> Register New Book
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Search books by title, author, or ISBN..." className="pl-12 h-14 rounded-3xl border-none shadow-sm bg-white" />
        </div>
        <select className="h-14 rounded-3xl border-none shadow-sm bg-white px-6 text-sm font-bold text-slate-600 outline-none">
          <option>All Categories</option>
          <option>Core Text</option>
          <option>Reference</option>
          <option>Supplementary</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {books.map((book) => (
          <Card key={book.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white overflow-hidden group">
            <CardContent className="p-0 flex h-full">
              <div className="w-32 bg-slate-50 flex items-center justify-center border-r shrink-0">
                <Book size={40} className="text-slate-200 group-hover:text-indigo-200 transition-colors" />
              </div>
              <div className="p-8 flex-1 space-y-4">
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
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{book.stock - book.borrowed}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Available</p>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <span>Usage Status</span>
                    <span className={book.borrowed / book.stock > 0.9 ? "text-red-500" : "text-emerald-500"}>
                      {Math.round((book.borrowed / book.stock) * 100)}% Issued
                    </span>
                  </div>
                  <Progress value={(book.borrowed / book.stock) * 100} className="h-1.5" />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" size="sm" className="rounded-xl h-9 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100">
                    <BookOpen size={14} className="mr-2" /> Issue Book
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-xl h-9 text-xs font-bold text-slate-500 hover:bg-slate-100">
                    View History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Register New Book"
        description="Add a new book to the library catalog."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl font-bold">Cancel</Button>
            <Button onClick={handleAddBook} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8">
              Register Book
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Book title" className="rounded-xl h-12" />
          </div>
          <div className="space-y-2">
            <Label>Author</Label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" className="rounded-xl h-12" />
          </div>
          <div className="space-y-2">
            <Label>ISBN</Label>
            <Input value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="ISBN number" className="rounded-xl h-12" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(val) => setCategory(val)}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Core Text">Core Text</SelectItem>
                <SelectItem value="Reference">Reference</SelectItem>
                <SelectItem value="Supplementary">Supplementary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stock Quantity</Label>
              <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="e.g. 20" className="rounded-xl h-12" />
            </div>
            <div className="space-y-2">
              <Label>Currently Borrowed (Optional)</Label>
              <Input type="number" value={borrowed} onChange={(e) => setBorrowed(e.target.value)} placeholder="e.g. 5" className="rounded-xl h-12" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Library;