"use client";

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { hydrateAllStores, isHydrated, type HydrationReport } from '@/utils/storage';
import { Loader2, HardDrive, CheckCircle2 } from 'lucide-react';

const Index: React.FC = () => {
  // Hydration happens synchronously inside main.tsx before this component
  // ever renders. This is a defensive re-check to be 100% sure that all
  // primary stores (Students, CBC Learning Areas, Payment Records, User
  // Settings, Subscriptions) have been hydrated from localStorage before
  // we redirect the user to the dashboard.
  const [ready, setReady] = useState<boolean>(() => isHydrated());
  const [report, setReport] = useState<HydrationReport | null>(null);

  useEffect(() => {
    if (ready) return;

    // Fallback: if for some reason hydration didn't run in main.tsx, do it now.
    const r = hydrateAllStores();
    setReport(r);
    setReady(true);
  }, [ready]);

  if (!ready) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/40 p-6">
        <div className="flex flex-col items-center gap-4 text-slate-700">
          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-indigo-300/40 rounded-full" />
            <Loader2 className="relative h-12 w-12 text-indigo-600 animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Restoring your data…</h1>
            <p className="text-sm text-slate-500">
              Loading from offline storage
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (report && import.meta.env.DEV) {
    // Show a tiny dev-only diagnostic so we can see what was hydrated
    console.info('[Hydration] report', report);
  }

  return <Navigate to="/dashboard" replace />;
};

export default Index;
</content>
</invoke>