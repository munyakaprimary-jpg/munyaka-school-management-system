import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon, Home, Shield, Crown } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import OwnersSidebar from '@/components/OwnersSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [activeTab, setActiveTab] = useState('admin-dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className={`relative min-h-screen w-full bg-slate-50 overflow-y-auto ${isDarkMode ? "dark bg-slate-950 text-slate-100" : ""}`}>
      <AdminSidebar 
        isOpen={isSidebarOpen}
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      <div className="w-full min-h-screen flex flex-col">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors flex items-center justify-center shadow-sm"
              aria-label="Open admin menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-indigo-600" />
              <span className="font-black text-slate-900 dark:text-white tracking-tight text-sm">School Admin Operational Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-500" />}
            </button>
            <div className="hidden sm:block px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
              SCHOOL ADMIN ACTIVE
            </div>
          </div>
        </header>

        <main className="w-full min-h-screen p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

interface OwnersPortalLayoutProps {
  children: React.ReactNode;
}

export function OwnersPortalLayout({ children }: OwnersPortalLayoutProps) {
  const [activeTab, setActiveTab] = useState('owner');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className={`relative min-h-screen w-full bg-slate-50 overflow-y-auto ${isDarkMode ? "dark bg-slate-950 text-slate-100" : ""}`}>
      <OwnersSidebar 
        isOpen={isSidebarOpen}
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      <div className="w-full min-h-screen flex flex-col">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors flex items-center justify-center shadow-sm"
              aria-label="Open owner menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-emerald-600" />
              <span className="font-black text-slate-900 dark:text-white tracking-tight text-sm">Executive Governance Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-500" />}
            </button>
            <div className="hidden sm:block px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
              EXECUTIVE OWNER SESSION ACTIVE
            </div>
          </div>
        </header>

        <main className="w-full min-h-screen p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
