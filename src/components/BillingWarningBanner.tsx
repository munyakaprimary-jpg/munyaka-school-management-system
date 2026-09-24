import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, ShieldAlert, ArrowRight, X } from 'lucide-react';
import { getAutoLockStatus } from '@/utils/billingAutoLock';

interface BillingWarningBannerProps {
  currentRole?: string | null;
}

export const BillingWarningBanner: React.FC<BillingWarningBannerProps> = ({ currentRole }) => {
  const [status, setStatus] = useState(() => getAutoLockStatus());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getAutoLockStatus());
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // If already locked or paid or dismissed, don't show the warning banner
  if (status.isLocked || status.isCurrentCyclePaid || dismissed) {
    return null;
  }

  // Check if we are within 5 days of deadline or past due date (before lock triggers or if close)
  const daysRemaining = status.daysUntilDeadline;
  const isPastDue = status.isPastDeadline;

  // Show warning if 5 days or fewer remaining, or if past due
  if (daysRemaining > 5 && !isPastDue) {
    return null;
  }

  const deadlineFormatted = status.deadline.toLocaleDateString('en-KE', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white px-4 py-3 shadow-lg relative z-40 animate-pulse border-b border-orange-400/30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
            <AlertTriangle size={20} className="text-white animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <span className="bg-white/25 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/30">
                {isPastDue ? '⚠️ Payment Overdue' : `⏰ Payment Due in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold mt-0.5 text-white/95">
              {isPastDue
                ? `Payment deadline (${deadlineFormatted}) has passed! Please settle account immediately to avoid automatic service suspension.`
                : `Platform subscription payment due by ${deadlineFormatted}. Teacher apps will be automatically locked if unpaid.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(currentRole === 'owner' || currentRole === 'admin') && (
            <a
              href="#/payment-management"
              className="px-3.5 py-1.5 bg-white text-orange-900 hover:bg-orange-50 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Manage Payment</span>
              <ArrowRight size={14} />
            </a>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors"
            title="Dismiss warning"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingWarningBanner;
