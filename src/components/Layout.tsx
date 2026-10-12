import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, Home } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [activeTab, setActiveTab] = useState('owner');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className={`relative min-h-screen w-full bg-slate-50 overflow-y-auto ${isDarkMode ? "dark bg-slate-950 text-slate-100" : ""}`}>
      {/* Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Floating Overlay Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false);
          }} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      </div>

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
              onClick={() => navigate('/')}
              className="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
            >
              <Home size={16} />
              <span>Owner Dashboard Home</span>
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
            <div className="hidden sm:block px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
              EXECUTIVE OWNER SESSION ACTIVE
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
