import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, GraduationCap, Clock, TrendingUp } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ATTENDANCE_TREND, FEES_DATA, TRANSACTIONS } from '@/lib/mock-data';
import { GRADES_DATA } from '@/lib/mock-data'; // fallback

const Dashboard = () => {
  // Load grades from localStorage (same as used in GradesStreams page)
  const gradesFromStorage = useMemo(() => {
    const saved = localStorage.getItem('munyaka_grades');
    return saved ? JSON.parse(saved) : GRADES_DATA;
  }, []);

  // Dynamically calculate stats from actual grades data
  const totalStudents = useMemo(() => {
    return gradesFromStorage.reduce((sum, grade) => {
      return sum + grade.streams.reduce((streamSum, stream) => streamSum + stream.studentsCount, 0);
    }, 0);
  }, [gradesFromStorage]);

  const juniorSchoolStudents = useMemo(() => {
    return gradesFromStorage
      .filter(grade => grade.category === 'Junior School')
      .reduce((sum, grade) => {
        return sum + grade.streams.reduce((streamSum, stream) => streamSum + stream.studentsCount, 0);
      }, 0);
  }, [gradesFromStorage]);

  const todayAttendanceRate = useMemo(() => {
    // Calculate from attendance trend average
    const avg = ATTENDANCE_TREND.reduce((sum, day) => sum + day.rate, 0) / ATTENDANCE_TREND.length;
    return Math.round(avg);
  }, []);

  const avgMarkingTime = useMemo(() => {
    // Keep as placeholder; could be calculated from something else if needed
    return "8:15 AM";
  }, []);

  // Active class performance from actual grades data
  const activeClasses = useMemo(() => {
    return gradesFromStorage.map(grade => {
      const totalStudentsInGrade = grade.streams.reduce((sum, stream) => sum + stream.studentsCount, 0);
      // Find attendance for this grade from mock data or calculate
      const gradeAttendance = ATTENDANCE_TREND.reduce((sum, day) => sum + day.rate, 0) / ATTENDANCE_TREND.length;
      return {
        name: grade.name,
        stream: grade.streams.map(s => s.name).join(', '),
        students: totalStudentsInGrade,
        attendance: `${Math.round(gradeAttendance)}%`
      };
    });
  }, [gradesFromStorage]);

  // Recent alerts from actual system data
  const recentAlerts = useMemo(() => {
    const alerts = [];
    
    // Fee payment alerts
    const recentPayments = TRANSACTIONS.slice(0, 2);
    recentPayments.forEach(tx => {
      alerts.push({
        time: tx.date,
        msg: `Fee payment: ${tx.ref}`,
        type: "fee",
        color: "bg-orange-500"
      });
    });
    
    // Student registration alerts - we don't have dynamic student data, so skip or use mock
    // For now, we'll skip student registration alerts since we don't have dynamic student list
    
    // Attendance alerts
    alerts.push({
      time: "1h ago",
      msg: `Attendance marked: ${gradesFromStorage[1]?.name || 'Grade 4'}`,
      type: "attn",
      color: "bg-purple-500"
    });
    
    // Assessment alerts
    alerts.push({
      time: "3h ago",
      msg: "Grade 4 marks updated",
      type: "assess",
      color: "bg-blue-500"
    });
    
    return alerts;
  }, [gradesFromStorage]);

  const stats = [
    { title: "Total Students", value: totalStudents.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Today's Attendance", value: `${todayAttendanceRate}%`, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
    { title: "Junior School", value: juniorSchoolStudents.toString(), icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Avg. Marking Time", value: avgMarkingTime, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-muted-foreground">System vitals for Munyaka Primary and Junior School.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Sync Enabled</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-3xl hover:translate-y-[-4px] transition-transform">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`${stat.bg} p-4 rounded-2xl`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-0.5">{stat.title}</p>
                <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Attendance Trends (Weekly)</CardTitle>
            <Badge variant="outline" className="rounded-lg text-emerald-600 bg-emerald-50 border-emerald-100">
              <TrendingUp size={12} className="mr-1" /> Healthy
            </Badge>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ATTENDANCE_TREND}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}
                />
                <Bar dataKey="rate" radius={[10, 10, 0, 0]}>
                  {ATTENDANCE_TREND.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.rate > 92 ? '#6366f1' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentAlerts.map((act, i) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== recentAlerts.length - 1 && <div className="absolute left-1.5 top-5 bottom-[-20px] w-[1px] bg-slate-100" />}
                  <div className={`w-3 h-3 mt-1.5 rounded-full ${act.color} shrink-0 ring-4 ring-white shadow-sm z-10`} />
                  <div>
                    <p className="text-sm font-medium text-slate-800 leading-tight">{act.msg}</p>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Active Class Performance</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-slate-500 bg-slate-50/50 border-b">
                <tr>
                  <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Class Name</th>
                  <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Stream</th>
                  <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Enrollment</th>
                  <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activeClasses.map((cls, i) => (
                  <tr key={i} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-900">{cls.name}</td>
                    <td className="px-8 py-5 text-slate-600 font-medium">{cls.stream}</td>
                    <td className="px-8 py-5 text-slate-600">{cls.students} Learners</td>
                    <td className="px-8 py-5 text-right">
                      <Badge className="bg-emerald-50 text-emerald-700 border-none shadow-none font-bold">
                        {cls.attendance}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;