"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Lock, Eye } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
}

const PasswordInput = ({ value, onChange }: PasswordInputProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <div className="relative">
      <Input
        type={isPasswordVisible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl h-12 pl-10 pr-12 text-sm font-bold focus:ring-2 focus:ring-indigo-100"
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
      >
        {isPasswordVisible ? <Eye size={18} /> : <Lock size={18} />}
      </button>
    </div>
  );
};

export default PasswordInput;