"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, FileDown, Printer, History, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Transaction } from '@/types/fees';
import { cn } from '@/lib/utils';

export interface InvoiceHistoryTableProps {
  transactions: Transaction[];
  onViewReceipt: (transaction: Transaction) => void;
  /** Optional: called when the Download icon is clicked. If omitted, falls back to opening the receipt view. */
  onDownload?: (transaction: Transaction) => void;
  /** Optional: called when the Print icon is clicked. If omitted, falls back to opening the receipt view. */
  onPrint?: (transaction: Transaction) => void;
}

const InvoiceHistoryTable: React.FC<InvoiceHistoryTableProps> = ({
  transactions,
  onViewReceipt,
  onDownload,
  onPrint,
}) => {
  /**
   * View action — exclusively calls onViewReceipt for that specific row's
   * transaction. This opens the receipt modal/drawer populated with
   * the row's transaction data.
   */
  const handleViewReceipt = (tx: Transaction) => {
    onViewReceipt(tx);
  };

  /**
   * Download action — exclusively calls onDownload for that specific row's
   * transaction. Triggers file download / export logic for that row.
   * Does NOT fall back to opening the receipt view.
   */
  const handleDownloadReceipt = (tx: Transaction) => {
    if (onDownload) {
      onDownload(tx);
    } else {
      // Fallback: trigger the browser print dialog for that receipt
      if (typeof window !== 'undefined') {
        window.print();
      }
    }
  };

  /**
   * Print action — exclusively calls onPrint for that specific row's
   * transaction. Opens the browser print dialog specifically for that
   * receipt. Does NOT fall back to opening the receipt view.
   */
  const handlePrintReceipt = (tx: Transaction) => {
    if (onPrint) {
      onPrint(tx);
    } else {
      // Fallback: trigger the browser print dialog for that receipt
      if (typeof window !== 'undefined') {
        window.print();
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      paid:    { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', text: 'Paid',     icon: <CheckCircle2 size={10} /> },
      pending: { bg: 'bg-amber-50 text-amber-700 border-amber-100',   text: 'Pending',  icon: <AlertCircle size={10} /> },
      failed:  { bg: 'bg-rose-50 text-rose-700 border-rose-100',       text: 'Failed',   icon: <XCircle size={10} /> },
      refunded:{ bg: 'bg-blue-50 text-blue-700 border-blue-200',         text: 'Refunded', icon: <RefreshCw size={10} /> },
    };
    const s = styles[status] || styles.pending;
    return (
      <Badge className={cn("border font-bold text-[10px] gap-1", s.bg)}>
        {s.icon}
        {s.text}
      </Badge>
    );
  };

  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200/80">
              <tr>
                <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Invoice ID</th>
                <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Description</th>
                <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Amount</th>
                <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Method</th>
                <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Date</th>
                <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Status</th>
                <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Receipt Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                              <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors group">
                                <td className="px-8 py-4 font-mono font-bold text-slate-700">{tx.invoiceId ?? tx.id}</td>
                                <td className="px-8 py-4 font-medium text-slate-900">{tx.description ?? tx.category}</td>
                                <td className="px-8 py-4 font-black text-slate-900">{tx.currency ?? 'USD'} {tx.amount}</td>
                                <td className="px-8 py-4 text-slate-600">{tx.method ?? tx.paymentMethod}</td>
                  <td className="px-8 py-4 font-mono text-slate-500">{tx.paidAt || '—'}</td>
                  <td className="px-8 py-4 text-right">{getStatusBadge(tx.status)}</td>
                  <td className="px-8 py-4 text-right">
                                                        <div className="flex justify-end gap-1.5">
                                                          {/* Eye icon — opens receipt modal/drawer for that specific row */}
                                                          <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            type="button"
                                                            onClick={() => handleViewReceipt(tx)}
                                                            title="View receipt"
                                                            aria-label="View receipt"
                                                            data-testid={`invoice-action-view-${tx.id}`}
                                                            className="h-9 w-9 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer transition-all duration-200 hover:scale-105"
                                                          >
                                                            <Eye size={16} />
                                                          </Button>
                  
                                                          {/* Download icon — triggers file download/export for that specific row */}
                                                          <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            type="button"
                                                            onClick={() => handleDownloadReceipt(tx)}
                                                            title="Download receipt"
                                                            aria-label="Download receipt"
                                                            data-testid={`invoice-action-download-${tx.id}`}
                                                            className="h-9 w-9 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer transition-all duration-200 hover:scale-105"
                                                          >
                                                            <FileDown size={16} />
                                                          </Button>
                  
                                                          {/* Printer icon — opens print dialog specifically for that receipt */}
                                                          <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            type="button"
                                                            onClick={() => handlePrintReceipt(tx)}
                                                            title="Print receipt"
                                                            aria-label="Print receipt"
                                                            data-testid={`invoice-action-print-${tx.id}`}
                                                            className="h-9 w-9 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer transition-all duration-200 hover:scale-105"
                                                          >
                                                            <Printer size={16} />
                                                          </Button>
                                                        </div>
                                                      </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceHistoryTable;