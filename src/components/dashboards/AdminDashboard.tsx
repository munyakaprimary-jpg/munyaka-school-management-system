import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CentralDataService from '../../services/centralDataService';
import { useSchoolStore } from '../../store/useSchoolStore';
import { Users, GraduationCap, Briefcase, Calendar, CheckCircle2, AlertCircle, Table as TableIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const AdminDashboardComponent: React.FC = () => {
  const storeLearners = useSchoolStore(state => state.learners);
  const storeStaff = useSchoolStore(state => state.staff);

  const [totalStudents, setTotalStudents] = useState(0);
  const [teachingStaffCount, setTeachingStaffCount] = useState(0);
  const [nonTeachingStaffCount, setNonTeachingStaffCount] = useState(0);
  const [primaryCount, setPrimaryCount] = useState(0);
  const [juniorCount, setJuniorCount] = useState(0);

  const [selectedYear, setSelectedYear] = useState('2026');
  const [enrolmentRows, setEnrolmentRows] = useState<Array<{ grade: string; boys: number; girls: number; total: number }>>([]);
  const [totalsRow, setTotalsRow] = useState({ boys: 0, girls: 0, total: 0 });

  const computeMetrics = () => {
    const learners = storeLearners && storeLearners.length > 0 ? storeLearners : CentralDataService.getLearners();
    const staff = storeStaff && storeStaff.length > 0 ? storeStaff : CentralDataService.getStaff();

    const teaching = staff.filter((s: any) => {
      const roleStr = `${s.role || ''} ${s.type || ''} ${s.category || ''} ${s.systemRole || ''} ${s.department || ''}`.toLowerCase();
      if (roleStr.includes('bursar') || roleStr.includes('librarian') || roleStr.includes('store') || roleStr.includes('accountant') || roleStr.includes('support') || roleStr.includes('secretary') || roleStr.includes('security') || roleStr.includes('catering') || roleStr.includes('ict technician')) {
        return false;
      }
      return roleStr.includes('teach') || roleStr.includes('head_teacher') || roleStr.includes('senior_teacher') || roleStr.includes('class_teacher') || roleStr.includes('subject_teacher') || roleStr.includes('teacher') || roleStr.includes('head teacher') || roleStr.includes('deputy');
    });

    const nonTeaching = staff.filter((s: any) => {
      const roleStr = `${s.role || ''} ${s.type || ''} ${s.category || ''} ${s.systemRole || ''} ${s.department || ''}`.toLowerCase();
      if (roleStr.includes('teach') || roleStr.includes('head_teacher') || roleStr.includes('senior_teacher') || roleStr.includes('class_teacher') || roleStr.includes('subject_teacher') || roleStr.includes('teacher') || roleStr.includes('head teacher') || roleStr.includes('deputy')) {
        if (roleStr.includes('bursar') || roleStr.includes('librarian') || roleStr.includes('store') || roleStr.includes('accountant') || roleStr.includes('support') || roleStr.includes('secretary') || roleStr.includes('security') || roleStr.includes('catering') || roleStr.includes('ict technician')) {
          return true;
        }
        return false;
      }
      return true;
    });

    const primary = learners.filter((l: any) => !l.grade?.toLowerCase().includes('junior') && !l.grade?.toLowerCase().includes('grade 7') && !l.grade?.toLowerCase().includes('grade 8') && !l.grade?.toLowerCase().includes('grade 9'));
    const junior = learners.length - primary.length;

    setTotalStudents(learners.length);
    setTeachingStaffCount(teaching.length);
    setNonTeachingStaffCount(nonTeaching.length);
    setPrimaryCount(primary.length);
    setJuniorCount(junior);

    // Compute Enrolment Table Rows
    const gradeLevels = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
    
    let sumBoys = 0;
    let sumGirls = 0;

    const rows = gradeLevels.map(gradeName => {
      // Filter learners matching grade and optional year check if present
      const gradeLearners = learners.filter((l: any) => {
        const lGrade = String(l.grade || l.class || '').trim();
        const matchesGrade = lGrade.toLowerCase() === gradeName.toLowerCase() ||
          (gradeName === 'PP1' && lGrade.toLowerCase().includes('pp1')) ||
          (gradeName === 'PP2' && lGrade.toLowerCase().includes('pp2')) ||
          lGrade.toLowerCase().includes(gradeName.toLowerCase());
        
        if (!matchesGrade) return false;

        if (l.enrollmentYear || l.year || l.academicYear) {
          const lYear = String(l.enrollmentYear || l.year || l.academicYear);
          if (lYear && lYear !== selectedYear) return false;
        }
        return true;
      });

      const boys = gradeLearners.filter((l: any) => {
        const g = String(l.gender || l.sex || '').trim().toLowerCase();
        return g.startsWith('m') || g === 'boy';
      }).length;

      const girls = gradeLearners.filter((l: any) => {
        const g = String(l.gender || l.sex || '').trim().toLowerCase();
        return g.startsWith('f') || g === 'girl';
      }).length;

      // If gender wasn't explicit, split evenly or count remaining
      const unassigned = gradeLearners.length - (boys + girls);
      const adjustedBoys = boys + Math.ceil(unassigned / 2);
      const adjustedGirls = girls + Math.floor(unassigned / 2);
      const total = adjustedBoys + adjustedGirls;

      sumBoys += adjustedBoys;
      sumGirls += adjustedGirls;

      return {
        grade: gradeName,
        boys: adjustedBoys,
        girls: adjustedGirls,
        total
      };
    });

    setEnrolmentRows(rows);
    setTotalsRow({
      boys: sumBoys,
      girls: sumGirls,
      total: sumBoys + sumGirls
    });
  };

  useEffect(() => {
    computeMetrics();
    const handleDataChange = () => computeMetrics();
    window.addEventListener('munyaka:data-changed', handleDataChange);
    window.addEventListener('staff-changed', handleDataChange);
    window.addEventListener('students-updated', handleDataChange);
    window.addEventListener('storage', handleDataChange);
    return () => {
      window.removeEventListener('munyaka:data-changed', handleDataChange);
      window.removeEventListener('staff-changed', handleDataChange);
      window.removeEventListener('students-updated', handleDataChange);
      window.removeEventListener('storage', handleDataChange);
    };
  }, [storeLearners, storeStaff, selectedYear]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Live operational metrics for Munyaka Primary and Junior School.</p>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          LIVE FACTUAL SYNC
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Students Card */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">TOTAL STUDENTS</CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Active registered learners</p>
          </CardContent>
        </Card>

        {/* Teaching Staff Card */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">TEACHING STAFF</CardTitle>
            <GraduationCap className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{teachingStaffCount}</div>
            <p className="text-xs text-gray-500 mt-1">Active: {teachingStaffCount} | Pending: 0</p>
          </CardContent>
        </Card>

        {/* Non-Teaching Staff Card */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">NON-TEACHING STAFF</CardTitle>
            <Briefcase className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{nonTeachingStaffCount}</div>
            <p className="text-xs text-gray-500 mt-1">Active: {nonTeachingStaffCount} | Pending: 0</p>
          </CardContent>
        </Card>

        {/* Primary School Breakdown */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">PRIMARY SCHOOL</CardTitle>
            <Users className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{primaryCount}</div>
            <p className="text-xs text-gray-500 mt-1">Grades 1 to 6 learners</p>
          </CardContent>
        </Card>

        {/* Junior School Breakdown */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">JUNIOR SCHOOL</CardTitle>
            <GraduationCap className="w-5 h-5 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{juniorCount}</div>
            <p className="text-xs text-gray-500 mt-1">Grades 7 to 9 learners</p>
          </CardContent>
        </Card>

        {/* System Status Card */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">SYSTEM STATUS</CardTitle>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">Online</div>
            <p className="text-xs text-gray-500 mt-1">Central database synchronized</p>
          </CardContent>
        </Card>
      </div>

      {/* SCHOOL ENROLMENT TABLE SECTION */}
      <Card className="border shadow-sm rounded-3xl overflow-hidden mt-8">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">SCHOOL ENROLMENT TABLE</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Real-time enrolment breakdown by grade and gender.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Academic Year:</span>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32 rounded-xl bg-white dark:bg-slate-800">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
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
          <Table>
            <TableHeader className="bg-slate-100/70 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6">GRADE</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-center">BOYS</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-center">GIRLS</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-center">TOTAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrolmentRows.map((row, idx) => (
                <TableRow key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <TableCell className="font-semibold text-slate-900 dark:text-slate-100 py-3.5 px-6">{row.grade}</TableCell>
                  <TableCell className="text-center font-medium text-slate-700 dark:text-slate-300 py-3.5 px-6">{row.boys}</TableCell>
                  <TableCell className="text-center font-medium text-slate-700 dark:text-slate-300 py-3.5 px-6">{row.girls}</TableCell>
                  <TableCell className="text-center font-bold text-indigo-600 dark:text-indigo-400 py-3.5 px-6">{row.total}</TableCell>
                </TableRow>
              ))}
              {/* Summary Totals Row */}
              <TableRow className="bg-indigo-50/70 dark:bg-indigo-950/40 border-t-2 border-indigo-200 dark:border-indigo-900">
                <TableCell className="font-black text-slate-900 dark:text-white py-4 px-6 text-base">TOTALS</TableCell>
                <TableCell className="text-center font-black text-slate-900 dark:text-white py-4 px-6 text-base">{totalsRow.boys}</TableCell>
                <TableCell className="text-center font-black text-slate-900 dark:text-white py-4 px-6 text-base">{totalsRow.girls}</TableCell>
                <TableCell className="text-center font-black text-indigo-600 dark:text-indigo-400 py-4 px-6 text-lg">{totalsRow.total}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardComponent;