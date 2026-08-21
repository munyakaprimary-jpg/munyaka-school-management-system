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
  <div className="space-y-8 p-4 bg-white border border-slate-100 rounded-3xl">
    <div className="flex justify-between items-start border-b pb-8">
      <div className="flex gap-4">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
          <School size={32} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 leading-none">MUNYAKA PRIMARY</h3>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Academic Progress & Ledger</p>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">P.O. Box 5239-30100 Eldoret</p>
        </div>
      </div>
      <div className="text-right">
        <Badge className="bg-slate-900 text-white border-none rounded-lg font-black uppercase text-[10px] tracking-widest px-3">Official Statement</Badge>
        <p className="text-xs font-bold text-slate-400 mt-2">Date: {new Date().toLocaleDateString()}</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-8 py-6 bg-slate-50/50 rounded-2xl px-6 border border-dashed border-slate-200">
      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Learner Name</p>
        <p className="text-lg font-black text-slate-900 uppercase">{student.student}</p>
        <p className="text-xs font-bold text-indigo-600">ID: A8273{student.id}</p>
      </div>
      <div className="space-y-1 text-right">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Context</p>
        <p className="text-sm font-bold text-slate-700">{gradeName} • {term.toUpperCase()}</p>
        <p className="text-sm font-bold text-slate-500">{year} Academic Year</p>
      </div>
    </div>

    <div className="space-y-4">
      <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Ledger Entries</h4>
      <div className="border rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-black uppercase tracking-widest">Description</th>
              <th className="px-4 py-3 text-right font-black uppercase tracking-widest">Debit (KES)</th>
              <th className="px-4 py-3 text-right font-black uppercase tracking-widest">Credit (KES)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <td className="px-4 py-4 font-bold text-slate-700">Term Tuition Fee ({term.toUpperCase()})</td>
              <td className="px-4 py-4 text-right font-black">{student.total.toLocaleString()}</td>
              <td className="px-4 py-4 text-right font-black text-slate-300">0.00</td>
            </tr>
            {transactions.slice(0, 3).map((tx, i) => (
              <tr key={i}>
                <td className="px-4 py-4 font-medium text-slate-500">Payment: {tx.ref} ({tx.method})</td>
                <td className="px-4 py-4 text-right font-black text-slate-300">0.00</td>
                <td className="px-4 py-4 text-right font-black text-emerald-600">{tx.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50/50">
            <tr className="font-black border-t-2">
              <td className="px-4 py-4 text-right text-slate-500">REMAINING BALANCE</td>
              <td colSpan={2} className="px-4 py-4 text-right text-rose-500 text-lg">
                KES {student.balance.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
);

export default FeeStatement;