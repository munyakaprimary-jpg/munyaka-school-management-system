import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { School, LogOut, Sun, Moon, Home } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [activeTab, setActiveTab] = React.useState('owner');
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: 'owner', label: "Owner's Portal", path: '/#/owner' },
    { id: 'tenants', label: 'Tenants / Campuses', path: '/#/tenants' },
    { id: 'lan', label: 'LAN Server Config', path: '/#/lan' },
    { id: 'payments', label: 'Payment & Subscriptions', path: '/#/payments' },
    { id: 'settings', label: 'Global Settings', path: '/#/settings' }
  ];

  const handleNav = (id: string, path: string) => {
    setActiveTab(id);
    window.location.hash = path.replace('/#', '');
    if (path.includes('owner')) navigate('/');
    else if (path.includes('tenants')) navigate('/dev/tenants');
    else if (path.includes('lan')) navigate('/lan-config');
    else if (path.includes('payments')) navigate('/payment-management');
    else if (path.includes('settings')) navigate('/settings');
    else navigate('/');
  };

  return (
    <div className={`flex min-h-screen w-full bg-slate-50 ${isDarkMode ? "dark bg-slate-950 text-slate-100" : ""}`}>
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-100 min-h-screen p-4 flex flex-col justify-between shadow-xl fixed left-0 top-0 h-full z-50">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-900/40 flex items-center justify-center shrink-0">
                <School className="text-white" size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Governance Portal</span>
                <h2 className="text-base font-black text-white tracking-tight">MUNYAKA OWNER</h2>
              </div>
            </div>
          </div>

          {/* Navigation List */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id || window.location.hash.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id, item.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-base">
                    {item.id === 'owner' ? '📊' : item.id === 'tenants' ? '🏫' : item.id === 'lan' ? '🌐' : item.id === 'payments' ? '💳' : '⚙️'}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/50 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-md">
              SA
            </div>
            <div>
              <p className="text-xs font-bold text-slate-100">School Owner</p>
              <p className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">EXECUTIVE OWNER</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 ml-64">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3">
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
            <div className="px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
              EXECUTIVE OWNER SESSION ACTIVE
            </div>
          </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
