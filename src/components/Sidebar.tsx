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
    <aside className="w-64 bg-slate-900 text-slate-100 min-h-screen p-4 flex flex-col justify-between shadow-xl">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Governance Portal</span>
            <h2 className="text-lg font-bold text-white tracking-tight">MUNYAKA OWNER</h2>
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
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md font-semibold'
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
      <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/50 space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
            SA
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">School Owner</p>
            <p className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase">EXECUTIVE OWNER</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
