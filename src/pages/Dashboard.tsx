import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, GraduationCap, Clock, TrendingUp } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ATTENDANCE_TREND } from '@/lib/mock-data';

const Dashboard = () => {
  const stats = [
    { title: "Total Students", value: "482", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Today's Attendance", value: "94%", icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
    { title: "Junior School", value: "156", icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Avg. Marking Time", value: "8:15 AM", icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const classes = [
    { name: "Grade 1", stream: "Blue", students: 42, attendance: "98%" },
    { name: "Grade 4", stream: "Green", students: 38, attendance: "92%" },
    { name: "Grade 7", stream: "Alpha", students: 45, attendance: "95%" },
    { name: "Grade 8", stream: "Beta", students: 31, attendance: "89%" },
  ];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">System vitals for Munyaka Primary and Junior School.</p>
        </div>
        <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2 w-fit">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live Sync Enabled</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl hover:translate-y-[-2px] transition-transform">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`${stat.bg} p-3 rounded-xl shrink-0`}>
                <stat.icon className={stat.color} size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-xl font-bold text-slate-900 leading-tight mt-0.5">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold">Attendance Trends (Weekly)</CardTitle>
            <Badge variant="outline" className="rounded-lg text-emerald-600 bg-emerald-50 border-emerald-100 text-[10px] px-2 py-0.5">
              <TrendingUp size={12} className="mr-1" /> Healthy
            </Badge>
          </CardHeader>
          <CardContent className="h-[220px] w-full p-4 pt-2">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ATTENDANCE_TREND}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px'}}
                />
                <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
                  {ATTENDANCE_TREND.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.rate > 92 ? '#6366f1' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-bold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {[
                { time: "Just now", msg: "Grade 4 marks updated", type: "assess", color: "bg-blue-500" },
                { time: "10m ago", msg: "New student registered", type: "reg", color: "bg-emerald-500" },
                { time: "1h ago", msg: "Attendance marked: Grade 8", type: "attn", color: "bg-purple-500" },
                { time: "3h ago", msg: "Fee payment: #2389", type: "fee", color: "bg-orange-500" },
              ].map((act, i) => (
                <div key={i} className="flex gap-3 relative">
                  {i !== 3 && <div className="absolute left-1.5 top-4 bottom-[-16px] w-[1px] bg-slate-100" />}
                  <div className={`w-2.5 h-2.5 mt-1 rounded-full ${act.color} shrink-0 ring-4 ring-white shadow-sm z-10`} />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{act.msg}</p>
                    <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground mt-0.5">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-sm font-bold">Active Class Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-500 bg-slate-50/50 border-b">
                <tr>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px]">Class Name</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px]">Stream</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px]">Enrollment</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px] text-right">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {classes.map((cls, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{cls.name}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{cls.stream}</td>
                    <td className="px-5 py-3.5 text-slate-600">{cls.students} Learners</td>
                    <td className="px-5 py-3.5 text-right">
                      <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-[10px] px-2 py-0.5">
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