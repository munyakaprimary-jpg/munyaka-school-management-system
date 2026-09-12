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

// 1. SCHOOL ADMIN & STAFF MENU
const adminNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Learners & Admission', path: '/admin/learners', icon: GraduationCap },
  { label: 'Staff & Teachers', path: '/admin/staff', icon: Users },
  { label: 'CBC Assessment & Grading', path: '/admin/grading', icon: ClipboardCheck },
  { label: 'Attendance & Timetable', path: '/admin/attendance', icon: CalendarCheck },
  { label: 'School Fees & Accounts', path: '/admin/fees', icon: Wallet },
  { label: 'School Settings', path: '/admin/settings', icon: Settings },
];

// 2. PLATFORM DEVELOPER MENU
const devNavItems: NavItem[] = [
  { label: 'Dev Dashboard', path: '/dev/dashboard', icon: LayoutDashboard },
  { label: 'Tenants / Campuses', path: '/dev/tenants', icon: Building2 },
  { label: 'Games Hub', path: '/dev/games', icon: Gamepad2 },
  { label: 'Payment & Subscriptions', path: '/dev/subscriptions', icon: CreditCard },
  { label: 'LAN Server Config', path: '/dev/lan-sync', icon: Wifi },
  { label: 'Study Corner', path: '/dev/study-corner', icon: BookOpen },
  { label: 'Portal Settings', path: '/dev/settings', icon: Settings },
];

export const Layout: React.FC<LayoutProps> = ({ children, user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 3. FLEXIBLE ROLE & PATH MATCHING
  const isDevView = user?.role === 'developer' || location.pathname.startsWith('/dev');
  const activeNavItems = isDevView ? devNavItems : adminNavItems;

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-indigo-900 text-white flex items-center justify-between p-4 shadow-md">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-lg tracking-wide">Munyaka SMS</span>
          {isDevView && (
            <span className="bg-amber-500 text-xs text-black font-semibold px-2 py-0.5 rounded-full">
              DEV
            </span>
          )}
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 focus:outline-none hover:bg-indigo-800 rounded-lg"
          aria-label="Toggle navigation drawer"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-indigo-950 text-white transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 flex flex-col justify-between shadow-xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Drawer Brand Header */}
          <div className="p-6 border-b border-indigo-800/60 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white tracking-wider">Munyaka SMS</h2>
              <p className="text-xs text-indigo-300 mt-0.5">
                {isDevView ? 'Platform Developer Portal' : 'School Management System'}
              </p>
            </div>
            {isDevView && (
              <ShieldAlert className="w-5 h-5 text-amber-400" title="Developer Mode Active" />
            )}
          </div>

          {/* Render Active Navigation Menu Items */}
          <nav className="mt-4 px-3 space-y-1">
            {activeNavItems.map((item) => {
              const Icon = item.icon;
              // Matches exact paths or sub-paths (e.g., /learners or /admin/learners)
              const isActive =
                location.pathname === item.path ||
                location.pathname === item.path.replace('/admin', '') ||
                (item.path !== '/admin/dashboard' && location.pathname.includes(item.path.replace('/admin/', '')));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md font-semibold'
                      : 'text-indigo-200 hover:bg-indigo-900/60 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-indigo-300'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer Profile & Logout */}
        <div className="p-4 border-t border-indigo-800/60 bg-indigo-900/40">
          <div className="flex items-center space-x-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-xs text-indigo-300 capitalize truncate">
                {user?.role || (isDevView ? 'Developer' : 'School Admin')}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/30 rounded-lg text-xs font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Main Page Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
    </div>
  );
};

export default Layout;