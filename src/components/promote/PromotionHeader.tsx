"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { GraduationCap } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';

interface PromotionHeaderProps {
  onPromoteClick: () => void;
}

const PromotionHeader: React.FC<PromotionHeaderProps> = ({ onPromoteClick }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        <BackButton fallback="/" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Promote Students</h1>
          <p className="text-muted-foreground">End-of-year grade promotion with safety safeguards.</p>
        </div>
      </div>
      <Button 
        className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700"
        onClick={onPromoteClick}
      >
        <GraduationCap size={18} /> Start Promotion
      </Button>
    </div>
  );
};

export default PromotionHeader;