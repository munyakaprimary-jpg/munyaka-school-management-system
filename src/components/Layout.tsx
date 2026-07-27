import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
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
  Award
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Students', path: '/students' },
    { icon: Layers, label: 'Grades & Streams', path: '/grades' },
    { icon: BookOpen, label: 'Learning Areas', path: '/learning-areas' },
    { icon: Award, label: 'Exam Types', path: '/exam-types' },
    { icon: Contact2, label: 'Staff & Personnel', path: '/staff' },
    { icon: MessageSquare, label: 'Communication', path: '/communication' },
    { icon: Megaphone, label: 'Notice Board', path: '/notices' },
    { icon: CalendarDays, label: 'School Calendar', path: '/calendar' },
    { icon: Calendar, label: 'Timetable', path: '/timetable' },
    { icon: ClipboardCheck, label: 'Attendance', path: '/attendance' },
    { icon: FileSpreadsheet, label: 'Enter Marks', path: '/assessments' },
    { icon: FolderHeart, label: 'Portfolios', path: '/portfolio' },
    { icon: Library, label: 'Library & E-Resources', path: '/library' },
    { icon: Box, label: 'Tools & Inventory', path: '/inventory' },
    { icon: Wallet, label: 'Fees & Finance', path: '/fees' },
    { icon: FileText, label: 'Report Cards', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-[#fbfcfd] overflow-hidden">
      {/* Mobile Menu Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center gap-2.5 mb-5 px-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-md shadow-indigo-200">
              <School className="text-white" size={18} />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight leading-none text-slate-900">MUNYAKA</h1>
              <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Primary & Junior</p>
            </div>
          </div>

          <nav className="space-y-0.5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {menuItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150",
                  location.pathname === item.path 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                )}
              >
                <item.icon size={15} className={cn(location.pathname === item.path ? "text-white" : "text-slate-400")} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-3 border-t border-slate-100 px-1">
            <div className="bg-slate-50 p-2.5 rounded-xl">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Academic Year</p>
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-slate-900">2024 - Term 1</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden rounded-lg h-8 w-8"
              onClick={() => setIsOpen(true)}
            >
              <Menu size={18} />
            </Button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-slate-50 border-none rounded-lg pl-8 pr-3 py-1.5 text-xs w-64 focus:ring-2 ring-indigo-100 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-lg text-slate-400 hover:bg-slate-50 h-8 w-8">
              <Bell size={16} />
            </Button>
            <div className="w-[1px] h-5 bg-slate-100 mx-0.5" />
            <Link to="/profile">
              <div className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">Administrator</p>
                  <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest">Master Control</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center font-bold text-xs text-indigo-600 shadow-sm">
                  AD
                </div>
              </div>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-[#fbfcfd]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;