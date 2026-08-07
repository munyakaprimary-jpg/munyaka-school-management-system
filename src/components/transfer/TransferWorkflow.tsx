"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Award
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { StudentTransferInfo, TransferData } from '@/types/transfer';
import html2pdf from 'html2pdf.js';

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
  onTransferComplete
}) => {
  const [currentStep, setCurrentStep] = useState<'FORM' | 'CERTIFICATE'>('FORM');
  const [isExecuting, setIsExecuting] = useState(false);
  const [transferData, setTransferData] = useState<Partial<TransferData>>({
    dateOfExit: new Date().toISOString().split('T')[0],
    destinationSchool: '',
    reason: '',
    coCurricularActivities: '',
    headteacherRemarks: '',
  });
  const [certificateNumber, setCertificateNumber] = useState('');
  
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
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('FORM');
      setTransferData({
        dateOfExit: new Date().toISOString().split('T')[0],
        destinationSchool: '',
        reason: '',
        coCurricularActivities: student.coCurricularActivities || '',
        headteacherRemarks: '',
      });
      setCertificateNumber('');
      setAdminPassword('');
      setAuthError('');
      setShowPassword(false);
      setPdfError(null);
      setIsCertificateMounted(false);
    } else {
      setIsCertificateMounted(false);
    }
  }, [isOpen, student]);

  // Callback ref to detect when certificate DOM node is mounted
  const certificateRefCallback = useCallback((node: HTMLDivElement | null) => {
    certificateRef.current = node;
    if (node) {
      setIsCertificateMounted(true);
    } else {
      setIsCertificateMounted(false);
    }
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

  // Generate PDF certificate - robust version with multiple fallback strategies
  const generateCertificatePdf = async (): Promise<boolean> => {
    // Fallback check for html2pdf library
    if (typeof html2pdf === 'undefined') {
      console.error('html2pdf library is missing or not loaded.');
      alert('PDF generator library is not loaded. Please try printing directly using the Print button.');
      return false;
    }

    setIsGeneratingPdf(true);
    setPdfError(null);

    try {
      // Strategy 1: Try ref first
      let element = certificateRef.current;
      
      // Strategy 2: Fallback to DOM ID lookup
      if (!element) {
        element = document.getElementById('certificate-node');
      }
      
      // Strategy 3: Fallback to class selector
      if (!element) {
        element = document.querySelector('.certificate-container') as HTMLDivElement;
      }

      if (!element) {
        throw new Error('Certificate element not found in DOM. Tried ref, ID, and class selectors.');
      }

      // Ensure fonts/images/assets are fully ready before capturing so the
      // generated canvas is not blank.
      await waitForRenderReady();

      const safeStudentName = student.name.replace(/\s+/g, '_');
      const fileName = `Munyaka_Clearance_Certificate_${safeStudentName}.pdf`;

      const opt = {
        margin: [10, 10, 10, 10],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          backgroundColor: '#ffffff',
          ignoreElements: (el: HTMLElement) => {
            return el.hasAttribute('data-no-print') ||
                   el.hasAttribute('data-html2canvas-ignore') ||
                   el.classList.contains('no-print') ||
                   el.classList.contains('html2canvas-ignore');
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css'] }
      };

      await html2pdf().set(opt).from(element).save();
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

    // Validate admin password against stored credentials
    const storedAdminPass = localStorage.getItem('munyaka_admin_pass') || 'munyaka5239';
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (adminPassword !== storedAdminPass) {
      setAuthError("Invalid admin password. Authorization required to transfer learner.");
      setIsExecuting(false);
      return;
    }

    // Generate certificate number
    const certNum = `TRF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    setCertificateNumber(certNum);
    
    // Notify parent of completion (but DON'T close modal)
    onTransferComplete(student.id, certNum);
    
    // Advance to Stage 2 - Certificate View
    // PDF auto-generation will trigger via useEffect once certificate mounts
    setCurrentStep('CERTIFICATE');
    setIsExecuting(false);
    
    showSuccess(`Transfer executed successfully! Certificate ${certNum} generated.`);
  };

  const handlePrintCertificate = async () => {
    // Use same robust element detection
    let element = certificateRef.current;
    if (!element) {
      element = document.getElementById('certificate-node');
    }
    if (!element) {
      element = document.querySelector('.certificate-container') as HTMLDivElement;
    }
    
    if (!element) {
      showError('Certificate not ready for printing. Please try again.');
      return;
    }

    // Clone the certificate so we never mutate the live DOM, and strip the
    // "no-print" class from the copy — otherwise the print stylesheet hides
    // the certificate itself.
    const clone = element.cloneNode(true) as HTMLElement;
    clone.classList.remove('no-print');
    clone.classList.remove('html2canvas-ignore');
    clone.removeAttribute('data-no-print');

    // Create a temporary hidden iframe to print from — this avoids opening new
    // browser tabs and never trips pop-up blockers. The iframe is removed from
    // the DOM once printing is done.
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

    const certificateHtml = clone.outerHTML;
    const printStyles = `
      <style>
        @page { size: A4; margin: 15mm; }
        @media print {
          body { 
            font-family: 'Times New Roman', serif; 
            background: white !important; 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          .certificate-container { 
            box-shadow: none !important; 
            border: 2px solid #1e293b !important;
            max-width: 100% !important;
          }
          .print-btn { display: none !important; }
        }
        .certificate-container {
          font-family: 'Times New Roman', serif;
          background: white;
          color: #1e293b;
        }
        .institutional-header {
          text-align: center;
          border-bottom: 3px double #1e293b;
          padding-bottom: 20px;
          margin-bottom: 25px;
        }
        .school-logo { width: 80px; height: 80px; object-fit: contain; }
        .school-name { font-size: 22px; font-weight: 700; letter-spacing: 1px; margin: 10px 0 5px; }
        .school-motto { font-size: 14px; font-style: italic; color: #334155; margin: 0 0 10px; }
        .school-address { font-size: 11px; color: #64748b; margin: 0; }
        .certificate-title { 
          font-size: 18px; 
          font-weight: 700; 
          text-transform: uppercase; 
          letter-spacing: 2px; 
          text-align: center; 
          margin: 20px 0;
          border-bottom: 1px solid #1e293b;
          padding-bottom: 10px;
        }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
        .detail-row { display: flex; gap: 10px; }
        .detail-label { font-weight: 700; width: 200px; flex-shrink: 0; color: #334155; }
        .detail-value { font-weight: 400; color: #1e293b; flex: 1; }
        .full-width { grid-column: span 2; }
        .remarks-box { 
          border: 1px solid #cbd5e1; 
          border-radius: 4px; 
          padding: 15px; 
          min-height: 80px; 
          background: #f8fafc;
        }
        .signatures { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 40px; 
          margin-top: 40px; 
          padding-top: 20px;
          border-top: 1px solid #cbd5e1;
        }
        .signature-block { text-align: center; }
        .signature-line { 
          border-bottom: 1px solid #1e293b; 
          height: 50px; 
          margin-bottom: 8px; 
        }
        .signature-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .certificate-number { text-align: right; font-size: 11px; color: #64748b; margin-top: 20px; }
        .fee-status-cleared { color: #059669; font-weight: 700; }
        .fee-status-pending { color: #dc2626; font-weight: 700; }
      </style>
    `;

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transfer Clearance Certificate - ${certificateNumber}</title>
        ${printStyles}
      </head>
      <body>
        ${certificateHtml}
      </body>
      </html>
    `);
    iframeDoc.close();

    // Remove the iframe from the DOM once the print dialog is dismissed
    iframe.contentWindow?.addEventListener('afterprint', () => {
      setTimeout(() => iframe.remove(), 100);
    });

    // Wait for fonts and content to fully render before triggering the dialog
    await waitForRenderReady();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 300);
  };

  const handleDownloadPdf = async () => {
    const success = await generateCertificatePdf();
    if (success) {
      showSuccess('Certificate downloaded successfully!');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const feeStatus = student.feeBalance <= 0 ? 'CLEARED' : 'PENDING';
  const feeStatusClass = student.feeBalance <= 0 ? 'fee-status-cleared' : 'fee-status-pending';

  // Dynamic footer based on current step
  const renderFooter = () => {
    if (currentStep === 'FORM') {
      return (
        <>
          <Button variant="ghost" onClick={onClose} disabled={isExecuting} className="rounded-xl font-bold">
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
            onClick={handlePrintCertificate}
            data-html2canvas-ignore="true"
            className="no-print rounded-xl bg-slate-600 hover:bg-slate-700 font-bold px-8 shadow-lg shadow-slate-100 gap-2 text-white"
          >
            <Printer size={16} /> Print Certificate
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
        ? `Initiate transfer for ${student.name} (${student.assessment})`
        : `Official Clearance Certificate for ${student.name}`}
      maxWidth="max-w-3xl"
      footer={renderFooter()}
    >
      {/* Stage 1: Transfer Setup Form */}
      {currentStep === 'FORM' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Student Info Header */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
              {student.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-slate-900">{student.name}</h3>
              <div className="flex flex-wrap gap-3 mt-2 text-sm">
                <Badge className="bg-indigo-100 text-indigo-700 font-medium px-3 py-1">
                  <UserCheck size={12} className="mr-1" /> Grade {student.grade}
                </Badge>
                <Badge className="bg-slate-100 text-slate-700 font-medium px-3 py-1">
                  {student.stream} Stream
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-700 font-medium px-3 py-1">
                  {student.gender === 'M' ? 'Male' : 'Female'}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-600 font-medium">
                  UPI: {student.assessment}
                </Badge>
              </div>
            </div>
          </div>

          {/* Transfer Details Form */}
          <div className="space-y-5">
            <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText size={20} className="text-indigo-600" /> Transfer Details
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Date of Exit</Label>
                <Input 
                  type="date"
                  value={transferData.dateOfExit}
                  onChange={(e) => setTransferData({...transferData, dateOfExit: e.target.value})}
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Destination School / Reason</Label>
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
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Additional Reason / Notes</Label>
              <Textarea 
                value={transferData.reason}
                onChange={(e) => setTransferData({...transferData, reason: e.target.value})}
                placeholder="Any additional context for the transfer..."
                className="rounded-xl bg-slate-50 border-none min-h-[80px]"
                rows={3}
              />
            </div>
          </div>

          {/* Financial Clearance Card */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard size={20} className="text-amber-600" /> Financial Clearance Status
            </h4>
            
            <Card className={cn(
              "border-none shadow-sm rounded-2xl p-6",
              student.feeBalance > 0 ? "bg-amber-50 border-2 border-amber-200" : "bg-emerald-50 border-2 border-emerald-200"
            )}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-4 rounded-2xl",
                    student.feeBalance > 0 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                  )}>
                    {student.feeBalance > 0 ? <AlertTriangle size={28} /> : <CheckCircle2 size={28} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Outstanding Fee Balance</p>
                    <p className="text-2xl font-black text-slate-900">
                      KES {student.feeBalance.toLocaleString()}
                    </p>
                    <Badge className={cn(
                      "mt-2 text-xs font-bold",
                      student.feeBalance > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    )}>
                      {feeStatus}
                    </Badge>
                  </div>
                </div>
                
                {student.feeBalance > 0 && (
                  <div className="flex flex-col items-end md:items-center gap-2 text-amber-700">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-sm font-bold text-center max-w-xs">
                      Attention: This student has an outstanding fee balance of <strong>KES {student.feeBalance.toLocaleString()}</strong>. 
                      Ensure clearance or settlement before issuing final documents.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Additional Certificate Details */}
          <div className="space-y-5 pt-4 border-t border-slate-100">
            <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PenTool size={20} className="text-indigo-600" /> Certificate Details (Optional)
            </h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Co-curricular Activities & Achievements</Label>
                <Textarea 
                  value={transferData.coCurricularActivities}
                  onChange={(e) => setTransferData({...transferData, coCurricularActivities: e.target.value})}
                  placeholder="e.g. Football team captain, Science fair winner, Choir member..."
                  className="rounded-xl bg-slate-50 border-none min-h-[80px]"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Headteacher Remarks</Label>
                <Textarea 
                  value={transferData.headteacherRemarks}
                  onChange={(e) => setTransferData({...transferData, headteacherRemarks: e.target.value})}
                  placeholder="General conduct, character reference, special notes..."
                  className="rounded-xl bg-slate-50 border-none min-h-[80px]"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Admin Password Verification */}
          <div className="space-y-4 pt-4 border-t border-slate-100 bg-amber-50/50 rounded-2xl p-5 border border-amber-100">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="text-amber-600" size={20} />
              <div>
                <h4 className="font-bold text-amber-800">Admin Authorization Required</h4>
                <p className="text-sm text-amber-700">Enter admin password to authorize this student transfer.</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">ADMIN PASSWORD</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={(e) => { 
                    const trimmed = e.target.value.trim();
                    setAdminPassword(trimmed);
                    if (authError) setAuthError("");
                  }}
                  placeholder="Enter admin password to confirm..."
                  className="rounded-xl h-12 bg-white border-amber-200 font-bold pr-12"
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
              {authError && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                  <AlertCircle size={14} /> {authError}
                </div>
              )}
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
            ref={certificateRefCallback}
            className="certificate-container bg-white rounded-xl shadow-2xl border-2 border-slate-800 p-8 md:p-12 max-w-3xl mx-auto no-print"
            style={{ 
              // Ensure element is measurable even if parent is hidden
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
                <span className="detail-value font-black text-lg">{student.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Assessment UPI Code:</span>
                <span className="detail-value font-mono font-bold">{student.assessment}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Gender:</span>
                <span className="detail-value">{student.gender === 'M' ? 'Male' : 'Female'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date of Birth:</span>
                <span className="detail-value">{formatDate(student.dob)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date of Admission:</span>
                <span className="detail-value">{formatDate(student.dateOfAdmission)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date of Exit:</span>
                <span className="detail-value font-bold">{formatDate(transferData.dateOfExit)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Grade Attained:</span>
                <span className="detail-value">Grade {student.grade}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Stream:</span>
                <span className="detail-value">{student.stream}</span>
              </div>
              <div className="detail-row full-width">
                <span className="detail-label">Destination School / Reason:</span>
                <span className="detail-value">{transferData.destinationSchool}</span>
              </div>
              <div className="detail-row full-width">
                <span className="detail-label">Final Fee Clearance Status:</span>
                <span className="detail-value">
                  <span className={cn("font-bold px-3 py-1 rounded", feeStatusClass)}>
                    {feeStatus} {student.feeBalance > 0 ? `• Balance: KES ${student.feeBalance.toLocaleString()}` : '• Balance: 0 KES'}
                  </span>
                </span>
              </div>
            </div>

            {/* Co-curricular Activities */}
            <div className="mt-8">
              <h4 className="font-bold text-slate-900 mb-3 border-b border-slate-300 pb-2">Co-curricular Activities & Achievements</h4>
              <div className="remarks-box">
                <p className="text-slate-700 whitespace-pre-wrap">{transferData.coCurricularActivities || 'No co-curricular activities recorded.'}</p>
              </div>
            </div>

            {/* Headteacher Remarks */}
            <div className="mt-6">
              <h4 className="font-bold text-slate-900 mb-3 border-b border-slate-300 pb-2">Headteacher Remarks</h4>
              <div className="remarks-box">
                <p className="text-slate-700 whitespace-pre-wrap">{transferData.headteacherRemarks || 'No additional remarks.'}</p>
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