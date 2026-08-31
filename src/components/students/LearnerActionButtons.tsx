import { useState, useEffect } from 'react';
import AcademicHistoryModal from '@/components/academic-history/AcademicHistoryModal';
import TransferWorkflow from '@/components/transfer/TransferWorkflow';
import { showSuccess } from '@/utils/toast';
import { StudentTransferInfo } from '@/types/transfer';

interface LearnerActionButtonsProps {
  student: StudentTransferInfo;
}

const LearnerActionButtons = ({ student }: LearnerActionButtonsProps) => {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentTransferInfo>(student);

  // Keep selectedStudent in sync when the prop changes (e.g. parent re-renders
  // with a different student row). This guarantees the modals always reflect
  // the row that was clicked rather than stale data from a prior click.
  useEffect(() => {
    setSelectedStudent(student);
  }, [student]);

  const handleViewHistory = (studentOverride?: StudentTransferInfo) => {
    if (studentOverride) setSelectedStudent(studentOverride);
    setIsHistoryModalOpen(true);
  };

  const handleTransferStudent = (studentOverride?: StudentTransferInfo) => {
    if (studentOverride) setSelectedStudent(studentOverride);
    setIsTransferOpen(true);
  };

  return (
    <>
      <AcademicHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        studentId={selectedStudent.id}
        studentName={selectedStudent.name}
      />

      <TransferWorkflow
        student={selectedStudent}
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onTransferComplete={(studentId, certificateNumber) => {
          setIsTransferOpen(false);
          showSuccess(`Transfer completed! Certificate ${certificateNumber} generated.`);
        }}
      />
    </>
  );
};

export default LearnerActionButtons;