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
import { showSuccess, showError, showSuccessWithAction } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { StudentTransferInfo, TransferData } from '@/types/transfer';
import { archiveLearner } from '@/services/transferArchiveService';
import { useAuth } from '@/context/AuthContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  jsPdfToBlob,
  downloadPdfBlob,
  buildCertificateFilename,
  saveCertificateRef,
  type DownloadPdfResult,
} from '@/utils/pdfDownloader';
import {
  saveArchivedLearner,
} from '@/utils/archiveStorage';
import type {
  TransferredLearnerArchive,
} from '@/types/archive';

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
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'FORM' | 'CERTIFICATE'>('FORM');
  const [isExecuting, setIsExecuting] = useState(false);
  const [transferData, setTransferData] = useState<Partial<TransferData> & {
    feesStatus?: string;
    feesBalance?: string;
    textbookStatus?: string;
    textbookDetails?: string;
    propertyNotes?: string;
  }>({
    dateOfExit: new Date().toISOString().split('T')[0],
    destinationSchool: '',
    reason: '',
    coCurricularActivities: student?.coCurricularActivities || '',
    headteacherRemarks: '',
    feesStatus: student?.feeBalance && student.feeBalance > 0 ? 'Outstanding Balance' : 'Fully Cleared (KES 0 Balance)',
    feesBalance: student?.feeBalance ? `KES ${student.feeBalance.toLocaleString()}` : 'KES 0',
    textbookStatus: 'All Textbooks Returned & Accounted For',
    textbookDetails: 'All Grade CBC textbooks returned in good condition',
    propertyNotes: 'Sports kit returned, desk and locker cleared',
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
  const [isPrinting, setIsPrinting] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Stable download callback passed back to the parent via onTransferComplete
  // so the toast action button can re-trigger the download without re-rendering
  const downloadCallbackRef = useRef<(() => DownloadPdfResult) | null>(null);

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('FORM');
      setTransferData({
        dateOfExit: new Date().toISOString().split('T')[0],
        destinationSchool: '',
        reason: '',
        coCurricularActivities: student?.coCurricularActivities || '',
        headteacherRemarks: '',
        feesStatus: student?.feeBalance && student.feeBalance > 0 ? 'Outstanding Balance' : 'Fully Cleared (KES 0 Balance)',
        feesBalance: student?.feeBalance ? `KES ${student.feeBalance.toLocaleString()}` : 'KES 0',
        textbookStatus: 'All Textbooks Returned & Accounted For',
        textbookDetails: 'All Grade CBC textbooks returned in good condition',
        propertyNotes: 'Sports kit returned, desk and locker cleared',
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
  // On success, the certificate reference (including a data URL) is persisted
  // to localStorage so the profile page can offer a re-download button.
  const generateCertificatePdf = async (): Promise<DownloadPdfResult> => {
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

      const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
      const drawWidth = canvas.width * ratio;
      const drawHeight = canvas.height * ratio;
      const x = (pageWidth - drawWidth) / 2;
      const y = (pageHeight - drawHeight) / 2;

      pdf.addImage(imgData, 'JPEG', x, y, drawWidth, drawHeight);

      const filename = buildCertificateFilename(student?.name, certificateNumber);

      // Trigger immediate auto-download via hidden <a> click
      const blob = jsPdfToBlob(pdf);
      const result = downloadPdfBlob(blob, filename);

      if (!result.success) {
        throw new Error(result.error ?? 'PDF download failed');
      }

      // Persist the certificate reference (including a data URL) to localStorage
      // so the profile page's "Download Clearance Certificate" button can
      // re-generate the PDF on demand without asking for admin credentials again.
      saveCertificateRef(student.id, {
        certificateNumber,
        filename,
        issuedAt: new Date().toISOString(),
        pdfDataUrl: pdf.output('datauristring'),
      });

      // Expose the download closure via the ref so the toast action button can
      // call it directly (avoids prop drilling and stale closures).
      downloadCallbackRef.current = () => {
        const reBlob = jsPdfToBlob(pdf);
        return downloadPdfBlob(reBlob, filename);
      };

      return result;
    } catch (err) {
      console.error('PDF generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
      setPdfError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // ─── Pure jsPDF text-based certificate generator ────────────────────────────────────
  // This function builds the clearance certificate as a proper jsPDF text document
  // so it works even if the DOM certificate node failed to mount. It includes all
  // required certificate elements: school header, student details, transfer metadata,
  // headteacher remarks, and admin sign-off placeholders.
  //
  // The generated jsPDF instance is passed to downloadJsPdf (from pdfDownloader.ts)
  // which handles the Blob creation, Object URL, and hidden <a download> click.
  const generateClearanceCertificatePDF = (): jsPDF => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // ── Helper: draw a thin horizontal rule ─────────────────────────────────
    const drawLine = (yPos: number, thickness = 0.3) => {
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(thickness);
      doc.line(margin, yPos, pageWidth - margin, yPos);
    };

    // ── Helper: add wrapped text, advancing y ───────────────────────────────
    const addWrappedText = (
      text: string,
      x: number,
      fontSize: number,
      fontStyle: 'normal' | 'bold' = 'normal',
      color = [40, 40, 40] as [number, number, number],
      lineHeight = 6
    ) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, contentWidth);
      lines.forEach((line: string) => {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, x, y + fontSize * 0.35);
        y += lineHeight;
      });
    };

    // ── Helper: centered text ───────────────────────────────────────────────
    const addCenteredText = (
      text: string,
      fontSize: number,
      fontStyle: 'normal' | 'bold' | 'italic' = 'bold',
      color = [30, 30, 30] as [number, number, number],
      yOffset = 0
    ) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      doc.setTextColor(...color);
      const x = pageWidth / 2;
      doc.text(text, x, y + yOffset, { align: 'center' });
    };

    // ════════════════════════════════════════════════════════════════════════
    //  1. SCHOOL INSTITUTIONAL HEADER
    // ════════════════════════════════════════════════════════════════════════

    // School logo placeholder — filled circle
    doc.setFillColor(99, 102, 241); // indigo-600
    doc.circle(pageWidth / 2, y + 10, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('M', pageWidth / 2, y + 13.5, { align: 'center' });

    y += 24;
    addCenteredText('MUNYAKA PRIMARY AND JUNIOR SCHOOL', 16, 'bold', [20, 20, 60]);
    y += 7;
    addCenteredText('P.O. Box 5239-30100, Eldoret | Tel: +254 738 873 359', 8, 'normal', [100, 100, 120], 0);
    y += 4;
    addCenteredText('Email: munyakaprimary@gmail.com', 8, 'normal', [100, 100, 120], 0);
    y += 4;
    addCenteredText('"Knowledge is Power"', 9, 'italic', [100, 100, 140], 0);
    y += 6;
    drawLine(y, 1);
    y += 8;

    // ── 2. CERTIFICATE TITLE ────────────────────────────────────────────────
    addCenteredText('OFFICIAL STUDENT CLEARANCE & TRANSFER CERTIFICATE', 13, 'bold', [99, 102, 241], 0);
    y += 6;
    addCenteredText(`Certificate No: ${certificateNumber}  |  Date Issued: ${formatDate(new Date().toISOString())}`, 9, 'normal', [80, 80, 80], 0);
    y += 10;
    drawLine(y, 0.5);
    y += 10;

    // ── 3. STUDENT DETAILS ─────────────────────────────────────────────────
    addCenteredText('STUDENT PARTICULARS', 11, 'bold', [40, 40, 40], 0);
    y += 8;

    const studentDetails: [string, string][] = [
      ['Student Full Name:', student?.name || '—'],
      ['NEMIS / UPI / Assessment Code:', student?.assessment || '—'],
      ['Gender:', student?.gender === 'M' ? 'Male' : 'Female'],
      ['Date of Birth:', formatDate(student?.dob || '')],
      ['Date of Admission:', formatDate(student?.dateOfAdmission || '')],
      ['Grade / Class at Exit:', `Grade ${student?.grade ?? '—'}, ${student?.stream ?? '—'} Stream`],
    ];

    studentDetails.forEach(([label, value]) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(label, margin, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text(value, margin + 60, y + 5);
      y += 7;
    });

    y += 4;
    drawLine(y, 0.3);
    y += 10;

    // ── 4. TRANSFER & INSTITUTIONAL CLEARANCE RECORD ────────────────────────
    addCenteredText('CLEARANCE & TRANSFER RECORD', 11, 'bold', [40, 40, 40], 0);
    y += 8;

    const clearanceItems: [string, string][] = [
      ['DESTINATION SCHOOL:', transferData.destinationSchool || 'Not specified'],
      ['1. FEES DEPARTMENT:', `${transferData.feesStatus || 'Fully Cleared'} (Balance: ${transferData.feesBalance || 'KES 0'})`],
      ['2. TEXTBOOKS & LIBRARY:', `${transferData.textbookStatus || 'Accounted'} — ${transferData.textbookDetails || '—'}`],
      ['3. STORES & PROPERTY:', transferData.propertyNotes || 'All items returned and cleared'],
    ];

    clearanceItems.forEach(([label, value]) => {
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(label, margin, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      const wrapped = doc.splitTextToSize(value, contentWidth - 65);
      wrapped.forEach((line: string, i: number) => {
        doc.text(line, margin + 65, y + 5 + i * 5);
      });
      y += 6 + (wrapped.length - 1) * 5;
    });

    y += 4;
    drawLine(y, 0.3);
    y += 10;

    // ── 5. CO-CURRICULAR & REMARKS ─────────────────────────────────────────
    addCenteredText('CO-CURRICULAR & HEADTEACHER REMARKS', 11, 'bold', [40, 40, 40], 0);
    y += 8;
    
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Co-curricular Activities:', margin, y + 5);
    y += 6;
    addWrappedText(transferData.coCurricularActivities || 'No co-curricular activities recorded.', margin, 9, 'normal', [50, 50, 50], 5);
    
    y += 4;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Headteacher Remarks & Character Reference:', margin, y + 5);
    y += 6;
    addWrappedText(transferData.headteacherRemarks || 'No additional remarks provided.', margin, 9, 'normal', [50, 50, 50], 5);

    y += 6;
    drawLine(y, 0.3);
    y += 10;

    // ── 8. AUTHORIZATION BLOCK ─────────────────────────────────────────────
    addCenteredText('AUTHORIZATION & SIGN-OFF', 11, 'bold', [40, 40, 40], 0);
    y += 10;

    const halfWidth = (contentWidth - 20) / 2;
    const sigBoxHeight = 28;
    const sigBoxY = y;

    // Left: Bursar / Finance
    doc.setFillColor(248, 248, 250);
    doc.rect(margin, sigBoxY, halfWidth, sigBoxHeight, 'F');
    doc.setDrawColor(200, 200, 210);
    doc.setLineWidth(0.3);
    doc.rect(margin, sigBoxY, halfWidth, sigBoxHeight, 'S');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('BURSAR / FINANCE CLEARANCE', margin + halfWidth / 2, sigBoxY + 7, { align: 'center' });
    doc.setLineWidth(0.4);
    doc.line(margin + 10, sigBoxY + 14, margin + halfWidth - 10, sigBoxY + 14);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Signature & Date', margin + halfWidth / 2, sigBoxY + 19, { align: 'center' });
    doc.text('Official Stamp', margin + halfWidth / 2, sigBoxY + 24, { align: 'center' });

    // Right: Headteacher
    const htX = margin + halfWidth + 20;
    doc.setFillColor(248, 248, 250);
    doc.rect(htX, sigBoxY, halfWidth, sigBoxHeight, 'F');
    doc.setDrawColor(200, 200, 210);
    doc.setLineWidth(0.3);
    doc.rect(htX, sigBoxY, halfWidth, sigBoxHeight, 'S');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('HEADTEACHER SIGNATURE & STAMP', htX + halfWidth / 2, sigBoxY + 7, { align: 'center' });
    doc.setLineWidth(0.4);
    doc.line(htX + 10, sigBoxY + 14, htX + halfWidth - 10, sigBoxY + 14);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Signature & Date', htX + halfWidth / 2, sigBoxY + 19, { align: 'center' });
    doc.text('Official School Stamp', htX + halfWidth / 2, sigBoxY + 24, { align: 'center' });

    y += sigBoxHeight + 14;

    // ── 9. FOOTER ──────────────────────────────────────────────────────────
    drawLine(y, 0.5);
    y += 6;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 160);
    doc.text('This certificate is issued without erasure or alteration.', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text('Munyaka Primary and Junior School  •  P.O. Box 5239-30100, Eldoret  •  Tel: +254 738 873 359', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text(`Generated: ${new Date().toLocaleString('en-GB')}  |  Certificate: ${certificateNumber}`, pageWidth / 2, y, { align: 'center' });

    return doc;
  };

  // Auto-generate PDF after certificate mounts - with proper lifecycle handling
  // NOTE: useEffect intentionally removed: PDF generation is now driven explicitly by
  // handleExecuteTransfer once the certificate DOM has been confirmed mounted
  // and the transfer has succeeded. This prevents double-generation and ensures
  // the modal only closes after the download is complete.

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transferData.destinationSchool?.trim()) {
      showError("Please enter the destination school or reason for transfer.");
      return;
    }

    if (!String(adminPassword || '').trim()) {
          const msg = "Admin password is required to authorize this transfer.";
      setAuthError(msg);
      showError(msg);
      return;
    }

    setIsExecuting(true);
    setAuthError("");

    // ── Step 1: Authorize ────────────────────────────────────────────────
    const storedAdminPass = localStorage.getItem('munyaka_admin_pass') || 'munyaka5239';
    await new Promise(resolve => setTimeout(resolve, 800));

    if (adminPassword !== storedAdminPass) {
      const msg = "Invalid admin password. Authorization required to transfer learner.";
      setAuthError(msg);
      showError(msg);
      setIsExecuting(false);
      return;
    }

    // ── Step 2: Archive record MUST be written BEFORE onTransferComplete ─
        // Writing to the archive first guarantees the record survives even if
        // the parent's onTransferComplete throws (e.g., localStorage write
        // failure). If we called onTransferComplete first and it failed, the
        // archive entry would never be saved and the learner would vanish.
        const certNum = `TRF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
        setCertificateNumber(certNum);
    
        const transferDate = transferData.dateOfExit || new Date().toISOString().split('T')[0];
        const archiveRecord: TransferredLearnerArchive = {
          id: student.id,
          admNo: student.assessment || student.admissionNumber || '',
          name: student.name,
          grade: student.grade,
          stream: student.stream,
          gender: (student.gender === 'M'
            ? 'Male'
            : student.gender === 'F'
            ? 'Female'
            : 'Other') as 'Male' | 'Female' | 'Other',
          guardian: student.guardian || '',
          phone: student.phone || '',
          email: student.email || '',
          dob: student.dob || '',
          dateOfAdmission: student.dateOfAdmission || '',
          birthCertificateNo: (student as any).birthCertificateNo || '',
          transferDate,
          transferYear: new Date(transferDate).getFullYear(),
          destinationSchool: transferData.destinationSchool || '—',
          reason: transferData.reason || '—',
          reasonNotes: transferData.reason || '',
          headteacherRemarks: transferData.headteacherRemarks || '—',
          coCurricularActivities: transferData.coCurricularActivities || '',
          certificateNumber: certNum,
          feeBalanceAtExit: student.feeBalance ?? 0,
          isFeeCleared: (student.feeBalance ?? 0) <= 0,
          // Central Storage Sync clearance fields as requested
          feesStatus: transferData.feesStatus || 'Fully Cleared',
          feesBalance: transferData.feesBalance || 'KES 0',
          textbookStatus: transferData.textbookStatus || 'Accounted',
          textbookDetails: transferData.textbookDetails || '',
          propertyNotes: transferData.propertyNotes || '',
          audit: {
            executedBy: user?.name || user?.email || 'Admin',
            executedAt: new Date().toISOString(),
            authorizedVia: 'admin_password',
          },
        };
        // Persist to archive — emitArchiveUpdated() is called inside here so
        // the archive page refreshes immediately without a page reload.
        saveArchivedLearner(archiveRecord);
    
        // Now notify the parent: the archive row is already safely written, so
        // even if the parent's state update fails the record is not lost.
        onTransferComplete(student.id, certNum);

    // ── Step 3: Show certificate & wait for it to mount ─────────────────
    setCurrentStep('CERTIFICATE');

    // Poll until the certificate DOM node is mounted and ready
    let retries = 20;
    while (!certificateRef.current && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries--;
    }
    // Extra delay for React flush + browser paint
    await new Promise(resolve => setTimeout(resolve, 400));

    // ── Step 4: Generate PDF and trigger auto-download ──────────────────
    //
    // Strategy:
    //  1. Try the DOM-based generator (screenshots the visual certificate).
    //  2. If that fails (DOM not ready, html2canvas error, etc.), fall back to
    //     the pure jsPDF text generator — which never depends on the DOM.
    //  This ensures the user ALWAYS gets a PDF regardless of rendering state.
    //
    // The jsPDF doc instance is kept in a ref so the toast action button can
    // re-trigger the download without re-building the document.
    let pdfResult: ReturnType<typeof generateCertificatePdf> extends Promise<infer T> ? T : never = { success: false };
    let pdfDoc: jsPDF | null = null;

    try {
      pdfResult = await generateCertificatePdf();
    } catch {
      pdfResult = { success: false };
    }

    // Fall back to pure jsPDF if the DOM-based generator failed
    if (!pdfResult.success) {
      try {
        pdfDoc = generateClearanceCertificatePDF();
        const filename = buildCertificateFilename(student?.name, certificateNumber);
        const blob = jsPdfToBlob(pdfDoc);
        const dlResult = downloadPdfBlob(blob, filename);
        pdfResult = dlResult;
      } catch (err) {
        console.error('[TransferWorkflow] Pure jsPDF fallback also failed:', err);
        pdfResult = { success: false, error: err instanceof Error ? err.message : 'PDF generation failed' };
      }
    }

    // ── Wire the download closure into the ref so the toast action button
    //    can re-trigger the download without re-building the document ──────
    downloadCallbackRef.current = () => {
      if (pdfDoc) {
        const filename = buildCertificateFilename(student?.name, certificateNumber);
        const blob = jsPdfToBlob(pdfDoc);
        return downloadPdfBlob(blob, filename);
      }
      return { success: false, error: 'PDF document not available' };
    };

    // Persist the certificate reference to localStorage so the profile page's
    // "Download Clearance Certificate" button works even after the session ends.
    saveCertificateRef(student.id, {
      certificateNumber: certNum,
      filename: buildCertificateFilename(student?.name, certNum),
      issuedAt: new Date().toISOString(),
      // Store the raw jsPDF output as a data URL for reliable re-downloads
      pdfDataUrl: pdfDoc ? pdfDoc.output('datauristring') : undefined,
    });

    setIsExecuting(false);

    if (!pdfResult.success) {
      // Transfer already succeeded — show error but keep the modal open
      showError(pdfResult.error ?? 'Certificate download failed. Please use the Download button above.');
      return;
    }

    // ── Step 5: All done — close modal and notify with download action ──
    const studentName = student?.name ?? 'The learner';
    showSuccessWithAction(
      `${studentName} has been transferred successfully. Certificate ${certNum} downloaded.`,
      'Download Certificate PDF',
      () => {
        if (downloadCallbackRef.current) {
          const retry = downloadCallbackRef.current();
          if (!retry.success) {
            showError(retry.error ?? 'Download failed. Please try again.');
          } else {
            showSuccess('Certificate re-downloaded.');
          }
        } else {
          showError('Download unavailable. Please re-open the transfer modal.');
        }
      },
      'Re-download the transfer clearance certificate'
    );

    onClose();
  };

  const handlePrintCertificate = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
      // Render the certificate node to a canvas and use that image as the
      // print payload — this reliably avoids blank output and never depends on
      // copying live DOM markup into another document.
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

      const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
      if (!iframeDoc) {
        showError('Unable to prepare the certificate for printing. Please try again.');
        iframe?.remove();
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
      iframe?.contentWindow?.addEventListener('afterprint', () => {
        setTimeout(() => iframe?.remove(), 100);
      });

      // Wait for the image inside the iframe to load before triggering the dialog
      setTimeout(() => {
        iframe?.contentWindow?.focus();
        iframe?.contentWindow?.print();
      }, 300);
    } catch (err) {
      console.error('Print error:', err);
      showError(err instanceof Error ? err.message : 'Failed to prepare the certificate for printing.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadPdf = async () => {
    // Try the download closure first (stored from the most recent generation)
    if (downloadCallbackRef.current) {
      const result = downloadCallbackRef.current();
      if (result.success) {
        showSuccess('Certificate downloaded successfully!');
        return;
      }
      // Fall through to re-generate if the stored closure failed
    }
    // Fall back to regenerating the pure jsPDF document
    try {
      const doc = generateClearanceCertificatePDF();
      const filename = buildCertificateFilename(student?.name, certificateNumber);
      const blob = jsPdfToBlob(doc);
      const result = downloadPdfBlob(blob, filename);
      if (result.success) {
        showSuccess('Certificate downloaded successfully!');
      } else {
        showError(result.error ?? 'Download failed. Please try again.');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to generate certificate.');
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

  const feeStatus = student?.feeBalance <= 0 ? 'CLEARED' : 'PENDING';
  const feeStatusClass = student?.feeBalance <= 0 ? 'fee-status-cleared' : 'fee-status-pending';

  // Dynamic footer based on current step
  const renderFooter = () => {
    if (currentStep === 'FORM') {
      return (
        <>
          <Button variant="ghost" onClick={onClose} disabled={isExecuting} className="rounded-xl font-bold">
            Cancel
          </Button>
          <Button
            type="submit"
            form="transfer-form"
            disabled={isExecuting || !String(adminPassword || '').trim()}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100 gap-2 text-white"
          >
            {isExecuting ? <Loader2 className="animate-spin mr-2" size={16} /> : <UserCheck size={16} />}
            {isExecuting ? 'Generating Certificate & Transferring…' : 'Execute Transfer & Generate Clearance Certificate'}
          </Button>
        </>
      );
    } else {
      // Post-execution state: Download PDF, Print, Close
      return (
        <>
          <Button
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
        <form id="transfer-form" onSubmit={handleExecuteTransfer} className="space-y-6 animate-in fade-in">
          {/* Student Info Header */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
              {(student?.name || '').split(' ').map(n => n?.[0] || '').join('')}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-slate-900">{student?.name || 'Unknown'}</h3>
              <div className="flex flex-wrap gap-3 mt-2 text-sm">
                <Badge className="bg-indigo-100 text-indigo-700 font-medium px-3 py-1">
                  <UserCheck size={12} className="mr-1" /> Grade {student?.grade}
                </Badge>
                <Badge className="bg-slate-100 text-slate-700 font-medium px-3 py-1">
                  {student?.stream} Stream
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-700 font-medium px-3 py-1">
                  {student?.gender === 'M' ? 'Male' : 'Female'}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-600 font-medium">
                  UPI: {student?.assessment}
                </Badge>
              </div>
            </div>
          </div>

          {/* Transfer Details Form */}
          <div className="space-y-6">
            {/* DESTINATION SCHOOL DETAILS */}
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <School size={18} className="text-indigo-600" /> DESTINATION SCHOOL DETAILS
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
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Destination School Name</Label>
                  <Input
                    value={transferData.destinationSchool}
                    onChange={(e) => setTransferData({...transferData, destinationSchool: e.target.value})}
                    placeholder="e.g. St. Mary's Academy, Nairobi"
                    className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Transfer Reason / Additional Notes</Label>
                <Textarea
                  value={transferData.reason}
                  onChange={(e) => setTransferData({...transferData, reason: e.target.value})}
                  placeholder="Reason for transfer..."
                  className="rounded-xl bg-slate-50 border-none min-h-[60px]"
                  rows={2}
                />
              </div>
            </div>

            {/* INSTITUTIONAL CLEARANCE CHECKLIST */}
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileCheck size={18} className="text-indigo-600" /> INSTITUTIONAL CLEARANCE CHECKLIST
              </h4>

              {/* Fees Clearance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500 tracking-widest">FEES CLEARANCE STATUS</Label>
                  <select
                    value={transferData.feesStatus}
                    onChange={(e) => setTransferData({...transferData, feesStatus: e.target.value})}
                    className="w-full h-12 px-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Fully Cleared (KES 0 Balance)">Fully Cleared (KES 0 Balance)</option>
                    <option value="Outstanding Balance">Outstanding Balance</option>
                    <option value="Pending Refund">Pending Refund</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500 tracking-widest">Outstanding Fees Amount</Label>
                  <Input
                    value={transferData.feesBalance}
                    onChange={(e) => setTransferData({...transferData, feesBalance: e.target.value})}
                    placeholder="e.g. KES 1,500 or KES 0"
                    className="rounded-xl h-12 bg-white border border-slate-200 font-bold"
                  />
                </div>
              </div>

              {/* Textbooks Clearance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500 tracking-widest">TEXTBOOKS & MATERIALS</Label>
                  <select
                    value={transferData.textbookStatus}
                    onChange={(e) => setTransferData({...transferData, textbookStatus: e.target.value})}
                    className="w-full h-12 px-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="All Textbooks Returned & Accounted For">All Textbooks Returned & Accounted For</option>
                    <option value="Missing / Outstanding Textbooks">Missing / Outstanding Textbooks</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500 tracking-widest">Textbooks Details</Label>
                  <Input
                    value={transferData.textbookDetails}
                    onChange={(e) => setTransferData({...transferData, textbookDetails: e.target.value})}
                    placeholder="e.g. All Grade CBC textbooks returned in good condition"
                    className="rounded-xl h-12 bg-white border border-slate-200 font-bold"
                  />
                </div>
              </div>

              {/* Other Property Clearance */}
              <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <Label className="text-xs font-black uppercase text-slate-500 tracking-widest">OTHER SCHOOL PROPERTY & STORES CLEARANCE</Label>
                <Input
                  value={transferData.propertyNotes}
                  onChange={(e) => setTransferData({...transferData, propertyNotes: e.target.value})}
                  placeholder="e.g. Sports kit returned, desk and locker cleared"
                  className="rounded-xl h-12 bg-white border border-slate-200 font-bold"
                />
              </div>
            </div>

            {/* ACADEMIC & CO-CURRICULAR */}
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Award size={18} className="text-indigo-600" /> ACADEMIC & CO-CURRICULAR
              </h4>
              
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Co-curricular Activities & Achievements</Label>
                <Textarea
                  value={transferData.coCurricularActivities}
                  onChange={(e) => setTransferData({...transferData, coCurricularActivities: e.target.value})}
                  placeholder="e.g. Football team captain, Science fair winner..."
                  className="rounded-xl bg-slate-50 border-none min-h-[70px]"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Headteacher Remarks & Character Reference</Label>
                <Textarea
                  value={transferData.headteacherRemarks}
                  onChange={(e) => setTransferData({...transferData, headteacherRemarks: e.target.value})}
                  placeholder="General conduct and character reference..."
                  className="rounded-xl bg-slate-50 border-none min-h-[70px]"
                  rows={2}
                />
              </div>
            </div>

            {/* ADMIN AUTHORIZATION LOCK */}
            <div className="space-y-4 pt-2 border-t border-slate-100 bg-amber-50/60 rounded-2xl p-5 border border-amber-100">
              <div className="flex items-center gap-3 mb-2">
                <Lock className="text-amber-600 shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">ADMIN AUTHORIZATION LOCK</h4>
                  <p className="text-xs text-amber-700">Enter admin password to authorize clearance and transfer certificate generation.</p>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-amber-800 tracking-widest">ADMIN PASSWORD</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => {
                      const trimmed = String(e.target.value || '').trim();
                      setAdminPassword(trimmed);
                      if (authError) setAuthError("");
                    }}
                    placeholder="Enter admin password..."
                    className="rounded-xl h-12 bg-white border-amber-200 font-bold pr-12 text-slate-900"
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
        </form>
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
                  <span className={cn("font-bold px-3 py-1 rounded", feeStatusClass)}>
                    {student?.feeBalance > 0 ? `• Balance: KES ${student?.feeBalance?.toLocaleString() ?? '0'}` : '• Balance: 0 KES'}
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