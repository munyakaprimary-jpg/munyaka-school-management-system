import { useState } from 'react';
import AcademicHistoryModal from '@/components/academic-history/AcademicHistoryModal';
import TransferWorkflow from '@/components/transfer/TransferWorkflow';

const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
const [isTransferOpen, setIsTransferOpen] = useState(false);
const [selectedStudent, setSelectedStudent] = useState(null);

const handleViewHistory = (student) => {
  setSelectedStudent(student);
  setIsHistoryModalOpen(true);
};

const handleTransferStudent = (student) => {
  setSelectedStudent(student);
  setIsTransferOpen(true);
};

// In the JSX:
<AcademicHistoryModal
  isOpen={isHistoryModalOpen}
  onClose={() => setIsHistoryModalOpen(false)}
  studentId={selectedStudent?.id || ''}
  studentName={selectedStudent?.name || ''}
/>

<TransferWorkflow
  student={selectedStudent}
  onTransferComplete={(studentId, certificateNumber) => {
    setIsTransferOpen(false);
    setSelectedStudent(null);
    showSuccess(`Transfer completed! Certificate ${certificateNumber} generated.`);
  }}
  isOpen={isTransferOpen}
  onClose={() => {
    setIsTransferOpen(false);
    setSelectedStudent(null);
  }}
/>
