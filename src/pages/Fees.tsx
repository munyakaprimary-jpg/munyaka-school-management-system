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
import { Wallet, CreditCard, Receipt, TrendingUp, History, Download, ArrowUpRight, Settings2, Calculator, Save, Eye, FileDown, School } from 'lucide-react';
import { FEES_DATA as initialFees, TRANSACTIONS as initialTransactions, GRADES_DATA } from '@/lib/mock-data';
import { showSuccess } from '@/utils/toast';
import { cn } from "@/lib/utils";

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
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<any>(null);
  
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
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }), 
      amount: amountNum, 
      method: "M-Pesa", 
      ref: "AUTO-GEN", 
      category: "Tuition" 
    }, ...transactionsList]);

    setIsRecordOpen(false);
    setPaymentAmount("");
    showSuccess(`Recorded KES ${amountNum.toLocaleString()} payment.`);
  };

  const handleViewStatement = (student: any) => {
    setActiveStudent(student);
    setIsStatementOpen(true);
  };

  const handleDownloadStatement = (student: any) => {
    showSuccess(`Generating fee statement for ${student.student}...`);
    // Simulated download delay
    setTimeout(() => {
      showSuccess("Statement downloaded successfully.");
    }, 1500);
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
                    <th className="px-8 py-5 text-center font-black text-slate-400 text-[10px] uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-right font-black text-slate-400 text-[10px] uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {calculatedFees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-slate-50/50 transition-colors group">
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
                      <td className="px-8 py-6 text-center">
                        <Badge className={cn(
                          "rounded-lg border-none px-3 font-bold",
                          fee.status === 'Cleared' ? "bg-emerald-50 text-emerald-700" : 
                          fee.status === 'Partial' ? "bg-amber-50 text-amber-700" : 
                          "bg-slate-100 text-slate-500"
                        )}>
                          {fee.status}
                        </Badge>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-xl h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => handleViewStatement(fee)}
                            title="View Statement"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-xl h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => handleDownloadStatement(fee)}
                            title="Download Statement"
                          >
                            <FileDown size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50/50 font-black border-t-2">
                    <td className="px-8 py-6">TOTALS</td>
                    <td className="px-8 py-6 text-center">KES {stats.totalPossible.toLocaleString()}</td>
                    <td className="px-8 py-6 text-center text-emerald-600">KES {stats.totalCollected.toLocaleString()}</td>
                    <td className="px-8 py-6 text-center text-rose-500">KES {stats.totalPending.toLocaleString()}</td>
                    <td className="px-8 py-6 text-center text-slate-400 uppercase text-[10px]">Consolidated</td>
                    <td className="px-8 py-6"></td>
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
            <Calculator className="text-amber-600 mt-0.5" size={18} />
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

      {/* Statement Preview Modal */}
      <Modal
        isOpen={isStatementOpen}
        onClose={() => setIsStatementOpen(false)}
        title="Fee Statement Preview"
        maxWidth="max-w-3xl"
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setIsStatementOpen(false)} className="rounded-xl">Close</Button>
            <Button onClick={() => handleDownloadStatement(activeStudent)} className="rounded-xl bg-indigo-600 shadow-lg shadow-indigo-100 gap-2">
              <FileDown size={18} /> Download Statement (PDF)
            </Button>
          </div>
        }
      >
        {activeStudent && (
          <div className="space-y-8 p-4 bg-white border border-slate-100 rounded-3xl">
            {/* Statement Header */}
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

            {/* Student Info */}
            <div className="grid grid-cols-2 gap-8 py-6 bg-slate-50/50 rounded-2xl px-6 border border-dashed border-slate-200">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Learner Name</p>
                <p className="text-lg font-black text-slate-900 uppercase">{activeStudent.student}</p>
                <p className="text-xs font-bold text-indigo-600">ID: A8273{activeStudent.id}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Context</p>
                <p className="text-sm font-bold text-slate-700">{GRADES_DATA.find(g => g.id === selectedGrade)?.name} • {selectedTerm.toUpperCase()}</p>
                <p className="text-sm font-bold text-slate-500">{selectedYear} Academic Year</p>
              </div>
            </div>

            {/* Ledger Table */}
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
                      <td className="px-4 py-4 font-bold text-slate-700">Term Tuition Fee ({selectedTerm.toUpperCase()})</td>
                      <td className="px-4 py-4 text-right font-black">{activeStudent.total.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right font-black text-slate-300">0.00</td>
                    </tr>
                    {transactionsList.slice(0, 3).map((tx, i) => (
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
                        KES {activeStudent.balance.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <p className="text-[8px] font-black text-slate-300 uppercase text-center tracking-[0.2em] pt-4">
              This is a computer-generated document. No signature required.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Fees;