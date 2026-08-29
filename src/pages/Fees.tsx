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
import { CreditCard, ArrowUpRight, Settings2, Save, Eye, FileDown, Calculator, Loader2, Lock, AlertCircle, ShieldCheck, FileText, Clock, History, Edit, Database, RefreshCw } from 'lucide-react';
import { TRANSACTIONS as initialTransactions, GRADES_DATA, STUDENTS } from '@/lib/mock-data';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from "@/lib/utils";
import { useFileDownload } from '@/utils/fileDownloader';

// Sub-components
import FeeStats from '@/components/fees/FeeStats';
import FeeFilters from '@/components/fees/FeeFilters';
import FeeStatement from '@/components/fees/FeeStatement';
import RecordPaymentModal from '@/components/fees/RecordPaymentModal';
import EditFeeModal from '@/components/fees/EditFeeModal';
import FeeReceipt from '@/components/fees/FeeReceipt';
import { Transaction, PaymentMethod, PaymentDetails } from '@/types/fees';

interface ExtendedTransaction extends Transaction {
  studentId?: string;
  grade?: string;
  stream?: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  admin: string;
  action: string;
  studentName: string;
  studentId: string;
  changes: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  reason: string;
}

// Learner interface matching the one in Students.tsx
interface Learner {
  id: string;
  admNo: string;
  name: string;
  grade: string;
  stream: string;
  gender: 'Male' | 'Female' | 'Other';
  guardian: string;
  phone: string;
}

const GRADE_LEVEL_OPTIONS = [
  { value: "all", label: "All Grade Levels" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: `${i + 1}`,
    label: `Grade ${i + 1}`,
  })),
];

// Local storage keys
const LEARNERS_KEY = 'school_learners_data';
const FEE_OVERRIDES_KEY_PREFIX = 'munyaka_fee_';

// Helper: Get normalized match key for grade (e.g. "Grade 4" -> "grade4")
const getGradeMatchKey = (name: string): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (lower === 'pp1' || lower === 'pp2') return lower;
  const digitMatch = lower.match(/(\d+)/);
  if (digitMatch) return `grade${digitMatch[1]}`;
  return lower.replace(/\s+/g, '');
};

// Helper: Normalize grade name to title case
const normalizeGradeName = (name: string): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

// Helper: Normalize stream name to title case
const normalizeStreamName = (name: string): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

const Fees = () => {
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTerm, setSelectedTerm] = useState("term1");
  const [selectedGrade, setSelectedGrade] = useState(GRADES_DATA[0].id);

  // Tab Grade Level View Filter
  const [tabGradeFilter, setTabGradeFilter] = useState<string>("all");

  // Load learners from localStorage (real data from Learners Management)
  const [learners, setLearners] = useState<Learner[]>(() => {
    try {
      const saved = localStorage.getItem(LEARNERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load learners from localStorage:", e);
    }
    return [];
  });

  // Listen for learner data updates from Students Management page
  useEffect(() => {
    const handleLearnersUpdate = () => {
      try {
        const saved = localStorage.getItem(LEARNERS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setLearners(parsed);
          }
        }
      } catch (e) {
        console.error("Failed to refresh learners from localStorage:", e);
      }
    };

    // Listen for both storage events (cross-tab) and custom events (same-tab)
    window.addEventListener('storage', handleLearnersUpdate);
    window.addEventListener('learners_data_updated', handleLearnersUpdate);
    window.addEventListener('focus', handleLearnersUpdate);

    return () => {
      window.removeEventListener('storage', handleLearnersUpdate);
      window.removeEventListener('learners_data_updated', handleLearnersUpdate);
      window.removeEventListener('focus', handleLearnersUpdate);
    };
  }, []);

  // Normalize all learners to ensure consistent grade/stream formatting
  const normalizedLearners = useMemo(() => {
    return learners.map((l) => ({
      ...l,
      grade: normalizeGradeName(l.grade),
      stream: normalizeStreamName(l.stream),
    }));
  }, [learners]);

  // Build fee records dynamically from real learner data
  // No more hardcoded mock data — completely driven by Learners Management
  const [transactionsList, setTransactionsList] = useState<ExtendedTransaction[]>(() => {
    const saved = localStorage.getItem('munyaka_transactions');
    return saved ? JSON.parse(saved) : initialTransactions as ExtendedTransaction[];
  });
  const [feeStructures, setFeeStructures] = useState(() => {
    const saved = localStorage.getItem('munyaka_fee_structures');
    return saved ? JSON.parse(saved) : [
      { year: "2024", term: "term1", gradeId: "g1", amount: 15000 },
      { year: "2024", term: "term1", gradeId: "g4", amount: 15000 },
      { year: "2024", term: "term1", gradeId: "g7", amount: 25000 },
    ];
  });
  
  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('munyaka_fee_audit_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Modal & Async States
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<any>(null);
  // Receipt modal state
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<ExtendedTransaction | null>(null);

  // Admin Auth States for Set Term Fees
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Config States
  const [configGrade, setConfigGrade] = useState<string>("all");
  const [configAmount, setConfigAmount] = useState("");

  // ====== Unified file-download state for CSV statement ======
  const statementExport = useFileDownload();

  // Persist data to localStorage
  useEffect(() => {
    localStorage.setItem('munyaka_fee_structures', JSON.stringify(feeStructures));
  }, [feeStructures]);

  useEffect(() => {
    localStorage.setItem('munyaka_transactions', JSON.stringify(transactionsList));
  }, [transactionsList]);

  useEffect(() => {
    localStorage.setItem('munyaka_fee_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Listen for fee update events from EditFeeModal and refresh state
  useEffect(() => {
    const handleFeesUpdated = () => {
      const savedTransactions = localStorage.getItem('munyaka_transactions');
      if (savedTransactions) {
        try {
          setTransactionsList(JSON.parse(savedTransactions));
        } catch (e) {
          console.error("Failed to refresh transactions from localStorage:", e);
        }
      }
      const savedAuditLogs = localStorage.getItem('munyaka_fee_audit_logs');
      if (savedAuditLogs) {
        try {
          setAuditLogs(JSON.parse(savedAuditLogs));
        } catch (e) {
          console.error("Failed to refresh audit logs from localStorage:", e);
        }
      }
    };

    window.addEventListener('munyaka_fees_updated', handleFeesUpdated);
    return () => {
      window.removeEventListener('munyaka_fees_updated', handleFeesUpdated);
    };
  }, []);

  // ============================================
  // DYNAMIC FEE CALCULATIONS — Built from real learners
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

  // Helper: find grade ID matching a learner's grade name
  const findGradeIdForLearner = (learnerGrade: string): string => {
    const matchKey = getGradeMatchKey(learnerGrade);
    const found = GRADES_DATA.find(g => getGradeMatchKey(g.name) === matchKey);
    return found ? found.id : '';
  };

  // Build calculated fees DYNAMICALLY from real learner data
  // No more hardcoded records — every fee record is derived from a real learner
  const calculatedFees = useMemo(() => {
    return normalizedLearners.map(learner => {
      // Check for manual override stored in localStorage (from Edit Fee Modal)
      const overrideKey = `${FEE_OVERRIDES_KEY_PREFIX}${learner.id}`;
      const overrideSaved = localStorage.getItem(overrideKey);
      let hasOverride = false;

      if (overrideSaved) {
        try {
          const overrideData = JSON.parse(overrideSaved);
          if (overrideData && (
            overrideData.termFee !== undefined ||
            overrideData.feePaid !== undefined ||
            overrideData.total !== undefined ||
            overrideData.paid !== undefined
          )) {
            hasOverride = true;
            const overrideTermFee = overrideData.termFee !== undefined
              ? overrideData.termFee
              : (overrideData.total !== undefined ? overrideData.total : 0);
            const overrideFeePaid = overrideData.feePaid !== undefined
              ? overrideData.feePaid
              : (overrideData.paid !== undefined ? overrideData.paid : 0);
            const overrideBalance = Math.max(0, overrideTermFee - overrideFeePaid);
            let overrideStatus: "Cleared" | "Partial" | "Pending" = "Pending";
            if (overrideBalance <= 0) {
              overrideStatus = "Cleared";
            } else if (overrideFeePaid > 0) {
              overrideStatus = "Partial";
            }
            return {
              id: learner.id,
              student: learner.name,
              total: overrideTermFee,
              paid: overrideFeePaid,
              balance: overrideBalance,
              status: overrideStatus,
              admNo: learner.admNo,
              grade: learner.grade,
              stream: learner.stream,
            };
          }
        } catch (e) {
          // Fall through to dynamic calculation
        }
      }

      // Dynamically compute fee from the learner's grade configuration
      const studentGradeId = findGradeIdForLearner(learner.grade);
      const termFee = studentGradeId ? getTermFeeForGrade(studentGradeId) : 0;
      const totalPaid = getTotalPaidForStudent(learner.id);
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
        id: learner.id,
        student: learner.name,
        total: termFee,
        paid: totalPaid,
        balance,
        status,
        admNo: learner.admNo,
        grade: learner.grade,
        stream: learner.stream,
        studentGradeId,
      };
    });
  }, [normalizedLearners, transactionsList, feeStructures, selectedYear, selectedTerm, getTermFeeForGrade, getTotalPaidForStudent]);

  // Filter calculated fees by Tab Grade Level Filter
  const filteredCalculatedFees = useMemo(() => {
    if (tabGradeFilter === "all") return calculatedFees;
    return calculatedFees.filter(fee => {
      // Match the learner's grade against the tab filter using normalized match key
      const feeGradeKey = getGradeMatchKey(fee.grade);
      return feeGradeKey === getGradeMatchKey(tabGradeFilter) || fee.studentGradeId === tabGradeFilter;
    });
  }, [calculatedFees, tabGradeFilter]);

  // Filter transaction ledger by Tab Grade Level Filter
  const filteredTransactions = useMemo(() => {
    if (tabGradeFilter === "all") return transactionsList;
    return transactionsList.filter(tx => {
      if (tx.grade) {
        return getGradeMatchKey(tx.grade) === getGradeMatchKey(tabGradeFilter);
      }
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

  // ====== UNIFIED DOWNLOAD HANDLER for the fee statement CSV ======
  const handleDownloadFeeStatement = async () => {
    const activeGradeLabel = GRADE_LEVEL_OPTIONS.find(o => o.value === tabGradeFilter)?.label || "Selected Grade";
    const filename = `fee_statement_${activeGradeLabel.replace(/\s+/g, '_')}_${selectedTerm}_${new Date().toISOString().slice(0, 10)}.csv`;
    
    // Build a single CSV string with school header + filter context
    const headers = [
      "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
      `Active Filter: ${activeGradeLabel} | ${selectedTerm} | ${selectedYear}`,
      `Total Students: ${filteredCalculatedFees.length} | Generated: ${new Date().toLocaleString()}`,
      "",
      ["Adm No", "Student Name", "Grade", "Stream", "Term Fee (KES)", "Fee Paid (KES)", "Balance (KES)", "Status"].join(","),
    ];
    const rows = filteredCalculatedFees.map((fee) => [
      fee.admNo || "",
      `"${fee.student}"`,
      fee.grade,
      fee.stream,
      fee.total,
      fee.paid,
      fee.balance,
      fee.status,
    ].join(","));
    const csv = [headers.join("\n"), ...rows].join("\n");

    await statementExport.download({
      filename,
      data: csv,
      mimeType: 'text/csv;charset=utf-8;',
      fileType: 'csv',
      successMessage: `Fee statement for ${activeGradeLabel} downloaded successfully.`,
      errorMessage: "Download failed. Please check app permissions.",
    });
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

  const handleRecordPayment = (tx: Transaction) => {
    const matchedLearner = normalizedLearners.find(l => l.id === tx.studentId);
    const studentName = matchedLearner ? matchedLearner.name : "Learner";
    const studentGrade = matchedLearner ? matchedLearner.grade : tx.grade ?? "";

    const enrichedTx: ExtendedTransaction = {
      ...tx,
      grade: studentGrade,
    };

    // 1) Persist to state + localStorage
    const nextList = [enrichedTx, ...transactionsList];
    setTransactionsList(nextList);
    try {
      localStorage.setItem('munyaka_transactions', JSON.stringify(nextList));
    } catch (e) {
      console.error('Failed to persist transaction:', e);
    }

    // 2) Mirror into the per-student override store so the balance updates
    //    immediately even if no payment ledger has been run yet.
    try {
      const overrideKey = `${FEE_OVERRIDES_KEY_PREFIX}${tx.studentId}`;
      const prevOverride = localStorage.getItem(overrideKey);
      let prevPaid = 0;
      if (prevOverride) {
        const parsed = JSON.parse(prevOverride);
        prevPaid = parsed.feePaid ?? parsed.paid ?? 0;
      }
      // Use the current dynamic total if no override exists yet
      let total = 0;
      const fee = calculatedFees.find(f => f.id === tx.studentId);
      if (prevOverride) {
        const parsed = JSON.parse(prevOverride);
        total = parsed.termFee ?? parsed.total ?? fee?.total ?? 0;
      } else {
        total = fee?.total ?? 0;
      }
      const newPaid = prevPaid + tx.amount;
      const balance = Math.max(0, total - newPaid);
      let status: "Cleared" | "Partial" | "Pending" = "Pending";
      if (balance <= 0) status = "Cleared";
      else if (newPaid > 0) status = "Partial";
      localStorage.setItem(overrideKey, JSON.stringify({
        id: tx.studentId,
        termFee: total,
        feePaid: newPaid,
        balance,
        status,
        reason: `Auto-update from ${tx.method} payment ${tx.id}`,
      }));
    } catch (e) {
      console.error('Failed to update student fee override:', e);
    }

    // 3) Update the audit log
    const auditEntry: AuditLogEntry = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      admin: tx.paymentMethod === 'cash' ? (tx.paymentDetails as any)?.receivedBy ?? 'Cashier' : 'System Admin',
      action: `Payment Recorded (${tx.method})`,
      studentName,
      studentId: tx.studentId!,
      changes: [
        { field: 'Amount Received', oldValue: '0.00', newValue: `KES ${tx.amount.toLocaleString()}` },
        { field: 'Method', oldValue: '—', newValue: tx.method },
        { field: 'Reference', oldValue: '—', newValue: tx.ref },
      ],
      reason: `Recorded via Record Payment modal (TX: ${tx.id})`,
    };
    const newAuditLogs = [auditEntry, ...auditLogs];
    setAuditLogs(newAuditLogs);
    try {
      localStorage.setItem('munyaka_fee_audit_logs', JSON.stringify(newAuditLogs));
    } catch (e) { console.error('Failed to persist audit log:', e); }

    // 4) Notify any other listeners (balance cards, dashboards) that the
    //    fee/transaction state has changed.
    window.dispatchEvent(new Event('munyaka_fees_updated'));

    // 5) Build a lightweight student record for the receipt
    const receiptStudent = {
      student: studentName,
      admNo: matchedLearner?.admNo ?? matchedLearner?.id ?? tx.studentId ?? '',
      grade: matchedLearner?.grade ?? tx.grade ?? '',
      stream: matchedLearner?.stream ?? tx.stream ?? '',
      total: fee?.total ?? 0,
      paid: (fee?.paid ?? 0) + tx.amount,
      balance: Math.max(0, (fee?.total ?? 0) - ((fee?.paid ?? 0) + tx.amount)),
      status: fee?.status ?? 'Partial',
    };

    // 6) Show the receipt modal so the cashier can print/download a receipt.
    setActiveStudent(receiptStudent);
    setLastTransaction(enrichedTx);
    setIsReceiptOpen(true);

    showSuccess(`KES ${tx.amount.toLocaleString()} ${tx.method} payment recorded for ${studentName}.`);
  };

  // Edit Fee Handler
  const handleEditFee = (studentId: string, termFee: number, feePaid: number, reason: string) => {
    const matchedLearner = normalizedLearners.find(l => l.id === studentId);
    const studentName = matchedLearner ? matchedLearner.name : "Unknown Learner";
    const studentGrade = matchedLearner ? matchedLearner.grade : "";

    // Read current fee record from LocalStorage for accurate old values
    const storageKey = `${FEE_OVERRIDES_KEY_PREFIX}${studentId}`;
    const savedFee = localStorage.getItem(storageKey);
    let oldTotal = 0;
    let oldPaid = 0;

    if (savedFee) {
      try {
        const feeData = JSON.parse(savedFee);
        oldTotal = feeData.termFee || feeData.total || 0;
        oldPaid = feeData.feePaid || feeData.paid || 0;
      } catch (e) {
        const oldFee = calculatedFees.find(f => f.id === studentId);
        oldTotal = oldFee?.total || 0;
        oldPaid = oldFee?.paid || 0;
      }
    } else {
      const oldFee = calculatedFees.find(f => f.id === studentId);
      oldTotal = oldFee?.total || 0;
      oldPaid = oldFee?.paid || 0;
    }

    // Calculate new status
    const balance = Math.max(0, termFee - feePaid);
    let status = "Pending";
    if (balance <= 0) {
      status = "Cleared";
    } else if (feePaid > 0 && balance > 0) {
      status = "Partial";
    } else {
      status = "Pending";
    }

    // Save individual student override in localStorage
    const feeData = {
      id: studentId,
      termFee,
      feePaid,
      balance,
      status,
      reason
    };
    localStorage.setItem(storageKey, JSON.stringify(feeData));

    // Add a transaction record for the adjustment if feePaid changed
    const diff = feePaid - oldPaid;

    if (diff !== 0) {
      const newTransactions = [{
        id: `TX-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toLocaleDateString(),
        amount: diff,
        method: "Admin Adjustment",
        ref: "ADJ-" + Date.now().toString().slice(-6),
        category: "Adjustment",
        studentId,
        grade: studentGrade,
      }, ...transactionsList];
      setTransactionsList(newTransactions);
      localStorage.setItem('munyaka_transactions', JSON.stringify(newTransactions));
    }

    // Create audit log entry
    const auditEntry: AuditLogEntry = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      admin: "System Admin",
      action: "Fee Record Modified",
      studentName,
      studentId,
      changes: [
        { field: "Term Fee", oldValue: oldTotal.toString(), newValue: termFee.toString() },
        { field: "Fee Paid", oldValue: oldPaid.toString(), newValue: feePaid.toString() },
      ],
      reason: reason || "No reason provided"
    };

    const newAuditLogs = [auditEntry, ...auditLogs];
    setAuditLogs(newAuditLogs);
    localStorage.setItem('munyaka_fee_audit_logs', JSON.stringify(newAuditLogs));

    // Dispatch update event for multi-component reactivity
    window.dispatchEvent(new Event('munyaka_fees_updated'));

    showSuccess(`Fee record updated for ${studentName}. Status updated to ${status}.`);
  };

  const handleOpenEditModal = (fee: any) => {
    // Read from LocalStorage first if available, to get the most up-to-date values
    const storageKey = `${FEE_OVERRIDES_KEY_PREFIX}${fee.id}`;
    const savedFee = localStorage.getItem(storageKey);

    if (savedFee) {
      try {
        const feeData = JSON.parse(savedFee);
        const updatedFee = {
          ...fee,
          total: feeData.termFee || fee.total,
          paid: feeData.feePaid || fee.paid
        };
        setActiveStudent(updatedFee);
        setIsEditOpen(true);
        return;
      } catch (e) {
        // Fall back to original fee
      }
    }

    setActiveStudent(fee);
    setIsEditOpen(true);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 action-bar">
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
            disabled={normalizedLearners.length === 0}
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
              <TabsTrigger value="balances" className="rounded-md px-4 h-full font-bold text-sm text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                Fee Records ({filteredCalculatedFees.length})
              </TabsTrigger>
              <TabsTrigger value="ledger" className="rounded-md px-4 h-full font-bold text-sm text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                Transaction Ledger
              </TabsTrigger>
              <TabsTrigger value="audit" className="rounded-md px-4 h-full font-bold text-sm text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                Audit Trail
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
            disabled={statementExport.isDownloading}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg h-10 px-4 text-sm font-medium shadow-sm gap-2 transition-all disabled:opacity-60"
          >
            {statementExport.isDownloading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <FileDown size={16} />
            )}
            Download Fee Statement
          </Button>
        </div>

        {/* Fee Records Table — Fully dynamic from Learners Management */}
        <TabsContent value="balances" className="m-0">
          {normalizedLearners.length === 0 ? (
            <Card className="rounded-xl bg-white border border-slate-200/80 shadow-sm p-12 text-center">
              <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
                <div className="p-4 bg-amber-50 rounded-full">
                  <Database className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No Learners Found</h3>
                <p className="text-sm text-slate-500">
                  No learners are currently registered. Please add learners in the 
                  <strong className="text-slate-800"> Learners Management </strong> 
                  section first, then return here to manage their fee records.
                </p>
              </div>
            </Card>
          ) : (
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
                            <p className="text-xs text-slate-400">
                              Adm No: {fee.admNo} • {fee.grade} {fee.stream ? `• ${fee.stream}` : ''}
                            </p>
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
                            <div className="flex justify-end gap-1 no-print">
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
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50" 
                                onClick={() => handleOpenEditModal(fee)}
                                title="Edit Fee Record"
                              >
                                <Edit size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">
                          No learners match the selected grade filter. Try selecting "All Grade Levels".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
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
                      No transactions recorded yet. Click "Record Payment" to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="m-0">
          <Card className="rounded-xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Fee Modification Audit Trail</h3>
              <Badge variant="outline" className="text-xs font-medium">Immutable Log</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Changes</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-slate-600">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-700">{log.admin}</td>
                        <td className="px-5 py-3">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900">{log.studentName}</td>
                        <td className="px-5 py-3 text-slate-600 max-w-xs">
                          {log.changes.map(c => `${c.field}: ${c.oldValue} → ${c.newValue}`).join("; ")}
                        </td>
                        <td className="px-5 py-3 text-slate-500 italic max-w-xs truncate">{log.reason}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <FileText size={32} className="text-slate-200" />
                          <p className="font-medium">No fee modifications recorded yet.</p>
                          <p className="text-xs">Audit entries will appear here when admin edits fee records.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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

      {/* Record Payment Modal with Cascading Dropdowns - Now using real learners */}
      <RecordPaymentModal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        onSubmitPayment={handleRecordPayment}
        gradesData={GRADES_DATA}
        studentsData={normalizedLearners}
      />

      {/* ── Receipt Modal (shown after each successful payment) ── */}
      {lastTransaction && activeStudent && (
        <Modal
          isOpen={isReceiptOpen}
          onClose={() => { setIsReceiptOpen(false); setActiveStudent(null); setLastTransaction(null); }}
          title="Payment Receipt"
          description={`Receipt ${lastTransaction.id} — ${lastTransaction.method}`}
          maxWidth="max-w-xl"
        >
          <FeeReceipt
            student={activeStudent}
            transaction={lastTransaction}
            year={selectedYear}
            term={selectedTerm}
            onDownload={() => { setIsReceiptOpen(false); }}
          />
        </Modal>
      )}

      {/* Edit Fee Modal */}
      <EditFeeModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setActiveStudent(null); }}
        student={activeStudent}
        onSave={handleEditFee}
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