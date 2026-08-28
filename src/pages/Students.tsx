"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Edit3, Trash2, X, UserPlus,
  Printer, Download, ChevronDown, FileText, Users,
  AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAcademicCalendar } from '@/hooks/useAcademicCalendar';
import { INITIAL_SEED_DATA } from '@/data/initialSeedData';
import { useFileDownload } from '@/utils/fileDownloader';

interface Learner {
  id: string;
  admNo: string;
  name: string;
  grade: string;
  stream: string;
  gender: 'Male' | 'Female' | 'Other';
  guardian: string;
  phone: string;
}

const DEFAULT_LEARNERS: Learner[] = INITIAL_SEED_DATA.students as Learner[];

// Keys for persisting filter state in localStorage
const FILTER_STATE_KEY = 'learners_filter_state';
// Keys for reading the Grades & Streams configuration
const GRADES_KEYS = ['munyaka_grades', 'munyaka_grades_streams', 'munyaka_grades_streams_data', 'gradeStreamSettings', 'school_grades_streams_data'];

/**
 * Normalize a stream name to "Title Case" so we can reliably deduplicate
 * inputs like "BLUE", "blue", "Blue" -> "Blue" (single canonical form).
 */
const normalizeStreamName = (name: string): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

/**
 * Normalize a grade name to a canonical title-case form (e.g. "grade 4" -> "Grade 4").
 * Returns the trimmed name with the first character uppercased.
 */
const normalizeGradeName = (name: string): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

/**
 * Convert a grade name to a normalized comparison key (lowercase, digits-only suffix).
 * E.g. "Grade 4" -> "4", "PP1" -> "pp1", "Grade 4 (Primary)" -> "4".
 */
const getGradeMatchKey = (name: string): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (lower === 'pp1' || lower === 'pp2') return lower;
  // Extract digit-only suffix for Grade X names
  const digitMatch = lower.match(/(\d+)/);
  if (digitMatch) return `grade${digitMatch[1]}`;
  return lower.replace(/\s+/g, '');
};

/**
 * Read the Grades & Streams configuration from any of the supported localStorage
 * keys. Returns a normalized map of { gradeKey: Set<normalizedStream> }.
 */
const readGradesAndStreams = (): { grades: string[]; streams: string[]; gradeStreamMap: Record<string, string[]> } => {
  try {
    let raw: any = null;
    for (const key of GRADES_KEYS) {
      const val = localStorage.getItem(key);
      if (val) {
        const parsed = JSON.parse(val);
        if (parsed) {
          raw = parsed;
          break;
        }
      }
    }

    const gradesSet = new Set<string>();
    const streamsSet = new Set<string>();
    const gradeStreamMap: Record<string, string[]> = {};
    // Track normalized names back to canonical display names to dedupe
    const streamNormalizedToDisplay = new Map<string, string>();

    if (Array.isArray(raw)) {
      raw.forEach((item: any) => {
        if (item && typeof item === 'object') {
          const rawName = item.name || item.grade || item.label;
          if (rawName) {
            const normalizedGrade = normalizeGradeName(String(rawName));
            const matchKey = getGradeMatchKey(normalizedGrade);
            gradesSet.add(normalizedGrade);
            const streams = item.streams || item.classes;
            if (Array.isArray(streams)) {
              const perGradeList: string[] = [];
              streams.forEach((s: any) => {
                const sName = typeof s === 'string' ? s : (s?.name || s?.label);
                if (sName) {
                  const normalized = normalizeStreamName(String(sName));
                  if (normalized) {
                    streamsSet.add(normalized);
                    perGradeList.push(normalized);
                  }
                }
              });
              if (perGradeList.length > 0) {
                gradeStreamMap[matchKey] = perGradeList;
              }
            }
          }
        }
      });
    }

    // Fallback defaults if no localStorage configuration exists
    if (gradesSet.size === 0) {
      ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9']
        .forEach(g => {
          const normalized = normalizeGradeName(g);
          gradesSet.add(normalized);
        });
    }

    return {
      grades: Array.from(gradesSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      streams: Array.from(streamsSet).sort((a, b) => a.localeCompare(b)),
      gradeStreamMap,
    };
  } catch (e) {
    return {
      grades: ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'],
      streams: [],
      gradeStreamMap: {},
    };
  }
};

export default function Students() {
  // 1. LocalStorage Persistence Setup for Learners
  const [learners, setLearners] = useState<Learner[]>(() => {
    try {
      const saved = localStorage.getItem('school_learners_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading learners from localStorage', e);
    }
    localStorage.setItem('school_learners_data', JSON.stringify(DEFAULT_LEARNERS));
    return DEFAULT_LEARNERS;
  });

  // 2. Use the academic calendar hook for dynamic term/year
  const { activeTerm, activeYear, isLoading } = useAcademicCalendar();
  const termBadge = useMemo(() => {
    if (isLoading) return `Term ${activeTerm}, ${activeYear}`;
    return `${activeTerm}, ${activeYear}`;
  }, [activeTerm, activeYear, isLoading]);

  // Automatically sync learners back to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('school_learners_data', JSON.stringify(learners));
    } catch (e) {
      console.error('Error saving learners to localStorage', e);
    }
  }, [learners]);

  // 3. Read the grades & streams configuration. We re-read on a tick so that
  // changes made in the "Grades & Streams" page reflect here immediately.
  const [gradesConfig, setGradesConfig] = useState(() => readGradesAndStreams());

  // 4. Subscribe to localStorage writes that affect the grades configuration
  // and to the custom `munyaka_grades_updated` event so we refresh instantly.
  useEffect(() => {
    const refresh = () => setGradesConfig(readGradesAndStreams());

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || GRADES_KEYS.includes(e.key)) {
        refresh();
      }
    };
    const handleCustom = () => refresh();
    const handleFocus = () => refresh();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('munyaka_grades_updated', handleCustom);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('munyaka_grades_updated', handleCustom);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const GRADES_LIST = gradesConfig.grades;

  // Normalize all learner streams once so the table is case-consistent.
  const normalizedLearners = useMemo(
    () => learners.map((l) => ({ ...l, stream: normalizeStreamName(l.stream) })),
    [learners]
  );

  // 5. Build a global normalized set of every stream that exists across the
  // learner table (so we always have a fallback if the Grades & Streams
  // configuration is empty for some reason).
  const allLearnerStreams = useMemo(() => {
    const set = new Set<string>();
    normalizedLearners.forEach((l) => {
      if (l.stream) set.add(l.stream);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [normalizedLearners]);

  // 6. Filters state — initialized from localStorage if available
  const [searchTerm, setSearchTerm] = useState(() => {
    try {
      const saved = localStorage.getItem(FILTER_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.searchTerm || '';
      }
    } catch (e) {
      return '';
    }
    return '';
  });

  const [gradeFilter, setGradeFilter] = useState(() => {
    try {
      const saved = localStorage.getItem(FILTER_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.gradeFilter || 'All';
      }
    } catch (e) {
      return 'All';
    }
    return 'All';
  });

  const [streamFilter, setStreamFilter] = useState(() => {
    try {
      const saved = localStorage.getItem(FILTER_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.streamFilter || 'All';
      }
    } catch (e) {
      return 'All';
    }
    return 'All';
  });

  // Persist filter states to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(FILTER_STATE_KEY, JSON.stringify({
        searchTerm,
        gradeFilter,
        streamFilter,
      }));
    } catch (e) {
      console.error('Error saving filter state to localStorage', e);
    }
  }, [searchTerm, gradeFilter, streamFilter]);

  // 7. Compute the list of streams available for the currently selected grade.
  // Priority: configuration map -> normalized streams from the learner table -> all streams.
  const availableStreams = useMemo(() => {
    if (gradeFilter === 'All' || !gradeFilter) {
      // When "All Grades" is selected, show every unique normalized stream we
      // know about (deduplicated union of config + learner table).
      const set = new Set<string>([...gradesConfig.streams, ...allLearnerStreams]);
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    }

    // Match the selected grade by its normalized match key.
    const matchKey = getGradeMatchKey(gradeFilter);

    // First, try the configuration map
    const configured = gradesConfig.gradeStreamMap[matchKey];
    if (configured && configured.length > 0) {
      return Array.from(new Set(configured)).sort((a, b) => a.localeCompare(b));
    }

    // Fallback: derive streams from learners that belong to the selected grade
    const streamsForGrade = new Set<string>();
    normalizedLearners.forEach((l) => {
      const learnerKey = getGradeMatchKey(l.grade);
      if (learnerKey === matchKey && l.stream) {
        streamsForGrade.add(l.stream);
      }
    });
    return Array.from(streamsForGrade).sort((a, b) => a.localeCompare(b));
  }, [gradeFilter, gradesConfig, normalizedLearners, allLearnerStreams]);

  // When the grade filter changes, automatically reset the stream filter to "All".
  // Also defensively reset if the currently selected stream isn't in the
  // newly-derived availableStreams list (e.g. if Grades & Streams was edited).
  useEffect(() => {
    if (streamFilter !== 'All' && !availableStreams.includes(streamFilter)) {
      setStreamFilter('All');
    }
  }, [availableStreams, streamFilter]);

  const handleGradeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGrade = e.target.value;
    setGradeFilter(newGrade);
    setStreamFilter('All');
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLearnerId, setEditingLearnerId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    admNo: `A${Math.floor(100000 + Math.random() * 900000)}`,
    name: '',
    grade: GRADES_LIST[0] || 'Grade 4',
    stream: '',
    gender: 'Female' as 'Male' | 'Female' | 'Other',
    guardian: '',
    phone: '',
  });

  const [formError, setFormError] = useState('');

  // When the grades config loads, ensure the form starts on a valid grade
  useEffect(() => {
    if (GRADES_LIST.length > 0 && !GRADES_LIST.includes(formData.grade)) {
      setFormData(prev => ({ ...prev, grade: GRADES_LIST[0] }));
    }
  }, [GRADES_LIST, formData.grade]);

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filtered learners
  const filteredLearners = useMemo(() => {
    return normalizedLearners.filter((learner) => {
      const matchesSearch =
        learner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        learner.admNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        learner.guardian.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGrade = gradeFilter === 'All' || getGradeMatchKey(learner.grade) === getGradeMatchKey(gradeFilter);
      const matchesStream = streamFilter === 'All' || learner.stream === streamFilter;

      return matchesSearch && matchesGrade && matchesStream;
    });
  }, [normalizedLearners, searchTerm, gradeFilter, streamFilter]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingLearnerId(null);
    setFormData({
      admNo: `A${Math.floor(100000 + Math.random() * 900000)}`,
      name: '',
      grade: GRADES_LIST[0] || 'Grade 4',
      stream: '',
      gender: 'Female',
      guardian: '',
      phone: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (learner: Learner) => {
    setEditingLearnerId(learner.id);
    setFormData({
      admNo: learner.admNo,
      name: learner.name,
      grade: normalizeGradeName(learner.grade),
      stream: normalizeStreamName(learner.stream),
      gender: learner.gender,
      guardian: learner.guardian,
      phone: learner.phone,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleSaveLearner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.admNo.trim() || !formData.name.trim() || !formData.guardian.trim()) {
      setFormError('Please fill in all required fields (Assessment No, Full Name, Parent/Guardian).');
      return;
    }

    const assessmentRegex = /^[A-Za-z].*/;
    if (!assessmentRegex.test(formData.admNo)) {
      setFormError('Assessment Number must strictly begin with an alphabetic letter (e.g., A827361).');
      return;
    }

    const normalizedEntry = {
      ...formData,
      grade: normalizeGradeName(formData.grade),
      stream: normalizeStreamName(formData.stream),
    };

    if (editingLearnerId) {
      setLearners((prev) =>
        prev.map((item) =>
          item.id === editingLearnerId
            ? { ...item, ...normalizedEntry }
            : item
        )
      );
    } else {
      const newLearner: Learner = {
        id: Date.now().toString(),
        ...normalizedEntry,
      };
      setLearners((prev) => [newLearner, ...prev]);
    }

    setIsModalOpen(false);
  };

  // Close & Reset Modal Handler
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormError('');
    setEditingLearnerId(null);
    setFormData({
      admNo: `A${Math.floor(100000 + Math.random() * 900000)}`,
      name: '',
      grade: GRADES_LIST[0] || 'Grade 4',
      stream: '',
      gender: 'Female',
      guardian: '',
      phone: '',
    });
  };

  // Handle Delete Confirmation
  const confirmDelete = (id: string) => {
    setLearners((prev) => prev.filter((item) => item.id !== id));
    setDeleteId(null);
  };

  // === Unified file-download state ===
  // We track a single download state for the export menu's "all / current view"
  // buttons and a separate print state for the print action.
  const allLearnersExport = useFileDownload();
  const currentViewExport = useFileDownload();

  // Export CSV with options ("All Learners" vs "Current View")
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const buildCsvForDataset = (datasetToExport: Learner[]): string => {
    const headers = ['Assessment No', 'Name', 'Grade', 'Stream', 'Gender', 'Parent/Guardian', 'Phone'];
    const rows = datasetToExport.map((l) => [
      l.admNo,
      `"${l.name}"`,
      l.grade,
      l.stream,
      l.gender,
      `"${l.guardian}"`,
      `"${l.phone}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  const handleExportAll = async () => {
    setIsExportMenuOpen(false);
    let targetDataset = learners;
    try {
      const fullDataset = JSON.parse(localStorage.getItem('school_learners_data') || '[]');
      if (Array.isArray(fullDataset) && fullDataset.length > 0) {
        targetDataset = fullDataset;
      }
    } catch {
      targetDataset = learners;
    }
    const csv = buildCsvForDataset(targetDataset);
    await allLearnersExport.download({
      filename: `learners_export_${new Date().toISOString().slice(0, 10)}.csv`,
      data: csv,
      mimeType: 'text/csv;charset=utf-8;',
      fileType: 'csv',
    });
  };

  const handleExportCurrentView = async () => {
    setIsExportMenuOpen(false);
    const csv = buildCsvForDataset(filteredLearners);
    await currentViewExport.download({
      filename: `learners_view_${new Date().toISOString().slice(0, 10)}.csv`,
      data: csv,
      mimeType: 'text/csv;charset=utf-8;',
      fileType: 'csv',
    });
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  const isAnyExportInProgress =
    allLearnersExport.isDownloading || currentViewExport.isDownloading;

  return (
    <div className="p-6 md:p-10 bg-[#FBFBFA] min-h-screen text-slate-800">
      
      {/* 2. Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Learners Management</h1>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full shadow-2xs">
              {termBadge}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">
            {filteredLearners.length} learners found {learners.length !== filteredLearners.length && `(filtered from ${learners.length} total)`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={isAnyExportInProgress}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl shadow-2xs transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isAnyExportInProgress ? (
                <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-slate-500" />
              )}
              {isAnyExportInProgress ? "Exporting…" : "Export CSV"}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={handleExportAll}
                  disabled={isAnyExportInProgress}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  All Learners
                </button>
                <button
                  type="button"
                  onClick={handleExportCurrentView}
                  disabled={isAnyExportInProgress}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-2 border-t border-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Current View ({filteredLearners.length})
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl shadow-2xs transition-all"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            + Add Learner
          </button>
        </div>
      </div>

      {/* 3. Filters Bar (Dynamic Grades & Streams from LocalStorage) */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs mb-6 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by learner Name or Assessment No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Grade Dropdown */}
          <div className="w-full md:w-48">
            <select
              value={gradeFilter}
              onChange={handleGradeFilterChange}
              className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Grades</option>
              {GRADES_LIST.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          {/* Stream Dropdown (Dynamically populated based on selected Grade) */}
          <div className="w-full md:w-48">
            <select
              value={streamFilter}
              onChange={(e) => setStreamFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Streams</option>
              {availableStreams.length === 0 ? (
                <option value="__none__" disabled>No streams configured</option>
              ) : (
                availableStreams.map((stream) => (
                  <option key={stream} value={stream}>{stream}</option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Table Layout & Styling */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">ASSESSMENT NO.</th>
                <th className="py-4 px-6">NAME</th>
                <th className="py-4 px-6">GRADE</th>
                <th className="py-4 px-6">STREAM</th>
                <th className="py-4 px-6">GENDER</th>
                <th className="py-4 px-6">PARENT/GUARDIAN</th>
                <th className="py-4 px-6">PHONE</th>
                <th className="py-4 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLearners.length > 0 ? (
                filteredLearners.map((learner) => (
                  <tr key={learner.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-indigo-600">
                      {learner.admNo}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {learner.name}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                        {learner.grade}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {learner.stream}
                    </td>
                    <td className="py-4 px-6">
                      {learner.gender === 'Female' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200">
                          Female
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {learner.gender}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-700 font-medium">
                      {learner.guardian}
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-mono text-xs">
                      {learner.phone}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(learner)}
                          title="Edit learner"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(learner.id)}
                          title="Delete learner"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p className="font-medium text-slate-600">No learners found matching your filter criteria.</p>
                      <p className="text-xs text-slate-400">Try adjusting your search query or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal Dialog for Add / Edit Learner (Dynamic Grades & Streams) */}
      {isModalOpen && (
        <div
          onClick={handleCloseModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {editingLearnerId ? 'Edit Learner Details' : 'Register New Learner'}
                  </h3>
                  <p className="text-xs text-slate-500">Fill in student bio and guardian details below</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg text-xl transition-all"
                title="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLearner} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Assessment Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.admNo}
                      onChange={(e) => setFormData({ ...formData, admNo: e.target.value })}
                      placeholder="e.g. A827361"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Brian Kiprop"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Grade *
                    </label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value, stream: '' })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      {GRADES_LIST.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Stream *
                    </label>
                    <select
                      value={formData.stream}
                      onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="">Select stream...</option>
                      {(() => {
                        const matchKey = getGradeMatchKey(formData.grade);
                        const configured = gradesConfig.gradeStreamMap[matchKey] || [];
                        // Build a deduped list: configured streams first, then
                        // any learner-recorded streams for the same grade.
                        const streamsForGrade = new Set<string>(configured);
                        normalizedLearners.forEach((l) => {
                          if (getGradeMatchKey(l.grade) === matchKey && l.stream) {
                            streamsForGrade.add(l.stream);
                          }
                        });
                        return Array.from(streamsForGrade).sort((a, b) => a.localeCompare(b));
                      })().map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Gender *
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Parent / Guardian Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.guardian}
                      onChange={(e) => setFormData({ ...formData, guardian: e.target.value })}
                      placeholder="e.g. Mary Kiprop"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +254 711 223 344"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t shrink-0 bg-gray-50">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-sm font-medium text-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all active:scale-95"
                >
                  {editingLearnerId ? 'Update Learner' : 'Save Learner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Prompt Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Remove Learner?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to remove this learner from LocalStorage? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(deleteId)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}