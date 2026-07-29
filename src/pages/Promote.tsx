"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Modal from '@/components/ui/Modal';
import BackButton from '@/components/ui/BackButton';
import PromoteStudentsModal from '@/components/ui/PromoteStudentsModal';
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit,
  Eye,
  Mail,
  Phone,
  MapPin,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  BookOpen,
  Layers,
  UserCheck,
  FileText,
  Settings,
  Shield,
  Bell,
  Calendar as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  DollarSign,
  CreditCard,
  Wallet,
  PiggyBank,
  Building,
  Banknote,
  Receipt,
  Calculator,
  Percent,
  Coins,
  Wallet as WalletIcon,
  CreditCard as CreditCardIcon,
  Banknote as BanknoteIcon,
  TrendingUp as TrendingUpIcon2,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart3 as BarChart3Icon,
  Activity as ActivityIcon,
  Target as TargetIcon,
  Award as AwardIcon,
  BookOpen as BookOpenIcon,
  Layers as LayersIcon,
  UserCheck as UserCheckIcon,
  FileText as FileTextIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  Bell as BellIcon,
  Calendar as CalendarIcon2,
  TrendingUp as TrendingUpIcon3,
  DollarSign as DollarSignIcon,
  CreditCard as CreditCardIcon2,
  Wallet as WalletIcon2,
  PiggyBank as PiggyBankIcon,
  Building as BuildingIcon,
  Banknote as BanknoteIcon2,
  Receipt as ReceiptIcon,
  Calculator as CalculatorIcon,
  Percent as PercentIcon,
  Coins as CoinsIcon,
  TrendingUp as TrendingUpIcon4,
  TrendingDown as TrendingDownIcon,
  ArrowUpRight as ArrowUpRightIcon,
  ArrowDownRight as ArrowDownRightIcon
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { cn } from "@/lib/utils";
import { showSuccess, showError } from '@/utils/toast';

// Mock data for students
const MOCK_STUDENTS = [
  { id: "1", name: "Brian Kiptoo", grade: "Grade 6", stream: "Blue", status: "Active" as const },
  { id: "2", name: "Mary Atieno", grade: "Grade 6", stream: "Blue", status: "Active" as const },
  { id: "3", name: "Emmanuel Maina", grade: "Grade 6", stream: "Green", status: "Active" as const },
  { id: "4", name: "Sheila Chepkoech", grade: "Grade 5", stream: "Alpha", status: "Active" as const },
  { id: "5", name: "David Mutua", grade: "Grade 5", stream: "Alpha", status: "Active" as const },
  { id: "6", name: "Grace Wanjiku", grade: "Grade 4", stream: "Beta", status: "Active" as const },
  { id: "7", name: "Joseph Kariuki", grade: "Grade 4", stream: "Beta", status: "Active" as const },
  { id: "8", name: "Faith Njeri", grade: "Grade 3", stream: "Alpha", status: "Active" as const },
  { id: "9", name: "George Ochieng", grade: "Grade 3", stream: "Beta", status: "Active" as const },
  { id: "10", name: "Helen Moraa", grade: "Grade 2", stream: "Alpha", status: "Active" as const },
  { id: "11", name: "Samuel Kamau", grade: "Grade 2", stream: "Beta", status: "Active" as const },
  { id: "12", name: "Winnie Achieng", grade: "Grade 1", stream: "Blue", status: "Active" as const },
  { id: "13", name: "Peter Odhiambo", grade: "Grade 1", stream: "Green", status: "Active" as const },
  { id: "14", name: "Jane Mwangi", grade: "Grade PP2", stream: "Yellow", status: "Active" as const },
  { id: "15", name: "David Maina", grade: "Grade PP1", stream: "Yellow", status: "Active" as const },
];

// Mock data for statistics
const MOCK_STATS = {
  totalStudents: 15,
  activeStudents: 15,
  graduatedStudents: 0,
  archivedStudents: 0,
  studentsByGrade: [
    { grade: "Grade PP1", count: 1 },
    { grade: "Grade PP2", count: 1 },
    { grade: "Grade 1", count: 2 },
    { grade: "Grade 2", count: 2 },
    { grade: "Grade 3", count: 2 },
    { grade: "Grade 4", count: 2 },
    { grade: "Grade 5", count: 2 },
    { grade: "Grade 6", count: 2 },
  ],
  studentsByStream: [
    { stream: "Blue", count: 3 },
    { stream: "Green", count: 2 },
    { stream: "Alpha", count: 3 },
    { stream: "Beta", count: 2 },
    { stream: "Yellow", count: 2 },
  ]
};

const Promote = () => {
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStream, setFilterStream] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [promotionHistory, setPromotionHistory] = useState<any[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = !filterGrade || student.grade === filterGrade;
    const matchesStream = !filterStream || student.stream === filterStream;
    const matchesStatus = !filterStatus || student.status === filterStatus;
    return matchesSearch && matchesGrade && matchesStream && matchesStatus;
  });

  const getNextGrade = (currentGrade: string): string => {
    const gradeMatch = currentGrade.match(/Grade (\d+)/);
    if (gradeMatch) {
      const currentNum = parseInt(gradeMatch[1]);
      return `Grade ${currentNum + 1}`;
    }
    if (currentGrade === "Grade PP2") return "Grade 1";
    if (currentGrade === "Grade PP1") return "Grade PP2";
    return currentGrade;
  };

  const isHighestGrade = (grade: string, highestGrade: string): boolean => {
    const gradeMatch = grade.match(/Grade (\d+)/);
    const highestMatch = highestGrade.match(/Grade (\d+)/);
    
    if (gradeMatch && highestMatch) {
      const currentNum = parseInt(gradeMatch[1]);
      const highestNum = parseInt(highestMatch[1]);
      return currentNum >= highestNum;
    }
    return false;
  };

  const handlePromoteStudents = (promotedStudents: any[]) => {
    setStudents(promotedStudents);
    
    // Add to promotion history
    const promotionRecord = {
      id: `PROM-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      promotedBy: "System Admin",
      totalPromoted: promotedStudents.length,
      newGrades: promotedStudents.map(s => ({
        student: s.name,
        from: s.grade,
        to: getNextGrade(s.grade)
      }))
    };
    
    setPromotionHistory([promotionRecord, ...promotionHistory]);
    setShowSuccessMessage(true);
    
    // Hide success message after 5 seconds
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const getHighestGrade = () => {
    const maxGrade = Math.max(...students.map(s => {
      const match = s.grade.match(/Grade (\d+)/);
      return match ? parseInt(match[1]) : 0;
    }));
    return `Grade ${maxGrade}`;
  };

  const getPromotionPreview = () => {
    return students.map(student => {
      const nextGrade = getNextGrade(student.grade);
      const isHighest = isHighestGrade(student.grade, getHighestGrade());
      return {
        ...student,
        nextGrade,
        isHighest,
        status: isHighest ? 'Graduated' : student.status
      };
    });
  };

  const promotionPreview = getPromotionPreview();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-lg animate-in slide-in-from-right">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-emerald-600" size={20} />
            <div>
              <p className="font-bold text-emerald-800">Promotion Successful!</p>
              <p className="text-sm text-emerald-700">Students have been promoted to their next grade levels.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Promote Students</h1>
            <p className="text-muted-foreground">End-of-year grade promotion with safety safeguards.</p>
          </div>
        </div>
        <Button 
          className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700"
          onClick={() => setIsPromoteModalOpen(true)}
        >
          <GraduationCap size={18} /> Start Promotion
        </Button>
      </div>

      {/* Warning Banner */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-amber-50/50 border border-amber-200 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-amber-600 mt-1 shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-amber-800 mb-2">⚠️ Critical Action Required</h3>
              <p className="text-sm text-amber-700 mb-3">
                The "Promote Students" feature is designed for end-of-year grade advancement. 
                This action will permanently change student grades and cannot be easily undone.
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-amber-800">
                <div className="flex items-center gap-1">
                  <CheckCircle size={14} /> Students in highest grade become "Graduated"
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle size={14} /> Streams/colors remain unchanged
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle size={14} /> This action is irreversible
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Preview and History */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-12 mb-8">
          <TabsTrigger value="preview" className="rounded-xl px-8 h-full font-bold text-xs">Promotion Preview</TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl px-8 h-full font-bold text-xs">Promotion History</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Students</p>
                  <h3 className="text-2xl font-black text-slate-900">{MOCK_STATS.totalStudents}</h3>
                </div>
              </div>
            </Card>

            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <UserCheck size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Students</p>
                  <h3 className="text-2xl font-black text-slate-900">{MOCK_STATS.activeStudents}</h3>
                </div>
              </div>
            </Card>

            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Graduated</p>
                  <h3 className="text-2xl font-black text-slate-900">{MOCK_STATS.graduatedStudents}</h3>
                </div>
              </div>
            </Card>

            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl">
                  <FileText size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Highest Grade</p>
                  <h3 className="text-2xl font-black text-slate-900">{getHighestGrade()}</h3>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  placeholder="Search students..." 
                  className="pl-10 h-11 rounded-xl bg-slate-50 border-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none">
                  <SelectValue placeholder="Filter by Grade" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_STATS.studentsByGrade.map(item => (
                    <SelectItem key={item.grade} value={item.grade}>{item.grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStream} onValueChange={setFilterStream}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none">
                  <SelectValue placeholder="Filter by Stream" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_STATS.studentsByStream.map(item => (
                    <SelectItem key={item.stream} value={item.stream}>{item.stream}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Graduated">Graduated</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Promotion Preview Table */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b bg-slate-50/50">
              <CardTitle className="text-lg">Promotion Preview</CardTitle>
              <p className="text-sm text-slate-400 font-medium">Review which students will be promoted before executing</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 border-b">
                    <tr>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Student Name</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Current Grade</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Next Grade</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Stream</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {promotionPreview.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 font-bold text-slate-900">{student.name}</td>
                        <td className="px-8 py-5 font-medium text-slate-600">{student.grade}</td>
                        <td className="px-8 py-5">
                          <span className={cn(
                            "font-bold",
                            student.isHighest ? "text-emerald-600" : "text-indigo-600"
                          )}>
                            {student.nextGrade}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <Badge variant="outline" className="rounded-lg border-slate-200 text-xs">
                            {student.stream}
                          </Badge>
                        </td>
                        <td className="px-8 py-5">
                          <Badge className={cn(
                            "rounded-lg border-none font-bold",
                            student.isHighest ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"
                          )}>
                            {student.status}
                          </Badge>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <Button variant="ghost" size="sm" className="text-indigo-600 font-bold">
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 border-b">
                  <tr>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Promotion ID</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Date</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Promoted By</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Total Promoted</th>
                    <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {promotionHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-indigo-600">{record.id}</td>
                      <td className="px-8 py-5 font-medium text-slate-600">{record.date}</td>
                      <td className="px-8 py-5 font-medium text-slate-600">{record.promotedBy}</td>
                      <td className="px-8 py-5 font-bold text-slate-900">{record.totalPromoted}</td>
                      <td className="px-8 py-5 text-right">
                        <Button variant="ghost" size="sm" className="text-indigo-600 font-bold">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Promote Students Modal */}
      <PromoteStudentsModal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        students={filteredStudents}
        onPromote={handlePromoteStudents}
        highestGrade={getHighestGrade()}
      />
    </div>
  );
};

export default Promote;