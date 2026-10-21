import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface DeleteLearnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  learner?: { id: string; name?: string; admissionNo?: string } | null;
  studentToDelete?: { id: string; name?: string; admissionNo?: string } | null;
  onConfirm?: (id: string) => void;
  onVerify?: () => void;
}

export default function DeleteLearnerModal({
  isOpen,
  onClose,
  learner,
  studentToDelete,
  onConfirm,
  onVerify
}: DeleteLearnerModalProps) {
  if (!isOpen) return null;

  const target = learner || studentToDelete;

  const handleConfirm = async () => {
    try {
      const learnerId = target?.id || (target as any)?.admissionNo || (target as any)?.admissionNumber;
      if (learnerId) {
        // 1. Filter out from unified local storage
        const currentList = JSON.parse(localStorage.getItem('munyaka_learners_v2') || localStorage.getItem('cached_learners') || '[]');
        const updatedList = currentList.filter(
          (item: any) => String(item.id) !== String(learnerId) && String(item.admissionNo) !== String(learnerId) && String(item.admission_number) !== String(learnerId)
        );
        localStorage.setItem('munyaka_learners_v2', JSON.stringify(updatedList));
        localStorage.setItem('munyaka_students', JSON.stringify(updatedList));
        localStorage.setItem('cached_learners', JSON.stringify(updatedList));

        // 2. Delete from Firestore if online
        if (db) {
          try {
            await deleteDoc(doc(db, "learners", String(learnerId)));
          } catch (e) {
            console.warn("Deleted locally; offline mode active.", e);
          }
        }

        // 3. Dispatch refresh events
        window.dispatchEvent(new Event('learners_updated'));
        window.dispatchEvent(new Event('students-updated'));
        window.dispatchEvent(new Event('storage'));
      }

      if (onConfirm && learnerId) {
        await onConfirm(String(learnerId));
      }
      if (onVerify) {
        onVerify();
      }
      onClose();
    } catch (error) {
      console.error("[DeleteLearnerModal] Delete failed:", error);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 mx-auto mb-4">
          <Trash2 size={24} />
        </div>
        <h3 className="text-xl font-black text-slate-900 text-center tracking-tight">Confirm Deletion</h3>
        <p className="mt-2 text-sm text-slate-600 font-medium text-center leading-relaxed">
          Are you sure you want to delete <strong className="text-slate-900">{target?.name || 'this learner'}</strong> record? This action cannot be undone.
        </p>

        <div className="mt-8 flex justify-end gap-3">
          <Button 
            type="button" 
            variant="ghost"
            onClick={onClose}
            className="rounded-xl font-bold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirm}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-6 shadow-lg shadow-red-200"
          >
            Confirm Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
