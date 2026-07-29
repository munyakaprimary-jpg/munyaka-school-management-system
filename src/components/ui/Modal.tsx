"use client";

import React from 'react';
import { X } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "max-w-2xl",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
      <div className={cn(
        "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full overflow-hidden animate-in zoom-in-95",
        maxWidth
      )}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
              {description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {children}
        </div>
        
        {footer && (
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;