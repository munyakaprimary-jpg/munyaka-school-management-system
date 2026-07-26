import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  X,
  Search,
  Bell,
  Users,
  Settings,
  Calendar,
  Contact2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Students', path: '/students' },
    { icon: Contact2, label: 'Staff & Personnel', path: '/staff' },
    { icon: Calendar, label: 'Timetable', path: '/timetable' },
    { icon: UserPlus, label: 'Registration', path: '/registration' },
    { icon: ClipboardCheck, label: 'Attendance', path: '/attendance' },
    { icon: FileSpreadsheet, label: 'Assessments', path: '/assessments' },
    { icon: FolderHeart, label: 'Portfolios', path: '/portfolio' },
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
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-200">
              <School className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight leading-none text-slate-900">MUNYAKA</h1>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Primary & Junior</p>
            </div>
          </div>

          <nav className="space-y-1.5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {menuItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3.5 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-200",
                  location.pathname === item.path 
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                )}
              >
                <item.icon size={20} className={cn(location.pathname === item.path ? "text-white" : "text-slate-400")} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-slate-50">
            <div className="bg-slate-50 p-5 rounded-3xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Academic Year</p>
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-900">2024 - Term 1</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden rounded-xl"
              onClick={() => setIsOpen(true)}
            >
              <Menu size={22} />
            </Button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-slate-50 border-none rounded-2xl pl-10 pr-4 py-2.5 text-sm w-80 focus:ring-2 ring-indigo-100 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:bg-slate-50">
              <Bell size={20} />
            </Button>
            <div className="w-[1px] h-8 bg-slate-100 mx-2" />
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900">Administrator</p>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Master Control</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 shadow-sm">
                AD
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-[#fbfcfd]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;