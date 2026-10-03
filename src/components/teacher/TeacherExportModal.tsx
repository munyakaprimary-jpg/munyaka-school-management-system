import React, { useState, useMemo } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, ShieldCheck } from 'lucide-react';
import { exportClassPackage } from '@/services/departmentExportService';
import { readGradesAndStreams, getStreamsForGrade } from '@/services/gradesStreamsConfig';
import { ExportSuccessShareModal } from './ExportSuccessShareModal';

interface TeacherExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGrade?: string;
  defaultStream?: string;
}

export const TeacherExportModal: React.FC<TeacherExportModalProps> = ({
  isOpen,
  onClose,
  defaultGrade,
  defaultStream
}) => {
  // Pure dynamic fetch from the Grades and Streams Menu configuration
  const config = useMemo(() => readGradesAndStreams(), []);
  const grades = config.grades;

  const [selectedGrade, setSelectedGrade] = useState(() => defaultGrade || grades[0] || 'Grade 1');

  const availableStreams = useMemo(() => {
    const s = getStreamsForGrade(selectedGrade, config);
    return s.length > 0 ? s : config.streams;
  }, [selectedGrade, config]);

  const [selectedStream, setSelectedStream] = useState(() => defaultStream || availableStreams[0] || '');

  // Keep selected stream in sync if grade changes
  React.useEffect(() => {
    if (availableStreams.length > 0 && !availableStreams.includes(selectedStream)) {
      setSelectedStream(availableStreams[0]);
    }
  }, [availableStreams, selectedStream]);

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

  const handleExport = () => {
    setIsExporting(true);
    try {
      localStorage.setItem('munyaka_temp_export_override', JSON.stringify({
        assignedClass: selectedGrade,
        assignedStream: selectedStream
      }));

      // Generate package payload to pass directly to share modal
      const attendance = JSON.parse(localStorage.getItem('munyaka_attendance_records') || '[]');
      const marks = JSON.parse(localStorage.getItem('marked_student_submissions') || '[]');
      const checkIns = JSON.parse(localStorage.getItem('munyaka_teacher_checkins') || '[]');

      const payload = {
        metadata: {
          senderName: 'Class Teacher',
          staffId: 'TCH-001',
          departmentOrStream: selectedStream,
          packageType: 'CLASS_PACKAGE',
          assignedClass: selectedGrade,
          assignedStream: selectedStream,
          exportedAt: new Date().toISOString(),
          appVersion: '2.0.0'
        },
        data: {
          attendance,
          marks,
          checkIns
        }
      };

      const filename = `class_package_${selectedGrade.replace(/\s+/g, '_')}_${selectedStream}_${Date.now()}.json`;
      const jsonString = JSON.stringify(payload, null, 2);

      exportClassPackage(selectedStream, {
        assignedClass: selectedGrade,
        assignedStream: selectedStream
      });

      onClose();

      // Immediately trigger the Quick Share modal prompt
      setSuccessShareData({
        isOpen: true,
        filename,
        data: jsonString,
        mimeType: 'application/json',
        title: `Class Package (${selectedGrade} - ${selectedStream}) Exported!`
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Select Grade & Stream for Export">
      <div className="space-y-6 py-4">
        <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
          <div className="text-xs text-indigo-900 dark:text-indigo-200">
            <span className="font-bold">Stream Isolation Lock:</span> Select the exact class and stream you are exporting data for. This stamps the metadata headers dynamically so the Admin Harmonization Hub can verify stream integrity.
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Select Grade / Class
            </Label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="h-12 rounded-xl border-slate-200 font-bold">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                {grades.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Select Stream
            </Label>
            <Select value={selectedStream} onValueChange={setSelectedStream}>
              <SelectTrigger className="h-12 rounded-xl border-slate-200 font-bold">
                <SelectValue placeholder="Select Stream" />
              </SelectTrigger>
              <SelectContent>
                {availableStreams.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl h-11 px-5 font-bold">
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || !selectedStream}
            className="rounded-xl h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2"
          >
            <Download size={16} />
            {isExporting ? 'Generating...' : 'Confirm & Export Package'}
          </Button>
        </div>
      </div>
    </Modal>

      <ExportSuccessShareModal
        isOpen={successShareData.isOpen}
        onClose={() => setSuccessShareData(prev => ({ ...prev, isOpen: false }))}
        filename={successShareData.filename}
        data={successShareData.data}
        mimeType={successShareData.mimeType}
        title={successShareData.title}
        description="File generated & downloaded successfully! Beam this package instantly to the Admin Harmonization Hub or WhatsApp."
      />
    </>
  );
};
