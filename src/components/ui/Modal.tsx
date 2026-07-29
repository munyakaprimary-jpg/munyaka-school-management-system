"use client";

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children, 
  footer,
  maxWidth = "max-w-lg"
}: ModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn(
        "w-full max-h-[90vh] flex flex-col p-0 bg-white dark:bg-slate-900 border-none shadow-2xl",
        maxWidth
      )}>
        {/* Fixed Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0 flex items-center justify-between">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-slate-500 dark:text-slate-400">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/50 shrink-0">
            <DialogFooter className="flex gap-3 sm:justify-end">
              {footer}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;