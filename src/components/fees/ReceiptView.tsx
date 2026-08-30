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

interface ReceiptViewProps {
  transaction: Transaction;
  student?: {
    name: string;
    admNo: string;
    grade: string;
    stream: string;
  };
  onClose: () => void;
  onPrint: () => void;
  onDownload: () => void;
}

const ReceiptView: React.FC<ReceiptViewProps> = ({
  transaction,
  student,
  onClose,
  onPrint,
  onDownload
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

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
        <title>Receipt - ${transaction.id}</title>
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
        ${receiptRef.current?.outerHTML}
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
        <title>Receipt - ${transaction.id}</title>
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
    link.download = `Receipt_${transaction.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
      paid:   { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', text: 'Paid', icon: <CheckCircle2 size={10} /> },
      pending:{ bg: 'bg-amber-50 text-amber-700 border-amber-100', text: 'Pending', icon: <AlertCircle size={10} /> },
      failed: { bg: 'bg-rose-50 text-rose-700 border-rose-100', text: 'Failed', icon: <XCircle size={10} /> },
      refunded:{ bg: 'bg-blue-50 text-blue-700 border-blue-100', text: 'Refunded', icon: <RefreshCw size={10} /> },
    };
    const s = styles[status] || styles.pending;
    return (
      <Badge className={cn("border font-bold text-[10px] gap-1", s.bg)}>
        {s.icon} {s.text}
      </Badge>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Payment Receipt</h3>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
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
          <h2 className="text-center text-xl font-bold text-slate-900 mb-2 uppercase tracking-wider">Official Payment Receipt</h2>

          {/* Status Badge */}
          <div className="flex justify-center mb-6">
            <Badge className="px-4 py-2 text-sm font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={16} className="mr-2" />
              PAID
            </Badge>
          </div>

          {/* Receipt Meta Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Receipt Number</div>
              <div className="font-mono font-bold text-slate-900">{transaction.id}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Invoice Number</div>
              <div className="font-mono font-bold text-slate-900">{transaction.invoiceId || '—'}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Date & Time</div>
              <div className="font-bold text-slate-900">{formatDate(transaction.date)}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Payment Method</div>
              <div className="font-bold text-slate-900">{getMethodLabel(transaction.paymentMethod)}</div>
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-center text-white mb-6">
            <div className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-1">Amount Paid</div>
            <div className="text-4xl font-black">
              {transaction.currency} {transaction.amount.toLocaleString()}
            </div>
          </div>

          {/* Payment Details Table */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Detail</th>
                <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Information</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {student && (
                <>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-600">Student Name</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{student.name}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-600">Admission Number</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{student.admNo}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-600">Grade / Stream</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{student.grade} {student.stream ? `· ${student.stream}` : ''}</td>
                  </tr>
                </>
              )}
              <tr>
                <td className="px-4 py-3 font-medium text-slate-600">Transaction Reference</td>
                <td className="px-4 py-3 font-mono font-bold text-slate-900">{transaction.ref}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-slate-600">Payment Method</td>
                <td className="px-4 py-3 font-bold text-slate-900">{getMethodLabel(transaction.paymentMethod)}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-slate-600">Date & Time</td>
                <td className="px-4 py-3 font-bold text-slate-900">{formatDate(transaction.date)}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-slate-600">Category</td>
                <td className="px-4 py-3 font-bold text-slate-900">{transaction.category}</td>
              </tr>
            </tbody>
          </table>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-6 text-center text-slate-500 text-sm">
            <p>This receipt is generated electronically and is valid without a physical signature.</p>
            <p className="mt-2">Munyaka Primary and Junior School · P.O. Box 5239-30100, Eldoret</p>
            <p className="mt-2">Generated on {new Date().toLocaleString()}</p>
          </div>

          <div className="mt-6 border-t border-dashed border-slate-300 pt-4 text-center text-xs text-slate-400">
            Authorized Signature & Stamp
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t flex justify-center gap-3 no-print">
          <Button
            variant="outline"
            onClick={onPrint}
            className="rounded-xl h-11 px-6 gap-2"
          >
            <Printer size={18} /> Print Receipt
          </Button>
          <Button
            onClick={onDownload}
            className="rounded-xl h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-100"
          >
            <Download size={18} /> Download Receipt (HTML)
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-xl h-11 px-6"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptView;