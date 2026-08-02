"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { Book, BorrowLog, getLogBalance, getLogStatusInfo } from '@/types/library';
import { ProcessReturnModal } from './ProcessReturnModal';
import { UserCheck, Calendar, RotateCcw, CheckCircle2, Clock, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
  historyLogs: BorrowLog[];
  onProcessReturn: (logId: string, qtyReturned: number, qtyLost: number) => void;
}

export const BookHistoryModal: React.FC<BookHistoryModalProps> = ({
  isOpen,
  onClose,
  book,
  historyLogs,
  onProcessReturn
}) => {
  const [selectedLogForReturn, setSelectedLogForReturn] = useState<BorrowLog | null>(null);
  
  // Filter States
  const [gradeFilter, setGradeFilter] = useState("all");
  const [streamFilter, setStreamFilter] = useState("all");

  const gradeOptions = useMemo(() => [
    "PP1", "PP2",
    ...Array.from({ length: 9 }, (_, i) => `Grade ${i + 1}`)
  ], []);

  const streamOptions = useMemo(() => ["Blue", "Green", "Yellow", "Alpha", "Beta"], []);

  const filteredLogs = useMemo(() => {
    if (!book) return [];
    return historyLogs.filter(log => {
      if (log.bookId !== book.id) return false;
      const matchesGrade = gradeFilter === "all" || log.grade === gradeFilter;
      const matchesStream = streamFilter === "all" || log.stream === streamFilter;
      return matchesGrade && matchesStream;
    });
  }, [book, historyLogs, gradeFilter, streamFilter]);

  if (!book) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Circulation History: ${book.title}`}
        description="View past checkouts, current borrowers, partial returns, and book losses."
        maxWidth="max-w-5xl"
        footer={
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">
            Close
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 text-center">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Stock</p>
              <p className="text-xl font-black text-slate-900">{book.stock}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Currently Borrowed</p>
              <p className="text-xl font-black text-indigo-600">{book.borrowed}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Available On Shelf</p>
              <p className="text-xl font-black text-emerald-600">{Math.max(0, book.stock - book.borrowed)}</p>
            </div>
          </div>

          {/* Table Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400 shrink-0">
              <Filter size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Filter By Class</span>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-3 w-full">
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs">
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Grade Levels</SelectItem>
                  {gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={streamFilter} onValueChange={setStreamFilter}>
                <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs">
                  <SelectValue placeholder="All Streams" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Streams</SelectItem>
                  {streamOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {(gradeFilter !== "all" || streamFilter !== "all") && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setGradeFilter("all"); setStreamFilter("all"); }}
                className="rounded-xl h-10 px-4 text-xs font-bold text-rose-600 hover:bg-rose-50 gap-1.5"
              >
                <X size={14} /> Clear
              </Button>
            )}
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400">Borrower & Class</th>
                    <th className="px-3 py-3 font-black uppercase tracking-widest text-slate-400">Issued Date</th>
                    <th className="px-3 py-3 font-black uppercase tracking-widest text-slate-400">Due Date</th>
                    <th className="px-2 py-3 font-black uppercase tracking-widest text-slate-400 text-center">Issued Qty</th>
                    <th className="px-2 py-3 font-black uppercase tracking-widest text-slate-400 text-center">Returned Qty</th>
                    <th className="px-2 py-3 font-black uppercase tracking-widest text-slate-400 text-center">Lost</th>
                    <th className="px-2 py-3 font-black uppercase tracking-widest text-slate-400 text-center">Balance</th>
                    <th className="px-3 py-3 font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => {
                      const balance = getLogBalance(log);
                      const statusInfo = getLogStatusInfo(log);

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <UserCheck size={16} />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">{log.borrowerName}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{log.borrowerType}</span>
                                  {log.grade && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span className="text-[10px] font-bold text-indigo-500">{log.grade} {log.stream}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3.5 text-slate-600 font-medium">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} className="text-slate-400" />
                              <span>{log.issuedDate}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3.5 text-slate-600 font-medium">
                            <div className="flex items-center gap-1">
                              <Clock size={12} className="text-slate-400" />
                              <span>{log.dueDate}</span>
                            </div>
                          </td>
                          <td className="px-2 py-3.5 text-center font-black text-slate-800 bg-slate-50/30">
                            {log.qty_issued}
                          </td>
                          <td className="px-2 py-3.5 text-center font-bold text-emerald-600">
                            {log.qty_returned || 0}
                          </td>
                          <td className="px-2 py-3.5 text-center font-bold text-rose-600">
                            {log.qty_lost || 0}
                          </td>
                          <td className="px-2 py-3.5 text-center font-black text-indigo-600 bg-indigo-50/20">
                            {balance}
                          </td>
                          <td className="px-3 py-3.5">
                            <Badge className={cn("rounded-lg border font-bold text-[10px]", statusInfo.color)}>
                              {statusInfo.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {balance > 0 ? (
                              <Button 
                                size="sm"
                                onClick={() => setSelectedLogForReturn(log)}
                                className="rounded-xl h-8 px-3 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                              >
                                <RotateCcw size={12} /> Process Return
                              </Button>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5 text-emerald-600 font-bold text-[10px]">
                                <CheckCircle2 size={14} /> Closed
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 bg-slate-50 rounded-full text-slate-200">
                            <Filter size={32} />
                          </div>
                          <p className="text-slate-500 font-bold">No circulation records match the current class filter.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* Process Return / Loss Sub-Modal */}
      <ProcessReturnModal
        isOpen={!!selectedLogForReturn}
        onClose={() => setSelectedLogForReturn(null)}
        log={selectedLogForReturn}
        onConfirmReturn={onProcessReturn}
      />
    </>
  );
};