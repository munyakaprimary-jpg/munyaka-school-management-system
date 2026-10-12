"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import BackButton from '@/components/ui/BackButton';
import { Book as BookIcon, Search, BookOpen, History, AlertCircle, ShieldCheck, Database, FileText, CheckCircle2 } from 'lucide-react';
import { Book, BorrowLog } from '@/types/library';
import { BookHistoryModal } from '@/components/library/BookHistoryModal';
import { showSuccess, showError } from '@/utils/toast';
import { notifyDataChanged } from '@/utils/storage';
import { cn } from '@/lib/utils';

const Library = () => {
  // Books State with Shared Storage Persistence
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('school_library_inventory_v1') || localStorage.getItem('munyaka_library_books');
    return saved ? JSON.parse(saved) : [];
  });

  // Borrowing History Logs State with Shared Storage Persistence
  const [historyLogs, setHistoryLogs] = useState<BorrowLog[]>(() => {
    const saved = localStorage.getItem('school_library_logs_v1') || localStorage.getItem('munyaka_library_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedAreaCategory] = useState("All Categories");
  const [selectedBookForHistory, setSelectedBookForHistory] = useState<Book | null>(null);

  // Sync to Shared Storage
  useEffect(() => {
    localStorage.setItem('school_library_inventory_v1', JSON.stringify(books));
    notifyDataChanged('school_library_inventory_v1');
  }, [books]);

  useEffect(() => {
    localStorage.setItem('school_library_logs_v1', JSON.stringify(historyLogs));
    notifyDataChanged('school_library_logs_v1');
  }, [historyLogs]);

  // Derived Filtered Books
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const matchesSearch = 
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.author || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.isbn.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === "All Categories" || b.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [books, searchQuery, selectedCategory]);

  const totalVolumes = books.reduce((acc, b) => acc + (b.totalCopies || b.stock || 0), 0);
  const totalBorrowed = books.reduce((acc, b) => acc + (b.borrowed || 0), 0);
  const circulationRate = totalVolumes > 0 ? Math.round((totalBorrowed / totalVolumes) * 100) : 0;
  const lostDamagedCount = historyLogs.filter(l => l.status === 'Lost' || l.status === 'Damaged' || (l.qty_lost && l.qty_lost > 0)).length;

  // Secure Admin Password Protected Delete Handler
  const handleDeleteLog = (id: string, bookTitle: string) => {
    const adminPassword = prompt("🔒 Enter Admin Password to authorize circulation record deletion:");
    if (adminPassword === null) return;

    if (adminPassword !== 'admin123' && adminPassword !== 'Munyaka2025!' && adminPassword !== 'admin') {
      showError("Incorrect admin password. Deletion unauthorized.");
      return;
    }

    const updated = historyLogs.filter(log => log.id !== id);
    setHistoryLogs(updated);
    localStorage.setItem('school_library_logs_v1', JSON.stringify(updated));
    showSuccess(`Successfully deleted record for "${bookTitle}" with admin authorization.`);
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-3 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-8 text-white shadow-2xl space-y-6">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-200 border border-white/10 mb-3">
              🛡️ ADMIN LIBRARY GOVERNANCE & HARMONIZATION DASHBOARD
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Library & E-Resources Master Oversight</h1>
            <p className="text-blue-200/80 text-sm mt-1 max-w-2xl font-medium">
              Administrative master view of all textbook inventory, school-wide circulation rates, and secure audit logs harmonized from librarian terminals.
            </p>
          </div>
        </div>

        {/* Consolidated Metric Cards Grid Inside the Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 relative z-10">
          {/* Card 1: Total Volumes */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wider">Total Volumes</p>
              <p className="text-2xl font-black mt-1 text-white">{totalVolumes}</p>
              <p className="text-xs text-emerald-300 mt-1 flex items-center gap-1">✓ School-wide physical stock</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl text-white">
              📖
            </div>
          </div>

          {/* Card 2: Circulation Rate */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wider">Circulation Rate</p>
              <p className="text-2xl font-black mt-1 text-white">{circulationRate}%</p>
              <p className="text-xs text-blue-200/80 mt-1">{totalBorrowed} books currently checked out</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl text-white">
              📊
            </div>
          </div>

          {/* Card 3: Overdue / Lost Incidents */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wider">Overdue / Lost</p>
              <p className="text-2xl font-black mt-1 text-red-300">{lostDamagedCount}</p>
              <p className="text-xs text-red-200 mt-1">Requires governance review</p>
            </div>
            <div className="p-3 bg-red-500/20 rounded-xl text-red-300">
              ⚠️
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-full">
        <div className="sm:col-span-1 lg:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search books by title, author, or ISBN..." 
            className="pl-12 h-14 rounded-3xl border-slate-200 shadow-sm bg-white font-medium" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedAreaCategory(e.target.value)}
          className="h-14 rounded-3xl border-slate-200 shadow-sm bg-white px-6 text-sm font-bold text-slate-600 outline-none cursor-pointer"
        >
          <option>All Categories</option>
          <option>Core Text</option>
          <option>Reference</option>
          <option>Supplementary</option>
        </select>
      </div>

      {/* Master Circulation & Import Audit Log */}
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black text-slate-900">Master Circulation & Import Audit Log</CardTitle>
            <CardDescription className="text-xs mt-0.5">Real-time school-wide circulation tracking with admin governance delete controls.</CardDescription>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 font-bold border-0 px-3 py-1">
            {historyLogs.length} Total Logs
          </Badge>
        </CardHeader>
        <CardContent className="p-6">
          {historyLogs.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <FileText size={28} />
              </div>
              <p className="text-xs text-slate-500 font-medium">No circulation logs recorded in master storage yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyLogs.map((log) => {
                return (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 gap-3">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 text-sm">{log.bookTitle}</p>
                      <p className="text-xs text-slate-500">
                        Borrower: <span className="font-semibold text-slate-800">{log.borrowerName}</span> ({log.borrowerType}) {log.grade && <span className="text-indigo-600">[{log.grade} {log.stream}]</span>}
                      </p>
                      <p className="text-[11px] text-slate-400">Issued: {log.issuedDate} | Due: {log.dueDate}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={cn("font-bold text-xs border-0 px-3 py-1", log.status === 'Returned' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800')}>
                        {log.status}
                      </Badge>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteLog(log.id, log.bookTitle);
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete record (Admin Password Required)"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Book Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredBooks.map((book) => {
          const total = book.totalCopies ?? book.stock ?? 0;
          const borrowed = book.borrowed || 0;
          const available = Math.max(0, total - borrowed);
          const usagePercent = Math.min(100, Math.round((borrowed / Math.max(1, total)) * 100));

          return (
            <Card key={book.id} className="border border-slate-200/80 shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white overflow-hidden group">
              <CardContent className="p-0 flex h-full">
                <div className="w-32 bg-slate-50 flex flex-col items-center justify-center border-r shrink-0 p-4 text-center">
                  <BookIcon size={40} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{book.category}</span>
                </div>

                <div className="p-6 flex-1 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2 rounded-lg text-[10px] uppercase font-black tracking-widest border-slate-100 bg-slate-50">
                          {book.category}
                        </Badge>
                        <h3 className="text-base font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 mt-1">{book.author || 'Author N/A'} • ISBN: {book.isbn}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={cn("text-lg font-black", available <= 0 ? "text-rose-600" : "text-slate-900")}>
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

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <span className="text-xs font-medium text-slate-500">Total Stock: {total} {book.unit || 'Volumes'}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBookForHistory(book)}
                      className="rounded-xl h-9 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors gap-1.5 cursor-pointer"
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

      <BookHistoryModal 
        isOpen={!!selectedBookForHistory}
        onClose={() => setSelectedBookForHistory(null)}
        book={selectedBookForHistory}
        historyLogs={historyLogs}
        onProcessReturn={() => {}}
      />
    </div>
  );
};

export default Library;
