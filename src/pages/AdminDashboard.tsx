import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Settings2,
  Users,
  Wallet,
  BookOpen,
  Shield,
  GraduationCap,
  ArrowRight,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showSuccess } from '@/utils/toast';

interface AdminTile {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  color: 'indigo' | 'blue' | 'emerald' | 'amber' | 'rose' | 'violet';
}

const TILES: AdminTile[] = [
  { title: 'System Management', description: 'Configure school-wide settings, users, and security.', icon: Settings2, path: '/system-management', color: 'indigo' },
  { title: 'User Management', description: 'Manage staff, students, and account access.', icon: Users, path: '/staff', color: 'blue' },
  { title: 'Fees & Finance', description: 'Configure fee structures and track payments.', icon: Wallet, path: '/fees', color: 'emerald' },
  { title: 'Academics', description: 'Curriculum, grades, streams, and assessments.', icon: BookOpen, path: '/assessments', color: 'amber' },
  { title: 'RBAC Permissions', description: 'Define roles and fine-grained access controls.', icon: Shield, path: '/settings', color: 'rose' },
  { title: 'Learners', description: 'Browse, register, and manage learners.', icon: GraduationCap, path: '/students', color: 'violet' },
];

const colorMap: Record<AdminTile['color'], { bg: string; text: string; border: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    localStorage.removeItem('munyaka_admin_session');
    localStorage.removeItem('munyaka_dev_session');
    showSuccess('Signed out.');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/20 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600 rounded-3xl shadow-lg shadow-indigo-200 text-white">
              <LayoutDashboard size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                School Admin Dashboard
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                Signed in as <span className="font-bold text-indigo-700">{user?.name ?? 'School System Administrator'}</span>
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="rounded-xl h-11 px-5 font-bold border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </Button>
        </div>

        {/* RBAC Notice */}
        <Card className="border-2 border-indigo-100 shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600 shrink-0">
                <Shield size={24} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 mb-1">
                  School System Administrator
                </h2>
                <p className="text-sm text-slate-600 font-medium">
                  You have full access to internal school operations: settings, users, fees, academics, RBAC permissions, and security. App license, billing, and global platform maintenance are managed by the App Developer.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tile Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TILES.map(({ title, description, icon: Icon, path, color }) => {
            const c = colorMap[color];
            return (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                className={`group p-6 rounded-3xl border-2 ${c.border} bg-white hover:shadow-xl transition-all text-left active:scale-[0.98]`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 ${c.bg} rounded-2xl ${c.text} shrink-0 transition-transform group-hover:scale-110`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-base font-black text-slate-900">{title}</h3>
                      <ArrowRight size={16} className={`shrink-0 transition-transform group-hover:translate-x-1 ${c.text}`} />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
