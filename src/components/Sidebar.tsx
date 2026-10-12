import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export default function Sidebar({ activeTab, setActiveTab = () => {}, onClose, isOpen = true }: SidebarProps) {
  const { logout } = useAuth();

  // Determine current active id from prop or window hash
  const getActiveId = () => {
    if (activeTab) return activeTab;
    const hash = window.location.hash.replace('#/', '').replace('/', '').trim();
    if (!hash || hash === 'owner' || hash === 'dashboard') return 'owner';
    if (hash === 'tenants' || hash === 'campuses') return 'tenants';
    if (hash === 'lan' || hash === 'lan-config') return 'lan';
    if (hash === 'payments' || hash === 'payment-management') return 'payments';
    if (hash === 'settings') return 'settings';
    return 'owner';
  };

  const currentActive = getActiveId();

  const handleNav = (id: string, path: string) => {
    setActiveTab(id);
    window.location.hash = path;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    if (onClose) onClose();
  };

  const ownerNavItems = [
    { id: 'owner', label: "Owner's Portal", path: '#/owner' },
    { id: 'tenants', label: 'Tenants / Campuses', path: '#/tenants' },
    { id: 'lan', label: 'LAN Server Config', path: '#/lan' },
    { id: 'payments', label: 'Payment & Subscriptions', path: '#/payments' },
    { id: 'settings', label: 'Global Settings', path: '#/settings' }
  ];

  const handleLogout = () => {
    try {
      logout();
    } catch {}
    window.location.hash = '#/login';
    window.location.reload();
  };

  return (
    <>
      {/* Semi-transparent Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden" 
          onClick={onClose}
        />
      )}

      {/* Slide-in Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-slate-100 p-4 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Top Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Governance Portal</span>
            <h2 className="text-base font-black text-white tracking-tight">MUNYAKA OWNER</h2>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              aria-label="Close sidebar"
            >
              ✕
            </button>
          )}
        </div>

        {/* Scrollable Navigation Items */}
        <div 
          className="flex-1 min-h-0 my-3 space-y-2 overflow-y-scroll" 
          style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}
        >
          <nav className="space-y-1.5">
            {ownerNavItems.map((item) => {
              const isActive = currentActive === item.id;
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

        {/* User Profile Card & Log Out pinned to bottom */}
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 shrink-0 mt-auto space-y-3">
          {/* Profile Badge Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              SA
            </div>
            <div>
              <p className="text-xs font-bold text-white">School Owner</p>
              <p className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">EXECUTIVE OWNER</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-800/80" />

          {/* Log Out Action */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <span className="text-sm">🚪</span>
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
