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
import { Wallet, CreditCard, Receipt, TrendingUp, History, Download, ArrowUpRight, Send } from 'lucide-react';
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
  const [paymentAmount, setPaymentAmount] = useState("");
  const [mpesaRef, setMpesaRef] = useState("");
  const [paymentCategory, setPaymentCategory] = useState("Tuition");

  // Form states - Invoice Class
  const [selectedGrade, setSelectedGrade] = useState("");
  const [invoiceCategory, setInvoiceCategory] = useState("Tuition");
  const [invoiceAmount, setInvoiceAmount] = useState("");

  // Form states - Fee Statement
  const [statementStudentId, setStatementStudentId] = useState("");

  // Handle Record Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !paymentAmount || !mpesaRef) return;

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    // Find student and update fees list
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

    // Add to transaction ledger
    const newTx = {
      id: `TX-${Math.floor(100 + Math.random() * 900)}`,
      date: "Just now",
      amount: amountNum,
      method: "M-Pesa",
      ref: mpesaRef.toUpperCase(),
      category: paymentCategory
    };

    setFeesList(updatedFees);
    setTransactionsList([newTx, ...transactionsList]);
    setIsRecordOpen(false);
    
    // Reset form
    setSelectedStudentId("");
    setPaymentAmount("");
    setMpesaRef("");
    setPaymentCategory("Tuition");

    showSuccess(`Successfully recorded payment of KES ${amountNum.toLocaleString()} for ${studentFee.student}!`);
  };

  // Handle Invoice Class
  const handleInvoiceClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrade || !invoiceAmount) return;

    const amountNum = parseFloat(invoiceAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    // In a real app, this would invoice all students in that grade.
    // For demo, we increase the total fee for all students in our list.
    const updatedFees = feesList.map(fee => ({
      ...fee,
      total: fee.total + amountNum,
      status: fee.paid >= (fee.total + amountNum) ? "Cleared" : "Partial"
    }));

    setFeesList(updatedFees);
    setIsInvoiceOpen(false);
    setSelectedGrade("");
    setInvoiceAmount("");

    showSuccess(`Successfully invoiced KES ${amountNum.toLocaleString()} to all students in ${selectedGrade}!`);
  };

  // Handle Generate Statement
  const handleGenerateStatement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statementStudentId) return;

    const studentFee = feesList.find(f => f.id === statementStudentId);
    if (!studentFee) return;

    setIsStatementOpen(false);
    setStatementStudentId("");
    showSuccess(`Fee statement for ${studentFee.student} generated and downloaded successfully!`);
  };

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
            <Button 
              className="rounded-2xl h-16 flex-1 gap-2 bg-slate-50 text-slate-900 hover:bg-slate-100 border-none group"
              onClick={() => setIsRecordOpen(true)}
            >
              <CreditCard size={20} className="text-blue-600 group-hover:scale-110 transition-transform" /> Record M-Pesa
            </Button>
            <Button 
              className="rounded-2xl h-16 flex-1 gap-2 bg-slate-50 text-slate-900 hover:bg-slate-100 border-none group"
              onClick={() => setIsInvoiceOpen(true)}
            >
              <Receipt size={20} className="text-emerald-600 group-hover:scale-110 transition-transform" /> Invoice Class
            </Button>
            <Button 
              className="rounded-2xl h-16 flex-1 gap-2 bg-slate-50 text-slate-900 hover:bg-slate-100 border-none group"
              onClick={() => setIsStatementOpen(true)}
            >
              <History size={20} className="text-purple-600 group-hover:scale-110 transition-transform" /> Fee Statements
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                  {feesList.map((fee) => (
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
                  {transactionsList.map((tx) => (
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

      {/* Record M-Pesa Payment Dialog */}
      <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Record M-Pesa Payment</DialogTitle>
            <DialogDescription>
              Enter the transaction details to credit a student's fee account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordPayment} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Select Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId} required>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Choose student" />
                </SelectTrigger>
                <SelectContent>
                  {feesList.map(fee => (
                    <SelectItem key={fee.id} value={fee.id}>{fee.student} (Bal: KES {(fee.total - fee.paid).toLocaleString()})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (KES)</Label>
                <Input 
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>M-Pesa Ref Code</Label>
                <Input 
                  value={mpesaRef}
                  onChange={(e) => setMpesaRef(e.target.value)}
                  placeholder="e.g. SKL92JD81S"
                  required
                  className="rounded-xl h-12 uppercase"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fee Category</Label>
              <Select value={paymentCategory} onValueChange={setPaymentCategory}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tuition">Tuition Fee</SelectItem>
                  <SelectItem value="Activity">Activity Fee</SelectItem>
                  <SelectItem value="Exam">Exam Fee</SelectItem>
                  <SelectItem value="Transport">Transport Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                className="rounded-xl font-bold"
                onClick={() => setIsRecordOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100"
              >
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invoice Class Dialog */}
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Invoice Class / Stream</DialogTitle>
            <DialogDescription>
              Apply a fee charge to all students in a specific grade level.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvoiceClass} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Select Grade / Class</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade} required>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Choose grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Grade 1">Grade 1</SelectItem>
                  <SelectItem value="Grade 4">Grade 4</SelectItem>
                  <SelectItem value="Grade 7">Grade 7</SelectItem>
                  <SelectItem value="Grade 8">Grade 8</SelectItem>
                  <SelectItem value="All Classes">All Classes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Invoice Category</Label>
              <Select value={invoiceCategory} onValueChange={setInvoiceCategory}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tuition">Tuition Fee</SelectItem>
                  <SelectItem value="Activity">Activity Fee</SelectItem>
                  <SelectItem value="Exam">Exam Fee</SelectItem>
                  <SelectItem value="Transport">Transport Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount per Student (KES)</Label>
              <Input 
                type="number"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
                placeholder="e.g. 15000"
                required
                className="rounded-xl h-12"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                className="rounded-xl font-bold"
                onClick={() => setIsInvoiceOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100"
              >
                Apply Invoice
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fee Statements Dialog */}
      <Dialog open={isStatementOpen} onOpenChange={setIsStatementOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Generate Fee Statement</DialogTitle>
            <DialogDescription>
              Select a student to compile and download their full fee statement.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGenerateStatement} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Select Student</Label>
              <Select value={statementStudentId} onValueChange={setStatementStudentId} required>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Choose student" />
                </SelectTrigger>
                <SelectContent>
                  {feesList.map(fee => (
                    <SelectItem key={fee.id} value={fee.id}>{fee.student}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                className="rounded-xl font-bold"
                onClick={() => setIsStatementOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100"
              >
                Generate Statement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Fees;