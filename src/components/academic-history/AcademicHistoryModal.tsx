"use client";

import React, { useState, useMemo } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  History, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  ClipboardCheck, 
  Award,
  Calendar,
  BookOpen,
  Filter,
  ChevronDown as ChevronDownIcon
} from 'lucide-react';
import { 
  HistoricalAssessment, 
  AcademicHistoryGroup, 
  AssessmentType,
  getPerformanceLevel,
  PERFORMANCE_LEVELS
} from '@/types/academic-history';
import { MOCK_HISTORICAL_ASSESSMENTS } from '@/lib/academic-history-data';
import { cn } from '@/lib/utils';

interface AcademicHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

const EXAM_TYPES = [
  { value: 'all', label: 'All Exam Types' },
  { value: 'Opener Exam', label: 'Opener Exam' },
  { value: 'Mid-Term Exam', label: 'Mid-Term Exam' },
  { value: 'End of Term Exam', label: 'End of Term Exam' },
  { value: 'Continuous Assessment (CAT)', label: 'Continuous Assessment (CAT)' },
  { value: 'Mock / National Assessment', label: 'Mock / National Assessment' },
] as const;

type ExamTypeValue = typeof EXAM_TYPES[number]['value'];

const AcademicHistoryModal: React.FC<AcademicHistoryModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName
}) => {
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<AssessmentType | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedExamType, setSelectedExamType] = useState<ExamTypeValue>('all');

  // Filter assessments for this student
  const studentAssessments = useMemo(() => {
    return MOCK_HISTORICAL_ASSESSMENTS.filter(a => a.studentId === studentId);
  }, [studentId]);

  // Get unique academic years for year filter
  const availableYears = useMemo(() => {
    const years = new Set(studentAssessments.map(a => a.academicYear));
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [studentAssessments]);

  // Group by academic year and grade level
  const historyGroups = useMemo(() => {
    const groups: AcademicHistoryGroup[] = [];
    const grouped = studentAssessments.reduce((acc, assessment) => {
      const key = `${assessment.academicYear}-${assessment.gradeLevel}`;
      if (!acc[key]) {
        acc[key] = {
          academicYear: assessment.academicYear,
          gradeLevel: assessment.gradeLevel,
          assessments: []
        };
      }
      acc[key].assessments.push(assessment);
      return acc;
    }, {} as Record<string, AcademicHistoryGroup>);

    // Sort by academic year descending (most recent first)
    return Object.values(grouped).sort((a, b) => {
      if (a.academicYear !== b.academicYear) {
        return parseInt(b.academicYear) - parseInt(a.academicYear);
      }
      // Sort by grade level (higher grades first)
      const gradeA = parseInt(a.gradeLevel.replace(/[^0-9]/g, '')) || 0;
      const gradeB = parseInt(b.gradeLevel.replace(/[^0-9]/g, '')) || 0;
      return gradeB - gradeA;
    });
  }, [studentAssessments]);

  const toggleYear = (year: string) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

  const filterAssessments = (assessments: HistoricalAssessment[]) => {
    return assessments.filter(a => {
      const matchesTab = activeTab === 'all' || a.assessmentType === activeTab;
      const matchesYear = selectedYear === 'all' || a.academicYear === selectedYear;
      const matchesExamType = selectedExamType === 'all' || a.examType === selectedExamType;
      return matchesTab && matchesYear && matchesExamType;
    });
  };

  const getFilteredCount = () => {
    return studentAssessments.filter(a => {
      const matchesTab = activeTab === 'all' || a.assessmentType === activeTab;
      const matchesYear = selectedYear === 'all' || a.academicYear === selectedYear;
      const matchesExamType = selectedExamType === 'all' || a.examType === selectedExamType;
      return matchesTab && matchesYear && matchesExamType;
    }).length;
  };

  const getAssessmentTypeIcon = (type: AssessmentType) => {
    switch (type) {
      case 'Formative':
        return <ClipboardCheck size={16} className="text-indigo-600" />;
      case 'Summative':
        return <Award size={16} className="text-purple-600" />;
      case 'ReportCard':
        return <FileText size={16} className="text-emerald-600" />;
      default:
        return <BookOpen size={16} className="text-slate-600" />;
    }
  };

  const getAssessmentTypeColor = (type: AssessmentType) => {
    switch (type) {
      case 'Formative':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Summative':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'ReportCard':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const AssessmentCard: React.FC<{ assessment: HistoricalAssessment }> = ({ assessment }) => {
    const perfLevel = getPerformanceLevel(assessment.performanceLevel);
    
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {getAssessmentTypeIcon(assessment.assessmentType)}
            <div>
              <h4 className="font-bold text-slate-900">{assessment.subject}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn("text-xs font-bold rounded-lg border-none", getAssessmentTypeColor(assessment.assessmentType))}>
                  {assessment.assessmentType}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-600 font-bold text-xs">
                  {assessment.examType}
                </Badge>
                <span className="text-xs text-slate-400 font-medium">{assessment.term}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={cn("font-bold text-sm", perfLevel.bgColor, perfLevel.color)}>
              {assessment.score}%
            </Badge>
            <Badge variant="outline" className="border-slate-200 text-slate-600 font-bold">
              {assessment.performanceLevel}
            </Badge>
            {assessment.isLocked && (
              <Badge className="bg-slate-100 text-slate-500 border-none text-xs font-medium">
                Locked
              </Badge>
            )}
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 mt-3">
          <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
            Performance: {perfLevel.label}
          </p>
          <p className="text-sm text-slate-600 italic">"{assessment.comment}"</p>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>Recorded: {new Date(assessment.dateRecorded).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Academic History - ${studentName}`}
      description="View past assessments and performance records"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-indigo-600">{getFilteredCount()}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Records</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-purple-600">
              {studentAssessments.filter(a => a.assessmentType === 'Formative' && (selectedExamType === 'all' || a.examType === selectedExamType) && (selectedYear === 'all' || a.academicYear === selectedYear)).length}
            </p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Formative</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-emerald-600">
              {studentAssessments.filter(a => a.assessmentType === 'Summative' && (selectedExamType === 'all' || a.examType === selectedExamType) && (selectedYear === 'all' || a.academicYear === selectedYear)).length}
            </p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Summative</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-amber-600">
              {studentAssessments.filter(a => a.assessmentType === 'ReportCard' && (selectedExamType === 'all' || a.examType === selectedExamType) && (selectedYear === 'all' || a.academicYear === selectedYear)).length}
            </p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reports</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-rose-600">
              {studentAssessments.filter(a => a.performanceLevel === 'EE' && (selectedExamType === 'all' || a.examType === selectedExamType) && (selectedYear === 'all' || a.academicYear === selectedYear)).length}
            </p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">EE Count</p>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 bg-white border border-slate-200 rounded-2xl">
          {/* Category Filter Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AssessmentType | 'all')} className="w-full sm:w-auto">
            <TabsList className="bg-slate-50 border border-slate-200 p-1 rounded-xl h-12">
              <TabsTrigger value="all" className="rounded-lg px-6 h-full font-bold text-xs">
                All Records
              </TabsTrigger>
              <TabsTrigger value="Formative" className="rounded-lg px-6 h-full font-bold text-xs">
                Formative Tasks
              </TabsTrigger>
              <TabsTrigger value="Summative" className="rounded-lg px-6 h-full font-bold text-xs">
                Summative Exams
              </TabsTrigger>
              <TabsTrigger value="ReportCard" className="rounded-lg px-6 h-full font-bold text-xs">
                Report Cards
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Year Filter Dropdown */}
          <div className="w-full sm:w-auto">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full sm:w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <SelectValue placeholder="All Years" />
                <ChevronDownIcon size={14} className="text-slate-400 ml-auto" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Academic Years</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Exam Type Filter Dropdown */}
          <div className="w-full sm:w-auto">
            <Select value={selectedExamType} onValueChange={setSelectedExamType}>
              <SelectTrigger className="w-full sm:w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <SelectValue placeholder="All Exam Types" />
                <ChevronDownIcon size={14} className="text-slate-400 ml-auto" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {EXAM_TYPES.map(exam => (
                  <SelectItem key={exam.value} value={exam.value}>
                    {exam.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Academic History Timeline */}
        <div className="space-y-4">
          {historyGroups.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <History size={48} className="text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">No Academic History</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                No historical records found for this student.
              </p>
            </div>
          ) : (
            historyGroups.map((group, index) => {
              const filteredAssessments = filterAssessments(group.assessments);
              const hasFiltered = filteredAssessments.length > 0;
              const isExpanded = expandedYears.has(group.academicYear);
              
              // Auto-expand first group
              React.useEffect(() => {
                if (index === 0) {
                  setExpandedYears(prev => new Set([...prev, group.academicYear]));
                }
              }, []);
              
              return (
                <div key={`${group.academicYear}-${group.gradeLevel}`} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <button
                    onClick={() => toggleYear(group.academicYear)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Calendar size={20} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-black text-slate-900">{group.academicYear}</h3>
                        <p className="text-sm font-bold text-slate-600">{group.gradeLevel}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-100 text-slate-600 border-none">
                        {filteredAssessments.length} / {group.assessments.length} records
                      </Badge>
                      {isExpanded ? (
                        <ChevronDown size={20} className="text-slate-400" />
                      ) : (
                        <ChevronRight size={20} className="text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 py-4 border-t border-slate-100">
                      {hasFiltered ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {filteredAssessments.map(assessment => (
                            <AssessmentCard key={assessment.id} assessment={assessment} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                          <p className="text-sm">No records match the current filters in this period</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Performance Level Legend */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <h4 className="font-black text-xs text-slate-400 uppercase tracking-wider mb-3">
            Performance Levels
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PERFORMANCE_LEVELS.map(level => (
              <div key={level.code} className="flex items-center gap-2">
                <Badge className={cn("font-bold", level.bgColor, level.color)}>
                  {level.code}
                </Badge>
                <span className="text-xs font-medium text-slate-600">{level.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AcademicHistoryModal;