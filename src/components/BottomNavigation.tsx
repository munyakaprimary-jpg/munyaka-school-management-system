"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardCheck, Wallet, CreditCard, Settings, Shield, Key, Database, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Home', path: '/', roles: ['owner', 'super_admin', 'head_teacher', 'teacher', 'bursar', 'parent', 'student'] },
  { icon: Users, label: 'Learners', path: '/students', roles: ['owner', 'super_admin', 'head_teacher', 'teacher', 'bursar'] },
  { icon: ClipboardCheck, label: 'Roll Call', path: '/attendance', roles: ['owner', 'super_admin', 'head_teacher', 'teacher'] },
  { icon: Wallet, label: 'Fees', path: '/fees', roles: ['owner', 'super_admin', 'head_teacher', 'bursar', 'parent'] },
  { icon: CreditCard, label: 'Payments', path: '/payment-management', roles: ['owner'] },
  { icon: Settings, label: 'System Config', path: '/system-management', roles: ['owner', 'super_admin'] },
  { icon: Shield, label: 'Staff Access', path: '/staff/pre-registration', roles: ['owner', 'super_admin', 'head_teacher'] },
  { icon: Key, label: 'Licenses', path: '/central-data', roles: ['owner', 'super_admin'] },
  { icon: Database, label: 'Central Data', path: '/central-data', roles: ['owner', 'super_admin', 'head_teacher', 'teacher', 'bursar', 'parent', 'student'] },
  { icon: GraduationCap, label: 'Promote', path: '/promote', roles: ['owner', 'super_admin', 'head_teacher'] },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const { user } = useAuth();

  const filteredItems = React.useMemo(() => {
    if (!user) return [];
    return NAV_ITEMS.filter(item => item.roles.includes(user.role));
  }, [user?.role]);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 pb-safe pt-2 flex items-center justify-around z-40 shadow-2xl print:hidden">
      {filteredItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl min-w-[64px] min-h-[48px] touch-active transition-all",
              isActive
                ? "text-indigo-600 dark:text-indigo-400 font-black"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold"
            )}
          >
            <item.icon size={20} className={cn(isActive && "scale-110 transition-transform")} />
            <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};