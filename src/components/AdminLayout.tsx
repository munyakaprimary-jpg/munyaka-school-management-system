import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon, Home } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#/', '').replace('/', '').trim();
    if (hash === 'students' || hash === 'learners') return 'students';
    if (hash === 'staff' || hash === 'staff-registry') return 'staff';
    if (hash === 'attendance') return 'attendance';
    if (hash === 'assessments' || hash.startsWith('assessments/')) return 'assessments';
    if (hash === 'fees') return 'fees';
    if (hash === 'grades' || hash === 'promote') return 'grades';
    if (hash === 'reports' || hash === 'analysis' || hash === 'grading') return 'reports';
    if (hash === 'library') return 'library';
    if (hash === 'inventory') return 'inventory';
    if (hash === 'settings' || hash === 'profile') return 'settings';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '').replace('/', '').trim();
      if (hash === 'students' || hash === 'learners') setActiveTab('students');
      else if (hash === 'staff' || hash === 'staff-registry') setActiveTab('staff');
      else if (hash === 'attendance') setActiveTab('attendance');
      else if (hash === 'assessments' || hash.startsWith('assessments/')) setActiveTab('assessments');
      else if (hash === 'fees') setActiveTab('fees');
      else if (hash === 'grades' || hash === 'promote') setActiveTab('grades');
      else if (hash === 'reports' || hash === 'analysis' || hash === 'grading') setActiveTab('reports');
      else if (hash === 'library') setActiveTab('library');
      else if (hash === 'inventory') setActiveTab('inventory');
      else if (hash === 'settings' || hash === 'profile') setActiveTab('settings');
      else setActiveTab('dashboard');
    };

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateToHome = () => {
    window.location.hash = '#/';
    setActiveTab('dashboard');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };

  return (
    <div className={`relative min-h-screen w-full bg-slate-50 overflow-y-auto ${isDarkMode ? "dark bg-slate-950 text-slate-100" : ""}`}>
      {/* Slide-in Overlay Sidebar with Backdrop */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Full-Width Main Content Container */}
      <div className="w-full min-h-screen flex flex-col">
        {/* Header with Hamburger Toggle */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center shadow-sm"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={navigateToHome}
              className="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-colors"
            >
              <Home size={16} />
              <span>Admin Dashboard Home</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-500" />}
            </button>
            <div className="hidden sm:block px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-xs">
              SCHOOL ADMINISTRATION SESSION ACTIVE
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full min-h-screen p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
