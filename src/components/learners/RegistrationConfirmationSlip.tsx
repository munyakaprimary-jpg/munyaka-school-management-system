import React, { useRef } from 'react';
import { School, Printer, Download, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showSuccess, showError } from '@/utils/toast';

export interface RegistrationSlipData {
  admissionNo: string;
  assessmentNo: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  nationality: string;
  birthCertificateNo: string;
  specialNeeds: string;
  gradeLevel: string;
  assignedStream: string;
  registrationDate: string;
  registrationOfficer: string;
  schoolAddress: string;
  centreCode: string;
}

interface RegistrationConfirmationSlipProps {
  data: RegistrationSlipData;
  onClose?: () => void;
  isOpen?: boolean;
}

export const RegistrationConfirmationSlip: React.FC<RegistrationConfirmationSlipProps> = ({
  data,
  onClose,
  isOpen = true,
}) => {
  const slipRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (!slipRef.current) return;
    const printContent = slipRef.current.innerHTML;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      showError('Please allow popups for printing.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Learner Registration Confirmation Slip - ${data.admissionNo}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              color: #1e293b;
              background: #ffffff;
              margin: 0;
              padding: 20px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .slip-card {
              max-width: 210mm;
              margin: 0 auto;
              background: #ffffff;
              border: 2px solid #0f172a;
              border-radius: 12px;
              padding: 32px;
              box-sizing: border-box;
            }
            .header-bar {
              text-align: center;
              border-bottom: 3px double #0f172a;
              padding-bottom: 20px;
              margin-bottom: 24px;
            }
            .school-title {
              font-size: 20px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #0f172a;
              margin: 8px 0 4px 0;
            }
            .subtitle {
              font-size: 13px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 2px;
              color: #2563eb;
              margin: 6px 0;
            }
            .meta-details {
              font-size: 11px;
              font-weight: 600;
              color: #475569;
              margin-top: 4px;
            }
            .section-title {
              font-size: 12px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              background: #0f172a;
              color: #ffffff;
              padding: 6px 12px;
              border-radius: 4px;
              margin: 24px 0 12px 0;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
    showSuccess('Printer dialog opened successfully.');
  };

  const handleDownloadPDF = () => {
    handlePrint();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white" data-no-print>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold tracking-tight">Official Registration Confirmation Slip</h2>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handlePrint}
              size="sm"
              variant="outline"
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print Slip
            </Button>
            <Button
              onClick={handleDownloadPDF}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Download PDF
            </Button>
            {onClose && (
              <Button
                onClick={onClose}
                size="sm"
                variant="ghost"
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </Button>
            )}
          </div>
        </div>

        <div className="p-8 sm:p-10 max-h-[80vh] overflow-y-auto bg-slate-50">
          <div ref={slipRef} className="slip-card bg-white shadow-sm border border-slate-300 rounded-xl p-8 max-w-[210mm] mx-auto">
            <div className="header-bar text-center border-b-2 border-slate-900 pb-6 mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-900 text-white mb-2 shadow-inner">
                <School className="w-6 h-6" />
              </div>
              <h1 className="school-title text-xl font-black text-slate-900 uppercase tracking-wide">
                MUNYAKA PRIMARY & JUNIOR SECONDARY SCHOOL
              </h1>
              <div className="subtitle text-xs font-extrabold text-blue-700 uppercase tracking-widest mt-1">
                OFFICIAL LEARNER REGISTRATION CONFIRMATION SLIP
              </div>
              <div className="meta-details text-xs font-semibold text-slate-600 mt-2">
                {data.schoolAddress || 'P.O. BOX 5239-30100 ELDORET'} &nbsp;•&nbsp; CENTRE CODE: <strong className="font-mono">{data.centreCode || '26534178'}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-300 rounded-lg p-4 mb-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Admission No.</label>
                <span className="text-base font-black font-mono text-slate-900">{data.admissionNo || 'MUN-2025-000'}</span>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assessment No.</label>
                <span className="text-base font-black font-mono text-slate-900">{data.assessmentNo || 'B000000000'}</span>
              </div>
            </div>

            <div>
              <div className="section-title bg-slate-900 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded mb-3">
                Section 1 — Learner Particulars
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-slate-500">Full Name</span>
                  <span className="font-extrabold text-slate-900 uppercase">{data.fullName || '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-slate-500">Gender</span>
                  <span className="font-bold text-slate-800">{data.gender || '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-slate-500">Date of Birth</span>
                  <span className="font-bold font-mono text-slate-800">{data.dateOfBirth || '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-slate-500">Nationality & Birth Certificate No.</span>
                  <span className="font-bold font-mono text-slate-800">{data.nationality || 'Kenyan'} &nbsp;|&nbsp; {data.birthCertificateNo || '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-slate-500">Special Needs / Disability Status</span>
                  <span className="font-bold text-slate-800">{data.specialNeeds || 'None / Regular'}</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="section-title bg-slate-900 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded mb-3">
                Section 2 — Academic Enrollment Details
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-slate-500">Grade Level & Assigned Stream</span>
                  <span className="font-extrabold text-blue-700">{data.gradeLevel || '—'} &nbsp;•&nbsp; Stream: {data.assignedStream || 'East'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-slate-500">Registration Date & Timestamp</span>
                  <span className="font-bold font-mono text-slate-800">{data.registrationDate || new Date().toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="font-bold text-slate-500">Registration Officer / School Admin</span>
                  <span className="font-bold text-slate-800">{data.registrationOfficer || 'School Registrar / Admin'}</span>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-300 flex justify-between items-end">
              <div>
                <p className="text-[10px] text-slate-500 font-medium">This document is electronically generated and is valid</p>
                <p className="text-[10px] text-slate-500 font-medium">for official school records and KNEC / NEMIS verification.</p>
              </div>
              <div className="text-center">
                <div className="w-48 border-b border-slate-900 pb-1 mb-1 font-mono text-xs font-bold text-slate-800">
                  {data.registrationOfficer || 'Authorized Signature'}
                </div>
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  Registration Officer Signature & Stamp
                </div>
              </div>
            </div>

            <div className="mt-8 text-center text-[10px] font-semibold text-slate-400 border-t border-slate-200 pt-4">
              MUNYAKA PRIMARY & JUNIOR SECONDARY SCHOOL • OFFICIAL REGISTRATION SLIP • CENTRE CODE: 26534178
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-4 bg-white border-t border-slate-200" data-no-print>
          {onClose ? (
            <Button onClick={onClose} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold">
              Done / Close
            </Button>
          ) : (
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold">
              <Printer className="w-4 h-4 mr-1.5" /> Print Confirmation Slip
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationConfirmationSlip;
