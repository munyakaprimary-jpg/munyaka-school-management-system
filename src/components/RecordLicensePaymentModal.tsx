"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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
  Smartphone as DeviceIcon,
  Building,
  Hash,
  MapPin,
  Calendar,
} from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import {
  LicenseMethod,
  LICENSE_METHOD_LABELS,
  ValidityDuration,
  License,
} from '@/types/license';
import { issueLicense } from '@/services/licenseService';
import { cn } from '@/lib/utils';

interface RecordLicensePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When a license is successfully issued */
  onIssued: (license: License) => void;
  /** The owner/admin identifier — pre-filled from auth */
  defaultIssuedTo: string;
  /** Pre-selected subscription name (optional) */
  defaultSubscriptionName?: string;
}

// Method option list
const METHODS: { value: LicenseMethod; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { value: 'cash',   label: 'Cash',                icon: Banknote,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { value: 'bank',   label: 'Bank Deposit / EFT',  icon: Landmark,  color: 'text-blue-600',    bg: 'bg-blue-50' },
  { value: 'cheque', label: 'Cheque',              icon: Receipt,   color: 'text-amber-600',   bg: 'bg-amber-50' },
  { value: 'mpesa',  label: 'M-Pesa',              icon: Smartphone, color: 'text-violet-600', bg: 'bg-violet-50' },
];

const VALIDITY_OPTIONS: { value: string; days: ValidityDuration; label: string; }[] = [
  { value: '30',  days: 30,  label: '30 Days (Trial)' },
  { value: '365', days: 365, label: '1 Year' },
  { value: '730', days: 730, label: '2 Years' },
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

const RecordLicensePaymentModal = ({
  isOpen,
  onClose,
  onIssued,
  defaultIssuedTo,
  defaultSubscriptionName = '',
}: RecordLicensePaymentModalProps) => {
  // Form state
  const [issuedTo, setIssuedTo] = useState(defaultIssuedTo);
  const [paymentMethod, setPaymentMethod] = useState<LicenseMethod>('cash');
  const [refNumber, setRefNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [branch, setBranch] = useState('');
  const [validityDays, setValidityDays] = useState<ValidityDuration>(365);
  const [subscriptionName, setSubscriptionName] = useState(defaultSubscriptionName);
  const [autoRenew, setAutoRenew] = useState(false);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // Result state — show generated code after issuing
  const [issuedLicense, setIssuedLicense] = useState<License | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset on open/close
  React.useEffect(() => {
    if (isOpen) {
      setIssuedTo(defaultIssuedTo);
      setSubscriptionName(defaultSubscriptionName);
      setPaymentMethod('cash');
      setRefNumber('');
      setAmount('');
      setBankName('');
      setBranch('');
      setValidityDays(365);
      setAutoRenew(false);
      setNotes('');
      setErrorMsg('');
      setIssuedLicense(null);
      setCopied(false);
    }
  }, [isOpen, defaultIssuedTo, defaultSubscriptionName]);

  const validate = (): string => {
    if (!issuedTo.trim()) return 'Please enter the recipient / institution name.';
    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return 'Please enter a valid amount paid.';
    }
    if (paymentMethod !== 'cash' && !refNumber.trim()) {
      return `Please enter the ${paymentMethod === 'mpesa' ? 'M-Pesa receipt' : paymentMethod === 'cheque' ? 'cheque' : 'transaction reference'} number.`;
    }
    if (paymentMethod === 'bank' && !bankName.trim()) {
      return 'Please enter the bank name for the deposit.';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setErrorMsg(err); return; }
    setIsSaving(true);
    setErrorMsg('');

    // Simulate small delay for UX
    await new Promise(r => setTimeout(r, 600));

    try {
      const license = issueLicense({
        issuedTo: issuedTo.trim(),
        deviceId: getDeviceId(),
        validityDays,
        payment: {
          method: paymentMethod,
          refNumber: refNumber.trim() || `CASH-${Date.now().toString().slice(-6)}`,
          amount,
          bankName: bankName.trim() || undefined,
          branch: branch.trim() || undefined,
        },
        autoRenew,
        notes: notes.trim() || (subscriptionName ? `Subscription: ${subscriptionName}` : undefined),
      });

      setIssuedLicense(license);
      setIsSaving(false);
      onIssued(license);
      showSuccess('License payment recorded and activation key generated!');
    } catch (err) {
      setErrorMsg('Failed to issue license. Please try again.');
      setIsSaving(false);
    }
  };

  const copyKey = async () => {
    if (!issuedLicense) return;
    try {
      await navigator.clipboard.writeText(issuedLicense.activationKey);
      setCopied(true);
      showSuccess('Activation key copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  };

  const handleClose = () => {
    setIssuedLicense(null);
    onClose();
  };

  // ── Result: show generated activation key ──
  if (issuedLicense) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Activation Key Generated"
        description="License payment recorded. The activation key is shown below."
        size="lg"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="ghost" onClick={handleClose} className="rounded-xl font-bold h-11 px-6">
              Close
            </Button>
            <Button
              onClick={() => { setIssuedLicense(null); }}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-11 px-6 shadow-lg gap-2 text-white"
            >
              <Receipt size={16} /> Issue Another
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
              <p className="text-sm font-black text-emerald-800">License Successfully Issued</p>
              <p className="text-xs text-emerald-600 font-medium">Valid until {new Date(issuedLicense.expiresAt).toLocaleDateString()}</p>
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
                  {issuedLicense.activationKey}
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
              Share this key with the recipient. They can enter it on the activation screen to unlock the app on their device.
            </p>
          </div>

          {/* License metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Issued To</p>
              <p className="text-sm font-bold text-slate-900 truncate">{issuedLicense.issuedTo}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Device ID</p>
              <p className="text-sm font-bold text-slate-900 font-mono truncate">{issuedLicense.deviceId}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Method</p>
              <p className="text-sm font-bold text-slate-900">{LICENSE_METHOD_LABELS[issuedLicense.payment.method]}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount Paid</p>
              <p className="text-sm font-bold text-slate-900">KES {parseFloat(issuedLicense.payment.amount).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Issued On</p>
              <p className="text-sm font-bold text-slate-900">{new Date(issuedLicense.issuedAt).toLocaleDateString()}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Valid Until</p>
              <p className="text-sm font-bold text-emerald-700">{new Date(issuedLicense.expiresAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  // ── Form: record payment ──
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record License Payment"
      description="Issue a new activation key after receiving a license payment."
      size="lg"
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
            <Key size={16} /> {isSaving ? 'Generating...' : 'Generate Activation Key'}
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

        {/* 1. Recipient / institution */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            1. Issued To (Recipient / Institution)
          </Label>
          <Input
            value={issuedTo}
            onChange={e => { setIssuedTo(e.target.value); setErrorMsg(''); }}
            placeholder="e.g. Munyaka Primary & Junior School"
            className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800"
          />
        </div>

        {/* 2. Subscription (optional) */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            2. Subscription (Optional)
          </Label>
          <Input
            value={subscriptionName}
            onChange={e => setSubscriptionName(e.target.value)}
            placeholder="e.g. Dyad Platform Enterprise"
            className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-800"
          />
        </div>

        {/* 3. Validity duration */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            3. Validity Duration
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {VALIDITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValidityDays(opt.days)}
                className={cn(
                  "p-3 rounded-2xl border-2 transition-all text-center",
                  validityDays === opt.days
                    ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-sm"
                    : "bg-slate-50 border-transparent text-slate-500 hover:border-slate-200"
                )}
              >
                <p className="text-[10px] font-black uppercase tracking-widest">
                  {opt.days === 30 ? 'Trial' : opt.days === 365 ? 'Annual' : 'Biennial'}
                </p>
                <p className="text-sm font-black mt-1">{opt.label.split(' (')[0]}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Payment method */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            4. Payment Method
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {METHODS.map(({ value, label, icon: Icon, color, bg }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setPaymentMethod(value); setErrorMsg(''); }}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all cursor-pointer",
                  paymentMethod === value
                    ? `${bg} border-current ${color} shadow-sm`
                    : "bg-slate-50 border-transparent text-slate-400 hover:border-slate-200"
                )}
              >
                <Icon size={20} />
                <span className="text-[10px] font-black uppercase tracking-wide text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 5. Method-specific fields */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            5. Reference & Amount
          </Label>
          <div className="rounded-2xl border border-slate-100 p-4 bg-white space-y-3">
            {paymentMethod === 'cash' ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Receipt size={13} className="text-emerald-600" />
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Reference (Optional)
                  </Label>
                </div>
                <Input
                  value={refNumber}
                  onChange={e => setRefNumber(e.target.value)}
                  placeholder="Cash receipt # (auto-generated if empty)"
                  className="h-11 rounded-xl bg-slate-50 border-none font-bold text-sm"
                />
              </div>
            ) : paymentMethod === 'bank' ? (
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
                      value={branch}
                      onChange={e => setBranch(e.target.value)}
                      placeholder="e.g. Eldoret CBD"
                      className="h-11 rounded-xl bg-slate-50 border-none font-bold text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Hash size={13} className="text-blue-600" />
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction Reference Number</Label>
                  </div>
                  <Input
                    value={refNumber}
                    onChange={e => { setRefNumber(e.target.value); setErrorMsg(''); }}
                    placeholder="e.g. EFT-2026-001234"
                    className="h-11 rounded-xl bg-slate-50 border-none font-mono text-sm"
                  />
                </div>
              </>
            ) : paymentMethod === 'cheque' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Building size={13} className="text-amber-600" />
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bank Name</Label>
                    </div>
                    <Input
                      value={bankName}
                      onChange={e => { setBankName(e.target.value); setErrorMsg(''); }}
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
                      value={branch}
                      onChange={e => setBranch(e.target.value)}
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
                    value={refNumber}
                    onChange={e => { setRefNumber(e.target.value); setErrorMsg(''); }}
                    placeholder="e.g. 204567"
                    className="h-11 rounded-xl bg-slate-50 border-none font-mono text-sm"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Smartphone size={13} className="text-violet-600" />
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">M-Pesa Receipt Number</Label>
                </div>
                <Input
                  value={refNumber}
                  onChange={e => { setRefNumber(e.target.value.toUpperCase()); setErrorMsg(''); }}
                  placeholder="e.g. QG7XXXXXXX"
                  className="h-11 rounded-xl bg-slate-50 border-none font-mono font-bold text-sm tracking-wider"
                  maxLength={12}
                />
              </div>
            )}

            {/* Amount */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <CreditCard size={13} className="text-slate-500" />
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount Paid (KES)</Label>
              </div>
              <Input
                type="number" min="1"
                value={amount}
                onChange={e => { setAmount(e.target.value); setErrorMsg(''); }}
                placeholder="e.g. 299.00"
                className="h-12 rounded-xl bg-slate-50 border-none font-black text-lg"
              />
            </div>
          </div>
        </div>

        {/* 6. Auto-renew */}
        <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRenew}
            onChange={e => setAutoRenew(e.target.checked)}
            className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <div>
            <p className="text-sm font-bold text-slate-900">Auto-renew license</p>
            <p className="text-[10px] text-slate-500 font-medium">If checked, owner will be prompted to renew before expiry.</p>
          </div>
        </label>

        {/* 7. Notes (optional) */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes (Optional)</Label>
          <Input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any additional notes..."
            className="rounded-xl h-11 bg-slate-50 border-none font-medium text-sm"
          />
        </div>
      </form>
    </Modal>
  );
};

export default RecordLicensePaymentModal;
