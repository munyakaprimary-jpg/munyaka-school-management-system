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
   * The View action always opens the receipt view. Works for all
   * statuses (paid, pending, etc.) so a user can review an
   * invoice or receipt at any time.
   */
  const handleView = (tx: Transaction) => {
    onViewReceipt(tx);
  };

  /**
   * The Download action delegates to onDownload if provided, otherwise
   * falls back to opening the receipt view so the button is always
   * responsive. A common fallback is to just open the view and let
   * the user print from there.
   */
  const handleDownload = (tx: Transaction) => {
    if (onDownload) {
      onDownload(tx);
    } else {
      onViewReceipt(tx);
    }
  };

  /**
   * The Print action delegates to onPrint if provided, otherwise
   * falls back to opening the receipt view so the button is always
   * responsive. The view has its own print button inside it.
   */
  const handlePrint = (tx: Transaction) => {
    if (onPrint) {
      onPrint(tx);
    } else {
      onViewReceipt(tx);
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
                  <td className="px-8 py-4 font-mono font-bold text-slate-700">{tx.invoiceId}</td>
                  <td className="px-8 py-4 font-medium text-slate-900">{tx.description}</td>
                  <td className="px-8 py-4 font-black text-slate-900">{tx.currency} {tx.amount}</td>
                  <td className="px-8 py-4 text-slate-600">{tx.paymentMethod}</td>
                  <td className="px-8 py-4 font-mono text-slate-500">{tx.paidAt || '—'}</td>
                  <td className="px-8 py-4 text-right">{getStatusBadge(tx.status)}</td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {/*
                        View icon — opens the receipt view for ALL
                        statuses (paid, pending, failed). This way the
                        user can always review an invoice/receipt.
                      */}
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => handleView(tx)}
                        title="View receipt"
                        aria-label="View receipt"
                        data-testid={`invoice-action-view-${tx.id}`}
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer hover:opacity-75 transition-opacity"
                      >
                        <Eye size={16} />
                      </Button>
                      {/*
                        Download icon — falls back to opening the
                        receipt view if no onDownload handler is
                        provided. Always clickable.
                      */}
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => handleDownload(tx)}
                        title="Download receipt"
                        aria-label="Download receipt"
                        data-testid={`invoice-action-download-${tx.id}`}
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer hover:opacity-75 transition-opacity"
                      >
                        <FileDown size={16} />
                      </Button>
                      {/*
                        Print icon — falls back to opening the receipt
                        view if no onPrint handler is provided. The
                        view has its own print button inside it.
                        Always clickable.
                      */}
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => handlePrint(tx)}
                        title="Print receipt"
                        aria-label="Print receipt"
                        data-testid={`invoice-action-print-${tx.id}`}
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer hover:opacity-75 transition-opacity"
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