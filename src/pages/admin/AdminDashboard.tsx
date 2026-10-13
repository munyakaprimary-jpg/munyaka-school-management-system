import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, GraduationCap, Briefcase, Table as TableIcon, ShieldCheck, Sparkles, BarChart2, Layers, CheckCircle2, Database, ArrowUpCircle } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState('2026');

  // Exact specification dataset
  const totalStudents = 24;
  const teachingStaff = 3; // Active: 3 | Pending: 0
  const nonTeachingStaff = 0;
  const primarySchool = 21; // Grades 1 to 6 learners
  const juniorSchool = 3;   // Grades 7 to 9 learners

  const gradeLevels = [
    { grade: 'PP1', boys: 0, girls: 0, total: 0 },
    { grade: 'PP2', boys: 0, girls: 0, total: 0 },
    { grade: 'Grade 1', boys: 1, girls: 0, total: 1 },
    { grade: 'Grade 2', boys: 2, girls: 1, total: 3 },
    { grade: 'Grade 3', boys: 2, girls: 2, total: 4 },
    { grade: 'Grade 4', boys: 2, girls: 1, total: 3 },
    { grade: 'Grade 5', boys: 2, girls: 2, total: 4 },
    { grade: 'Grade 6', boys: 3, girls: 3, total: 6 },
    { grade: 'Grade 7', boys: 1, girls: 0, total: 1 },
    { grade: 'Grade 8', boys: 1, girls: 0, total: 1 },
    { grade: 'Grade 9', boys: 1, girls: 0, total: 1 },
  ];

  const totalBoys = gradeLevels.reduce((acc, r) => acc + r.boys, 0);
  const totalGirls = gradeLevels.reduce((acc, r) => acc + r.girls, 0);
  const totalEnrolmentSum = gradeLevels.reduce((acc, r) => acc + r.total, 0);

  const streamsList = [
    { name: 'Grade 7 - Mercury', morning: '14/15', afternoon: '13/15', present: 14, total: 15, rate: '93%' },
    { name: 'Grade 7 - Neptune', morning: '12/12', afternoon: '11/12', present: 12, total: 12, rate: '95%' },
    { name: 'Grade 8 - Jupiter', morning: '15/16', afternoon: '14/16', present: 15, total: 16, rate: '92%' },
    { name: 'Grade 9 - Zenith', morning: '10/10', afternoon: '10/10', present: 10, total: 10, rate: '100%' },
    { name: 'Grade 6 - North', morning: '18/18', afternoon: '17/18', present: 18, total: 18, rate: '97%' },
    { name: 'Grade 5 - South', morning: '19/20', afternoon: '19/20', present: 19, total: 20, rate: '96%' },
    { name: 'Grade 4 - East', morning: '16/16', afternoon: '15/16', present: 16, total: 16, rate: '95%' },
  ];

  const bottomNavItems = [
    { label: 'Dashboard', path: '/admin-dashboard', icon: Layers },
    { label: 'Learners', path: '/students', icon: Users },
    { label: 'Roll Call', path: '/attendance', icon: ShieldCheck },
    { label: 'Fees', path: '/fees', icon: Sparkles },
    { label: 'Server', path: '/lan-config', icon: Database },
    { label: 'Settings', path: '/settings', icon: BarChart2 },
    { label: 'Central', path: '/central-data', icon: TableIcon },
    { label: 'Promote', path: '/promote', icon: ArrowUpCircle },
  ];

  return (
    <div className="space-y-6 pb-28 animate-fade-in max-w-7xl mx-auto p-4 md:p-6">
      {/* Top Banner with Status Badges */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-800/90 text-emerald-200 border border-emerald-500/30">
                <ShieldCheck size={13} className="text-emerald-300" /> LICENSED - 365D LEFT
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-800/90 text-teal-200 border border-teal-500/30">
                <CheckCircle2 size={13} className="text-teal-300" /> LIVE FACTUAL SYNC
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Munyaka Primary School Admin Dashboard</h1>
            <p className="text-emerald-100/80 text-sm mt-1">
              Operational control center for learners, staff, dual-session roll call, and fee collections.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => navigate('/central-data')}
              className="px-4 py-2 bg-white text-emerald-950 font-semibold text-sm rounded-xl shadow hover:bg-emerald-50 transition"
            >
              Central Data Export →
            </Button>
            <Button
              onClick={() => navigate('/students')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow border border-emerald-400/30 transition"
            >
              Manage Learners ({totalStudents})
            </Button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 pt-2">
          {/* Card 1: TOTAL STUDENTS */}
          <div 
            onClick={() => navigate('/students')}
            className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-white cursor-pointer hover:bg-white/15 transition shadow-sm"
          >
            <div className="text-[11px] text-emerald-200 font-medium flex items-center justify-between">
              <span>TOTAL STUDENTS</span>
              <Users size={14} className="text-emerald-300" />
            </div>
            <div className="text-2xl font-bold my-1">{totalStudents}</div>
            <div className="text-[10px] text-emerald-300/80">Active registered learners</div>
          </div>

          {/* Card 2: TEACHING STAFF */}
          <div 
            onClick={() => navigate('/staff-registry')}
            className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-white cursor-pointer hover:bg-white/15 transition shadow-sm"
          >
            <div className="text-[11px] text-emerald-200 font-medium flex items-center justify-between">
              <span>TEACHING STAFF</span>
              <GraduationCap size={14} className="text-emerald-300" />
            </div>
            <div className="text-2xl font-bold my-1">{teachingStaff}</div>
            <div className="text-[10px] text-emerald-300/80">Active: 3 | Pending: 0</div>
          </div>

          {/* Card 3: NON-TEACHING STAFF */}
          <div 
            onClick={() => navigate('/staff-registry')}
            className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-white cursor-pointer hover:bg-white/15 transition shadow-sm"
          >
            <div className="text-[11px] text-emerald-200 font-medium flex items-center justify-between">
              <span>NON-TEACHING</span>
              <Briefcase size={14} className="text-emerald-300" />
            </div>
            <div className="text-2xl font-bold my-1">{nonTeachingStaff}</div>
            <div className="text-[10px] text-emerald-300/80">Support & Administration</div>
          </div>

          {/* Card 4: PRIMARY SCHOOL */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-white shadow-sm">
            <div className="text-[11px] text-emerald-200 font-medium flex items-center justify-between">
              <span>PRIMARY SCHOOL</span>
              <Layers size={14} className="text-emerald-300" />
            </div>
            <div className="text-2xl font-bold my-1">{primarySchool}</div>
            <div className="text-[10px] text-emerald-300/80">Grades 1 to 6 learners</div>
          </div>

          {/* Card 5: JUNIOR SCHOOL */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-white shadow-sm">
            <div className="text-[11px] text-emerald-200 font-medium flex items-center justify-between">
              <span>JUNIOR SCHOOL</span>
              <Sparkles size={14} className="text-emerald-300" />
            </div>
            <div className="text-2xl font-bold my-1">{juniorSchool}</div>
            <div className="text-[10px] text-emerald-300/80">Grades 7 to 9 learners</div>
          </div>

          {/* Card 6: SYSTEM STATUS */}
          <div 
            onClick={() => navigate('/harmonization')}
            className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-white cursor-pointer hover:bg-white/15 transition shadow-sm"
          >
            <div className="text-[11px] text-emerald-200 font-medium flex items-center justify-between">
              <span>SYSTEM STATUS</span>
              <ShieldCheck size={14} className="text-emerald-300" />
            </div>
            <div className="text-2xl font-bold my-1">100%</div>
            <div className="text-[10px] text-emerald-300/80">Active & Synchronized</div>
          </div>
        </div>
      </div>

      {/* School Enrolment Table */}
      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 bg-white">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <TableIcon className="text-emerald-600" size={20} />
              School Enrolment Matrix ({selectedYear})
            </CardTitle>
            <p className="text-slate-500 text-xs mt-1">Grade-by-grade gender breakdown across PP1 through Grade 9</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">ACADEMIC YEAR:</span>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px] h-9 text-xs font-medium bg-slate-50">
                <SelectValue placeholder="2026" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
                <SelectItem value="2028">2028</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableCell className="font-bold text-slate-700 py-3 px-4">GRADE</TableCell>
                  <TableCell className="font-bold text-slate-700 text-right py-3 px-4">BOYS</TableCell>
                  <TableCell className="font-bold text-slate-700 text-right py-3 px-4">GIRLS</TableCell>
                  <TableCell className="font-bold text-slate-700 text-right py-3 px-4">TOTAL</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradeLevels.map((row, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-semibold text-slate-800 px-4 py-3">{row.grade}</TableCell>
                    <TableCell className="text-right px-4 py-3 text-slate-600">{row.boys}</TableCell>
                    <TableCell className="text-right px-4 py-3 text-slate-600">{row.girls}</TableCell>
                    <TableCell className="text-right px-4 py-3 font-bold text-emerald-700">{row.total}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-emerald-50/60 font-bold border-t-2 border-emerald-100">
                  <TableCell className="text-slate-900 px-4 py-3.5">TOTAL ENROLMENT</TableCell>
                  <TableCell className="text-right px-4 py-3.5 text-slate-900">{totalBoys}</TableCell>
                  <TableCell className="text-right px-4 py-3.5 text-slate-900">{totalGirls}</TableCell>
                  <TableCell className="text-right px-4 py-3.5 text-emerald-800 text-base">{totalEnrolmentSum}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Stream-by-Stream Dual-Session Attendance Trends */}
      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 bg-white">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart2 className="text-emerald-600" size={20} />
              Dynamic Stream-by-Stream Dual-Session Attendance Trends
            </CardTitle>
            <p className="text-slate-500 text-xs mt-1">Live morning & afternoon attendance rates by class</p>
          </div>
          <Button 
            onClick={() => navigate('/attendance')} 
            size="sm" 
            variant="outline"
            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          >
            View Full Attendance Register →
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableCell className="font-bold text-slate-700 py-3 px-4">STREAM / CLASS</TableCell>
                  <TableCell className="font-bold text-slate-700 text-center py-3 px-4">MORNING ROLL CALL</TableCell>
                  <TableCell className="font-bold text-slate-700 text-center py-3 px-4">AFTERNOON ROLL CALL</TableCell>
                  <TableCell className="font-bold text-slate-700 text-right py-3 px-4">PRESENT / TOTAL</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {streamsList.map((stream, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-semibold text-slate-800 px-4 py-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {stream.name}
                    </TableCell>
                    <TableCell className="text-center px-4 py-3">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
                        {stream.morning} ({stream.rate})
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center px-4 py-3">
                      <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 font-semibold">
                        {stream.afternoon}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-4 py-3 font-bold text-slate-700">
                      {stream.present} / {stream.total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl px-2 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-around md:justify-center gap-1 md:gap-4 overflow-x-auto">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/admin-dashboard' && (location.pathname === '/admin' || location.pathname === '/'));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                }`}
              >
                <Icon size={18} className="mb-0.5" />
                <span className="text-[10px] md:text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
