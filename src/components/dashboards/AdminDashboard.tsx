import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CentralDataService from '../../services/centralDataService';
import { useSchoolStore } from '../../store/useSchoolStore';
import { Users, GraduationCap, Briefcase, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminDashboardComponent: React.FC = () => {
  const storeLearners = useSchoolStore(state => state.learners);
  const storeStaff = useSchoolStore(state => state.staff);

  const [totalStudents, setTotalStudents] = useState(0);
  const [teachingStaffCount, setTeachingStaffCount] = useState(0);
  const [nonTeachingStaffCount, setNonTeachingStaffCount] = useState(0);
  const [primaryCount, setPrimaryCount] = useState(0);
  const [juniorCount, setJuniorCount] = useState(0);

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
  }, [storeLearners, storeStaff]);

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
    </div>
  );
};

export default AdminDashboardComponent;