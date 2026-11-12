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

      const blob = jsPdfToBlob(pdf);
      const result = downloadPdfBlob(blob, filename);

      if (!result.success) {
        throw new Error(result.error ?? 'PDF download failed');
      }

      saveCertificateRef(student.id, {
        certificateNumber,
        filename,
        issuedAt: new Date().toISOString(),
        pdfDataUrl: pdf.output('datauristring'),
      });

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

  const [assessmentNo, setAssessmentNo] = useState<string>('Loading...');

  useEffect(() => {
    let isMounted = true;
    async function getAssessmentNumber() {
      if (!student) return;

      const adm = String((student as any)?.admissionNumber || (student as any)?.admission_no || (student as any)?.admNo || '').trim();

      try {
        const val = (student as any)?.assessmentNumber || (student as any)?.assessmentNo || (student as any)?.assessment || (student as any)?.birthCertificateNo;
        if (val && !String(val).startsWith('MUN')) {
          setAssessmentNo(val);
        } else if (adm && !adm.startsWith('MUN')) {
          setAssessmentNo(adm);
        } else {
          setAssessmentNo(adm || (student as any)?.birthCertificateNo || 'N/A');
        }
      } catch (err) {
        if (isMounted) setAssessmentNo('N/A');
      }
    }

    getAssessmentNumber();
    return () => { isMounted = false; };
  }, [student?.id, (student as any)?.admissionNumber, (student as any)?.admission_no, (student as any)?.admNo, (student as any)?.assessmentNumber, (student as any)?.assessmentNo, (student as any)?.birthCertificateNo]);

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    const schoolProfile = JSON.parse(localStorage.getItem('school_profile') || '{}');
    const schoolName = schoolProfile.school_name || 'Munyaka Primary and Junior School';
    const postalAddress = schoolProfile.postal_address || 'P.O. Box 5239-30100, Eldoret';
    const phone = schoolProfile.phone || schoolProfile.phone_contact || '+254 738873359';
    const email = schoolProfile.email || 'munyakaprimary@gmail.com/munyakajss@gmail.com';

    const certNum = `TRANS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    setCertificateNumber(certNum);
    const learnerName = student?.name || '';
    const admissionNo = (student as any)?.admissionNumber || (student as any)?.admission_no || (student as any)?.admNo || 'N/A';
    const assessmentNoValue = assessmentNo !== 'Loading...' ? assessmentNo : ((student as any)?.assessmentNumber || (student as any)?.assessmentNo || (student as any)?.assessment || (student as any)?.birthCertificateNo || admissionNo);
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
          .cert-container { max-width: 800px; margin: 0 auto; border: 4px double #0f172a; padding: 20px 24px; box-sizing: border-box; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
          .school-name { font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #0f172a; margin: 0 0 2px 0; }
          .motto { font-size: 10px; font-style: italic; color: #475569; margin: 0 0 4px 0; }
          .contact { font-size: 10px; color: #64748b; }
          .cert-title { text-align: center; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; background: #f1f5f9; padding: 6px; border-radius: 4px; margin-bottom: 10px; color: #0f172a; }
          .meta-row { display: flex; justify-content: space-between; font-size: 11.5px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
          .bio-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; margin-bottom: 10px; font-size: 12px; }
          .bio-row { display: flex; border-bottom: 1px dotted #e2e8f0; padding-bottom: 3px; }
          .bio-row.full { grid-column: span 2; }
          .label { font-weight: 700; color: #475569; width: 160px; flex-shrink: 0; }
          .value { font-weight: 600; color: #0f172a; }
          .section-title { font-size: 11.5px; font-weight: 800; text-transform: uppercase; background: #e2e8f0; padding: 4px 8px; margin: 10px 0 6px 0; border-left: 4px solid #4f46e5; color: #1e293b; }
          .clearance-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11.5px; }
          .clearance-table th, .clearance-table td { border: 1px solid #cbd5e1; padding: 4px 8px; text-align: left; }
          .clearance-table th { background: #f8fafc; font-weight: 700; color: #334155; }
          .status-cleared { color: #15803d; font-weight: 700; }
          .status-bal { color: #b91c1c; font-weight: 700; }
          .remarks-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; border-radius: 4px; font-size: 11.5px; min-height: 28px; margin-bottom: 8px; }
          .declaration { font-size: 12px; font-weight: 500; text-align: justify; margin: 10px 0; line-height: 1.4; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; }
          .sig-box { border: 1px dashed #94a3b8; padding: 8px; border-radius: 6px; text-align: center; background: #fafafa; }
          .sig-line { border-bottom: 1px solid #475569; width: 85%; margin: 25px auto 4px auto; }
          .sig-title { font-size: 10.5px; font-weight: 700; color: #334155; }
          .footer { text-align: center; margin-top: 15px; font-size: 9.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 6px; }

          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 10mm 12mm;
            }
            html, body {
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 0;
              overflow: hidden;
            }
            .cert-container, .clearance-certificate-container {
              max-height: 275mm;
              box-sizing: border-box;
              border: 3px double #0f172a !important;
              padding: 15px 20px !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="cert-container">
          <div style="text-align: center; margin-bottom: 16px;">
            <h1 style="font-size: 22px; font-weight: 800; margin: 0; text-transform: uppercase; color: #0f172a;">
              ${schoolName}
            </h1>
            <p style="font-size: 13px; margin: 6px 0; color: #334155; font-weight: 500;">
              ${postalAddress} &nbsp;&vert;&nbsp; Phone:${phone}
            </p>
            <p style="font-size: 12px; margin: 2px 0; color: #475569;">
              Email: ${email}
            </p>
          </div>
          <hr style="border: none; border-top: 2px solid #0f172a; margin-top: 10px; margin-bottom: 20px;" />

          <div class="cert-title">Official Learner Clearance & Transfer Certificate</div>

          <div class="meta-row">
            <span>Certificate Serial No: <strong>${certNum}</strong></span>
            <span>Date of Issue: <strong>${new Date().toLocaleDateString('en-GB')}</strong></span>
          </div>

          <div class="section-title">Learner Bio-Data</div>
          <div class="bio-grid">
            <div class="bio-row"><span class="label">Full Name:</span> <span class="value">${learnerName}</span></div>
            <div class="bio-row"><span class="label">Admission Number:</span> <span class="value">${admissionNo}</span></div>
            <div class="bio-row"><span class="label">Assessment Number:</span> <span class="value">${assessmentNoValue}</span></div>
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

    const blob = new Blob([certContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Clearance_Certificate_${learnerName || 'Student'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

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

  const formattedGrade = (() => {
    const g = String(student?.grade || '').trim();
    if (!g) return 'N/A';
    if (g.toLowerCase().startsWith('grade')) return g;
    return `Grade ${g}`;
  })();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentStep === 'FORM' ? 'Learner Transfer & Clearance Workflow' : 'Official Clearance Certificate'}
      description={currentStep === 'FORM'
                    ? `Initiate transfer for ${student?.name || 'Unknown'} (${(student as any)?.admissionNumber || (student as any)?.admission_no || (student as any)?.admNo || student?.id || 'N/A'})`
                    : `Official Clearance Certificate for ${student?.name || 'Unknown'}`}
      maxWidth="max-w-4xl"
    >
      {currentStep === 'FORM' ? (
        <form onSubmit={handleExecuteTransfer} className="space-y-6">
          {/* Student Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 text-base">{student?.name || 'Unknown Learner'}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Adm No: <span className="font-mono font-bold text-slate-700">{(student as any)?.admissionNumber || (student as any)?.admission_no || student?.admNo || student?.id || 'N/A'}</span>
                {' • '}
                Assessment/NEMIS: <span className="font-mono font-bold text-slate-700">{assessmentNo !== 'Loading...' ? assessmentNo : ((student as any)?.assessmentNumber || (student as any)?.assessmentNo || (student as any)?.assessment || (student as any)?.birthCertificateNo || 'N/A')}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className="bg-indigo-600 text-white font-bold rounded-lg">
                {formattedGrade}
              </Badge>
              <span className="text-xs text-slate-500 font-medium">Stream: {student?.stream || 'N/A'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Destination School *</Label>
              <Input
                required
                placeholder="e.g. Kipkaren Primary School"
                value={transferData.destinationSchool}
                onChange={(e) => setTransferData({ ...transferData, destinationSchool: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Date of Exit *</Label>
              <Input
                type="date"
                required
                value={transferData.dateOfExit}
                onChange={(e) => setTransferData({ ...transferData, dateOfExit: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Reason for Transfer *</Label>
            <Textarea
              required
              rows={2}
              placeholder="e.g. Relocation of parents / Guardians"
              value={transferData.reason}
              onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
              className="rounded-xl resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Headteacher Conduct Remarks & Character Reference</Label>
            <Textarea
              rows={2}
              placeholder="e.g. Exemplary discipline, active in sports and academics..."
              value={transferData.headteacherRemarks}
              onChange={(e) => setTransferData({ ...transferData, headteacherRemarks: e.target.value })}
              className="rounded-xl resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isExecuting}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2 px-6"
            >
              {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
              Generate Certificate & Transfer Out
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-emerald-900">Transfer Completed Successfully!</h3>
            <p className="text-sm text-emerald-700 max-w-md mx-auto">
              Official Clearance Certificate <strong className="font-mono">{certificateNumber}</strong> has been generated and downloaded. {student.name} has been moved to the Transferred Archive.
            </p>
          </div>

          {/* Hidden/Rendered certificate node for preview */}
          <div className="border rounded-2xl p-6 bg-white shadow-sm overflow-auto max-h-[400px]">
            <div ref={certificateRefCallback} id="certificate-node" className="p-8 bg-white max-w-2xl mx-auto border-4 double border-slate-900 text-slate-900 font-sans">
              <div className="text-center pb-4 border-b-2 border-slate-900 mb-4">
                <h2 className="text-xl font-black uppercase tracking-wider">Munyaka Primary and Junior School</h2>
                <p className="text-xs text-slate-600 mt-1">P.O. Box 5239-30100, Eldoret • Tel: +254 738873359</p>
              </div>
              <h3 className="text-center font-bold text-sm uppercase bg-slate-100 py-1.5 rounded mb-4">Official Clearance & Transfer Certificate</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-bold border-b pb-1">
                  <span>Certificate No: {certificateNumber}</span>
                  <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div><strong>Full Name:</strong> {student.name}</div>
                  <div><strong>Admission No:</strong> {(student as any)?.admissionNumber || (student as any)?.admission_no || student?.admNo || 'N/A'}</div>
                  <div><strong>Assessment/NEMIS:</strong> {assessmentNo !== 'Loading...' ? assessmentNo : ((student as any)?.assessmentNumber || (student as any)?.assessmentNo || ((student as any)?.assessment || (student as any)?.birthCertificateNo || 'N/A'))}</div>
                  <div><strong>Grade / Stream:</strong> {formattedGrade}, {student.stream}</div>
                  <div className="col-span-2"><strong>Destination School:</strong> {transferData.destinationSchool}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              onClick={onClose}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-8"
            >
              Done & Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default TransferWorkflow;
