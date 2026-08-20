"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, children }) => {
  return (
    <div
      className={cn(
        "rounded-lg p-3 bg-white shadow-sm transition-all hover:shadow-md",
        "border border-slate-100/50 dark:border-slate-800/50",
        "flex flex-col min-h-[56px]",
        "gap-2",
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;