"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { CreditCard, ArrowUpRight, Save, Eye, FileDown, Calculator, Loader2, Lock, AlertCircle, ShieldCheck, FileText, Edit, Database } from 'lucide-react';
import { GRADES_DATA } from '@/lib/mock-data';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from "@/lib/utils";
import { useFileDownload } from '@/utils/fileDownloader';
import { notifyDataChanged, readStorage } from '@/utils/storage';

// Dynamic data hooks
import { useStudentsStore, useTransactionsStore } from '@/hooks/usePersistentStorage';

// Sub-components
import FeeStats from '@/components/fees/FeeStats';
import FeeFilters from '@/components/fees/FeeFilters';
import FeeStatement from '@/components/fees/FeeStatement';
import LearnerFeePaymentModal from '@/components/fees/LearnerFeePaymentModal';
import EditFeeModal from '@/components/fees/EditFeeModal';
import FeeReceipt from '@/components/fees/FeeReceipt';
import { Transaction, PaymentMethod, PaymentDetails } from '@/types/fees';

// Storage keys
const TX_KEY = 'munyaka_transactions';
const FEE_STRUCT_KEY = 'munyaka_fee_structures';
const FEE_OVERRIDES_KEY_PREFIX = 'munyaka_fee_';
const AUDIT_LOGS_KEY = 'munyaka_fee_audit_logs';

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface FeeRecord {
  id: string;
  student: string;
  total: number;
  paid: number;
  balance: number;
  status: 'Cleared' | 'Partial' | 'Pending';
  admNo: string;
  grade: string;
  stream: string;
  studentGradeId?: string;
}

// Grade level options for filter
const GRADE_LEVEL_OPTIONS = [
  { value: "all", label: "All Grade Levels" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: `${i + 1}`,
    label: `Grade ${i + 1}`,
  })),
];

// ─── Helper Functions ────────────────────────────────────────────────────────

/** Get normalized match key for grade (e.g. "Grade 4" -> "grade4") */
const getGradeMatchKey = (name: string): string => {
  if (!name) return '';
  const trimmed = String(name || '').trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (lower === 'pp1' || lower === 'pp2') return lower;
  const digitMatch = lower.match(/(\d+)/);
  if (digitMatch) return `grade${digitMatch[1]}`;
  return lower.replace(/\s+/g, '');
};

/** Normalize grade name to title case */
const normalizeGradeName = (name: string): string => {
  if (!name) return '';
  const trimmed = String(name || '').trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

/** Normalize stream name to title case */
const normalizeStreamName = (name: string): string => {
  if (!name) return '';
  const trimmed = String(name || '').trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

/** Read academic year/term from User Settings */
const readAcademicContext = (): { year: string; term: string } => {
  try {
    const raw = localStorage.getItem('munyaka_user_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      const year = parsed?.academic?.activeYear;
      const term = parsed?.academic?.activeTerm;
      if (year && term) return { year: String(year), term: String(term) };
    }
  } catch (e) {
    console.error('Failed to read academic context:', e);
  }
  return { year: new Date().getFullYear().toString(), term: 'term1' };
};

/** Derive the most appropriate default year from fee structures */
const deriveDefaultYear = (): string => {
  try {
    const raw = localStorage.getItem(FEE_STRUCT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const years = Array.from(
          new Set(parsed.map((f: any) => String(f.year)))
        ).sort((a: any, b: any) => (a < b ? 1 : -1));
        if (years[0]) return String(years[0]);
      }
    }
  } catch (e) {
    // ignore
  }
  return readAcademicContext().year;
};

// ─── Main Component ──────────────────────────────────────────────────────────

const Fees = () => {
  const currentYear = new Date().getFullYear().toString();
  
  // ── Dynamic data from hooks ────────────────────────────────────────────────
  const { state: studentsFromHook } = useStudentsStore();
  const { state: transactionsFromHook } = useTransactionsStore();

  // Direct Data Hydration Hook for Learners DB
  const [learners, setLearners] = useState<any[]>(() => {
    const keys = ['munyaka_learners_db', 'school_learners_data', 'munyaka_students', 'students', 'learners'];
    for (const key of keys) {
      const storedRaw = localStorage.getItem(key);
      if (storedRaw) {
        try {
          const parsed = JSON.parse(storedRaw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          console.error(`Failed to parse ${key}`, e);
        }
      }
    }
    return [];
  });

  useEffect(() => {
    const loadRoster = () => {
      const keys = ['munyaka_learners_db', 'school_learners_data', 'munyaka_students', 'students', 'learners'];
      for (const key of keys) {
        const storedRaw = localStorage.getItem(key);
        if (storedRaw) {
          try {
            const parsed = JSON.parse(storedRaw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setLearners(parsed);
              return;
            }
          } catch (e) {
            console.error(`Failed to parse ${key}`, e);
          }
        }
      }
      if (studentsFromHook && studentsFromHook.length > 0) {
        setLearners(studentsFromHook);
      }
    };

    loadRoster();
    window.addEventListener('storage', loadRoster);
    window.addEventListener('munyaka:data-changed', loadRoster);
    window.addEventListener('munyaka_learners_updated', loadRoster);
    return () => {
      window.removeEventListener('storage', loadRoster);
      window.removeEventListener('munyaka:data-changed', loadRoster);
      window.removeEventListener('munyaka_learners_updated', loadRoster);
    };
  }, [studentsFromHook]);
  
  // Normalize students from hook or direct learners DB to match Learner interface
  const studentsFromStore: Learner[] = useMemo(() => {
    const activeList = learners.length > 0 ? learners : studentsFromHook;
    return activeList.map(s => ({
      id: s.id || s.admNo || s.admissionNo || '',
      admNo: s.admNo || s.admissionNo || s.id || '',
      name: s.fullName || s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown',
      grade: normalizeGradeName(s.grade || ''),
      stream: normalizeStreamName(s.stream || ''),
      gender: (s.gender as 'Male' | 'Female' | 'Other') || 'Other',
      guardian: s.guardian || s.parentName || '',
      phone: s.phone || s.parentPhone || '',
    }));
  }, [learners, studentsFromHook]);
  
  // Normalize transactions from hook to ExtendedTransaction
  const transactionsFromStore: ExtendedTransaction[] = useMemo(() => {
    return transactionsFromHook.map(tx => ({
      id: tx.id || '',
      date: tx.date || new Date().toISOString().slice(0, 10),
      amount: tx.amount || tx.paid || 0,
      method: tx.method || 'cash',
      ref: tx.ref || '',
      category: tx.category || 'Payment',
      studentId: tx.studentId || '',
      grade: String(tx.grade || ''),
      stream: String(tx.stream || ''),
      paymentMethod: (tx.method as PaymentMethod) || 'cash',
      paymentDetails: tx as unknown as PaymentDetails,
    }));
  }, [transactionsFromHook]);
  
  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedYear, setSelectedYear] = useState(() => deriveDefaultYear() || currentYear);
  const [selectedTerm, setSelectedTerm] = useState(() => readAcademicContext().term || "term1");
  const activeAcademicYear = selectedYear || "2026";
  const activeTerm = selectedTerm || "term1";
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [tabGradeFilter, setTabGradeFilter] = useState<string>("ALL");

  // Fee structures (managed locally with persistence)
  const [feeStructures, setFeeStructures] = useState<any[]>(() => {
    return readStorage<any[]>(FEE_STRUCT_KEY, []);
  });
  
  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    return readStorage<AuditLogEntry[]>(AUDIT_LOGS_KEY, []);
  });

  // Combined transactions: hook data + localStorage data
  const [localTransactions, setLocalTransactions] = useState<ExtendedTransaction[]>(() => {
    return readStorage<ExtendedTransaction[]>(TX_KEY, []);
  });
  
  // Merge hook transactions with local transactions (deduplicate by id)
  const transactionsList: ExtendedTransaction[] = useMemo(() => {
    const localIds = new Set(localTransactions.map(tx => tx.id));
    const hookOnly = transactionsFromStore.filter(tx => !localIds.has(tx.id));
    return [...localTransactions, ...hookOnly];
  }, [localTransactions, transactionsFromStore]);

  // Modal & Async States
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<ExtendedTransaction | null>(null);

  // Admin Auth States for Set Term Fees
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Config States
  const [configGrade, setConfigGrade] = useState<string>("all");
  const [configAmount, setConfigAmount] = useState<string>("");

  // File download state
  const statementExport = useFileDownload();

  // ── Data persistence effects ───────────────────────────────────────────────
  
  useEffect(() => {
    localStorage.setItem(FEE_STRUCT_KEY, JSON.stringify(feeStructures));
    notifyDataChanged(FEE_STRUCT_KEY);
  }, [feeStructures]);

  useEffect(() => {
    localStorage.setItem(TX_KEY, JSON.stringify(localTransactions));
    notifyDataChanged(TX_KEY);
  }, [localTransactions]);

  useEffect(() => {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(auditLogs));
    notifyDataChanged(AUDIT_LOGS_KEY);
  }, [auditLogs]);

  // Listen for data update events from other components
  useEffect(() => {
    const handleFeesUpdated = () => {
      // Refresh local transactions
      const savedTransactions = localStorage.getItem(TX_KEY);
      if (savedTransactions) {
        try {
          setLocalTransactions(JSON.parse(savedTransactions));
        } catch (e) {
          console.error("Failed to refresh transactions:", e);
        }
      }
      
      // Refresh fee structures
      const savedStructures = localStorage.getItem(FEE_STRUCT_KEY);
      if (savedStructures) {
        try {
          setFeeStructures(JSON.parse(savedStructures));
        } catch (e) {
          console.error("Failed to refresh fee structures:", e);
        }
      }
      
      // Refresh audit logs
      const savedAuditLogs = localStorage.getItem(AUDIT_LOGS_KEY);
      if (savedAuditLogs) {
        try {
          setAuditLogs(JSON.parse(savedAuditLogs));
        } catch (e) {
          console.error("Failed to refresh audit logs:", e);
        }
      }
    };

    const handleDataChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const key = detail?.key as string | undefined;
      if (
        !key ||
        key === TX_KEY ||
        key === FEE_STRUCT_KEY ||
        key === AUDIT_LOGS_KEY ||
        key.startsWith(FEE_OVERRIDES_KEY_PREFIX)
      ) {
        handleFeesUpdated();
      }
    };

    window.addEventListener('munyaka_fees_updated', handleFeesUpdated);
    window.addEventListener('munyaka:data-changed', handleDataChanged);
    return () => {
      window.removeEventListener('munyaka_fees_updated', handleFeesUpdated);
      window.removeEventListener('munyaka:data-changed', handleDataChanged);
    };
  }, []);

  // ── Dynamic fee calculations ───────────────────────────────────────────────
  
  /** Get term fee for a specific grade with fallback to ALL / bulk */
  const getTermFeeForGrade = useCallback((gradeId: string): number => {
    // 1. Check exact grade configuration in state
    const exact = feeStructures.find(f =>
      f.year === selectedYear && f.term === selectedTerm && f.gradeId === gradeId
    );
    if (exact && exact.amount > 0) return exact.amount;

    // 2. Check munyaka_fee_structures_db in localStorage for exact grade or ALL
    try {
      const raw = localStorage.getItem('munyaka_fee_structures_db');
      if (raw) {
        const structuresMap = JSON.parse(raw);
        const exactKey = `${selectedYear}_${selectedTerm}_${gradeId}`;
        if (structuresMap[exactKey] !== undefined) {
          return Number(structuresMap[exactKey]);
        }
        const bulkKey = `${selectedYear}_${selectedTerm}_ALL`;
        if (structuresMap[bulkKey] !== undefined) {
          return Number(structuresMap[bulkKey]);
        }
      }
    } catch {}

    // 3. Fallback to ALL in feeStructures state
    const bulkConfig = feeStructures.find(f =>
      f.year === selectedYear && f.term === selectedTerm && (f.gradeId === "ALL" || f.gradeId === "all")
    );
    if (bulkConfig && bulkConfig.amount > 0) return bulkConfig.amount;

    return exact ? exact.amount : 0;
  }, [selectedYear, selectedTerm, feeStructures]);

  /** Calculate total paid for a student from transactions and direct localStorage overrides */
  const getTotalPaidForStudent = useCallback((studentId: string): number => {
    // Check if there's a direct override in localStorage (munyaka_fee_{id})
    try {
      const overrideKey = `${FEE_OVERRIDES_KEY_PREFIX}${studentId}`;
      const savedOverride = localStorage.getItem(overrideKey);
      if (savedOverride) {
        const parsed = JSON.parse(savedOverride);
        if (parsed.feePaid !== undefined) {
          return Number(parsed.feePaid);
        }
        if (parsed.paid !== undefined) {
          return Number(parsed.paid);
        }
      }
    } catch {}

    // Fall back to summing transactions plus any direct absolute override in transactions
    const studentTxs = transactionsList.filter(tx => tx.studentId === studentId);
    const directEditTx = studentTxs.find(tx => tx.category === 'Direct Edit' || tx.method === 'Admin Direct Override');
    if (directEditTx) {
      return Number(directEditTx.amount || 0);
    }

    return studentTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [transactionsList]);

  /** Find grade ID matching a learner's grade name */
  const findGradeIdForLearner = useCallback((learnerGrade: string): string => {
    const matchKey = getGradeMatchKey(learnerGrade);
    const found = GRADES_DATA.find(g => getGradeMatchKey(g.name) === matchKey);
    return found ? found.id : '';
  }, []);

  /** Derive status based on balance and paid amount */
  const deriveStatus = useCallback((termFee: number, feePaid: number): 'Cleared' | 'Partial' | 'Pending' => {
    const balance = Math.max(0, termFee - feePaid);
    if (balance <= 0) return 'Cleared';
    if (feePaid > 0) return 'Partial';
    return 'Pending';
  }, []);

  /** Build fee records dynamically from students */
  const calculatedFees: FeeRecord[] = useMemo(() => {
    try {
      const rawLearners = JSON.parse(localStorage.getItem('munyaka_learners_db') || '[]');
      const allLearners = Array.isArray(rawLearners) && rawLearners.length > 0 ? rawLearners : studentsFromStore;

      return allLearners.map((learner: any) => {
        const studentId = learner.id || learner.admNo || String(Math.random());
        const studentName = learner.fullName || learner.name || `${learner.firstName || ''} ${learner.lastName || ''}`.trim() || 'Learner';
        const admNo = learner.admissionNo || learner.admNo || learner.admissionNumber || studentId;
        const grade = learner.grade || '';
        const stream = learner.stream || '';
        const studentGradeId = findGradeIdForLearner(grade);

        const termFee = studentGradeId ? getTermFeeForGrade(studentGradeId) : Number(learner.termFee || 5000);
        const totalPaid = getTotalPaidForStudent(studentId);
        const balance = Math.max(0, termFee - totalPaid);
        const status = deriveStatus(termFee, totalPaid);

        return {
          id: studentId,
          student: studentName,
          total: termFee,
          paid: totalPaid,
          balance,
          status,
          admNo,
          grade,
          stream,
          studentGradeId,
        };
      });
    } catch (err) {
      console.error("Failed to compute calculatedFees from munyaka_learners_db:", err);
      return [];
    }
  }, [studentsFromStore, getTotalPaidForStudent, getTermFeeForGrade, findGradeIdForLearner, selectedYear, selectedTerm]);

  /** Filter fee records by grade level */
  const filteredCalculatedFees: FeeRecord[] = useMemo(() => {
    let rawLearners = [];
    try {
      rawLearners = JSON.parse(localStorage.getItem('munyaka_learners_db') || '[]');
    } catch {}

    if (!selectedGrade || selectedGrade === "all" || selectedGrade === "ALL" || selectedGrade === "") {
      return calculatedFees;
    }
    return calculatedFees.filter(fee => {
      const feeGradeKey = getGradeMatchKey(fee.grade);
      const filterKey = getGradeMatchKey(selectedGrade);
      return feeGradeKey === filterKey || fee.studentGradeId === selectedGrade || fee.grade?.toLowerCase().trim() === selectedGrade?.toLowerCase().trim();
    });
  }, [calculatedFees, selectedGrade]);

  /** Filter transactions by grade level */
  const filteredTransactions: ExtendedTransaction[] = useMemo(() => {
    if (tabGradeFilter === "all") return transactionsList;
    return transactionsList.filter(tx => {
      if (tx.grade) {
        return getGradeMatchKey(tx.grade) === getGradeMatchKey(tabGradeFilter);
      }
      return true;
    });
  }, [transactionsList, tabGradeFilter]);

  /** Calculate summary stats */
  const stats = useMemo(() => {
    const totalPossible = filteredCalculatedFees.reduce((sum, fee) => sum + fee.total, 0);
    const totalCollected = filteredCalculatedFees.reduce((sum, fee) => sum + fee.paid, 0);
    return { 
      totalPossible, 
      totalCollected, 
      totalPending: Math.max(0, totalPossible - totalCollected) 
    };
  }, [filteredCalculatedFees]);

  /** Current term fee for selected grade with comprehensive fallback */
  const currentTermFee = useMemo(() => {
    return getTermFeeForGrade(selectedGrade);
  }, [selectedGrade, getTermFeeForGrade]);

  // ── Event Handlers ─────────────────────────────────────────────────────────
  
  const handleDownloadFeeStatement = async () => {
    const activeGradeLabel = GRADE_LEVEL_OPTIONS.find(o => o.value === tabGradeFilter)?.label || "Selected Grade";
    const filename = `fee_statement_${activeGradeLabel.replace(/\s+/g, '_')}_${selectedTerm}_${new Date().toISOString().slice(0, 10)}.csv`;
    
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

  const handleOpenAuthModal = () => {
    setAuthPassword("");
    setAuthError("");
    setIsAuthOpen(true);
  };

  const handleVerifyAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!String(authPassword || '').trim()) {
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

    // Get all grades from GRADES_DATA
    const allGradeIds = GRADES_DATA.map(g => g.id);
    const isBulk = configGrade === "all" || configGrade === "ALL" || configGrade === "All Grades (Bulk Set)";

    // Build unified fee structures database map: `${year}_${term}_${gradeId}` -> amount
    const existingStructuresRaw = localStorage.getItem('munyaka_fee_structures_db');
    let structuresMap: Record<string, number> = {};
    try {
      if (existingStructuresRaw) {
        structuresMap = JSON.parse(existingStructuresRaw) || {};
      }
    } catch {}

    const targetGrades = isBulk ? allGradeIds : [configGrade];

    setFeeStructures(prev => {
      let updated = [...prev];
      targetGrades.forEach(gradeId => {
        const idx = updated.findIndex(f => f.year === selectedYear && f.term === selectedTerm && f.gradeId === gradeId);
        if (idx > -1) {
          updated[idx] = { ...updated[idx], amount: amountNum };
        } else {
          updated.push({ year: selectedYear, term: selectedTerm, gradeId, amount: amountNum });
        }
        structuresMap[`${selectedYear}_${selectedTerm}_${gradeId}`] = amountNum;
      });

      if (isBulk) {
        structuresMap[`${selectedYear}_${selectedTerm}_ALL`] = amountNum;
        // Also ensure ALL is present in feeStructures array if needed
        const allIdx = updated.findIndex(f => f.year === selectedYear && f.term === selectedTerm && (f.gradeId === "ALL" || f.gradeId === "all"));
        if (allIdx > -1) {
          updated[allIdx] = { ...updated[allIdx], amount: amountNum };
        } else {
          updated.push({ year: selectedYear, term: selectedTerm, gradeId: "ALL", amount: amountNum });
        }
      }

      localStorage.setItem('munyaka_fee_structures_db', JSON.stringify(structuresMap));
      localStorage.setItem('munyaka_fee_structures', JSON.stringify(updated));
      return updated;
    });

    // Also update existing student ledger balances in munyaka_learners_db matching those grades / terms
    try {
      const learnersRaw = localStorage.getItem('munyaka_learners_db');
      if (learnersRaw) {
        const learners = JSON.parse(learnersRaw);
        if (Array.isArray(learners)) {
          let updatedLearners = learners.map((learner: any) => {
            const learnerGradeId = learner.gradeId || learner.grade;
            const matchesGrade = isBulk || targetGrades.includes(learnerGradeId);
            if (matchesGrade) {
              // Update fee structure or total term fee in learner record if applicable
              const ledgers = Array.isArray(learner.feeHistory) ? [...learner.feeHistory] : [];
              const termLedgerIdx = ledgers.findIndex((l: any) => l.year === selectedYear && l.term === selectedTerm);
              if (termLedgerIdx > -1) {
                ledgers[termLedgerIdx] = {
                  ...ledgers[termLedgerIdx],
                  totalFee: amountNum,
                };
              } else {
                ledgers.push({
                  year: selectedYear,
                  term: selectedTerm,
                  totalFee: amountNum,
                  paid: 0,
                  balance: amountNum,
                });
              }
              return {
                ...learner,
                feeHistory: ledgers,
                termFee: amountNum,
              };
            }
            return learner;
          });
          localStorage.setItem('munyaka_learners_db', JSON.stringify(updatedLearners));
        }
      }
    } catch (err) {
      console.error("Failed to update student ledger balances for fee structure change:", err);
    }

    // Trigger global update events and data rehydration
    window.dispatchEvent(new Event('fees-updated'));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key: 'munyaka_fee_structures_db' } }));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
    window.dispatchEvent(new CustomEvent('storage', { detail: { key: 'munyaka_fee_structures_db' } } as any));

    setIsConfigOpen(false);
    const targetLabel = isBulk ? "all grade levels" : GRADES_DATA.find(g => g.id === configGrade)?.name || configGrade;
    showSuccess(`Successfully set term fee to KES ${amountNum.toLocaleString()} for ${targetLabel} (${selectedTerm}, ${selectedYear})!`);
  };

  const handleRecordPayment = (result: { transaction: Transaction; activationKey?: string; issuedTo?: string; deviceId?: string; expiresAt?: string } | Transaction) => {
    const tx = 'transaction' in result ? result.transaction : result;
    const matchedLearner = studentsFromStore.find(l => l.id === tx.studentId);
    const studentName = matchedLearner ? matchedLearner.name : "Learner";
    const studentGrade = matchedLearner ? matchedLearner.grade : tx.grade ?? "";

    const enrichedTx: ExtendedTransaction = {
      ...tx,
      grade: studentGrade,
    };

    // Persist to local transactions
    const nextList = [enrichedTx, ...localTransactions];
    setLocalTransactions(nextList);

    // Update per-student override for immediate balance update
    try {
      const overrideKey = `${FEE_OVERRIDES_KEY_PREFIX}${tx.studentId}`;
      const prevOverride = localStorage.getItem(overrideKey);
      let prevPaid = 0;
      if (prevOverride) {
        const parsed = JSON.parse(prevOverride);
        prevPaid = parsed.feePaid ?? parsed.paid ?? 0;
      }
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
      const status = deriveStatus(total, newPaid);
      localStorage.setItem(overrideKey, JSON.stringify({
        id: tx.studentId,
        termFee: total,
        feePaid: newPaid,
        balance,
        status,
        reason: `Auto-update from ${tx.method} payment ${tx.id}`,
      }));
      notifyDataChanged(overrideKey);
    } catch (e) {
      console.error('Failed to update student fee override:', e);
    }

    // Add audit log entry
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

    // Build receipt student record
    const receiptFee = calculatedFees.find(f => f.id === tx.studentId);
    const receiptStudent = {
      student: studentName,
      admNo: matchedLearner?.admNo ?? matchedLearner?.id ?? tx.studentId ?? '',
      grade: matchedLearner?.grade ?? tx.grade ?? '',
      stream: matchedLearner?.stream ?? tx.stream ?? '',
      total: receiptFee?.total ?? 0,
      paid: (receiptFee?.paid ?? 0) + tx.amount,
      balance: Math.max(0, (receiptFee?.total ?? 0) - ((receiptFee?.paid ?? 0) + tx.amount)),
      status: receiptFee?.status ?? 'Partial',
    };

    setActiveStudent(receiptStudent);
    setLastTransaction(enrichedTx);
    setIsReceiptOpen(true);

    showSuccess(`KES ${tx.amount.toLocaleString()} ${tx.method} payment recorded for ${studentName}.`);
  };

  const handleEditFee = (studentId: string, termFee: number, feePaid: number, reason: string) => {
    const matchedLearner = studentsFromStore.find(l => l.id === studentId);
    const studentName = matchedLearner ? matchedLearner.name : "Unknown Learner";
    const studentGrade = matchedLearner ? matchedLearner.grade : "";

    // Read current fee record
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

    // Calculate new status & balance instantly
    const balance = Math.max(0, termFee - feePaid);
    const status = deriveStatus(termFee, feePaid);

    // Save override to LocalStorage permanently
    const overrideData = {
      id: studentId,
      termFee,
      feePaid,
      balance,
      status,
      reason,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(overrideData));
    notifyDataChanged(storageKey);

    // Also update munyaka_fees and munyaka_payments in localStorage
    const paymentStorageKeys = ['munyaka_fees_records', 'munyaka_fees', 'munyaka_payments'];
    paymentStorageKeys.forEach(key => {
      try {
        const savedRecords = localStorage.getItem(key);
        if (savedRecords) {
          const records = JSON.parse(savedRecords);
          if (Array.isArray(records)) {
            const updatedRecords = records.map((r: any) => {
              if (r.id === studentId || r.studentId === studentId) {
                return { ...r, total: termFee, paid: feePaid, feePaid, status, balance };
              }
              return r;
            });
            localStorage.setItem(key, JSON.stringify(updatedRecords));
            notifyDataChanged(key);
          }
        } else {
          // Initialize if absent
          localStorage.setItem(key, JSON.stringify([{ id: studentId, student: studentName, total: termFee, paid: feePaid, feePaid, balance, status }]));
        }
      } catch (e) {
        console.error(`Failed to update ${key}:`, e);
      }
    });

    // Set/Replace absolute direct edit transaction in ledger so future recalculations respect feePaid directly without old ledger logs overwriting it
    const txKey = 'munyaka_transactions';
    const savedTxs = localStorage.getItem(txKey);
    let txs = [];
    try {
      if (savedTxs) txs = JSON.parse(savedTxs);
    } catch {}

    const directEditTx = {
      id: `TX-ADJ-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      amount: feePaid,
      method: "Admin Direct Override",
      ref: `OVERRIDE-${Date.now().toString().slice(-6)}`,
      category: "Direct Edit",
      studentId,
      grade: studentGrade,
    };

    const filteredTxs = txs.filter((t: any) => t.studentId !== studentId || t.category !== 'Direct Edit');
    const newTxs = [directEditTx, ...filteredTxs];
    localStorage.setItem(txKey, JSON.stringify(newTxs));
    setLocalTransactions(newTxs as any);
    notifyDataChanged(txKey);

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
        { field: "Status", oldValue: deriveStatus(oldTotal, oldPaid), newValue: status },
      ],
      reason: reason || "No reason provided"
    };

    const newAuditLogs = [auditEntry, ...auditLogs];
    setAuditLogs(newAuditLogs);

    window.dispatchEvent(new Event('munyaka_fees_updated'));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key: storageKey } }));

    showSuccess(`Fee record updated for ${studentName}. Status updated to ${status}.`);
  };

  const handleOpenEditModal = (fee: FeeRecord) => {
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-3 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* Page Header - stacks on mobile */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 action-bar w-full max-w-full">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 whitespace-normal break-words">Finance & Fees</h1>
          <p className="text-sm text-slate-500 break-words hyphens-auto">Manage fee structures and student account ledgers.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="h-10 px-4 rounded-lg border-slate-200 bg-white text-sm font-medium gap-2 text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
            onClick={handleOpenAuthModal}
          >
            <Lock size={15} className="text-slate-400" /> Set Term Fees
          </Button>
          <Button
            className="h-10 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium gap-2 shadow-sm w-full sm:w-auto"
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

      {/* Summary Metrics */}
      <FeeStats 
        currentTermFee={currentTermFee} 
        totalCollected={stats.totalCollected} 
        totalPossible={stats.totalPossible} 
        totalPending={stats.totalPending} 
      />

      {/* Navigation Tabs & Header Actions - stacks on mobile */}
      <Tabs defaultValue="balances" className="w-full max-w-full overflow-x-hidden space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full max-w-full">
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
            {/* Removed redundant dropdown as requested */}
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

        {/* Fee Records Table */}
        <TabsContent value="balances" className="m-0">
          {(studentsFromStore.length === 0 && learners.length === 0) ? (
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
          ) : filteredCalculatedFees.length === 0 ? (
            <Card className="rounded-xl bg-white border border-slate-200/80 shadow-sm p-12 text-center">
              <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
                <div className="p-4 bg-slate-50 rounded-full">
                  <FileText className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No Fee Records Found</h3>
                <p className="text-sm text-slate-500">
                  No learners match the selected grade filter "{GRADE_LEVEL_OPTIONS.find(o => o.value === tabGradeFilter)?.label || tabGradeFilter}". 
                  Try selecting "All Grade Levels" to view all records.
                </p>
              </div>
            </Card>
          ) : (
            <Card className="rounded-xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[220px] w-1/3">Student Details</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Term Fee</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee Paid</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCalculatedFees.map((fee) => (
                      <tr key={fee.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-4 py-2.5 min-w-[220px]">
                          <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">{fee.student}</p>
                          <p className="text-xs text-slate-500 leading-tight">
                            Adm No: {fee.admNo} • {fee.grade} {fee.stream ? `• ${fee.stream}` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-2.5 text-center text-sm font-medium text-slate-600">KES {fee.total.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-center text-sm font-semibold text-emerald-600">KES {fee.paid.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-center text-sm font-semibold">
                          <span className={fee.balance > 0 ? "text-rose-600" : "text-slate-400"}>
                            {fee.balance > 0 ? `KES ${fee.balance.toLocaleString()}` : "CLEARED"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge className={cn("rounded-md border-none px-2.5 py-0.5 text-xs font-medium",
                            fee.status === 'Cleared' ? "bg-emerald-50 text-emerald-700" :
                            fee.status === 'Partial' ? "bg-amber-50 text-amber-700" :
                            "bg-slate-100 text-slate-600"
                          )}>
                            {fee.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right">
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
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Transaction Ledger Table */}
        <TabsContent value="ledger" className="m-0">
          <Card className="rounded-xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-max">
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
                    <td colSpan={4} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
                        <div className="p-3 bg-slate-100 rounded-full">
                          <Database className="w-7 h-7 text-slate-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">No posted records found</p>
                        <p className="text-xs text-slate-400">
                          {tabGradeFilter !== "all"
                            ? `No payments have been posted for ${GRADE_LEVEL_OPTIONS.find(o => o.value === tabGradeFilter)?.label || "this grade"} in ${selectedTerm} ${selectedYear}.`
                            : `No payments have been posted for ${selectedTerm} ${selectedYear} yet.`}
                        </p>
                        {studentsFromStore.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsRecordOpen(true)}
                            className="mt-2 rounded-lg h-9 px-4 text-xs font-semibold gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                          >
                            <CreditCard size={13} /> Record First Payment
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
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

      {/* Admin Verification Modal */}
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

      {/* Record Payment Modal */}
      <LearnerFeePaymentModal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        initialGrade={selectedGrade !== "all" ? selectedGrade : undefined}
        initialTerm={selectedTerm}
        initialYear={selectedYear}
        onSubmitPayment={(transaction) => {
          setIsRecordOpen(false);
          setLocalTransactions(readStorage<ExtendedTransaction[]>(TX_KEY, []));
          setAuditLogs(readStorage<AuditLogEntry[]>(AUDIT_LOGS_KEY, []));
          if (typeof handleRecordPayment === 'function') {
            try { handleRecordPayment(transaction); } catch {}
          }
        }}
        activeAcademicYear={activeAcademicYear}
        activeTerm={activeTerm}
      />

      {/* Receipt Modal */}
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
