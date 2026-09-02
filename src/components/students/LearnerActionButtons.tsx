import { useState } from 'react';
import AcademicHistoryModal from '@/components/academic-history/AcademicHistoryModal';
import TransferWorkflow from '@/components/transfer/TransferWorkflow';
import { showSuccess } from '@/utils/toast';
import { StudentTransferInfo } from '@/types/transfer';
import { notifyDataChanged } from '@/utils/storage';

const LearnerActionButtons = ({ student }: { student: StudentTransferInfo }) => {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(student);

  const handleViewHistory = (learner: StudentTransferInfo) => {
    setSelectedStudent(learner);
    setIsHistoryModalOpen(true);
  };

  const handleTransferStudent = (learner: StudentTransferInfo) => {
    setSelectedStudent(learner);
    setIsTransferOpen(true);
  };

  /**
   * Called after TransferWorkflow has:
   *   1. Written the archive record (archive_updated event dispatched)
   *   2. Called onTransferComplete with the studentId + certificateNumber
   *
   * This handler must:
   *   a. Mark the learner as TRANSFERRED in school_learners_data
   *   b. Update local React state so callers that rely on the local state
   *      (e.g. a directory table) get an immediate re-render
   *   c. Dispatch cross-tab / same-tab events so the Learners page,
   *      the TransferredLearnersArchive page, and any other listener
   *      refreshes without a page reload
   */
  const handleTransferComplete = (studentId: string, certificateNumber: string) => {
    // ── (a) Persist the TRANSFERRED status to the active roster ─────────
    try {
      const raw = window.localStorage.getItem('school_learners_data');
      if (raw) {
        const parsed: { id: string; status?: string }[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((l) =>
            l.id === studentId
              ? { ...l, status: 'TRANSFERRED' as const }
              : l,
          );
          window.localStorage.setItem(
            'school_learners_data',
            JSON.stringify(updated),
          );
          notifyDataChanged('school_learners_data');
        }
      }
    } catch (err) {
      console.error(
        '[LearnerActionButtons] Failed to persist TRANSFERRED status:',
        err,
      );
    }

    // ── (b) Update local state so this component's callers re-render ───
    setIsTransferOpen(false);
    setSelectedStudent(null);

    // ── (c) Notify all open tabs and same-tab listeners ────────────────
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
      <AcademicHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        studentId={selectedStudent?.id || ''}
        studentName={selectedStudent?.name || ''}
      />

      <TransferWorkflow
        student={selectedStudent}
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onTransferComplete={handleTransferComplete}
      />
    </>
  );
};

export default LearnerActionButtons;