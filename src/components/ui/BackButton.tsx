import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';

interface BackButtonProps {
  fallback?: string;
  to?: string;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  fallback = '/', 
  to, 
  className 
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(fallback);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={cn(
        "rounded-xl h-10 px-3 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50",
        className
      )}
    >
      <ChevronLeft size={16} className="mr-1" />
      Back
    </Button>
  );
};

export default BackButton;