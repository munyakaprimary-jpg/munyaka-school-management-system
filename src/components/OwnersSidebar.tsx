import React from 'react';

interface OwnersSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function OwnersSidebar({ activeTab, setActiveTab }: OwnersSidebarProps) {
  const ownerNavItems = [
    { id: 'owner', label: "Owner's Portal", path: '#/owner', icon: '📊' },
    { id: 'tenants', label: 'Tenants / Campuses', path: '#/tenants', icon: '🏫' },
    { id: 'lan', label: 'LAN Server Config', path: '#/lan', icon: '🌐' },
    { id: 'payments', label: 'Payment & Subscriptions', path: '#/payments', icon: '💳' },
    { id: 'settings', label: 'Global Settings', path: '#/settings', icon: '⚙️' }
  ];

  return (
    <aside className="w-64 h-screen max-h-screen sticky top-0 flex flex-col justify-between bg-slate-950 text-slate-100 p-4 shrink-0 z-50">
      {/* Top Governance Brand */}
      <div className="pb-4 border-b border-slate-800">
        <span className="text-[10px] font-extrabold text-emerald-400 tracking-wider uppercase">GOVERNANCE PORTAL</span>
        <h2 className="text-lg font-bold text-white tracking-tight">MUNYAKA OWNER</h2>
      </div>

      {/* Scrollable Owner Navigation Links */}
      <div className="flex-1 my-3 space-y-1.5 overflow-y-auto min-h-0 pr-1">
        {ownerNavItems.map((item) => {
          const isActive = activeTab === item.id || window.location.hash.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                window.location.hash = item.path;
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dedicated Executive Owner Profile Footer */}
      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 shrink-0 mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
            SA
          </div>
          <div>
            <p className="text-xs font-bold text-white">School Owner</p>
            <p className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">EXECUTIVE OWNER</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
