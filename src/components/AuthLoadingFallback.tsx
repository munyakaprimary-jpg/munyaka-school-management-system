import React from 'react';
import { Loader2, ShieldCheck, Smartphone } from 'lucide-react';

interface Props {
  /** Optional message override. */
  message?: string;
}

/**
 * Full-screen loading fallback shown while AuthContext is hydrating from
 * localStorage / SQLite. Prevents downstream hooks from reading a
 * `null` user or undefined `user.role` during the first paint of the
 * Android WebView.
 *
 * Renders a static, dependency-light shell so it cannot itself throw.
 */
const AuthLoadingFallback: React.FC<Props> = ({ message = 'Loading your workspace…' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-6">

        {/* Brand mark */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200">
            <Smartphone size={24} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Munyaka School Management
            </p>
            <p className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
              {message}
            </p>
          </div>
        </div>

        {/* Spinner */}
        <div className="flex items-center justify-center">
          <Loader2 className="animate-spin text-indigo-500" size={36} />
        </div>

        {/* Security reassurance */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span>Securing your session locally</span>
        </div>

        {/* Progress hint */}
        <div className="w-full bg-slate-200/60 rounded-full h-1 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-400 via-violet-500 to-fuchsia-500 rounded-full"
            style={{
              width: '60%',
              animation: 'munyaka-loading-bar 1.4s ease-in-out infinite alternate',
            }}
          />
        </div>

        <style>{`
          @keyframes munyaka-loading-bar {
            0%   { width: 20%; margin-left: 0%; }
            100% { width: 80%; margin-left: 20%; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AuthLoadingFallback;
