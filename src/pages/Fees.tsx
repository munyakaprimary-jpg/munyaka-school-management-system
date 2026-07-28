"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { Wallet, CreditCard, Receipt, TrendingUp, History, Download, ArrowUpRight, Settings2, Calculator, Save } from 'lucide-react';
import { FEES_DATA as initialFees, TRANSACTIONS as initialTransactions, GRADES_DATA } from '@/lib/mock-data';
import { showSuccess } from '@/utils/toast';

interface FeeStructure {
  year: string;
  term: string;
  gradeId: string;
  amount: number;
}

const Fees = () => {
  // Filter States
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTerm, setSelectedTerm] = useState("term1");
  const [selectedGrade, setSelectedGrade] = useState(GRADES_DATA[0].id);

  // Data States
  const [feesList, setFeesList] = useState(initialFees);
  const [transactionsList, setTransactionsList] = useState(initialTransactions);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(() => {
    const saved = localStorage.getItem('munyaka_fee_structures');
    return saved ? JSON.parse(saved) : [
      { year: "2024", term: "term1", gradeId: "g1", amount: 15000 },
      { year: "2024", term: "term1", gradeId: "g4", amount: 15000 },
      { year: "2024", term: "term1", gradeId: "g7", amount: 25000 },
    ];
  });

  // Modal States
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  // Form States
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [configAmount, setConfigAmount] = useState("");

  useEffect(() => {
    localStorage.setItem('munyaka_fee_structures', JSON.stringify(feeStructures));
  }, [feeStructures]);

  // Dynamic Lookup Logic
  const currentTermFee = useMemo(() => {
    const config = feeStructures.find(f => 
      f.year === selectedYear && 
      f.term === selectedTerm && 
      f.gradeId === selectedGrade
    );
    return config ? config.amount : 0;
  }, [selectedYear, selectedTerm, selectedGrade, feeStructures]);

  // Real-time Calculations for the filtered list
  const calculatedFees = useMemo(() => {
    return feesList.map(fee => {
      const balance = Math.max(0, currentTermFee - fee.paid);
      const status = fee.paid >= currentTermFee ? "Cleared" : (fee.paid > 0 ? "Partial" : "Pending");
      return { ...fee, total: currentTermFee, balance, status };
    });
  }, [feesList, currentTermFee]);

  const stats = useMemo(() => {
    const totalPossible = calculatedFees.length * currentTermFee;
    const totalCollected = calculatedFees.reduce((acc, curr) => acc + curr.paid, 0);
    const totalPending = Math.max(0, totalPossible - totalCollected);
    return { totalPossible, totalCollected, totalPending };
  }, [calculatedFees, currentTermFee]);

  const handleUpdateConfig = () => {
    const amountNum = parseFloat(configAmount);
    if (isNaN(amountNum)) return;

    const existingIndex = feeStructures.findIndex(f => 
      f.year === selectedYear && 
      f.term === selectedTerm && 
      f.gradeId === selectedGrade
    );

    if (existingIndex > -1) {
      const updated = [...feeStructures];
      updated[existingIndex].amount = amountNum;
      setFeeStructures(updated);
    } else {
      setFeeStructures([...feeStructures, { 
        year: selectedYear, 
        term: selectedTerm, 
        gradeId: selectedGrade, 
        amount: amountNum 
      }]);
    }

    setIsConfigOpen(false);
    showSuccess(`Fee structure updated for ${selectedYear} ${selectedTerm.toUpperCase()}`);
  };

  const handleRecordPayment = () => {
    if (!selectedStudentId || !paymentAmount) return;
    const amountNum = parseFloat(paymentAmount);
    
    setFeesList(feesList.map(fee => 
      fee.id === selectedStudentId 
        ? { ...fee, paid: fee.paid + amountNum } 
        : fee
    ));

    setTransactionsList([{ 
      id: `TX-${Math.floor(100 + Math.random() * 900)}`, 
      date: "Just now", 
      amount: amountNum, 
      method: "M-Pesa", 
      ref: "AUTO-GEN", 
      category: "Tuition" 
    }, ...transactionsList]);

    setIsRecordOpen(false);
    setPaymentAmount("");
    showSuccess(`Recorded KES ${amountNum.toLocaleString()} payment.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Finance & Fees</h1>
          <p className="text-muted-foreground font-medium">Manage dynamic structures and student ledgers.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="rounded-2xl gap-2 border-slate-200 bg-white"
            onClick={() => { setConfigAmount(currentTermFee.toString()); setIsConfigOpen(true); }}
          >
            <Settings2 size={18} /> Set Term Fees
          </Button>
          <Button className="rounded-2xl gap-2 bg-indigo-600 shadow-lg shadow-indigo-100" onClick={() => setIsRecordOpen(true)}>
            <CreditCard size={18} /> Record Payment
          </Button>
        </div>
      </div>

      {/* Global Context Selectors */}
      <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Academic Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["2024", "2025", "2026"].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Term</Label>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="term1">Term 1</SelectItem>
                <SelectItem value="term2">Term 2</SelectItem>
                <SelectItem value="term3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Grade Level</Label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                {GRADES_DATA.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2.5rem] bg-indigo-600 text-white p-8 relative overflow-hidden shadow-2xl shadow-indigo-100">
          <div className="absolute right-[-20px] top-[-20px] opacity-10"><Calculator size={140} /></div>
          <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-70">Term Fee Setting</p>
          <h2 className="text-3xl font-black mb-2">KES {currentTermFee.toLocaleString()}</h2>
          <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Active for selected filters</p>
        </Card>
        
        <Card className="rounded-[2.5rem] bg-white border-none shadow-sm p-8 flex flex-col justify-center">
          <p className="text-xs font-black uppercase tracking-widest mb-1 text-slate-400">Total Collected</p>
          <h2 className="text-3xl font-black text-slate-900 mb-2">KES {stats.totalCollected.toLocaleString()}</h2>
          <Progress value={(stats.totalCollected / stats.totalPossible) * 100} className="h-1.5" />
        </Card>

        <Card className="rounded-[2.5rem] bg-white border-none shadow-sm p-8 flex flex-col justify-center">
          <p className="text-xs font-black uppercase tracking-widest mb-1 text-slate-400">Pending Balances</p>
          <h2 className="text-3xl font-black text-rose-500 mb-2">KES {stats.totalPending.toLocaleString()}</h2>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <TrendingUp size={12} className="text-rose-500" /> Action Required
          </div>
        </Card>
      </div>

      <Tabs defaultValue="balances" className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-12 mb-8">
          <TabsTrigger value="balances" className="rounded-xl px-8 h-full font-bold text-xs">Fee Records</TabsTrigger>
          <TabsTrigger value="ledger" className="rounded-xl px-8 h-full font-bold text-xs">Transaction Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="balances">
          <Card className="rounded-[2rem] bg-white border-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-8 py-5 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">Student Details</th>
                    <th className="px-8 py-5 text-center font-black text-slate-400 text-[10px] uppercase tracking-widest">Term Fee</th>
                    <th className="px-8 py-5 text-center font-black text-slate-400 text-[10px] uppercase tracking-widest">Fee Paid</th>
                    <th className="px-8 py-5 text-center font-black text-slate-400 text-[10px] uppercase tracking-widest">Balance</th>
                    <th className="px-8 py-5 text-right font-black text-slate-400 text-[10px] uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {calculatedFees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-900">{fee.student}</p>
                        <p className="text-[10px] font-medium text-slate-400 uppercase">Assessment: A8273{fee.id}</p>
                      </td>
                      <td className="px-8 py-6 text-center font-bold text-slate-600">
                        KES {fee.total.toLocaleString()}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <p className="font-black text-emerald-600">KES {fee.paid.toLocaleString()}</p>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <p className={cn("font-black", fee.balance > 0 ? "text-rose-500" : "text-slate-300")}>
                          {fee.balance > 0 ? `KES ${fee.balance.toLocaleString()}` : "CLEARED"}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Badge className={cn(
                          "rounded-lg border-none px-3 font-bold",
                          fee.status === 'Cleared' ? "bg-emerald-50 text-emerald-700" : 
                          fee.status === 'Partial' ? "bg-amber-50 text-amber-700" : 
                          "bg-slate-100 text-slate-500"
                        )}>
                          {fee.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50/50 font-black border-t-2">
                    <td className="px-8 py-6">TOTALS</td>
                    <td className="px-8 py-6 text-center">KES {stats.totalPossible.toLocaleString()}</td>
                    <td className="px-8 py-6 text-center text-emerald-600">KES {stats.totalCollected.toLocaleString()}</td>
                    <td className="px-8 py-6 text-center text-rose-500">KES {stats.totalPending.toLocaleString()}</td>
                    <td className="px-8 py-6 text-right text-slate-400 uppercase text-[10px]">Consolidated</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="ledger">
          <Card className="rounded-[2rem] bg-white border-none shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-8 py-5 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">Ref ID</th>
                  <th className="px-8 py-5 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">Date</th>
                  <th className="px-8 py-5 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">Method</th>
                  <th className="px-8 py-5 text-right font-black text-slate-400 text-[10px] uppercase tracking-widest">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactionsList.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-6 font-bold text-indigo-600">{tx.id}</td>
                    <td className="px-8 py-6 font-medium text-slate-600">{tx.date}</td>
                    <td className="px-8 py-6"><Badge variant="outline" className="rounded-lg">{tx.method}</Badge></td>
                    <td className="px-8 py-6 text-right font-black text-emerald-600">
                      KES {tx.amount.toLocaleString()} <ArrowUpRight size={14} className="inline ml-1" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configuration Modal */}
      <Modal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        title="Set Term Fees" 
        description={`Define the total fee for ${GRADES_DATA.find(g => g.id === selectedGrade)?.name} in ${selectedYear}, ${selectedTerm.toUpperCase()}`}
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setIsConfigOpen(false)} className="rounded-xl font-bold">Discard</Button>
            <Button onClick={handleUpdateConfig} className="rounded-xl bg-indigo-600 px-8 font-black gap-2">
              <Save size={16} /> Save Structure
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Term Fee Amount (KES)</Label>
            <Input 
              type="number" 
              value={configAmount} 
              onChange={(e) => setConfigAmount(e.target.value)} 
              placeholder="e.g. 15000" 
              className="rounded-xl h-12 bg-slate-50 border-none font-black text-lg"
            />
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-start">
            < calculadora className="text-amber-600 mt-0.5" size={18} />
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              Updating this value will immediately recalculate the balances for all students in this grade for the selected year and term.
            </p>
          </div>
        </div>
      </Modal>

      {/* Record Payment Modal */}
      <Modal 
        isOpen={isRecordOpen} 
        onClose={() => setIsRecordOpen(false)} 
        title="Record Payment" 
        footer={<><Button variant="ghost" onClick={() => setIsRecordOpen(false)} className="rounded-xl">Cancel</Button><Button onClick={handleRecordPayment} className="rounded-xl bg-indigo-600">Post Transaction</Button></>}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none"><SelectValue placeholder="Choose student" /></SelectTrigger>
              <SelectContent>
                {feesList.map(fee => <SelectItem key={fee.id} value={fee.id}>{fee.student}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Amount (KES)</Label>
            <Input 
              type="number" 
              value={paymentAmount} 
              onChange={(e) => setPaymentAmount(e.target.value)} 
              placeholder="5000" 
              className="rounded-xl h-12 bg-slate-50 border-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Fees;