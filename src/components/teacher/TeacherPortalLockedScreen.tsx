import React, { useEffect } from 'react';
import { Lock, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export default function TeacherPortalLockedScreen() {
  const { logout } = useAuth();

  useEffect(() => {
    console.debug('[LockGuard] TeacherPortalLockedScreen rendered — isTeacherAppLocked is true');
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6">
      <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 animate-pulse">
          <Lock className="w-10 h-10" />
        </div>
        
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" /> Restricted Access
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Teacher Portal Locked</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Teacher Portal Locked — Contact School Administration or Jamlyan Analytics to restore subscription access.
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => {
              try {
                logout();
              } catch {
                window.location.href = '/login';
              }
            }}
            className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl gap-2 shadow-lg shadow-red-600/20 transition-all"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
