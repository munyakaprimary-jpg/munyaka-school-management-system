import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, GraduationCap, Clock, TrendingUp, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDashboard } from '@/hooks/useDashboard';
import { 
  MetricCardSkeleton, 
  ChartSkeleton, 
  TableSkeleton, 
  AlertItemSkeleton 
} from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const Dashboard = () => {
  const { metrics, isLoading, error, lastSync, isLive, refresh } = useDashboard();

  // 1. Metric Summary Cards Data
  const stats = useMemo(() => [
    { 
      title: "Total Students", 
      value: metrics?.totalStudents?.toLocaleString() ?? '—', 
      icon: Users, 
      color: "text-blue-600", 
      bg: "bg-blue-50",
      loading: isLoading
    },
    { 
      title: "Total Teachers", 
      value: metrics?.totalTeachers?.toLocaleString() ?? '—', 
      icon: User, 
      color: "text-indigo-600", 
      bg: "bg-indigo-50",
      loading: isLoading
    },
    { 
      title: "Today's Attendance", 
      value: metrics?.todaysAttendanceRate !== null && metrics?.todaysAttendanceRate !== undefined 
        ? `${metrics.todaysAttendanceRate}%` 
        : 'N/A', 
      icon: UserCheck, 
      color: "text-green-600", 
      bg: "bg-green-50",
      loading: isLoading
    },
    { 
      title: "Junior School", 
      value: metrics?.classParticipation
        ?.filter(c => c.className.includes('Grade 7') || c.className.includes('Grade 8') || c.className.includes('Grade 9'))
        .reduce((sum, c) => sum + c.enrolled, 0)
        .toLocaleString() ?? '—', 
      icon: GraduationCap, 
      color: "text-purple-600", 
      bg: "bg-purple-50",
      loading: isLoading
    },
    { 
      title: "Avg. Marking Time", 
      value: "8:15 AM", 
      icon: Clock, 
      color: "text-orange-600", 
      bg: "bg-orange-50",
      loading: false
    },
  ], [metrics, isLoading]);

  // 2. Attendance Trends Chart Data
  const chartData = useMemo(() => {
    if (!metrics?.attendanceTrend || metrics.attendanceTrend.length === 0) {
      return [
        { day: 'Mon', rate: 0, isFactual: false },
        { day: 'Tue', rate: 0, isFactual: false },
        { day: 'Wed', rate: 0, isFactual: false },
        { day: 'Thu', rate: 0, isFactual: false },
        { day: 'Fri', rate: 0, isFactual: false },
      ];
    }
    return metrics.attendanceTrend;
  }, [metrics?.attendanceTrend]);

  // 3. Factual Class Participation Table Data
  const classTableData = useMemo(() => {
    if (!metrics?.classParticipation || metrics.classParticipation.length === 0) {
      return [];
    }
    return metrics.classParticipation.map((cls, index) => ({
      ...cls,
      rank: index + 1
    }));
  }, [metrics?.classParticipation]);

  // 4. Recent Alerts
  const recentAlerts = useMemo(() => {
    if (!metrics?.recentAlerts || metrics.recentAlerts.length === 0) {
      return [{
        time: "—",
        msg: "No recent activity",
        type: "system",
        color: "bg-slate-500"
      }];
    }
    return metrics.recentAlerts;
  }, [metrics?.recentAlerts]);

  const renderStatCard = ({ title, value, icon: Icon, color, bg, loading }: typeof stats[0]) => {
    if (loading) {
      return <MetricCardSkeleton />;
    }
    return (
      <Card className="border-none shadow-sm bg-white rounded-3xl hover:translate-y-[-4px] transition-transform">
        <CardContent className="p-6 flex items-center gap-4">
          <div className={`${bg} p-4 rounded-2xl`}>
            <Icon className={color} size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-0.5">{title}</p>
            <h3 className="text-2xl font-black text-slate-900">{value}</h3>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAlertItem = (act: typeof recentAlerts[0], index: number) => {
    if (isLoading) {
      return <AlertItemSkeleton key={index} />;
    }
    return (
      <div key={index} className="flex gap-4 relative">
        {index !== recentAlerts.length - 1 && (
          <div className="absolute left-1.5 top-5 bottom-[-20px] w-[1px] bg-slate-100" />
        )}
        <div className={`w-3 h-3 mt-1.5 rounded-full ${act.color} shrink-0 ring-4 ring-white shadow-sm z-10`} />
        <div>
          <p className="text-sm font-medium text-slate-800 leading-tight">{act.msg}</p>
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1">{act.time}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header with Live Sync Status */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-muted-foreground">System vitals for Munyaka Primary and Junior School.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            "bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2",
            isLive ? "border-emerald-200" : "border-rose-200"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              isLive ? "bg-emerald-500" : "bg-rose-500"
            )} />
            <span className={cn(
              "text-xs font-bold uppercase tracking-wider",
              isLive ? "text-emerald-600" : "text-rose-600"
            )}>
              {isLive ? 'LIVE FACTUAL SYNC' : 'OFFLINE / ERROR'}
            </span>
          </div>
          {lastSync && (
            <span className="text-xs text-slate-400 font-medium">
              Last sync: {lastSync}
            </span>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refresh}
            disabled={isLoading}
            className="rounded-xl gap-2 text-slate-600 hover:text-indigo-600"
          >
            <CheckCircle2 size={16} /> Refresh
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-700">
          <AlertCircle size={20} className="shrink-0" />
          <div>
            <p className="font-bold">Failed to load dashboard data</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refresh}
            className="ml-auto rounded-xl text-rose-600 hover:bg-rose-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat, i) => (
          <React.Fragment key={i}>
            {renderStatCard(stat)}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trends Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Attendance Trends (Weekly)</CardTitle>
            <Badge variant="outline" className={cn(
              "rounded-lg",
              metrics?.attendanceTrend?.some(d => d.isFactual) 
                ? "text-emerald-600 bg-emerald-50 border-emerald-100" 
                : "text-slate-500 border-slate-200"
            )}>
              {metrics?.attendanceTrend?.some(d => d.isFactual) 
                ? <TrendingUp size={12} className="mr-1" /> Real-time Data 
                : <TrendingUp size={12} className="mr-1" /> Awaiting Data}
            </Badge>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
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
                            <p className="text-lg font-black text-indigo-600">
                              {data.rate}% 
                              <span className="text-[10px] text-slate-400 font-bold ml-1">
                                {data.isFactual ? '(Factual)' : '(Projected)'}
                              </span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="rate" radius={[10, 10, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isFactual ? '#6366f1' : '#e2e8f0'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentAlerts.map((act, i) => renderAlertItem(act, i))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Factual Class Participation Table */}
      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Factual Class Participation</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <TableSkeleton rows={8} columns={4} />
          ) : classTableData.length > 0 ? (
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
                  {classTableData.map((cls) => (
                    <tr key={cls.className} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-900">{cls.className}</td>
                      <td className="px-8 py-5 text-slate-600">{cls.enrolled} Enrolled</td>
                      <td className="px-8 py-5 text-right">
                        <Badge className={cls.presentToday > 0 ? "bg-emerald-50 text-emerald-700 border-none font-bold" : "bg-slate-50 text-slate-400 border-none font-bold"}>
                          {cls.presentToday} Present ({cls.attendanceRate}%)
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <p className="font-bold">No class data available</p>
              <p className="text-sm mt-1">Check grades configuration in Settings</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;