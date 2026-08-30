"use client";

import React, { useRef, useEffect } from 'react';
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

interface ReceiptData {
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

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
  onDownload?: () => void;
  onPrint?: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
  onDownload,
  onPrint
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  // Handle Escape key to close the modal
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handlePrint = () => {
    if (!receiptRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = receiptRef.current.cloneNode(true) as HTMLElement;
    
    // Remove action buttons from print version
    const actionButtons = printContent.querySelectorAll('[data-no-print]');
    actionButtons.forEach(btn => btn.remove());

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receiptData?.receiptNumber}</title>
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
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleDownload = () => {
    if (!receiptRef.current) return;
    
    const receiptContent = receiptRef.current.cloneNode(true) as HTMLElement;
    const actionButtons = receiptContent.querySelectorAll('[data-no-print]');
    actionButtons.forEach(btn => btn.remove());

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receiptData?.receiptNumber}</title>
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
        ${receiptRef.current?.outerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${receiptData?.receiptNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    onDownload?.();
  };

  if (!isOpen || !receiptData) return null;

  // Handle backdrop click to close (only if click is directly on backdrop)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h3 id="receipt-modal-title" className="text-lg font-bold text-slate-900">Payment Receipt</h3>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close receipt modal"
          >
            <X size={20} />
          </button>
        </div>

        <div ref={receiptRef} className="p-6 receipt-container">
          {/* Header */}
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

          {/* Receipt Title */}
          <h2 className="receipt-title">Official Payment Receipt</h2>

          {/* Status Badge */}
          <div className="flex justify-center mb-6">
            <Badge className="px-4 py-2 text-sm font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={16} className="mr-2" />
              {receiptData.status === 'Cleared' || receiptData.status === 'Paid' ? 'PAID' : receiptData.status}
            </Badge>
          </div>

          {/* Receipt Meta Grid */}
          <div className="receipt-meta grid grid-cols-2 gap-4 mb-6">
            <div className="meta-item">
              <div className="meta-label">Receipt Number</div>
              <div className="meta-value font-mono">{receiptData.receiptNumber}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Invoice Number</div>
              <div className="meta-value font-mono">{receiptData.invoiceNumber}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Date & Time</div>
              <div className="meta-value">{receiptData.date}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Term / Year</div>
              <div className="meta-value">{receiptData.term} / {receiptData.year}</div>
            </div>
          </div>

          {/* Amount Box */}
          <div className="amount-box">
            <div className="amount-label">Amount Paid</div>
            <div className="amount-value">{receiptData.currency} {receiptData.amount.toLocaleString()}</div>
          </div>

          {/* Payment Details Table */}
          <table className="details-table">
            <thead>
              <tr>
                <th>Detail</th>
                <th>Information</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Student / Payer Name</td>
                <td>{receiptData.studentName}</td>
              </tr>
              <tr>
                <td>Reference / ID</td>
                <td>{receiptData.admNo}</td>
              </tr>
              <tr>
                <td>Grade / Stream</td>
                <td>{receiptData.grade} {receiptData.stream ? `· ${receiptData.stream}` : ''}</td>
              </tr>
              <tr>
                <td>Plan / Subscription</td>
                <td>{receiptData.term} {receiptData.year}</td>
              </tr>
              <tr>
                <td>Payment Method</td>
                <td>{receiptData.paymentMethod}</td>
              </tr>
              <tr>
                <td>Transaction Reference</td>
                <td className="font-mono">{receiptData.transactionRef}</td>
              </tr>
              {receiptData.receivedBy && (
                <tr>
                  <td>Received By</td>
                  <td>{receiptData.receivedBy}</td>
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

          <div className="signature-line">
            Authorized Signature & Stamp
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 z-10 bg-white border-t px-6 py-4 flex justify-center gap-3 rounded-b-2xl" data-no-print="true">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handlePrint();
            }}
            className="rounded-xl h-11 px-6 gap-2"
          >
            <Printer size={18} /> Print Receipt
          </Button>
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="rounded-xl h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-100"
          >
            <Download size={18} /> Download Receipt (HTML)
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="rounded-xl h-11 px-6"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;