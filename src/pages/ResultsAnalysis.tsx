import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GRADES_DATA, Grade } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Award, CheckCircle2, XCircle, Loader2, AlertCircle, TrendingUp, Target, Activity, FileSpreadsheet, BarChart3, Users, TrendingDown, TrendingUp as TrendingUpIcon, Trash2, Eye, Edit, MoreVertical } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

// --- Types ---
interface StudentResult {
  studentId: string;
  name: string;
  assessmentNo: string;
  grade: string;
  stream: string;
  rank: number;
  totalMarks: number;
  meanScore: number;
  level: 'EE' | 'ME' | 'AE' | 'BE';
}

interface ExamSummary {
  totalStudents: number;
  avgScore: number;
  topPerformers: number;
  passRate: number;
}

// Mock data for student results
const MOCK_STUDENT_RESULTS: StudentResult[] = [
  { studentId: '1', name: 'Brian Kiptoo', assessmentNo: 'A827361', grade: 'Grade 4', stream: 'Blue', rank: 1, totalMarks: 445, meanScore: 89, level: 'EE' },
  { studentId: '2', name: 'Mary Atieno', assessmentNo: 'A827362', grade: 'Grade 4', stream: 'Blue', rank: 2, totalMarks: 430, meanScore: 86, level: 'EE' },
  { studentId: '3', name: 'Emmanuel Maina', assessmentNo: 'A827363', grade: 'Grade 4', stream: 'Green', rank: 3, totalMarks: 415, meanScore: 83, level: 'ME' },
  { studentId: '4', name: 'Sheila Chepkoech', assessmentNo: 'A827364', grade: 'Grade 5', stream: 'Alpha', rank: 1, totalMarks: 450, meanScore: 90, level: 'EE' },
  { studentId: '5', name: 'David Mutua', assessmentNo: 'A827365', grade: 'Grade 5', stream: 'Alpha', rank: 2, totalMarks: 425, meanScore: 85, level: 'ME' },
  { studentId: '6', name: 'Grace Wanjiku', assessmentNo: 'A827366', grade: 'Grade 6', stream: 'Beta', rank: 1, totalMarks: 438, meanScore: 87.6, level: 'ME' },
  { studentId: '7', name: 'Joseph Kariuki', assessmentNo: 'A827367', grade: 'Grade 6', stream: 'Beta', rank: 2, totalMarks: 420, meanScore: 84, level: 'ME' },
  { studentId: '8', name: 'Faith Njeri', assessmentNo: 'A827368', grade: 'Grade 7', stream: 'Alpha', rank: 1, totalMarks: 442, meanScore: 88.4, level: 'EE' },
  { studentId: '9', name: 'George Ochieng', assessmentNo: 'A827369', grade: 'Grade 7', stream: 'Beta', rank: 2, totalMarks: 430, meanScore: 86, level: 'ME' },
  { studentId: '10', name: 'Helen Moraa', assessmentNo: 'A827370', grade: 'Grade 8', stream: 'South', rank: 1, totalMarks: 455, meanScore: 91, level: 'EE' },
];

const GRADE_LEVEL_OPTIONS = [
  { value: "all", label: "All Grade Levels" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: `${i + 1}`,
    label: `Grade ${i + 1}`,
  })),
];

const ResultsAnalysis = () => {
  const [activeTab, setActiveTab] = useState<'students' 'summary' 'export'>('students');
  const [selectedGrade, setSelectedGrade] = useState(GRADES_DATA[0].id);
  const [selectedStream, setSelectedStream] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter students based on grade, stream, and search
  const filteredStudents = useMemo(() => {
    return MOCK_STUDENT_RESULTS.filter(student => {
      const matchesGrade = selectedGrade === 'all' || student.grade === selectedGrade;
      const matchesStream = selectedStream === 'all' || student.stream === selectedStream;
      const matchesSearch = !searchTerm || 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.assessmentNo.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesGrade && matchesStream && matchesSearch;
    });
  }, [selectedGrade, selectedStream, searchTerm]);

  // Calculate summary statistics
  const examSummary = useMemo(() => {
    const totalStudents = filteredStudents.length;
    if (totalStudents === 0) return { totalStudents: 0, avgScore: 0, topPerformers: 0, passRate: 0 };
    
    const totalMarks = filteredStudents.reduce((sum, s) => sum + s.totalMarks, 0);
    const avgScore = Math.round(totalMarks / totalStudents);
    const topPerformers = filteredStudents.filter(s => s.level === 'EE').length;
    const passRate = Math.round((filteredStudents.filter(s => s.level !== 'BE').length / totalStudents) * 100);
    
    return { totalStudents, avgScore, topPerformers, passRate };
  }, [filteredStudents]);

  // Grade distribution
  const gradeDistribution = useMemo(() => {
    const distribution = { EE: 0, ME: 0, AE: 0, BE: 0 };
    filteredStudents.forEach(s => {
      distribution[s.level as keyof typeof distribution]++;
    });
    return distribution;
  }, [filteredStudents]);

  // Handle export
  const handleExport = () => {
    // Generate CSV content
    const headers = ['Rank', 'Name', 'Assessment No', 'Grade', 'Stream', 'Total Marks', 'Mean Score', 'Level'];
    const rows = filteredStudents.map(s => [
      s.rank,
      s.name,
      s.assessmentNo,
      s.grade,
      s.stream,
      s.totalMarks,
      s.meanScore,
      s.level
    ]);

    const csvContent = [
      'MUNYAKA PRIMARY AND JUNIOR SCHOOL',
      'RESULTS ANALYSIS REPORT',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `results_analysis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showSuccess(`Exported results for ${filteredStudents.length} students.`);
  };

  // Tab switching
  const renderTabContent = () => {
    switch (activeTab) {
      case 'students':
        return renderStudentsTable();
      case 'summary':
        return renderSummarySection();
      case 'export':
        return renderExportSection();
      default:
        return renderStudentsTable();
    }
  };

  // Students table
  const renderStudentsTable = () => (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/80">
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Rank</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Student Name</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Assessment No</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Grade</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Stream</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Total Marks</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Mean Score</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Performance Level</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.studentId} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-black text-slate-900">{student.rank}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{student.name}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Assessment: {student.assessmentNo}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">{student.assessmentNo}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{student.grade}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{student.stream}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{student.totalMarks}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{student.meanScore}%</td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className={cn("rounded-lg border-none font-bold text-[9px] uppercase", 
        student.level === 'EE' ? "bg-emerald-50 text-emerald-700" :
        student.level === 'ME' ? "bg-blue-50 text-blue-700" :
        student.level === 'AE' ? "bg-amber-50 text-amber-700" :
        "bg-rose-50 text-rose-700")}>
        {student.level}
      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="View Details">
                          <Eye size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="Edit Marks">
                          <Edit size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Search size={32} className="text-slate-200" />
                      <p className="text-slate-500 font-bold">No student result records found for the selected Grade and Stream filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  // Summary section
  const renderSummarySection = () => (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="border-none shadow-sm bg-white p-3 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-2xl", "bg-indigo-50 text-indigo-600")}>
              <Award size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total Students</p>
              <h3 className="text-lg font-black text-slate-900 leading-none mt-0.5">{examSummary.totalStudents}</h3>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-white p-3 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-2xl", "bg-emerald-50 text-emerald-600")}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Exceeding (EE)</p>
              <h3 className="text-lg font-black text-emerald-700 leading-none mt-0.5">{gradeDistribution.EE}</h3>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-white p-3 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-2xl", "bg-blue-50 text-blue-600")}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Meeting (ME)</p>
              <h3 className="text-lg font-black text-blue-700 leading-none mt-0.5">{gradeDistribution.ME}</h3>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-white p-3 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-2xl", "bg-amber-50 text-amber-600")}>
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Approaching/Below (AE/BE)</p>
              <h3 className="text-lg font-black text-amber-700 leading-none mt-0.5">{gradeDistribution.AE + gradeDistribution.BE}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-none shadow-sm bg-white p-3">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-2xl", "bg-indigo-50 text-indigo-600")}>
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Average Score</p>
              <h3 className="text-lg font-black text-slate-900 leading-none mt-0.5">{examSummary.avgScore}%</h3>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-white p-3">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-2xl", "bg-emerald-50 text-emerald-600")}>
              <Target size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Top Performers</p>
              <h3 className="text-lg font-black text-emerald-700 leading-none mt-0.5">{examSummary.topPerformers}</h3>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-white p-3">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-2xl", "bg-rose-50 text-rose-600")}>
              <XCircle size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Needs Improvement</p>
              <h3 className="text-lg font-black text-rose-700 leading-none mt-0.5">{examSummary.totalStudents - examSummary.topPerformers - Math.round((gradeDistribution.EE + gradeDistribution.ME) * 0.6)}</h3>
            </div>
          </div>
        </card>
      </div>

      {/* Grade Distribution Chart */}
      <div className="mt-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Grade Distribution</h3>
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4).keys()].map((_, i) => (
            <div key={i} className="p-3 rounded-2xl border border-slate-200/50 text-center">
              <span className="text-[10px] font-black uppercase text-slate-500">{['EE', 'ME', 'AE', 'BE'][i]}</span>
              <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500'][i]}`
                  style={{ width: `${gradeDistribution[['EE', 'ME', 'AE', 'BE'][i] as keyof typeof gradeDistribution] / filteredStudents.length * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold mt-1">{gradeDistribution[['EE', 'ME', 'AE', 'BE'][i]]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Export section
  const renderExportSection = () => (
    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/50">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Export Results</h3>
      <p className="text-slate-500 mb-4">Select the format and scope for exporting the analysis report.</p>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Export Format</Label>
          <Select defaultValue="csv">
            <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV Format</SelectItem>
              <SelectItem value="excel">Excel Format</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Scope</Label>
          <Select defaultValue="filtered">
            <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="filtered">Current Filters</SelectItem>
              <SelectItem value="all">All Students</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        onClick={handleExport}
        className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 shadow-lg shadow-indigo-100 gap-2"
      >
        {activeTab === 'export' ? <Loader2 className="animate-spin" size={18} /> : <FileDown size={18} />}
        Export Report
      </Button>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 action-bar">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Results Analysis</h1>
          <p className="text-muted-foreground">Analyze student performance across grades and streams.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="rounded-2xl gap-2 h-11 px-6 border-slate-200 bg-white text-slate-600 font-medium shadow-sm"
            onClick={() => setActiveTab('students')}
          >
            Students
          </Button>
          <Button 
            variant="outline" 
            className="rounded-2xl gap-2 h-11 px-6 border-slate-200 bg-white text-slate-600 font-medium shadow-sm"
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </Button>
          <Button 
            variant="outline" 
            className="rounded-2xl gap-2 h-11 px-6 border-slate-200 bg-white text-slate-600 font-medium shadow-sm"
            onClick={() => setActiveTab('export')}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search by name or assessment number..." 
            className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Grade</Label>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
              <SelectValue placeholder="Select Grade" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Grades</SelectItem>
              {GRADES_DATA.map((g) => (
                <SelectItem key={g.id} value={g.name}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Stream</Label>
          <Select value={selectedStream} onValueChange={setSelectedStream}>
            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
              <SelectValue placeholder="All Streams" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Streams</SelectItem>
              {['Blue', 'Green', 'Yellow', 'Alpha', 'Beta', 'North', 'South', 'East', 'West'].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          className="h-12 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 gap-2 font-bold transition-colors w-full sm:col-span-2 lg:col-span-1"
          onClick={() => setSearchTerm('')}
        >
          <X size={18} /> Clear Filters
        </Button>
      </div>
    </div>

    {renderTabContent()}
  );
};

export default ResultsAnalysis;