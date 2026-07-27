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
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Wallet, CreditCard, Receipt, TrendingUp, History, Download, ArrowUpRight, X } from 'lucide-react';
import { FEES_DATA as initialFees, TRANSACTIONS as initialTransactions } from '@/lib/mock-data';
import { showSuccess } from '@/utils/toast';

const Fees = () => {
  const [feesList, setFeesList] = useState(initialFees);
  const [transactionsList, setTransactionsList] = useState(initialTransactions);
  const [activeTab, setActiveTab] = useState("balances");

  // Dialog states
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);

  // Form states - Record Payment
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("M-Pesa");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentCategory, setPaymentCategory] = useState("Tuition");

  // Form states - Invoice Class
  const [selectedGrade, setSelectedGrade] = useState("");
  const [invoiceCategory, setInvoiceCategory] = useState("Tuition");
  const [invoiceAmount, setInvoiceAmount] = useState("");

  // Form states - Fee Statement
  const [statementStudentId, setStatementStudentId] = useState("");

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !paymentAmount) return;

    let finalRef = paymentRef.trim();
    if (paymentMethod === "Cash" && !finalRef) {
      finalRef = `CSH-${Math.floor(100000 + Math.random() * 900000)}`;
    } else if (paymentMethod === "Bank" && !finalRef) {
      finalRef = `BNK-${Math.floor(100000 + Math.random() * 900000)}`;
    } else if (!finalRef) {
      return;
    }

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const studentFee = feesList.find(f => f.id === selectedStudentId);
    if (!studentFee) return;

    const updatedFees = feesList.map(fee => {
      if (fee.id === selectedStudentId) {
        const newPaid = Math.min(fee.paid + amountNum, fee.total);
        const newStatus = newPaid >= fee.total ? "Cleared" : "Partial";
        return { ...fee, paid: newPaid, status: newStatus };
      }
      return fee;
    });

    const newTx = {
      id: `TX-${Math.floor(100 + Math.random() * 900)}`,
      date: "Just now",
      amount: amountNum,
      method: paymentMethod,
      ref: finalRef.toUpperCase(),
      category: paymentCategory
    };

    setFeesList(updatedFees);
    setTransactionsList([newTx, ...transactionsList]);
    setIsRecordOpen(false);
    
    setSelectedStudentId("");
    setPaymentMethod("M-Pesa");
    setPaymentAmount("");
    setPaymentRef("");
    setPaymentCategory("Tuition");

    showSuccess(`Recorded ${paymentMethod} payment of KES ${amountNum.toLocaleString()} for ${studentFee.student}!`);
  };

  const handleInvoiceClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrade || !invoiceAmount) return;

    const amountNum = parseFloat(invoiceAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const updatedFees = feesList.map(fee => ({
      ...fee,
      total: fee.total + amountNum,
      status: fee.paid >= (fee.total + amountNum) ? "Cleared" : "Partial"
    }));

    setFeesList(updatedFees);
    setIsInvoiceOpen(false);
    setSelectedGrade("");
    setInvoiceAmount("");

    showSuccess(`Invoiced KES ${amountNum.toLocaleString()} to ${selectedGrade}!`);
  };

  const handleGenerateStatement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statementStudentId) return;

    const studentFee = feesList.find(f => f.id === statementStudentId);
    if (!studentFee) return;

    setIsStatementOpen(false);
    setStatementStudentId("");
    showSuccess(`Fee statement for ${studentFee.student} generated!`);
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Finance & Fees</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track collections and generate payment receipts.</p>
        </div>
        <Button variant="outline" className="rounded-xl gap-1.5 h-9 px-3 text-xs border-slate-200">
          <Download size={15} /> Export Reports
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm rounded-2xl bg-indigo-600 text-white overflow-hidden relative">
          <CardContent className="p-5">
            <div className="absolute right-[-10px] top-[-10px] opacity-10">
              <Wallet size={90} />
            </div>
            <p className="text-indigo-100 text-xs font-medium mb-0.5">Total Collections (Term 1)</p>
            <h2 className="text-2xl font-bold mb-3">KES 1.2M</h2>
            <div className="flex items-center gap-1.5 text-[10px] font-bold bg-white/20 w-fit px-2.5 py-0.5 rounded-full">
              <TrendingUp size={12} /> +12% from last term
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white col-span-2">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-xs font-bold uppercase text-slate-400 tracking-wider">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex gap-3">
            <Button 
              className="rounded-xl h-11 flex-1 gap-2 bg-slate-50 text-slate-800 hover:bg-slate-100 border-none font-semibold text-xs"
              onClick={() => setIsRecordOpen(true)}
            >
              <CreditCard size={16} className="text-indigo-600" /> Record Payment
            </Button>
            <Button 
              className="rounded-xl h-11 flex-1 gap-2 bg-slate-50 text-slate-800 hover:bg-slate-100 border-none font-semibold text-xs"
              onClick={() => setIsInvoiceOpen(true)}
            >
              <Receipt size={16} className="text-emerald-600" /> Invoice Class
            </Button>
            <Button 
              className="rounded-xl h-11 flex-1 gap-2 bg-slate-50 text-slate-800 hover:bg-slate-100 border-none font-semibold text-xs"
              onClick={() => setIsStatementOpen(true)}
            >
              <History size={16} className="text-purple-600" /> Statements
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-xl shadow-sm border h-10 mb-4">
          <TabsTrigger value="balances" className="rounded-lg px-6 h-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all font-semibold text-xs">
            Fee Balances
          </TabsTrigger>
          <TabsTrigger value="ledger" className="rounded-lg px-6 h-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all font-semibold text-xs">
            Transaction Ledger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="balances">
          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Student</th>
                    <th className="px-5 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
                    <th className="px-5 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Amount Paid</th>
                    <th className="px-5 py-3 text-right font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {feesList.map((fee) => (
                    <tr key={fee.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{fee.student}</p>
                        <p className="text-[10px] text-muted-foreground">ID: #00{fee.id}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-1 max-w-[130px]">
                          <Badge className={
                            fee.status === 'Cleared' ? "bg-emerald-100 text-emerald-700 font-bold text-[10px] px-2 py-0.5" :
                            fee.status === 'Partial' ? "bg-blue-100 text-blue-700 font-bold text-[10px] px-2 py-0.5" :
                            "bg-red-100 text-red-700 font-bold text-[10px] px-2 py-0.5"
                          }>
                            {fee.status}
                          </Badge>
                          <Progress value={(fee.paid / fee.total) * 100} className="h-1" />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-bold">KES {fee.paid.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-slate-500">
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
          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b">
                    <th className="px-5 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Transaction ID</th>
                    <th className="px-5 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Date</th>
                    <th className="px-5 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Details</th>
                    <th className="px-5 py-3 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactionsList.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-indigo-600">{tx.id}</span>
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">{tx.method}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium">{tx.date}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{tx.category}</p>
                        <p className="text-[10px] text-slate-400">Ref: {tx.ref}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 text-emerald-600 font-bold">
                          KES {tx.amount.toLocaleString()}
                          <ArrowUpRight size={12} />
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

      {/* Dialogs */}
      <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5 relative">
          <Button type="button" variant="ghost" size="icon" className="absolute right-4 top-4 rounded-full h-8 w-8 text-slate-400" onClick={() => setIsRecordOpen(false)}>
            <X size={16} />
          </Button>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Record Payment</DialogTitle>
            <DialogDescription className="text-xs">Credit a student fee account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Select Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId} required>
                <SelectTrigger className="rounded-xl h-10 text-xs">
                  <SelectValue placeholder="Choose student" />
                </SelectTrigger>
                <SelectContent>
                  {feesList.map(fee => (
                    <SelectItem key={fee.id} value={fee.id}>{fee.student} (Bal: KES {(fee.total - fee.paid).toLocaleString()})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="rounded-xl h-10 text-xs">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank">Bank Deposit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Amount (KES)</Label>
                <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="e.g. 5000" required className="rounded-xl h-10 text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Reference Code</Label>
              <Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="e.g. SKL92JD81S" className="rounded-xl h-10 text-xs uppercase" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" className="rounded-xl h-9 text-xs" onClick={() => setIsRecordOpen(false)}>Cancel</Button>
              <Button type="submit" className="rounded-xl h-9 text-xs bg-indigo-600 hover:bg-indigo-700">Record Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Fees;