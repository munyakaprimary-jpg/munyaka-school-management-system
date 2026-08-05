"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  Lock
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { StudentTransferInfo, TransferData } from '@/types/transfer';

interface TransferWorkflowProps {
  student: StudentTransferInfo;
  isOpen: boolean;
  onClose: () => void;
  onTransferComplete: (studentId: string) => void;
}

const TransferWorkflow: React.FC<TransferWorkflowProps> = ({
  student,
  isOpen,
  onClose,
  onTransferComplete
}) => {
  const [step, setStep] = useState<'setup' | 'certificate'>('setup');
  const [isExecuting, setIsExecuting] = useState(false);
  const [transferData, setTransferData] = useState<Partial<TransferData>>({
    dateOfExit: new Date().toISOString().split('T')[0],
    destinationSchool: '',
    reason: '',
    coCurricularActivities: '',
    headteacherRemarks: '',
  });
  const [certificateNumber, setCertificateNumber] = useState('');
  const certificateRef = useRef<HTMLDivElement>(null);

  // Admin password verification state
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('setup');
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
    }
  }, [isOpen, student]);

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
    
    // Execute transfer
    onTransferComplete(student.id);
    
    setStep('certificate');
    setIsExecuting(false);
    showSuccess(`Transfer executed successfully! Certificate ${certNum} generated.`);
  };

  const handlePrintCertificate = () => {
    if (!certificateRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const certificateHtml = certificateRef.current.outerHTML;
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

    printWindow.document.write(`
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
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'setup' ? "Student Transfer Workflow" : "Clearance Certificate Generated"}
      description={step === 'setup' 
        ? `Initiate transfer for ${student.name} (${student.assessment})`
        : `Official Clearance Certificate for ${student.name}`}
      maxWidth="max-w-3xl"
      footer={
        step === 'setup' ? (
          <>
            <Button variant="ghost" onClick={onClose} disabled={isExecuting} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button 
              onClick={handleExecuteTransfer} 
              disabled={isExecuting || !transferData.destinationSchool?.trim() || !adminPassword.trim()}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100 gap-2 text-white"
            >
              {isExecuting ? <Loader2 className="animate-spin mr-2" size={16} /> : <UserCheck size={16} />}
              Execute Transfer & Generate Clearance Certificate
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">
              Close
            </Button>
            <Button 
              onClick={handlePrintCertificate}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100 gap-2 text-white"
            >
              <Printer size={16} /> Print Certificate
            </Button>
          </>
        )
      }
    >
      {step === 'setup' && (
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
                    setAdminPassword(e.target.value); 
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

      {step === 'certificate' && (
        <div className="animate-in fade-in zoom-in-95" ref={certificateRef}>
          {/* Print-only styles */}
          <style jsx>{`
            @media print {
              .no-print { display: none !important; }
              .certificate-container { box-shadow: none !important; border: 2px solid #1e293b !important; }
            }
          `}</style>
          
          <div className="certificate-container bg-white rounded-xl shadow-2xl border-2 border-slate-800 p-8 md:p-12 max-w-3xl mx-auto no-print">
            {/* Institutional Header */}
            <div className="institutional-header">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-slate-300">
                  <School className="text-slate-600" size={32} />
                </div>
              </div>
              <h1 className="school-name">MUNYAKA PRIMARY AND JUNIOR SCHOOL</h1>
              <p className="school-motto">"Knowledge is Power"</p>
              <p className="school-address">P.O. Box 5239-30100, Eldoret | Tel: +254 712 345 678 | Email: info@munyaka.sc.ke</p>
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

          {/* Print Button - only visible on screen */}
          <div className="no-print text-center mt-6">
            <Button 
              onClick={handlePrintCertificate}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100 gap-2 text-white"
            >
              <Printer size={16} /> Print Certificate
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default TransferWorkflow;