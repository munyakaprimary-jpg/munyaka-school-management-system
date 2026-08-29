"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Modal from '@/components/ui/Modal';
import {
  CreditCard,
  AlertCircle,
  Banknote,
  Landmark,
  Smartphone,
  Receipt,
  CheckCircle2,
  User,
  Calendar,
  Hash,
  Building,
  MapPin,
} from 'lucide-react';
import { GRADES_DATA, Grade } from '@/lib/mock-data';
import { showSuccess, showError } from '@/utils/toast';
import { PaymentMethod, PaymentDetails, Transaction } from '@/types/fees';

interface StudentItem {
  id: string;
  name: string;
  assessment?: string;
  grade: string;
  stream: string;
  admNo?: string;
}

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPayment: (transaction: Transaction) => void;
  gradesData?: Grade[];
  studentsData?: StudentItem[];
}

const GRADES_STORAGE_KEY = 'munyaka_grades';
const STUDENTS_STORAGE_KEY = 'school_learners_data';

// ─────────────────────────────────────────────
// Payment mode config
// ─────────────────────────────────────────────
const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  {
    value: 'cash',
    label: 'Cash',
    icon: Banknote,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    value: 'bank',
    label: 'Bank Transfer / EFT',
    icon: Landmark,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    value: 'cheque',
    label: 'Cheque',
    icon: Receipt,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    value: 'mpesa',
    label: 'M-Pesa',
    icon: Smartphone,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
];

// ─────────────────────────────────────────────
// Sub-forms for each payment method
// ─────────────────────────────────────────────
interface CashFieldsProps {
  receivedBy: string;
  onChange: (v: string) => void;
  date: string;
  onDateChange: (v: string) => void;
}

const CashFields = ({ receivedBy, onChange, date, onDateChange }: CashFieldsProps) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl">
      <User size={16} className="text-emerald-600 flex-shrink-0" />
      <Label className="text-xs font-black uppercase tracking-widest text-emerald-700">Received By (Staff Name)</Label>
    </div>
    <Input
      value={receivedBy}
      onChange={e => onChange(e.target.value)}
      placeholder="e.g. Jane Mwangi"
      className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-800"
    />
    <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl">
      <Calendar size={16} className="text-emerald-600 flex-shrink-0" />
      <Label className="text-xs font-black uppercase tracking-widest text-emerald-700">Payment Date</Label>
    </div>
    <Input
      type="date"
      value={date}
      onChange={e => onDateChange(e.target.value)}
      className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-800"
    />
  </div>
);

interface BankFieldsProps {
  bankName: string;
  onBankChange: (v: string) => void;
  branch: string;
  onBranchChange: (v: string) => void;
  transactionRef: string;
  onRefChange: (v: string) => void;
  date: string;
  onDateChange: (v: string) => void;
}

const BankFields = ({
  bankName, onBankChange,
  branch, onBranchChange,
  transactionRef, onRefChange,
  date, onDateChange,
}: BankFieldsProps) => (
  <div className="space-y-3">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Building size={13} className="text-blue-600" />
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bank Name</Label>
        </div>
        <Input
          value={bankName}
          onChange={e => onBankChange(e.target.value)}
          placeholder="e.g. Equity Bank"
          className="h-11 rounded-xl bg-slate-50 border-none font-bold text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <MapPin size={13} className="text-blue-600" />
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Branch</Label>
        </div>
        <Input
          value={branch}
          onChange={e => onBranchChange(e.target.value)}
          placeholder="e.g. Eldoret CBD"
          className="h-11 rounded-xl bg-slate-50 border-none font-bold text-sm"
        />
      </div>
    </div>
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Hash size={13} className="text-blue-600" />
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction / Reference Number</Label>
      </div>
      <Input
        value={transactionRef}
        onChange={e => onRefChange(e.target.value)}
        placeholder="e.g. EFT-2026-001234"
        className="h-11 rounded-xl bg-slate-50 border-none font-mono text-sm"
      />
    </div>
    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
      <Calendar size={15} className="text-blue-600 flex-shrink-0" />
      <Label className="text-xs font-black uppercase tracking-widest text-blue-700">Transaction Date</Label>
    </div>
    <Input
      type="date"
      value={date}
      onChange={e => onDateChange(e.target.value)}
      className="h-11 rounded-xl bg-slate-50 border-none font-bold text-sm"
    />
  </div>
);

interface ChequeFieldsProps {
  bankName: string;
  onBankChange: (v: string) => void;
  branch: string;
  onBranchChange: (v: string) => void;
  chequeNumber: string;
  onChequeChange: (v: string) => void;
  date: string;
  onDateChange: (v: string) => void;
}

const ChequeFields = ({
  bankName, onBankChange,
  branch, onBranchChange,
  chequeNumber, onChequeChange,
  date, onDateChange,
}: ChequeFieldsProps) => (
  <div className="space-y-3">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Building size={13} className="text-amber-600" />
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bank Name</Label>
        </div>
        <Input
          value={bankName}
          onChange={e => onBankChange(e.target.value)}
          placeholder="e.g. Barclays Bank"
          className="h-11 rounded-xl bg-slate-50 border-none font-bold text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <MapPin size={13} className="text-amber-600" />
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Branch</Label>
        </div>
        <Input
          value={branch}
          onChange={e => onBranchChange(e.target.value)}
          placeholder="e.g. Eldoret Town"
          className="h-11 rounded-xl bg-slate-50 border-none font-bold text-sm"
        />
      </div>
    </div>
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Receipt size={13} className="text-amber-600" />
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cheque Number</Label>
      </div>
      <Input
        value={chequeNumber}
        onChange={e => onChequeChange(e.target.value)}
        placeholder="e.g. 204567"
        className="h-11 rounded-xl bg-slate-50 border-none font-mono text-sm"
      />
    </div>
    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl">
      <Calendar size={15} className="text-amber-600 flex-shrink-0" />
      <Label className="text-xs font-black uppercase tracking-widest text-amber-700">Cheque Date</Label>
    </div>
    <Input
      type="date"
      value={date}
      onChange={e => onDateChange(e.target.value)}
      className="h-11 rounded-xl bg-slate-50 border-none font-bold text-sm"
    />
  </div>
);

interface MpesaFieldsProps {
  receiptNumber: string;
  onReceiptChange: (v: string) => void;
  date: string;
  onDateChange: (v: string) => void;
}

const MpesaFields = ({ receiptNumber, onReceiptChange, date, onDateChange }: MpesaFieldsProps) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-xl">
      <Smartphone size={16} className="text-violet-600 flex-shrink-0" />
      <div>
        <Label className="text-xs font-black uppercase tracking-widest text-violet-700">M-Pesa Receipt Number</Label>
        <p className="text-[10px] text-violet-400 font-medium mt-0.5">Found on the customer's M-Pesa SMS confirmation</p>
      </div>
    </div>
    <Input
      value={receiptNumber}
      onChange={e => onReceiptChange(e.target.value.toUpperCase())}
      placeholder="e.g. QG7XXXXXXX"
      className="h-12 rounded-xl bg-slate-50 border-none font-mono font-bold text-sm tracking-wider"
      maxLength={10}
    />
    <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-xl">
      <Calendar size={16} className="text-violet-600 flex-shrink-0" />
      <Label className="text-xs font-black uppercase tracking-widest text-violet-700">Payment Date</Label>
    </div>
    <Input
      type="date"
      value={date}
      onChange={e => onDateChange(e.target.value)}
      className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-800"
    />
  </div>
);

// ─────────────────────────────────────────────
// Main Modal Component
// ─────────────────────────────────────────────
const RecordPaymentModal = ({
  isOpen,
  onClose,
  onSubmitPayment,
  gradesData: propGradesData = GRADES_DATA,
  studentsData: propStudentsData = [],
}: RecordPaymentModalProps) => {
  // Cascading selection
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [selectedStreamId, setSelectedStreamId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  // Cash fields
  const [receivedBy, setReceivedBy] = useState<string>("");
  const [cashDate, setCashDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Bank fields
  const [bankName, setBankName] = useState<string>("");
  const [bankBranch, setBankBranch] = useState<string>("");
  const [bankRef, setBankRef] = useState<string>("");
  const [bankDate, setBankDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Cheque fields
  const [chequeBankName, setChequeBankName] = useState<string>("");
  const [chequeBranch, setChequeBranch] = useState<string>("");
  const [chequeNumber, setChequeNumber] = useState<string>("");
  const [chequeDate, setChequeDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // M-Pesa fields
  const [mpesaReceipt, setMpesaReceipt] = useState<string>("");
  const [mpesaDate, setMpesaDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // LocalStorage data
  const [gradesData, setGradesData] = useState<Grade[]>(() => {
    try {
      const stored = localStorage.getItem(GRADES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* use default */ }
    return propGradesData;
  });

  const [studentsData, setStudentsData] = useState<StudentItem[]>(() => {
    try {
      const stored = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* use default */ }
    return propStudentsData;
  });

  // Sync from localStorage
  useEffect(() => {
    const onStorage = () => {
      try {
        const sg = localStorage.getItem(GRADES_STORAGE_KEY);
        if (sg) { const p = JSON.parse(sg); if (Array.isArray(p) && p.length > 0) setGradesData(p); }
      } catch { /* noop */ }
      try {
        const ss = localStorage.getItem(STUDENTS_STORAGE_KEY);
        if (ss) { const p = JSON.parse(ss); if (Array.isArray(p) && p.length > 0) setStudentsData(p); }
      } catch { /* noop */ }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('learners_data_updated', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('learners_data_updated', onStorage);
    };
  }, []);

  // Reset all fields when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedGradeId(""); setSelectedStreamId(""); setSelectedStudentId("");
      setAmount(""); setNotes(""); setErrorMsg("");
      setPaymentMethod('cash');
      setReceivedBy(""); setCashDate(new Date().toISOString().slice(0, 10));
      setBankName(""); setBankBranch(""); setBankRef(""); setBankDate(new Date().toISOString().slice(0, 10));
      setChequeBankName(""); setChequeBranch(""); setChequeNumber(""); setChequeDate(new Date().toISOString().slice(0, 10));
      setMpesaReceipt(""); setMpesaDate(new Date().toISOString().slice(0, 10));
    }
  }, [isOpen]);

  // Derived
  const selectedGradeObj = useMemo(() =>
    gradesData.find(g => g.id === selectedGradeId), [selectedGradeId, gradesData]);

  const availableStreams = useMemo(() =>
    selectedGradeObj ? selectedGradeObj.streams : [], [selectedGradeObj]);

  const filteredStudents = useMemo(() => {
    if (!selectedGradeObj || !selectedStreamId) return [];
    const streamObj = availableStreams.find(s => s.id === selectedStreamId);
    if (!streamObj) return [];
    return studentsData.filter(s => {
      const gradeNum = selectedGradeObj.name?.replace(/[^0-9]/g, '') ?? '';
      const matchesGrade = s.grade === gradeNum || s.grade === selectedGradeObj?.name;
      const matchesStream = s.stream.toLowerCase() === streamObj.name?.toLowerCase();
      return matchesGrade && matchesStream;
    });
  }, [selectedGradeObj, selectedStreamId, availableStreams, studentsData]);

  const selectedStudent = useMemo(() =>
    studentsData.find(s => s.id === selectedStudentId), [selectedStudentId, studentsData]);

  const handleGradeChange = (id: string) => {
    setSelectedGradeId(id); setSelectedStreamId(""); setSelectedStudentId(""); setErrorMsg("");
  };
  const handleStreamChange = (id: string) => {
    setSelectedStreamId(id); setSelectedStudentId(""); setErrorMsg("");
  };

  const validate = (): string => {
    if (!selectedStudentId) return "Please select a learner.";
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) return "Please enter a valid payment amount.";
    if (paymentMethod === 'cash' && !receivedBy.trim()) return "Please enter the staff name who received the cash payment.";
    if (paymentMethod === 'bank') {
      if (!bankName.trim()) return "Please enter the bank name.";
      if (!bankRef.trim()) return "Please enter the transaction reference number.";
    }
    if (paymentMethod === 'cheque') {
      if (!chequeBankName.trim()) return "Please enter the bank name on the cheque.";
      if (!chequeNumber.trim()) return "Please enter the cheque number.";
    }
    if (paymentMethod === 'mpesa' && !mpesaReceipt.trim()) return "Please enter the M-Pesa receipt number.";
    return "";
  };

  const buildTransaction = (): Transaction => {
    let details: PaymentDetails;
    let date: string;
    let ref = '';

    switch (paymentMethod) {
      case 'cash':
        details = { receivedBy: receivedBy.trim() };
        date = cashDate || new Date().toISOString().slice(0, 10);
        ref = `CASH-${Date.now().toString().slice(-6)}`;
        break;
      case 'bank':
        details = { bankName: bankName.trim(), branch: bankBranch.trim(), transactionRef: bankRef.trim() };
        date = bankDate || new Date().toISOString().slice(0, 10);
        ref = bankRef.trim();
        break;
      case 'cheque':
        details = { bankName: chequeBankName.trim(), branch: chequeBranch.trim(), chequeNumber: chequeNumber.trim() };
        date = chequeDate || new Date().toISOString().slice(0, 10);
        ref = `CHQ-${chequeNumber.trim()}`;
        break;
      case 'mpesa':
        details = { receiptNumber: mpesaReceipt.trim() };
        date = mpesaDate || new Date().toISOString().slice(0, 10);
        ref = mpesaReceipt.trim();
        break;
    }

    const studentGrade = selectedStudent?.grade ?? '';
    const studentStream = selectedStudent?.stream ?? '';

    return {
      id: `TX-${Math.floor(100 + Math.random() * 900)}`,
      date,
      amount: parseFloat(amount),
      method: PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label ?? paymentMethod,
      ref,
      category: 'Tuition',
      studentId: selectedStudentId,
      grade: studentGrade,
      stream: studentStream,
      paymentMethod,
      paymentDetails: details,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setErrorMsg(err); return; }
    const tx = buildTransaction();
    onSubmitPayment(tx);
    onClose();
  };

  // Determine which date to show in the method fields (fallback to today)
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Fee Payment"
      description="Select the learner, payment method, and enter the relevant transaction details."
      size="lg"
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold h-11 px-6">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-11 px-8 shadow-lg shadow-indigo-100 gap-2 text-white"
          >
            <CreditCard size={18} /> Post Payment
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2.5 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {/* ── Step 1: Learner selection ── */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            1. Select Learner
          </p>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grade Level</Label>
            <Select value={selectedGradeId} onValueChange={handleGradeChange}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-100 font-bold text-slate-800">
                <SelectValue placeholder="Choose Grade Level..." />
              </SelectTrigger>
              <SelectContent>
                {gradesData.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g?.name ?? ''} ({g?.category ?? ''})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stream</Label>
            <Select value={selectedStreamId} onValueChange={handleStreamChange}
              disabled={!selectedGradeId || availableStreams.length === 0}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-100 font-bold text-slate-800 disabled:opacity-50">
                <SelectValue placeholder={!selectedGradeId ? "Select a grade first..." : "Choose Stream..."} />
              </SelectTrigger>
              <SelectContent>
                {availableStreams.map(s => (
                  <SelectItem key={s.id} value={s.id}>Stream {s?.name ?? ''} ({s?.studentsCount ?? 0} learners)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Learner</Label>
            <Select value={selectedStudentId} onValueChange={v => { setSelectedStudentId(v); setErrorMsg(""); }}
              disabled={!selectedStreamId}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-100 font-bold text-slate-800 disabled:opacity-50">
                <SelectValue placeholder={
                  !selectedStreamId ? "Select grade and stream first..." :
                  filteredStudents.length === 0 ? "No learners in this stream" :
                  "Choose Learner..."
                } />
              </SelectTrigger>
              <SelectContent>
                {(filteredStudents.length > 0 ? filteredStudents : studentsData).map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — {s.admNo || s.assessment || s.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Step 2: Amount ── */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">2. Payment Amount (KES)</Label>
          <Input
            type="number" min="1"
            value={amount}
            onChange={e => { setAmount(e.target.value); setErrorMsg(""); }}
            placeholder="e.g. 5000"
            className="rounded-xl h-12 bg-slate-50 border-slate-100 font-black text-lg focus:bg-white"
          />
        </div>

        {/* ── Step 3: Payment method ── */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            3. Payment Method
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PAYMENT_METHODS.map(({ value, label, icon: Icon, color, bg }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setPaymentMethod(value); setErrorMsg(""); }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all cursor-pointer
                  ${paymentMethod === value
                    ? `${bg} border-current ${color} shadow-sm`
                    : "bg-slate-50 border-transparent text-slate-400 hover:border-slate-200"
                  }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-black uppercase tracking-wide text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Step 4: Method-specific fields ── */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            4. Payment Details
          </Label>
          <div className="rounded-2xl border border-slate-100 p-4 bg-white">
            {paymentMethod === 'cash' && (
              <CashFields
                receivedBy={receivedBy} onChange={v => { setReceivedBy(v); setErrorMsg(""); }}
                date={cashDate} onDateChange={setCashDate}
              />
            )}
            {paymentMethod === 'bank' && (
              <BankFields
                bankName={bankName} onBankChange={v => { setBankName(v); setErrorMsg(""); }}
                branch={bankBranch} onBranchChange={setBankBranch}
                transactionRef={bankRef} onRefChange={v => { setBankRef(v); setErrorMsg(""); }}
                date={bankDate} onDateChange={setBankDate}
              />
            )}
            {paymentMethod === 'cheque' && (
              <ChequeFields
                bankName={chequeBankName} onBankChange={v => { setChequeBankName(v); setErrorMsg(""); }}
                branch={chequeBranch} onBranchChange={setChequeBranch}
                chequeNumber={chequeNumber} onChequeChange={v => { setChequeNumber(v); setErrorMsg(""); }}
                date={chequeDate} onDateChange={setChequeDate}
              />
            )}
            {paymentMethod === 'mpesa' && (
              <MpesaFields
                receiptNumber={mpesaReceipt} onReceiptChange={v => { setMpesaReceipt(v); setErrorMsg(""); }}
                date={mpesaDate} onDateChange={setMpesaDate}
              />
            )}
          </div>
        </div>

        {/* ── Optional notes ── */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes (Optional)</Label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any additional notes about this payment..."
            rows={2}
            className="rounded-xl bg-slate-50 border-none font-medium text-sm resize-none"
          />
        </div>
      </form>
    </Modal>
  );
};

export default RecordPaymentModal;
