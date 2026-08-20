"use client";

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { School } from 'lucide-react';
import { Transaction } from '@/types/fees';

interface FeeStatementProps {
  student: any;
  transactions: Transaction[];
  year: string;
  term: string;
  gradeName: string;
}

const FeeStatement = ({ student, transactions, year, term, gradeName }: FeeStatementProps) => (
  <Card className="border-none shadow-sm bg-white p-3 rounded-lg">
    <div className="flex items-center justify-between border-b pb-4 border-slate-100/50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-white">
          <School size={20} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">MUNYAKA PRIMARY</p>
          <p className="text-[10px] font-bold text-slate-900">Academic Progress & Ledger</p>
          <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider mt-1">P.O. Box 5239-30100 Eldoret</p>
        </div>
      </div>
      <div className="text-right">
        <Badge className="bg-slate-900 text-white border-none rounded-lg font-black uppercase text-[9px] tracking-widest px-2">Official Statement</Badge>
        <p className="text-[9px] font-bold text-slate-400 mt-2">Date: {new Date().toLocaleDateString()}</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 py-3 bg-slate-50/50 rounded-lg border border-slate-100/50">
      <div className="space-y-1">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Learner Name</p>
        <p className="text-sm font-bold text-slate-900">{student.student}</p>
        <p className="text-[9px] font-bold text-indigo-600">ID: A8273{student.id}</p>
      </div>
      <div className="space-y-1 text-right">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Academic Context</p>
        <p className="text-sm font-bold text-slate-700">{gradeName} • {term.toUpperCase()}</p>
        <p className="text-[9px] font-bold text-slate-500">{year} Academic Year</p>
      </div>
    </div>

    <div className="py-3">
      <h4 className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Ledger Entries</h4>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-[9px]">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-2 py-2 text-left font-black uppercase tracking-widest">Description</th>
              <th className="px-2 py-2 text-right font-black uppercase tracking-widest">Debit (KES)</th>
              <th className="px-2 py-2 text-right font-black uppercase tracking-widest">Credit (KES)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <td className="px-2 py-2 font-bold text-slate-700">Term Tuition Fee ({term.toUpperCase()})</td>
              <td className="px-2 py-2 text-right font-bold">{student.total.toLocaleString()}</td>
              <td className="px-2 py-2 text-right font-bold text-slate-300">0.00</td>
            </tr>
            {transactions.slice(0, 2).map((tx, i) => (
              <tr key={i}>
                <td className="px-2 py-2 font-medium text-slate-500">Payment: {tx.ref} ({tx.method})</td>
                <td className="px-2 py-2 text-right font-bold text-slate-300">0.00</td>
                <td className="px-2 py-2 text-right font-bold text-emerald-600">{tx.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50/50">
            <tr className="font-black border-t-2">
              <td className="px-2 py-2 text-right text-slate-500">REMAINING BALANCE</td>
              <td colSpan={2} className="px-2 py-2 text-right text-rose-500 text-lg">
                KES {student.balance.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </Card>
);

export default FeeStatement;