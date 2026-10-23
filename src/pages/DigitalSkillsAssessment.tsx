"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Award, Keyboard, FileCheck, Plus, Search, Download, Eye, Edit, CheckCircle2, AlertCircle, AlertTriangle, TrendingUp, Target, Activity, FileText, Layers, ClipboardCheck, Star, Monitor, Globe, Table, Presentation, Shield, BarChart3, Users, TrendingDown, TrendingUp as TrendingUpIcon, Trash2, X, Code, Zap, Database, Cpu } from 'lucide-react';
import { cn } from "@/lib/utils";

interface CompetencyRecord {
  id: string;
  studentName: string;
  admNo: string;
  grade: string;
  category: string;
  rating: 'EE' | 'ME' | 'AE' | 'BE';
  date: string;
}

interface TypingRecord {
  id: string;
  studentName: string;
  grade: string;
  speed: number;
  accuracy: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  date: string;
}

interface DigitalQuizRecord {
  id: string;
  title: string;
  grade: string;
  subject: string;
  questions: number;
  timeLimit: number;
  attempts: number;
  avgScore: number;
  status: 'Active' | 'Completed' | 'Draft';
  dueDate: string;
}

interface ToolMasteryRecord {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  totalStudents: number;
  proficient: number;
  developing: number;
  emerging: number;
  avgMastery: number;
}

interface ProficiencyRecord {
  id: string;
  studentName: string;
  grade: string;
  stream: string;
  toolName: string;
  level: 'Proficient' | 'Developing' | 'Emerging';
  lastTested: string;
}

const MOCK_COMPETENCIES: CompetencyRecord[] = [
  { id: "1", studentName: "Brian Kiptoo", admNo: "A827361", grade: "Grade 4", category: "Word Processing", rating: "EE", date: "2024-10-15" },
  { id: "2", studentName: "Mary Atieno", admNo: "A827362", grade: "Grade 4", category: "Spreadsheets", rating: "ME", date: "2024-10-14" },
  { id: "3", studentName: "Emmanuel Maina", admNo: "A827363", grade: "Grade 4", category: "Digital Research", rating: "ME", date: "2024-10-13" },
  { id: "4", studentName: "Sheila Chepkoech", admNo: "A827364", grade: "Grade 5", category: "Presentation Design", rating: "EE", date: "2024-10-12" },
  { id: "5", studentName: "David Mutua", admNo: "A827365", grade: "Grade 5", category: "Coding Basics", rating: "AE", date: "2024-10-11" },
  { id: "6", studentName: "Grace Wanjiku", admNo: "A827366", grade: "Grade 6", category: "Word Processing", rating: "ME", date: "2024-10-10" },
  { id: "7", studentName: "Joseph Kariuki", admNo: "A827367", grade: "Grade 6", category: "Spreadsheets", rating: "BE", date: "2024-10-09" },
  { id: "8", studentName: "Faith Njeri", admNo: "A827368", grade: "Grade 7", category: "Digital Research", rating: "EE", date: "2024-10-08" },
  { id: "9", studentName: "George Ochieng", admNo: "A827369", grade: "Grade 7", category: "Coding Basics", rating: "ME", date: "2024-10-07" },
  { id: "10", studentName: "Helen Moraa", admNo: "A827370", grade: "Grade 8", category: "Presentation Design", rating: "AE", date: "2024-10-06" },
];

const MOCK_TYPING_RECORDS: TypingRecord[] = [
  { id: "1", studentName: "Brian Kiptoo", grade: "Grade 4", speed: 42, accuracy: 96, level: "Advanced", date: "2024-10-15" },
  { id: "2", studentName: "Mary Atieno", grade: "Grade 4", speed: 35, accuracy: 94, level: "Intermediate", date: "2024-10-14" },
  { id: "3", studentName: "Emmanuel Maina", grade: "Grade 4", speed: 28, accuracy: 92, level: "Intermediate", date: "2024-10-13" },
  { id: "4", studentName: "Sheila Chepkoech", grade: "Grade 5", speed: 38, accuracy: 97, level: "Advanced", date: "2024-10-12" },
  { id: "5", studentName: "David Mutua", grade: "Grade 5", speed: 22, accuracy: 89, level: "Beginner", date: "2024-10-11" },
  { id: "6", studentName: "Grace Wanjiku", grade: "Grade 6", speed: 31, accuracy: 93, level: "Intermediate", date: "2024-10-10" },
  { id: "7", studentName: "Joseph Kariuki", grade: "Grade 6", speed: 18, accuracy: 85, level: "Beginner", date: "2024-10-09" },
  { id: "8", studentName: "Faith Njeri", grade: "Grade 7", speed: 45, accuracy: 98, level: "Advanced", date: "2024-10-08" },
  { id: "9", studentName: "George Ochieng", grade: "Grade 7", speed: 26, accuracy: 91, level: "Beginner", date: "2024-10-07" },
  { id: "10", studentName: "Helen Moraa", grade: "Grade 8", speed: 33, accuracy: 95, level: "Intermediate", date: "2024-10-06" },
];

const MOCK_DIGITAL_QUIZZES: DigitalQuizRecord[] = [
  { 
    id: "1", 
    title: "Digital Citizenship Quiz", 
    grade: "Grade 4", 
    subject: "ICT & Digital Literacy",
    questions: 20, 
    timeLimit: 30, 
    attempts: 42, 
    avgScore: 78, 
    status: "Active", 
    dueDate: "2024-11-15" 
  },
  { 
    id: "2", 
    title: "Internet Safety Assessment", 
    grade: "Grade 5", 
    subject: "Digital Citizenship",
    questions: 15, 
    timeLimit: 20, 
    attempts: 38, 
    avgScore: 85, 
    status: "Completed", 
    dueDate: "2024-10-20" 
  },
  { 
    id: "3", 
    title: "Coding Fundamentals Test", 
    grade: "Grade 6", 
    subject: "Computer Science",
    questions: 25, 
    timeLimit: 45, 
    attempts: 40, 
    avgScore: 72, 
    status: "Active", 
    dueDate: "2024-11-30" 
  },
  { 
    id: "4", 
    title: "Data Privacy & Security Quiz", 
    grade: "Grade 7", 
    subject: "Pre-Technical Studies",
    questions: 18, 
    timeLimit: 25, 
    attempts: 35, 
    avgScore: 81, 
    status: "Active", 
    dueDate: "2024-12-05" 
  },
  { 
    id: "5", 
    title: "Advanced Spreadsheet Functions", 
    grade: "Grade 8", 
    subject: "Computer Studies",
    questions: 22, 
    timeLimit: 35, 
    attempts: 30, 
    avgScore: 76, 
    status: "Completed", 
    dueDate: "2024-10-28" 
  },
];

const MOCK_TOOLS: ToolMasteryRecord[] = [
  {
    id: "1",
    name: "MS Word / Google Docs",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    totalStudents: 42,
    proficient: 28,
    developing: 10,
    emerging: 4,
    avgMastery: 82
  },
  {
    id: "2",
    name: "MS Excel / Google Sheets",
    icon: Table,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    totalStudents: 42,
    proficient: 22,
    developing: 14,
    emerging: 6,
    avgMastery: 74
  },
  {
    id: "3",
    name: "MS PowerPoint / Google Slides",
    icon: Presentation,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    totalStudents: 42,
    proficient: 25,
    developing: 12,
    emerging: 5,
    avgMastery: 78
  },
  {
    id: "4",
    name: "Web Browsing & Safety",
    icon: Globe,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    totalStudents: 42,
    proficient: 30,
    developing: 8,
    emerging: 4,
    avgMastery: 85
  },
  {
    id: "5",
    name: "Scratch / Block Coding",
    icon: Code,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    totalStudents: 42,
    proficient: 18,
    developing: 16,
    emerging: 8,
    avgMastery: 68
  },
  {
    id: "6",
    name: "Digital Citizenship",
    icon: Shield,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    totalStudents: 42,
    proficient: 20,
    developing: 15,
    emerging: 7,
    avgMastery: 71
  },
  {
    id: "7",
    name: "Python Basics",
    icon: Cpu,
    color: "text-green-600",
    bgColor: "bg-green-50",
    totalStudents: 35,
    proficient: 12,
    developing: 15,
    emerging: 8,
    avgMastery: 62
  },
  {
    id: "8",
    name: "Database Fundamentals",
    icon: Database,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    totalStudents: 30,
    proficient: 8,
    developing: 12,
    emerging: 10,
    avgMastery: 55
  }
];

const initialRecords: ProficiencyRecord[] = [
  { id: "1", studentName: "Brian Kiptoo", grade: "Grade 4", stream: "East", toolName: "MS Word / Google Docs", level: "Proficient", lastTested: "2024-10-15" },
  { id: "2", studentName: "Brian Kiptoo", grade: "Grade 4", stream: "East", toolName: "MS Excel / Google Sheets", level: "Developing", lastTested: "2024-10-14" },
  { id: "3", studentName: "Brian Kiptoo", grade: "Grade 4", stream: "East", toolName: "MS PowerPoint / Google Slides", level: "Proficient", lastTested: "2024-10-13" },
  { id: "4", studentName: "Mary Atieno", grade: "Grade 4", stream: "West", toolName: "MS Word / Google Docs", level: "Proficient", lastTested: "2024-10-15" },
  { id: "5", studentName: "Mary Atieno", grade: "Grade 4", stream: "West", toolName: "MS Excel / Google Sheets", level: "Proficient", lastTested: "2024-10-14" },
  { id: "6", studentName: "Emmanuel Maina", grade: "Grade 4", stream: "North", toolName: "MS Word / Google Docs", level: "Developing", lastTested: "2024-10-13" },
  { id: "7", studentName: "Emmanuel Maina", grade: "Grade 4", stream: "North", toolName: "Web Browsing & Safety", level: "Proficient", lastTested: "2024-10-12" },
  { id: "8", studentName: "Sheila Chepkoech", grade: "Grade 5", stream: "East", toolName: "MS Word / Google Docs", level: "Proficient", lastTested: "2024-10-15" },
  { id: "9", studentName: "Sheila Chepkoech", grade: "Grade 5", stream: "East", toolName: "MS PowerPoint / Google Slides", level: "Proficient", lastTested: "2024-10-14" },
  { id: "10", studentName: "David Mutua", grade: "Grade 5", stream: "West", toolName: "MS Excel / Google Sheets", level: "Emerging", lastTested: "2024-10-13" },
  { id: "11", studentName: "David Mutua", grade: "Grade 5", stream: "West", toolName: "Scratch / Block Coding", level: "Developing", lastTested: "2024-10-12" },
  { id: "12", studentName: "Grace Wanjiku", grade: "Grade 6", stream: "Blue", toolName: "MS Word / Google Docs", level: "Proficient", lastTested: "2024-10-15" },
  { id: "13", studentName: "Grace Wanjiku", grade: "Grade 6", stream: "Blue", toolName: "MS PowerPoint / Google Slides", level: "Developing", lastTested: "2024-10-14" },
  { id: "14", studentName: "Joseph Kariuki", grade: "Grade 6", stream: "Red", toolName: "MS Excel / Google Sheets", level: "Emerging", lastTested: "2024-10-13" },
  { id: "15", studentName: "Faith Njeri", grade: "Grade 7", stream: "East", toolName: "MS Word / Google Docs", level: "Proficient", lastTested: "2024-10-15" },
  { id: "16", studentName: "Faith Njeri", grade: "Grade 7", stream: "East", toolName: "Scratch / Block Coding", level: "Proficient", lastTested: "2024-10-14" },
  { id: "17", studentName: "George Ochieng", grade: "Grade 7", stream: "North", toolName: "MS Excel / Google Sheets", level: "Developing", lastTested: "2024-10-13" },
  { id: "18", studentName: "Helen Moraa", grade: "Grade 8", stream: "South", toolName: "MS PowerPoint / Google Slides", level: "Proficient", lastTested: "2024-10-15" },
  { id: "19", studentName: "Helen Moraa", grade: "Grade 8", stream: "South", toolName: "Web Browsing & Safety", level: "Proficient", lastTested: "2024-10-14" },
  { id: "20", studentName: "Helen Moraa", grade: "Grade 8", stream: "South", toolName: "Digital Citizenship", level: "Developing", lastTested: "2024-10-13" },
];

const CATEGORIES = [
  "Word Processing",
  "Spreadsheets", 
  "Digital Research",
  "Presentation Design",
  "Coding Basics",
  "Internet Safety",
  "Multimedia Creation"
];

const SPEED_LEVELS = ["Beginner", "Intermediate", "Advanced"];

const GRADE_OPTIONS = [
  "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"
];

const DigitalSkillsAssessment = () => {
  const [activeTab, setActiveTab] = useState<'competencies' | 'typing' | 'quizzes' | 'software'>('competencies');
  
  // Competencies Tab State
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Typing Tab State
  const [typingSearchTerm, setTypingSearchTerm] = useState("");
  const [speedLevelFilter, setSpeedLevelFilter] = useState("all");

  // Quizzes Tab State
  const [quizSearchTerm, setQuizSearchTerm] = useState("");
  const [quizGradeFilter, setQuizGradeFilter] = useState("all");
  const [quizStatusFilter, setQuizStatusFilter] = useState("all");

  // Software Mastery Tab State
  const [softwareSearchTerm, setSoftwareSearchTerm] = useState("");
  const [softwareToolFilter, setSoftwareToolFilter] = useState("all");
  const [softwareLevelFilter, setSoftwareLevelFilter] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("All Grades");
  const [selectedStream, setSelectedStream] = useState("All Streams");
  
  // Software Mastery Modal & Data State
  const [records, setRecords] = useState<ProficiencyRecord[]>(initialRecords);
  const [selectedRecord, setSelectedRecord] = useState<ProficiencyRecord | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const filteredCompetencies = useMemo(() => {
    return MOCK_COMPETENCIES.filter(record => {
      const matchesSearch = record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.admNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || record.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, categoryFilter]);

  const filteredTypingRecords = useMemo(() => {
    return MOCK_TYPING_RECORDS.filter(record => {
      const matchesSearch = record.studentName.toLowerCase().includes(typingSearchTerm.toLowerCase());
      const matchesLevel = speedLevelFilter === "all" || record.level === speedLevelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [typingSearchTerm, speedLevelFilter]);

  const filteredQuizzes = useMemo(() => {
    return MOCK_DIGITAL_QUIZZES.filter(quiz => {
      const matchesSearch = quiz.title.toLowerCase().includes(quizSearchTerm.toLowerCase()) ||
                           quiz.subject.toLowerCase().includes(quizSearchTerm.toLowerCase());
      const matchesGrade = quizGradeFilter === "all" || quiz.grade === quizGradeFilter;
      const matchesStatus = quizStatusFilter === "all" || quiz.status === quizStatusFilter;
      return matchesSearch && matchesGrade && matchesStatus;
    });
  }, [quizSearchTerm, quizGradeFilter, quizStatusFilter]);

  const filteredProficiencyRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = record.studentName.toLowerCase().includes(softwareSearchTerm.toLowerCase()) ||
                           record.toolName.toLowerCase().includes(softwareSearchTerm.toLowerCase());
      const matchesTool = softwareToolFilter === "all" || record.toolName === softwareToolFilter;
      const matchesLevel = softwareLevelFilter === "all" || record.level === softwareLevelFilter;
      const matchesGrade = selectedGrade === "All Grades" || record.grade === selectedGrade;
      const matchesStream = selectedStream === "All Streams" || record.stream === selectedStream;
      return matchesSearch && matchesTool && matchesLevel && matchesGrade && matchesStream;
    });
  }, [records, softwareSearchTerm, softwareToolFilter, softwareLevelFilter, selectedGrade, selectedStream]);

  const competencyStats = useMemo(() => {
      const total = MOCK_COMPETENCIES.length;
      const ee = MOCK_COMPETENCIES.filter(r => r.rating === 'EE').length;
      const me = MOCK_COMPETENCIES.filter(r => r.rating === 'ME').length;
      const ae = MOCK_COMPETENCIES.filter(r => r.rating === 'AE').length;
      const be = MOCK_COMPETENCIES.filter(r => r.rating === 'BE').length;
      return { total, ee, me, ae, be };
    }, []);

  const typingStats = useMemo(() => {
    const totalSessions = MOCK_TYPING_RECORDS.length;
    const avgSpeed = Math.round(MOCK_TYPING_RECORDS.reduce((sum, r) => sum + r.speed, 0) / totalSessions);
    const topSpeed = Math.max(...MOCK_TYPING_RECORDS.map(r => r.speed));
    return { totalSessions, avgSpeed, topSpeed };
  }, []);

  const quizStats = useMemo(() => {
    const activeQuizzes = MOCK_DIGITAL_QUIZZES.filter(q => q.status === 'Active').length;
    const totalAttempts = MOCK_DIGITAL_QUIZZES.reduce((sum, q) => sum + q.attempts, 0);
    const avgScore = Math.round(MOCK_DIGITAL_QUIZZES.reduce((sum, q) => sum + q.avgScore, 0) / MOCK_DIGITAL_QUIZZES.length);
    return { activeQuizzes, totalAttempts, avgScore };
  }, []);

  const softwareStats = useMemo(() => {
    const appsAssessed = MOCK_TOOLS.length;
    const avgMastery = Math.round(MOCK_TOOLS.reduce((sum, t) => sum + t.avgMastery, 0) / appsAssessed);
    const highPerformers = records.filter(r => r.level === 'Proficient').length;
    const needsPractice = records.filter(r => r.level === 'Emerging').length;
    return { appsAssessed, avgMastery, highPerformers, needsPractice };
  }, [records]);

  const handleDelete = (id: string | number) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleEditSave = (updatedLevel: 'Proficient' | 'Developing' | 'Emerging') => {
    if (!selectedRecord) return;
    setRecords(prev => prev.map(r => 
      r.id === selectedRecord.id ? { ...r, level: updatedLevel } : r
    ));
    setIsEditOpen(false);
    setSelectedRecord(null);
  };

  const getRatingBadge = (rating: string) => {
    const configs = {
      EE: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", label: "Exceeding" },
      ME: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100", label: "Meeting" },
      AE: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", label: "Approaching" },
      BE: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100", label: "Below" },
    };
    const config = configs[rating as keyof typeof configs] || configs.ME;
    return (
      <Badge variant="outline" className={cn("rounded-lg font-bold text-xs px-2.5 py-0.5", config.bg, config.text, config.border)}>
        {config.label} ({rating})
      </Badge>
    );
  };

  const getSpeedLevelBadge = (level: string) => {
    const configs = {
      Beginner: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
      Intermediate: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
      Advanced: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
    };
    const config = configs[level as keyof typeof configs] || configs.Beginner;
    return (
      <Badge variant="outline" className={cn("rounded-lg font-bold text-xs px-2.5 py-0.5", config.bg, config.text, config.border)}>
        {level}
      </Badge>
    );
  };

  const getQuizStatusBadge = (status: string) => {
    const configs = {
      Active: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100" },
      Completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
      Draft: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
    };
    const config = configs[status as keyof typeof configs] || configs.Active;
    return (
      <Badge variant="outline" className={cn("rounded-lg font-bold text-xs px-2.5 py-0.5", config.bg, config.text, config.border)}>
        {status}
      </Badge>
    );
  };

  const getProficiencyBadge = (level: string) => {
    const configs = {
      Proficient: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
      Developing: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
      Emerging: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100" },
    };
    const config = configs[level as keyof typeof configs] || configs.Developing;
    return (
      <Badge variant="outline" className={cn("rounded-lg font-bold text-xs px-2.5 py-0.5", config.bg, config.text, config.border)}>
        {level}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Digital Skills & Assessment</h1>
          <p className="text-gray-500">Record ICT competencies, typing speeds, digital quizzes, and software mastery.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-4">
        <button
          onClick={() => setActiveTab('competencies')}
          className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'competencies' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Award className="w-4 h-4" /> ICT Competencies
        </button>
        <button
          onClick={() => setActiveTab('typing')}
          className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'typing' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Keyboard className="w-4 h-4" /> Keyboarding Log
        </button>
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'quizzes' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileCheck className="w-4 h-4" /> Digital Quizzes
        </button>
        <button
          onClick={() => setActiveTab('software')}
          className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'software' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Monitor className="w-4 h-4" /> Software Mastery
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'competencies' && (
        <div className="space-y-6">
          {/* Metric Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                      <Card className="border-none shadow-sm rounded-[1.75rem] sm:rounded-[2rem] bg-white p-3.5 sm:p-5">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="p-2 sm:p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                            <Award size={20} className="sm:w-6 sm:h-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-wider sm:tracking-widest whitespace-nowrap">Total Evaluated</p>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-none mt-1">{competencyStats.total}</h3>
                          </div>
                        </div>
                      </Card>
                      <Card className="border-none shadow-sm rounded-[1.75rem] sm:rounded-[2rem] bg-white p-3.5 sm:p-5">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
                            <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-wider sm:tracking-widest whitespace-nowrap">EE (Exceeding)</p>
                            <h3 className="text-xl sm:text-2xl font-black text-emerald-700 leading-none mt-1">{competencyStats.ee}</h3>
                          </div>
                        </div>
                      </Card>
                      <Card className="border-none shadow-sm rounded-[1.75rem] sm:rounded-[2rem] bg-white p-3.5 sm:p-5">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
                            <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-wider sm:tracking-widest whitespace-nowrap">ME (Meeting)</p>
                            <h3 className="text-xl sm:text-2xl font-black text-blue-700 leading-none mt-1">{competencyStats.me}</h3>
                          </div>
                        </div>
                      </Card>
                      <Card className="border-none shadow-sm rounded-[1.75rem] sm:rounded-[2rem] bg-white p-3.5 sm:p-5">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="p-2 sm:p-3 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
                            <AlertCircle size={20} className="sm:w-6 sm:h-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-wider sm:tracking-widest whitespace-nowrap">AE (Approaching)</p>
                            <h3 className="text-xl sm:text-2xl font-black text-amber-700 leading-none mt-1">{competencyStats.ae}</h3>
                          </div>
                        </div>
                      </Card>
                      <Card className="border-none shadow-sm rounded-[1.75rem] sm:rounded-[2rem] bg-white p-3.5 sm:p-5">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="p-2 sm:p-3 bg-rose-50 text-rose-600 rounded-2xl shrink-0">
                            <AlertTriangle size={20} className="sm:w-6 sm:h-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-wider sm:tracking-widest whitespace-nowrap">BE (Below)</p>
                            <h3 className="text-xl sm:text-2xl font-black text-rose-700 leading-none mt-1">{competencyStats.be}</h3>
                          </div>
                        </div>
                      </Card>
                    </div>

          {/* Filters & Search */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-5">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  placeholder="Search by learner name or Adm No..." 
                  className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[220px] h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
                  <SelectValue placeholder="All Skill Categories" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">All Skill Categories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 bg-white font-bold gap-2">
                <Download size={18} /> Export CSV
              </Button>
            </div>
          </Card>

          {/* Competencies Table */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-slate-500 border-b bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Student Name</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Adm No</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Grade</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Skill Category</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Rating</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Date</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCompetencies.length > 0 ? (
                      filteredCompetencies.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <p className="font-bold text-slate-900">{record.studentName}</p>
                          </td>
                          <td className="px-8 py-5">
                            <code className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{record.admNo}</code>
                          </td>
                          <td className="px-8 py-5">
                            <span className="font-bold text-slate-700">{record.grade}</span>
                          </td>
                          <td className="px-8 py-5">
                            <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-600 font-bold text-xs">
                              {record.category}
                            </Badge>
                          </td>
                          <td className="px-8 py-5 text-center">
                            {getRatingBadge(record.rating)}
                          </td>
                          <td className="px-8 py-5 font-medium text-slate-600">{record.date}</td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="View Details">
                                <Eye size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="Edit Record">
                                <Edit size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-8 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Search size={32} className="text-slate-200" />
                            <p className="text-slate-500 font-bold">No competency records match the current filters.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'typing' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Class Avg Speed</p>
                  <h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{typingStats.avgSpeed} WPM</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Target size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Top Speed</p>
                  <h3 className="text-2xl font-black text-emerald-700 leading-none mt-1">{typingStats.topSpeed} WPM</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Sessions</p>
                  <h3 className="text-2xl font-black text-blue-700 leading-none mt-1">{typingStats.totalSessions}</h3>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters & Search */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-5">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  placeholder="Search by learner name..." 
                  className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium"
                  value={typingSearchTerm}
                  onChange={(e) => setTypingSearchTerm(e.target.value)}
                />
              </div>
              <Select value={speedLevelFilter} onValueChange={setSpeedLevelFilter}>
                <SelectTrigger className="w-[200px] h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
                  <SelectValue placeholder="All Speed Levels" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">All Speed Levels</SelectItem>
                  {SPEED_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 bg-white font-bold gap-2">
                <Download size={18} /> Export CSV
              </Button>
            </div>
          </Card>

          {/* Typing Records Table */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-slate-500 border-b bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Student Name</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Grade</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Speed (WPM)</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Accuracy (%)</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Speed Level</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Assessment Date</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTypingRecords.length > 0 ? (
                      filteredTypingRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <p className="font-bold text-slate-900">{record.studentName}</p>
                          </td>
                          <td className="px-8 py-5">
                            <span className="font-bold text-slate-700">{record.grade}</span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className="font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl">{record.speed} WPM</span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className="font-bold text-emerald-600">{record.accuracy}%</span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            {getSpeedLevelBadge(record.level)}
                          </td>
                          <td className="px-8 py-5 font-medium text-slate-600">{record.date}</td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="View Details">
                                <Eye size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="Edit Record">
                                <Edit size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-8 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Search size={32} className="text-slate-200" />
                            <p className="text-slate-500 font-bold">No typing records match the current filters.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'quizzes' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Zap size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Quizzes</p>
                  <h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{quizStats.activeQuizzes}</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Attempts</p>
                  <h3 className="text-2xl font-black text-emerald-700 leading-none mt-1">{quizStats.totalAttempts}</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Target size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Avg Class Score</p>
                  <h3 className="text-2xl font-black text-blue-700 leading-none mt-1">{quizStats.avgScore}%</h3>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters & Search */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-5">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  placeholder="Search by Quiz Title or Subject..." 
                  className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium"
                  value={quizSearchTerm}
                  onChange={(e) => setQuizSearchTerm(e.target.value)}
                />
              </div>
              <Select value={quizGradeFilter} onValueChange={setQuizGradeFilter}>
                <SelectTrigger className="w-[200px] h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">All Grades</SelectItem>
                  {GRADE_OPTIONS.map(grade => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={quizStatusFilter} onValueChange={setQuizStatusFilter}>
                <SelectTrigger className="w-[180px] h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 bg-white font-bold gap-2">
                <Download size={18} /> Export CSV
              </Button>
            </div>
          </Card>

          {/* Quizzes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.length > 0 ? (
              filteredQuizzes.map((quiz) => {
                return (
                  <Card key={quiz.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white overflow-hidden group">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                          <FileCheck size={24} />
                        </div>
                        {getQuizStatusBadge(quiz.status)}
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                          {quiz.title}
                        </h3>
                        <p className="text-sm font-bold text-indigo-500 flex items-center gap-1">
                          <Layers size={14} /> {quiz.grade}
                        </p>
                        <p className="text-xs text-slate-500">{quiz.subject}</p>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 bg-slate-50 rounded-xl">
                            <p className="text-xl font-black text-slate-900">{quiz.questions}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Questions</p>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl">
                            <p className="text-xl font-black text-slate-900">{quiz.timeLimit} min</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Time Limit</p>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl">
                            <p className="text-xl font-black text-indigo-600">{quiz.attempts}</p>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase">Attempts</p>
                          </div>
                        <div className="p-2 bg-slate-50 rounded-xl">
                            <p className="text-xl font-black text-emerald-600">{quiz.avgScore}%</p>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase">Avg Score</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                          <span>Due: {quiz.dueDate}</span>
                          <span className="text-slate-500">{quiz.status}</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black h-11 shadow-lg shadow-indigo-100 gap-2"
                      >
                        <ClipboardCheck size={18} /> View Results
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-200 shadow-sm">
                  <Search size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">No quizzes found</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">No digital quizzes match the current search and grade filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'software' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Monitor size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Apps Assessed</p>
                  <h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{softwareStats.appsAssessed}</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <TrendingUpIcon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Avg Mastery</p>
                  <h3 className="text-2xl font-black text-emerald-700 leading-none mt-1">{softwareStats.avgMastery}%</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">High Performers</p>
                  <h3 className="text-2xl font-black text-blue-700 leading-none mt-1">{softwareStats.highPerformers}</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                  <TrendingDown size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Needs Practice</p>
                  <h3 className="text-2xl font-black text-rose-700 leading-none mt-1">{softwareStats.needsPractice}</h3>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters & Search */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-5">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  placeholder="Search by learner name or tool..." 
                  className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium"
                  value={softwareSearchTerm}
                  onChange={(e) => setSoftwareSearchTerm(e.target.value)}
                />
              </div>
              <Select value={softwareToolFilter} onValueChange={setSoftwareToolFilter}>
                <SelectTrigger className="w-[220px] h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
                  <SelectValue placeholder="All Tools" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">All Tools</SelectItem>
                  {MOCK_TOOLS.map(tool => (
                    <SelectItem key={tool.id} value={tool.name}>{tool.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={softwareLevelFilter} onValueChange={setSoftwareLevelFilter}>
                <SelectTrigger className="w-[180px] h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Proficient">Proficient</SelectItem>
                  <SelectItem value="Developing">Developing</SelectItem>
                  <SelectItem value="Emerging">Emerging</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="w-[180px] h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="All Grades">All Grades</SelectItem>
                  <SelectItem value="Grade 4">Grade 4</SelectItem>
                  <SelectItem value="Grade 5">Grade 5</SelectItem>
                  <SelectItem value="Grade 6">Grade 6</SelectItem>
                  <SelectItem value="Grade 7">Grade 7</SelectItem>
                  <SelectItem value="Grade 8">Grade 8</SelectItem>
                  <SelectItem value="Grade 9">Grade 9</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStream} onValueChange={setSelectedStream}>
                <SelectTrigger className="w-[180px] h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
                  <SelectValue placeholder="All Streams" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="All Streams">All Streams</SelectItem>
                  <SelectItem value="East">East</SelectItem>
                  <SelectItem value="West">West</SelectItem>
                  <SelectItem value="Green">Green</SelectItem>
                  <SelectItem value="Blue">Blue</SelectItem>
                  <SelectItem value="Blue">Blue</SelectItem>
                  <SelectItem value="Red">Red</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 bg-white font-bold gap-2">
                <Download size={18} /> Export CSV
              </Button>
            </div>
          </Card>

          {/* Tool Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card key={tool.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white overflow-hidden group">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className={cn("p-3 rounded-2xl", tool.bgColor)}>
                        <Icon className={cn("text-2xl", tool.color)} size={28} />
                      </div>
                      <Badge variant="outline" className={cn("rounded-lg font-bold text-xs", tool.bgColor, tool.color)}>
                        {tool.avgMastery}% Avg
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                      {tool.name}
                    </h3>

                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-emerald-50 rounded-xl">
                          <p className="text-2xl font-black text-emerald-700">{tool.proficient}</p>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase">Proficient</p>
                        </div>
                        <div className="p-2 bg-amber-50 rounded-xl">
                          <p className="text-2xl font-black text-amber-700">{tool.developing}</p>
                          <p className="text-[10px] font-bold text-amber-600 uppercase">Developing</p>
                        </div>
                        <div className="p-2 bg-rose-50 rounded-xl">
                          <p className="text-2xl font-black text-rose-700">{tool.emerging}</p>
                          <p className="text-[10px] font-bold text-rose-600 uppercase">Emerging</p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-black uppercase text-slate-400 tracking-wider mb-1">
                          <span>Mastery Progress</span>
                          <span className={cn("font-bold", tool.avgMastery >= 80 ? "text-emerald-600" : tool.avgMastery >= 70 ? "text-amber-600" : "text-rose-600")}>
                            {tool.avgMastery}%
                          </span>
                        </div>
                        <Progress value={tool.avgMastery} className="h-2.5" />
                      </div>

                      <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <span>Total Learners: {tool.totalStudents}</span>
                        <span className="text-slate-500">Last Updated: Oct 15, 2024</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Learner Proficiency Table */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-6 border-b bg-slate-50/50">
              <CardTitle className="text-lg font-black text-slate-900">Learner Proficiency Records</CardTitle>
              <p className="text-sm text-slate-500">Individual student proficiency levels across all assessed software tools.</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 border-b">
                    <tr>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Student Name</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Grade</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Tool / Application</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Proficiency Level</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Last Tested</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProficiencyRecords.length > 0 ? (
                      filteredProficiencyRecords.map((record, index) => (
                        <tr key={`${record.id || index}-${index}`}>
                          <td className="p-3">
                            <p className="font-bold text-slate-900">{record.studentName}</p>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-700">{record.grade}</span>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-600 font-bold text-xs">
                              {record.toolName}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            {getProficiencyBadge(record.level)}
                          </td>
                          <td className="p-3 font-medium text-slate-600">{record.lastTested}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setSelectedRecord(record); setIsEditOpen(true); }} className="p-1 text-blue-600 hover:text-blue-800">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => { setSelectedRecord(record); setIsViewOpen(true); }} className="p-1 text-gray-600 hover:text-gray-800">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(record.id)} className="p-1 text-red-600 hover:text-red-800">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-8 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Search size={32} className="text-slate-200" />
                            <p className="text-slate-500 font-bold">No proficiency records match the current filters.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Edit Modal */}
          {isEditOpen && selectedRecord && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Edit Proficiency Level</h3>
                  <button onClick={() => { setIsEditOpen(false); setSelectedRecord(null); }} className="p-1 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm font-bold text-slate-900">{selectedRecord.studentName}</p>
                    <p className="text-xs text-slate-500">{selectedRecord.grade} • {selectedRecord.toolName}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">Proficiency Level</Label>
                    <Select 
                      value={selectedRecord.level} 
                      onValueChange={(val: 'Proficient' | 'Developing' | 'Emerging') => handleEditSave(val)}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="Proficient">Proficient</SelectItem>
                        <SelectItem value="Developing">Developing</SelectItem>
                        <SelectItem value="Emerging">Emerging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="ghost" 
                      className="flex-1 rounded-xl h-11 font-bold"
                      onClick={() => { setIsEditOpen(false); setSelectedRecord(null); }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1 rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100"
                      onClick={() => { setIsEditOpen(false); setSelectedRecord(null); }}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View Details Modal */}
          {isViewOpen && selectedRecord && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900">View Details</h3>
                  <button onClick={() => { setIsViewOpen(false); setSelectedRecord(null); }} className="p-1 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 rounded-xl">
                    <p className="text-sm font-bold text-indigo-900">{selectedRecord.studentName}</p>
                    <p className="text-xs text-indigo-700 mt-1">{selectedRecord.grade} • {selectedRecord.toolName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Current Level</p>
                      <p className="text-lg font-black text-slate-900 mt-1">{selectedRecord.level}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Last Tested</p>
                      <p className="text-lg font-black text-slate-900 mt-1">{selectedRecord.lastTested}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-xs font-bold text-amber-800 flex items-center gap-1">
                      <AlertCircle size={12} /> Teacher Feedback: This student shows consistent progress in practical assessments.
                    </p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="ghost" 
                      className="flex-1 rounded-xl h-11 font-bold"
                      onClick={() => { setIsViewOpen(false); setSelectedRecord(null); }}
                    >
                      Close
                    </Button>
                    <Button 
                      className="flex-1 rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100"
                      onClick={() => { setIsViewOpen(false); setIsEditOpen(true); }}
                    >
                      Edit Instead
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DigitalSkillsAssessment;