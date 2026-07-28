"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { CreditCard, ArrowUpRight, Settings2, Save, Eye, FileDown, Calculator } from 'lucide-react';
import { FEES_DATA as initialFees, TRANSACTIONS as initialTransactions, GRADES_DATA, STUDENTS } from '@/lib/mock-data';
import { showSuccess } from '@/utils/toast';
import { cn } from "@/lib/utils";

// Sub-components
import FeeStats from '@/components/fees/FeeStats';
import FeeFilters from '@/components/fees/FeeFilters';
import FeeStatement from '@/components/fees/FeeStatement';
import RecordPaymentModal from '@/components/fees/RecordPaymentModal';
import { FeeStructure, Transaction } from '@/types/fees';

const Fees = () => {
  // Filter States
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTerm, setSelectedTerm] = useState("term1");
  const [selectedGrade, setSelectedGrade] = useState(GRADES_DATA[0].id);

  // Data States
  const [feesList, setFeesList] = useState(initialFees);
  const [transactionsList, setTransactionsList] = useState<Transaction[]>(initialTransactions as Transaction[]);
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
  
  // Config States
  const [configGrade, setConfigGrade] = useState<string>("all");
  const [configAmount, setConfigAmount] = useState("");

  useEffect(() => {
    localStorage.setItem('munyaka_fee_structures', JSON.stringify(feeStructures));
  }, [feeStructures]);

  // Calculations
  const currentTermFee = useMemo(() => {
    const config = feeStructures.find(f => 
      f.year === selectedYear && f.term === selectedTerm && f.gradeId === selectedGrade
    );
    return config ? config.amount : 0;
  }, [selectedYear, selectedTerm, selectedGrade, feeStructures]);

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
    return { 
      totalPossible, 
      totalCollected, 
      totalPending: Math.max(0, totalPossible - totalCollected) 
    };
  }, [calculatedFees, currentTermFee]);

  // Modal Handlers
  const handleOpenConfigModal = () => {
    setConfigGrade("all");
    setConfigAmount(currentTermFee.toString());
    setIsConfigOpen(true);
  };

  const handleModalGradeChange = (gradeId: string) => {
    setConfigGrade(gradeId);
    if (gradeId === "all") {
      setConfigAmount(currentTermFee ? currentTermFee.toString() : "0");
    } else {
      const existing = feeStructures.find(
        f => f.year === selectedYear && f.term === selectedTerm && f.gradeId === gradeId
      );
      setConfigAmount(existing ? existing.amount.toString() : "0");
    }
  };

  const handleUpdateConfig = () => {
    const amountNum = parseFloat(configAmount);
    if (isNaN(amountNum)) return;

    if (configGrade === "all") {
      setFeeStructures(prev => {
        let updated = [...prev];
        GRADES_DATA.forEach(g => {
          const idx = updated.findIndex(f => f.year === selectedYear && f.term === selectedTerm && f.gradeId === g.id);
          if (idx > -1) {
            updated[idx] = { ...updated[idx], amount: amountNum };
          } else {
            updated.push({ year: selectedYear, term: selectedTerm, gradeId: g.id, amount: amountNum });
          }
        });
        return updated;
      });
    } else {
      setFeeStructures(prev => {
        const idx = prev.findIndex(f => f.year === selectedYear && f.term === selectedTerm && f.gradeId === configGrade);
        if (idx > -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], amount: amountNum };
          return updated;
        } else {
          return [...prev, { year: selectedYear, term: selectedTerm, gradeId: configGrade, amount: amountNum }];
        }
      });
    }

    setIsConfigOpen(false);
    const targetLabel = configGrade === "all" ? "all grades" : GRADES_DATA.find(g => g.id === configGrade)?.name || "selected grade";
    showSuccess(`Fee structure updated for ${targetLabel}`);
  };

  const handleRecordPayment = (studentId: string, amountNum: number) => {
    setFeesList(prev => prev.map(fee => fee.id === studentId ? { ...fee, paid: fee.paid + amountNum } : fee));
    
    const matchedStudent = STUDENTS.find(s => s.id === studentId);
    const studentName = matchedStudent ? matchedStudent.name : "Learner";

    setTransactionsList([{ 
      id: `TX-${Math.floor(100 + Math.random() * 900)}`, 
      date: new Date().toLocaleDateString(), 
      amount: amountNum, 
      method: "M-Pesa", 
      ref: "AUTO-GEN", 
      category: "Tuition" 
    }, ...transactionsList]);

    showSuccess(`Recorded KES ${amountNum.toLocaleString()} payment for ${studentName}`);
  };

  const selectedGradeObj = GRADES_DATA.find(g => g.id === configGrade);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Finance & Fees</h1>
          <p className="text-muted-foreground font-medium">Manage dynamic structures and student ledgers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl gap-2 border-slate-200 bg-white" onClick={handleOpenConfigModal}>
            <Settings2 size={18} /> Set Term Fees
          </Button>
          <Button className="rounded-2xl gap-2 bg-indigo-600 shadow-lg shadow-indigo-100" onClick={() => setIsRecordOpen(true)}>
            <CreditCard size={18} /> Record Payment
          </Button>
        </div>
      </div>

      <FeeFilters 
        year={selectedYear} setYear={setSelectedYear} 
        term={selectedTerm} setTerm={setSelectedTerm} 
        grade={selectedGrade} setGrade={setSelectedGrade} 
      />

      <FeeStats 
        currentTermFee={currentTermFee} 
        totalCollected={stats.totalCollected} 
        totalPossible={stats.totalPossible} 
        totalPending={stats.totalPending} 
      />

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
                      <td className="px-8 py-6 text-center font-bold text-slate-600">KES {fee.total.toLocaleString()}</td>
                      <td className="px-8 py-6 text-center"><p className="font-black text-emerald-600">KES {fee.paid.toLocaleString()}</p></td>
                      <td className="px-8 py-6 text-center">
                        <p className={cn("font-black", fee.balance > 0 ? "text-rose-500" : "text-slate-300")}>
                          {fee.balance > 0 ? `KES ${fee.balance.toLocaleString()}` : "CLEARED"}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <Badge className={cn("rounded-lg border-none px-3 font-bold", fee.status === 'Cleared' ? "bg-emerald-50 text-emerald-700" : fee.status === 'Partial' ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500")}>
                          {fee.status}
                        </Badge>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => { setActiveStudent(fee); setIsStatementOpen(true); }}><Eye size={16} /></Button>
                          <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => showSuccess("Downloading...")}><FileDown size={16} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                    <td className="px-8 py-6 text-right font-black text-emerald-600">KES {tx.amount.toLocaleString()} <ArrowUpRight size={14} className="inline ml-1" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Set Term Fees Modal */}
      <Modal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        title="Set Term Fees" 
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setIsConfigOpen(false)}>Discard</Button>
            <Button onClick={handleUpdateConfig} className="bg-indigo-600">
              <Save size={16} className="mr-2" /> Save
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Grade Level</Label>
            <Select value={configGrade} onValueChange={handleModalGradeChange}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades (Bulk Set)</SelectItem>
                {GRADES_DATA.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Fee Amount (KES)</Label>
            <Input 
              type="number" 
              value={configAmount} 
              onChange={(e) => setConfigAmount(e.target.value)} 
              className="rounded-xl h-12 bg-slate-50 border-none font-black text-lg" 
              placeholder="0"
            />
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-start text-xs text-amber-700">
            <Calculator size={18} className="shrink-0 mt-0.5" /> 
            <p>
              {configGrade === "all" 
                ? "Updating this will recalculate balances for all students across all grades in this academic context." 
                : `Updating this will recalculate balances for ${selectedGradeObj?.name || "the selected grade"} in this academic context.`}
            </p>
          </div>
        </div>
      </Modal>

      {/* Record Payment Modal with Cascading Dropdowns */}
      <RecordPaymentModal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        onSubmitPayment={handleRecordPayment}
        gradesData={GRADES_DATA}
        studentsData={STUDENTS}
      />

      {/* Statement Preview Modal */}
      <Modal isOpen={isStatementOpen} onClose={() => setIsStatementOpen(false)} title="Statement Preview" maxWidth="max-w-3xl" footer={<div className="flex gap-3"><Button variant="ghost" onClick={() => setIsStatementOpen(false)}>Close</Button><Button className="bg-indigo-600" onClick={() => showSuccess("Downloading...")}><FileDown size={18} className="mr-2" /> Download PDF</Button></div>}>
        {activeStudent && (
          <FeeStatement 
            student={activeStudent} 
            transactions={transactionsList} 
            year={selectedYear} 
            term={selectedTerm} 
            gradeName={GRADES_DATA.find(g => g.id === selectedGrade)?.name || ""} 
          />
        )}
      </Modal>
    </div>
  );
};

export default Fees;