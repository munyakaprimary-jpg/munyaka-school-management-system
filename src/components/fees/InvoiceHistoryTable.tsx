"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, FileDown, Printer, History } from 'lucide-react';
import { Transaction } from '@/types/fees';

interface InvoiceHistoryTableProps {
  transactions: Transaction[];
  onViewReceipt: (transaction: Transaction) => void;
}

const InvoiceHistoryTable: React.FC<InvoiceHistoryTableProps> = ({
  transactions,
  onViewReceipt
}) => {
  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      paid:   { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', text: 'Paid', icon: <CheckCircle2 size={10} /> },
      pending:{ bg: 'bg-amber-50 text-amber-700 border-amber-100', text: 'Pending', icon: <AlertCircle size={10} /> },
      failed: { bg: 'bg-rose-50 text-rose-700 border-rose-100', text: 'Failed', icon: <XCircle size={10} /> },
      refunded:{ bg: 'bg-blue-50 text-blue-700 border-blue-100', text: 'Refunded', icon: <RefreshCw size={10} /> },
    };
    const s = styles[status] || styles.pending;
    return (
      <Badge className={cn("border font-bold text-[10px] gap-1", s.bg)}>
        {s.icon} {s.text}
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
                <th className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-8 py-4 font-mono font-bold text-slate-700">{tx.invoiceId}</td>
                  <td className="px-8 py-4 font-medium text-slate-900">{tx.description}</td>
                  <td className="px-8 py-4 font-black text-slate-900">{tx.currency} {tx.amount}</td>
                  <td className="px-8 py-4 text-slate-600">{tx.paymentMethod}</td>
                  <td className="px-8 py-4 font-mono text-slate-500">{tx.paidAt || '—'}</td>
                  <td className="px-8 py-4 text-right">{getStatusBadge(tx.status)}</td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        onClick={() => onViewReceipt(tx)}
                        title="View Receipt"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                        title="Download Receipt"
                      >
                        <FileDown size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        title="Print Invoice"
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