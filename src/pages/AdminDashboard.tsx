import React from 'react';
import AdminDashboardComponent from '@/components/admin/AdminDashboard';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, DollarSign, Server, Settings, Database, ArrowUpCircle } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { label: 'Dashboard', path: '/admin-dashboard', icon: LayoutDashboard },
    { label: 'Learners', path: '/students', icon: Users },
    { label: 'Roll Call', path: '/attendance', icon: UserCheck },
    { label: 'Fees', path: '/fees', icon: DollarSign },
    { label: 'Server', path: '/lan-config', icon: Server },
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'Central', path: '/central-data', icon: Database },
    { label: 'Promote', path: '/promote', icon: ArrowUpCircle },
  ];

  return (
    <div className="relative min-h-screen pb-28">
      <AdminDashboardComponent />

      {/* Bottom Operational Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-around md:justify-center gap-1 md:gap-4 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path === '/admin-dashboard' && currentPath === '/admin');
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                }`}
              >
                <Icon size={18} className="mb-0.5" />
                <span className="text-[10px] md:text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
