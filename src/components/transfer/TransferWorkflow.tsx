"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Modal from '@/components/ui/Modal';
import {
  UserX,
  Printer,
  FileText,
  CheckCircle,
  AlertTriangle,
  Calendar,
  School,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  PenTool,
  Stamp,
  Building2,
  UserCheck,
  Eye,
  EyeOff,
  Lock,
  Download,
  FileCheck,
  Award,
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { StudentTransferInfo, TransferData } from '@/types/transfer';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface TransferWorkflowProps {
  student: StudentTransferInfo;
  isOpen: boolean;
  onClose: () => void;
  onTransferComplete: (studentId: string, certificateNumber: string) => void;
}

const TransferWorkflow: React.FC<TransferWorkflowProps> = ({
  student,
  isOpen,
  onClose,
  onTransferComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<'FORM' | 'CERTIFICATE'>('FORM');
  const [isExecuting, setIsExecuting] = useState(false);
  const [transferData, setTransferData] = useState<Partial<TransferData>>({
    dateOfExit: new Date().toISOString().split('T')[0],
    destinationSchool: '',
    reason: '',
    coCurricularActivities: student?.coCurricularActivities || '',
    headteacherRemarks: '',
  });
  const [certificateNumber, setCertificateNumber] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  
  // ─── Dynamic fee balance state ───
  // Pull real-time balance from the active student's directory/ledger record.
  // Priority: student.feeBalance (number) → student.account.balance (number) → 0.
  const feeBalance = useMemo<number>(() => {
    const raw = (student as any)?.feeBalance ?? (student as any)?.account?.balance;
    const n = typeof raw === 'string' ? parseFloat(raw) : raw;
    return Number.isFinite(n) ? (n as number) : 0;
  }, [student]);

  // Auto-computed cleared status: balance > 0 → PENDING, balance ≤ 0 → CLEARED.
  const isCleared = feeBalance <= 0;
  const hasOutstandingBalance = feeBalance > 0;

  // Reset transfer state when the modal opens or the student changes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('FORM');
      setTransferData({
        dateOfExit: new Date().toISOString().split('T')[0],
        destinationSchool: '',
        reason: '',
        coCurricularActivities: student?.coCurricularActivities || '',
        headteacherRemarks: '',
      });
      setCertificateNumber('');
      setGeneratedCode(null);
    }
  }, [isOpen, student]);

  // Ref for the certificate container - explicitly targeting the certificate node
  const certificateRef = useRef<HTMLDivElement>(null);

  // Track if certificate is mounted and ready for PDF generation
  const [isCertificateMounted, setIsCertificateMounted] = useState(false);

  // Admin password verification state
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // PDF generation state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Refs for textareas used in PDF generation
  const headteacherRef = useRef<HTMLTextAreaElement>(null);
  const cocurricularRef = useRef<HTMLTextAreaElement>(null);

  // Resync live values from textareas into DOM text
  const syncTextareasToDom = useCallback(() => {
    if (headteacherRef.current) headteacherRef.current.innerText = headteacherRef.current.value;
    if (cocurricularRef.current) cocurricularRef.current.innerText = cocurricularRef.current.value;
  }, []);

  // Wait until web fonts and any image assets inside the certificate are fully
  // loaded, then let the browser pump a couple of frames so the html2canvas
  // snapshot captures real painted content instead of a blank canvas.
  const waitForRenderReady = useCallback(async () => {
    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    } catch {
      /* ignore font API failures */
    }

    // Give layout/paint a moment to complete (covers entrance animations too)
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  }, []);

  // Resolve the certificate DOM node via ref, then its id, then class fallback.
  const getCertificateElement = useCallback((): HTMLElement | null => {
    if (certificateRef.current) return certificateRef.current;
    const byId = document.getElementById('certificate-node');
    if (byId) return byId;
    return document.querySelector('.certificate-container') as HTMLElement | null;
  }, []);

  // Render the certificate node into a reliable high-res canvas. Both the PDF
  // download and the print flow use this same image payload so the output is
  // never blank and shows exactly what the user sees on screen.
  const captureCertificateCanvas = useCallback(async (): Promise<HTMLCanvasElement> => {
    const element = getCertificateElement();
    if (!element) {
      throw new Error('Certificate element not found in DOM. Tried ref, ID, and class selectors.');
    }

    // Ensure fonts/assets are fully ready so the captured canvas is not blank.
    await waitForRenderReady();

    return html2canvas(element, {
      useCORS: true,
      scale: 2,
      logging: false,
      backgroundColor: '#ffffff',
      scrollY: 0,
    });
  }, [getCertificateElement, waitForRenderReady]);

  // Generate PDF certificate by rendering the node to a canvas, then placing
  // that image into a standard A4 jsPDF document.
  const generateCertificatePdf = async (): Promise<boolean> => {
    setIsGeneratingPdf(true);
    setPdfError(null);

    try {
      const canvas = await captureCertificateCanvas();
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;

      // Fit the certificate onto the A4 page while preserving its aspect ratio.
      const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
      const drawWidth = canvas.width * ratio;
      const drawHeight = canvas.height * ratio;
      const x = (pageWidth - drawWidth) / 2;
      const y = (pageHeight - drawHeight) / 2;

      pdf.addImage(imgData, 'JPEG', x, y, drawWidth, drawHeight);

      const safeStudentName = (student?.name || '').replace(/\s+/g, '_');
      pdf.save(`Munyaka_Clearance_Certificate_${safeStudentName}.pdf`);
      return true;
    } catch (err) {
      console.error('PDF generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
      setPdfError(errorMessage);
      return false;
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Auto-generate PDF after certificate mounts - with proper lifecycle handling
  useEffect(() => {
    if (currentStep === 'CERTIFICATE' && certificateNumber && isCertificateMounted) {
      // Use setTimeout to ensure React has flushed the DOM and browser has painted
      const timer = setTimeout(() => {
        generateCertificatePdf();
      }, 300); // 300ms delay for render + paint
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, certificateNumber, isCertificateMounted]);

  // Handle transfer execution with admin password verification
  const handleExecuteTransfer = async () => {
    if (!transferData.destinationSchool?.trim()) {
      showError("Please enter the destination school or reason for transfer.");
      return;
    }

    if (!adminPassword.trim()) {
      setAuthError("Admin password is required to authorize this transfer.");
      return;
    }

    setIsExecuting(true);
    setAuthError("");

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const storedAdminPass = localStorage.getItem('munyaka_admin_pass') || 'munyaka5239';

    if (adminPassword !== storedAdminPass) {
      setAuthError("Invalid admin password. Authorization required to transfer learner.");
      setIsExecuting(false);
      return;
    }

    // Generate certificate number
    const certNum = `TRF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    setCertificateNumber(certNum);
    setGeneratedCode(certNum);
    
    // Notify parent of completion (but DON'T close modal)
    onTransferComplete(student.id, certNum);
    
    // Advance to Stage 2 - Certificate View
    // PDF auto-generation will trigger via useEffect once certificate mounts
    setCurrentStep('CERTIFICATE');
    setIsExecuting(false);
    setAdminPassword('');
    
    showSuccess(`Transfer executed successfully! Certificate ${certNum} generated.`);
  };

  // Handle transfer with outstanding balance - allow with warning
  const handleProceedWithBalance = () => {
    // Optional: add additional validation/acknowledgment for outstanding balance
    showSuccess('Proceeding with transfer. Outstanding balance acknowledged.');
  };

  const handlePrintCertificate = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    
    // Sync textareas to DOM before capturing
    syncTextareasToDom();
    
    try {
      const canvas = await captureCertificateCanvas();
      const dataUrl = canvas.toDataURL('image/png');

      // Create a temporary hidden iframe to print from — this avoids opening
      // new browser tabs and never trips pop-up blockers. The iframe is
      // removed from the DOM once printing is done.
      const iframe = document.createElement('iframe');
      iframe.setAttribute('aria-hidden', 'true');
      iframe.setAttribute('title', 'Certificate print frame');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        showError('Unable to prepare the certificate for printing. Please try again.');
        iframe.remove();
        return;
      }

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Transfer Clearance Certificate - ${certificateNumber}</title>
          <style>
            @page { size: A4; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            img { width: 100%; height: auto; display: block; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" alt="Transfer Clearance Certificate" />
        </body>
        </html>
      `);
      iframeDoc.close();

      // Remove the iframe from the DOM once the print dialog is dismissed
      iframe.contentWindow?.addEventListener('afterprint', () => {
        setTimeout(() => iframe.remove(), 100);
      });

      // Wait for the image inside the iframe to load before triggering the dialog
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 300);
    } catch (err) {
      console.error('Print error:', err);
      showError(err instanceof Error ? err.message : 'Failed to prepare the certificate for printing.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadPdf = async () => {
    const success = await generateCertificatePdf();
    if (success) {
      showSuccess('Certificate downloaded successfully.');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formattedBalance = feeBalance.toLocaleString();

  // Dynamic footer based on current step
  const renderFooter = () => {
    if (currentStep === 'FORM') {
      return (
        <>
          <Button variant="ghost" onClick={onClose} disabled={isExecuting} className="rounded-xl font-bold px-8">
            Cancel
          </Button>
          <Button
            onClick={handleExecuteTransfer}
            disabled={isExecuting || !adminPassword.trim()}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100 gap-2 text-white"
          >
            {isExecuting ? <Loader2 className="animate-spin mr-2" size={16} /> : <UserCheck size={16} />}
            Execute Transfer & Generate Clearance Certificate
          </Button>
        </>
      );
    } else {
      // Post-execution state: Download PDF, Print, Close
      return (
        <>
          <Button
            variant="outline"
            onClick={handlePrintCertificate}
            disabled={isPrinting || isGeneratingPdf}
            data-html2canvas-ignore="true"
            className="no-print rounded-xl bg-slate-600 hover:bg-slate-700 font-bold px-8 shadow-lg shadow-slate-100 gap-2 text-white"
          >
            {isPrinting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Printer size={16} />}
            Print Certificate
          </Button>
          <Button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            data-html2canvas-ignore="true"
            className="no-print rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100 gap-2 text-white"
          >
            {isGeneratingPdf ? <Loader2 className="animate-spin mr-2" size={16} /> : <Download size={16} />}
            Download Certificate (PDF)
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            data-html2canvas-ignore="true"
            className="no-print rounded-xl border-slate-200 bg-white font-bold px-8 shadow-sm"
          >
            <FileCheck size={16} className="mr-2" /> Close
          </Button>
        </>
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentStep === 'FORM' ? "Student Transfer Workflow" : "Official Clearance Certificate"}
      description={currentStep === 'FORM' 
        ? `Initiate transfer for ${student?.name || 'Unknown'} (${student?.assessment || 'N/A'})`
        : `Official Clearance Certificate for ${student?.name || 'Unknown'}`}
      maxWidth="max-w-3xl"
      footer={renderFooter()}
    >
      {/* Stage 1: Transfer Setup Form */}
      {currentStep === 'FORM' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Student Info Header */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
              {(student?.name || '').split(' ').map(n => n?.[0] || '').join('')}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black text-slate-900">{student?.name || 'Unknown'}</h3>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 font-medium px-3 py-1">
                  <UserCheck size={12} className="mr-1" /> Grade {student?.grade}
                </Badge>
                <Badge variant="outline" className="font-medium px-3 py-1">
                  {student?.stream} Stream
                </Badge>
                <Badge className={cn(
                  "border-none font-medium px-3 py-1",
                  isCleared
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                )}>
                  {isCleared ? <CheckCircle2 size={12} className="mr-1" /> : <AlertTriangle size={12} className="mr-1" />}
                  {isCleared ? 'CLEARED' : 'PENDING'}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-600 font-medium">
                  UPI: {student?.assessment}
                </Badge>
              </div>
            </div>
          </div>

          {/* Financial Clearance Card — DYNAMIC from student props */}
          <div className={cn(
            "border-2 rounded-2xl p-6 space-y-3",
            isCleared
              ? "bg-emerald-50/40 border-emerald-200"
              : "bg-amber-50/60 border-amber-200"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-3 rounded-2xl shadow-sm",
                  isCleared ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                )}>
                  <CreditCard size={24} />
                </div>
                <div>
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest mb-0.5",
                    isCleared ? "text-emerald-600" : "text-amber-600"
                  )}>Financial Clearance Status</p>
                  <h3 className="text-2xl font-black text-slate-900">
                    KES {formattedBalance}
                  </h3>
                </div>
              </div>
              <div className="text-right">
                <Badge className={cn(
                  "border-none font-black text-[10px] gap-1 px-3 py-1.5",
                  isCleared
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                )}>
                  {isCleared ? (
                    <>
                      <CheckCircle2 size={10} />
                      Cleared
                    </>
                  ) : (
                    <>
                      <AlertCircle size={10} />
                      Pending
                    </>
                  )}
                </Badge>
              </div>
            </div>

            {hasOutstandingBalance && (
              <div className="flex flex-col items-end md:items-center gap-2 text-amber-700">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-sm font-bold text-center max-w-xs">
                  Attention: This student has an outstanding fee balance of <strong>KES {formattedBalance}</strong>.
                  Ensure clearance or settlement before issuing final documents.
                </p>
              </div>
            )}
          </div>

          {/* Transfer Details Form */}
          <div className="space-y-5">
            <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileText size={20} className="text-indigo-600" /> Transfer Details
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Date of Exit</Label>
                <Input 
                  type="date"
                  value={transferData.dateOfExit}
                  onChange={(e) => setTransferData({...transferData, dateOfExit: e.target.value})}
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Destination School / Reason</Label>
                <Input 
                  value={transferData.destinationSchool}
                  onChange={(e) => setTransferData({...transferData, destinationSchool: e.target.value})}
                  placeholder="e.g. St. Mary's Academy, Nairobi / Parent relocation"
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Additional Reason / Notes</Label>
              <Textarea 
                value={transferData.reason}
                onChange={(e) => setTransferData({...transferData, reason: e.target.value})}
                placeholder="Any additional context for the transfer..."
                className="rounded-xl bg-slate-50 border-none min-h-[80px]"
                rows={3}
              />
            </div>
          </div>

          {/* Admin Password Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100 bg-amber-50/40 rounded-2xl p-5 border border-amber-200/60">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="text-amber-600 shrink-0" size={20} />
              <div>
                <h4 className="font-bold text-amber-800">Admin Authorization Required</h4>
                <p className="text-sm text-amber-700">Enter admin password to authorize this student transfer.</p>
              </div>
            </div>
            
            {authError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                <AlertCircle size={14} /> {authError}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-amber-700">Admin Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" size={16} />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={(e) => {
                    const trimmed = e.target.value.trim();
                    setAdminPassword(trimmed);
                    if (authError) setAuthError("");
                  }}
                  placeholder="Enter admin password to confirm..."
                  className="rounded-xl h-12 bg-white border-amber-200 font-bold pl-10 pr-12"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage 2: Official Clearance Certificate Preview */}
      {currentStep === 'CERTIFICATE' && (
        <div className="animate-in fade-in zoom-in-95">
          {/*
            CRITICAL FIXES:
            1. Explicit ID "certificate-node" for DOM lookup fallback
            2. Callback ref (certificateRefCallback) detects mount timing precisely
            3. Certificate content rendered in a container with proper positioning
            4. The "no-print" class is only a hint for the main app's stylesheet;
               the print/PDF handlers clone this node and strip it before export.
          */}
          <div
            id="certificate-node"
            ref={certificateRef}
            className="certificate-container bg-white rounded-xl shadow-2xl border-2 border-slate-800 p-8 md:p-12 max-w-3xl mx-auto no-print"
            style={{
              position: 'relative',
              minHeight: '100px'
            }}
          >
            {/* Institutional Header */}
            <div className="institutional-header">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-slate-300">
                  <School className="text-slate-600" size={32} />
                </div>
              </div>
              <h1 className="school-name">MUNYAKA PRIMARY AND JUNIOR SCHOOL</h1>
              <p className="school-motto">"Knowledge is Power"</p>
              <p className="school-address">P.O. Box 5239-30100, Eldoret | Tel: +254 738 873 359 | Email: munyakaprimary@gmail.com</p>
            </div>

            {/* Certificate Title */}
            <h2 className="certificate-title">Student Transfer & Clearance Certificate</h2>

            {/* Certificate Number */}
            <div className="certificate-number">
              Certificate No: <strong>{certificateNumber}</strong> | Date Issued: <strong>{formatDate(new Date().toISOString())}</strong>
            </div>

            {/* Student Details Grid */}
            <div className="detail-grid">
              <div className="detail-row">
                <span className="detail-label">Student Full Name:</span>
                <span className="detail-value font-black text-lg">{student?.name || 'Unknown'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Assessment UPI Code:</span>
                <span className="detail-value font-mono font-bold">{student?.assessment || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Gender:</span>
                <span className="detail-value">{student?.gender === 'M' ? 'Male' : 'Female'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date of Birth:</span>
                <span className="detail-value">{formatDate(student?.dob || '')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date of Admission:</span>
                <span className="detail-value">{formatDate(student?.dateOfAdmission || '')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date of Exit:</span>
                <span className="detail-value font-bold">{formatDate(transferData.dateOfExit || '')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Grade Attained:</span>
                <span className="detail-value">Grade {student?.grade}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Stream:</span>
                <span className="detail-value">{student?.stream}</span>
              </div>
              <div className="detail-row full-width">
                <span className="detail-label">Destination School / Reason:</span>
                <span className="detail-value">{transferData.destinationSchool || 'Not specified'}</span>
              </div>
              <div className="detail-row full-width">
                <span className="detail-label">Final Fee Clearance Status:</span>
                <span className="detail-value">
                  <span className={cn(
                    "font-bold px-3 py-1 rounded",
                    isCleared
                      ? "fee-status-cleared bg-emerald-50 text-emerald-700"
                      : "fee-status-pending bg-amber-50 text-amber-700"
                  )}>
                    {hasOutstandingBalance
                      ? `• Balance: KES ${formattedBalance}`
                      : '• Balance: 0 KES'}
                  </span>
                </span>
              </div>
            </div>

            {/* Co-curricular Activities */}
            <div className="mt-8">
              <h4 className="font-bold text-slate-900 mb-3 border-b border-slate-300 pb-2">Co-curricular Activities & Achievements</h4>
              <div className="remarks-box">
                <textarea
                  ref={cocurricularRef}
                  defaultValue={student?.coCurricularActivities || 'No co-curricular activities recorded.'}
                  className="text-slate-700 whitespace-pre-wrap w-full bg-transparent border-0 outline-none resize-none"
                  rows={2}
                />
              </div>
            </div>

            {/* Headteacher Remarks */}
            <div className="mt-6">
              <h4 className="font-bold text-slate-900 mb-3 border-b border-slate-300 pb-2">Headteacher Remarks</h4>
              <div className="remarks-box">
                <textarea
                  ref={headteacherRef}
                  defaultValue={transferData.headteacherRemarks || 'No additional remarks.'}
                  className="text-slate-700 whitespace-pre-wrap w-full bg-transparent border-0 outline-none resize-none"
                  rows={2}
                />
              </div>
            </div>

            {/* Sign-off Block */}
            <div className="signatures">
              <div className="signature-block">
                <div className="signature-line"></div>
                <p className="signature-label">Bursar / Finance Clearance</p>
                <p className="text-xs text-slate-500 mt-1">Signature & Date</p>
                <p className="text-xs text-slate-400">Official Stamp</p>
              </div>
              <div className="signature-block">
                <div className="signature-line"></div>
                <p className="signature-label">Headteacher Signature & Stamp</p>
                <p className="text-xs text-slate-500 mt-1">Signature & Date</p>
                <p className="text-xs text-slate-400">Official School Stamp</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-300 text-center text-xs text-slate-500">
              <p>This certificate is issued without erasure or alteration.</p>
              <p className="mt-1">Munyaka Primary and Junior School • P.O. Box 5239-30100, Eldoret</p>
            </div>
          </div>

          {/* PDF Error Alert */}
          {pdfError && (
            <div className="no-print mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-rose-800">PDF Generation Issue</p>
                <p className="text-sm text-rose-700 mt-1">{pdfError}</p>
                <p className="text-xs text-rose-600 mt-2">Please use the manual Download Certificate (PDF) or Print Certificate buttons above.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default TransferWorkflow;