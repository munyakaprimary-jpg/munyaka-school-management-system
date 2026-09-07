"use client";

import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Wallet,
  Settings,
  Shield,
  Key,
  Database,
  GraduationCap,
  CreditCard,
  Server,
  BookOpen,
    } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/context/AuthContext';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  // ADMIN has unrestricted access to every navigation item
  { icon: LayoutDashboard, label: 'Home', path: '/', roles: ['admin', 'head_teacher', 'teacher', 'bursar', 'parent', 'student'] },
  { icon: Users, label: 'Learners', path: '/students', roles: ['admin', 'head_teacher', 'teacher', 'bursar'] },
  { icon: ClipboardCheck, label: 'Roll Call', path: '/attendance', roles: ['admin', 'head_teacher', 'teacher'] },
  { icon: Wallet, label: 'Fees', path: '/fees', roles: ['admin', 'head_teacher', 'bursar', 'parent'] },
  { icon: CreditCard, label: 'Payments', path: '/payment-management', roles: ['owner'] },
  { icon: Server, label: 'Settings', path: '/mobile/settings', roles: ['admin', 'head_teacher', 'teacher', 'bursar', 'parent', 'student'] },
    { icon: Shield, label: 'Staff Access', path: '/staff/pre-registration', roles: ['admin', 'head_teacher'] },
  { icon: Key, label: 'Licenses', path: '/licenses', roles: ['admin', 'head_teacher'] },
  { icon: Database, label: 'Central Data', path: '/central-data', roles: ['admin', 'head_teacher', 'teacher', 'bursar', 'parent', 'student'] },
  { icon: GraduationCap, label: 'Promote', path: '/promote', roles: ['admin', 'head_teacher'] },
  { icon: BookOpen, label: 'Study', path: '/study-corner', roles: ['admin', 'head_teacher', 'teacher', 'student', 'parent', 'librarian'] },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const { user } = useAuth();

  const filteredItems = useMemo(() => {
    if (!user) return [];
    return NAV_ITEMS.filter(item => item.roles.includes(user.role as UserRole));
  }, [user?.role]);

  const isEmpty = filteredItems.length === 0;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1 pb-safe pt-2 z-40 shadow-2xl print:hidden transition-all duration-300">
      {!isEmpty ? (
        <div className="flex items-stretch justify-start gap-1 px-1 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-2 rounded-2xl min-h-[52px] min-w-[64px] shrink-0 snap-start touch-active transition-all duration-200 ease-out",
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400 font-black bg-indigo-50 dark:bg-indigo-950/40"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <item.icon
                  size={20}
                  className={cn(
                    "shrink-0 transition-transform duration-200",
                    isActive && "scale-110"
                  )}
                />
                <span className="text-[10px] xs:text-xs mt-1 tracking-tight leading-tight text-center whitespace-normal break-words line-clamp-2 max-w-full px-0.5">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center py-3">
          <span className="text-xs text-slate-400 font-medium">No navigation available</span>
        </div>
      )}
    </nav>
  );
};