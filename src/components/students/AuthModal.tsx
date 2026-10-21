import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  authPassword?: string;
  setAuthPassword?: (value: string) => void;
  authError?: string;
  setAuthError?: (value: string) => void;
  isVerifying?: boolean;
  setIsVerifying?: (value: boolean) => void;
  studentToDelete: { id: string; name: string } | null;
  onVerify: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  studentToDelete,
  onVerify
}) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      if (studentToDelete?.id) {
        const learnerId = String(studentToDelete.id);
        const currentList = JSON.parse(localStorage.getItem('munyaka_learners_v2') || '[]');
        const updatedList = currentList.filter(
          (item: any) => String(item.id) !== learnerId && String(item.admissionNo || item.admission_number || item.admNo) !== learnerId
        );
        localStorage.setItem('munyaka_learners_v2', JSON.stringify(updatedList));
        localStorage.setItem('munyaka_students', JSON.stringify(updatedList));
        localStorage.setItem('cached_learners', JSON.stringify(updatedList));

        if (db) {
          try {
            await deleteDoc(doc(db, "learners", learnerId));
          } catch (cloudErr) {
            console.warn("[Firestore] Offline/local delete completed:", cloudErr);
          }
        }

        window.dispatchEvent(new Event('learners_updated'));
        window.dispatchEvent(new Event('students-updated'));
        window.dispatchEvent(new Event('storage'));
      }
      onVerify();
      onClose();
    } catch (error) {
      console.error("[DeleteLearner] Delete failed:", error);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Confirm Deletion</h3>
        <p className="mt-2 text-sm text-slate-600 font-medium leading-relaxed">
          Are you sure you want to delete <strong className="text-slate-900">{studentToDelete?.name || 'this learner'}</strong>? 
          This action will permanently remove the record from local storage and Firestore.
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
};

export default AuthModal;
