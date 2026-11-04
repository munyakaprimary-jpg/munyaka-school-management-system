import React from 'react';

export interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStaffAdded?: (staff: any) => void;
}

export function AddStaffModal({ isOpen, onClose }: AddStaffModalProps) {
  if (!isOpen) return null;
  return null;
}
