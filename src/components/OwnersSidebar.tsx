import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Building2, 
  Globe, 
  CreditCard, 
  Settings, 
  LogOut,
  X,
  ShieldAlert
} from 'lucide-react';

interface OwnersSidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export default function OwnersSidebar({ activeTab, setActiveTab = () => {}, onClose, isOpen = true }: OwnersSidebarProps) {
  const { logout } = useAuth();

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
    { id: 'owner', label: "Executive Dashboard", path: '#/owner', icon: LayoutDashboard },
    { id: 'tenants', label: 'Tenants / Campuses', path: '#/tenants', icon: Building2 },
    { id: 'lan', label: 'LAN Server Config', path: '#/lan', icon: Globe },
    { id: 'payments', label: 'Subscriptions & Billing', path: '#/payments', icon: CreditCard },
    { id: 'settings', label: 'Executive Settings', path: '#/settings', icon: Settings }
  ];

  const handleLogout = () => {
    try {
      localStorage.removeItem('munyaka_user_role');
      logout();
    } catch {}
    window.location.hash = '#/login';
    window.location.reload();
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden" 
          onClick={onClose}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-slate-100 p-4 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Executive Governance</span>
            <h2 className="text-base font-black text-white tracking-tight">MUNYAKA OWNER</h2>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div 
          className="flex-1 min-h-0 my-3 space-y-1 overflow-y-auto" 
          style={{ maxHeight: 'calc(100vh - 220px)' }}
        >
          <nav className="space-y-1">
            {ownerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentActive === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id, item.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 shrink-0 mt-auto space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              EX
            </div>
            <div>
              <p className="text-xs font-bold text-white">School Owner</p>
              <p className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">EXECUTIVE GOVERNANCE</p>
            </div>
          </div>

          <div className="border-t border-slate-800/80" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={14} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
