import { useState } from 'react';
import AcademicHistoryModal from '@/components/academic-history/AcademicHistoryModal';
import TransferWorkflow from '@/components/transfer/TransferWorkflow';
import { showSuccess } from '@/utils/toast';
import { StudentTransferInfo } from '@/types/transfer';
import { notifyDataChanged } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft } from 'lucide-react';

const LearnerActionButtons = ({ learner }: { learner: StudentTransferInfo }) => {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState(learner);

  const handleTransferLearner = (l: StudentTransferInfo) => {
    setSelectedLearner({
      ...l as any,
      assessment_no: (l as any).assessment_no || null,
      admission_no: (l as any).admission_no || (l as any).admissionNo || (l as any).admNo || null
    });
    setIsTransferOpen(true);
  };

  const handleTransferComplete = (learnerId: string, certificateNumber: string) => {
    try {
      const raw = window.localStorage.getItem('school_learners_data') || window.localStorage.getItem('munyaka_learners');
      if (raw) {
        const parsed: { id: string; status?: string }[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((l) =>
            l.id === learnerId
              ? { ...l, status: 'TRANSFERRED' as const }
              : l,
          );
          window.localStorage.setItem(
            'school_learners_data',
            JSON.stringify(updated),
          );
          window.localStorage.setItem(
            'munyaka_learners',
            JSON.stringify(updated),
          );
          notifyDataChanged('school_learners_data');
          notifyDataChanged('munyaka_learners');
        }
      }
    } catch (err) {
      console.error(
        '[LearnerActionButtons] Failed to persist TRANSFERRED status:',
        err,
      );
    }

    setIsTransferOpen(false);
    setSelectedLearner(null);

    try {
      window.dispatchEvent(new Event('learners_data_updated'));
      window.dispatchEvent(new Event('archive_updated'));
    } catch {
      /* SSR / no window */
    }

    showSuccess(
      `Transfer completed! Learner marked as transferred. Certificate ${certificateNumber} generated.`,
    );
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-amber-600 hover:text-amber-900 hover:bg-amber-50"
        onClick={() => handleTransferLearner(learner)}
        title="Transfer Out / Stream Change"
      >
        <ArrowRightLeft size={16} /> <span className="text-xs ml-1 hidden sm:inline">Transfer Out</span>
      </Button>

      <AcademicHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        studentId={selectedLearner?.id || ''}
        studentName={selectedLearner?.name || ''}
      />

      <TransferWorkflow
        student={selectedLearner}
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onTransferComplete={handleTransferComplete}
      />
    </>
  );
};

export default LearnerActionButtons;
