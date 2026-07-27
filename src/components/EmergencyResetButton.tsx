"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Power } from 'lucide-react';

export const EmergencyResetButton = () => {
  const { emergencyReset } = useAuth();
  const navigate = useNavigate();

  const handleReset = () => {
    emergencyReset();
    navigate('/login');
  };

  return (
    <button
      type="button"
      onClick={handleReset}
      className="fixed top-3 right-3 z-[9999] bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-2xl flex items-center gap-1.5 border border-rose-400/40 transition-all hover:scale-105"
      title="Instantly destroy local session state and return to login"
    >
      <Power size={13} className="animate-pulse text-white" />
      <span>Sign Out / Reset Session</span>
    </button>
  );
};