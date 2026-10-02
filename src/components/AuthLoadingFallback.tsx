import React, { useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AuthLoadingFallback: React.FC = () => {
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowReload(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleForceReload = () => {
    try {
      localStorage.clear();
    } catch {}
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-sans text-white">
      <div className="max-w-sm w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto animate-spin">
          <RefreshCcw size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="font-black text-base">Loading Munyaka Portal...</h3>
          <p className="text-xs text-slate-400">Initializing offline secure database & authentication state.</p>
        </div>

        {showReload && (
          <div className="space-y-3 pt-2">
            <p className="text-[11px] text-amber-400 font-medium">Taking longer than usual?</p>
            <Button
              onClick={handleForceReload}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-2xl text-xs shadow-lg flex items-center justify-center gap-2"
            >
              <RefreshCcw size={14} /> Clear Cache & Reload
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthLoadingFallback;
