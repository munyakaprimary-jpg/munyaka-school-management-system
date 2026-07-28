"use client";

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  UserPlus, 
  ClipboardCheck, 
  FileSpreadsheet, 
  FileText,
  FolderHeart,
  Wallet,
  School,
  Menu,
  Search,
  Bell,
  Users,
  Settings,
  Calendar,
  Contact2,
  Megaphone,
  Box,
  Library,
  MessageSquare,
  CalendarDays,
  Layers,
  BookOpen,
  Award,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  X,
  UserCircle,
  GraduationCap,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Plus,
  Printer,
  RefreshCw,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  Search as SearchIcon,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Zap,
  Award as AwardIcon,
  BookOpen as BookOpenIcon,
  ClipboardList,
  ShoppingCart,
  DollarSign,
  Percent,
  TrendingUp as TrendingUpIcon,
  Users as UsersIcon,
  UserCheck,
  Clock as ClockIcon,
  Wallet as WalletIcon,
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
  Menu as MenuIcon,
  X as XIcon,
  ChevronDown,
  ChevronUp,
  Home,
  ArrowLeft,
  Bell as BellIcon,
  Moon as MoonIcon,
  Sun as SunIcon,
  Search as SearchIcon2,
  Filter as FilterIcon,
  Download as DownloadIcon,
  Printer as PrinterIcon,
  RefreshCw as RefreshCwIcon,
  ArrowUpDown as ArrowUpDownIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Eye as EyeIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  MapPin as MapPinIcon,
  Calendar as CalendarIcon2,
  Activity as ActivityIcon,
  BarChart3 as BarChart3Icon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Target as TargetIcon,
  Zap as ZapIcon,
  AwardIcon as AwardIcon2,
  BookOpenIcon as BookOpenIcon2,
  ClipboardList as ClipboardListIcon,
  ShoppingCart as ShoppingCartIcon,
  DollarSign as DollarSignIcon,
  Percent as PercentIcon,
  TrendingUpIcon as TrendingUpIcon2,
  UsersIcon as UsersIcon2,
  UserCheck as UserCheckIcon,
  ClockIcon as ClockIcon2,
  WalletIcon as WalletIcon2,
  SettingsIcon as SettingsIcon2,
  LogOutIcon as LogOutIcon2,
  MenuIcon as MenuIcon2,
  XIcon as XIcon2,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  Home as HomeIcon,
  ArrowLeft as ArrowLeftIcon,
  BellIcon as BellIcon2,
  MoonIcon as MoonIcon2,
  SunIcon as SunIcon2,
  SearchIcon2 as SearchIcon3,
  FilterIcon as FilterIcon2,
  DownloadIcon as DownloadIcon2,
  PrinterIcon as PrinterIcon2,
  RefreshCwIcon as RefreshCwIcon2,
  ArrowUpDownIcon as ArrowUpDownIcon2,
  MoreHorizontalIcon as MoreHorizontalIcon2,
  EyeIcon as EyeIcon2,
  MailIcon as MailIcon2,
  PhoneIcon as PhoneIcon2,
  MapPinIcon as MapPinIcon2,
  CalendarIcon2 as CalendarIcon3,
  ActivityIcon as ActivityIcon2,
  BarChart3Icon as BarChart3Icon2,
  PieChartIcon as PieChartIcon2,
  LineChartIcon as LineChartIcon2,
  TargetIcon as TargetIcon2,
  ZapIcon as ZapIcon2,
  AwardIcon2 as AwardIcon3,
  BookOpenIcon2 as BookOpenIcon3,
  ClipboardListIcon as ClipboardListIcon2,
  ShoppingCartIcon as ShoppingCartIcon2,
  DollarSignIcon as DollarSignIcon2,
  PercentIcon as PercentIcon2,
  TrendingUpIcon2 as TrendingUpIcon3,
  UsersIcon2 as UsersIcon3,
  UserCheckIcon as UserCheckIcon2,
  ClockIcon2 as ClockIcon3,
  WalletIcon2 as WalletIcon3,
  SettingsIcon2 as SettingsIcon3,
  LogOutIcon2 as LogOutIcon3,
  MenuIcon2 as MenuIcon3,
  XIcon2 as XIcon3,
  ChevronDownIcon as ChevronDownIcon2,
  ChevronUpIcon as ChevronUpIcon2,
  HomeIcon as HomeIcon2,
  ArrowLeftIcon as ArrowLeftIcon2,
  BellIcon2 as BellIcon3,
  MoonIcon2 as MoonIcon3,
  SunIcon2 as SunIcon3,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/', roles: ['super_admin', 'head_teacher', 'teacher', 'bursar', 'parent', 'student'] },
    { icon: UsersIcon, label: 'Student Directory', path: '/students', roles: ['super_admin', 'head_teacher', 'teacher', 'bursar'] },
    { icon: Contact2, label: 'Staff & Teachers', path: '/staff', roles: ['super_admin', 'head_teacher'] },
    { icon: ClipboardCheck, label: 'Attendance & Registers', path: '/attendance', roles: ['super_admin', 'head_teacher', 'teacher'] },
    { icon: Layers, label: 'Classes & Streams', path: '/grades', roles: ['super_admin', 'head_teacher'] },
    { icon: FileSpreadsheet, label: 'Examinations & Marks', path: '/assessments', roles: ['super_admin', 'head_teacher', 'teacher'] },
    { icon: WalletIcon, label: 'Finance & Fees', path: '/fees', roles: ['super_admin', 'head_teacher', 'bursar', 'parent'] },
    { icon: SettingsIcon, label: 'Settings', path: '/settings', roles: ['super_admin', 'head_teacher'] },
  ];

  const filteredMenu = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className={cn("flex h-screen overflow-hidden", isDarkMode ? "dark" : "")}>
      {/* Mobile Menu Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-50 transform transition-all duration-300 ease-in-out flex flex-col",
        isCollapsed ? "w-16" : "w-64",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center">
                <School className="text-white" size={20} />
              </div>
              <div>
                <h1 className="font-black text-sm tracking-tight text-slate-900 dark:text-white">MUNYAKA</h1>
                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Primary & Junior</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center mx-auto">
              <School className="text-white" size={20} />
            </div>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredMenu.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                location.pathname === item.path 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:bg-indigo-700" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400"
              )}
            >
              <item.icon size={18} className={cn(
                "shrink-0",
                location.pathname === item.path ? "text-white" : "text-slate-400 group-hover:text-indigo-600"
              )} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Profile Card */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-black text-sm text-indigo-600 dark:text-indigo-400">
                {user?.avatar || user?.name?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Admin'}</p>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest truncate">{user?.role?.replace('_', ' ') || 'Administrator'}</p>
                </div>
              )}
            </div>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className={cn(
                "w-full justify-start gap-2 rounded-xl h-9 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20",
                isCollapsed && "px-2"
              )}
            >
              <LogOut size={14} />
              {!isCollapsed && <span>Sign Out</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden rounded-xl"
              onClick={() => setIsOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <div className="relative hidden md:block flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search students by name, ADM number, or staff ID..." 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md">
                Ctrl K
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Term Selector */}
            <select className="hidden sm:block px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-2 ring-indigo-100">
              <option>Term 1 • 2024</option>
              <option>Term 2 • 2024</option>
              <option>Term 3 • 2024</option>
            </select>

            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-slate-400" />}
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Bell size={18} className="text-slate-400" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">3</span>
            </button>

            {/* Profile */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-black text-xs text-indigo-600 dark:text-indigo-400">
                {user?.avatar || 'AD'}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name || 'Admin'}</p>
                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{user?.role?.replace('_', ' ') || 'Master Control'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50 dark:bg-slate-950">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;