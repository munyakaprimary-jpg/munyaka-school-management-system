"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  gradeBand: string;
  children: React.ReactNode;
}

export const ReportCardLayoutSwitcher: React.FC<LayoutProps> = ({ gradeBand, children }) => {
  const isLowerPrimary = gradeBand === 'Lower Primary';
  const isUpperOrJunior = gradeBand === 'Upper Primary' || gradeBand === 'Junior School';

  const tierClass = cn(
    isLowerPrimary ? 'tier-lower' : 
    isUpperOrJunior ? 'tier-upper' : 'tier-junior',
    'p-4 rounded-lg border-2 border-slate-200 p-3'
  );

  return (
    <div className={tierClass}>
      {children}
    </div>
  );
};