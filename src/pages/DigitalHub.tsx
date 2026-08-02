"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import BackButton from '@/components/ui/BackButton';
import { 
  Laptop, 
  Wifi, 
  HardDrive, 
  Cpu, 
  Globe, 
  BookOpen, 
  Video, 
  Download,
  ExternalLink,
  Monitor,
  Activity,
  ShieldCheck,
  Loader2,
  WifiOff,
  CheckCircle2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DigitalHub = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const catalogResources = [
    {
      title: "Virtual Science Lab",
      category: "INTERACTIVE • Simulations",
      url: "https://phet.colorado.edu",
      icon: Cpu
    },
    {
      title: "KICD E-Learning Portal",
      category: "CURRICULUM • Kenya National",
      url: "https://kicd.ac.ke",
      icon: BookOpen
    },
    {
      title: "Digital Literacy Videos",
      category: "MEDIA • YouTube Library",
      url: "https://www.youtube.com",
      icon: Video
    }
  ];

  const labs = [
    { name: "Computer Lab 1", stations: 40, status: "Active", uptime: "99.2%", load: 65 },
    { name: "Junior School Tech Wing", stations: 25, status: "Maintenance", uptime: "85.5%", load: 0 },
  ];

  // Network status listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNetworkStatusClick = () => {
    toast.success("System connected to local network.");
  };

  const handleSyncResources = async () => {
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSyncing(false);
    toast.success("Local ICT resources and asset logs synced successfully.");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Digital Hub</h1>
            <p className="text-muted-foreground font-medium">ICT infrastructure and e-learning resource management.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="rounded-2xl border-slate-200 bg-white font-bold text-slate-700 shadow-sm gap-2"
            onClick={handleNetworkStatusClick}
          >
            {isOnline ? (
              <>
                <Wifi size={18} className="text-emerald-500" /> 
                <span className="text-emerald-600 font-medium">Online</span>
              </>
            ) : (
              <>
                <WifiOff size={18} className="text-amber-500" /> 
                <span className="text-amber-600 font-medium">Offline Mode</span>
              </>
            )}
          </Button>
          <Button 
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100 gap-2"
            onClick={handleSyncResources}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Syncing...
              </>
            ) : (
              <>
                <Download size={18} /> Sync Resources
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Connectivity & Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Network Speed', value: '45 Mbps', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Safaricom Fiber' },
          { label: 'Active Devices', value: '62 Units', icon: Laptop, color: 'text-indigo-600', bg: 'bg-indigo-50', sub: 'In Main Lab' },
          { label: 'System Uptime', value: '14 Days', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Stable' },
          { label: 'Data Usage', value: '128 GB', icon: HardDrive, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'This Week' },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm rounded-[2rem] bg-white p-6">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-2xl", s.bg)}>
                <s.icon className={s.color} size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p>
                <h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{s.value}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1">{s.sub}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lab Status Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">Lab Infrastructure</h2>
            <Badge variant="outline" className="rounded-lg border-slate-200 font-bold">2 Active Facilities</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {labs.map((lab, i) => (
              <Card key={i} className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden group">
                <CardHeader className="p-8 pb-4 border-b border-slate-50 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                      <Monitor size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">{lab.name}</CardTitle>
                      <p className="text-xs text-slate-400 font-medium">{lab.stations} Workstations</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "rounded-xl border-none font-bold text-[10px] uppercase",
                    lab.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  )}>
                    {lab.status}
                  </Badge>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <span>Active Utilization</span>
                    <span className="text-slate-900">{lab.load}%</span>
                  </div>
                  <Progress value={lab.load} className="h-2 bg-slate-50" />
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Stability</p>
                      <p className="text-sm font-black text-slate-900">{lab.uptime}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Power</p>
                      <p className="text-sm font-black text-emerald-600 flex items-center gap-1">
                        <ShieldCheck size={12} /> Backup OK
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* E-Learning Resources Sidebar */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-900">Digital Catalog</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {catalogResources.map((item, idx) => (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <item.icon size={22} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs uppercase font-bold tracking-wider text-slate-400">
                      {item.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-600 text-sm font-medium">
                  <span>Open</span>
                  <ExternalLink className="w-4 h-4" />
                </div>
              </a>
            ))}
          </div>

          <Card className="border-none shadow-sm rounded-[2rem] bg-indigo-900 text-white p-8 relative overflow-hidden">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12">
              <Laptop size={120} />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-black mb-2">Teacher Training</h3>
              <p className="text-indigo-200 text-xs leading-relaxed mb-6 font-medium">
                Access self-paced modules on Digital Literacy and ICT integration in CBC.
              </p>
              <Button className="w-full bg-white text-indigo-900 hover:bg-indigo-50 rounded-2xl font-black h-12">
                Open Academy
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DigitalHub;