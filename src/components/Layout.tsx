import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  CalendarCheck,
  Wallet,
  Settings,
  Building2,
  Gamepad2,
  CreditCard,
  Wifi,
  BookOpen,
  Menu,
  X,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user?: {
    name?: string;
    role?: string;
    email?: string;
  };
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Learners & Admission', path: '/learners', icon: GraduationCap },
  { label: 'Staff & Teachers', path: '/staff', icon: Users },
  { label: 'CBC Assessment & Grading', path: '/attendance', icon: ClipboardCheck },
  { label: 'Attendance & Timetable', path: '/attendance', icon: CalendarCheck },
  { label: 'School Fees & Accounts', path: '/fees', icon: Wallet },
  { label: 'School Settings', path: '/settings', icon: Settings },
];

const devNavItems: NavItem[] = [
  { label: 'Platform Dashboard', path: '/dev/dashboard', icon: LayoutDashboard },
  { label: 'Tenant Management', path: '/dev/tenants', icon: Building2 },
  { label: 'Payment & Subscriptions', path: '/fees', icon: CreditCard },
  { label: 'LAN Server Config', path: '/settings', icon: Wifi },
  { label: 'Portal Settings', path: '/settings', icon: Settings },
];

export const Layout: React.FC<LayoutProps> = ({ children, user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isDevView = user?.role === 'developer' || location.pathname.startsWith('/dev');
  const activeNavItems = isDevView ? devNavItems : adminNavItems;

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full justify-between">
          <div>
            {/* Drawer Brand Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-wider text-indigo-400">Munyaka SMS</h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isDevView ? 'Platform Developer' : 'Primary & Junior School'}
                </p>
              </div>
              {isDevView && (
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              )}
            </div>

            {/* Navigation Menu */}
            <nav className="mt-4 px-3 space-y-1">
              {activeNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'Administrator'}</p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.role || (isDevView ? 'Developer' : 'School Admin')}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-indigo-900 text-white p-4 flex items-center justify-between shadow-md z-30">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">Munyaka SMS</span>
            {isDevView && (
              <span className="text-xs bg-amber-500 text-slate-900 px-1.5 py-0.5 rounded font-bold">
                DEV
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 focus:outline-none text-white"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Content View */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;