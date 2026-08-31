"use client";

import { useState } from 'react';
import AcademicHistoryModal from '@/components/academic-history/AcademicHistoryModal';
import TransferWorkflow from '@/components/transfer/TransferWorkflow';
import { showSuccess } from '@/utils/toast';
import { StudentTransferInfo } from '@/types/transfer';

interface LearnerActionButtonsProps {
  student: StudentTransferInfo;
  onViewDetails?: (student: StudentTransferInfo) => void;
}

const LearnerActionButtons = ({ student, onViewDetails }: LearnerActionButtonsProps) => {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const handleViewHistory = () => {
    setIsHistoryModalOpen(true);
  };

  const handleTransferStudent = () => {
    setIsTransferOpen(true);
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(student);
    } else {
      showSuccess(`Viewing details for ${student.name} (${student.assessment})`);
    }
  };

  return (
    <>
      <AcademicHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        studentId={student?.id || ''}
        studentName={student?.name || ''}
      />

      <TransferWorkflow
        student={student}
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onTransferComplete={(studentId, certificateNumber) => {
          setIsTransferOpen(false);
          showSuccess(`Transfer completed for ${student.name}! Certificate ${certificateNumber} generated.`);
        }}
      />
    </>
  );
};

export default LearnerActionButtons;