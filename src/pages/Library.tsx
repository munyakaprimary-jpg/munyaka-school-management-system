"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Book, Search, Plus, Bookmark, BookOpen, Layers } from 'lucide-react';
import { BOOKS } from '@/lib/mock-data';

const Library = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Library & E-Resources</h1>
          <p className="text-muted-foreground">Manage textbooks, supplementary materials, and digital learning assets.</p>
        </div>
        <Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700">
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
        {BOOKS.map((book) => (
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
    </div>
  );
};

export default Library;