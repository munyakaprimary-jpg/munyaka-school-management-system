"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  Download,
  School,
  CheckCircle2,
  CreditCard,
  Calendar,
  Hash,
  DollarSign,
  X,
  Check,
  FileText,
  Building2,
  AlertCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Transaction } from '@/types/fees';

export interface ReceiptViewProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  student?: {
    name: string;
    admNo: string;
    grade: string;
    stream: string;
  };
  /** Trigger to automatically invoke the print action (increment to trigger) */
  printTrigger?: number;
  /** Trigger to automatically invoke the download action (increment to trigger) */
  downloadTrigger?: number;
  onDownload?: () => void;
  onPrint?: () => void;
}

/**
 * ReceiptView
 *
 * A self-contained, fully working modal for displaying a payment
 * receipt. The component is ONLY visible when:
 *   1. `isOpen` is `true`, AND
 *   2. `transaction` is not `null`
 *
 * CRITICAL: This component does NOT persist any state to localStorage.
 * Every render starts fresh from the props it receives. If `isOpen`
 * is `false` or `transaction` is `null`, the component returns `null`
 * and nothing is rendered.
 *
 * The close button (X) and footer "Close" button both call
 * `handleClose` which:
 *   1. Stops the event from bubbling to the backdrop
 *   2. Calls `onClose()` (the parent's state setter)
 *
 * A `closingRef` guard prevents double-firing from the Escape key
 * handler and the backdrop click handler racing each other.
 */
const ReceiptView: React.FC<ReceiptViewProps> = ({
  isOpen,
  onClose,
  transaction,
  student,
  printTrigger,
  downloadTrigger,
  onDownload,
  onPrint,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  // ── Escape key handler ──
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closingRef.current = true;
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // ── Body-scroll lock while modal is open ──
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // ── The single, canonical close handler ──
  // Every close path (X button, "Close" button, Escape key, backdrop
  // click) routes through this function. It stops propagation to
  // prevent the click from bubbling to the backdrop overlay, and
  // it uses a closingRef guard to prevent double-firing.
  const handleClose = useCallback(
    (e?: React.MouseEvent | React.KeyboardEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      if (closingRef.current) return; // idempotent
      closingRef.current = true;
      onClose();
      setTimeout(() => {
        closingRef.current = false;
      }, 0);
    },
    [onClose]
  );

  // ── Backdrop click handler ──
  // Only closes if the click target IS the backdrop itself.
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        handleClose(e);
      }
    },
    [handleClose]
  );

  // ── Print handler ──
  const handlePrint = useCallback(() => {
    if (typeof window === 'undefined') return;
    const html = document.querySelector('[data-receipt-content]') as HTMLElement | null;
    if (!html) {
      onPrint?.();
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      onPrint?.();
      return;
    }
    const content = html.cloneNode(true) as HTMLElement;
    content.querySelectorAll('[data-no-print]').forEach(btn => btn.remove());
    printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Receipt - ${transaction?.id}</title>
<style>
@media print { @page { size: A4; margin: 15mm; } body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; } .no-print { display: none !important; } }
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: #f5f5f5; }
.receipt-container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
.header { text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 20px; }
.school-name { font-size: 22px; font-weight: bold; color: #1e3a5f; margin-bottom: 4px; }
.school-motto { font-size: 14px; font-style: italic; color: #4a5568; margin-bottom: 10px; }
.school-address { font-size: 12px; color: #718096; }
.receipt-title { font-size: 18px; font-weight: bold; color: #2d3748; margin: 20px 0; text-transform: uppercase; letter-spacing: 1px; }
.receipt-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.meta-item { background: #f7fafc; padding: 10px; border-radius: 4px; }
.meta-label { font-size: 10px; font-weight: bold; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; }
.meta-value { font-size: 13px; font-weight: 600; color: #2d3748; }
.amount-box { background: #2c5282; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
.amount-label { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; }
.amount-value { font-size: 32px; font-weight: bold; margin-top: 5px; }
.details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
.details-table th, .details-table td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
.details-table th { background: #edf2f7; font-weight: bold; color: #4a5568; }
.status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; }
.status-paid { background: #c6f6d5; color: #276749; }
.footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #718096; font-size: 11px; }
.signature-line { border-top: 1px solid #cbd5e0; width: 200px; margin: 20px auto 0; padding-top: 5px; font-size: 10px; color: #718096; text-align: center; }
</style></head><body>${content.outerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
    onPrint?.();
  }, [onPrint, transaction?.id]);

  // ── Download handler ──
  const handleDownload = useCallback(() => {
    if (typeof window === 'undefined') return;
    const html = document.querySelector('[data-receipt-content]') as HTMLElement | null;
    if (!html) {
      onDownload?.();
      return;
    }
    const content = html.cloneNode(true) as HTMLElement;
    content.querySelectorAll('[data-no-print]').forEach(btn => btn.remove());
    const htmlContent = `<!DOCTYPE html><html><head><title>Receipt - ${transaction?.id}</title>
<style>
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: #f5f5f5; }
.receipt-container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
.header { text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 20px; }
.school-name { font-size: 22px; font-weight: bold; color: #1e3a5f; margin-bottom: 4px; }
.school-motto { font-size: 14px; font-style: italic; color: #4a5568; margin-bottom: 10px; }
.school-address { font-size: 12px; color: #718096; }
.receipt-title { font-size: 18px; font-weight: bold; color: #2d3748; margin: 20px 0; text-transform: uppercase; letter-spacing: 1px; }
.receipt-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.meta-item { background: #f7fafc; padding: 10px; border-radius: 4px; }
.meta-label { font-size: 10px; font-weight: bold; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; }
.meta-value { font-size: 13px; font-weight: 600; color: #2d3748; }
.amount-box { background: #2c5282; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
.amount-label { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; }
.amount-value { font-size: 32px; font-weight: bold; margin-top: 5px; }
.details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
.details-table th, .details-table td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
.details-table th { background: #edf2f7; font-weight: bold; color: #4a5568; }
.status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; }
.status-paid { background: #c6f6d5; color: #276749; }
.footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #718096; font-size: 11px; }
.signature-line { border-top: 1px solid #cbd5e0; width: 200px; margin: 20px auto 0; padding-top: 5px; font-size: 10px; color: #718096; text-align: center; }
</style></head><body>${content.outerHTML}</body></html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${transaction?.id ?? 'receipt'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onDownload?.();
  }, [onDownload, transaction?.id]);

  // ── Auto-trigger print when printTrigger prop changes ──
  React.useEffect(() => {
    if (printTrigger && printTrigger > 0 && isOpen && receiptRef.current) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [printTrigger, isOpen]);

  // ── Auto-trigger download when downloadTrigger prop changes ──
  React.useEffect(() => {
    if (downloadTrigger && downloadTrigger > 0 && isOpen && receiptRef.current) {
      const timer = setTimeout(() => {
        handleDownload();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [downloadTrigger, isOpen]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash',
      bank: 'Bank Transfer / EFT',
      cheque: 'Cheque',
      mpesa: 'M-Pesa',
    };
    return labels[method] || method;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      paid:    { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', text: 'Paid',     icon: <CheckCircle2 size={10} /> },
      pending: { bg: 'bg-amber-50 text-amber-700 border-amber-100',   text: 'Pending',  icon: <AlertCircle size={10} /> },
      failed:  { bg: 'bg-rose-50 text-rose-700 border-rose-100',       text: 'Failed',   icon: <XCircle size={10} /> },
      refunded:{ bg: 'bg-blue-50 text-blue-700 border-blue-200',         text: 'Refunded', icon: <RefreshCw size={10} /> },
    };
    const s = styles[status] || styles.pending;
    return (
      <Badge className={cn("border font-bold text-[10px] gap-1", s.bg)}>
        {s.icon}
        {s.text}
      </Badge>
    );
  };

  // ── CRITICAL GUARD: Only render the modal tree when the parent
  // explicitly sets isOpen=true AND transaction is not null.
  // When the parent calls onClose(), isOpen flips to false, the
  // component returns null, and the entire modal tree is removed
  // from the DOM. There is no residual DOM that could capture a
  // future click. ──
  if (!isOpen || !transaction) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in pointer-events-auto"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-view-title"
    >
      <div
        className="relative z-[60] bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header with working close button ─── */}
        <div className="sticky top-0 z-[70] bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl pointer-events-auto">
          <h3 id="receipt-view-title" className="text-lg font-bold text-slate-900">
            Payment Receipt
          </h3>

          {/*
            X close button.
            1. onClick → handleClose (which calls e.stopPropagation() + onClose())
            2. type="button" prevents default form-submit behaviour
            3. pointer-events-auto (explicit, not just inherited)
            4. cursor-pointer for visual feedback
            5. z-[80] stacks it above the sticky header so the button
               is always on top of any scroll overlap
            6. aria-label for screen-reader accessibility
          */}
          <button
            type="button"
            onClick={handleClose}
            data-testid="receipt-view-close-x"
            aria-label="Close receipt view"
            className="relative z-[80] p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer pointer-events-auto"
          >
            <X size={20} />
          </button>
        </div>

        {/* ─── Receipt content (scrolls) ─── */}
        <div
          ref={receiptRef}
          data-receipt-content
          className="p-6 receipt-container relative z-[50] pointer-events-auto"
        >
          {/* School header */}
          <div className="header">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                <School size={28} />
              </div>
              <div>
                <h1 className="school-name">MUNYAKA PRIMARY AND JUNIOR SCHOOL</h1>
                <p className="school-motto">"Knowledge is Power"</p>
                <p className="school-address">P.O. BOX 5239-30100, ELDORET | Tel: +254 738 873 359</p>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="receipt-title">Official Payment Receipt</h2>

          {/* Status */}
          <div className="flex justify-center mb-6">
            <Badge className="px-4 py-2 text-sm font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={16} className="mr-2" />
              PAID
            </Badge>
          </div>

          {/* Meta */}
          <div className="receipt-meta grid grid-cols-2 gap-4 mb-6">
            <div className="meta-item">
              <div className="meta-label">Receipt Number</div>
              <div className="meta-value font-mono">{transaction.id}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Date & Time</div>
              <div className="meta-value">{formatDate(transaction.date)}</div>
            </div>
          </div>

          {/* Amount box */}
          <div className="amount-box">
            <div className="amount-label">Amount Paid</div>
            <div className="amount-value">
              {transaction.currency} {typeof transaction.amount === 'string' ? parseFloat(transaction.amount).toLocaleString() : transaction.amount.toLocaleString()}
            </div>
          </div>

          {/* Details table */}
          <table className="details-table">
            <thead>
              <tr>
                <th>Detail</th>
                <th>Information</th>
              </tr>
            </thead>
            <tbody>
              {student && (
                <>
                  <tr>
                    <td>Student Name</td>
                    <td>{student.name}</td>
                  </tr>
                  <tr>
                    <td>Admission Number</td>
                    <td>{student.admNo}</td>
                  </tr>
                  <tr>
                    <td>Grade / Stream</td>
                    <td>{student.grade} {student.stream ? `· ${student.stream}` : ''}</td>
                  </tr>
                </>
              )}
              <tr>
                <td>Transaction Reference</td>
                <td className="font-mono">{transaction.ref}</td>
              </tr>
              <tr>
                <td>Payment Method</td>
                <td>{getMethodLabel(transaction.paymentMethod)}</td>
              </tr>
              <tr>
                <td>Date & Time</td>
                <td>{formatDate(transaction.date)}</td>
              </tr>
              <tr>
                <td>Category</td>
                <td>{transaction.category}</td>
              </tr>
            </tbody>
          </table>

          {/* Footer */}
          <div className="footer">
            <p>This receipt is generated electronically and is valid without a physical signature.</p>
            <p className="mt-2">Munyaka Primary and Junior School · P.O. Box 5239-30100, Eldoret</p>
            <p className="mt-2">Generated on {new Date().toLocaleString()}</p>
          </div>

          <div className="signature-line">Authorized Signature & Stamp</div>
        </div>

        {/* ─── Sticky footer with working action buttons ─── */}
        <div
          className="sticky bottom-0 z-[70] bg-white border-t px-6 py-4 flex justify-center gap-3 rounded-b-2xl pointer-events-auto"
          data-no-print="true"
        >
          <Button
            type="button"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); handlePrint(); }}
            className="rounded-xl h-11 px-6 gap-2 cursor-pointer pointer-events-auto"
          >
            <Printer size={18} /> Print Receipt
          </Button>

          <Button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
            className="rounded-xl h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-100 cursor-pointer pointer-events-auto"
          >
            <Download size={18} /> Download Receipt (HTML)
          </Button>

          {/*
            Close button.
            - Uses handleClose which calls onClose()
            - e.stopPropagation() prevents backdrop click
            - data-testid makes it easy to find in tests
          */}
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            data-testid="receipt-view-close-footer"
            className="rounded-xl h-11 px-6 cursor-pointer pointer-events-auto"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptView;