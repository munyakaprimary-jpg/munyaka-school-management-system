"use client";

import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Transaction } from '@/types/fees';
import {
  Printer,
  Download,
  School,
  CheckCircle2,
  Smartphone,
  Landmark,
  CreditCard,
  FileText,
} from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';

interface FeeReceiptProps {
  student: {
    student: string;
    admNo: string;
    grade: string;
    stream: string;
    total: number;
    paid: number;
    balance: number;
    status: string;
  };
  transaction: Transaction;
  year: string;
  term: string;
  onDownload?: () => void;
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank Transfer / EFT',
  cheque: 'Cheque',
  mpesa: 'M-Pesa',
};

const METHOD_ICONS: Record<string, React.ElementType> = {
  cash: CreditCard,
  bank: Landmark,
  cheque: FileText,
  mpesa: Smartphone,
};

const FeeReceipt = ({ student, transaction, year, term, onDownload }: FeeReceiptProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const MethodIcon = METHOD_ICONS[transaction.paymentMethod] ?? CreditCard;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Fee Receipt — ${student.student}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #1e293b; max-width: 600px; margin: 0 auto; }
            .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
            .logo { width: 56px; height: 56px; background: #4f46e5; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; }
            .school-name { font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
            .school-tagline { font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 2px; }
            .receipt-title { background: #f1f5f9; border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
            .receipt-label { font-size: 13px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 2px; }
            .receipt-num { font-size: 13px; font-weight: 700; color: #4f46e5; font-family: monospace; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .card { background: #f8fafc; border-radius: 12px; padding: 14px 16px; border: 1px solid #e2e8f0; }
            .card-label { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; }
            .card-value { font-size: 14px; font-weight: 700; color: #0f172a; }
            .card-value.large { font-size: 18px; font-weight: 900; }
            .card-value.green { color: #16a34a; }
            .card-value.red { color: #dc2626; }
            .divider { border: none; border-top: 1px dashed #e2e8f0; margin: 20px 0; }
            .amount-box { background: #4f46e5; color: white; border-radius: 16px; padding: 20px 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
            .amount-label { font-size: 12px; font-weight: 700; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; }
            .amount-value { font-size: 28px; font-weight: 900; }
            .payment-row { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; background: #f8fafc; border-radius: 12px; padding: 14px 16px; border: 1px solid #e2e8f0; }
            .payment-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
            .payment-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
            .payment-value { font-size: 14px; font-weight: 700; color: #0f172a; }
            .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
            .detail-item { display: flex; flex-direction: column; }
            .detail-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
            .detail-value { font-size: 13px; font-weight: 600; color: #334155; }
            .footer { border-top: 2px solid #e2e8f0; padding-top: 16px; text-align: center; }
            .footer-text { font-size: 11px; color: #94a3b8; line-height: 1.6; }
            .status-badge { display: inline-block; background: #dcfce7; color: #16a34a; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Fee Receipt — ${student.student}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #1e293b; max-width: 600px; margin: 0 auto; }
    .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
    .logo { width: 56px; height: 56px; background: #4f46e5; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; }
    .school-name { font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
    .school-tagline { font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 2px; }
    .receipt-title { background: #f1f5f9; border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .receipt-label { font-size: 13px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 2px; }
    .receipt-num { font-size: 13px; font-weight: 700; color: #4f46e5; font-family: monospace; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .card { background: #f8fafc; border-radius: 12px; padding: 14px 16px; border: 1px solid #e2e8f0; }
    .card-label { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; }
    .card-value { font-size: 14px; font-weight: 700; color: #0f172a; }
    .card-value.large { font-size: 18px; font-weight: 900; }
    .card-value.green { color: #16a34a; }
    .card-value.red { color: #dc2626; }
    .divider { border: none; border-top: 1px dashed #e2e8f0; margin: 20px 0; }
    .amount-box { background: #4f46e5; color: white; border-radius: 16px; padding: 20px 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .amount-label { font-size: 12px; font-weight: 700; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; }
    .amount-value { font-size: 28px; font-weight: 900; }
    .payment-row { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; background: #f8fafc; border-radius: 12px; padding: 14px 16px; border: 1px solid #e2e8f0; }
    .payment-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .payment-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
    .payment-value { font-size: 14px; font-weight: 700; color: #0f172a; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
    .detail-item { display: flex; flex-direction: column; }
    .detail-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
    .detail-value { font-size: 13px; font-weight: 600; color: #334155; }
    .footer { border-top: 2px solid #e2e8f0; padding-top: 16px; text-align: center; }
    .footer-text { font-size: 11px; color: #94a3b8; line-height: 1.6; }
    .status-badge { display: inline-block; background: #dcfce7; color: #16a34a; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  ${content.innerHTML}
</body>
</html>`);
    printWindow.document.close();
    const link = printWindow.document.createElement('a');
    link.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(printWindow.document.documentElement.outerHTML);
    link.download = `fee_receipt_${transaction.id}_${student.admNo || student.student.replace(/\s+/g, '_')}.html`;
    link.click();
    onDownload?.();
    showSuccess('Receipt downloaded successfully.');
  };

  const methodBgColors: Record<string, string> = {
    cash: 'bg-emerald-50 text-emerald-600',
    bank: 'bg-blue-50 text-blue-600',
    cheque: 'bg-amber-50 text-amber-600',
    mpesa: 'bg-violet-50 text-violet-600',
  };

  const methodBgColor = methodBgColors[transaction.paymentMethod] ?? 'bg-slate-50 text-slate-600';

  // Render method-specific detail rows
  const renderPaymentDetails = () => {
    const details = transaction.paymentDetails as Record<string, string>;
    if (!details || Object.keys(details).length === 0) return null;
    return (
      <div className="mt-3 pt-3 border-t border-dashed border-slate-200">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Payment Details</p>
        <div className="detail-grid">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="detail-item">
              <span className="detail-label">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
              </span>
              <span className="detail-value font-mono">{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex gap-2 justify-end print:hidden">
        <Button
          variant="outline"
          onClick={handlePrint}
          className="rounded-xl h-10 text-xs font-bold border-slate-200 gap-1.5"
        >
          <Printer size={14} /> Print Receipt
        </Button>
        <Button
          onClick={handleDownload}
          className="rounded-xl h-10 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-lg"
        >
          <Download size={14} /> Download Receipt
        </Button>
      </div>

      {/* Receipt card — this gets printed/exported */}
      <div
        ref={printRef}
        className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-8 py-6 border-b-2 border-slate-100">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
            <School size={28} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-none">MUNYAKA PRIMARY & JUNIOR</h3>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
              P.O. Box 5239, Eldoret • Fee Payment Receipt
            </p>
          </div>
        </div>

        {/* Receipt number & date */}
        <div className="flex items-center justify-between mx-8 mt-6 bg-slate-50 rounded-2xl px-5 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Receipt No.</p>
            <p className="text-sm font-bold font-mono text-indigo-600">{transaction.id}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date Issued</p>
            <p className="text-sm font-bold text-slate-700">{transaction.date}</p>
          </div>
        </div>

        {/* Student info grid */}
        <div className="grid grid-cols-2 gap-3 mx-8 mt-5">
          {[
            { label: 'Learner Name', value: student.student, large: true },
            { label: 'Admission No.', value: student.admNo || '—' },
            { label: 'Grade / Stream', value: `${student.grade}${student.stream ? ' · ' + student.stream : ''}` },
            { label: 'Academic Period', value: `${term.toUpperCase()} ${year}` },
          ].map(({ label, value, large }) => (
            <div key={label} className="bg-slate-50 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
              <p className={cn("font-bold text-slate-900", large ? "text-base font-black" : "text-sm")}>{value}</p>
            </div>
          ))}
        </div>

        {/* Amount paid — hero box */}
        <div className="mx-8 mt-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[1.5rem] px-8 py-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Amount Received</p>
            <p className="text-4xl font-black text-white mt-1">
              KES {transaction.amount.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Payment Method</p>
            <p className="text-base font-black text-white mt-1">{METHOD_LABELS[transaction.paymentMethod] ?? transaction.paymentMethod}</p>
          </div>
        </div>

        {/* Payment method badge + method details */}
        <div className="mx-8 mt-5">
          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-5 py-4">
            <div className={cn("p-2.5 rounded-xl flex-shrink-0", methodBgColor)}>
              <MethodIcon size={18} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Method</p>
              <p className="text-sm font-bold text-slate-900">{METHOD_LABELS[transaction.paymentMethod] ?? transaction.paymentMethod}</p>
              {transaction.ref && (
                <p className="text-xs font-mono text-slate-400 mt-0.5">Ref: {transaction.ref}</p>
              )}
            </div>
            <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
          </div>
          {renderPaymentDetails()}
        </div>

        {/* Running balance */}
        <div className="mx-8 mt-5">
          <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-5 py-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Fee</p>
              <p className="text-base font-black text-slate-900">KES {student.total.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paid So Far</p>
              <p className="text-base font-black text-emerald-600">KES {student.paid.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Balance</p>
              <p className={cn("text-base font-black", student.balance > 0 ? "text-rose-600" : "text-emerald-600")}>
                KES {student.balance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 mx-8 mb-8 border-t-2 border-dashed border-slate-200 pt-5 text-center">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            This receipt is issued electronically and is valid without a signature.<br />
            <strong className="text-slate-500">Munyaka Primary & Junior School</strong> — Fees Office
          </p>
          <p className="text-[10px] font-mono text-slate-300 mt-2">
            Generated: {new Date().toLocaleString()} &nbsp;|&nbsp; Ref: {transaction.id}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeeReceipt;
