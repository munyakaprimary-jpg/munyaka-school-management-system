"use client";

import React from 'react';
import { CheckCircle } from 'lucide-react';

interface SuccessMessageProps {
  visible: boolean;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ visible }) => {
  if (!visible) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-lg animate-in slide-in-from-right">
      <div className="flex items-center gap-3">
        <CheckCircle className="text-emerald-600" size={20} />
        <div>
          <p className="font-bold text-emerald-800">Promotion Successful!</p>
          <p className="text-sm text-emerald-700">Students have been promoted to their next grade levels.</p>
        </div>
      </div>
    </div>
  );
};

export default SuccessMessage;