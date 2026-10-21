import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface AdminPinModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  prompt?: string;
  learnerId?: string;
  learnerName?: string;
}

export default function AdminPinModal({
  open,
  onClose,
  onSuccess,
  title = "Confirm Deletion",
  description = "Are you sure you want to delete this record? This action will remove it from local storage and Firestore.",
}: AdminPinModalProps) {
  if (!open) return null;

  const handleConfirm = async () => {
    try {
      window.dispatchEvent(new Event('learners_updated'));
      window.dispatchEvent(new Event('students-updated'));
      window.dispatchEvent(new Event('storage'));
      onSuccess();
      onClose();
    } catch (error) {
      console.error("[AdminPinModal] Delete failed:", error);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 mx-auto">
            <Trash2 size={24} />
          </div>
          <DialogTitle className="text-center text-xl font-black text-slate-950">{title}</DialogTitle>
          <DialogDescription className="text-center text-xs text-slate-500 font-medium">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 flex justify-end gap-3 sm:justify-end">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
