"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Award, 
  Keyboard, 
  FileCheck, 
  Plus, 
  Search, 
  Download, 
  Eye, 
  Edit, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  Gauge,
  TrendingUp,
  Target
} from 'lucide-react';
import { cn } from "@/lib/utils";

// --- Types ---
interface CompetencyRecord {
  id: string;
  studentName: string;
  admNo: string;
  grade: string;
  category: string;
  rating: 'EE' | 'ME' | 'AE' | 'BE';
  date: string;
}

interface TypingLogRecord {
  id: string;
  studentName: string;
  grade: string;
  wpm: number;
  accuracy: number;
  date: string;
}

// --- Mock Data ---
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

const MOCK_TYPING_LOGS: TypingLogRecord[] = [
  { id: "t1", studentName: "Mary Atieno", grade: "Grade 4", wpm: 54, accuracy: 98, date: "2024-10-15" },
  { id: "t2", studentName: "Faith Njeri", grade: "Grade 7", wpm: 48, accuracy: 97, date: "2024-10-14" },
  { id: "t3", studentName: "Sheila Chepkoech", grade: "Grade 5", wpm: 42, accuracy: 96, date: "2024-10-13" },
  { id: "t4", studentName: "Grace Wanjiku", grade: "Grade 6", wpm: 38, accuracy: 95, date: "2024-10-12" },
  { id: "t5", studentName: "Helen Moraa", grade: "Grade 8", wpm: 35, accuracy: 94, date: "2024-10-11" },
  { id: "t6", studentName: "Brian Kiptoo", grade: "Grade 4", wpm: 32, accuracy: 94, date: "2024-10-10" },
  { id: "t7", studentName: "George Ochieng", grade: "Grade 7", wpm: 29, accuracy: 93, date: "2024-10-09" },
  { id: "t8", studentName: "David Mutua", grade: "Grade 5", wpm: 26, accuracy: 91, date: "2024-10-08" },
  { id: "t9", studentName: "Emmanuel Maina", grade: "Grade 4", wpm: 18, accuracy: 88, date: "2024-10-07" },
  { id: "10", studentName: "Joseph Kariuki", grade: "Grade 6", wpm: 15, accuracy: 82, date: "2024-10-06" },
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

const getSpeedLevel = (wpm: number): 'Beginner' | 'Intermediate' | 'Advanced' => {
  if (wpm < 20) return 'Beginner';
  if (wpm < 40) return 'Intermediate';
  return 'Advanced';
};

const DigitalSkillsAssessment = () => {
  const [activeTab, setActiveTab] = useState<'competencies' | 'typing' | 'projects'>('competencies');
  
  // Competencies Tab State
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Keyboarding Log Tab State
  const [typingSearchTerm, setTypingSearchTerm] = useState("");
  const [speedLevelFilter, setSpeedLevelFilter] = useState("all");

  const filteredCompetencies = useMemo(() => {
    return MOCK_COMPETENCIES.filter(record => {
      const matchesSearch = record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.admNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || record.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, categoryFilter]);

  const filteredTypingLogs = useMemo(() => {
    return MOCK_TYPING_LOGS.filter(record => {
      const matchesSearch = record.studentName.toLowerCase().includes(typingSearchTerm.toLowerCase());
      const level = getSpeedLevel(record.wpm);
      const matchesLevel = speedLevelFilter === "all" || level.toLowerCase() === speedLevelFilter.toLowerCase();
      return matchesSearch && matchesLevel;
    });
  }, [typingSearchTerm, speedLevelFilter]);

  const stats = useMemo(() => {
    const total = MOCK_COMPETENCIES.length;
    const ee = MOCK_COMPETENCIES.filter(r => r.rating === 'EE').length;
    const me = MOCK_COMPETENCIES.filter(r => r.rating === 'ME').length;
    const aeBe = MOCK_COMPETENCIES.filter(r => r.rating === 'AE' || r.rating === 'BE').length;
    return { total, ee, me, aeBe };
  }, []);

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

  const getSpeedLevelBadge = (wpm: number) => {
    const level = getSpeedLevel(wpm);
    const configs = {
      Beginner: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
      Intermediate: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
      Advanced: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
    };
    const config = configs[level];
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
          <p className="text-gray-500">Record ICT competencies, typing speeds, and practical CBC projects.</p>
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
          <Award className="w-4 h-4" /> Competencies
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
          onClick={() => setActiveTab('projects')}
          className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'projects' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileCheck className="w-4 h-4" /> Project Evaluations
        </button>
      </div>

      {/* Tab Content 1: COMPETENCIES */}
      {activeTab === 'competencies' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Award size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Evaluated</p>
                  <h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.total}</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">EE (Exceeding)</p>
                  <h3 className="text-2xl font-black text-emerald-700 leading-none mt-1">{stats.ee}</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">ME (Meeting)</p>
                  <h3 className="text-2xl font-black text-blue-700 leading-none mt-1">{stats.me}</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">AE / BE (Support Needed)</p>
                  <h3 className="text-2xl font-black text-amber-700 leading-none mt-1">{stats.aeBe}</h3>
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

      {/* Tab Content 2: KEYBOARDING LOG */}
      {activeTab === 'typing' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Gauge size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Class Avg Speed</p>
                  <h3 className="text-2xl font-black text-slate-900 leading-none mt-1">28 WPM</h3>
                </div>
              </div>
            </Card>

            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Zap size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Top Speed</p>
                  <h3 className="text-2xl font-black text-emerald-700 leading-none mt-1">54 WPM</h3>
                </div>
              </div>
            </Card>

            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Keyboard size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Sessions</p>
                  <h3 className="text-2xl font-black text-indigo-700 leading-none mt-1">64</h3>
                </div>
              </div>
            </Card>
          </div>

          {/* Search Bar & Speed Level Dropdown */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-5">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex flex-1 gap-4 w-full">
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
                    <SelectItem value="beginner">Beginner (< 20 WPM)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (20-39 WPM)</SelectItem>
                    <SelectItem value="advanced">Advanced (≥ 40 WPM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-100">
                <Plus size={18} /> Log Typing Score
              </Button>
            </div>
          </Card>

          {/* Keyboarding Log Table */}
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
                    {filteredTypingLogs.length > 0 ? (
                      filteredTypingLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <p className="font-bold text-slate-900">{log.studentName}</p>
                          </td>
                          <td className="px-8 py-5">
                            <span className="font-bold text-slate-700">{log.grade}</span>
                          </td>
                          <td className="px-8 py-5 text-center font-black text-indigo-600 text-base">
                            {log.wpm} <span className="text-xs text-slate-400 font-normal">WPM</span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className="font-black text-slate-800">{log.accuracy}%</span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            {getSpeedLevelBadge(log.wpm)}
                          </td>
                          <td className="px-8 py-5 font-medium text-slate-600">{log.date}</td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="View Details">
                                <Eye size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="Edit Log">
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

      {/* Tab Content 3: PROJECT EVALUATIONS */}
      {activeTab === 'projects' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Project-Based Evaluations</h2>
          <p className="text-gray-500 text-sm mb-4">Evaluate practical digital artifacts and presentations.</p>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create New Assessment
          </button>
        </div>
      )}
    </div>
  );
};

export default DigitalSkillsAssessment;