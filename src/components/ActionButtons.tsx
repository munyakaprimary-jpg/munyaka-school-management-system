"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'ghost' | 'outline' | 'destructive';
  size?: 'sm' | 'icon' | 'lg';
  className?: string;
  title?: string;
  'aria-label'?: string;
  disabled?: boolean;
  noPrint?: boolean;
  html2CanvasIgnore?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  children,
  variant = 'ghost',
  size = 'icon',
  className = '',
  title,
  'aria-label': ariaLabel,
  disabled = false,
  noPrint = true,
  html2CanvasIgnore = true,
  ...props
}) => {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      disabled={disabled}
      className={cn(
        "transition-colors",
        noPrint && "no-print",
        html2CanvasIgnore && "html2canvas-ignore",
        className
      )}
      title={title}
      aria-label={ariaLabel}
      data-html2canvas-ignore={html2CanvasIgnore}
      data-no-print={noPrint}
      {...props}
    >
      {children}
    </Button>
  );
};

interface ActionButtonsGroupProps {
  children: React.ReactNode;
  className?: string;
  noPrint?: boolean;
  html2CanvasIgnore?: boolean;
}

export const ActionButtonsGroup: React.FC<ActionButtonsGroupProps> = ({
  children,
  className = '',
  noPrint = true,
  html2CanvasIgnore = true,
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-1",
        noPrint && "no-print",
        html2CanvasIgnore && "html2canvas-ignore",
        className
      )}
      data-html2canvas-ignore={html2CanvasIgnore}
      data-no-print={noPrint}
    >
      {children}
    </div>
  );
};

export { ActionButton };
export default ActionButton;