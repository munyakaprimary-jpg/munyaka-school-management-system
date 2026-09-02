"use client";

import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronDown as ChevronDownIcon,
  Loader2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { 
  HistoricalAssessment, 
  AcademicHistoryGroup, 
  AssessmentType,
  getPerformanceLevel,
  PERFORMANCE_LEVELS,
  AssessmentLevel,
  getRubricLabel,
  getRubricColor
} from '@/types/academic-history';
import { MOCK_HISTORICAL_ASSESSMENTS } from '@/lib/academic-history-data';
import { cn } from '@/lib/utils';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useAcademicCalendar } from '@/hooks/useAcademicCalendar';
import { INITIAL_SEED_DATA } from '@/data/initialSeedData';

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
  // Pull the currently active academic year from the system calendar
  // (so we can show it in the summary header even when the user
  // is viewing "All Academic Years").
  const { activeYear, isLoading: isLoadingCalendar } = useAcademicCalendar();

  // 1) Read the list of academic years that exist in the system.
  //    We pull from the active year configured in system settings
  //    plus any years that already appear in this student's
  //    historical record. If the system has no list, we fall
  //    back to the year derived from the active calendar hook
  //    (so we always render at least one year to choose from).
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [isLoadingYears, setIsLoadingYears] = useState(true);
  const [hasData, setHasData] = useState(false);

  // Fetch the academic years on mount (and when modal opens)
  useEffect(() => {
    if (!isOpen) return;

    setIsLoadingYears(true);
    try {
      // 1a) Try the master settings payload first (preferred source).
      //     It may define an array of allowed years.
      const masterSettings = localStorage.getItem('munyaka_system_settings_v3');
      let systemYears: string[] = [];
      if (masterSettings) {
        try {
          const parsed = JSON.parse(masterSettings);
          const years = parsed?.academic?.availableYears;
          if (Array.isArray(years) && years.length > 0) {
            systemYears = years.map(String);
          }
        } catch { /* noop */ }
      }

      // 1b) Fall back to the active year alone if no list was
      //     configured. This guarantees the dropdown always has
      //     at least the currently running year.
      if (systemYears.length === 0 && activeYear) {
        systemYears = [activeYear];
      }

      // 1c) Pull every year that already appears in this learner's
      //     historical record so historical years (e.g. "2021")
      //     that the system config did not list still appear in
      //     the filter. Deduplicate.
      const studentYears = Array.from(
        new Set(
          MOCK_HISTORICAL_ASSESSMENTS
            .filter((a) => a.studentId === studentId)
            .map((a) => a.academicYear)
        )
      );

      // 1d) Merge, dedupe, and sort descending so the most recent
      //     year is at the top of the dropdown. We always include
      //     the active year so the live year is never lost.
      const mergedYears = Array.from(
        new Set([
          ...systemYears,
          ...studentYears,
          ...(activeYear ? [activeYear] : []),
        ])
      );
      const sorted = mergedYears.sort((a, b) => parseInt(b) - parseInt(a));
      setAvailableYears(sorted);
      setHasData(sorted.length > 0);
    } catch (e) {
      console.error('Failed to load academic years:', e);
      setAvailableYears(activeYear ? [activeYear] : []);
      setHasData(!!activeYear);
    } finally {
      setIsLoadingYears(false);
    }
  }, [isOpen, studentId, activeYear]);

  // Filter States
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<AssessmentType | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all'); // "all" sentinel for "All Academic Years"
  const [selectedExamType, setSelectedExamType] = useState<ExamTypeValue>('all');

  // Re-derive the default selected year whenever the list of
  // available years changes. Default preference order:
  //   1. The system "active" academic year (so the live year is
  //      pre-selected by default — gives the user the most useful
  //      view on first open)
  //   2. Otherwise "All Academic Years"
  useEffect(() => {
    if (isLoadingYears || availableYears.length === 0) return;
    setSelectedYear(prev => {
      // Keep the user's current selection if it's still valid
      if (prev === 'all') return 'all';
      if (availableYears.includes(prev)) return prev;
      // Otherwise default to active year (if present) else 'all'
      if (activeYear && availableYears.includes(activeYear)) {
        return activeYear;
      }
      return 'all';
    });
  }, [availableYears, activeYear, isLoadingYears]);

  // Filter assessments for this student
  const studentAssessments = useMemo(() => {
    return MOCK_HISTORICAL_ASSESSMENTS.filter(a => a.studentId === studentId);
  }, [studentId]);

  // Compute the list of academic years that ACTUALLY have data for
  // this learner, so the dropdown only offers years that will yield
  // results when selected.
  const yearsWithData = useMemo(() => {
    return Array.from(new Set(studentAssessments.map(a => a.academicYear))).sort(
      (a, b) => parseInt(b) - parseInt(a)
    );
  }, [studentAssessments]);

  // Apply the year + tab + exam-type filters to the student's
  // historical assessments BEFORE we group by year/grade below.
  const filteredAssessmentsByYear = useMemo(() => {
    return studentAssessments.filter(a => {
      // Year filter
      if (selectedYear !== 'all' && a.academicYear !== selectedYear) return false;
      // Tab filter
      if (activeTab !== 'all' && a.assessmentType !== activeTab) return false;
      // Exam-type filter
      if (selectedExamType !== 'all' && a.examType !== selectedExamType) return false;
      return true;
    });
  }, [studentAssessments, selectedYear, activeTab, selectedExamType]);

  // Group by academic year and grade level (using the filtered set)
  const historyGroups: AcademicHistoryGroup[] = useMemo(() => {
    const grouped = filteredAssessmentsByYear.reduce((acc, assessment) => {
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
  }, [filteredAssessmentsByYear]);

  // === Summary Header Stats (scoped to the selected year filter) ===
  const totalFilteredRecords = filteredAssessmentsByYear.length;
  const totalAllRecords = studentAssessments.length;
  const formativeCount = filteredAssessmentsByYear.filter(a => a.assessmentType === 'Formative').length;
  const summativeCount = filteredAssessmentsByYear.filter(a => a.assessmentType === 'Summative').length;
  const reportCount = filteredAssessmentsByYear.filter(a => a.assessmentType === 'ReportCard').length;
  const eeCount = filteredAssessmentsByYear.filter(a => a.performanceLevel === 'EE').length;

  // Total records matching the current year (all types) — used for
  // the "EE Count" tile so the user always sees how many top-tier
  // results are in the current view, regardless of which tab is
  // selected.
  const totalForCurrentYear = useMemo(() => {
    if (selectedYear === 'all') {
      return studentAssessments.filter(a => a.examType === selectedExamType).length;
    }
    return studentAssessments.filter(a =>
      a.academicYear === selectedYear && a.examType === selectedExamType
    ).length;
  }, [studentAssessments, selectedYear, selectedExamType]);

  const toggleYear = (year: string) => {
    setExpandedYears(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(year)) {
        newExpanded.delete(year);
      } else {
        newExpanded.add(year);
      }
      return newExpanded;
    });
  };

  // Count how many of the current filtered records fall into each
  // performance level so the badge counts always reflect the user's
  // active filter (not the unfiltered total).
  const levelCounts = useMemo(() => {
    return {
      EE: filteredAssessmentsByYear.filter(a => a.performanceLevel === 'EE').length,
      ME: filteredAssessmentsByYear.filter(a => a.performanceLevel === 'ME').length,
      AE: filteredAssessmentsByYear.filter(a => a.performanceLevel === 'AE').length,
      BE: filteredAssessmentsByYear.filter(a => a.performanceLevel === 'BE').length,
    };
  }, [filteredAssessmentsByYear]);

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
                <span className="text-xs text-slate-400">{assessment.term}</span>
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

  // === Loading Skeleton (rendered while years are being loaded) ===
  const renderLoadingState = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-slate-50 rounded-xl p-4 animate-pulse">
            <div className="h-3 w-20 bg-slate-200 rounded mb-2" />
            <div className="h-7 w-14 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-slate-50 rounded-2xl p-6 animate-pulse">
            <div className="h-5 w-32 bg-slate-200 rounded mb-3" />
            <div className="h-3 w-full bg-slate-200 rounded mb-2" />
            <div className="h-3 w-3/4 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );

  // === Empty State (rendered when the active filter has no data) ===
  const renderEmptyState = () => {
    const isYearFilter = selectedYear !== 'all';
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center animate-in fade-in">
        <div className="p-4 bg-slate-50 rounded-full text-slate-300">
          <AlertCircle size={36} />
        </div>
        <p className="text-slate-700 font-bold text-base">
          {isYearFilter 
            ? `No records found for ${selectedYear}`
            : 'No academic history available yet'}
        </p>
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
          {isYearFilter
            ? 'This learner does not have any assessment records recorded for the selected academic year. Try a different year from the dropdown above, or clear the year filter to view all records.'
            : 'No historical assessment data exists for this learner. Records will appear here as soon as exams are entered into the system.'}
        </p>
        {isYearFilter && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedYear('all')}
            className="rounded-xl mt-2 font-bold text-xs border-slate-200"
          >
            <X size={14} className="mr-1" /> Clear year filter
          </Button>
        )}
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-indigo-600">{totalFilteredRecords}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Records</p>
            {selectedYear !== 'all' && (
              <p className="text-[9px] font-bold text-indigo-500 uppercase mt-0.5">
                In {selectedYear}
              </p>
            )}
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-purple-600">{formativeCount}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Formative</p>
            {activeTab === 'Formative' && <span className="text-[9px] font-black text-purple-500">Active tab</span>}
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-emerald-600">{summativeCount}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Summative</p>
            {activeTab === 'Summative' && <span className="text-[9px] font-black text-emerald-500">Active tab</span>}
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-amber-600">{reportCount}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reports</p>
            {activeTab === 'ReportCard' && <span className="text-[9px] font-black text-amber-500">Active tab</span>}
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-rose-600">{levelCounts.EE}</p>
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

          {/* Academic Year Filter Dropdown */}
          <div className="w-full sm:w-auto">
            <Select 
              value={selectedYear} 
              onValueChange={(val) => setSelectedYear(val)}
              disabled={isLoadingYears || availableYears.length === 0}
            >
              <SelectTrigger 
                className="w-full sm:w-[200px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Filter by academic year"
              >
                <div className="flex items-center gap-2 w-full">
                  {isLoadingYears ? (
                    <Loader2 size={14} className="animate-spin text-indigo-500" />
                  ) : (
                    <Calendar size={14} className="text-slate-400" />
                  )}
                  <SelectValue placeholder={isLoadingYears ? "Loading years..." : "Select year"} />
                </div>
              </SelectTrigger>
              <SelectContent>
                {/* Always-available "All Academic Years" option */}
                <SelectItem value="all">
                  <span className="font-bold">All Academic Years</span>
                  <span className="ml-2 text-[10px] text-slate-400 font-bold">
                    ({totalAllRecords} total)
                  </span>
                </SelectItem>

                {/* Dynamically-populated years from system config + student record */}
                {availableYears.map((year) => {
                  const yearCount = studentAssessments.filter(a => a.academicYear === year).length;
                  const isCurrentYear = year === activeYear;
                  return (
                    <SelectItem key={year} value={year}>
                      <span className={cn("font-bold", isCurrentYear && "text-indigo-700")}>
                        {year}
                      </span>
                      {isCurrentYear && (
                        <span className="ml-2 text-[10px] text-indigo-500 font-black uppercase tracking-wider">
                          Current
                        </span>
                      )}
                      <span className="ml-2 text-[10px] text-slate-400 font-bold">
                        ({yearCount})
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Exam Type Filter Dropdown */}
          <div className="w-full sm:w-auto">
            <Select 
              value={selectedExamType} 
              onValueChange={(val) => setSelectedExamType(val as ExamTypeValue)}
            >
              <SelectTrigger 
                className="w-full sm:w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                aria-label="Filter by exam type"
              >
                <div className="flex items-center gap-2 w-full">
                  <Filter size={14} className="text-slate-400" />
                  <SelectValue placeholder="All Exam Types" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {EXAM_TYPES.map((exam) => (
                  <SelectItem key={exam.value} value={exam.value}>
                    {exam.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Performance Level Legend */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <h4 className="font-black text-xs text-slate-400 uppercase tracking-wider mb-3">
            Performance Levels
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PERFORMANCE_LEVELS.map((level) => (
              <div key={level.code} className="flex items-center gap-2">
                <Badge className={cn("font-bold", level.bgColor, level.color)}>
                  {level.code}
                </Badge>
                <span className="text-xs font-medium text-slate-600">{level.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content: Loading / History / Empty State */}
        {isLoadingYears ? (
          renderLoadingState()
        ) : historyGroups.length > 0 ? (
          <div className="space-y-4">
            {historyGroups.map((group, index) => {
              const filteredAssessments = group.assessments;
              const hasFiltered = filteredAssessments.length > 0;
              const isExpanded = expandedYears.has(group.academicYear);
              
              // Auto-expand first group on initial render
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
                      {group.academicYear === activeYear && (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                          Active Year
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-100 text-slate-600 border-none">
                        {filteredAssessments.length} / {studentAssessments.filter(a => a.academicYear === group.academicYear).length} records
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
            })}
          </div>
        ) : (
          renderEmptyState()
        )}

        {/* Performance Level Legend - Always visible at bottom */}
      </div>
    </Modal>
  );
};

export default AcademicHistoryModal;