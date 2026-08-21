import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, GraduationCap, Clock, TrendingUp, User } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { STUDENTS, ATTENDANCE_TREND, TRANSACTIONS, GRADES_DATA, STAFF } from '@/lib/mock-data';

const Dashboard = () => {
  // 1. Calculate factual Attendance Rate for "Today"
  const factualAttendanceData = useMemo(() => {
    const STORAGE_KEY_PREFIX = 'munyaka_attendance_v2_';
    let totalPossibleStudents = 0;
    let totalPresentStudents = 0;

    // Aggregate data across all grades
    GRADES_DATA.forEach(grade => {
      const savedData = localStorage.getItem(`${STORAGE_KEY_PREFIX}${grade.id}`);
      const gradeNum = grade.name.replace(/[^0-9]/g, '');
      const learners = STUDENTS.filter(s => s.grade === gradeNum || s.grade === grade.name);
      
      totalPossibleStudents += learners.length;

      if (savedData) {
        try {
          const attendanceRecord = JSON.parse(savedData);
          learners.forEach(learner => {
            const record = attendanceRecord[learner.id];
            // Count as "Present" if they are marked P or L in either session
            const isPresentMorning = record?.morning?.status === 'P' || record?.morning?.status === 'L';
            const isPresentAfternoon = record?.afternoon?.status === 'P' || record?.afternoon?.status === 'L';
            
            if (isPresentMorning || isPresentAfternoon) {
              totalPresentStudents += 1;
            }
          });
        } catch (e) {
          console.error("Error parsing attendance for grade", grade.id);
        }
      }
    });

    const factualRate = totalPossibleStudents > 0 
      ? Math.round((totalPresentStudents / totalPossibleStudents) * 100) 
      : 0;

    // Get current day name
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayName = dayNames[new Date().getDay()];

    // Merge factual "Today" rate into the trend chart
    return ATTENDANCE_TREND.map(item => {
      if (item.day === todayName) {
        return { ...item, rate: factualRate, isFactual: true };
      }
      return item;
    });
  }, []);

  const totalStudents = useMemo(() => STUDENTS.length, []);
  
  // Use factual rate for the current day from our memoized data
  const todayAttendanceRate = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayName = dayNames[new Date().getDay()];
    const todayData = factualAttendanceData.find(d => d.day === todayName);
    return todayData ? todayData.rate : null;
  }, [factualAttendanceData]);
  
  const juniorSchoolStudents = useMemo(() => {
    return STUDENTS.filter(s => parseInt(s.grade) >= 7).length;
  }, []);
  
  const totalTeachers = useMemo(() => {
    return STAFF.filter(s => s.role.includes('Teacher')).length;
  }, []);

  const recentAlerts = useMemo(() => {
    const alerts = [];
    const recentPayments = TRANSACTIONS.slice(0, 2);
    recentPayments.forEach(tx => {
      alerts.push({ time: tx.date, msg: `Fee payment: ${tx.ref}`, type: "fee", color: "bg-orange-500" });
    });
    const recentStudents = STUDENTS.slice(0, 1);
    recentStudents.forEach(student => {
      alerts.push({ time: "Just now", msg: `New student registered: ${student.name}`, type: "reg", color: "bg-emerald-500" });
    });
    alerts.push({ time: "1h ago", msg: `Attendance marked: ${GRADES_DATA[1]?.name || 'Grade 4'}`, type: "attn", color: "bg-purple-500" });
    return alerts;
  }, []);

  const stats = [
    { title: "Total Students", value: totalStudents.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Total Teachers", value: totalTeachers.toString(), icon: User, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Today's Attendance", value: todayAttendanceRate !== null ? `${todayAttendanceRate}%` : 'N/A', icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
    { title: "Junior School", value: juniorSchoolStudents.toString(), icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Avg. Marking Time", value: "8:15 AM", icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-muted-foreground">System vitals for Munyaka Primary and Junior School.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Factual Sync</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <TrendingUp size={12} className="mr-1" /> Real-time Data
            </Badge>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={factualAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis domain={[0, 100]} hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-50">
                          <p className="text-xs font-black text-slate-400 uppercase mb-1">{data.day}</p>
                          <p className="text-lg font-black text-indigo-600">{data.rate}% <span className="text-[10px] text-slate-400 font-bold ml-1">{data.isFactual ? '(Factual)' : '(Average)'}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="rate" radius={[10, 10, 0, 0]}>
                  {factualAttendanceData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.day === ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()] ? '#6366f1' : '#e2e8f0'} 
                    />
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
          <CardTitle className="text-lg">Factual Class Participation</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="relative w-full overflow-auto custom-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6366f1 #f1f5f9' }}>
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="text-slate-500 bg-slate-50/50 border-b sticky left-0">
                <tr>
                  <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px] sticky left-0 bg-slate-50/50 z-10">Class Name</th>
                  <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Enrollment</th>
                  <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Today's Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {GRADES_DATA.map((grade, i) => {
                  const learners = STUDENTS.filter(s => s.grade === grade.name.replace(/[^0-9]/g, '') || s.grade === grade.name);
                  const savedData = localStorage.getItem(`munyaka_attendance_v2_${grade.id}`);
                  let presentCount = 0;
                  if (savedData) {
                    const records = JSON.parse(savedData);
                    learners.forEach(l => {
                      if (records[l.id]?.morning?.status === 'P' || records[l.id]?.afternoon?.status === 'P') presentCount++;
                    });
                  }
                  
                  return (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-900">{grade.name}</td>
                      <td className="px-8 py-5 text-slate-600">{learners.length} Registered</td>
                      <td className="px-8 py-5 text-right">
                        <Badge className={presentCount > 0 ? "bg-emerald-50 text-emerald-700 border-none font-bold" : "bg-slate-50 text-slate-400 border-none font-bold"}>
                          {presentCount} Present
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;