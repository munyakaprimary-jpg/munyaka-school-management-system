"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { Wallet, CreditCard, Receipt, TrendingUp, History, Download, ArrowUpRight } from 'lucide-react';
import { FEES_DATA as initialFees, TRANSACTIONS as initialTransactions } from '@/lib/mock-data';
import { showSuccess } from '@/utils/toast';

const Fees = () => {
  const [feesList, setFeesList] = useState(initialFees);
  const [transactionsList, setTransactionsList] = useState(initialTransactions);
  const [activeTab, setActiveTab] = useState("balances");

  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("M-Pesa");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentCategory, setPaymentCategory] = useState("Tuition");

  const [selectedGrade, setSelectedGrade] = useState("");
  const [invoiceCategory, setInvoiceCategory] = useState("Tuition");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [statementStudentId, setStatementStudentId] = useState("");

  const handleRecordPayment = () => {
    if (!selectedStudentId || !paymentAmount) return;
    const amountNum = parseFloat(paymentAmount);
    const studentFee = feesList.find(f => f.id === selectedStudentId);
    if (!studentFee) return;

    setFeesList(feesList.map(fee => fee.id === selectedStudentId ? { ...fee, paid: Math.min(fee.paid + amountNum, fee.total), status: (fee.paid + amountNum) >= fee.total ? "Cleared" : "Partial" } : fee));
    setTransactionsList([{ id: `TX-${Math.floor(100 + Math.random() * 900)}`, date: "Just now", amount: amountNum, method: paymentMethod, ref: (paymentRef || 'N/A').toUpperCase(), category: paymentCategory }, ...transactionsList]);
    setIsRecordOpen(false);
    setSelectedStudentId(""); setPaymentAmount(""); setPaymentRef("");
    showSuccess(`Successfully recorded payment of KES ${amountNum.toLocaleString()}!`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div><h1 className="text-3xl font-bold text-slate-900">Finance & Fees</h1><p className="text-muted-foreground">Track student payments and generate receipts.</p></div>
        <Button variant="outline" className="rounded-2xl gap-2"><Download size={18} /> Export</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl bg-primary text-white p-8 relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-10"><Wallet size={120} /></div>
          <p className="text-sm font-medium mb-1 opacity-80">Total Collections</p>
          <h2 className="text-4xl font-black mb-4">KES 1.2M</h2>
          <div className="flex items-center gap-2 text-xs font-bold bg-white/20 w-fit px-3 py-1 rounded-full"><TrendingUp size={14} /> +12%</div>
        </Card>
        <Card className="rounded-3xl bg-white col-span-2 p-8">
          <CardTitle className="text-lg mb-6">Quick Actions</CardTitle>
          <div className="flex gap-4">
            <Button className="h-16 flex-1 gap-2 bg-slate-50 text-slate-900 hover:bg-slate-100 border-none group" onClick={() => setIsRecordOpen(true)}><CreditCard size={20} className="text-blue-600" /> Record</Button>
            <Button className="h-16 flex-1 gap-2 bg-slate-50 text-slate-900 hover:bg-slate-100 border-none group" onClick={() => setIsInvoiceOpen(true)}><Receipt size={20} className="text-emerald-600" /> Invoice</Button>
            <Button className="h-16 flex-1 gap-2 bg-slate-50 text-slate-900 hover:bg-slate-100 border-none group" onClick={() => setIsStatementOpen(true)}><History size={20} className="text-purple-600" /> Statements</Button>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-12 mb-8">
          <TabsTrigger value="balances" className="rounded-xl px-8 h-full font-bold text-xs">Balances</TabsTrigger>
          <TabsTrigger value="ledger" className="rounded-xl px-8 h-full font-bold text-xs">Ledger</TabsTrigger>
        </TabsList>
        <TabsContent value="balances"><Card className="rounded-3xl bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr><th className="px-8 py-4 text-left font-black text-slate-400 text-[10px]">Student</th><th className="px-8 py-4 text-left font-black text-slate-400 text-[10px]">Status</th><th className="px-8 py-4 text-left font-black text-slate-400 text-[10px]">Paid</th><th className="px-8 py-4 text-right font-black text-slate-400 text-[10px]">Balance</th></tr></thead>
            <tbody className="divide-y">{feesList.map((fee) => (
              <tr key={fee.id} className="hover:bg-slate-50 transition-colors"><td className="px-8 py-6 font-bold">{fee.student}</td><td className="px-8 py-6"><div className="space-y-2"><Badge>{fee.status}</Badge><Progress value={(fee.paid / fee.total) * 100} className="h-1" /></div></td><td className="px-8 py-6 font-bold">KES {fee.paid.toLocaleString()}</td><td className="px-8 py-6 text-right font-bold text-slate-400">{fee.total - fee.paid > 0 ? `KES ${(fee.total - fee.paid).toLocaleString()}` : '—'}</td></tr>
            ))}</tbody>
          </table>
        </Card></TabsContent>
        <TabsContent value="ledger"><Card className="rounded-3xl bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50/50 border-b"><th className="px-8 py-5 text-left font-black text-slate-400 text-[10px]">ID</th><th className="px-8 py-5 text-left font-black text-slate-400 text-[10px]">Date</th><th className="px-8 py-5 text-left font-black text-slate-400 text-[10px]">Details</th><th className="px-8 py-5 text-right font-black text-slate-400 text-[10px]">Amount</th></tr></thead>
            <tbody className="divide-y">{transactionsList.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50 transition-colors"><td className="px-8 py-6 font-bold text-indigo-600">{tx.id}</td><td className="px-8 py-6 font-medium">{tx.date}</td><td className="px-8 py-6 font-bold">{tx.category}<p className="text-xs text-slate-400 font-normal">Ref: {tx.ref}</p></td><td className="px-8 py-6 text-right font-black text-emerald-600">KES {tx.amount.toLocaleString()} <ArrowUpRight size={14} className="inline ml-1" /></td></tr>
            ))}</tbody>
          </table>
        </Card></TabsContent>
      </Tabs>

      <Modal isOpen={isRecordOpen} onClose={() => setIsRecordOpen(false)} title="Record Payment" footer={<><Button variant="ghost" onClick={() => setIsRecordOpen(false)}>Cancel</Button><Button onClick={handleRecordPayment}>Save Payment</Button></>}>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Student</Label><Select value={selectedStudentId} onValueChange={setSelectedStudentId}><SelectTrigger><SelectValue placeholder="Choose student" /></SelectTrigger><SelectContent>{feesList.map(fee => <SelectItem key={fee.id} value={fee.id}>{fee.student}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Amount (KES)</Label><Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="5000" /></div><div className="space-y-2"><Label>Reference</Label><Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="SKL92JD" /></div></div>
        </div>
      </Modal>

      <Modal isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} title="Invoice Class" footer={<><Button variant="ghost" onClick={() => setIsInvoiceOpen(false)}>Cancel</Button><Button onClick={() => setIsInvoiceOpen(false)}>Apply Invoice</Button></>}>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Grade / Class</Label><Select value={selectedGrade} onValueChange={setSelectedGrade}><SelectTrigger><SelectValue placeholder="Choose grade" /></SelectTrigger><SelectContent><SelectItem value="Grade 1">Grade 1</SelectItem><SelectItem value="Grade 4">Grade 4</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Amount (KES)</Label><Input type="number" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} placeholder="15000" /></div>
        </div>
      </Modal>

      <Modal isOpen={isStatementOpen} onClose={() => setIsStatementOpen(false)} title="Fee Statement" footer={<><Button variant="ghost" onClick={() => setIsStatementOpen(false)}>Cancel</Button><Button onClick={() => setIsStatementOpen(false)}>Generate</Button></>}>
        <div className="space-y-2"><Label>Select Student</Label><Select value={statementStudentId} onValueChange={setStatementStudentId}><SelectTrigger><SelectValue placeholder="Choose student" /></SelectTrigger><SelectContent>{feesList.map(fee => <SelectItem key={fee.id} value={fee.id}>{fee.student}</SelectItem>)}</SelectContent></Select></div>
      </Modal>
    </div>
  );
};

export default Fees;