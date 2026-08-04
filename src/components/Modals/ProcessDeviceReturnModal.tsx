"use client";

import React from 'react';
import { Dialog } from '@shadcn/ui';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const ProcessDeviceReturnModal = ({ isOpen, onClose }: Props) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Content>
        <Dialog.Title>Process Device Return</Dialog.Title>
        {/* Remove the tab bar and focus directly on processing returns */}
        <div className="space-y-4">
          {/* Active Checkout Selection */}
          <label htmlFor="activeCheckout">
            Active Checkout:
            <select id="activeCheckout" name="activeCheckout" className="mt-1 block w-full border border-gray-300 rounded-md pl-3 pr-10 py-2 text-base focus:outline-none sm:text-sm">
              <option value="">Select</option>
              {/* Add options here */}
            </select>
          </label>

          {/* Quantity Returned */}
          <label htmlFor="quantityReturned">
            Quantity Returned:
            <input type="number" id="quantityReturned" name="quantityReturned" className="mt-1 block w-full border border-gray-300 rounded-md pl-3 pr-10 py-2 text-base focus:outline-none sm:text-sm" />
          </label>

          {/* Return Date */}
          <label htmlFor="returnDate">
            Return Date:
            <input type="date" id="returnDate" name="returnDate" className="mt-1 block w-full border border-gray-300 rounded-md pl-3 pr-10 py-2 text-base focus:outline-none sm:text-sm" />
          </label>

          {/* Condition on Return */}
          <label htmlFor="conditionOnReturn">
            Condition on Return:
            <input type="text" id="conditionOnReturn" name="conditionOnReturn" className="mt-1 block w-full border border-gray-300 rounded-md pl-3 pr-10 py-2 text-base focus:outline-none sm:text-sm" />
          </label>
        </div>

        <footer className="flex justify-end bg-white px-4 py-3 space-x-2">
          <button type="button" onClick={onClose} className="bg-gray-50 text-gray-700 hover:bg-gray-100 focus:ring-2 focus:outline-none focus:ring-indigo-500 rounded-md shadow-sm px-4 py-2 text-sm font-medium">
            Cancel
          </button>
        </footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default ProcessDeviceReturnModal;