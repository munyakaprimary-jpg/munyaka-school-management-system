"use client";

import React from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { cn } from "@/lib/utils";

const DigitalHub = () => {
  const resources = [
    { title: "Virtual Science Lab", category: "Interactive", type: "Simulations", icon: Cpu, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "KICD E-Learning Portal", category: "Curriculum", type: "Kenya National", icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Digital Literacy Videos", category: "Media", type: "YouTube Library", icon: Video, color: "text-rose-600", bg: "bg-rose-50" },
    { title: "CBC Resource Drive", category: "Storage", type: "Cloud Access", icon: HardDrive, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  const labs = [
    { name: "Computer Lab 1", stations: 40, status: "Active", uptime: "99.2%", load: 65 },
    { name: "Junior School Tech Wing", stations: 25, status: "Maintenance", uptime: "85.5%", load: 0 },
  ];

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
          <Button variant="outline" className="rounded-2xl border-slate-200 bg-white font-bold text-slate-700 shadow-sm gap-2">
            <Wifi size={18} className="text-emerald-500" /> Network Status
          </Button>
          <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100 gap-2">
            <Download size={18} /> Sync Resources
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
          <div className="space-y-4">
            {resources.map((res, i) => (
              <Card key={i} className="border-none shadow-sm rounded-3xl bg-white hover:translate-x-1 transition-transform cursor-pointer group">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", res.bg, res.color)}>
                      <res.icon size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{res.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{res.category}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold text-indigo-500">{res.type}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full text-slate-300 group-hover:text-indigo-600">
                    <ExternalLink size={18} />
                  </Button>
                </CardContent>
              </Card>
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