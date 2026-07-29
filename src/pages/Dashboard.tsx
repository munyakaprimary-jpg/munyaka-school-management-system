"use client";

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Wallet, 
  Plus, 
  Printer,
  Search,
  Bell,
  Moon,
  Sun,
  TrendingUp,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Zap,
  Award,
  BookOpen,
  GraduationCap,
  UserCheck,
  Wallet as WalletIcon,
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
  Menu as MenuIcon,
  X as XIcon,
  ChevronDown,
  ChevronUp,
  Home,
  ArrowLeft,
  Bell as BellIcon,
  Moon as MoonIcon,
  Sun as SunIcon,
  Search as SearchIcon2,
  Filter as FilterIcon,
  Download as DownloadIcon,
  Printer as PrinterIcon,
  RefreshCw as RefreshCwIcon,
  ArrowUpDown as ArrowUpDownIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Eye as EyeIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  MapPin as MapPinIcon,
  Calendar as CalendarIcon2,
  Activity as ActivityIcon,
  BarChart3 as BarChart3Icon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Target as TargetIcon,
  Zap as ZapIcon,
  Award as AwardIcon2,
  BookOpen as BookOpenIcon2,
  ClipboardList as ClipboardListIcon,
  ShoppingCart as ShoppingCartIcon,
  DollarSign as DollarSignIcon,
  Percent as PercentIcon,
  TrendingUp as TrendingUpIcon2,
  Users as UsersIcon2,
  UserCheck as UserCheckIcon,
  ClockIcon as ClockIcon2,
  WalletIcon as WalletIcon2,
  SettingsIcon as SettingsIcon2,
  LogOutIcon as LogOutIcon2,
  MenuIcon as MenuIcon2,
  XIcon as XIcon2,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  Home as HomeIcon,
  ArrowLeft as ArrowLeftIcon,
  BellIcon as BellIcon2,
  MoonIcon as MoonIcon2,
  SunIcon as SunIcon2,
  SearchIcon2 as SearchIcon3,
  FilterIcon as FilterIcon2,
  DownloadIcon as DownloadIcon2,
  PrinterIcon as PrinterIcon2,
  RefreshCwIcon as RefreshCwIcon2,
  ArrowUpDownIcon as ArrowUpDownIcon2,
  MoreHorizontalIcon as MoreHorizontalIcon2,
  EyeIcon as EyeIcon2,
  MailIcon as MailIcon2,
  PhoneIcon as PhoneIcon2,
  MapPinIcon as MapPinIcon2,
  CalendarIcon2 as CalendarIcon3,
  ActivityIcon as ActivityIcon2,
  BarChart3Icon as BarChart3Icon2,
  PieChartIcon as PieChartIcon2,
  LineChartIcon as LineChartIcon2,
  TargetIcon as TargetIcon2,
  ZapIcon as ZapIcon2,
  AwardIcon2 as AwardIcon3,
  BookOpenIcon2 as BookOpenIcon3,
  ClipboardListIcon as ClipboardListIcon2,
  ShoppingCartIcon as ShoppingCartIcon2,
  DollarSignIcon as DollarSignIcon2,
  PercentIcon as PercentIcon2,
  TrendingUpIcon2 as TrendingUpIcon3,
  UsersIcon2 as UsersIcon3,
  UserCheckIcon as UserCheckIcon2,
  ClockIcon2 as ClockIcon3,
  WalletIcon2 as WalletIcon3,
  SettingsIcon2 as SettingsIcon3,
  LogOutIcon2 as LogOutIcon3,
  MenuIcon2 as MenuIcon3,
  XIcon2 as XIcon3,
  ChevronDownIcon as ChevronDownIcon2,
  ChevronUpIcon as ChevronUpIcon2,
  HomeIcon as HomeIcon2,
  ArrowLeftIcon as ArrowLeftIcon2,
  BellIcon2 as BellIcon3,
  MoonIcon2 as MoonIcon3,
  SunIcon2 as SunIcon3,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [term, setTerm] = useState('Term 1');
  const [notifications, setNotifications] = useState(3);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [studentsPerPage] = useState(5);
  
  // Mock data for metrics
  const [totalStudents, setTotalStudents] = useState(2150);
  const [newAdmissions, setNewAdmissions] = useState(45);
  const [totalStaff, setTotalStaff] = useState(85);
  const [activeStaff, setActiveStaff] = useState(78);
  const [attendanceRate, setAttendanceRate] = useState(94.8);
  const [morningAttendance, setMorningAttendance] = useState(96.2);
  const [afternoonAttendance, setAfternoonAttendance] = useState(93.4);
  const [feeCollectionRate, setFeeCollectionRate] = useState(82);
  const [feeTarget, setFeeTarget] = useState(90);
  const [collectedAmount, setCollectedAmount] = useState(450000);
  const [targetAmount, setTargetAmount] = useState(550000);
  
  // Mock data for academic performance chart
  const [academicData, setAcademicData] = useState([
    { term: 'Term 1', grade1: 78, grade2: 82, grade3: 75, grade4: 80, grade5: 85, grade6: 83, grade7: 79, grade8: 77 },
    { term: 'Term 2', grade1: 82, grade2: 85, grade3: 79, grade4: 84, grade5: 88, grade6: 86, grade7: 83, grade8: 81 },
    { term: 'Term 3', grade1: 85, grade2: 88, grade3: 83, grade4: 87, grade5: 91, grade6: 89, grade7: 86, grade8: 84 },
  ]);
  
  // Mock data for fee collection chart
  const [feeData, setFeeData] = useState([
    { name: 'Paid', value: 65 },
    { name: 'Pending', value: 25 },
    { name: 'Overdue', value: 10 },
  ]);
  
  // Mock data for student table
  const [allStudents, setAllStudents] = useState([
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
  const [recentTransactions, setRecentTransactions] = useState([
    { id: 1, student: 'Brian Kiptoo', amount: 5000, method: 'M-Pesa', date: 'Today 08:30', status: 'Paid' },
    { id: 2, student: 'Mary Atieno', amount: 3000, method: 'Bank Transfer', date: 'Today 09:15', status: 'Pending' },
    { id: 3, student: 'Emmanuel Maina', amount: 5000, method: 'M-Pesa', date: 'Yesterday 16:45', status: 'Paid' },
    { id: 4, student: 'Sheila Chepkoech', amount: 2500, method: 'Cash', date: 'Yesterday 14:20', status: 'Pending' },
    { id: 5, student: 'David Mutua', amount: 5000, method: 'M-Pesa', date: '2 days ago 11:10', status: 'Paid' },
  ]);
  
  // Filtered students for table
  const filteredStudents = allStudents
    .filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.admission.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(s => !filterGrade || s.grade.includes(filterGrade))
    .filter(s => !filterStatus || s.status === filterStatus)
    .slice((page - 1) * studentsPerPage, page * studentsPerPage);
  
  const totalPages = Math.ceil(allStudents.length / studentsPerPage);
  
  // Handle term change for academic data
  useEffect(() => {
    // In a real app, this would fetch data based on selected term
    console.log(`Loading data for ${term}`);
  }, [term]);
  
  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-indigo-600">Munyaka School Management</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-50">
              <Plus size={16} /> Enroll New Student
            </Button>
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-50">
              <Printer size={16} /> Generate Summary Report
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-indigo-500">
          <span className="font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
      
      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Students Card */}
        <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Users size={24} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-indigo-900">{totalStudents}</h3>
                <p className="text-sm text-indigo-600">Total Students</p>
                <p className="text-xs text-green-600 font-medium">+{newAdmissions} new admissions</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-indigo-500">Student Population</span>
              <span className="text-xs font-medium text-indigo-500">{totalStudents} Learners</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Teaching & Support Staff Card */}
        <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Wallet size={24} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-indigo-900">{totalStaff}</h3>
                <p className="text-sm text-indigo-600">Teaching & Support Staff</p>
                <p className="text-xs text-green-600 font-medium">{activeStaff} Active</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-indigo-500">Staff Count</span>
              <span className="text-xs font-medium text-indigo-500">{totalStaff} Personnel</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Today's Attendance Card */}
        <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Clock size={24} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-indigo-900">{attendanceRate}%</h3>
                <p className="text-sm text-indigo-600">Today's Attendance Rate</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs text-green-600">Morning: {morningAttendance}%</span>
                  <span className="text-xs text-orange-600">Afternoon: {afternoonAttendance}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-indigo-500">Attendance</span>
              <span className="text-xs font-medium text-indigo-500">{attendanceRate}% Present</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Fee Collection Rate Card */}
        <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Wallet size={24} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-indigo-900">{feeCollectionRate}%</h3>
                <p className="text-sm text-indigo-600">Fee Collection Rate</p>
                <p className="text-xs text-green-600 font-medium">Target: {feeTarget}%</p>
                <div className="w-full bg-slate-200 h-2.5 rounded-full mt-2">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${feeCollectionRate}%` }}></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-indigo-500">Collection</span>
              <span className="text-xs font-medium text-indigo-500">KES {collectedAmount.toLocaleString()} / KES {targetAmount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Educational Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Academic Performance Trend */}
        <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-black">Academic Performance Trend</CardTitle>
            <div className="flex flex-wrap items-center gap-4">
              {['Term 1', 'Term 2', 'Term 3'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setTerm(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    term === t ? "bg-indigo-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={academicData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="term" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}
                />
                {/* Grade 1 Line */}
                <Area type="monotone" dataKey="grade1" stroke="#ef4444" fill="#ef4444" opacity={0.8} />
                {/* Grade 4 Line */}
                <Area type="monotone" dataKey="grade4" stroke="#3b82f6" fill="#3b82f6" opacity={0.8} />
                {/* Grade 8 Line */}
                <Area type="monotone" dataKey="grade8" stroke="#10b981" fill="#10b981" opacity={0.8} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Fee Collection Status */}
        <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-black">Fee Collection Status</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-center">
              <RechartsPieChart width={200} height={200}>
                <Pie 
                  data={feeData} 
                  cx="100" 
                  cy="100" 
                  innerRadius="60" 
                  outerRadius="80"
                  labelLine={false}
                  label={({ name, value, percent }) => (
                    <text 
                      x={0} 
                      y={0} 
                      textAnchor="middle" 
                      dominantBaseline="middle" 
                      fill="#ffffff" 
                      fontSize="12"
                    >
                      {name}: {percent}%
                    </text>
                  )}
                >
                  {feeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Pie>
              </RechartsPieChart>
            </div>
            <div className="mt-4 text-center">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-green-600">Paid: {feeData[0].value}%</span>
                <span className="text-xs font-medium text-amber-600">Pending: {feeData[1].value}%</span>
                <span className="text-xs font-medium text-red-600">Overdue: {feeData[2].value}%</span>
              </div>
              <p className="mt-2 text-sm text-indigo-600">Total Expected: KES {targetAmount.toLocaleString()}</p>
              <p className="text-sm text-indigo-600">Collected: KES {collectedAmount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Management & Daily Operations Tables */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-indigo-900">Today's Attendance Alerts</h2>
          <Button variant="outline" size="sm" className="text-indigo-600 hover:bg-indigo-50">
            <RefreshCw size={16} /> Refresh
          </Button>
        </div>
        
        {/* Attendance Table */}
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-500 uppercase tracking-wider">Admission No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-500 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-500 uppercase tracking-wider">Grade/Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-500 uppercase tracking-wider">Attendance Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-500 uppercase tracking-wider">Parent Contact</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-indigo-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-indigo-900">{student.admission}</td>
                  <td className="px-6 py-4 font-medium text-indigo-900">{student.name}</td>
                  <td className="px-6 py-4 font-medium text-indigo-600">{student.grade}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      student.status === 'Present' ? "bg-green-50 text-green-700" :
                      student.status === 'Absent' ? "bg-red-50 text-red-700" :
                      "bg-yellow-50 text-yellow-700"
                    )}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-indigo-600">{student.parentContact}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-50">
                      <Eye size={16} /> View
                    </Button>
                    <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-50">
                      <Mail size={16} /> Message
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    No students match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2 text-sm text-indigo-500">
            <span>Showing {(page - 1) * studentsPerPage + 1}-{Math.min(page * studentsPerPage, allStudents.length)} of {allStudents.length} entries</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="text-indigo-600 hover:bg-indigo-50"
            >
              <ChevronLeft size={16} /> Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="text-indigo-600 hover:bg-indigo-50"
            >
              Next <ChevronRight size={16} />
            </Button>
          </div>
        </div>
        
        {/* Recent Fee Transactions Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-indigo-900">Recent Fee Transactions</h2>
            <Button variant="outline" size="sm" className="text-indigo-600 hover:bg-indigo-50">
              <Download size={16} /> Export CSV
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-indigo-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-indigo-500 uppercase tracking-wider">Amount (KES)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-indigo-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-indigo-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-indigo-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-indigo-900">{tx.student}</td>
                    <td className="px-6 py-4 font-medium text-indigo-600">{tx.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-indigo-600">{tx.method}</td>
                    <td className="px-6 py-4 font-medium text-indigo-600">{tx.date}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        tx.status === 'Paid' ? "bg-green-50 text-green-700" :
                        "bg-yellow-50 text-yellow-700"
                      )}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;