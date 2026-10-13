import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  FileText, 
  DollarSign, 
  Server as ServerIcon, 
  Settings as SettingsIcon, 
  Globe, 
  TrendingUp, 
  LogOut,
  Building,
  CheckSquare,
  Activity,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import Students from '@/pages/Students';
import Attendance from '@/pages/Attendance';
import Fees from '@/pages/Fees';
import AdminControlCenter from '@/pages/AdminControlCenter';
import Settings from '@/pages/Settings';
import CentralDataService from '@/pages/CentralDataService';
import Promote from '@/pages/Promote';

interface AdminPortalProps {
  onLogout: () => void;
}

export type AdminTab = 'Dashboard' | 'Learners' | 'Roll Call' | 'Fees' | 'Server' | 'Settings' | 'Central' | 'Promote';

export default function AdminPortal({ onLogout }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
  const navigate = useNavigate();

  // Ensure role is stored as ADMIN
  useEffect(() => {
    localStorage.setItem('munyaka_portal_role', 'ADMIN');
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <AdminDashboard />;
      case 'Learners':
        return <Students />;
      case 'Roll Call':
        return <Attendance />;
      case 'Fees':
        return <Fees />;
      case 'Server':
        return <AdminControlCenter />;
      case 'Settings':
        return <Settings />;
      case 'Central':
        return <CentralDataService />;
      case 'Promote':
        return <Promote />;
      default:
        return <AdminDashboard />;
    }
  };

  const navItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'Dashboard', label: 'Dashboard', icon: Activity },
    { id: 'Learners', label: 'Learners', icon: Users },
    { id: 'Roll Call', label: 'Roll Call', icon: CheckSquare },
    { id: 'Fees', label: 'Fees', icon: DollarSign },
    { id: 'Server', label: 'Server', icon: ServerIcon },
    { id: 'Settings', label: 'Settings', icon: SettingsIcon },
    { id: 'Central', label: 'Central', icon: Globe },
    { id: 'Promote', label: 'Promote', icon: Award },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-24">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/30">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-white">Munyaka School Admin Portal</h1>
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] font-mono">ADMINISTRATOR</Badge>
            </div>
            <p className="text-xs text-slate-400">Secure operational workspace & administrative gateway</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all rounded-xl text-xs font-semibold"
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            Exit to Gateway
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {renderTabContent()}
      </main>

      {/* Dedicated Admin Bottom Operational Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 shadow-2xl py-2 px-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-around sm:justify-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
