"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Modal from '@/components/ui/Modal';
import BackButton from '@/components/ui/BackButton';
import { 
  Keyboard, 
  Award, 
  FileCheck, 
  Plus, 
  Search, 
  Filter, 
  BarChart2,
  Users,
  Target,
  TrendingUp,
  BookOpen,
  Edit2,
  Trash2,
  GraduationCap,
  MousePointer,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  ClipboardList
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { STUDENTS, GRADES_DATA } from '@/lib/mock-data';

// --- Types ---
interface CompetencyRecord {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  grade: string;
  stream: string;
  skillCategory: string;
  level: 'EE' | 'ME' | 'AE' | 'BE';
  evaluatedDate: string;
  remarks: string;
}

interface TypingRecord {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  stream: string;
  wpm: number;
  accuracy: number;
  testName: string;
  assessedDate: string;
}

interface ProjectAssessment {
  id: string;
  title: string;
  description: string;
  targetGrade: string;
  maxScore: number;
  dueDate: string;
  assignedDate: string;
  submissions: ProjectSubmission[];
}

interface ProjectSubmission {
  studentId: string;
  studentName: string;
  score: number | null;
  feedback: string;
  submittedAt: string | null;
  status: 'Pending' | 'Submitted' | 'Graded';
}

// --- Mock Data ---
const SKILL_CATEGORIES = [
  "Word Processing",
  "Spreadsheets", 
  "Digital Safety",
  "Internet Research",
  "Presentation Design",
  "Basic Coding (Scratch)",
  "Email & Communication",
  "File Management"
];

const INITIAL_COMPETENCIES: CompetencyRecord[] = [
  { id: "comp-1", studentId: "1", studentName: "Brian Kiptoo", admissionNo: "A827361", grade: "4", stream: "Blue", skillCategory: "Word Processing", level: "EE", evaluatedDate: "2024-10-15", remarks: "Excellent formatting skills" },
  { id: "comp-2", studentId: "2", studentName: "Mary Atieno", admissionNo: "A827362", grade: "4", stream: "Blue", skillCategory: "Spreadsheets", level: "ME", evaluatedDate: "2024-10-14", remarks: "Good formula usage" },
  { id: "comp-3", studentId: "3", studentName: "Emmanuel Maina", admissionNo: "A827363", grade: "4", stream: "Green", skillCategory: "Digital Safety", level: "AE", evaluatedDate: "2024-10-13", remarks: "Needs practice on privacy settings" },
  { id: "comp-4", studentId: "4", studentName: "Sheila Chepkoech", admissionNo: "A827364", grade: "5", stream: "Alpha", skillCategory: "Internet Research", level: "EE", evaluatedDate: "2024-10-12", remarks: "Outstanding source evaluation" },
];

const INITIAL_TYPING: TypingRecord[] = [
  { id: "type-1", studentId: "1", studentName: "Brian Kiptoo", grade: "4", stream: "Blue", wpm: 42, accuracy: 96, testName: "Grade 4 Standard", assessedDate: "2024-10-10" },
  { id: "type-2", studentId: "2", studentName: "Mary Atieno", grade: "4", stream: "Blue", wpm: 28, accuracy: 92, testName: "Grade 4 Standard", assessedDate: "2024-10-10" },
  { id: "type-3", studentId: "3", studentName: "Emmanuel Maina", grade: "4", stream: "Green", wpm: 18, accuracy: 85, testName: "Grade 4 Standard", assessedDate: "2024-10-09" },
  { id: "type-4", studentId: "4", studentName: "Sheila Chepkoech", grade: "5", stream: "Alpha", wpm: 35, accuracy: 94, testName: "Grade 5 Intermediate", assessedDate: "2024-10-08" },
];

const INITIAL_PROJECTS: ProjectAssessment[] = [
  {
    id: "proj-1",
    title: "Creating a Digital Presentation",
    description: "Design a 5-slide presentation about Kenyan wildlife using LibreOffice Impress.",
    targetGrade: "Grade 5",
    maxScore: 100,
    dueDate: "2024-11-15",
    assignedDate: "2024-10-01",
    submissions: [
      { studentId: "4", studentName: "Sheila Chepkoech", score: 92, feedback: "Excellent design and content", submittedAt: "2024-11-10", status: "Graded" },
      { studentId: "5", studentName: "David Mutua", score: null, feedback: "", submittedAt: null, status: "Pending" },
    ]
  },
  {
    id: "proj-2",
    title: "Basic Scratch Animation",
    description: "Create an animated story with at least 3 sprites and dialogue.",
    targetGrade: "Grade 4",
    maxScore: 100,
    dueDate: "2024-11-20",
    assignedDate: "2024-10-05",
    submissions: [
      { studentId: "1", studentName: "Brian Kiptoo", score: 88, feedback: "Creative storyline", submittedAt: "2024-11-18", status: "Graded" },
      { studentId: "2", studentName: "Mary Atieno", score: 75, feedback: "Good sprite interaction", submittedAt: "2024-11-19", status: "Graded" },
      { studentId: "3", studentName: "Emmanuel Maina", score: null, feedback: "", submittedAt: null, status: "Submitted" },
    ]
  },
];

const getSpeedLevel = (wpm: number) => {
  if (wpm >= 40) return { label: "Advanced", color: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: <Target size={12} className="text-emerald-600" /> };
  if (wpm >= 20) return { label: "Intermediate", color: "bg-blue-50 text-blue-700 border-blue-100", icon: <MousePointer size={12} className="text-blue-600" /> };
  return { label: "Beginner", color: "bg-amber-50 text-amber-700 border-amber-100", icon: <Keyboard size={12} className="text-amber-600" /> };
};

const getLevelBadge = (level: 'EE' | 'ME' | 'AE' | 'BE') => {
  const styles = {
    EE: "bg-emerald-50 text-emerald-700 border-emerald-100",
    ME: "bg-blue-50 text-blue-700 border-blue-100",
    AE: "bg-amber-50 text-amber-700 border-amber-100",
    BE: "bg-rose-50 text-rose-700 border-rose-100",
  };
  const labels = { EE: "Exceeding", ME: "Meeting", AE: "Approaching", BE: "Below" };
  return { style: styles[level], label: labels[level] };
};

const DigitalSkillsAssessment = () => {
  // --- States ---
  const [activeTab, setActiveTab] = useState("competencies");
  
  // Competencies
  const [competencies, setCompetencies] = useState<CompetencyRecord[]>(INITIAL_COMPETENCIES);
  const [compSearch, setCompSearch] = useState("");
  const [compGradeFilter, setCompGradeFilter] = useState("all");
  const [compSkillFilter, setCompSkillFilter] = useState("all");
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<CompetencyRecord | null>(null);
  
  // Typing
  const [typingRecords, setTypingRecords] = useState<TypingRecord[]>(INITIAL_TYPING);
  const [typeSearch, setTypeSearch] = useState("");
  const [typeGradeFilter, setTypeGradeFilter] = useState("all");
  const [typeSpeedFilter, setTypeSpeedFilter] = useState("all");
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  
  // Projects
  const [projects, setProjects] = useState<ProjectAssessment[]>(INITIAL_PROJECTS);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [gradingProject, setGradingProject] = useState<ProjectAssessment | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<ProjectSubmission | null>(null);

  // --- Form States ---
  const [compForm, setCompForm] = useState({
    studentId: "",
    skillCategory: "Word Processing",
    level: "ME" as 'EE' | 'ME' | 'AE' | 'BE',
    remarks: ""
  });
  
  const [typeForm, setTypeForm] = useState({
    studentId: "",
    wpm: "",
    accuracy: "95",
    testName: "Standard Assessment"
  });

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    targetGrade: "Grade 4",
    maxScore: "100",
    dueDate: ""
  });

  const [gradeForm, setGradeForm] = useState({
    score: "",
    feedback: ""
  });

  // --- Derived Data ---
  const filteredCompetencies = useMemo(() => {
    return competencies.filter(c => {
      const matchesSearch = c.studentName.toLowerCase().includes(compSearch.toLowerCase()) || 
                           c.admissionNo.toLowerCase().includes(compSearch.toLowerCase());
      const matchesGrade = compGradeFilter === "all" || c.grade === compGradeFilter;
      const matchesSkill = compSkillFilter === "all" || c.skillCategory === compSkillFilter;
      return matchesSearch && matchesGrade && matchesSkill;
    });
  }, [competencies, compSearch, compGradeFilter, compSkillFilter]);

  const compStats = useMemo(() => {
    const total = new Set(competencies.map(c => c.studentId)).size;
    const ee = competencies.filter(c => c.level === 'EE').length;
    const me = competencies.filter(c => c.level === 'ME').length;
    const ae = competencies.filter(c => c.level === 'AE').length;
    const be = competencies.filter(c => c.level === 'BE').length;
    return { total, ee, me, ae, be, below: ae + be };
  }, [competencies]);

  const filteredTyping = useMemo(() => {
    return typingRecords.filter(t => {
      const matchesSearch = t.studentName.toLowerCase().includes(typeSearch.toLowerCase());
      const matchesGrade = typeGradeFilter === "all" || t.grade === typeGradeFilter;
      const speedLevel = getSpeedLevel(t.wpm).label;
      const matchesSpeed = typeSpeedFilter === "all" || speedLevel === typeSpeedFilter;
      return matchesSearch && matchesGrade && matchesSpeed;
    });
  }, [typingRecords, typeSearch, typeGradeFilter, typeSpeedFilter]);

  const typeStats = useMemo(() => {
    if (typingRecords.length === 0) return { avgWpm: 0, topWpm: 0, sessions: 0 };
    const avg = Math.round(typingRecords.reduce((a, b) => a + b.wpm, 0) / typingRecords.length);
    const top = Math.max(...typingRecords.map(t => t.wpm));
    return { avgWpm: avg, topWpm: top, sessions: typingRecords.length };
  }, [typingRecords]);

  // --- Handlers ---
  const handleCompSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compForm.studentId) return showError("Please select a student.");
    
    const student = STUDENTS.find(s => s.id === compForm.studentId);
    if (!student) return showError("Student not found.");

    if (editingComp) {
      setCompetencies(prev => prev.map(c => c.id === editingComp.id ? { ...c, ...compForm, studentName: student.name, admissionNo: student.assessment, grade: student.grade, stream: student.stream } : c));
      showSuccess("Competency updated successfully.");
    } else {
      const newComp: CompetencyRecord = {
        id: `comp-${Date.now()}`,
        ...compForm,
        studentName: student.name,
        admissionNo: student.assessment,
        grade: student.grade,
        stream: student.stream,
        evaluatedDate: new Date().toISOString().split('T')[0]
      };
      setCompetencies([newComp, ...competencies]);
      showSuccess("Competency recorded successfully.");
    }
    setIsCompModalOpen(false);
    setEditingComp(null);
    setCompForm({ studentId: "", skillCategory: "Word Processing", level: "ME", remarks: "" });
  };

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.studentId) return showError("Please select a student.");
    if (!typeForm.wpm) return showError("Please enter WPM score.");

    const student = STUDENTS.find(s => s.id === typeForm.studentId);
    if (!student) return showError("Student not found.");

    const newRecord: TypingRecord = {
      id: `type-${Date.now()}`,
      studentId: typeForm.studentId,
      studentName: student.name,
      grade: student.grade,
      stream: student.stream,
      wpm: parseInt(typeForm.wpm),
      accuracy: parseInt(typeForm.accuracy),
      testName: typeForm.testName,
      assessedDate: new Date().toISOString().split('T')[0]
    };
    setTypingRecords([newRecord, ...typingRecords]);
    setIsTypeModalOpen(false);
    setTypeForm({ studentId: "", wpm: "", accuracy: "95", testName: "Standard Assessment" });
    showSuccess("Typing test result logged successfully.");
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title || !projectForm.dueDate) return showError("Please fill all required fields.");

    const newProject: ProjectAssessment = {
      id: `proj-${Date.now()}`,
      ...projectForm,
      maxScore: parseInt(projectForm.maxScore),
      assignedDate: new Date().toISOString().split('T')[0],
      submissions: STUDENTS
        .filter(s => s.grade === projectForm.targetGrade.replace('Grade ', ''))
        .map(s => ({
          studentId: s.id,
          studentName: s.name,
          score: null,
          feedback: "",
          submittedAt: null,
          status: "Pending" as const
        }))
    };
    setProjects([newProject, ...projects]);
    setIsProjectModalOpen(false);
    setProjectForm({ title: "", description: "", targetGrade: "Grade 4", maxScore: "100", dueDate: "" });
    showSuccess("Assessment project created successfully.");
  };

  const handleOpenGradeModal = (project: ProjectAssessment, submission: ProjectSubmission) => {
    setGradingProject(project);
    setGradingSubmission(submission);
    setGradeForm({ score: submission.score?.toString() || "", feedback: submission.feedback });
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingProject || !gradingSubmission) return;
    if (!gradeForm.score) return showError("Please enter a score.");

    const score = parseInt(gradeForm.score);
    if (score < 0 || score > (gradingProject.maxScore || 100)) return showError(`Score must be between 0 and ${gradingProject.maxScore || 100}.`);

    setProjects(prev => prev.map(p => {
      if (p.id !== gradingProject!.id) return p;
      return {
        ...p,
        submissions: p.submissions.map(s => 
          s.studentId === gradingSubmission!.studentId 
            ? { ...s, score, feedback: gradeForm.feedback, status: "Graded" as const, submittedAt: new Date().toISOString().split('T')[0] }
            : s
        )
      };
    }));
    showSuccess(`Score saved for ${gradingSubmission.studentName}.`);
    setGradingProject(null);
    setGradingSubmission(null);
    setGradeForm({ score: "", feedback: "" });
  };

  const handleEditComp = (comp: CompetencyRecord) => {
    setEditingComp(comp);
    setCompForm({
      studentId: comp.studentId,
      skillCategory: comp.skillCategory,
      level: comp.level,
      remarks: comp.remarks
    });
    setIsCompModalOpen(true);
  };

  // --- Render ---
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Digital Skills Assessment</h1>
            <p className="text-muted-foreground font-medium">Record and evaluate practical ICT competencies, keyboarding proficiency, and project-based learning outcomes.</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-14 mb-8 flex w-fit overflow-x-auto">
          <TabsTrigger value="competencies" className="rounded-xl px-8 h-full font-bold text-xs gap-2">
            <Award size={16} /> Practical Competencies
          </TabsTrigger>
          <TabsTrigger value="typing" className="rounded-xl px-8 h-full font-bold text-xs gap-2">
            <Keyboard size={16} /> Keyboarding & Typing
          </TabsTrigger>
          <TabsTrigger value="projects" className="rounded-xl px-8 h-full font-bold text-xs gap-2">
            <FileCheck size={16} /> Project Evaluations
          </TabsTrigger>
        </TabsList>

        {/* --- TAB 1: PRACTICAL COMPETENCIES --- */}
        <TabsContent value="competencies" className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Students Evaluated', value: compStats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Exceeding (EE)', value: compStats.ee, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Meeting (ME)', value: compStats.me, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Approaching/Below', value: compStats.below, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((s, i) => (
              <Card key={i} className="border-none shadow-sm rounded-[2rem] bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-2xl", s.bg)}>
                    <s.icon className={s.color} size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p>
                    <h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{s.value}</h3>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-5">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex flex-1 gap-4 w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    placeholder="Search by name or admission no..." 
                    className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium"
                    value={compSearch}
                    onChange={(e) => setCompSearch(e.target.value)}
                  />
                </div>
                <Select value={compGradeFilter} onValueChange={setCompGradeFilter}>
                  <SelectTrigger className="w-[160px] h-12 rounded-2xl bg-slate-50 border-none font-bold">
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {GRADES_DATA.map(g => <SelectItem key={g.id} value={g.name.replace(/[^0-9]/g, '')}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={compSkillFilter} onValueChange={setCompSkillFilter}>
                  <SelectTrigger className="w-[200px] h-12 rounded-2xl bg-slate-50 border-none font-bold">
                    <SelectValue placeholder="All Skills" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Skill Categories</SelectItem>
                    {SKILL_CATEGORIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-100"
                onClick={() => { setEditingComp(null); setCompForm({ studentId: "", skillCategory: "Word Processing", level: "ME", remarks: "" }); setIsCompModalOpen(true); }}
              >
                <Plus size={18} /> Record Competency
              </Button>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-slate-500 border-b bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Student</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Adm No</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Class</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Skill Category</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Level</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Date</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Remarks</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCompetencies.map((c) => {
                      const badge = getLevelBadge(c.level);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5 font-bold text-slate-900">{c.studentName}</td>
                          <td className="px-8 py-5 font-mono text-slate-500">{c.admissionNo}</td>
                          <td className="px-8 py-5">
                            <Badge variant="outline" className="rounded-lg border-slate-200">{c.grade} {c.stream}</Badge>
                          </td>
                          <td className="px-8 py-5 font-medium text-slate-700">{c.skillCategory}</td>
                          <td className="px-8 py-5 text-center">
                            <Badge className={cn("rounded-lg border-none font-bold", badge.style)}>{c.level}</Badge>
                          </td>
                          <td className="px-8 py-5 text-slate-500">{c.evaluatedDate}</td>
                          <td className="px-8 py-5 text-slate-600 max-w-[200px] truncate">{c.remarks}</td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-indigo-600 hover:bg-indigo-50" onClick={() => handleEditComp(c)}><Edit2 size={16} /></Button>
                              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-rose-500 hover:bg-rose-50" onClick={() => { setCompetencies(prev => prev.filter(x => x.id !== c.id)); showSuccess("Record deleted."); }}><Trash2 size={16} /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 2: KEYBOARDING & TYPING --- */}
        <TabsContent value="typing" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Keyboard size={24} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Class Average WPM</p>
                  <h3 className="text-3xl font-black text-slate-900">{typeStats.avgWpm}</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><TrendingUp size={24} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Top Typist Speed</p>
                  <h3 className="text-3xl font-black text-emerald-600">{typeStats.topWpm} WPM</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><BarChart2 size={24} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Assessment Sessions</p>
                  <h3 className="text-3xl font-black text-slate-900">{typeStats.sessions}</h3>
                </div>
              </div>
            </Card>
          </div>

          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-5">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex flex-1 gap-4 w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    placeholder="Search student name..." 
                    className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium"
                    value={typeSearch}
                    onChange={(e) => setTypeSearch(e.target.value)}
                  />
                </div>
                <Select value={typeGradeFilter} onValueChange={setTypeGradeFilter}>
                  <SelectTrigger className="w-[160px] h-12 rounded-2xl bg-slate-50 border-none font-bold">
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {GRADES_DATA.map(g => <SelectItem key={g.id} value={g.name.replace(/[^0-9]/g, '')}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={typeSpeedFilter} onValueChange={setTypeSpeedFilter}>
                  <SelectTrigger className="w-[180px] h-12 rounded-2xl bg-slate-50 border-none font-bold">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Speed Levels</SelectItem>
                    <SelectItem value="Beginner">Beginner (< 20 WPM)</SelectItem>
                    <SelectItem value="Intermediate">Intermediate (20-40 WPM)</SelectItem>
                    <SelectItem value="Advanced">Advanced (40+ WPM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-100"
                onClick={() => setIsTypeModalOpen(true)}
              >
                <Plus size={18} /> Log Typing Test
              </Button>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-slate-500 border-b bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Student</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Class</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">WPM</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Accuracy</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Speed Level</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Test Name</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Date</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTyping.map((t) => {
                      const speed = getSpeedLevel(t.wpm);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5 font-bold text-slate-900">{t.studentName}</td>
                          <td className="px-8 py-5">
                            <Badge variant="outline" className="rounded-lg border-slate-200">{t.grade} {t.stream}</Badge>
                          </td>
                          <td className="px-8 py-5 text-center font-black text-2xl text-indigo-600">{t.wpm}</td>
                          <td className="px-8 py-5 text-center font-bold text-slate-700">{t.accuracy}%</td>
                          <td className="px-8 py-5 text-center">
                            <Badge className={cn("rounded-lg border-none font-bold gap-1.5", speed.color)}>
                              {speed.icon} {speed.label}
                            </Badge>
                          </td>
                          <td className="px-8 py-5 text-slate-600">{t.testName}</td>
                          <td className="px-8 py-5 text-slate-500">{t.assessedDate}</td>
                          <td className="px-8 py-5 text-right">
                            <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-rose-500 hover:bg-rose-50" onClick={() => { setTypingRecords(prev => prev.filter(x => x.id !== t.id)); showSuccess("Record deleted."); }}><Trash2 size={16} /></Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 3: PROJECT-BASED EVALUATIONS --- */}
        <TabsContent value="projects" className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-black text-slate-900">Assessment Projects</h2>
            <Button 
              className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-100"
              onClick={() => setIsProjectModalOpen(true)}
            >
              <Plus size={18} /> Create New Project
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.map((project) => {
              const gradedCount = project.submissions.filter(s => s.status === 'Graded').length;
              const submittedCount = project.submissions.filter(s => s.status === 'Submitted').length;
              const pendingCount = project.submissions.filter(s => s.status === 'Pending').length;
              const avgScore = gradedCount > 0 
                ? Math.round(project.submissions.filter(s => s.status === 'Graded').reduce((a, b) => a + (b.score || 0), 0) / gradedCount)
                : 0;

              return (
                <Card key={project.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white overflow-hidden">
                  <CardHeader className="p-6 border-b bg-slate-50/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-black text-slate-900">{project.title}</CardTitle>
                        <p className="text-sm text-slate-500 mt-1">{project.targetGrade} • Due: {project.dueDate}</p>
                      </div>
                      <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-600">Max: {project.maxScore}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <p className="text-sm text-slate-600 line-clamp-2">{project.description}</p>
                    
                    <div className="grid grid-cols-3 gap-3 text-center p-4 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="text-2xl font-black text-emerald-600">{gradedCount}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Graded</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-blue-600">{submittedCount}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Submitted</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Pending</p>
                      </div>
                    </div>

                    {gradedCount > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Award size={16} className="text-amber-500" />
                        <span className="font-bold text-slate-700">Class Average: </span>
                        <span className="font-black text-indigo-600">{avgScore}%</span>
                      </div>
                    )}

                    <div className="space-y-2 pt-2 border-t">
                      {project.submissions.map((sub) => (
                        <div key={sub.studentId} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                              {sub.studentName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{sub.studentName}</p>
                              <p className="text-[10px] text-slate-400">{sub.status}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {sub.status === 'Graded' && (
                              <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold">{sub.score}%</Badge>
                            )}
                            {sub.status === 'Submitted' && (
                              <Badge className="bg-blue-50 text-blue-700 border-none font-bold">Awaiting Grading</Badge>
                            )}
                            {sub.status === 'Pending' && (
                              <Badge className="bg-slate-100 text-slate-500 border-none font-bold">Not Submitted</Badge>
                            )}
                            {(sub.status === 'Submitted' || sub.status === 'Graded') && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="rounded-xl h-9 px-3 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 gap-1.5"
                                onClick={() => handleOpenGradeModal(project, sub)}
                              >
                                {sub.status === 'Graded' ? <Edit2 size={14} /> : <FileCheck size={14} />} {sub.status === 'Graded' ? 'Update' : 'Grade'}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* --- MODALS --- */}
      
      {/* Competency Modal */}
      <Modal
        isOpen={isCompModalOpen}
        onClose={() => { setIsCompModalOpen(false); setEditingComp(null); setCompForm({ studentId: "", skillCategory: "Word Processing", level: "ME", remarks: "" }); }}
        title={editingComp ? "Update Competency Evaluation" : "Record Practical Competency"}
        description="Evaluate learner's practical ICT skill proficiency against CBC rubric levels."
        footer={<div className="flex gap-2 justify-end w-full"><Button variant="ghost" onClick={() => { setIsCompModalOpen(false); setEditingComp(null); setCompForm({ studentId: "", skillCategory: "Word Processing", level: "ME", remarks: "" }); }} className="rounded-xl font-bold h-12 px-6">Cancel</Button><Button onClick={handleCompSubmit} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-12 px-8 text-white shadow-lg shadow-indigo-100 gap-2"><Award size={18} /> Save Evaluation</Button></div>}
      >
        <form onSubmit={handleCompSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Select Learner</Label>
            <Select value={compForm.studentId} onValueChange={(val) => setCompForm({...compForm, studentId: val})}>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Choose student..." /></SelectTrigger>
              <SelectContent>
                {STUDENTS.map(s => <SelectItem key={s.id} value={s.id}>{s.name} (Grade {s.grade} {s.stream}) - {s.assessment}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Skill Category</Label>
            <Select value={compForm.skillCategory} onValueChange={(val) => setCompForm({...compForm, skillCategory: val})}>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>{SKILL_CATEGORIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Competency Level</Label>
            <Select value={compForm.level} onValueChange={(val: 'EE' | 'ME' | 'AE' | 'BE') => setCompForm({...compForm, level: val})}>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EE">EE - Exceeding Expectations</SelectItem>
                <SelectItem value="ME">ME - Meeting Expectations</SelectItem>
                <SelectItem value="AE">AE - Approaching Expectations</SelectItem>
                <SelectItem value="BE">BE - Below Expectations</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Remarks / Observations</Label>
            <Textarea value={compForm.remarks} onChange={(e) => setCompForm({...compForm, remarks: e.target.value})} placeholder="Teacher observations..." className="rounded-xl bg-slate-50 border-none min-h-[80px]" />
          </div>
        </form>
      </Modal>

      {/* Typing Modal */}
      <Modal
        isOpen={isTypeModalOpen}
        onClose={() => { setIsTypeModalOpen(false); setTypeForm({ studentId: "", wpm: "", accuracy: "95", testName: "Standard Assessment" }); }}
        title="Log Typing Test Result"
        description="Record learner's keyboarding speed and accuracy assessment."
        footer={<div className="flex gap-2 justify-end w-full"><Button variant="ghost" onClick={() => { setIsTypeModalOpen(false); setTypeForm({ studentId: "", wpm: "", accuracy: "95", testName: "Standard Assessment" }); }} className="rounded-xl font-bold h-12 px-6">Cancel</Button><Button onClick={handleTypeSubmit} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-12 px-8 text-white shadow-lg shadow-indigo-100 gap-2"><Keyboard size={18} /> Save Result</Button></div>}
      >
        <form onSubmit={handleTypeSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Select Learner</Label>
            <Select value={typeForm.studentId} onValueChange={(val) => setTypeForm({...typeForm, studentId: val})}>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Choose student..." /></SelectTrigger>
              <SelectContent>{STUDENTS.map(s => <SelectItem key={s.id} value={s.id}>{s.name} (Grade {s.grade} {s.stream})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Words Per Minute (WPM)</Label>
              <Input type="number" min="0" max="150" value={typeForm.wpm} onChange={(e) => setTypeForm({...typeForm, wpm: e.target.value})} placeholder="e.g. 35" className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Accuracy (%)</Label>
              <Input type="number" min="0" max="100" value={typeForm.accuracy} onChange={(e) => setTypeForm({...typeForm, accuracy: e.target.value})} placeholder="e.g. 95" className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Test Name / Level</Label>
            <Input value={typeForm.testName} onChange={(e) => setTypeForm({...typeForm, testName: e.target.value})} placeholder="e.g. Grade 4 Term 1 Assessment" className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
          </div>
        </form>
      </Modal>

      {/* Project Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => { setIsProjectModalOpen(false); setProjectForm({ title: "", description: "", targetGrade: "Grade 4", maxScore: "100", dueDate: "" }); }}
        title="Create New Assessment Project"
        description="Design a project-based assessment with rubric criteria for CBC evaluation."
        footer={<div className="flex gap-2 justify-end w-full"><Button variant="ghost" onClick={() => { setIsProjectModalOpen(false); setProjectForm({ title: "", description: "", targetGrade: "Grade 4", maxScore: "100", dueDate: "" }); }} className="rounded-xl font-bold h-12 px-6">Cancel</Button><Button onClick={handleProjectSubmit} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-12 px-8 text-white shadow-lg shadow-indigo-100 gap-2"><FileCheck size={18} /> Create Project</Button></div>}
      >
        <form onSubmit={handleProjectSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Project Title</Label>
            <Input value={projectForm.title} onChange={(e) => setProjectForm({...projectForm, title: e.target.value})} placeholder="e.g. Creating a Digital Newsletter" className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Description & Requirements</Label>
            <Textarea value={projectForm.description} onChange={(e) => setProjectForm({...projectForm, description: e.target.value})} placeholder="Detailed project brief, tools required, success criteria..." className="rounded-xl bg-slate-50 border-none min-h-[100px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Target Grade</Label>
              <Select value={projectForm.targetGrade} onValueChange={(val) => setProjectForm({...projectForm, targetGrade: val})}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>{GRADES_DATA.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Maximum Score</Label>
              <Input type="number" value={projectForm.maxScore} onChange={(e) => setProjectForm({...projectForm, maxScore: e.target.value})} placeholder="100" className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Due Date</Label>
            <Input type="date" value={projectForm.dueDate} onChange={(e) => setProjectForm({...projectForm, dueDate: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
          </div>
        </form>
      </Modal>

      {/* Grading Modal */}
      <Modal
        isOpen={!!gradingProject && !!gradingSubmission}
        onClose={() => { setGradingProject(null); setGradingSubmission(null); setGradeForm({ score: "", feedback: "" }); }}
        title={`Grade Submission: ${gradingSubmission?.studentName}`}
        description={`Project: ${gradingProject?.title} (Max Score: ${gradingProject?.maxScore})`}
        footer={<div className="flex gap-2 justify-end w-full"><Button variant="ghost" onClick={() => { setGradingProject(null); setGradingSubmission(null); setGradeForm({ score: "", feedback: "" }); }} className="rounded-xl font-bold h-12 px-6">Cancel</Button><Button onClick={handleGradeSubmit} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold h-12 px-8 text-white shadow-lg shadow-indigo-100 gap-2"><Award size={18} /> Save Grade</Button></div>}
      >
        <form onSubmit={handleGradeSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Score (0 - {gradingProject?.maxScore || 100})</Label>
            <Input type="number" min="0" max={gradingProject?.maxScore || 100} value={gradeForm.score} onChange={(e) => setGradeForm({...gradeForm, score: e.target.value})} placeholder="e.g. 85" className="h-12 rounded-xl bg-slate-50 border-none font-bold text-2xl text-center" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Qualitative Feedback</Label>
            <Textarea value={gradeForm.feedback} onChange={(e) => setGradeForm({...gradeForm, feedback: e.target.value})} placeholder="Strengths, areas for improvement, specific observations..." className="rounded-xl bg-slate-50 border-none min-h-[100px]" />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DigitalSkillsAssessment;