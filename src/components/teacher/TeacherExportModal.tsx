import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2, QrCode } from 'lucide-react';

interface TeacherExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGrade?: string;
  selectedStream?: string;
}

export const TeacherExportModal: React.FC<TeacherExportModalProps> = ({
  isOpen,
  onClose,
  selectedGrade = 'Grade 4',
  selectedStream = 'Blue'
}) => {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [successShareData, setSuccessShareData] = useState<{
    isOpen: boolean;
    filename: string;
    data: string;
    mimeType: string;
    title: string;
  }>({
    isOpen: false,
    filename: '',
    data: '',
    mimeType: 'application/json',
    title: ''
  });

  if (!isOpen) return null;

  const handleExportPackage = async () => {
    setIsExporting(true);
    try {
      const attendance = JSON.parse(localStorage.getItem('munyaka_attendance_records') || '[]');
      const marks = JSON.parse(localStorage.getItem('marked_student_submissions') || '[]');
      const checkIns = JSON.parse(localStorage.getItem('munyaka_teacher_checkins') || localStorage.getItem('munyaka_staff_checkins') || '[]');
      const centralDb = JSON.parse(localStorage.getItem('munyaka_central_db') || '{}');

      const payload = {
        centreCode: '26534178',
        metadata: {
          senderName: user?.name || 'Class Teacher',
          staffId: (user as any)?.staffId || user?.staff_id || user?.id || 'TCH-001',
          email: user?.email || 'teacher@munyaka.ac.ke',
          departmentOrStream: selectedStream,
          packageType: 'TEACHER_OFFLINE_BATCH',
          assignedClass: selectedGrade,
          assignedStream: selectedStream,
          exportedAt: new Date().toISOString(),
          appVersion: '2.0.0'
        },
        data: {
          attendance,
          marks,
          checkIns,
          munyaka_central_db: centralDb
        }
      };

      const staffNameSlug = (user?.name || 'teacher').replace(/\s+/g, '_').toLowerCase();
      const todayDate = new Date().toISOString().split('T')[0];
      const filename = `munyaka_teacher_export_${staffNameSlug}_${todayDate}.json`;
      const jsonString = JSON.stringify(payload, null, 2);

      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onClose();
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Export Teacher Sync Package</h3>
            <p className="text-xs text-slate-500">Centre Code: 26534178</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-2">
          <p className="text-xs text-indigo-900 dark:text-indigo-200 font-medium leading-relaxed">
            Download your attendance records, CBC assessment marks, and check-ins as a securely formatted JSON package ready for Admin Harmonization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
          <Button onClick={handleExportPackage} disabled={isExporting} className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2">
            <Download size={16} />
            {isExporting ? 'Exporting...' : 'Download .JSON'}
          </Button>
        </div>
      </div>

      <SuccessShareModal
        isOpen={successShareData.isOpen}
        onClose={() => setSuccessShareData(prev => ({ ...prev, isOpen: false }))}
        filename={successShareData.filename}
        data={successShareData.data}
        mimeType={successShareData.mimeType}
        title={successShareData.title}
      />
    </div>
  );
};
