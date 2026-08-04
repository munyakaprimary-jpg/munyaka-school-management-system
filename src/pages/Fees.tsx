"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { CreditCard, ArrowUpRight, Settings2, Save, Eye, FileDown, Calculator, Loader2, Lock, AlertCircle, ShieldCheck } from 'lucide-react';
import { FEES_DATA as initialFees, TRANSACTIONS as initialTransactions, GRADES_DATA, STUDENTS } from '@/lib/mock-data';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from "@/lib/utils";
import { downloadCSV } from '@/utils/downloadHelper';

// Sub-components
import FeeStats from '@/components/fees/FeeStats';
import FeeFilters from '@/components/fees/FeeFilters';
import FeeStatement from '@/components/fees/FeeStatement';
import RecordPaymentModal from '@/components/fees/RecordPaymentModal';
import { FeeStructure, Transaction } from '@/types/fees';

interface ExtendedTransaction extends Transaction {
  studentId?: string;
  grade?: string;
}

const GRADE_LEVEL_OPTIONS = [
  { value: "all", label: "All Grade Levels" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: `${i + 1}`,
    label: `Grade ${i + 1}`,
  })),
];

const Fees = () => {
  // Global Academic Context Filter States
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTerm, setSelectedTerm] = useState("term1");
  const [selectedGrade, setSelectedGrade] = useState(GRADES_DATA[0].id);

  // Tab Grade Level View Filter
  const [tabGradeFilter, setTabGradeFilter] = useState<string>("all");

  // Data States - Load from localStorage
  const [feesList, setFeesList] = useState(() => {
    const saved = localStorage.getItem('munyaka_fees_records');
    return saved ? JSON.parse(saved) : initialFees;
  });
  const [transactionsList, setTransactionsList] = useState<ExtendedTransaction[]>(() => {
    const saved = localStorage.getItem('munyaka_transactions');
    return saved ? JSON.parse(saved) : initialTransactions as ExtendedTransaction[];
  });
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(() => {
    const saved = localStorage.getItem('munyaka_fee_structures');
    return saved ? JSON.parse(saved) : [
      { year: "2024", term: "term1", gradeId: "g1", amount: 15000 },
      { year: "2024", term: "term1", gradeId: "g4", amount: 15000 },
      { year: "2024", term: "term1", gradeId: "g7", amount: 25000 },
    ];
  });

  // Modal & Async States
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Admin Auth States for Set Term Fees
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Config States
  const [configGrade, setConfigGrade] = useState<string>("all");
  const [configAmount, setConfigAmount] = useState("");

  // Persist data to localStorage
  useEffect(() => {
    localStorage.setItem('munyaka_fee_structures', JSON.stringify(feeStructures));
  }, [feeStructures]);

  useEffect(() => {
    localStorage.setItem('munyaka_fees_records', JSON.stringify(feesList));
  }, [feesList]);

  useEffect(() => {
    localStorage.setItem('munyaka_transactions', JSON.stringify(transactionsList));
  }, [transactionsList]);

  // ============================================
  // DYNAMIC FEE CALCULATIONS
  // ============================================
  
  // Get term fee for a specific grade
  const getTermFeeForGrade = useMemo(() => {
    return (gradeId: string) => {
      const config = feeStructures.find(f => 
        f.year === selectedYear && f.term === selectedTerm && f.gradeId === gradeId
      );
      return config ? config.amount : 0;
    };
  }, [selectedYear, selectedTerm, feeStructures]);

  // Calculate total paid for each student from transactions
  const getTotalPaidForStudent = useMemo(() => {
    return (studentId: string) => {
      return transactionsList
        .filter(tx => tx.studentId === studentId)
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    };
  }, [transactionsList]);

  // Build calculated fees with dynamic data
  const calculatedFees = useMemo(() => {
    return feesList.map(fee => {
      // Find the student to get their grade
      const studentObj = STUDENTS.find(s => s.id === fee.id || s.name === fee.student);
      const studentGradeId = studentObj ? 
        GRADES_DATA.find(g => g.name === `Grade ${studentObj.grade}` || g.name === studentObj.grade)?.id 
        : selectedGrade;
      
      const termFee = studentGradeId ? getTermFeeForGrade(studentGradeId) : 0;
      const totalPaid = studentObj ? getTotalPaidForStudent(studentObj.id) : 0;
      const balance = Math.max(0, termFee - totalPaid);
      
      // Status logic
      let status: "Cleared" | "Partial" | "Pending" = "Pending";
      if (balance <= 0) {
        status = "Cleared";
      } else if (totalPaid > 0) {
        status = "Partial";
      } else {
        status = "Pending";
      }
      
      return { 
        ...fee, 
        total: termFee, 
        paid: totalPaid, 
        balance, 
        status,
        studentGradeId 
      };
    });
  }, [feesList, transactionsList, feeStructures, selectedYear, selectedTerm, getTermFeeForGrade, getTotalPaidForStudent]);

  // Filter calculated fees by Tab Grade Level Filter
  const filteredCalculatedFees = useMemo(() => {
    if (tabGradeFilter === "all") return calculatedFees;
    return calculatedFees.filter(fee => {
      const studentObj = STUDENTS.find(s => s.id === fee.id || s.name === fee.student);
      return studentObj && studentObj.grade === tabGradeFilter;
    });
  }, [calculatedFees, tabGradeFilter]);

  // Filter transaction ledger by Tab Grade Level Filter
  const filteredTransactions = useMemo(() => {
    if (tabGradeFilter === "all") return transactionsList;
    return transactionsList.filter(tx => {
      if (tx.grade) return tx.grade === tabGradeFilter;
      return true;
    });
  }, [transactionsList, tabGradeFilter]);

  const stats = useMemo(() => {
    const totalPossible = calculatedFees.reduce((sum, fee) => sum + fee.total, 0);
    const totalCollected = calculatedFees.reduce((sum, fee) => sum + fee.paid, 0);
    return { 
      totalPossible, 
      totalCollected, 
      totalPending: Math.max(0, totalPossible - totalCollected) 
    };
  }, [calculatedFees]);

  // Download Handler respecting active Grade Level filter
  const handleDownloadFeeStatement = async () => {
    setIsDownloading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsDownloading(false);
    
    const activeGradeLabel = GRADE_LEVEL_OPTIONS.find(o => o.value === tabGradeFilter)?.label || "Selected Grade";
    showSuccess(`Fee statement for ${activeGradeLabel} downloaded successfully!`);
  };

  // Auth Handlers for Set Term Fees
  const handleOpenAuthModal = () => {
    setAuthPassword("");
    setAuthError("");
    setIsAuthOpen(true);
  };

  const handleVerifyAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!authPassword.trim()) {
      setAuthError("Admin password is required");
      return;
    }

    setIsVerifying(true);
    setAuthError("");

    await new Promise(resolve => setTimeout(resolve, 700));

    const currentAdminPass = localStorage.getItem('munyaka_admin_pass') || 'munyaka5239';

    if (authPassword === currentAdminPass) {
      setIsAuthOpen(false);
      setAuthPassword("");
      handleOpenConfigModal();
      showSuccess("Admin verified. Opening term fee configuration...");
    } else {
      setAuthError("Invalid admin password");
      showError("Authorization failed");
      setAuthPassword("");
    }
    setIsVerifying(false);
  };

  // Modal Handlers
  const handleOpenConfigModal = () => {
    setConfigGrade("all");
    setConfigAmount(currentTermFee ? currentTermFee.toString() : "0");
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
    const studentGrade = matchedStudent ? matchedStudent.grade : "";

    setTransactionsList([{ 
      id: `TX-${Math.floor(100 + Math.random() * 900)}`, 
      date: new Date().toLocaleDateString(), 
      amount: amountNum, 
      method: "M-Pesa", 
      ref: "AUTO-GEN", 
      category: "Tuition",
      studentId,
      grade: studentGrade,
    }, ...transactionsList]);

    showSuccess(`Recorded KES ${amountNum.toLocaleString()} payment for ${studentName}`);
  };

  const selectedGradeObj = GRADES_DATA.find(g => g.id === configGrade);

  // Current term fee for the selected grade (for header display)
  const currentTermFee = useMemo(() => {
    const config = feeStructures.find(f => 
      f.year === selectedYear && f.term === selectedTerm && f.gradeId === selectedGrade
    );
    return config ? config.amount : 0;
  }, [selectedYear, selectedTerm, selectedGrade, feeStructures]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Finance & Fees</h1>
          <p className="text-sm text-slate-500">Manage fee structures and student account ledgers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="h-10 px-4 rounded-lg border-slate-200 bg-white text-sm font-medium gap-2 text-slate-700 hover:bg-slate-50" 
            onClick={handleOpenAuthModal}
          >
            <Lock size={15} className="text-slate-400" /> Set Term Fees
          </Button>
          <Button 
            className="h-10 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium gap-2 shadow-sm" 
            onClick={() => setIsRecordOpen(true)}
          >
            <CreditCard size={16} /> Record Payment
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <FeeFilters 
        year={selectedYear} setYear={setSelectedYear} 
        term={selectedTerm} setTerm={setSelectedTerm} 
        grade={selectedGrade} setGrade={setSelectedGrade} 
      />

      {/* Summary Metrics - Using actual recorded values */}
      <FeeStats 
        currentTermFee={currentTermFee} 
        totalCollected={stats.totalCollected} 
        totalPossible={stats.totalPossible} 
        totalPending={stats.totalPending} 
      />

      {/* Navigation Tabs & Header Actions */}
      <Tabs defaultValue="balances" className="w-full space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <TabsList className="bg-slate-100/80 p-1 rounded-lg h-10 border border-slate-200/60 inline-flex">
              <TabsTrigger value="balances" className="rounded-md px-4 h-full text-sm font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                Fee Records
              </TabsTrigger>
              <TabsTrigger value="ledger" className="rounded-md px-4 h-full text-sm font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                Transaction Ledger
              </TabsTrigger>
            </TabsList>

            {/* Grade Level Dropdown Filter */}
            <Select value={tabGradeFilter} onValueChange={setTabGradeFilter}>
              <SelectTrigger className="w-[180px] rounded-lg h-10 px-3 bg-white border border-slate-200 text-sm font-medium text-slate-800 shadow-sm focus:ring-1 ring-slate-200">
                <SelectValue placeholder="Grade Filter" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_LEVEL_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleDownloadFeeStatement}
            disabled={isDownloading}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg h-10 px-4 text-sm font-medium shadow-sm gap-2 transition-all shrink-0"
          >
            {isDownloading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <FileDown size={16} />
            )}
            Download Fee Statement
          </Button>
        </div>

        {/* Fee Records Table */}
        <TabsContent value="balances" className="m-0">
          <Card className="rounded-xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Details</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Term Fee</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee Paid</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCalculatedFees.length > 0 ? (
                    filteredCalculatedFees.map((fee) => (
                      <tr key={fee.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900">{fee.student}</p>
                          <p className="text-xs text-slate-400">Assessment: A8273{fee.id}</p>
                        </td>
                        <td className="px-5 py-3.5 text-center font-medium text-slate-600">KES {fee.total.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-center font-semibold text-emerald-600">KES {fee.paid.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-center font-semibold">
                          <span className={fee.balance > 0 ? "text-rose-600" : "text-slate-400"}>
                            {fee.balance > 0 ? `KES ${fee.balance.toLocaleString()}` : "CLEARED"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Badge className={cn("rounded-md border-none px-2.5 py-0.5 text-xs font-medium", 
                            fee.status === 'Cleared' ? "bg-emerald-50 text-emerald-700" : 
                            fee.status === 'Partial' ? "bg-amber-50 text-amber-700" : 
                            "bg-slate-100 text-slate-600"
                          )}>
                            {fee.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50" 
                              onClick={() => { setActiveStudent(fee); setIsStatementOpen(true); }}
                              title="View Statement"
                            >
                              <Eye size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50" 
                              onClick={() => showSuccess("Downloading...")}
                              title="Download PDF"
                            >
                              <FileDown size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">
                        No fee records found for the selected Grade Level.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Transaction Ledger Table */}
        <TabsContent value="ledger" className="m-0">
          <Card className="rounded-xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ref ID</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-indigo-600">{tx.id}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-600">{tx.date}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className="rounded-md border-slate-200 text-xs text-slate-600">{tx.method}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-600">
                        KES {tx.amount.toLocaleString()} <ArrowUpRight size={14} className="inline ml-1" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-400">
                      No transactions recorded for the selected Grade Level.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Admin Verification Modal for Set Term Fees */}
      <Modal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        title="Admin Authorization Required"
        description="Enter your admin password to configure term fees."
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="ghost" onClick={() => setIsAuthOpen(false)} className="rounded-xl font-bold h-11 px-6">
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleVerifyAuth}
              disabled={isVerifying}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-8 shadow-lg shadow-indigo-100 gap-2"
            >
              {isVerifying ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
              Authorize
            </Button>
          </div>
        }
      >
        <form onSubmit={handleVerifyAuth} className="space-y-4">
          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
              <AlertCircle size={16} /> {authError}
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Admin Password</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                type="password" 
                value={authPassword} 
                onChange={(e) => { setAuthPassword(e.target.value); setAuthError(""); }} 
                placeholder="••••••••" 
                className="pl-11 rounded-xl h-12 bg-slate-50 border-none font-bold text-lg"
                autoFocus
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Set Term Fees Modal */}
      <Modal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        title="Set Term Fees" 
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" className="rounded-lg h-10 px-4 text-sm font-medium" onClick={() => setIsConfigOpen(false)}>Discard</Button>
            <Button onClick={handleUpdateConfig} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-10 px-5 text-sm font-medium gap-2">
              <Save size={16} /> Save
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Grade Level</Label>
            <Select value={configGrade} onValueChange={handleModalGradeChange}>
              <SelectTrigger className="rounded-lg h-10 px-3 bg-slate-50 border-slate-200 text-sm font-medium">
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
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee Amount (KES)</Label>
            <Input 
              type="number" 
              value={configAmount} 
              onChange={(e) => setConfigAmount(e.target.value)} 
              className="rounded-lg h-10 px-3 bg-slate-50 border-slate-200 text-sm font-semibold" 
              placeholder="0"
            />
          </div>

          <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200/80 flex gap-2.5 items-start text-xs text-amber-800">
            <Calculator size={16} className="shrink-0 mt-0.5" /> 
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
      <Modal 
        isOpen={isStatementOpen} 
        onClose={() => setIsStatementOpen(false)} 
        title="Statement Preview" 
        maxWidth="max-w-3xl" 
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" className="rounded-lg h-10 px-4 text-sm font-medium" onClick={() => setIsStatementOpen(false)}>Close</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-10 px-5 text-sm font-medium gap-2" onClick={() => showSuccess("Downloading...")}>
              <FileDown size={16} /> Download PDF
            </Button>
          </div>
        }
      >
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