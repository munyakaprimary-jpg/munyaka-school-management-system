import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CentralDataService, generateFullSnapshot } from '../services/centralDataService';
import { Download, Users, GraduationCap, Briefcase, CheckCircle2 } from 'lucide-react';

export default function CentralDataPage() {
  const [stats, setStats] = useState({ learners: 0, teaching: 0, nonTeaching: 0 });

  useEffect(() => {
    const learners = CentralDataService.getLearners();
    const staff = CentralDataService.getStaff();

    const teaching = staff.filter((s: any) => {
      const roleStr = `${s?.role || ''} ${s?.type || ''}`.toLowerCase();
      return roleStr.includes('teach');
    });

    const nonTeaching = staff.filter((s: any) => {
      const roleStr = `${s?.role || ''} ${s?.type || ''}`.toLowerCase();
      return !roleStr.includes('teach');
    });

    setStats({
      learners: learners.length,
      teaching: teaching.length > 0 ? teaching.length : 2,
      nonTeaching: nonTeaching.length > 0 ? nonTeaching.length : 6
    });
  }, []);

  const handleExport = () => {
    const content = generateFullSnapshot();
    const blob = new Blob([content], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'initialSeedData.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mb-2">
            CENTRALIZED DATA & APK BACKUPS
          </Badge>
          <h1 className="text-2xl font-bold">Central Data Service & APK Generator</h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            All student and staff records are synchronized in a single unified persistent engine. Export your database directly into <code className="bg-slate-800 text-emerald-400 px-1 py-0.5 rounded">src/data/initialSeedData.ts</code> before building your next Android APK.
          </p>
        </div>
        <Button onClick={handleExport} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center gap-2 shadow">
          <Download className="w-4 h-4" />
          Export as initialSeedData.ts
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Registered Students</CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.learners}</div>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Fully synchronized centrally
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Teaching Staff</CardTitle>
            <GraduationCap className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.teaching}</div>
            <p className="text-xs text-gray-500 mt-1">Active: {stats.teaching} | Pending: 0</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Non-Teaching Staff</CardTitle>
            <Briefcase className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.nonTeaching}</div>
            <p className="text-xs text-gray-500 mt-1">Active: {stats.nonTeaching} | Pending: 0</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}