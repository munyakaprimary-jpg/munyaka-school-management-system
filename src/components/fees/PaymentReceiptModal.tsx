"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Transaction } from '@/types/fees';

export interface PaymentReceiptData {
  receiptNumber: string;
  invoiceNumber: string;
  studentName: string;
  admNo: string;
  grade: string;
  stream: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionRef: string;
  date: string;
  term: string;
  year: string;
  status: string;
  receivedBy?: string;
}

export interface PaymentReceiptModalProps {
  isOpen: boolean;
  receiptData: PaymentReceiptData | null;
  onClose: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
}

/**
 * PaymentReceiptModal
 *
 * A self-contained, fully working modal for displaying payment receipts.
 * 
 * This wrapper handles the close button explicitly and reliably:
 *   1. The X button (top-right) has a working onClick that calls onClose
 *   2. The "Close" button (footer) has a working onClick that calls onClose
 *   3. The backdrop click closes the modal only if the click target is
 *      the backdrop itself (not any of its child elements)
 *   4. The Escape key closes the modal
 *   5. Body scroll is locked while the modal is open
 *
 * All children have `pointer-events-auto` and `cursor-pointer` so clicks
 * always reach the intended target. The modal content box has
 * `relative z-[60]` so it stacks above the backdrop, and the X
 * button has `relative z-[80]` so it always sits on top of any
 * overlapping elements.
 */
const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  receiptData,
  onClose,
  onDownload,
  onPrint,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  // ============================================
  // HOOKS — Must be called in the same order on every render
  // (Rules of Hooks). Even when isOpen is false, we still run
  // the hooks but bail out of the JSX return.
  // ============================================

  // Escape-key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Body-scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // ============================================
  // EARLY RETURN — placed AFTER all hooks have run so we satisfy
  // the Rules of Hooks.
  // ============================================
  if (!isOpen || !receiptData) return null;

  // Dynamic Learner Lookup & Property Mapping from receiptData / localStorage
  const lookupLearner = () => {
    try {
      const allLearners = JSON.parse(localStorage.getItem('munyaka_learners_db') || '[]');
      const studentId = (receiptData as any).studentId || (receiptData as any).learnerId;
      const found = allLearners.find((l: any) =>
        (studentId && (l.id === studentId || l.admNo === studentId || l.admissionNo === studentId)) ||
        (receiptData.admNo && (l.admNo === receiptData.admNo || l.admissionNo === receiptData.admNo)) ||
        (receiptData.studentName && l.name?.toLowerCase() === receiptData.studentName.toLowerCase())
      );
      if (found) return found;
    } catch {}
    return null;
  };

  const matchedLearner = lookupLearner();
  const displayName = (receiptData as any).learnerName || receiptData.studentName || matchedLearner?.fullName || matchedLearner?.name || `${matchedLearner?.firstName || ''} ${matchedLearner?.lastName || ''}`.trim() || "N/A";
  const displayAdm = (receiptData as any).admissionNo || receiptData.admNo || matchedLearner?.admissionNo || matchedLearner?.admNo || matchedLearner?.admissionNumber || matchedLearner?.id || "N/A";

  const enrichedReceiptData = {
    ...receiptData,
    studentName: String(displayName).toUpperCase(),
    admNo: String(displayAdm),
  };

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Close the modal. We wrap it in a function so we can attach
   * stopPropagation() at every call site. This prevents the click
   * event from bubbling up to the backdrop overlay and triggering
   * the backdrop's onClick handler (which would call onClose again
   * — not a functional bug, but defensive).
   */
  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  /**
   * Backdrop click handler. Only closes the modal if the click
   * target IS the backdrop (i.e. the user clicked the dark overlay,
   * not any of the modal's child elements like the close button).
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  /**
   * Print the receipt. We open a new window, write a self-contained
   * HTML document containing a clone of the receipt, then trigger
   * the browser's print dialog.
   */
  const handlePrint = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = receiptRef.current.cloneNode(true) as HTMLElement;
    printContent.querySelectorAll('[data-no-print]').forEach(btn => btn.remove());

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Receipt - ${enrichedReceiptData.receiptNumber}</title>
  <style>
    @media print {
      @page { size: A4; margin: 15mm; }
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; }
      .no-print { display: none !important; }
      .receipt-container { box-shadow: none; border: 1px solid #333; }
    }
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
  </style>
</head>
<body>
  ${printContent.outerHTML}
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);

    onPrint?.();
  };

  /**
   * Download the receipt as an HTML file.
   */
  const handleDownload = () => {
    if (!receiptRef.current) return;
    const receiptContent = receiptRef.current.cloneNode(true) as HTMLElement;
    receiptContent.querySelectorAll('[data-no-print]').forEach(btn => btn.remove());

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Receipt - ${enrichedReceiptData.receiptNumber}</title>
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
  </style>
</head>
<body>
  ${receiptRef.current.outerHTML}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${enrichedReceiptData.receiptNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onDownload?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-receipt-modal-title"
    >
      {/*
        MODAL CONTAINER
        - relative z-[60] stacks it above the backdrop (z-50)
        - pointer-events-auto (inherited, but explicit for clarity)
          ensures every child button receives clicks
        - onClick stopPropagation prevents any click INSIDE the modal
          from bubbling to the backdrop (which would also call
          onClose)
      */}
      <div
        className="relative z-[60] bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Sticky header with working close button ─── */}
        <div className="sticky top-0 z-[70] bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h3 id="payment-receipt-modal-title" className="text-lg font-bold text-slate-900">
            Payment Receipt
          </h3>

          {/*
            FIX: X close button
            1. onClick → handleCloseClick → e.stopPropagation() + onClose()
            2. type="button" prevents default form-submit behaviour
            3. pointer-events-auto (inherited, but explicit for clarity)
            4. cursor-pointer for visual feedback
            5. z-[80] stacks it above the sticky header so the button
               is always visible/clickable above any scroll overlap
            6. aria-label for screen-reader accessibility
          */}
          <button
            type="button"
            onClick={handleCloseClick}
            className="relative z-[80] p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer pointer-events-auto"
            aria-label="Close receipt modal"
            data-testid="receipt-modal-close-button"
          >
            <X size={20} />
          </button>
        </div>

        {/* ─── Receipt content (scrolls) ─── */}
        <div
          ref={receiptRef}
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
              {enrichedReceiptData.status === 'Cleared' || enrichedReceiptData.status === 'Paid' ? 'PAID' : enrichedReceiptData.status}
            </Badge>
          </div>

          {/* Meta */}
          <div className="receipt-meta grid grid-cols-2 gap-4 mb-6">
            <div className="meta-item">
              <div className="meta-label">Receipt Number</div>
              <div className="meta-value font-mono">{enrichedReceiptData.receiptNumber}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Invoice Number</div>
              <div className="meta-value font-mono">{enrichedReceiptData.invoiceNumber}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Date & Time</div>
              <div className="meta-value">{enrichedReceiptData.date}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Term / Year</div>
              <div className="meta-value">{enrichedReceiptData.term} / {enrichedReceiptData.year}</div>
            </div>
          </div>

          {/* Amount box */}
          <div className="amount-box">
            <div className="amount-label">Amount Paid</div>
            <div className="amount-value">{enrichedReceiptData.currency} {enrichedReceiptData.amount.toLocaleString()}</div>
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
              <tr>
                <td>Learner Name</td>
                <td><strong>{enrichedReceiptData.studentName}</strong></td>
              </tr>
              <tr>
                <td>Admission No.</td>
                <td><strong className="font-mono">{enrichedReceiptData.admNo}</strong></td>
              </tr>
              <tr>
                <td>Grade / Stream</td>
                <td>{enrichedReceiptData.grade} {enrichedReceiptData.stream ? `· ${enrichedReceiptData.stream}` : ''}</td>
              </tr>
              <tr>
                <td>Plan / Subscription</td>
                <td>{enrichedReceiptData.term} {enrichedReceiptData.year}</td>
              </tr>
              <tr>
                <td>Payment Method</td>
                <td>{enrichedReceiptData.paymentMethod}</td>
              </tr>
              <tr>
                <td>Transaction Reference</td>
                <td className="font-mono">{enrichedReceiptData.transactionRef}</td>
              </tr>
              {enrichedReceiptData.receivedBy && (
                <tr>
                  <td>Received By</td>
                  <td>{enrichedReceiptData.receivedBy}</td>
                </tr>
              )}
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
          {/*
            FIX: Print button
            - type="button" → no form-submit
            - onClick → handlePrint (which also calls onPrint)
            - e.stopPropagation() prevents bubbling to backdrop
            - pointer-events-auto inherited (explicit for clarity)
            - cursor-pointer for visual feedback
          */}
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handlePrint();
            }}
            className="rounded-xl h-11 px-6 gap-2 cursor-pointer pointer-events-auto"
          >
            <Printer size={18} /> Print Receipt
          </Button>

          {/*
            FIX: Download button
          */}
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="rounded-xl h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-100 cursor-pointer pointer-events-auto"
          >
            <Download size={18} /> Download Receipt (HTML)
          </Button>

          {/*
            FIX: Close button
            - Uses handleCloseClick which calls onClose()
            - e.stopPropagation() prevents backdrop click
          */}
          <Button
            type="button"
            variant="ghost"
            onClick={handleCloseClick}
            className="rounded-xl h-11 px-6 cursor-pointer pointer-events-auto"
            data-testid="receipt-modal-close-footer"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceiptModal;