"use client";

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Clock, 
  Wallet, 
  Plus, 
  Printer,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const [term, setTerm] = useState('Term 1');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [studentsPerPage] = useState(5);
  
  // Mock data for metrics
  const [totalStudents] = useState(2150);
  const [newAdmissions] = useState(45);
  const [totalStaff] = useState(85);
  const [activeStaff] = useState(78);
  const [attendanceRate] = useState(94.8);
  const [morningAttendance] = useState(96.2);
  const [afternoonAttendance] = useState(93.4);
  const [feeCollectionRate] = useState(82);
  const [feeTarget] = useState(90);
  const [collectedAmount] = useState(450000);
  const [targetAmount] = useState(550000);
  
  // Mock data for academic performance chart
  const [academicData] = useState([
    { term: 'Term 1', grade1: 78, grade4: 80, grade8: 77 },
    { term: 'Term 2', grade1: 82, grade4: 84, grade8: 81 },
    { term: 'Term 3', grade1: 85, grade4: 87, grade8: 84 },
  ]);
  
  // Mock data for fee collection chart
  const [feeData] = useState([
    { name: 'Paid', value: 65 },
    { name: 'Pending', value: 25 },
    { name: 'Overdue', value: 10 },
  ]);
  
  // Mock data for student table
  const [allStudents] = useState([
    { id: 1, name: 'Brian Kiptoo', admission: 'A827361', grade: '4 Blue', status: 'Present', parentContact: '+254 712 000 111' },
    { id: 2, name: 'Mary Atieno', admission: 'A827362', grade: '4 Blue', status: 'Absent', parentContact: '+254 712 000 222' },
    { id: 3, name: 'Emmanuel Maina', admission: 'A827363', grade: '4 Green', status: 'Present', parentContact: '+254 712 000 333' },
    { id: 4, name: 'Sheila Chepkoech', admission: 'A827364', grade: '5 Alpha', status: 'Late', parentContact: '+254 712 000 444' },
    { id: 5, name: 'David Mutua', admission: 'A827365', grade: '5 Alpha', status: 'Present', parentContact: '+254 712 000 555' },
    { id: 6, name: 'Grace Wanjiku', admission: 'A827366', grade: '6 Beta', status: 'Present', parentContact: '+254 712 000 666' },
    { id: 7, name: 'Joseph Kariuki', admission: 'A827367', grade: '6 Beta', status: 'Absent', parentContact: '+254 712 000 777' },
    { id: 8, name: 'Faith Njeri', admission: 'A827368', grade: '7 Alpha', status: 'Present', parentContact: '+254 712 000 888' },
    { id: 9, name: 'George Ochieng', admission: 'A827369', grade: '7 Beta', status: 'Present', parentContact: '+254 712 000 999' },
    { id: 10, name: 'Helen Moraa', admission: 'A827370', grade: '8 Alpha', status: 'Late', parentContact: '+254 712 000 000' },
  ]);
  
  // Mock data for recent transactions
  const [recentTransactions] = useState([
    { id: 1, student: 'Brian Kiptoo', amount: 5000, method: 'M-Pesa', date: 'Today 08:30', status: 'Paid' },
    { id: 2, student: 'Mary Atieno', amount: 3000, method: 'Bank Transfer', date: 'Today 09:15', status: 'Pending' },
    { id: 3, student: 'Emmanuel Maina', amount: 5000, method: 'M-Pesa', date: 'Yesterday 16:45', status: 'Paid' },
    { id: 4, student: 'Sheila Chepkoech', amount: 2500, method: 'Cash', date: 'Yesterday 14:20', status: 'Pending' },
    { id: 5, student: 'David Mutua', amount: 5000, method: 'M-Pesa', date: '2 days ago 11:10', status: 'Paid' },
  ]);
  
  const filteredStudents = allStudents
    .filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.admission.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(s => !filterGrade || s.grade.includes(filterGrade))
    .filter(s => !filterStatus || s.status === filterStatus)
    .slice((page - 1) * studentsPerPage, page * studentsPerPage);
  
  const totalPages = Math.ceil(allStudents.length / studentsPerPage);
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">School Overview</h1>
          <p className="text-slate-500 font-medium">Welcome back! Here's what's happening at Munyaka today.</p>
        </div>
        <div className="flex gap-2">
          <Button className="rounded-2xl gap-2 h-11 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
            <Plus size={18} /> New Admission
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Students</p>
              <h3 className="text-2xl font-black text-slate-900">{totalStudents}</h3>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
            <span>+{newAdmissions} New this term</span>
          </div>
        </Card>
        
        <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Attendance</p>
              <h3 className="text-2xl font-black text-slate-900">{attendanceRate}%</h3>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold">Morning: {morningAttendance}%</Badge>
          </div>
        </Card>
        
        <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Staff</p>
              <h3 className="text-2xl font-black text-slate-900">{activeStaff} / {totalStaff}</h3>
            </div>
          </div>
          <Progress value={(activeStaff / totalStaff) * 100} className="h-1.5" />
        </Card>
        
        <Card className="border-none shadow-sm rounded-[2rem] bg-indigo-600 text-white p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/10 text-white rounded-2xl">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-100 tracking-widest">Fee Collection</p>
              <h3 className="text-2xl font-black">{feeCollectionRate}%</h3>
            </div>
          </div>
          <div className="space-y-1.5">
            <Progress value={feeCollectionRate} className="h-1.5 bg-white/20" />
            <p className="text-[10px] font-bold text-indigo-100">Target: {feeTarget}%</p>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Academic Performance Trend</CardTitle>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Average Scores by Term</p>
            </div>
            <div className="flex gap-1.5">
              {['Term 1', 'Term 2', 'Term 3'].map(t => (
                <Button 
                  key={t}
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setTerm(t)}
                  className={cn("rounded-xl h-8 px-4 font-bold text-xs", term === t ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100")}
                >
                  {t}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={academicData}>
                  <defs>
                    <linearGradient id="colorG1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="term" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    itemStyle={{fontWeight: 700, fontSize: '12px'}}
                  />
                  <Area type="monotone" dataKey="grade4" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorG1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8">
          <CardTitle className="text-lg mb-8">Fee Distribution</CardTitle>
          <div className="flex justify-center mb-8">
            <RechartsPieChart width={200} height={200}>
              <Pie
                data={feeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {feeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Pie>
            </RechartsPieChart>
          </div>
          <div className="space-y-4">
            {feeData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", i === 0 ? "bg-emerald-500" : i === 1 ? "bg-amber-500" : "bg-rose-500")} />
                  <span className="text-xs font-bold text-slate-500">{item.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Today's Attendance Alerts</h2>
          <Button variant="ghost" size="sm" className="text-indigo-600 font-bold hover:bg-indigo-50 rounded-xl">
            <RefreshCw size={16} className="mr-2" /> Refresh Data
          </Button>
        </div>
        
        <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 border-b">
                <tr>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Student Name</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Class</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-900">{student.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ADM: {student.admission}</p>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-600">{student.grade}</td>
                    <td className="px-8 py-5">
                      <Badge className={cn("rounded-lg border-none font-bold", 
                        student.status === 'Present' ? "bg-emerald-50 text-emerald-700" : 
                        student.status === 'Absent' ? "bg-rose-50 text-rose-700" : 
                        "bg-amber-50 text-amber-700"
                      )}>
                        {student.status}
                      </Badge>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-indigo-600">
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-indigo-600">
                          <Mail size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;