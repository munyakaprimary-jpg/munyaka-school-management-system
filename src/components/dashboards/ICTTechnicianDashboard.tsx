import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  Monitor, 
  Laptop, 
  Bell, 
  LogIn, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  FileSpreadsheet, 
  Megaphone,
  Wifi,
  ShieldCheck,
  Wrench,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ICTTechnicianDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const techName = user?.name || 'ICT Technician';
  const techRole = user?.role || 'ICT Technician';

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full font-sans">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-700 via-indigo-700 to-slate-900 p-8 text-white shadow-2xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-64 h-64 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-violet-200">
              <Sparkles size={14} /> ICT & Technical Operations
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Welcome, {techName}!
            </h1>
            <p className="text-violet-100 text-sm md:text-base max-w-xl font-medium">
              You are signed in as <span className="underline decoration-violet-400 font-bold">{techName}</span> ({techRole}). Manage school hardware labs, network infrastructure, and digital literacy tools here.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => navigate('/ict-lab')}
              className="bg-white text-violet-900 hover:bg-violet-50 font-bold px-5 py-3 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
            >
              <Monitor size={18} className="text-violet-600" />
              ICT Lab & Devices
            </Button>
            <Button
              onClick={() => navigate('/digital-hub')}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-bold px-5 py-3 rounded-2xl backdrop-blur-md transition-transform active:scale-95 flex items-center gap-2"
            >
              <Laptop size={18} className="text-violet-300" />
              Digital Hub
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Lab Devices</p>
              <h3 className="text-3xl font-black text-slate-900">48 / 50</h3>
              <p className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1">
                <CheckCircle2 size={12} /> Operational & Online
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shadow-inner">
              <Monitor size={28} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Maintenance Tickets</p>
              <h3 className="text-3xl font-black text-slate-900">2</h3>
              <p className="text-xs font-medium text-amber-600 flex items-center gap-1 mt-1">
                <Clock size={12} /> Pending repairs
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
              <Wrench size={28} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Digital Hub Platforms</p>
              <h3 className="text-3xl font-black text-slate-900">12</h3>
              <p className="text-xs font-medium text-blue-600 flex items-center gap-1 mt-1">
                <CheckCircle2 size={12} /> E-learning tools active
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
              <Laptop size={28} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Network Status</p>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 mt-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                1 Gbps LAN
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-1">
                All subnets stable
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
              <Wifi size={28} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">ICT Technician Modules</h2>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Technical Operations</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div 
            onClick={() => navigate('/ict-lab')}
            className="group cursor-pointer bg-white p-6 rounded-3xl border border-slate-200 hover:border-violet-500 hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Monitor size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">ICT Lab & Devices</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hardware inventory, device troubleshooting logs, and lab station management.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-violet-600 group-hover:gap-3 transition-all">
              <span>Manage Hardware</span> <ArrowRight size={14} />
            </div>
          </div>

          <div 
            onClick={() => navigate('/digital-hub')}
            className="group cursor-pointer bg-white p-6 rounded-3xl border border-slate-200 hover:border-indigo-500 hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Laptop size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Digital Hub</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Managing e-learning platforms, student digital literacy tools, and software distribution.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-indigo-600 group-hover:gap-3 transition-all">
              <span>Open Digital Hub</span> <ArrowRight size={14} />
            </div>
          </div>

          <div 
            onClick={() => navigate('/notices')}
            className="group cursor-pointer bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bell size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Events & Notices</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                School-wide technical announcements, server maintenance schedules, and lab downtimes.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-600 group-hover:gap-3 transition-all">
              <span>View Notices</span> <ArrowRight size={14} />
            </div>
          </div>

          <div 
            onClick={() => navigate('/staff/check-in')}
            className="group cursor-pointer bg-white p-6 rounded-3xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <LogIn size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Daily Check-In</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Technical staff personal check-in tracking and shift logging.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-600 group-hover:gap-3 transition-all">
              <span>Check In</span> <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Technical Notices & Server Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black text-slate-900">Technical Maintenance Notices</CardTitle>
              <CardDescription className="text-xs">Scheduled updates & network downtime notices</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/notices')} className="text-violet-600 font-bold text-xs">
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                <Megaphone size={18} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">Scheduled Fiber Backbone Maintenance</h4>
                  <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 text-[10px] font-bold">IT Notice</Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Main server room switch firmware upgrade scheduled for Saturday 2:00 AM. Expect temporary local intranet restart.
                </p>
                <p className="text-[10px] text-slate-400 font-medium pt-1">Posted by ICT Department · 4 hours ago</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                <ShieldCheck size={18} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">Digital Skills Tablet Deployment (Grade 4)</h4>
                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold">Lab Operations</Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tablets charging carts 1-4 inspected and updated with latest CBC interactive learning applications.
                </p>
                <p className="text-[10px] text-slate-400 font-medium pt-1">Posted by ICT Department · Yesterday</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile & Security Summary */}
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="p-6 border-b border-slate-100">
              <CardTitle className="text-lg font-black text-slate-900">Technician Profile</CardTitle>
              <CardDescription className="text-xs">Access & Restrictions</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                  {techName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{techName}</p>
                  <p className="text-xs text-slate-500">ICT Technician</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-xs text-slate-600 font-medium">
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 text-emerald-800">
                  <span>Hardware & Lab Access</span>
                  <span className="font-bold">Full Access</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 text-slate-600">
                  <span>Teaching & Grading</span>
                  <span className="font-bold text-rose-600">Restricted</span>
                </div>
              </div>
            </CardContent>
          </div>

          <div className="p-6 pt-0">
            <Button 
              onClick={() => navigate('/ict-lab')}
              className="w-full bg-violet-900 hover:bg-violet-800 text-white font-bold py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2"
            >
              <Monitor size={16} /> Open ICT Lab Console
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ICTTechnicianDashboard;
