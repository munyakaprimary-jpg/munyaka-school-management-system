"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import BackButton from '@/components/ui/BackButton';
import { 
  FileCheck, 
  ClipboardCheck, 
  Award, 
  Users, 
  Search, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Layers, 
  Star, 
  Target, 
  Activity, 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  X 
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface ProjectRecord {
  id: string;
  title: string;
  grade: string;
  stream: string;
  subject: string;
  rubricCriteria: string;
  maxPoints: number;
  submissionsTotal: number;
  submissionsGraded: number;
  status: 'Active' | 'Completed' | 'Pending Grading' | 'Draft';
  dueDate: string;
  createdBy: string;
  createdDate: string;
}

interface RubricRecord {
  id: string;
  projectId: string;
  studentName: string;
  grade: string;
  stream: string;
  scores: Record<string, number>;
  totalScore: number;
  percentage: number;
  level: 'EE' | 'ME' | 'AE' | 'BE';
  gradedBy: string;
  gradedDate: string;
  feedback: string;
}

interface ObservationRecord {
  id: string;
  studentName: string;
  grade: string;
  stream: string;
  activity: string;
  competency: string;
  observation: string;
  rating: 'EE' | 'ME' | 'AE' | 'BE';
  observedBy: string;
  observedDate: string;
  evidence?: string;
}

const MOCK_PROJECTS: ProjectRecord[] = [
  { 
    id: "1", 
    title: "CBC Scratch Animation Project", 
    grade: "Grade 4", 
    stream: "Blue", 
    subject: "Creative Arts & Digital Literacy",
    rubricCriteria: "Creativity (25), Logic & Coding (25), Presentation (25), Documentation (25)", 
    maxPoints: 100, 
    submissionsTotal: 42, 
    submissionsGraded: 38, 
    status: "Active", 
    dueDate: "2024-11-15",
    createdBy: "Ms. Jane Mwangi",
    createdDate: "2024-10-01"
  },
  // ... more projects
];

const MOCK_RUBRICS: RubricRecord[] = [
  // ... rubric records
];

const MOCK_OBSERVATIONS: ObservationRecord[] = [
  // ... observations
];

const GRADE_OPTIONS = [
  "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"
];

const STREAM_OPTIONS = ["Blue", "Green", "Yellow", "Alpha", "Beta", "North", "South", "East", "West"];

const SUBJECT_OPTIONS = [
  "Creative Arts & Digital Literacy",
  "Language & Creative Arts", 
  "Science & Technology",
  "Pre-Technical Studies",
  "Computer Studies",
  "Mathematics & ICT",
  "Agriculture & Nutrition",
  "Social Studies",
  "Religious Education"
];

const COMPETENCY_OPTIONS = [
  "Collaboration & Communication",
  "Critical Thinking",
  "Creativity & Imagination",
  "Communication & Persuasion",
  "Scientific Inquiry",
  "Teamwork & Leadership",
  "Digital Literacy",
  "Practical Skills",
  "Citizenship & Social Responsibility",
  "Problem Solving",
  "Self-Efficacy"
];

const PracticalCompetencies = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'rubrics' | 'observations'>('projects');
  
  // ... rest of the component

  return (
    <div className="p-4 space-y-4">
      {/* Metric Cards - using compact style */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        <Card className="border-none shadow-sm bg-white p-2 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Layers size={20} />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Active Projects</p>
              <h3 className="text-sm font-black text-slate-900 leading-none mt-0.5">42</h3>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-white p-2 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Completed</p>
              <h3 className="text-sm font-black text-emerald-700 leading-none mt-0.5">38</h3>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-white p-2 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-2xl">
              <AlertCircle size={16} />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Pending Grading</p>
              <h3 className="text-sm font-black text-amber-700 leading-none mt-0.5">12</h3>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-white p-2 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-2xl">
              <ClipboardCheck size={18} />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Graded %</p>
              <h3 className="text-sm font-black text-blue-700 leading-none mt-0.5">90%</h3>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-white p-2 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-2xl">
              <FileCheck size={18} />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Total Submissions</p>
              <h3 className="text-sm font-black text-purple-700 leading-none mt-0.5">150</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="border-none shadow-sm bg-white p-3 rounded-lg">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input 
              placeholder="Search by project title, subject, or teacher..." 
              className="pl-10 h-10 rounded-2xl border-none bg-slate-50 font-medium"
              value={projectSearchTerm}
              onChange={(e) => setProjectSearchTerm(e.target.value)}
            />
          </div>
          <Select value={projectGradeFilter} onValueChange={setProjectGradeFilter}>
            <SelectTrigger className="w-[160px] h-10 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Grades</SelectItem>
              {GRADE_OPTIONS.map(grade => <SelectItem key={grade} value={grade}>{grade}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={projectStatusFilter} onValueChange={setProjectStatusFilter}>
            <SelectTrigger className="w-[140px] h-10 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Pending Grading">Pending Grading</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10 px-4 rounded-2xl border-slate-200 bg-white font-bold gap-2">
            <Download size={14} /> Export CSV
          </Button>
        </div>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => {
            const progress = project.submissionsTotal > 0 
              ? Math.round((project.submissionsGraded / project.submissionsTotal) * 100) 
              : 0;
            
            return (
              <Card key={project.id} className="border-none shadow-sm bg-white p-3 rounded-lg group">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-sm font-bold text-indigo-500 flex items-center gap-1">
                        <Layers size={12} /> {project.grade} • {project.stream}
                      </p>
                      <p className="text-xs text-slate-500">{project.subject}</p>
                    </div>
                    {getProjectStatusBadge(project.status)}
                  </div>
                  
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-xs font-black uppercase text-slate-400 tracking-wider mb-1">
                      <span>Rubric Criteria</span>
                      <span>{project.maxPoints} PTS</span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{project.rubricCriteria}</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs font-black uppercase text-slate-400 tracking-wider mb-1">
                      <span>Grading Progress</span>
                      <span className="text-indigo-600">{project.submissionsGraded} / {project.submissionsTotal} Graded</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span>Due: {project.dueDate}</span>
                    <span className="text-slate-500">By: {project.createdBy}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <div className="col-span-full text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-10 h-10 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-200 shadow-sm">
              <Search size={28} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">No projects found</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">No projects match the current search and filter criteria.</p>
            <Button 
              onClick={() => setIsAddProjectOpen(true)}
              className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100"
            >
              Create First Project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticalCompetencies;