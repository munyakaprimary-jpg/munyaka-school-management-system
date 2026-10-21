import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';
import { purgeLearnerPermanently } from '@/services/purgeLearnerService';

interface DeleteLearnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  learner?: { id: string; name?: string; admissionNo?: string; admissionNumber?: string } | null;
  studentToDelete?: { id: string; name?: string; admissionNo?: string; admissionNumber?: string } | null;
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
      if (target) {
        await purgeLearnerPermanently(target);
        const learnerId = target.id || target.admissionNo || target.admissionNumber;
        if (onConfirm && learnerId) {
          await onConfirm(String(learnerId));
        }
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
          Are you sure you want to permanently delete <strong className="text-slate-900">{target?.name || 'this learner'}</strong> record? This action cannot be undone.
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
