"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Modal from '@/components/ui/Modal';
import { Book, BorrowLog } from '@/types/library';
import { History, UserCheck, Calendar, RotateCcw, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
  historyLogs: BorrowLog[];
  onReturnBook: (logId: string) => void;
}

export const BookHistoryModal: React.FC<BookHistoryModalProps> = ({
  isOpen,
  onClose,
  book,
  historyLogs,
  onReturnBook
}) => {
  if (!book) return null;

  const bookLogs = historyLogs.filter(log => log.bookId === book.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Circulation History: ${book.title}`}
      description={`View past checkouts, current borrowers, and return records.`}
      maxWidth="max-w-3xl"
      footer={
        <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
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
            <p className="text-xl font-black text-emerald-600">{book.stock - book.borrowed}</p>
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400">Borrower</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400">Issued Date</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400">Due Date</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookLogs.length > 0 ? (
                  bookLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <UserCheck size={14} className="text-slate-400 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-900">{log.borrowerName}</p>
                            <span className="text-[10px] text-slate-400 font-bold">{log.borrowerType}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{log.issuedDate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          <span>{log.dueDate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge className={cn(
                          "rounded-lg border-none font-bold text-[10px]",
                          log.status === 'Issued' ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                        )}>
                          {log.status === 'Issued' ? 'Out on Loan' : `Returned (${log.returnedDate || 'Yes'})`}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {log.status === 'Issued' ? (
                          <Button 
                            size="sm"
                            onClick={() => onReturnBook(log.id)}
                            className="rounded-xl h-7 px-3 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          >
                            <RotateCcw size={12} /> Mark Returned
                          </Button>
                        ) : (
                          <span className="text-emerald-600 font-bold flex items-center justify-end gap-1 text-[11px]">
                            <CheckCircle2 size={13} /> Restocked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400 font-medium">
                      No borrowing history logged for this title yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
};