import { useState } from 'react';
import AcademicHistoryModal from '@/components/academic-history/AcademicHistoryModal';
import TransferWorkflow from '@/components/transfer/TransferWorkflow';
import { showSuccess } from '@/utils/toast';
import { StudentTransferInfo } from '@/types/transfer';

const LearnerActionButtons = ({ student }: { student: StudentTransferInfo }) => {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(student);

  const handleViewHistory = (student) => {
    setSelectedStudent(student);
    setIsHistoryModalOpen(true);
  };

  const handleTransferStudent = (student) => {
    setSelectedStudent(student);
    setIsTransferOpen(true);
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
        onTransferComplete={(studentId, certificateNumber) => {
          setIsTransferOpen(false);
          setSelectedStudent(null);
          showSuccess(`Transfer completed! Certificate ${certificateNumber} generated.`);
        }}
      />
    </>
  );
};

export default LearnerActionButtons;