"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, CreditCard, Receipt, TrendingUp, History, Download, ArrowUpRight } from 'lucide-react';
import { FEES_DATA, TRANSACTIONS } from '@/lib/mock-data';

const Fees = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Finance & Fees</h1>
          <p className="text-muted-foreground">Track student payments and generate electronic receipts.</p>
        </div>
        <Button variant="outline" className="rounded-2xl gap-2 border-slate-200">
          <Download size={18} /> Export Reports
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-3xl bg-primary text-white overflow-hidden relative">
          <CardContent className="p-8">
            <div className="absolute right-[-10px] top-[-10px] opacity-10">
              <Wallet size={120} />
            </div>
            <p className="text-primary-foreground/80 text-sm font-medium mb-1">Total Collections (Term 1)</p>
            <h2 className="text-4xl font-black mb-4">KES 1.2M</h2>
            <div className="flex items-center gap-2 text-xs font-bold bg-white/20 w-fit px-3 py-1 rounded-full">
              <TrendingUp size={14} /> +12% from last term
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-white col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button className="rounded-2xl h-16 flex-1 gap-2 bg-slate-50 text-slate-900 hover:bg-slate-100 border-none group">
              <CreditCard size={20} className="text-blue-600 group-hover:scale-110 transition-transform" /> Record M-Pesa
            </Button>
            <Button className="rounded-2xl h-16 flex-1 gap-2 bg-slate-50 text-slate-900 hover:bg-slate-100 border-none group">
              <Receipt size={20} className="text-emerald-600 group-hover:scale-110 transition-transform" /> Invoice Class
            </Button>
            <Button className="rounded-2xl h-16 flex-1 gap-2 bg-slate-50 text-slate-900 hover:bg-slate-100 border-none group">
              <History size={20} className="text-purple-600 group-hover:scale-110 transition-transform" /> Fee Statements
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="balances" className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-14 mb-8">
          <TabsTrigger value="balances" className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold">
            Fee Balances
          </TabsTrigger>
          <TabsTrigger value="ledger" className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold">
            Transaction Ledger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="balances">
          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-8 py-4 text-left font-medium text-slate-500 uppercase tracking-widest text-[10px]">Student</th>
                    <th className="px-8 py-4 text-left font-medium text-slate-500 uppercase tracking-widest text-[10px]">Payment Status</th>
                    <th className="px-8 py-4 text-left font-medium text-slate-500 uppercase tracking-widest text-[10px]">Amount Paid</th>
                    <th className="px-8 py-4 text-right font-medium text-slate-500 uppercase tracking-widest text-[10px]">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {FEES_DATA.map((fee) => (
                    <tr key={fee.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-900">{fee.student}</p>
                        <p className="text-xs text-muted-foreground">ID: #00{fee.id}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-2 max-w-[150px]">
                          <Badge className={
                            fee.status === 'Cleared' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                            fee.status === 'Partial' ? "bg-blue-100 text-blue-700 hover:bg-blue-100" :
                            "bg-red-100 text-red-700 hover:bg-red-100"
                          }>
                            {fee.status}
                          </Badge>
                          <Progress value={(fee.paid / fee.total) * 100} className="h-1" />
                        </div>
                      </td>
                      <td className="px-8 py-6 font-bold">KES {fee.paid.toLocaleString()}</td>
                      <td className="px-8 py-6 text-right font-bold text-slate-400">
                        {fee.total - fee.paid > 0 ? `KES ${(fee.total - fee.paid).toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger">
          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b">
                    <th className="px-8 py-5 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Transaction ID</th>
                    <th className="px-8 py-5 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Date</th>
                    <th className="px-8 py-5 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Details</th>
                    <th className="px-8 py-5 text-right font-black text-slate-400 uppercase tracking-widest text-[10px]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {TRANSACTIONS.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6">
                        <span className="font-bold text-indigo-600">{tx.id}</span>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">{tx.method}</p>
                      </td>
                      <td className="px-8 py-6 text-slate-600 font-medium">{tx.date}</td>
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-900">{tx.category}</p>
                        <p className="text-xs text-slate-400">Ref: {tx.ref}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 text-emerald-600 font-black">
                          KES {tx.amount.toLocaleString()}
                          <ArrowUpRight size={14} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Fees;