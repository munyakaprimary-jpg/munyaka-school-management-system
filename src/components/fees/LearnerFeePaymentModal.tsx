"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAcademicCalendar } from "@/hooks/useAcademicCalendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import {
  CreditCard,
  AlertCircle,
  Banknote,
  Landmark,
  Smartphone,
  Receipt,
  Calendar,
  Search,
  Filter,
} from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { PaymentMethod, Transaction } from '@/types/fees';

interface Learner {
  id: string;
  admNo?: string;
  name: string;
  grade?: string;
  stream?: string;
  gender?: string;
  guardian?: string;
  phone?: string;
}

interface StreamItem {
  id: string;
  name: string;
}

interface GradeItem {
  id: string;
  name: string;
  streams: StreamItem[];
}

export interface LearnerFeePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPayment: (transaction: Transaction) => void;
  activeAcademicYear?: string;
  activeTerm?: string;
  initialGrade?: string;
  initialTerm?: string;
  initialYear?: string;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { value: 'cash',   label: 'Cash',                icon: Banknote,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { value: 'bank',   label: 'Bank Transfer / EFT', icon: Landmark,   color: 'text-blue-600',    bg: 'bg-blue-50' },
  { value: 'cheque', label: 'Cheque',              icon: Receipt,    color: 'text-amber-600',   bg: 'bg-amber-50' },
  { value: 'mpesa',  label: 'M-Pesa',              icon: Smartphone, color: 'text-violet-600',  bg: 'bg-violet-50' },
];

const FEE_CATEGORIES = [
  "Tuition Fee",
  "Activity Fee",
  "Boarding Fee",
  "Transport Fee",
  "Uniform & Books",
  "Development Fund",
  "Examination Fee",
  "Other Fee",
];

const DEFAULT_GRADES: GradeItem[] = [
  { id: "playgroup", name: "Playgroup", streams: [{ id: "yellow", name: "Yellow" }, { id: "blue", name: "Blue" }] },
  { id: "pp1", name: "PP1", streams: [{ id: "yellow", name: "Yellow" }, { id: "blue", name: "Blue" }, { id: "red", name: "Red" }] },
  { id: "pp2", name: "PP2", streams: [{ id: "yellow", name: "Yellow" }, { id: "blue", name: "Blue" }, { id: "red", name: "Red" }] },
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `grade${i + 1}`,
    name: `Grade ${i + 1}`,
    streams: [
      { id: `${i + 1}-yellow`, name: "Yellow" },
      { id: `${i + 1}-blue`, name: "Blue" },
      { id: `${i + 1}-red`, name: "Red" },
      { id: `${i + 1}-green`, name: "Green" },
    ],
  })),
];

const LEARNER_STORAGE_KEYS = [
  'munyaka_learners_db',
  'school_learners_data',
  'munyaka_students',
  'students',
  'learners',
  'pupils',
  'school_students',
  'registered_students',
  'munyaka_registered_students',
];

const LearnerFeePaymentModal: React.FC<LearnerFeePaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmitPayment,
  activeAcademicYear,
  activeTerm,
  initialGrade,
  initialTerm,
  initialYear,
}) => {
  const academicCalendar = useAcademicCalendar();

  const [academicYear, setAcademicYear] = useState<string>(() => {
    return initialYear || activeAcademicYear || academicCalendar.activeYear || new Date().getFullYear().toString();
  });
  const [term, setTerm] = useState<string>(() => {
    return initialTerm || activeTerm || academicCalendar.activeTerm || 'term1';
  });

  // Grades & Streams configuration
  const [gradesData] = useState<GradeItem[]>(() => {
    try {
      const stored = localStorage.getItem('munyaka_grades');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_GRADES;
  });

  // Filter states
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>(initialGrade || "all");
  const [selectedStreamFilter, setSelectedStreamFilter] = useState<string>("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      if (initialGrade) setSelectedGradeFilter(initialGrade);
      
      const resolvedYear = initialYear || activeAcademicYear || academicCalendar.activeYear;
      const resolvedTerm = initialTerm || activeTerm || academicCalendar.activeTerm;

      if (resolvedYear) setAcademicYear(String(resolvedYear));
      if (resolvedTerm) setTerm(String(resolvedTerm));

      try {
        const userSettingsRaw = localStorage.getItem('munyaka_user_settings');
        if (userSettingsRaw) {
          const parsed = JSON.parse(userSettingsRaw);
          if (parsed?.academic?.activeYear && !initialYear && !activeAcademicYear) {
            setAcademicYear(String(parsed.academic.activeYear));
          }
          if (parsed?.academic?.activeTerm && !initialTerm && !activeTerm) {
            setTerm(String(parsed.academic.activeTerm));
          }
        }
      } catch {}
    }
  }, [isOpen, initialGrade, initialTerm, initialYear, activeAcademicYear, activeTerm, academicCalendar.activeYear, academicCalendar.activeTerm]);

  // Payment form state
  const [feeCategory, setFeeCategory] = useState<string>("Tuition Fee");
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [refCode, setRefCode] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Learners from localStorage
  const [learnersList, setLearnersList] = useState<Learner[]>([]);

  // Load learners when modal opens
  useEffect(() => {
    if (!isOpen) return;

    try {
      const userSettingsRaw = localStorage.getItem('munyaka_user_settings');
      if (userSettingsRaw) {
        const parsed = JSON.parse(userSettingsRaw);
        if (parsed?.academic?.activeYear) setAcademicYear(String(parsed.academic.activeYear));
        if (parsed?.academic?.activeTerm) setTerm(String(parsed.academic.activeTerm));
      }
    } catch {}

    let loaded: Learner[] = [];
    for (const key of LEARNER_STORAGE_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loaded = parsed.map((item: any) => ({
              id: item.id || item.admNo || `STU-${Math.random()}`,
              admNo: item.admNo || item.id || '',
              name: item.name || item.studentName || 'Unknown Learner',
              grade: item.grade || item.gradeLevel || '',
              stream: item.stream || '',
              gender: item.gender || 'Other',
              guardian: item.guardian || item.parentName || '',
              phone: item.phone || item.parentPhone || '',
            }));
            break;
          }
        }
      } catch {}
    }
    setLearnersList(loaded);

    // Reset filters & fields
    setSelectedGradeFilter("all");
    setSelectedStreamFilter("all");
    setSelectedStudentId("");
    setSearchQuery("");
    setFeeCategory("Tuition Fee");
    setAmount("");
    setPaymentMethod('mpesa');
    setRefCode("");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setErrorMsg("");
    setIsSaving(false);
  }, [isOpen, activeAcademicYear, activeTerm]);

  // Normalization helpers
  const normalize = (val: unknown): string => {
    if (!val) return "";
    return String(val).toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  };

  const getGradeLabel = (gradeVal: string): string => {
    const found = gradesData.find(g => g.id === gradeVal || normalize(g.name) === normalize(gradeVal));
    return found ? found.name : gradeVal;
  };

  // Available streams for selected grade filter
  const availableStreamsForFilter = useMemo(() => {
    if (selectedGradeFilter === "all") {
      // Gather all unique streams across all grades
      const allStreamsSet = new Set<string>();
      gradesData.forEach(g => g.streams.forEach(s => allStreamsSet.add(s.name)));
      return Array.from(allStreamsSet).map(s => ({ id: s.toLowerCase(), name: s }));
    }
    const gradeObj = gradesData.find(g => g.id === selectedGradeFilter || normalize(g.name) === normalize(selectedGradeFilter));
    return gradeObj ? gradeObj.streams : [];
  }, [selectedGradeFilter, gradesData]);

  // Filtered learners based on Grade, Stream, and Search Query
  const filteredLearners = useMemo(() => {
    return learnersList.filter(l => {
      // Grade filter
      if (selectedGradeFilter !== "all") {
        const gradeObj = gradesData.find(g => g.id === selectedGradeFilter);
        const targetGradeName = gradeObj ? gradeObj.name : selectedGradeFilter;
        const studentGradeNorm = normalize(l.grade);
        const targetGradeNorm = normalize(targetGradeName);
        const gradeIdNorm = normalize(selectedGradeFilter);

        const matchesGrade = 
          studentGradeNorm === targetGradeNorm || 
          studentGradeNorm === gradeIdNorm ||
          studentGradeNorm.includes(targetGradeNorm) ||
          targetGradeNorm.includes(studentGradeNorm);

        if (!matchesGrade) return false;
      }

      // Stream filter
      if (selectedStreamFilter !== "all") {
        const streamObj = availableStreamsForFilter.find(s => s.id === selectedStreamFilter || normalize(s.name) === normalize(selectedStreamFilter));
        const targetStreamName = streamObj ? streamObj.name : selectedStreamFilter;
        const studentStreamNorm = normalize(l.stream);
        const targetStreamNorm = normalize(targetStreamName);

        const matchesStream = 
          studentStreamNorm === targetStreamNorm ||
          studentStreamNorm.includes(targetStreamNorm) ||
          targetStreamNorm.includes(studentStreamNorm);

        if (!matchesStream) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = 
          l.name.toLowerCase().includes(q) ||
          (l.admNo && l.admNo.toLowerCase().includes(q)) ||
          (l.grade && l.grade.toLowerCase().includes(q)) ||
          (l.stream && l.stream.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [learnersList, selectedGradeFilter, selectedStreamFilter, searchQuery, gradesData, availableStreamsForFilter]);

  const selectedLearner = useMemo(() => {
    return learnersList.find(l => l.id === selectedStudentId);
  }, [learnersList, selectedStudentId]);

  // When grade filter changes, reset stream filter & selected student if not matching
  const handleGradeFilterChange = (val: string) => {
    setSelectedGradeFilter(val);
    setSelectedStreamFilter("all");
    setSelectedStudentId("");
    setErrorMsg("");
  };

  const handleStreamFilterChange = (val: string) => {
    setSelectedStreamFilter(val);
    setSelectedStudentId("");
    setErrorMsg("");
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    setErrorMsg("");
    const student = learnersList.find(l => l.id === studentId);
    if (student) {
      // Auto-sync grade & stream filters if they were "all" or mismatched
      if (student.grade) {
        const matchedGrade = gradesData.find(g => normalize(g.name) === normalize(student.grade) || normalize(g.id) === normalize(student.grade));
        if (matchedGrade) {
          setSelectedGradeFilter(matchedGrade.id);
        }
      }
      if (student.stream) {
        const matchedStream = availableStreamsForFilter.find(s => normalize(s.name) === normalize(student.stream));
        if (matchedStream) {
          setSelectedStreamFilter(matchedStream.id);
        }
      }
    }
  };

  // Validation
  const validate = (): string => {
    if (!selectedStudentId) return "Please select a learner from the dropdown.";
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return "Please enter a valid payment amount in KES.";
    if (!paymentMethod) return "Please select a payment method.";
    if (paymentMethod === 'mpesa' && !refCode.trim()) return "Please enter the M-Pesa transaction reference code.";
    if (paymentMethod === 'bank' && !refCode.trim()) return "Please enter the bank transaction reference number.";
    if (paymentMethod === 'cheque' && !refCode.trim()) return "Please enter the cheque number / reference.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setErrorMsg(err);
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    await new Promise(r => setTimeout(r, 300));

    const learnersRaw = localStorage.getItem('munyaka_learners_db');
    const allLearners = learnersRaw ? JSON.parse(learnersRaw) : learnersList;
    const resolvedLearner = allLearners.find((l: any) => l.id === selectedStudentId || l.admNo === selectedStudentId) || selectedLearner;
    const resolvedLearnerName = resolvedLearner?.fullName || resolvedLearner?.name || `${resolvedLearner?.firstName || ''} ${resolvedLearner?.lastName || ''}`.trim() || 'Learner';
    const resolvedAdmissionNo = resolvedLearner?.admissionNo || resolvedLearner?.admNo || resolvedLearner?.admissionNumber || resolvedLearner?.id || selectedStudentId;

    const amountNum = parseFloat(amount);
    const methodLabel = PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label || paymentMethod;
    const cleanRef = refCode.trim() || `${paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`;

    const transaction: Transaction & { learnerName?: string; admNo?: string; admissionNo?: string; learnerId?: string } = {
      id: `TX-${Date.now()}`,
      date: paymentDate,
      amount: amountNum,
      method: methodLabel,
      ref: cleanRef,
      category: feeCategory,
      studentId: selectedStudentId,
      learnerId: selectedStudentId,
      learnerName: resolvedLearnerName,
      admNo: resolvedAdmissionNo,
      admissionNo: resolvedAdmissionNo,
      grade: resolvedLearner?.grade || '',
      stream: resolvedLearner?.stream || '',
      invoiceId: `INV-${academicYear}-${Date.now().toString().slice(-6)}`,
      description: `${feeCategory} — ${selectedLearner?.name || 'Learner'} (${academicYear}, ${term})`,
      currency: 'KES',
      status: 'paid',
      paymentMethod,
      paymentDetails: {
        receiptNumber: paymentMethod === 'mpesa' ? cleanRef : undefined,
        transactionRef: cleanRef,
        bankName: paymentMethod === 'bank' ? 'Bank Transfer' : undefined,
        chequeNumber: paymentMethod === 'cheque' ? cleanRef : undefined,
      },
      paidAt: paymentDate,
    };

    // Save into localStorage
    try {
      const existingTxRaw = localStorage.getItem('munyaka_transactions');
      const txList = existingTxRaw ? JSON.parse(existingTxRaw) : [];
      const updatedTxList = [transaction, ...(Array.isArray(txList) ? txList : [])];
      localStorage.setItem('munyaka_transactions', JSON.stringify(updatedTxList));
    } catch {}

    try {
      const existingPaymentsRaw = localStorage.getItem('munyaka_fee_payments_db');
      const paymentsList = existingPaymentsRaw ? JSON.parse(existingPaymentsRaw) : [];
      const updatedPaymentsList = [transaction, ...(Array.isArray(paymentsList) ? paymentsList : [])];
      localStorage.setItem('munyaka_fee_payments_db', JSON.stringify(updatedPaymentsList));
    } catch {}

    // Update student records
    try {
      for (const key of LEARNER_STORAGE_KEYS) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const updatedLearners = parsed.map((learner: any) => {
              const lid = learner.id || learner.admNo;
              if (lid === selectedStudentId || learner.name === selectedLearner?.name) {
                const txs = Array.isArray(learner.transactions) ? [...learner.transactions, transaction] : [transaction];
                const totalPaidSoFar = txs.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
                const termFeeVal = Number(learner.termFee || learner.totalFee || 15000);
                const newBalance = Math.max(0, termFeeVal - totalPaidSoFar);
                const newStatus = newBalance <= 0 ? 'Cleared' : totalPaidSoFar > 0 ? 'Partial' : 'Pending';

                return {
                  ...learner,
                  transactions: txs,
                  paid: totalPaidSoFar,
                  balance: newBalance,
                  status: newStatus,
                };
              }
              return learner;
            });
            localStorage.setItem(key, JSON.stringify(updatedLearners));
          }
        }
      }
    } catch {}

    // Update override
    try {
      const overrideKey = `munyaka_fee_${selectedStudentId}`;
      const existingOverride = localStorage.getItem(overrideKey);
      if (existingOverride) {
        const parsed = JSON.parse(existingOverride);
        const prevPaid = Number(parsed.feePaid || parsed.paid || 0);
        const termFeeVal = Number(parsed.termFee || parsed.total || 15000);
        const newPaid = prevPaid + amountNum;
        const newBal = Math.max(0, termFeeVal - newPaid);
        localStorage.setItem(overrideKey, JSON.stringify({
          ...parsed,
          feePaid: newPaid,
          paid: newPaid,
          balance: newBal,
          status: newBal <= 0 ? 'Cleared' : 'Partial',
        }));
      }
    } catch {}

    window.dispatchEvent(new Event('munyaka_fees_updated'));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key: 'munyaka_transactions' } }));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key: 'munyaka_fee_payments_db' } }));
    window.dispatchEvent(new CustomEvent('munyaka:data-changed', { detail: { key: 'munyaka_learners_db' } }));

    showSuccess(`Successfully posted KES ${amountNum.toLocaleString()} payment for ${selectedLearner?.name || 'Learner'}!`);
    setIsSaving(false);
    onSubmitPayment(transaction);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Learner Fee Payment"
      description="Post fee payment for a learner and update account balances."
      maxWidth="max-w-2xl"
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold h-11 px-6">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-11 px-8 shadow-lg shadow-indigo-100 gap-2 text-white"
          >
            <CreditCard size={18} /> {isSaving ? 'Posting Payment...' : 'Post Payment'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2.5 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
            <AlertCircle size={16} className="shrink-0" /> {errorMsg}
          </div>
        )}

        {/* Academic Year & Term (Pre-filtered banner) */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-indigo-600" />
            <span>Academic Context: <strong className="text-indigo-700">{term.toUpperCase()} {academicYear}</strong></span>
          </div>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest bg-white px-2.5 py-1 rounded-lg border border-slate-200">Pre-filtered</span>
        </div>

        {/* 1. Grade & Stream Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Filter size={12} /> Filter by Grade / Class
            </Label>
            <Select value={selectedGradeFilter} onValueChange={handleGradeFilterChange}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-800 text-xs">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Grades ({learnersList.length})</SelectItem>
                {gradesData.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Filter size={12} /> Filter by Stream
            </Label>
            <Select value={selectedStreamFilter} onValueChange={handleStreamFilterChange}>
              <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-800 text-xs">
                <SelectValue placeholder="All Streams" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Streams</SelectItem>
                {availableStreamsForFilter.map(s => (
                  <SelectItem key={s.id || s.name} value={s.id || s.name.toLowerCase()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 2. Searchable Learner Selection */}
        <div className="space-y-1.5 pt-1">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Select Learner * {filteredLearners.length > 0 && <span className="text-indigo-600 font-bold">({filteredLearners.length} available)</span>}
          </Label>
          <div className="space-y-2">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search learner by name or admission number..."
                className="pl-10 rounded-xl h-11 bg-slate-50 border-none font-medium text-sm"
              />
            </div>

            <Select value={selectedStudentId} onValueChange={handleStudentSelect}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800">
                <SelectValue placeholder={
                  filteredLearners.length === 0
                    ? "No learners match filters"
                    : selectedLearner
                    ? `${selectedLearner.name} (Adm: ${selectedLearner.admNo || selectedLearner.id}) — ${selectedLearner.grade || 'No Grade'} ${selectedLearner.stream ? `(${selectedLearner.stream})` : ''}`
                    : "Choose learner from database..."
                } />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {filteredLearners.length > 0 ? (
                  filteredLearners.map(l => (
                    <SelectItem key={l.id} value={l.id} className="py-2.5">
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="font-bold text-slate-900">{l.name}</span>
                        <span className="text-xs text-slate-400 font-mono">
                          Adm: {l.admNo || l.id} {l.grade ? `• ${l.grade}` : ''} {l.stream ? `(${l.stream})` : ''}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No learners match the selected grade/stream or search criteria.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selected Learner Details Badge (if selected) */}
        {selectedLearner && (
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs font-bold text-indigo-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              <span>Selected: <strong>{selectedLearner.name}</strong> (Adm: {selectedLearner.admNo || selectedLearner.id})</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-indigo-200/60 text-indigo-700 text-[11px]">
              <span>{selectedLearner.grade || 'Grade Not Set'}</span>
              {selectedLearner.stream && <span>• {selectedLearner.stream}</span>}
            </div>
          </div>
        )}

        {/* Fee Type / Payment Category */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Fee Type / Payment Category *
          </Label>
          <Select value={feeCategory} onValueChange={setFeeCategory}>
            <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FEE_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Paid (KES) */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Amount Paid (KES) *
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">KES</span>
            <Input
              type="number"
              min="1"
              value={amount}
              onChange={e => { setAmount(e.target.value); setErrorMsg(""); }}
              placeholder="e.g. 5000"
              className="pl-14 rounded-xl h-12 bg-slate-50 border-none font-black text-lg text-slate-900"
            />
          </div>
        </div>

        {/* Payment Method Options */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Payment Method *
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PAYMENT_METHODS.map(m => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => { setPaymentMethod(m.value); setErrorMsg(""); }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center gap-1.5 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 shadow-sm ring-2 ring-indigo-600/20'
                      : 'border-slate-100 bg-slate-50/60 text-slate-600 hover:bg-slate-100/60'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${m.bg} ${m.color}`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-xs font-bold">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conditional Reference Input */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {paymentMethod === 'mpesa' ? 'M-Pesa Confirmation Code (Ref) *' : paymentMethod === 'bank' ? 'Bank Transfer Reference *' : paymentMethod === 'cheque' ? 'Cheque Number *' : 'Transaction / Receipt Ref'}
          </Label>
          <div className="relative">
            <Receipt size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={refCode}
              onChange={e => { setRefCode(e.target.value); setErrorMsg(""); }}
              placeholder={paymentMethod === 'mpesa' ? 'e.g. QHK892XYZ' : paymentMethod === 'bank' ? 'e.g. EFT-98213' : 'e.g. CHQ-0042'}
              className="pl-10 rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-900 uppercase"
            />
          </div>
        </div>

        {/* Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Payment Date *
            </Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-800 text-xs"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default LearnerFeePaymentModal;
