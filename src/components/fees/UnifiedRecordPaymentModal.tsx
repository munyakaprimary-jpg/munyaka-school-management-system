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
  Key,
  Copy,
  CheckCircle2,
  User,
  Calendar,
  Hash,
  Building,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { GRADES_DATA } from '@/lib/mock-data';
import type { Grade } from '@/types/school';
import { showSuccess } from '@/utils/toast';
import { PaymentMethod, PaymentDetails, Transaction } from '@/types/fees';
import { ValidityDuration, LICENSE_METHOD_LABELS } from '@/types/license';
import { issueLicense } from '@/services/licenseService';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface StudentItem {
  id: string;
  name: string;
  assessment?: string;
  grade: string;
  gradeId?: string;
  stream: string;
  streamId?: string;
  admNo?: string;
  admissionNo?: string;
}

interface StreamItem {
  id: string;
  name: string;
}

interface GradeItem {
  id: string;
  name: string;
  streams: StreamItem[];
  category?: string;
}

export interface UnifiedRecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Called after a payment is successfully recorded.
   * Provides the transaction (so callers can push it to the Invoice
   * History table) AND the generated activation key (when applicable).
   */
  onSubmitPayment: (result: {
    transaction: Transaction;
    activationKey?: string;
    issuedTo?: string;
    deviceId?: string;
    expiresAt?: string;
  }) => void;
  gradesData?: Grade[];
  studentsData?: StudentItem[];
  /** Optional pre-filled recipient / institution (used for license payments) */
  defaultIssuedTo?: string;
  /** Optional subscription name shown in the description */
  defaultSubscriptionName?: string;
  /** When true, hides the learner cascading dropdowns */
  hideLearnerSelection?: boolean;
  /** When true, hides the activation-key generation block */
  hideActivationKey?: boolean;
  /** Optional active academic year for academic fee transactions */
  activeAcademicYear?: string;
}

// ─────────────────────────────────────────────
// Storage keys
// ─────────────────────────────────────────────
const GRADES_STORAGE_KEY = 'munyaka_grades';
const STUDENTS_STORAGE_KEY = 'school_learners_data';

// Default grades configuration matching LearnerFeePaymentModal
const DEFAULT_GRADES_CONFIG: GradeItem[] = [
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

// ─────────────────────────────────────────────
// Payment mode config
// ─────────────────────────────────────────────
const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { value: 'cash',   label: 'Cash',                icon: Banknote,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { value: 'bank',   label: 'Bank Transfer / EFT', icon: Landmark,   color: 'text-blue-600',    bg: 'bg-blue-50' },
  { value: 'cheque', label: 'Cheque',              icon: Receipt,    color: 'text-amber-600',   bg: 'bg-amber-50' },
  { value: 'mpesa',  label: 'M-Pesa',              icon: Smartphone, color: 'text-violet-600',  bg: 'bg-violet-50' },
];

const VALIDITY_OPTIONS: { days: ValidityDuration; label: string; sub: string }[] = [
  { days: 30,  label: '30 Days', sub: 'Trial' },
  { days: 365, label: '1 Year',  sub: 'Annual' },
  { days: 730, label: '2 Years', sub: 'Biennial' },
];

const CURRENCY_OPTIONS = [
  { value: 'KES', label: 'KES — Kenyan Shilling' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
];

// Generate a stable device ID for this browser
function getDeviceId(): string {
  let id = localStorage.getItem('munyaka_device_id');
  if (!id) {
    const arr = new Uint8Array(8);
    crypto.getRandomValues(arr);
    id = 'DEV-' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    localStorage.setItem('munyaka_device_id', id);
  }
  return id;
}

// ─────────────────────────────────────────────
// Main Modal Component
// ─────────────────────────────────────────────
const UnifiedRecordPaymentModal: React.FC<UnifiedRecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmitPayment,
  gradesData: propGradesData = GRADES_DATA,
  studentsData: propStudentsData = [],
  defaultIssuedTo = '',
  defaultSubscriptionName = '',
  hideLearnerSelection = false,
  hideActivationKey = false,
  activeAcademicYear = "2026",
}) => {
  const currentAcademicYear = activeAcademicYear;
  // Learner selection (hidden for license-only flows)
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [selectedStreamId, setSelectedStreamId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Common
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("KES");
  const [notes, setNotes] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // License fields
  const [issuedTo, setIssuedTo] = useState<string>(defaultIssuedTo);
  const [subscriptionName, setSubscriptionName] = useState<string>(defaultSubscriptionName);
  const [validityDays, setValidityDays] = useState<ValidityDuration>(365);

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

  // Submissions
  const [isSaving, setIsSaving] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generatedKeyMeta, setGeneratedKeyMeta] = useState<{
    issuedTo: string;
    deviceId: string;
    expiresAt: string;
    amount: string;
    method: PaymentMethod;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // LocalStorage data
  const [gradesData, setGradesData] = useState<Grade[]>(() => {
    try {
      const stored = localStorage.getItem(GRADES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* use default */ }
    return DEFAULT_GRADES_CONFIG as unknown as Grade[];
  });

  const [studentsData, setStudentsData] = useState<StudentItem[]>(() => {
    try {
      const keys = ['school_learners_data', 'munyaka_learners_db', 'munyaka_students', 'students', 'learners', 'pupils', 'school_students', 'registered_students', 'munyaka_registered_students'];
      for (const k of keys) {
        const stored = localStorage.getItem(k);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch { /* use default */ }
    return propStudentsData;
  });

  // Re-read students when modal opens
  useEffect(() => {
    if (!isOpen) return;
    try {
      const keys = ['school_learners_data', 'munyaka_learners_db', 'munyaka_students', 'students', 'learners', 'pupils', 'school_students', 'registered_students', 'munyaka_registered_students'];
      for (const k of keys) {
        const stored = localStorage.getItem(k);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStudentsData(parsed);
            return;
          }
        }
      }
    } catch {}
  }, [isOpen]);

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
    if (isOpen) {
      setSelectedGradeId(""); setSelectedStreamId(""); setSelectedStudentId("");
      setAmount(""); setCurrency("KES"); setNotes(""); setErrorMsg("");
      setIssuedTo(defaultIssuedTo);
      setSubscriptionName(defaultSubscriptionName);
      setValidityDays(365);
      setPaymentMethod('cash');
      setReceivedBy(""); setCashDate(new Date().toISOString().slice(0, 10));
      setBankName(""); setBankBranch(""); setBankRef(""); setBankDate(new Date().toISOString().slice(0, 10));
      setChequeBankName(""); setChequeBranch(""); setChequeNumber(""); setChequeDate(new Date().toISOString().slice(0, 10));
      setMpesaReceipt(""); setMpesaDate(new Date().toISOString().slice(0, 10));
      setGeneratedKey(null);
      setGeneratedKeyMeta(null);
      setCopied(false);
    }
  }, [isOpen, defaultIssuedTo, defaultSubscriptionName]);

  // Derived
  const selectedGradeObj = useMemo(() =>
    gradesData.find(g => g.id === selectedGradeId), [selectedGradeId, gradesData]);

  // Helper to normalize and match grade/stream names
  const normalizeStr = (str: unknown): string => {
    if (!str) return "";
    return String(str)
      .toLowerCase()
      .replace(/\s*\([^)]*\)/g, "") // remove parentheses like (Primary), (Junior)
      .replace(/[^a-z0-9]/g, ""); // keep only alphanumeric
  };

  const isGradeMatch = (studentGrade: unknown, gradeObj: Grade): boolean => {
    if (!studentGrade) return false;
    const sg = String(studentGrade).toLowerCase().trim();
    const gName = String((gradeObj as any).name || "").toLowerCase().trim();
    const gId = String(gradeObj.id || "").toLowerCase().trim();
    
    // Extract numbers if any (e.g. "grade 6" -> "6")
    const sgNum = sg.replace(/[^0-9]/g, "");
    const gNameNum = gName.replace(/[^0-9]/g, "");

    if (sg === gName || sg === gId || sg.includes(gName) || gName.includes(sg)) return true;
    if (sgNum && sgNum === gNameNum) return true;
    
    // Also check normalized
    const normSg = normalizeStr(sg);
    const normGName = normalizeStr(gName);
    const normGId = normalizeStr(gId);
    if (normSg && (normSg === normGName || normSg === normGId)) return true;

    return false;
  };

  const isStreamMatch = (studentStream: unknown, streamName: unknown): boolean => {
    if (!studentStream || !streamName) return false;
    const ss = String(studentStream).toLowerCase().trim();
    const sn = String(streamName).toLowerCase().trim();
    if (ss === sn || ss.includes(sn) || sn.includes(ss)) return true;
    return normalizeStr(ss) === normalizeStr(sn);
  };

  const derivedStreamsWithCounts = useMemo(() => {
    if (!selectedGradeObj) return [];
    return selectedGradeObj.streams.map(stream => {
      const count = studentsData.filter(s => {
        const matchesG = isGradeMatch(s.grade || s.gradeId, selectedGradeObj);
        const matchesS = isStreamMatch(s.stream || s.streamId, stream.name);
        return matchesG && matchesS;
      }).length;
      return {
        ...stream,
        computedCount: count > 0 ? count : (stream.studentsCount || 0),
      };
    });
  }, [selectedGradeObj, studentsData]);

  const availableStreams = derivedStreamsWithCounts;

  const filteredStudents = useMemo(() => {
    if (!selectedGradeObj || !selectedStreamId) return [];
    const streamObj = availableStreams.find(s => s.id === selectedStreamId);
    if (!streamObj) return [];
    return studentsData.filter(s => {
      const matchesGrade = isGradeMatch(s.grade || (s as any).gradeId, selectedGradeObj);
      const matchesStream = isStreamMatch(s.stream || (s as any).streamId, streamObj.name);
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

  // ─────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────
  const validate = (): string => {
    // Either a learner must be selected OR a recipient (license flow)
    if (!hideLearnerSelection && !selectedStudentId && !String(issuedTo || '').trim()) {
          return "Please select a learner or enter an institution / recipient.";
        }
        if (hideLearnerSelection && !String(issuedTo || '').trim()) {
          return "Please enter the recipient / institution name.";
        }
        const n = parseFloat(amount);
        if (isNaN(n) || n <= 0) return "Please enter a valid payment amount.";
        if (paymentMethod === 'cash' && !String(receivedBy || '').trim() && !String(issuedTo || '').trim()) {
          return "Please enter the staff name who received the cash payment.";
        }
        if (paymentMethod === 'bank') {
          if (!String(bankName || '').trim()) return "Please enter the bank name.";
          if (!String(bankRef || '').trim()) return "Please enter the transaction reference number.";
        }
        if (paymentMethod === 'cheque') {
          if (!String(chequeBankName || '').trim()) return "Please enter the bank name on the cheque.";
          if (!String(chequeNumber || '').trim()) return "Please enter the cheque number.";
        }
        if (paymentMethod === 'mpesa' && !String(mpesaReceipt || '').trim()) {
          return "Please enter the M-Pesa receipt number.";
        }
    return "";
  };

  // ─────────────────────────────────────────────
  // Build Transaction record (consumed by Invoice History)
  // ─────────────────────────────────────────────
  const buildTransaction = (): Transaction => {
    let details: PaymentDetails;
    let date: string;
    let ref = '';

    switch (paymentMethod) {
      case 'cash':
              details = { receivedBy: String(receivedBy || '').trim() || String(issuedTo || '').trim() };
              date = cashDate || new Date().toISOString().slice(0, 10);
              ref = `CASH-${Date.now().toString().slice(-6)}`;
              break;
            case 'bank':
              details = { bankName: String(bankName || '').trim(), branch: String(bankBranch || '').trim(), transactionRef: String(bankRef || '').trim() };
              date = bankDate || new Date().toISOString().slice(0, 10);
              ref = String(bankRef || '').trim();
              break;
            case 'cheque':
              details = { bankName: String(chequeBankName || '').trim(), branch: String(chequeBranch || '').trim(), chequeNumber: String(chequeNumber || '').trim() };
              date = chequeDate || new Date().toISOString().slice(0, 10);
              ref = `CHQ-${String(chequeNumber || '').trim()}`;
              break;
            case 'mpesa':
              details = { receiptNumber: String(mpesaReceipt || '').trim() };
              date = mpesaDate || new Date().toISOString().slice(0, 10);
              ref = String(mpesaReceipt || '').trim();
              break;
          }
      
          const txDescription = String(subscriptionName || '').trim()
            ? `${String(subscriptionName || '').trim()} — ${String(issuedTo || '').trim() || selectedStudent?.name || 'Subscription'}`
            : `Payment for ${selectedStudent?.name ?? String(issuedTo || '').trim() ?? 'Subscription'}`;

    return {
      id: `TX-${Date.now()}`,
      date,
      amount: parseFloat(amount),
      method: PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label ?? paymentMethod,
      ref,
      category: 'Subscription',
      studentId: selectedStudentId || undefined,
      grade: selectedStudent?.grade ?? '',
      stream: selectedStudent?.stream ?? '',
      invoiceId: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
      description: txDescription,
      currency,
      status: 'paid',
      paymentMethod,
      paymentDetails: details,
      paidAt: date,
    };
  };

  // ─────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setErrorMsg(err); return; }
    setIsSaving(true);
    setErrorMsg("");

    await new Promise(r => setTimeout(r, 350));

    const tx = buildTransaction();

    // If activation-key generation is enabled, issue a license too.
    if (!hideActivationKey) {
      try {
        const recipient = String(issuedTo || '').trim() || selectedStudent?.name || 'Munyaka School';
                const license = issueLicense({
                  issuedTo: recipient,
                  deviceId: getDeviceId(),
                  validityDays,
                  payment: {
                    method: paymentMethod,
                    refNumber: tx.ref,
                    amount: tx.amount.toString(),
                    bankName: paymentMethod === 'bank' ? String(bankName || '').trim() : undefined,
                    branch: paymentMethod === 'bank' ? String(bankBranch || '').trim() :
                            paymentMethod === 'cheque' ? String(chequeBranch || '').trim() : undefined,
                  },
                  notes: String(notes || '').trim() ||
                    (String(subscriptionName || '').trim() ? `Subscription: ${String(subscriptionName || '').trim()}` : undefined),
                });

        onSubmitPayment({
          transaction: tx,
          activationKey: license.activationKey,
          issuedTo: license.issuedTo,
          deviceId: license.deviceId,
          expiresAt: license.expiresAt,
        });

        // Show the success state with the activation key.
        setGeneratedKey(license.activationKey);
        setGeneratedKeyMeta({
          issuedTo: license.issuedTo,
          deviceId: license.deviceId,
          expiresAt: license.expiresAt,
          amount: tx.amount.toString(),
          method: paymentMethod,
        });
        showSuccess('Payment recorded and activation key generated!');
      } catch (e) {
        setErrorMsg('Failed to issue license. Please try again.');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // No activation-key path (learner fee payment only).
    onSubmitPayment({ transaction: tx });
    showSuccess(`Payment of ${currency} ${tx.amount.toLocaleString()} recorded.`);
    setIsSaving(false);
    onClose();
  };

  const copyKey = async () => {
    if (!generatedKey) return;
    try {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      showSuccess('Activation key copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  };

  const handleClose = () => {
    setGeneratedKey(null);
    setGeneratedKeyMeta(null);
    onClose();
  };

  // ─────────────────────────────────────────────
  // Render: Success / Activation-key view
  // ─────────────────────────────────────────────
  if (generatedKey && generatedKeyMeta) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Activation Key Generated"
        description="Payment recorded. The activation key is shown below."
        maxWidth="max-w-2xl"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="ghost" onClick={handleClose} className="rounded-xl font-bold h-11 px-6">
              Close
            </Button>
            <Button
              onClick={() => {
                setGeneratedKey(null);
                setGeneratedKeyMeta(null);
              }}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-11 px-6 shadow-lg gap-2 text-white"
            >
              <Receipt size={16} /> Record Another
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Success banner */}
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <div className="p-2.5 bg-emerald-500 rounded-xl text-white">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-emerald-800">Payment Successfully Recorded</p>
              <p className="text-xs text-emerald-600 font-medium">
                Valid until {new Date(generatedKeyMeta.expiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Activation key display */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
              Activation Key
            </Label>
            <div className="relative">
              <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl border-2 border-indigo-400 shadow-2xl shadow-indigo-500/20">
                <p className="text-center font-mono font-black text-2xl md:text-3xl text-white tracking-widest break-all">
                  {generatedKey}
                </p>
              </div>
              <button
                onClick={copyKey}
                className="absolute top-2 right-2 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
                title="Copy key"
              >
                {copied ? <CheckCircle2 size={16} className="text-emerald-300" /> : <Copy size={16} />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-medium text-center">
              Share this key with the recipient. They can enter it on the activation screen to unlock the app.
            </p>
          </div>

          {/* License metadata */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Issued To</p>
              <p className="text-sm font-bold text-slate-900 truncate">{generatedKeyMeta.issuedTo}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Device ID</p>
              <p className="text-sm font-bold text-slate-900 font-mono truncate">{generatedKeyMeta.deviceId}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Method</p>
              <p className="text-sm font-bold text-slate-900">{LICENSE_METHOD_LABELS[generatedKeyMeta.method]}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount Paid</p>
              <p className="text-sm font-bold text-slate-900">{currency} {parseFloat(generatedKeyMeta.amount).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Valid Until</p>
              <p className="text-sm font-bold text-emerald-700">{new Date(generatedKeyMeta.expiresAt).toLocaleDateString()}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Validity</p>
              <p className="text-sm font-bold text-indigo-700">
                {validityDays === 30 ? '30 Days (Trial)' : validityDays === 365 ? '1 Year (Annual)' : '2 Years (Biennial)'}
              </p>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  // ─────────────────────────────────────────────
  // Render: Form
  // ─────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={hideLearnerSelection ? "Record License Payment" : "Record Payment"}
      description={
        hideLearnerSelection
          ? "Record a license payment and instantly generate an activation key."
          : "Select the learner, payment method, and enter the transaction details."
      }
      maxWidth="max-w-3xl"
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="ghost" onClick={handleClose} className="rounded-xl font-bold h-11 px-6">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-11 px-8 shadow-lg shadow-indigo-100 gap-2 text-white"
          >
            {hideActivationKey ? (
              <>
                <CreditCard size={18} /> {isSaving ? 'Posting...' : 'Post Payment'}
              </>
            ) : (
              <>
                <Sparkles size={18} /> {isSaving ? 'Generating...' : 'Record & Generate Activation Key'}
              </>
            )}
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

        {/* ── Step 1: Learner selection (optional when license-mode) ── */}
        {!hideLearnerSelection && (
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
                    <SelectItem key={s.id} value={s.id}>Stream {s?.name ?? ''} ({s?.computedCount ?? 0} learners)</SelectItem>
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
        )}

        {/* ── Step 1b: Recipient / Institution (always shown) ── */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {hideLearnerSelection ? '1. Issued To (Recipient / Institution)' : '2. Recipient / Institution'}
          </Label>
          <div className="relative">
            <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={issuedTo}
              onChange={e => { setIssuedTo(e.target.value); setErrorMsg(''); }}
              placeholder="e.g. Munyaka Primary & Junior School"
              className="rounded-xl h-12 pl-11 bg-slate-50 border-none font-bold text-slate-800"
            />
          </div>
        </div>

        {/* ── Step 2: Subscription (optional, free-text) ── */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {hideLearnerSelection ? '2. Subscription (Optional)' : '3. Subscription (Optional)'}
          </Label>
          <Input
            value={subscriptionName}
            onChange={e => setSubscriptionName(e.target.value)}
            placeholder="e.g. Enterprise Plan"
            className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800"
          />
        </div>

        {/* ── Step 3: Validity duration (license-flow only) ── */}
        {!hideActivationKey && (
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {hideLearnerSelection ? '3. Validity Duration' : '4. Validity Duration'}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {VALIDITY_OPTIONS.map(opt => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setValidityDays(opt.days)}
                  className={cn(
                    "p-3 rounded-2xl border-2 transition-all text-center",
                    validityDays === opt.days
                      ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-sm"
                      : "bg-slate-50 border-transparent text-slate-500 hover:border-slate-200"
                  )}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest">{opt.sub}</p>
                  <p className="text-sm font-black mt-1">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 4: Amount ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {hideLearnerSelection ? '4. Amount Paid' : '5. Amount Paid'}
            </Label>
            <Input
              type="number" min="1"
              value={amount}
              onChange={e => { setAmount(e.target.value); setErrorMsg(""); }}
              placeholder="e.g. 299.00"
              className="rounded-xl h-12 bg-slate-50 border-none font-black text-lg"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Step 5: Payment method ── */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {hideLearnerSelection ? '5. Payment Method' : '6. Payment Method'}
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

        {/* ── Step 6: Method-specific fields ── */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {hideLearnerSelection ? '6. Reference & Bank Details' : '7. Reference & Bank Details'}
          </Label>
          <div className="rounded-2xl border border-slate-100 p-4 bg-white space-y-3">
            {paymentMethod === 'cash' && (
              <>
                <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl">
                  <User size={16} className="text-emerald-600 flex-shrink-0" />
                  <Label className="text-xs font-black uppercase tracking-widest text-emerald-700">
                    Received By (Staff Name)
                  </Label>
                </div>
                <Input
                  value={receivedBy}
                  onChange={e => { setReceivedBy(e.target.value); setErrorMsg(''); }}
                  placeholder="e.g. Jane Mwangi"
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-800"
                />
                <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl">
                  <Calendar size={16} className="text-emerald-600 flex-shrink-0" />
                  <Label className="text-xs font-black uppercase tracking-widest text-emerald-700">Payment Date</Label>
                </div>
                <Input
                  type="date"
                  value={cashDate}
                  onChange={e => setCashDate(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-800"
                />
              </>
            )}
            {paymentMethod === 'bank' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Building size={13} className="text-blue-600" />
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bank Name</Label>
                    </div>
                    <Input
                      value={bankName}
                      onChange={e => { setBankName(e.target.value); setErrorMsg(''); }}
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
                      value={bankBranch}
                      onChange={e => setBankBranch(e.target.value)}
                      placeholder="e.g. Eldoret CBD"
                      className="h-11 rounded-xl bg-slate-50 border-none font-bold text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Hash size={13} className="text-blue-600" />
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Transaction / Reference Number
                    </Label>
                  </div>
                  <Input
                    value={bankRef}
                    onChange={e => { setBankRef(e.target.value); setErrorMsg(''); }}
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
                  value={bankDate}
                  onChange={e => setBankDate(e.target.value)}
                  className="h-11 rounded-xl bg-slate-50 border-none font-bold text-sm"
                />
              </>
            )}
            {paymentMethod === 'cheque' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Building size={13} className="text-amber-600" />
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bank Name</Label>
                    </div>
                    <Input
                      value={chequeBankName}
                      onChange={e => { setChequeBankName(e.target.value); setErrorMsg(''); }}
                      placeholder="e.g. KCB Bank"
                      className="h-11 rounded-xl bg-slate-50 border-none font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-amber-600" />
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Branch</Label>
                    </div>
                    <Input
                      value={chequeBranch}
                      onChange={e => setChequeBranch(e.target.value)}
                      placeholder="e.g. Town Branch"
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
                    onChange={e => { setChequeNumber(e.target.value); setErrorMsg(''); }}
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
                  value={chequeDate}
                  onChange={e => setChequeDate(e.target.value)}
                  className="h-11 rounded-xl bg-slate-50 border-none font-bold text-sm"
                />
              </>
            )}
            {paymentMethod === 'mpesa' && (
              <>
                <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-xl">
                  <Smartphone size={16} className="text-violet-600 flex-shrink-0" />
                  <div>
                    <Label className="text-xs font-black uppercase tracking-widest text-violet-700">
                      M-Pesa Receipt Number
                    </Label>
                    <p className="text-[10px] text-violet-400 font-medium mt-0.5">
                      Found on the customer's M-Pesa SMS confirmation
                    </p>
                  </div>
                </div>
                <Input
                  value={mpesaReceipt}
                  onChange={e => { setMpesaReceipt(e.target.value.toUpperCase()); setErrorMsg(''); }}
                  placeholder="e.g. QG7XXXXXXX"
                  className="h-12 rounded-xl bg-slate-50 border-none font-mono font-bold text-sm tracking-wider"
                  maxLength={12}
                />
                <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-xl">
                  <Calendar size={16} className="text-violet-600 flex-shrink-0" />
                  <Label className="text-xs font-black uppercase tracking-widest text-violet-700">Payment Date</Label>
                </div>
                <Input
                  type="date"
                  value={mpesaDate}
                  onChange={e => setMpesaDate(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-800"
                />
              </>
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

export default UnifiedRecordPaymentModal;