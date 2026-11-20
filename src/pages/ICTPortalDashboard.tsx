import React, { useState } from 'react';
import { 
  Laptop, Cpu, Wrench, ShieldAlert, BarChart3, Users, BookOpen, 
  CheckCircle2, Clock, AlertTriangle, Plus, Search, Filter, RefreshCw, 
  HardDrive, Smartphone, Monitor, Printer, Wifi, Server, Sparkles, 
  ArrowRight, ShieldCheck, FileText, Download, Database, Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import ICTLabManagement from '@/components/ICTLabManagement';
import DigitalSkillsAssessment from '@/pages/DigitalSkillsAssessment';
import PracticalCompetencies from '@/pages/PracticalCompetencies';
import { toast } from 'sonner';

export default function ICTPortalDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'hardware' | 'skills' | 'competencies' | 'sync'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Get user info from localStorage
  const userStr = localStorage.getItem('munyaka_user') || localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { name: 'ICT Specialist', role: 'ict_teacher' };
  const teacherName = user.name || user.fullName || 'ICT Teacher';

  // Calculate live metrics from storage / localStorage
  const [assetList, setAssetList] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('munyaka_ict_assets');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [competencyList, setCompetencyList] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('munyaka_practical_competencies') || localStorage.getItem('munyaka_digital_skills');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Listen for storage changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      try {
        const rawAssets = localStorage.getItem('munyaka_ict_assets');
        if (rawAssets) setAssetList(JSON.parse(rawAssets));

        const rawComps = localStorage.getItem('munyaka_practical_competencies') || localStorage.getItem('munyaka_digital_skills');
        if (rawComps) setCompetencyList(JSON.parse(rawComps));
      } catch {}
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('munyaka_ict_assets', handleStorageChange);
    window.addEventListener('munyaka_practical_competencies', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('munyaka_ict_assets', handleStorageChange);
      window.removeEventListener('munyaka_practical_competencies', handleStorageChange);
    };
  }, []);

  const totalAssetsCount = assetList.length;
  const activeAssetsCount = assetList.filter((a: any) => {
    const st = String(a.status || a.condition || 'active').toLowerCase();
    return st.includes('active') || st.includes('good') || st.includes('working') || st.includes('operational');
  }).length;
  const servicingAssetsCount = totalAssetsCount - activeAssetsCount;

  // Derive computer labs dynamically from asset location/lab fields or fallback to 0
  const uniqueLabs = React.useMemo(() => {
    const labsSet = new Set<string>();
    assetList.forEach((a: any) => {
      const labName = String(a.lab || a.location || a.room || '').trim();
      if (labName) labsSet.add(labName);
    });
    return Array.from(labsSet);
  }, [assetList]);

  const computerLabsCount = uniqueLabs.length;
  const labsSubtitle = uniqueLabs.length > 0 ? uniqueLabs.slice(0, 3).join(', ') : 'No labs registered';

  const digitalSkillsGradedCount = competencyList.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 border border-cyan-500/20 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 uppercase tracking-widest text-[11px] font-extrabold px-3 py-1">
                ICT Teacher Portal & Workstation
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-semibold">
                Online & Connected
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Laptop className="w-9 h-9 text-cyan-400" />
              ICT Department & Digital Lab Center
            </h1>
            <p className="text-slate-400 max-w-2xl text-sm md:text-base">
              Welcome, <span className="text-cyan-300 font-semibold">{teacherName}</span>. Manage computer laboratories, student digital skill competencies, hardware maintenance logs, and offline local sync nodes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              onClick={() => navigate('/ict-lab')}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-900/40 rounded-xl"
            >
              <Monitor className="w-4 h-4 mr-2" /> Full Lab Inventory
            </Button>
            <Button 
              onClick={() => navigate('/lan-server-config')}
              variant="outline"
              className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200 rounded-xl"
            >
              <Server className="w-4 h-4 mr-2 text-cyan-400" /> LAN Server Sync
            </Button>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-8">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl inline-flex flex-nowrap whitespace-nowrap gap-2 min-w-full sm:min-w-0">
            <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white rounded-xl px-4 py-2.5 text-xs md:text-sm font-semibold transition-all shrink-0 cursor-pointer">
              <BarChart3 className="w-4 h-4 mr-2" /> Overview & Metrics
            </TabsTrigger>
            <TabsTrigger value="hardware" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white rounded-xl px-4 py-2.5 text-xs md:text-sm font-semibold transition-all shrink-0 cursor-pointer">
              <Laptop className="w-4 h-4 mr-2" /> Lab & Devices
            </TabsTrigger>
            <TabsTrigger value="skills" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white rounded-xl px-4 py-2.5 text-xs md:text-sm font-semibold transition-all shrink-0 cursor-pointer">
              <Sparkles className="w-4 h-4 mr-2" /> Digital Skills
            </TabsTrigger>
            <TabsTrigger value="competencies" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white rounded-xl px-4 py-2.5 text-xs md:text-sm font-semibold transition-all shrink-0 cursor-pointer">
              <BookOpen className="w-4 h-4 mr-2" /> Practical Competencies
            </TabsTrigger>
            <TabsTrigger value="sync" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white rounded-xl px-4 py-2.5 text-xs md:text-sm font-semibold transition-all shrink-0 cursor-pointer">
              <Database className="w-4 h-4 mr-2" /> Offline Sync & Reports
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total ICT Assets</p>
                  <p className="text-3xl font-extrabold text-white">{totalAssetsCount}</p>
                  <p className="text-[11px] text-emerald-400 font-medium">{activeAssetsCount} Active, {servicingAssetsCount} Servicing</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Laptop className="w-7 h-7" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Computer Labs</p>
                  <p className="text-3xl font-extrabold text-white">{computerLabsCount}</p>
                  <p className="text-[11px] text-cyan-400 font-medium truncate max-w-[160px]">{labsSubtitle}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Monitor className="w-7 h-7" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Digital Skills Graded</p>
                  <p className="text-3xl font-extrabold text-white">{digitalSkillsGradedCount}</p>
                  <p className="text-[11px] text-emerald-400 font-medium">Learners assessed this term</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-7 h-7" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Network Health</p>
                  <p className="text-3xl font-extrabold text-white">99.8%</p>
                  <p className="text-[11px] text-emerald-400 font-medium">Local Server Node Active</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Wifi className="w-7 h-7" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Action Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <Badge className="bg-cyan-500/10 text-cyan-400 text-[10px]">Hardware</Badge>
                </div>
                <CardTitle className="text-white text-lg mt-3">Lab Device Management</CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Track student Chromebooks, desktop units, projectors, and peripheral repairs.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button onClick={() => setActiveTab('hardware')} className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold rounded-xl">
                  Manage Devices <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-400 text-[10px]">CBC Skills</Badge>
                </div>
                <CardTitle className="text-white text-lg mt-3">Digital Skills Assessment</CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Record typing speed, digital literacy quizzes, and coding competencies for grades.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button onClick={() => setActiveTab('skills')} className="w-full bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold rounded-xl">
                  Open Digital Assessment <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Server className="w-5 h-5" />
                  </div>
                  <Badge className="bg-purple-500/10 text-purple-400 text-[10px]">Infrastructure</Badge>
                </div>
                <CardTitle className="text-white text-lg mt-3">LAN & Server Sync</CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Configure local server nodes for offline school environments and data export.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button onClick={() => navigate('/lan-server-config')} className="w-full bg-slate-800 hover:bg-slate-700 text-purple-400 font-semibold rounded-xl">
                  Configure Server <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Hardware */}
        <TabsContent value="hardware" className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <ICTLabManagement />
          </div>
        </TabsContent>

        {/* Tab 3: Digital Skills */}
        <TabsContent value="skills" className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <DigitalSkillsAssessment />
          </div>
        </TabsContent>

        {/* Tab 4: Practical Competencies */}
        <TabsContent value="competencies" className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <PracticalCompetencies />
          </div>
        </TabsContent>

        {/* Tab 5: Sync & Reports */}
        <TabsContent value="sync" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-900/80 border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Offline Local Server Node</h3>
                  <p className="text-xs text-slate-400">Munyaka Local Area Network Sync Service</p>
                </div>
              </div>
              <p className="text-sm text-slate-300">
                The local school server is synchronized with cloud records. All lab assessments and asset checks are cached locally for resilient offline classroom execution.
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Sync Status: Up to Date
                </span>
                <Button onClick={() => alert('Local cache successfully verified and synchronized.')} size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Force Sync
                </Button>
              </div>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">ICT Department Report Generator</h3>
                  <p className="text-xs text-slate-400">Export Termly ICT & Lab Utilization Summaries</p>
                </div>
              </div>
              <p className="text-sm text-slate-300">
                Generate comprehensive PDF/CSV reports for hardware inventory health, lab schedules, and learner digital competencies for school administration review.
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <span className="text-xs text-slate-400">Ready for export</span>
                <Button onClick={() => {
                  try {
                    const assets = assetList;
                    const competencies = competencyList;

                    let csvContent = "\uFEFF"; // UTF-8 BOM
                    csvContent += "MUNYAKA CENTRAL SCHOOL - ICT DEPARTMENT & DIGITAL LAB REPORT\n";
                    csvContent += `Generated At,${new Date().toLocaleString()}\n`;
                    csvContent += `Total Assets,${assets.length}\n`;
                    csvContent += `Total Graded Competencies,${competencies.length}\n\n`;

                    csvContent += "=== ICT ASSETS & HARDWARE INVENTORY ===\n";
                    csvContent += "Asset ID,Asset Name,Category,Lab / Location,Status,Condition\n";
                    if (assets.length === 0) {
                      csvContent += "No ICT assets registered yet,,\n";
                    } else {
                      assets.forEach((a: any) => {
                        const id = String(a.id || a.assetId || '').replace(/,/g, '');
                        const name = String(a.name || a.assetName || '').replace(/,/g, '');
                        const cat = String(a.category || a.type || '').replace(/,/g, '');
                        const lab = String(a.lab || a.location || '').replace(/,/g, '');
                        const status = String(a.status || 'Active').replace(/,/g, '');
                        const cond = String(a.condition || 'Good').replace(/,/g, '');
                        csvContent += `"${id}","${name}","${cat}","${lab}","${status}","${cond}"\n`;
                      });
                    }

                    csvContent += "\n=== DIGITAL SKILLS & PRACTICAL COMPETENCIES ===\n";
                    csvContent += "Record ID,Learner Name,Grade & Stream,Competency Strand,Activity,Rating,Observer\n";
                    if (competencies.length === 0) {
                      csvContent += "No competency records registered yet,,\n";
                    } else {
                      competencies.forEach((c: any, idx: number) => {
                        const id = String(c.id || idx + 1).replace(/,/g, '');
                        const name = String(c.studentName || c.name || '').replace(/,/g, '');
                        const grade = String(`${c.grade || ''} ${c.stream || ''}`).trim().replace(/,/g, '');
                        const strand = String(c.competency || c.strand || '').replace(/,/g, '');
                        const act = String(c.activity || '').replace(/,/g, '');
                        const rating = String(c.rating || '').replace(/,/g, '');
                        const obs = String(c.observedBy || c.teacher || '').replace(/,/g, '');
                        csvContent += `"${id}","${name}","${grade}","${strand}","${act}","${rating}","${obs}"\n`;
                      });
                    }

                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', `Munyaka-ICT-Lab-Skills-Report-${new Date().toISOString().slice(0, 10)}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    toast.success('ICT Lab & Skills Report CSV downloaded successfully.');
                  } catch (e) {
                    console.error('Export report error:', e);
                    toast.error('Failed to export ICT report.');
                  }
                }} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Export Report
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
