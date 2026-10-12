import React from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [activeTab, setActiveTab] = React.useState('owner');
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  return (
    <div className={`flex flex-row min-h-screen w-full bg-slate-50 overflow-hidden ${isDarkMode ? "dark bg-slate-950 text-slate-100" : ""}`}>
      {/* Sidebar with shrink-0 to prevent squishing */}
      <div className="shrink-0">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Main Page Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        {/* Header Bar */}
        <header className="shrink-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">MUNYAKA GOVERNANCE & EXECUTIVE PORTAL</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors text-xs font-bold"
              aria-label="Toggle theme"
            >
              {isDarkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs tracking-wide">
              LICENSED - 365D LEFT
            </div>
          </div>
        </header>

        {/* Main Page Body */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
