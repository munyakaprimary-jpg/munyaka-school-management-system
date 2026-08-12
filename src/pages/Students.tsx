import { AcademicHistoryModal } from '@/components/academic-history/AcademicHistoryModal';
import { TransferWorkflow } from '@/components/transfer/TransferWorkflow';

// ... (existing code) ...

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* ... (existing code) ... */}

      {/* Render History and Transfer Modals */}
      {isHistoryModalOpen && <AcademicHistoryModal student={selectedStudent} onClose={() => setIsHistoryModalOpen(false)} />}
      {isTransferOpen && <TransferWorkflow student={selectedStudent} onClose={() => setIsTransferOpen(false)} />}
    </div>
  );

  // ... (existing code) ...