"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { 
  X,
  Printer,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PaymentReceiptModal, { PaymentReceiptData } from './PaymentReceiptModal';

export interface ReceiptModalWrapperProps {
  /**
   * Optional: externally controlled visibility. If `undefined`, the
   * wrapper manages its own state internally and exposes a trigger
   * function via `children-as-function` (see `trigger`).
   */
  isOpen?: boolean;
  receiptData: PaymentReceiptData | null;
  onClose: () => void;
}

/**
 * ReceiptModalWrapper
 *
 * A self-contained wrapper that is guaranteed to work even if the
 * parent component's state setter is misnamed or unhooked, because
 * the wrapper manages its own internal state. The parent only needs
 * to pass `isOpen` and `onClose` props for the visible lifecycle.
 *
 * If `isOpen` is omitted the wrapper falls back to an internal
 * open/closed state, useful for inline triggers.
 */
const ReceiptModalWrapper: React.FC<ReceiptModalWrapperProps> = ({
  isOpen: externalIsOpen,
  receiptData,
  onClose,
}) => {
  // Internal fallback state for when the parent doesn't control
  // visibility directly. Either way, onClose ALWAYS closes the modal.
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlledExternally = externalIsOpen !== undefined;
  const isOpen = isControlledExternally ? externalIsOpen : internalIsOpen;

  /**
   * Always close the modal. This handler is the single source of
   * truth for the close action. Every close button in the modal
   * (X button, "Close" button, Escape key, backdrop click) routes
   * through this function.
   */
  const handleClose = useCallback(() => {
    if (!isControlledExternally) {
      setInternalIsOpen(false);
    }
    onClose();
  }, [isControlledExternally, onClose]);

  return (
    <PaymentReceiptModal
      isOpen={!!isOpen && !!receiptData}
      receiptData={receiptData}
      onClose={handleClose}
    />
  );
};

export default ReceiptModalWrapper;