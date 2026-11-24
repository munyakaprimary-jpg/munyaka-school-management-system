import React from 'react';
import { useUnifiedLicense } from '../../utils/subscriptionUtils';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface LicenseBadgeProps {
  className?: string;
}

export const LicenseBadge: React.FC<LicenseBadgeProps> = ({ className = '' }) => {
  const licenseInfo = useUnifiedLicense();

  const isWarning = licenseInfo.daysRemaining <= 7 || licenseInfo.isLocked || licenseInfo.status === 'OVERDUE';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black tracking-wide shrink-0 whitespace-nowrap shadow-sm ${licenseInfo.badgeVariant} ${className}`}
      title={`License Status: ${licenseInfo.status} | Due: ${licenseInfo.dueDate}`}
    >
      {isWarning ? (
        <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
      ) : (
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
      )}
      <span className="whitespace-nowrap">{licenseInfo.badgeText}</span>
    </div>
  );
};
