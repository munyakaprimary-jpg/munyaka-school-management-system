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
  { 
    id: "2", 
    title: "School Newsletter Layout Design", 
    grade: "Grade 5", 
    stream: "Alpha", 
    subject: "Language & Creative Arts",
    rubricCriteria: "Design & Layout (30), Content Quality (30), Typography (20), Creativity (20)", 
    maxPoints: 100, 
    submissionsTotal: 38, 
    submissionsGraded: 38, 
    status: "Completed", 
    dueDate: "2024-10-20",
    createdBy: "Mr. John Kamau",
    createdDate: "2024-09-15"
  },
  { 
    id: "3", 
    title: "Digital Presentation on Environment", 
    grade: "Grade 6", 
    stream: "Green", 
    subject: "Science & Technology",
    rubricCriteria: "Research Depth (30), Slide Design (25), Delivery (25), Q&A Handling (20)", 
    maxPoints: 100, 
    submissionsTotal: 40, 
    submissionsGraded: 22, 
    status: "Pending Grading", 
    dueDate: "2024-11-30",
    createdBy: "Ms. Sarah Chebet",
    createdDate: "2024-10-10"
  },
  { 
    id: "4", 
    title: "Interactive Quiz Game (Python)", 
    grade: "Grade 7", 
    stream: "Alpha", 
    subject: "Pre-Technical Studies",
    rubricCriteria: "Code Logic (35), UI/UX Design (25), Functionality (25), Error Handling (15)", 
    maxPoints: 100, 
    submissionsTotal: 35, 
    submissionsGraded: 15, 
    status: "Active", 
    dueDate: "2024-12-05",
    createdBy: "Mr. Peter Omondi",
    createdDate: "2024-10-20"
  },
  { 
    id: "5", 
    title: "E-Portfolio Website Design", 
    grade: "Grade 8", 
    stream: "Beta", 
    subject: "Computer Studies",
    rubricCriteria: "HTML/CSS Structure (30), Content Organization (25), Responsiveness (25), Creativity (20)", 
    maxPoints: 100, 
    submissionsTotal: 30, 
    submissionsGraded: 30, 
    status: "Completed", 
    dueDate: "2024-10-28",
    createdBy: "Ms. Grace Njeri",
    createdDate: "2024-09-01"
  },
  { 
    id: "6", 
    title: "Data Visualization Dashboard", 
    grade: "Grade 7", 
    stream: "North", 
    subject: "Mathematics & ICT",
    rubricCriteria: "Data Accuracy (30), Chart Selection (25), Insights (25), Presentation (20)", 
    maxPoints: 100, 
    submissionsTotal: 35, 
    submissionsGraded: 8, 
    status: "Pending Grading", 
    dueDate: "2024-11-25",
    createdBy: "Mr. Peter Omondi",
    createdDate: "2024-10-25"
  },
];

const MOCK_RUBRICS: RubricRecord[] = [
  { id: "r1", projectId: "1", studentName: "Brian Kiptoo", grade: "Grade 4", stream: "Blue", scores: { "Creativity": 24, "Logic & Coding": 22, "Presentation": 23, "Documentation": 20 }, totalScore: 89, percentage: 89, level: "EE", gradedBy: "Ms. Jane Mwangi", gradedDate: "2024-11-10", feedback: "Excellent creativity and logical structure. Documentation could be more detailed." },
  { id: "r2", projectId: "1", studentName: "Mary Atieno", grade: "Grade 4", stream: "Blue", scores: { "Creativity": 20, "Logic & Coding": 18, "Presentation": 22, "Documentation": 19 }, totalScore: 79, percentage: 79, level: "ME", gradedBy: "Ms. Jane Mwangi", gradedDate: "2024-11-10", feedback: "Good presentation skills. Logic needs strengthening." },
  { id: "r3", projectId: "1", studentName: "Emmanuel Maina", grade: "Grade 4", stream: "Green", scores: { "Creativity": 15, "Logic & Coding": 12, "Presentation": 14, "Documentation": 10 }, totalScore: 51, percentage: 51, level: "ME", gradedBy: "Ms. Jane Mwangi", gradedDate: "2024-11-11", feedback: "Basic understanding shown. Needs more practice with Scratch blocks." },
  { id: "r4", projectId: "2", studentName: "Sheila Chepkoech", grade: "Grade 5", stream: "Alpha", scores: { "Design & Layout": 28, "Content Quality": 27, "Typography": 18, "Creativity": 19 }, totalScore: 92, percentage: 92, level: "EE", gradedBy: "Mr. John Kamau", gradedDate: "2024-10-18", feedback: "Outstanding design sense and content organization." },
  { id: "r5", projectId: "2", studentName: "David Mutua", grade: "Grade 5", stream: "Alpha", scores: { "Design & Layout": 22, "Content Quality": 20, "Typography": 15, "Creativity": 16 }, totalScore: 73, percentage: 73, level: "ME", gradedBy: "Mr. John Kamau", gradedDate: "2024-10-18", feedback: "Solid effort. Typography consistency needs improvement." },
  { id: "r6", projectId: "3", studentName: "Grace Wanjiku", grade: "Grade 6", stream: "Green", scores: { "Research Depth": 25, "Slide Design": 20, "Delivery": 18, "Q&A Handling": 15 }, totalScore: 78, percentage: 78, level: "ME", gradedBy: "Ms. Sarah Chebet", gradedDate: "2024-11-28", feedback: "Good research. Delivery needs more confidence." },
  { id: "r7", projectId: "4", studentName: "Faith Njeri", grade: "Grade 7", stream: "Alpha", scores: { "Code Logic": 32, "UI/UX Design": 22, "Functionality": 20, "Error Handling": 12 }, totalScore: 86, percentage: 86, level: "EE", gradedBy: "Mr. Peter Omondi", gradedDate: "2024-12-01", feedback: "Excellent code structure. UI could be more intuitive." },
  { id: "r8", projectId: "5", studentName: "Helen Moraa", grade: "Grade 8", stream: "Beta", scores: { "HTML/CSS Structure": 28, "Content Organization": 23, "Responsiveness": 22, "Creativity": 18 }, totalScore: 91, percentage: 91, level: "EE", gradedBy: "Ms. Grace Njeri", gradedDate: "2024-10-25", feedback: "Professional-level portfolio. Great responsive design." },
];

const MOCK_OBSERVATIONS: ObservationRecord[] = [
  { id: "obs1", studentName: "Brian Kiptoo", grade: "Grade 4", stream: "Blue", activity: "Group Science Experiment", competency: "Collaboration & Communication", observation: "Took leadership role in group, effectively delegated tasks and communicated findings clearly.", rating: "EE", observedBy: "Ms. Jane Mwangi", observedDate: "2024-11-05", evidence: "Photo of group work" },
  { id: "obs2", studentName: "Mary Atieno", grade: "Grade 4", stream: "Blue", activity: "Class Presentation", competency: "Critical Thinking", observation: "Asked insightful questions during peer presentations, demonstrated analytical thinking.", rating: "ME", observedBy: "Ms. Jane Mwangi", observedDate: "2024-11-06", evidence: "Teacher notes" },
  { id: "obs3", studentName: "Emmanuel Maina", grade: "Grade 4", stream: "Green", activity: "Art & Craft Session", competency: "Creativity & Imagination", observation: "Created unique clay model with intricate details, showed original thinking.", rating: "EE", observedBy: "Ms. Sarah Chebet", observedDate: "2024-11-07", evidence: "Artwork photo" },
  { id: "obs4", studentName: "Sheila Chepkoech", grade: "Grade 5", stream: "Alpha", activity: "Debate Competition", competency: "Communication & Persuasion", observation: "Articulated arguments confidently with evidence, respected opposing views.", rating: "EE", observedBy: "Mr. John Kamau", observedDate: "2024-10-15", evidence: "Video recording" },
  { id: "obs5", studentName: "David Mutua", grade: "Grade 5", stream: "Alpha", activity: "Math Problem Solving", competency: "Critical Thinking", observation: "Struggled with multi-step problems, needs guided practice on problem decomposition.", rating: "AE", observedBy: "Mr. John Kamau", observedDate: "2024-10-16", evidence: "Worksheet" },
  { id: "obs6", studentName: "Grace Wanjiku", grade: "Grade 6", stream: "Green", activity: "Science Fair Project", competency: "Scientific Inquiry", observation: "Formulated clear hypothesis, designed fair test, recorded observations systematically.", rating: "ME", observedBy: "Ms. Sarah Chebet", observedDate: "2024-11-20", evidence: "Project board" },
  { id: "obs7", studentName: "Joseph Kariuki", grade: "Grade 6", stream: "Red", activity: "Physical Education", competency: "Teamwork & Leadership", observation: "Encouraged teammates, demonstrated good sportsmanship throughout the match.", rating: "ME", observedBy: "Mr. Peter Omondi", observedDate: "2024-11-18", evidence: "Teacher observation log" },
  { id: "obs8", studentName: "Faith Njeri", grade: "Grade 7", stream: "Alpha", activity: "Coding Workshop", competency: "Digital Literacy", observation: "Quickly grasped Python syntax, helped peers debug code, showed computational thinking.", rating: "EE", observedBy: "Mr. Peter Omondi", observedDate: "2024-11-22", evidence: "Code screenshots" },
  { id: "obs9", studentName: "George Ochieng", grade: "Grade 7", stream: "North", activity: "Agriculture Practical", competency: "Practical Skills", observation: "Demonstrated proper tool handling and planting techniques, followed safety procedures.", rating: "ME", observedBy: "Ms. Grace Njeri", observedDate: "2024-11-10", evidence: "Practical assessment sheet" },
  { id: "obs10", studentName: "Helen Moraa", grade: "Grade 8", stream: "Beta", activity: "Community Service Project", competency: "Citizenship & Social Responsibility", observation: "Organized cleanup drive, mobilized 20+ peers, documented impact with before/after photos.", rating: "EE", observedBy: "Ms. Grace Njeri", observedDate: "2024-10-30", evidence: "Project portfolio" },
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
  
  // Projects Tab State
  const [projectSearchTerm, setProjectSearchTerm] = useState("");
  const [projectGradeFilter, setProjectGradeFilter] = useState("all");
  const [projectStatusFilter, setProjectStatusFilter] = useState("all");
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null);
  
  // New Project Form State
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectGrade, setNewProjectGrade] = useState("");
  const [newProjectStream, setNewProjectStream] = useState("");
  const [newProjectSubject, setNewProjectSubject] = useState("");
  const [newProjectRubric, setNewProjectRubric] = useState("");
  const [newProjectMaxPoints, setNewProjectMaxPoints] = useState("100");
  const [newProjectDueDate, setNewProjectDueDate] = useState("");
  const [newProjectStatus, setNewProjectStatus] = useState<'Active' | 'Completed' | 'Pending Grading' | 'Draft'>("Draft");

  // Rubrics Tab State
  const [rubricSearchTerm, setRubricSearchTerm] = useState("");
  const [rubricGradeFilter, setRubricGradeFilter] = useState("all");
  const [rubricLevelFilter, setRubricLevelFilter] = useState("all");
  const [selectedRubric, setSelectedRubric] = useState<RubricRecord | null>(null);
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);

  // Observations Tab State
  const [obsSearchTerm, setObsSearchTerm] = useState("");
  const [obsGradeFilter, setObsGradeFilter] = useState("all");
  const [obsCompetencyFilter, setObsCompetencyFilter] = useState("all");
  const [isAddObsOpen, setIsAddObsOpen] = useState(false);
  const [editingObs, setEditingObs] = useState<ObservationRecord | null>(null);
  
  // New Observation Form State
  const [newObsStudent, setNewObsStudent] = useState("");
  const [newObsGrade, setNewObsGrade] = useState("");
  const [newObsStream, setNewObsStream] = useState("");
  const [newObsActivity, setNewObsActivity] = useState("");
  const [newObsCompetency, setNewObsCompetency] = useState("");
  const [newObsObservation, setNewObsObservation] = useState("");
  const [newObsRating, setNewObsRating] = useState<'EE' | 'ME' | 'AE' | 'BE'>("ME");
  const [newObsEvidence, setNewObsEvidence] = useState("");

  const filteredProjects = useMemo(() => {
    return MOCK_PROJECTS.filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
                           project.subject.toLowerCase().includes(projectSearchTerm.toLowerCase());
      const matchesGrade = projectGradeFilter === "all" || project.grade === projectGradeFilter;
      const matchesStatus = projectStatusFilter === "all" || project.status === projectStatusFilter;
      return matchesSearch && matchesGrade && matchesStatus;
    });
  }, [projectSearchTerm, projectGradeFilter, projectStatusFilter]);

  const filteredRubrics = useMemo(() => {
    return MOCK_RUBRICS.filter(rubric => {
      const matchesSearch = rubric.studentName.toLowerCase().includes(rubricSearchTerm.toLowerCase()) ||
                           rubric.projectId.toLowerCase().includes(rubricSearchTerm.toLowerCase());
      const matchesGrade = rubricGradeFilter === "all" || rubric.grade === rubricGradeFilter;
      const matchesLevel = rubricLevelFilter === "all" || rubric.level === rubricLevelFilter;
      return matchesSearch && matchesGrade && matchesLevel;
    });
  }, [rubricSearchTerm, rubricGradeFilter, rubricLevelFilter]);

  const filteredObservations = useMemo(() => {
    return MOCK_OBSERVATIONS.filter(obs => {
      const matchesSearch = obs.studentName.toLowerCase().includes(obsSearchTerm.toLowerCase()) ||
                           obs.activity.toLowerCase().includes(obsSearchTerm.toLowerCase()) ||
                           obs.competency.toLowerCase().includes(obsSearchTerm.toLowerCase());
      const matchesGrade = obsGradeFilter === "all" || obs.grade === obsGradeFilter;
      const matchesCompetency = obsCompetencyFilter === "all" || obs.competency === obsCompetencyFilter;
      return matchesSearch && matchesGrade && matchesCompetency;
    });
  }, [obsSearchTerm, obsGradeFilter, obsCompetencyFilter]);

  const projectStats = useMemo(() => {
    const activeProjects = MOCK_PROJECTS.filter(p => p.status === 'Active').length;
    const completedProjects = MOCK_PROJECTS.filter(p => p.status === 'Completed').length;
    const pendingGrading = MOCK_PROJECTS.filter(p => p.status === 'Pending Grading').length;
    const totalSubmissions = MOCK_PROJECTS.reduce((sum, p) => sum + p.submissionsTotal, 0);
    const totalGraded = MOCK_PROJECTS.reduce((sum, p) => sum + p.submissionsGraded, 0);
    const gradedPct = totalSubmissions > 0 ? Math.round((totalGraded / totalSubmissions) * 100) : 0;
    return { activeProjects, completedProjects, pendingGrading, gradedPct, totalSubmissions };
  }, []);

  const rubricStats = useMemo(() => {
    const totalGraded = MOCK_RUBRICS.length;
    const avgScore = totalGraded > 0 ? Math.round(MOCK_RUBRICS.reduce((sum, r) => sum + r.percentage, 0) / totalGraded) : 0;
    const eeCount = MOCK_RUBRICS.filter(r => r.level === 'EE').length;
    const meCount = MOCK_RUBRICS.filter(r => r.level === 'ME').length;
    const aeCount = MOCK_RUBRICS.filter(r => r.level === 'AE').length;
    const beCount = MOCK_RUBRICS.filter(r => r.level === 'BE').length;
    return { totalGraded, avgScore, eeCount, meCount, aeCount, beCount };
  }, []);

  const obsStats = useMemo(() => {
    const totalObs = MOCK_OBSERVATIONS.length;
    const eeCount = MOCK_OBSERVATIONS.filter(o => o.rating === 'EE').length;
    const meCount = MOCK_OBSERVATIONS.filter(o => o.rating === 'ME').length;
    const aeCount = MOCK_OBSERVATIONS.filter(o => o.rating === 'AE').length;
    const beCount = MOCK_OBSERVATIONS.filter(o => o.rating === 'BE').length;
    const uniqueStudents = new Set(MOCK_OBSERVATIONS.map(o => o.studentName)).size;
    return { totalObs, eeCount, meCount, aeCount, beCount, uniqueStudents };
  }, []);

  const handleAddProject = () => {
    if (!String(newProjectTitle || '').trim() || !newProjectGrade || !newProjectStream || !newProjectSubject) return;
    
        const newProject: ProjectRecord = {
          id: `proj-${Date.now()}`,
          title: String(newProjectTitle || '').trim(),
          grade: newProjectGrade,
          stream: newProjectStream,
          subject: newProjectSubject,
          rubricCriteria: String(newProjectRubric || '').trim(),
      maxPoints: parseInt(newProjectMaxPoints) || 100,
      submissionsTotal: 0,
      submissionsGraded: 0,
      status: newProjectStatus,
      dueDate: newProjectDueDate,
      createdBy: "Current Teacher",
      createdDate: new Date().toISOString().split('T')[0]
    };
    
    // In real app, this would update state/context
    console.log("New project created:", newProject);
    
    setIsAddProjectOpen(false);
    setNewProjectTitle("");
    setNewProjectGrade("");
    setNewProjectStream("");
    setNewProjectSubject("");
    setNewProjectRubric("");
    setNewProjectMaxPoints("100");
    setNewProjectDueDate("");
    setNewProjectStatus("Draft");
  };

  const handleEditProject = (project: ProjectRecord) => {
    setEditingProject(project);
    setNewProjectTitle(project.title);
    setNewProjectGrade(project.grade);
    setNewProjectStream(project.stream);
    setNewProjectSubject(project.subject);
    setNewProjectRubric(project.rubricCriteria);
    setNewProjectMaxPoints(project.maxPoints.toString());
    setNewProjectDueDate(project.dueDate);
    setNewProjectStatus(project.status);
    setIsAddProjectOpen(true);
  };

  const handleSaveProjectEdit = () => {
    if (!editingProject) return;
    console.log("Project updated:", { ...editingProject, title: newProjectTitle });
    setEditingProject(null);
    setIsAddProjectOpen(false);
    setNewProjectTitle("");
    setNewProjectGrade("");
    setNewProjectStream("");
    setNewProjectSubject("");
    setNewProjectRubric("");
    setNewProjectMaxPoints("100");
    setNewProjectDueDate("");
    setNewProjectStatus("Draft");
  };

  const handleAddObservation = () => {
    if (!String(newObsStudent || '').trim() || !newObsGrade || !newObsStream || !newObsActivity || !newObsCompetency || !String(newObsObservation || '').trim()) return;
    
        const newObs: ObservationRecord = {
          id: `obs-${Date.now()}`,
          studentName: String(newObsStudent || '').trim(),
          grade: newObsGrade,
          stream: newObsStream,
          activity: String(newObsActivity || '').trim(),
          competency: newObsCompetency,
          observation: String(newObsObservation || '').trim(),
          rating: newObsRating,
          observedBy: "Current Teacher",
          observedDate: new Date().toISOString().split('T')[0],
          evidence: String(newObsEvidence || '').trim() || undefined
        };
    
    console.log("New observation created:", newObs);
    
    setIsAddObsOpen(false);
    setNewObsStudent("");
    setNewObsGrade("");
    setNewObsStream("");
    setNewObsActivity("");
    setNewObsCompetency("");
    setNewObsObservation("");
    setNewObsRating("ME");
    setNewObsEvidence("");
  };

  const handleEditObservation = (obs: ObservationRecord) => {
    setEditingObs(obs);
    setNewObsStudent(obs.studentName);
    setNewObsGrade(obs.grade);
    setNewObsStream(obs.stream);
    setNewObsActivity(obs.activity);
    setNewObsCompetency(obs.competency);
    setNewObsObservation(obs.observation);
    setNewObsRating(obs.rating);
    setNewObsEvidence(obs.evidence || "");
    setIsAddObsOpen(true);
  };

  const handleSaveObsEdit = () => {
    if (!editingObs) return;
    console.log("Observation updated:", { ...editingObs, studentName: newObsStudent });
    setEditingObs(null);
    setIsAddObsOpen(false);
    setNewObsStudent("");
    setNewObsGrade("");
    setNewObsStream("");
    setNewObsActivity("");
    setNewObsCompetency("");
    setNewObsObservation("");
    setNewObsRating("ME");
    setNewObsEvidence("");
  };

  const getProjectStatusBadge = (status: string) => {
    const configs = {
      Active: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100" },
      Completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
      "Pending Grading": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
      Draft: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
    };
    const config = configs[status as keyof typeof configs] || configs.Draft;
    return (
      <Badge variant="outline" className={cn("rounded-lg font-bold text-xs px-2.5 py-0.5", config.bg, config.text, config.border)}>
        {status}
      </Badge>
    );
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

  const getRubricCriteriaArray = (criteria: string) => {
      return criteria.split(',').map(c => String(c || '').trim());
    };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BackButton parentPath="/" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Practical Competencies</h1>
            <p className="text-gray-500">CBC project assessments, observational rubrics, and practical task logs.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeTab === 'projects' && (
            <Button onClick={() => setIsAddProjectOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Plus size={16} /> New Project
            </Button>
          )}
          {activeTab === 'observations' && (
            <Button onClick={() => setIsAddObsOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Plus size={16} /> Log Observation
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-4">
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'projects' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers size={16} /> Projects & Assessments
        </button>
        <button
          onClick={() => setActiveTab('rubrics')}
          className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'rubrics' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardCheck size={16} /> Rubric Grading
        </button>
        <button
          onClick={() => setActiveTab('observations')}
          className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'observations' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Target size={16} /> Observational Logs
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Layers size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Projects</p>
                  <h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{projectStats.activeProjects}</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Completed</p>
                  <h3 className="text-2xl font-black text-emerald-700 leading-none mt-1">{projectStats.completedProjects}</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pending Grading</p>
                  <h3 className="text-2xl font-black text-amber-700 leading-none mt-1">{projectStats.pendingGrading}</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <ClipboardCheck size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Graded %</p>
                  <h3 className="text-2xl font-black text-blue-700 leading-none mt-1">{projectStats.gradedPct}%</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <FileCheck size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Submissions</p>
                  <h3 className="text-2xl font-black text-purple-700 leading-none mt-1">{projectStats.totalSubmissions}</h3>
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
                  placeholder="Search by project title, subject, or teacher..." 
                  className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium"
                  value={projectSearchTerm}
                  onChange={(e) => setProjectSearchTerm(e.target.value)}
                />
              </div>
              <Select value={projectGradeFilter} onValueChange={setProjectGradeFilter}>
                <SelectTrigger className="w-[180px] h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">All Grades</SelectItem>
                  {GRADE_OPTIONS.map(grade => <SelectItem key={grade} value={grade}>{grade}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={projectStatusFilter} onValueChange={setProjectStatusFilter}>
                <SelectTrigger className="w-[180px] h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
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
              <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 bg-white font-bold gap-2">
                <Download size={18} /> Export CSV
              </Button>
            </div>
          </Card>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => {
                const progress = project.submissionsTotal > 0 
                  ? Math.round((project.submissionsGraded / project.submissionsTotal) * 100) 
                  : 0;
                
                return (
                  <Card key={project.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white overflow-hidden group">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                          <FileCheck size={24} />
                        </div>
                        {getProjectStatusBadge(project.status)}
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                          {project.title}
                        </h3>
                        <p className="text-sm font-bold text-indigo-500 flex items-center gap-1">
                          <Layers size={14} /> {project.grade} • {project.stream}
                        </p>
                        <p className="text-xs text-slate-500">{project.subject}</p>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <div>
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
                          <Progress value={progress} className="h-2" />
                        </div>

                        <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                          <span>Due: {project.dueDate}</span>
                          <span className="text-slate-500">By: {project.createdBy}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-1 rounded-xl h-9 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 gap-1.5"
                          onClick={() => handleEditProject(project)}
                        >
                          <Edit size={14} /> Edit
                        </Button>
                        <Button 
                          size="sm"
                          className="flex-1 rounded-xl h-9 bg-indigo-600 hover:bg-indigo-700 font-black shadow-lg shadow-indigo-100 gap-2"
                        >
                          <ClipboardCheck size={16} /> Grade Submissions
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-200 shadow-sm">
                  <Search size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">No projects found</h3>
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
      )}

      {activeTab === 'rubrics' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <ClipboardCheck size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Graded</p>
                  <h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{rubricStats.totalGraded}</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Target size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Avg Score</p>
                  <h3 className="text-2xl font-black text-emerald-700 leading-none mt-1">{rubricStats.avgScore}%</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Award size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">EE (Exceeding)</p>
                  <h3 className="text-2xl font-black text-emerald-700 leading-none mt-1">{rubricStats.eeCount}</h3>
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
                  <h3 className="text-2xl font-black text-blue-700 leading-none mt-1">{rubricStats.meCount}</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">AE/BE (Support)</p>
                  <h3 className="text-2xl font-black text-amber-700 leading-none mt-1">{rubricStats.aeCount + rubricStats.beCount}</h3>
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
                  placeholder="Search by learner name, project, or grade..." 
                  className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium"
                  value={rubricSearchTerm}
                  onChange={(e) => setRubricSearchTerm(e.target.value)}
                />
              </div>
              <Select value={rubricGradeFilter} onValueChange={setRubricGradeFilter}>
                <SelectTrigger className="w-[180px] h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">All Grades</SelectItem>
                  {GRADE_OPTIONS.map(grade => <SelectItem key={grade} value={grade}>{grade}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={rubricLevelFilter} onValueChange={setRubricLevelFilter}>
                <SelectTrigger className="w-[180px] h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="EE">EE - Exceeding</SelectItem>
                  <SelectItem value="ME">ME - Meeting</SelectItem>
                  <SelectItem value="AE">AE - Approaching</SelectItem>
                  <SelectItem value="BE">BE - Below</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 bg-white font-bold gap-2">
                <Download size={18} /> Export CSV
              </Button>
            </div>
          </Card>

          {/* Rubrics Table */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-slate-500 border-b bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Student Name</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Grade / Stream</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Project</th>
                      {getRubricCriteriaArray((MOCK_RUBRICS[0] as any)?.rubricCriteria || "").map((crit, i) => (
                        <th key={i} className="px-4 py-5 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center border-r min-w-[90px]">
                          {String(crit || '').split('(')[0].trim()}
                        </th>
                      ))}
                      <th className="px-5 py-5 font-black text-[10px] uppercase tracking-widest text-indigo-700 text-center bg-indigo-50/50 min-w-[90px]">
                        Total / %
                      </th>
                      <th className="px-5 py-5 font-black text-[10px] uppercase tracking-widest text-slate-700 text-center min-w-[90px]">
                        Level
                      </th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRubrics.length > 0 ? (
                      filteredRubrics.map((rubric) => {
                        const project = MOCK_PROJECTS.find(p => p.id === rubric.projectId);
                        const criteria = getRubricCriteriaArray(project?.rubricCriteria || "");
                        return (
                          <tr key={rubric.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-5">
                              <p className="font-bold text-slate-900">{rubric.studentName}</p>
                            </td>
                            <td className="px-8 py-5">
                              <span className="font-bold text-slate-700">{rubric.grade}</span>
                              <Badge variant="outline" className="ml-2 rounded-lg border-slate-200 text-slate-600 font-bold text-xs">{rubric.stream}</Badge>
                            </td>
                            <td className="px-8 py-5">
                              <p className="font-bold text-slate-800 truncate max-w-[200px]">{project?.title || rubric.projectId}</p>
                            </td>
                            {criteria.map((crit, i) => {
                              const critName = String(crit || '').split('(')[0].trim();
                              const score = rubric.scores[critName] || 0;
                              return (
                                <td key={i} className="px-4 py-5 border-r text-center font-bold text-slate-700">
                                  {score}
                                </td>
                              );
                            })}
                            <td className="px-5 py-5 text-center bg-indigo-50/20 font-black text-indigo-900">
                              {rubric.totalScore} / {rubric.percentage}%
                            </td>
                            <td className="px-5 py-5 text-center">
                              {getRatingBadge(rubric.level)}
                            </td>
                            <td className="px-8 py-5 text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="rounded-xl h-9 px-3 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 gap-1.5"
                                onClick={() => { setSelectedRubric(rubric); setIsRubricModalOpen(true); }}
                              >
                                <Eye size={14} /> View
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={10} className="px-8 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Search size={36} className="text-slate-200" />
                            <p className="text-slate-500 font-bold">No rubric records match the current filters.</p>
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

      {activeTab === 'observations' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Target size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Observations</p>
                  <h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{obsStats.totalObs}</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Students Observed</p>
                  <h3 className="text-2xl font-black text-emerald-700 leading-none mt-1">{obsStats.uniqueStudents}</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Award size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">EE (Exceeding)</p>
                  <h3 className="text-2xl font-black text-emerald-700 leading-none mt-1">{obsStats.eeCount}</h3>
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
                  <h3 className="text-2xl font-black text-blue-700 leading-none mt-1">{obsStats.meCount}</h3>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">AE/BE (Support)</p>
                  <h3 className="text-2xl font-black text-amber-700 leading-none mt-1">{obsStats.aeCount + obsStats.beCount}</h3>
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
                  placeholder="Search by learner name, activity, or competency..." 
                  className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-medium"
                  value={obsSearchTerm}
                  onChange={(e) => setObsSearchTerm(e.target.value)}
                />
              </div>
              <Select value={obsGradeFilter} onValueChange={setObsGradeFilter}>
                <SelectTrigger className="w-[180px] h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">All Grades</SelectItem>
                  {GRADE_OPTIONS.map(grade => <SelectItem key={grade} value={grade}>{grade}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={obsCompetencyFilter} onValueChange={setObsCompetencyFilter}>
                <SelectTrigger className="w-[220px] h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
                  <SelectValue placeholder="All Competencies" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">All Competencies</SelectItem>
                  {COMPETENCY_OPTIONS.map(comp => <SelectItem key={comp} value={comp}>{comp}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 bg-white font-bold gap-2">
                <Download size={18} /> Export CSV
              </Button>
            </div>
          </Card>

          {/* Observations Table */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-slate-500 border-b bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Student Name</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Grade / Stream</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Activity</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Competency</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Observation Notes</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Rating</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Observed By / Date</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredObservations.length > 0 ? (
                      filteredObservations.map((obs) => (
                        <tr key={obs.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <p className="font-bold text-slate-900">{obs.studentName}</p>
                          </td>
                          <td className="px-8 py-5">
                            <span className="font-bold text-slate-700">{obs.grade}</span>
                            <Badge variant="outline" className="ml-2 rounded-lg border-slate-200 text-slate-600 font-bold text-xs">{obs.stream}</Badge>
                          </td>
                          <td className="px-8 py-5">
                            <p className="font-medium text-slate-800 truncate max-w-[180px]">{obs.activity}</p>
                          </td>
                          <td className="px-8 py-5">
                            <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-600 font-bold text-xs">{obs.competency}</Badge>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-sm text-slate-600 line-clamp-1 max-w-[200px]">{obs.observation}</p>
                          </td>
                          <td className="px-8 py-5 text-center">
                            {getRatingBadge(obs.rating)}
                          </td>
                          <td className="px-8 py-5">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-slate-600">{obs.observedBy}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{obs.observedDate}</p>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="rounded-xl h-9 px-3 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 gap-1.5"
                                onClick={() => handleEditObservation(obs)}
                              >
                                <Edit size={14} /> Edit
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="rounded-xl h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-8 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Search size={36} className="text-slate-200" />
                            <p className="text-slate-500 font-bold">No observation records match the current filters.</p>
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

      {/* Add/Edit Project Modal */}
      {(isAddProjectOpen || editingProject) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">{editingProject ? "Edit Project" : "Create New Project"}</h3>
              <button onClick={() => { setIsAddProjectOpen(false); setEditingProject(null); }} className="p-1 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Project Title</Label>
                <Input value={newProjectTitle} onChange={(e) => setNewProjectTitle(e.target.value)} placeholder="e.g. Science Fair Project" className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Grade</Label>
                  <Select value={newProjectGrade} onValueChange={setNewProjectGrade}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Grade..." /></SelectTrigger>
                    <SelectContent>{GRADE_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Stream</Label>
                  <Select value={newProjectStream} onValueChange={setNewProjectStream}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Stream..." /></SelectTrigger>
                    <SelectContent>{STREAM_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Subject Area</Label>
                <Select value={newProjectSubject} onValueChange={setNewProjectSubject}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Subject..." /></SelectTrigger>
                  <SelectContent>{SUBJECT_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Rubric Criteria (comma separated with weights)</Label>
                <Input value={newProjectRubric} onChange={(e) => setNewProjectRubric(e.target.value)} placeholder="e.g. Creativity (25), Logic (25), Presentation (25), Documentation (25)" className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Max Points</Label>
                  <Input type="number" value={newProjectMaxPoints} onChange={(e) => setNewProjectMaxPoints(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Due Date</Label>
                  <Input type="date" value={newProjectDueDate} onChange={(e) => setNewProjectDueDate(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Status</Label>
                  <Select value={newProjectStatus} onValueChange={setNewProjectStatus as (value: string) => void}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Pending Grading">Pending Grading</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold" onClick={() => { setIsAddProjectOpen(false); setEditingProject(null); }}>Cancel</Button>
                <Button className="flex-1 rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100" onClick={editingProject ? handleSaveProjectEdit : handleAddProject}>
                  {editingProject ? "Save Changes" : "Create Project"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Observation Modal */}
      {(isAddObsOpen || editingObs) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">{editingObs ? "Edit Observation" : "Log New Observation"}</h3>
              <button onClick={() => { setIsAddObsOpen(false); setEditingObs(null); }} className="p-1 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Student Name</Label>
                  <Input value={newObsStudent} onChange={(e) => setNewObsStudent(e.target.value)} placeholder="e.g. Brian Kiptoo" className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Grade</Label>
                  <Select value={newObsGrade} onValueChange={setNewObsGrade}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Grade..." /></SelectTrigger>
                    <SelectContent>{GRADE_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Stream</Label>
                  <Select value={newObsStream} onValueChange={setNewObsStream}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Stream..." /></SelectTrigger>
                    <SelectContent>{STREAM_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Competency</Label>
                  <Select value={newObsCompetency} onValueChange={setNewObsCompetency}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Competency..." /></SelectTrigger>
                    <SelectContent>{COMPETENCY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Activity / Context</Label>
                <Input value={newObsActivity} onChange={(e) => setNewObsActivity(e.target.value)} placeholder="e.g. Group Science Experiment" className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Observation Notes</Label>
                <textarea value={newObsObservation} onChange={(e) => setNewObsObservation(e.target.value)} placeholder="Describe what was observed..." className="h-24 rounded-xl bg-slate-50 border-none font-bold p-3 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Rating</Label>
                  <Select value={newObsRating} onValueChange={setNewObsRating as (value: string) => void}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EE">EE - Exceeding Expectation</SelectItem>
                      <SelectItem value="ME">ME - Meeting Expectation</SelectItem>
                      <SelectItem value="AE">AE - Approaching Expectation</SelectItem>
                      <SelectItem value="BE">BE - Below Expectation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Evidence (Optional)</Label>
                  <Input value={newObsEvidence} onChange={(e) => setNewObsEvidence(e.target.value)} placeholder="e.g. Photo, Video, Worksheet" className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="ghost" className="flex-1 rounded-xl h-11 font-bold" onClick={() => { setIsAddObsOpen(false); setEditingObs(null); }}>Cancel</Button>
                <Button className="flex-1 rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100" onClick={editingObs ? handleSaveObsEdit : handleAddObservation}>
                  {editingObs ? "Save Changes" : "Log Observation"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rubric Detail Modal */}
      {isRubricModalOpen && selectedRubric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Rubric Details: {selectedRubric.studentName}</h3>
              <button onClick={() => { setIsRubricModalOpen(false); setSelectedRubric(null); }} className="p-1 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-2xl font-black text-indigo-700">{selectedRubric.percentage}%</p><p className="text-xs font-bold text-indigo-600 uppercase">Total Score</p></div>
                  <div><p className="text-2xl font-black text-slate-900">{selectedRubric.totalScore} / {(selectedRubric as any).maxPoints || 100}</p><p className="text-xs font-bold text-slate-400 uppercase">Points</p></div>
                  <div>{getRatingBadge(selectedRubric.level)}</div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Criteria Breakdown</p>
                {Object.entries(selectedRubric.scores).map(([crit, score]) => (
                  <div key={crit} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold text-slate-700">{crit}</span>
                    <span className="font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl">{score}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-xs font-black uppercase text-amber-900 tracking-widest mb-1">Teacher Feedback</p>
                <p className="text-sm text-slate-700 italic">"{selectedRubric.feedback}"</p>
                <p className="text-xs text-slate-500 mt-2">Graded by: {selectedRubric.gradedBy} on {selectedRubric.gradedDate}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticalCompetencies;