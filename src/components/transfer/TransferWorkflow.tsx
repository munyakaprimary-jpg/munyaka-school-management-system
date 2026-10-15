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
  const [authError, setAuthError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const downloadCallbackRef = useRef<(() => DownloadPdfResult) | null>(null);
  
  const certificateRef = useRef<HTMLDivElement | null>(null);
  const [isCertificateMounted, setIsCertificateMounted] = useState(false);

  // Callback ref to detect when certificate DOM node is mounted
  const certificateRefCallback = useCallback((node: HTMLDivElement | null) => {
    certificateRef.current = node;
    setIsCertificateMounted(!!node);
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

  useEffect(() => {
    console.log("FULL LEARNER OBJECT:", student);
  }, [student]);

  const [assessmentNoState, setAssessmentNoState] = useState<string>(
    (student as any)?.assessment_no || (student as any)?.assessment_number || (student as any)?.cba_number || (student as any)?.upi || ''
  );

  useEffect(() => {
    const directAssessment =
      (student as any)?.assessment_no ||
      (student as any)?.assessment_number ||
      (student as any)?.cba_number ||
      (student as any)?.upi;
    if (directAssessment) {
      setAssessmentNoState(directAssessment);
    } else if (student?.id) {
      import('@/lib/supabase').then(({ supabase }) => {
        if (supabase) {
          supabase
            .from('learners')
            .select('assessment_no')
            .eq('id', student.id)
            .single()
            .then(({ data }) => {
              if (data?.assessment_no || data?.assessment_number || data?.cba_number || data?.upi) {
                setAssessmentNoState(data.assessment_no || data.assessment_number || data.cba_number || data.upi);
              }
            })
            .catch(() => {
              // fallback to students table or local storage if needed
              try {
                const raw = window.localStorage.getItem('school_learners_data');
                if (raw) {
                  const parsed = JSON.parse(raw);
                  const found = parsed.find((l: any) => l.id === student.id);
                  const foundAss = found?.assessment_no || found?.assessment_number || found?.cba_number || found?.upi;
                  if (foundAss) {
                    setAssessmentNoState(foundAss);
                  }
                }
              } catch {}
            });
        }
      });
    }
  }, [student]);

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    const certNum = `TRANS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    setCertificateNumber(certNum);
    const learnerName = student?.name || '';
    const admissionNo = (student as any)?.admission_no || (student as any)?.admissionNo || (student as any)?.admNo || 'N/A';
    const realAssessmentNo =
      assessmentNoState ||
      (student as any)?.assessment_no ||
      (student as any)?.assessment_number ||
      (student as any)?.cba_number ||
      (student as any)?.upi;
    const grade = student?.grade || 'N/A';
    const stream = student?.stream || 'N/A';
    const exitDate = transferData.dateOfExit ? new Date(transferData.dateOfExit).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
    const destinationSchool = transferData.destinationSchool || 'N/A';
    const coCurricular = transferData.coCurricularActivities || 'N/A';
    const headteacherRemarks = transferData.headteacherRemarks || 'Cleared from all school departments.';
    const feeStatus = student?.feeBalance && student.feeBalance > 0 ? `Outstanding Balance: KES ${student.feeBalance.toLocaleString()}` : 'Fully Cleared (KES 0 Balance)';
    const learnerId = student?.id;

    // 1. Build comprehensive official certificate HTML content
    const certContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Official Transfer & Clearance Certificate - ${learnerName || 'Learner'}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #1e293b; background: #fff; line-height: 1.4; }
          .cert-container { max-width: 800px; margin: 0 auto; border: 4px double #0f172a; padding: 30px; }
          .header { text-align: center; border-bottom: 3px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .school-name { font-size: 22px; font-weight: 900; letter-spacing: 1px; color: #0f172a; margin: 0 0 4px 0; }
          .motto { font-size: 11px; font-style: italic; color: #475569; margin: 0 0 6px 0; }
          .contact { font-size: 10.5px; color: #64748b; }
          .cert-title { text-align: center; font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; background: #f1f5f9; padding: 8px; border-radius: 4px; margin-bottom: 15px; color: #0f172a; }
          .meta-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
          .bio-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; margin-bottom: 15px; font-size: 13px; }
          .bio-row { display: flex; border-bottom: 1px dotted #e2e8f0; padding-bottom: 4px; }
          .bio-row.full { grid-column: span 2; }
          .label { font-weight: 700; color: #475569; width: 170px; flex-shrink: 0; }
          .value { font-weight: 600; color: #0f172a; }
          .section-title { font-size: 12.5px; font-weight: 800; text-transform: uppercase; background: #e2e8f0; padding: 5px 10px; margin: 15px 0 8px 0; border-left: 4px solid #4f46e5; color: #1e293b; }
          .clearance-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12.5px; }
          .clearance-table th, .clearance-table td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
          .clearance-table th { background: #f8fafc; font-weight: 700; color: #334155; }
          .status-cleared { color: #15803d; font-weight: 700; }
          .status-bal { color: #b91c1c; font-weight: 700; }
          .remarks-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px; font-size: 12.5px; min-height: 35px; margin-bottom: 12px; }
          .declaration { font-size: 13px; font-weight: 500; text-align: justify; margin: 15px 0; line-height: 1.6; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; }
          .sig-box { border: 1px dashed #94a3b8; padding: 12px; border-radius: 6px; text-align: center; background: #fafafa; }
          .sig-line { border-bottom: 1px solid #475569; width: 85%; margin: 35px auto 6px auto; }
          .sig-title { font-size: 11px; font-weight: 700; color: #334155; }
          .footer { text-align: center; margin-top: 25px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="cert-container">
          <div class="header">
            <h1 class="school-name">MUNYAKA PRIMARY AND JUNIOR SCHOOL</h1>
            <p class="motto">"Knowledge and Excellence"</p>
            <p class="contact">P.O. Box 5239-30100 Eldoret | Phone: +254 712 345 678 | Email: info@munyakaschool.sc.ke</p>
          </div>

          <div class="cert-title">Official Learner Clearance & Transfer Certificate</div>

          <div class="meta-row">
            <span>Certificate Serial No: <strong>${certNum}</strong></span>
            <span>Date of Issue: <strong>${new Date().toLocaleDateString('en-GB')}</strong></span>
          </div>

          <div class="section-title">Learner Bio-Data</div>
          <div class="bio-grid">
            <div class="bio-row"><span class="label">Full Name:</span> <span class="value">${learnerName}</span></div>
            <div class="bio-row"><span class="label">Admission Number:</span> <span class="value">${admissionNo}</span></div>
            <div class="bio-row"><span class="label">Assessment Number:</span> <span class="value">${realAssessmentNo ? realAssessmentNo : 'N/A'}</span></div>
            <div class="bio-row"><span class="label">Grade / Level:</span> <span class="value">${grade}</span></div>
            <div class="bio-row"><span class="label">Stream:</span> <span class="value">${stream}</span></div>
            <div class="bio-row"><span class="label">Date of Exit:</span> <span class="value">${exitDate}</span></div>
            <div class="bio-row full"><span class="label">Destination Institution:</span> <span class="value">${destinationSchool}</span></div>
          </div>

          <div class="section-title">Department Clearance Checklist</div>
          <table class="clearance-table">
            <thead>
              <tr>
                <th>Department / Section</th>
                <th>Clearance Status / Remarks</th>
                <th>Verified By</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Fee Clearance (Accounts)</strong></td>
                <td><span class="${student?.feeBalance && student.feeBalance > 0 ? 'status-bal' : 'status-cleared'}">${feeStatus}</span></td>
                <td>Accounts Office</td>
              </tr>
              <tr>
                <td><strong>Library & Learning Materials</strong></td>
                <td><span class="status-cleared">Cleared (All Textbooks Returned)</span></td>
                <td>Library Custodian</td>
              </tr>
              <tr>
                <td><strong>Sports & Co-Curricular Equipment</strong></td>
                <td><span class="status-cleared">Cleared (All Gear Returned)</span></td>
                <td>Sports Department</td>
              </tr>
              <tr>
                <td><strong>Class Teacher Clearance</strong></td>
                <td><span class="status-cleared">Cleared (Desk & Locker Clear)</span></td>
                <td>Class Teacher</td>
              </tr>
            </tbody>
          </table>

          <div class="section-title">Academic & Conduct Summary</div>
          <div class="label" style="margin-bottom:4px;">Co-Curricular Achievements & Talent Notes:</div>
          <div class="remarks-box">${coCurricular}</div>

          <div class="label" style="margin-bottom:4px;">Headteacher Conduct Remarks:</div>
          <div class="remarks-box">${headteacherRemarks}</div>

          <div class="declaration">
            <strong>Formal Declaration:</strong> This is to certify that the above-named learner has been fully cleared of all school obligations and is hereby officially transferred to <strong>${destinationSchool}</strong>.
          </div>

          <div class="signatures">
            <div class="sig-box">
              <div class="sig-title">CLASS TEACHER</div>
              <div class="sig-line"></div>
              <div style="font-size: 10px; color: #64748b;">Signature & Date</div>
            </div>
            <div class="sig-box">
              <div class="sig-title">HEADTEACHER</div>
              <div class="sig-line"></div>
              <div style="font-size: 10px; color: #64748b;">Signature, Date & Official School Stamp</div>
            </div>
          </div>

          <div class="footer">
            <p>Official Munyaka Primary and Junior School Transfer Document • Valid Only with Official School Stamp</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    // 2. Create Blob and trigger immediate download/print
    const blob = new Blob([certContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Clearance_Certificate_${learnerName || 'Student'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // 3. Update Supabase status asynchronously
    try {
      const { supabase } = await import('@/lib/supabase');
      if (supabase && learnerId) {
        await supabase.from('students').update({ status: 'Transferred Out' }).eq('id', learnerId);
      }
    } catch (err) {
      console.error("Supabase update error:", err);
    }

    // Also complete workflow state internally
    if (student) {
      const transferDate = transferData.dateOfExit || new Date().toISOString().split('T')[0];
      const archiveRecord: TransferredLearnerArchive = {
        id: student.id,
        admNo: admissionNo,
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
        feesStatus: (transferData.feesStatus || 'Fully Cleared') as any,
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
      saveArchivedLearner(archiveRecord);
      onTransferComplete(student.id, certNum);
      setCurrentStep('CERTIFICATE');
    }
  };

  const handlePrintCertificate = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
      const studentName = student?.name || 'Learner';
      const assessmentNo = student?.assessment || 'N/A';
      const grade = student?.grade || '—';
      const stream = student?.stream || '—';
      const gender = student?.gender === 'M' ? 'Male' : student?.gender === 'F' ? 'Female' : 'Other';
      const dob = student?.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '—';
      const doa = student?.dateOfAdmission ? new Date(student.dateOfAdmission).toLocaleDateString('en-GB') : '—';
      const exitDate = transferData.dateOfExit ? new Date(transferData.dateOfExit).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
      const destSchool = transferData.destinationSchool || 'Not specified';
      const feeText = (student?.feeBalance ?? 0) <= 0 ? 'Fully Cleared (0 KES Balance)' : `Outstanding Balance: KES ${student.feeBalance.toLocaleString()}`;
      const coCurr = transferData.coCurricularActivities || 'No co-curricular activities recorded.';
      const remarks = transferData.headteacherRemarks || 'No additional remarks provided.';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Official Clearance & Transfer Certificate - ${certificateNumber}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background: #ffffff; padding: 20px; line-height: 1.5; }
            .cert-card { max-width: 800px; margin: 0 auto; border: 3px double #0f172a; padding: 35px; background: #fff; position: relative; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
            .school-title { font-size: 22px; font-weight: 900; letter-spacing: 1px; color: #0f172a; margin-bottom: 4px; }
            .motto { font-size: 12px; font-style: italic; color: #475569; margin-bottom: 6px; }
            .address { font-size: 11px; color: #64748b; }
            .doc-title { text-align: center; font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; background: #f1f5f9; padding: 8px; border-radius: 6px; margin-bottom: 15px; color: #1e293b; }
            .meta-bar { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 20px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; margin-bottom: 20px; font-size: 13px; }
            .row-full { grid-column: span 2; }
            .label { font-weight: 700; color: #475569; display: inline-block; width: 180px; }
            .value { font-weight: 600; color: #0f172a; }
            .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; background: #e2e8f0; padding: 6px 10px; margin: 15px 0 8px 0; border-left: 4px solid #4f46e5; color: #1e293b; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 12px; border-radius: 6px; font-size: 12.5px; min-height: 45px; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 35px; }
            .sig-box { border: 1px dashed #cbd5e1; padding: 15px; border-radius: 8px; text-align: center; background: #fafafa; }
            .sig-line { border-bottom: 1px solid #94a3b8; width: 80%; margin: 30px auto 8px auto; }
            .sig-title { font-size: 11px; font-weight: 700; color: #475569; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="cert-card">
            <div class="header">
              <h1 class="school-title">MUNYAKA PRIMARY AND JUNIOR SCHOOL</h1>
              <p class="motto">"Knowledge is Power"</p>
              <p class="address">P.O. Box 5239-30100, Eldoret | Tel: +254 738 873 359 | Email: munyakaprimary@gmail.com</p>
            </div>

            <div class="doc-title">Official Learner Clearance & Transfer Certificate</div>

            <div class="meta-bar">
              <span>Certificate No: <strong>${certificateNumber}</strong></span>
              <span>Date Issued: <strong>${exitDate}</strong></span>
            </div>

            <div class="grid">
              <div><span class="label">Full Name:</span> <span class="value">${studentName}</span></div>
              <div><span class="label">Assessment / UPI No:</span> <span class="value">${assessmentNo}</span></div>
              <div><span class="label">Gender:</span> <span class="value">${gender}</span></div>
              <div><span class="label">Date of Birth:</span> <span class="value">${dob}</span></div>
              <div><span class="label">Date of Admission:</span> <span class="value">${doa}</span></div>
              <div><span class="label">Date of Exit:</span> <span class="value">${exitDate}</span></div>
              <div><span class="label">Grade & Stream:</span> <span class="value">Grade ${grade} — ${stream}</span></div>
              <div><span class="label">Fee Clearance:</span> <span class="value">${feeText}</span></div>
              <div class="row-full"><span class="label">Destination School:</span> <span class="value">${destSchool}</span></div>
            </div>

            <div class="section-title">Co-Curricular Activities & Achievements</div>
            <div class="box">${coCurr}</div>

            <div class="section-title">Headteacher Remarks & Character Reference</div>
            <div class="box">${remarks}</div>

            <div class="signatures">
              <div class="sig-box">
                <div class="sig-title">BURSAR / FINANCE CLEARANCE</div>
                <div class="sig-line"></div>
                <div style="font-size: 10px; color: #64748b;">Signature & Date | Official Stamp</div>
              </div>
              <div class="sig-box">
                <div class="sig-title">HEADTEACHER SIGNATURE & STAMP</div>
                <div class="sig-line"></div>
                <div style="font-size: 10px; color: #64748b;">Signature & Date | Official School Stamp</div>
              </div>
            </div>

            <div class="footer">
              <p>This certificate is issued without erasure or alteration. Munyaka Primary and Junior School • P.O. Box 5239-30100, Eldoret</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocker prevented the clearance certificate window from opening. Please allow popups for this site or use the Download PDF button.');
      }

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (err) {
      console.error('Print window error:', err);
      showError(err instanceof Error ? err.message : 'Failed to open printable clearance certificate window.');
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
            disabled={isExecuting}
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
        <div className="flex items-center justify-between w-full gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            data-html2canvas-ignore="true"
            className="no-print rounded-xl border-slate-200 bg-white font-bold px-6 shadow-sm"
          >
            Close
          </Button>
          <div className="flex items-center gap-3">
            <Button
              onClick={handlePrintCertificate}
              disabled={isPrinting || isGeneratingPdf}
              data-html2canvas-ignore="true"
              className="no-print rounded-xl bg-slate-700 hover:bg-slate-800 font-bold px-6 shadow-md gap-2 text-white"
            >
              {isPrinting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Printer size={16} />}
              Print Certificate
            </Button>
            <Button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              data-html2canvas-ignore="true"
              className="no-print rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-6 shadow-lg shadow-indigo-100 gap-2 text-white"
            >
              {isGeneratingPdf ? <Loader2 className="animate-spin mr-2" size={16} /> : <Download size={16} />}
              {isGeneratingPdf ? 'Generating PDF…' : 'Download Clearance PDF'}
            </Button>
          </div>
        </div>
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
                <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 font-medium">
                  Adm No: {(student as any)?.admission_no || (student as any)?.admissionNo || (student as any)?.admNo || 'N/A'}
                </Badge>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 font-medium">
                  Assessment Number: {
                    (() => {
                      const realAssessmentNo =
                        (student as any)?.assessment_no ||
                        (student as any)?.assessment_number ||
                        (student as any)?.cba_number ||
                        (student as any)?.upi ||
                        assessmentNoState;
                      return `Assessment Number: ${realAssessmentNo ? realAssessmentNo : 'N/A'}`;
                    })()
                  }
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