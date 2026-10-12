import React from 'react';

interface SidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onClose?: () => void;
}

export default function Sidebar({ activeTab = 'owner', setActiveTab = () => {}, onClose }: SidebarProps) {
  const handleNav = (id: string, path: string) => {
    setActiveTab(id);
    window.location.hash = path.replace('/#', '');
    if (onClose) onClose();
  };

  const navItems = [
    { id: 'owner', label: "Owner's Portal", path: '/#/owner' },
    { id: 'tenants', label: 'Tenants / Campuses', path: '/#/tenants' },
    { id: 'lan', label: 'LAN Server Config', path: '/#/lan' },
    { id: 'payments', label: 'Payment & Subscriptions', path: '/#/payments' },
    { id: 'settings', label: 'Global Settings', path: '/#/settings' }
  ];

  return (
    <aside className="w-64 h-screen max-h-screen sticky top-0 flex flex-col justify-between bg-slate-950 text-slate-100 p-4 overflow-hidden z-50">
      {/* Top Brand Header */}
      <div className="shrink-0 pb-4 border-b border-slate-800">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Governance Portal</span>
        <h2 className="text-base font-black text-white tracking-tight">MUNYAKA OWNER</h2>
      </div>

      {/* Scrollable Navigation Items */}
      <div 
        className="flex-1 min-h-0 my-3 space-y-2 overflow-y-scroll" 
        style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}
      >
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

      {/* User Profile Card pinned to bottom */}
      <div className="shrink-0 mt-auto pt-3 border-t border-slate-800">
        <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/50 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-md">
              SA
            </div>
            <div>
              <p className="text-xs font-bold text-slate-100">School Owner</p>
              <p className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase">EXECUTIVE OWNER</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
