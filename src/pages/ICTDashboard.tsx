import React, { useState } from 'react';
import { 
  Monitor, Wifi, Wrench, Database, CheckCircle2, AlertTriangle, 
  RefreshCw, Terminal, Send, HardDrive, ShieldCheck, Cpu, 
  Activity, ArrowUpRight, Zap, Radio, CheckSquare, BookOpen, Layers
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function ICTDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDiagnosticsRunning, setIsDiagnosticsRunning] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'Synced' | 'Syncing' | 'Pending'>('Synced');
  const [lastSyncTime, setLastSyncTime] = useState('2 mins ago');

  const [maintenanceLogs, setMaintenanceLogs] = useState([
    { id: 'LOG-301', device: 'Lab A - Tablet #14', issue: 'Broken charging port', status: 'In Repair', technician: 'Alex M.', time: '1 hour ago' },
    { id: 'LOG-302', device: 'Router Hub 2', issue: 'LAN packet loss', status: 'Resolved', technician: 'System Auto', time: '3 hours ago' },
    { id: 'LOG-303', device: 'Staff Laptop #04', issue: 'OS Image Reinstall', status: 'Pending', technician: 'Unassigned', time: '5 hours ago' },
    { id: 'LOG-304', device: 'Projector Hall B', issue: 'Lamp replacement required', status: 'In Repair', technician: 'David K.', time: '1 day ago' },
  ]);

  const handleRunDiagnostics = () => {
    setIsDiagnosticsRunning(true);
    toast({
      title: 'Running System Diagnostics',
      description: 'Checking LAN mesh, student tablets, and offline database integrity...',
    });
    setTimeout(() => {
      setIsDiagnosticsRunning(false);
      toast({
        title: 'Diagnostics Complete',
        description: 'All 42 active devices checked. 2 minor DNS warnings logged.',
      });
    }, 2000);
  };

  const handleSyncServer = () => {
    setIsSyncing(true);
    setSyncStatus('Syncing');
    toast({
      title: 'Initiating Local LAN Sync',
      description: 'Synchronizing local SQLite offline cache with cloud repository...',
    });
    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatus('Synced');
      setLastSyncTime('Just now');
      toast({
        title: 'Sync Successful',
        description: 'All offline attendance and digital skill records successfully backed up.',
      });
    }, 2500);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-violet-700/40">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-violet-500/30 text-cyan-300 border border-cyan-400/30 px-3 py-1 font-mono text-xs uppercase tracking-wider">
                ICT Technician Control Center
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                LAN Server Online
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">ICT Infrastructure Dashboard</h1>
            <p className="text-violet-200/80 max-w-2xl text-sm md:text-base">
              Monitor network stability, tablet charging bays, student digital skills repositories, and hardware maintenance logs in real time.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleRunDiagnostics} 
              disabled={isDiagnosticsRunning}
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold shadow-lg transition-all"
            >
              <Terminal className={`w-4 h-4 mr-2 ${isDiagnosticsRunning ? 'animate-spin' : ''}`} />
              {isDiagnosticsRunning ? 'Running Checks...' : 'Run Diagnostics'}
            </Button>
            <Button 
              onClick={handleSyncServer}
              disabled={isSyncing}
              variant="outline"
              className="border-violet-400 text-violet-100 hover:bg-violet-800/60 bg-violet-900/40 backdrop-blur-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {syncStatus === 'Syncing' ? 'Syncing...' : 'Sync LAN Server'}
            </Button>
          </div>
        </div>
      </div>

      {/* 1. System Health & Infrastructure Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow bg-card/90 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Lab Devices</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">38 / 42</h3>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-0.5" /> 90.4%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <Monitor className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span>Tablets & Laptops online</span>
              <Button variant="link" className="p-0 h-auto text-xs font-semibold text-violet-600" onClick={() => navigate('/ict-lab')}>
                Manage Lab <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow bg-card/90 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Offline Sync Status</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">{syncStatus}</h3>
                  <span className="text-xs text-cyan-600 font-semibold">LAN Mesh</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Wifi className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span>Last sync: {lastSyncTime}</span>
              <Button variant="link" className="p-0 h-auto text-xs font-semibold text-cyan-600" onClick={handleSyncServer}>
                Sync Now
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow bg-card/90 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Repair Tickets</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">3 Items</h3>
                  <span className="text-xs text-amber-600 font-semibold flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-0.5" /> Action Req.
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Wrench className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span>2 tablets, 1 projector</span>
              <Button variant="link" className="p-0 h-auto text-xs font-semibold text-amber-600" onClick={() => navigate('/ict-lab')}>
                View Queue
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow bg-card/90 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Digital Resources Loaded</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">1,420 Items</h3>
                  <span className="text-xs text-emerald-600 font-semibold">18.4 GB</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Database className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span>KICD Curriculum & E-Books</span>
              <Button variant="link" className="p-0 h-auto text-xs font-semibold text-emerald-600" onClick={() => navigate('/study-corner')}>
                Browse Hub
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Hardware & Lab Overview + Recent Maintenance Log */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick-view Hardware status */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-violet-600" />
                  ICT Lab & Hardware Status
                </CardTitle>
                <CardDescription>Real-time device inventory breakdown across charging carts & hubs</CardDescription>
              </div>
              <Button size="sm" onClick={() => navigate('/ict-lab')} className="bg-violet-600 hover:bg-violet-700 text-white">
                Open Lab Manager
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Tablets & Pads</p>
                    <h4 className="text-xl font-extrabold text-foreground mt-1">28 Working</h4>
                    <p className="text-xs text-amber-600 font-medium mt-0.5">2 in repair</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-600 flex items-center justify-center font-bold">
                    📱
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Teacher Laptops</p>
                    <h4 className="text-xl font-extrabold text-foreground mt-1">10 Working</h4>
                    <p className="text-xs text-amber-600 font-medium mt-0.5">1 pending config</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-600/10 text-cyan-600 flex items-center justify-center font-bold">
                    💻
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Projectors & AV</p>
                    <h4 className="text-xl font-extrabold text-foreground mt-1">4 Active</h4>
                    <p className="text-xs text-red-600 font-medium mt-0.5">1 lamp replacement</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold">
                    📽️
                  </div>
                </div>
              </div>

              {/* Maintenance Log Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Maintenance & Repair Logs</h4>
                  <span className="text-xs text-muted-foreground">Showing 4 recent items</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                      <tr>
                        <th className="p-3">Log ID</th>
                        <th className="p-3">Device</th>
                        <th className="p-3">Issue</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Technician</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {maintenanceLogs.map(log => (
                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs font-semibold text-violet-600">{log.id}</td>
                          <td className="p-3 font-medium text-foreground">{log.device}</td>
                          <td className="p-3 text-muted-foreground">{log.issue}</td>
                          <td className="p-3">
                            <Badge variant={log.status === 'Resolved' ? 'default' : log.status === 'In Repair' ? 'secondary' : 'outline'} className={
                              log.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              log.status === 'In Repair' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                              'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            }>
                              {log.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{log.technician} ({log.time})</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Quick Management Tools & Navigation */}
        <div className="space-y-6">
          
          {/* Quick Management Tools */}
          <Card className="border-border/60 shadow-sm bg-gradient-to-b from-card to-violet-950/10">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Quick Management Tools
              </CardTitle>
              <CardDescription>Essential shortcuts for ICT operations</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/notices')}
                className="justify-between h-auto p-4 border-border/80 hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 group"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-foreground text-sm">Broadcast System Notice</h5>
                    <p className="text-xs text-muted-foreground">Send lab schedule or maintenance alerts</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-600 transition-colors" />
              </Button>

              <Button 
                variant="outline" 
                onClick={() => navigate('/staff/check-in')}
                className="justify-between h-auto p-4 border-border/80 hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 group"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-foreground text-sm">Daily Check-In</h5>
                    <p className="text-xs text-muted-foreground">Log staff attendance & duty shift</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-600 transition-colors" />
              </Button>

              <Button 
                variant="outline" 
                onClick={() => navigate('/digital-hub')}
                className="justify-between h-auto p-4 border-border/80 hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 group"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-foreground text-sm">Digital Hub & Content</h5>
                    <p className="text-xs text-muted-foreground">Manage KICD videos & offline hubs</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
              </Button>

              <Button 
                variant="outline" 
                onClick={() => navigate('/study-corner')}
                className="justify-between h-auto p-4 border-border/80 hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 group"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-foreground text-sm">Study Corner / Resources</h5>
                    <p className="text-xs text-muted-foreground">Verify digital textbooks & study kits</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-600 transition-colors" />
              </Button>
            </CardContent>
          </Card>

          {/* Local Server Information */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-violet-600" />
                LAN Node & Storage Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Server IP Address</span>
                <span className="font-mono font-semibold">192.168.10.1 (Local Mesh)</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Storage Used</span>
                <span className="font-semibold text-emerald-600">64 GB / 512 GB (12.5%)</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Active Sessions</span>
                <span className="font-semibold text-violet-600">34 Connected Learner Tablets</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-muted-foreground">Firmware Version</span>
                <span className="font-mono">v4.8.2-ke-stable</span>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
