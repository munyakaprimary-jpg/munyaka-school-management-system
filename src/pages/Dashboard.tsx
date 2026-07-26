import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, GraduationCap, Clock } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome to Munyaka Primary and Junior School management system.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`${stat.bg} p-3 rounded-2xl`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl bg-white">
          <CardHeader>
            <CardTitle>Active Class Lists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-muted-foreground border-b">
                  <tr>
                    <th className="pb-3 font-medium">Class Name</th>
                    <th className="pb-3 font-medium">Stream</th>
                    <th className="pb-3 font-medium">No. of Students</th>
                    <th className="pb-3 font-medium">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {classes.map((cls, i) => (
                    <tr key={i} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 font-medium">{cls.name}</td>
                      <td className="py-4">{cls.stream}</td>
                      <td className="py-4">{cls.students}</td>
                      <td className="py-4">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
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

        <Card className="border-none shadow-sm rounded-2xl bg-white">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { time: "Just now", msg: "Grade 4 marks updated", type: "assess" },
                { time: "10m ago", msg: "New student registered", type: "reg" },
                { time: "1h ago", msg: "Attendance marked: Grade 8", type: "attn" },
              ].map((act, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                  <div>
                    <p className="text-sm">{act.msg}</p>
                    <p className="text-xs text-muted-foreground">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;