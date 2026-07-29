"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { GraduationCap, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { showSuccess, showError } from '@/utils/toast';

interface PromotionHeaderProps {
  onPromoteClick: () => void;
}

const PromotionHeader: React.FC<PromotionHeaderProps> = ({ onPromoteClick }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleStartPromotion = () => {
    setAuthError('');
    setPassword('');
    setIsAuthModalOpen(true);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setAuthError('Please enter the admin password');
      return;
    }

    setIsVerifying(true);
    setAuthError('');

    // Simulate async verification
    await new Promise(resolve => setTimeout(resolve, 800));

    // Get the actual set password from storage to match current super admin credentials
    const currentAdminPass = localStorage.getItem('munyaka_admin_pass') || 'admin123';

    if (password === currentAdminPass) {
      setIsAuthModalOpen(false);
      setPassword('');
      showSuccess('Admin verified. Starting promotion process...');
      onPromoteClick();
    } else {
      setAuthError('Invalid Admin Password');
      setPassword('');
      showError('Authentication failed');
    }
    
    setIsVerifying(false);
  };

  const handleCancel = () => {
    setIsAuthModalOpen(false);
    setPassword('');
    setAuthError('');
  };

  return (
    <div className="space-y-4">
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
          onClick={handleStartPromotion}
        >
          <GraduationCap size={18} /> Start Promotion
        </Button>
      </div>

      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Admin Verification Required</h3>
                <p className="text-sm text-slate-500">Enter your current password to authorize this action.</p>
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authError && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium animate-in slide-in-from-top-2">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">Admin Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="Enter your current password"
                    className="w-full h-12 pl-4 pr-12 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-lg"
                    disabled={isVerifying}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setPassword('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    disabled={isVerifying || !password}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isVerifying}
                  className="flex-1 rounded-xl h-11 font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isVerifying || !password.trim()}
                  className="flex-1 rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100 gap-2"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Authorize
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionHeader;