"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Plus, Edit3, Trash2, X, UserPlus,
  Printer, Download, ChevronDown, FileText, Users,
  AlertCircle, Loader2, ExternalLink, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAcademicCalendar } from '@/hooks/useAcademicCalendar';
import { INITIAL_SEED_DATA } from '@/data/initialSeedData';
import { useFileDownload } from '@/utils/fileDownloader';
import RegisterModal from '@/components/students/RegisterModal';
import { StudentTransferInfo } from '@/types/transfer';
import { cn } from '@/lib/utils';

interface Learner {
  id: string;
  admNo: string;
  name: string;
  grade: string;
  stream: string;
  gender: 'Male' | 'Female' | 'Other';
  guardian: string;
  phone: string;
  birthCertificateNo?: string;
  email?: string;
  dob?: string;
  dateOfAdmission?: string;
  feeBalance?: number;
  account?: { balance: number };
  coCurricularActivities?: string;
}

const DEFAULT_LEARNERS: Learner[] = INITIAL_SEED_DATA.students as Learner[];

const FILTER_STATE_KEY = 'learners_filter_state';
const GRADES_KEYS = ['munyaka_grades', 'munyaka_grades_streams', 'munyaka_grades_streams_data', 'gradeStreamSettings', 'school_grades_streams_data'];

const normalizeStreamName = (name: string): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

const normalizeGradeName = (name: string): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

const getGradeMatchKey = (name: string): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (lower === 'pp1' || lower === 'pp2') return lower;
  const digitMatch = lower.match(/(\d+)/);
  if (digitMatch) return `grade${digitMatch[1]}`;
  return lower.replace(/\s+/g, '');
};

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

/**
 * Build a complete StudentTransferInfo record from a Learner by layering
 * the directory fields with whatever additional data the caller has
 * already stored locally (e.g. on the per-student fee override).
 *
 * This guarantees the TransferWorkflow and details view receive a fully
 * populated record with a real fee balance (or 0 fallback), the right
 * ID, the right admission number, and the right name — so each row's
 * view icon opens THAT specific student's data instead of a hardcoded
 * constant.
 */
const toTransferInfo = (learner: Learner): StudentTransferInfo => {
  // ── Fee balance resolution ──
  // Order of precedence:
  //   1. learner.feeBalance (number)
  //   2. learner.account.balance (number)
  //   3. 0 fallback
  const rawBalance = (learner as any).feeBalance ?? learner.account?.balance ?? 0;
  const feeBalance = Number.isFinite(rawBalance) ? rawBalance : 0;

  return {
    id: learner.id,
    name: learner.name,
    admNo: learner.admNo,
    grade: learner.grade,
    stream: learner.stream,
    gender: learner.gender,
    dob: learner.dob || '',
    guardian: learner.guardian,
    phone: learner.phone,
    email: learner.email || '',
    health: '',
    needs: '',
    dateOfAdmission: learner.dateOfAdmission || '',
    status: 'Active' as const,
    feeBalance,
    coCurricularActivities: learner.coCurricularActivities || 'No co-curricular activities recorded.',
  };
};

export default function Students() {
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

  // Active row state — which learner the details view modal is currently showing
  const [activeLearner, setActiveLearner] = useState<StudentTransferInfo | null>(null);

  const { activeTerm, activeYear, isLoading } = useAcademicCalendar();
  const termBadge = useMemo(() => {
    if (isLoading) return `Term ${activeTerm}, ${activeYear}`;
    return `${activeTerm}, ${activeYear}`;
  }, [activeTerm, activeYear, isLoading]);

  useEffect(() => {
    try {
      localStorage.setItem('school_learners_data', JSON.stringify(learners));
    } catch (e) {
      console.error('Error saving learners to localStorage', e);
    }
  }, [learners]);

  const [gradesConfig, setGradesConfig] = useState(() => readGradesAndStreams());

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

  const normalizedLearners = useMemo(
    () => learners.map((l) => ({ ...l, stream: normalizeStreamName(l.stream) })),
    [learners]
  );

  const allLearnerStreams = useMemo(() => {
    const set = new Set<string>();
    normalizedLearners.forEach((l) => {
      if (l.stream) set.add(l.stream);
    });
    return Array.from(set).sort();
  }, [normalizedLearners]);

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

  const availableStreams = useMemo(() => {
    if (gradeFilter === 'All' || !gradeFilter) {
      const set = new Set<string>([...gradesConfig.streams, ...allLearnerStreams]);
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    }

    const matchKey = getGradeMatchKey(gradeFilter);

    const configured = gradesConfig.gradeStreamMap[matchKey];
    if (configured && configured.length > 0) {
      return Array.from(new Set(configured)).sort((a, b) => a.localeCompare(b));
    }

    const streamsForGrade = new Set<string>();
    normalizedLearners.forEach((l) => {
      const learnerKey = getGradeMatchKey(l.grade);
      if (learnerKey === matchKey && l.stream) {
        streamsForGrade.add(l.stream);
      }
    });
    return Array.from(streamsForGrade).sort((a, b) => a.localeCompare(b));
  }, [gradeFilter, gradesConfig, normalizedLearners, allLearnerStreams]);

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

  const filteredLearners = useMemo(() => {
    const selectedGradeNormalized = (gradeFilter || '').trim().toLowerCase();

    return normalizedLearners.filter(s => {
      const rawStudentGrade = s.grade || '';
      const studentGradeNormalized = String(rawStudentGrade).trim().toLowerCase();

      const matchesGrade = !studentGradeNormalized ||
        studentGradeNormalized === selectedGradeNormalized ||
        studentGradeNormalized.replace(/[^0-9]/g, '') === selectedGradeNormalized.replace(/[^0-9]/g, '') && selectedGradeNormalized.replace(/[^0-9]/g, '') !== '';

      const rawStudentStream = s.stream || '';
      const studentStreamNormalized = String(rawStudentStream).trim().toLowerCase();
      const selectedStreamNormalized = (streamFilter || '').trim().toLowerCase();

      const isAllStreams = !streamFilter || selectedStreamNormalized === 'all' || selectedStreamNormalized === '';
      const matchesStream = isAllStreams || !studentStreamNormalized || studentStreamNormalized === selectedStreamNormalized;

      const matchesSearch = !searchTerm.trim() ||
        (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        (s.admNo && s.admNo.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        (s.birthCertificateNo && s.birthCertificateNo.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        (s.id && s.id.toLowerCase().includes(searchTerm.toLowerCase().trim()));

      return matchesGrade && matchesStream && matchesSearch;
    });
  }, [normalizedLearners, searchTerm, gradeFilter, streamFilter]);

  /**
   * Open the per-row details view. We resolve a fully populated
   * StudentTransferInfo for THIS specific learner and feed it to the
   * active row state so the modal below renders that learner's data.
   */
  const handleOpenDetails = (learner: Learner) => {
    setActiveLearner(toTransferInfo(learner));
  };

  const handleCloseDetails = () => {
    setActiveLearner(null);
  };

  // ─── CSV exports ────────────────────────────────────────────────────
  const allLearnersExport = useFileDownload();
  const currentViewExport = useFileDownload();

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const buildCsvForDataset = (datasetToExport: Learner[]): string => {
    const headers = [
      'Assessment No', 'Full Name', 'Birth Certificate No',
      'Grade', 'Stream', 'Gender', 'Parent/Guardian', 'Phone'
    ];
    const rows = datasetToExport.map((l) => [
      l.admNo,
      `"${l.name}"`,
      l.birthCertificateNo || '',
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
      const fullDataset = localStorage.getItem('school_learners_data');
      if (fullDataset) {
        const parsed = JSON.parse(fullDataset);
        if (Array.isArray(parsed) && parsed.length > 0) {
          targetDataset = parsed;
        }
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

  const handlePrint = () => {
    window.print();
  };

  // ─── Register / Edit modal state ─────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLearnerId, setEditingLearnerId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    admNo: `A${Math.floor(100000 + Math.random() * 900000)}`,
    name: '',
    birthCertificateNo: '',
    grade: 'Grade 4',
    stream: '',
    gender: 'Female' as 'Male' | 'Female' | 'Other',
    guardian: '',
    phone: '',
  });
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (GRADES_LIST.length > 0 && !GRADES_LIST.includes(formData.grade)) {
      setFormData(prev => ({ ...prev, grade: GRADES_LIST[0] }));
    }
  }, [GRADES_LIST, formData.grade]);

  const handleOpenAdd = () => {
    setEditingLearnerId(null);
    setFormData({
      admNo: `A${Math.floor(100000 + Math.random() * 900000)}`,
      name: '',
      birthCertificateNo: '',
      grade: GRADES_LIST[0] || 'Grade 4',
      stream: '',
      gender: 'Female',
      guardian: '',
      phone: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (learner: Learner) => {
    setEditingLearnerId(learner.id);
    setFormData({
      admNo: learner.admNo,
      name: learner.name,
      birthCertificateNo: learner.birthCertificateNo || '',
      grade: normalizeGradeName(learner.grade),
      stream: normalizeStreamName(learner.stream),
      gender: learner.gender,
      guardian: learner.guardian,
      phone: learner.phone,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const validateAndSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.guardian.trim()) {
      setFormError('Please fill in the learner\'s Full Name and Parent / Guardian name.');
      return;
    }

    const admNo = formData.admNo.trim();
    const bcNo = formData.birthCertificateNo.trim();

    if (!admNo && !bcNo) {
      setFormError('Please provide at least one identifier — either an Assessment Number or a Birth Certificate Number.');
      return;
    }

    if (admNo) {
      const assessmentRegex = /^[A-Za-z].*/;
      if (!assessmentRegex.test(admNo)) {
        setFormError('Assessment Number must strictly begin with an alphabetic letter (e.g., A827361).');
        return;
      }
    }

    const normalizedEntry = {
      ...formData,
      grade: normalizeGradeName(formData.grade),
      stream: normalizeStreamName(formData.stream),
      birthCertificateNo: bcNo || undefined,
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormError('');
    setEditingLearnerId(null);
    setFormData({
      admNo: `A${Math.floor(100000 + Math.random() * 900000)}`,
      name: '',
      birthCertificateNo: '',
      grade: GRADES_LIST[0] || 'Grade 4',
      stream: '',
      gender: 'Female',
      guardian: '',
      phone: '',
    });
  };

  const confirmDelete = (id: string) => {
    setLearners((prev) => prev.filter((item) => item.id !== id));
    setDeleteId(null);
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
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border-t border-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
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
            placeholder="Search by learner Name, Assessment No, or Birth Certificate No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
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
                <th className="py-4 px-6">BIRTH CERT NO.</th>
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
                      <Link
                        to={`/students/${learner.id}`}
                        className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5 group/link"
                      >
                        {learner.name}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </Link>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">
                      {learner.birthCertificateNo || <span className="text-slate-300">—</span>}
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
                          onClick={() => handleOpenDetails(learner)}
                          title={`View ${learner.name}`}
                          aria-label={`View ${learner.name}`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all inline-flex items-center justify-center"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(learner)}
                          title={`Edit ${learner.name}`}
                          aria-label={`Edit ${learner.name}`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(learner.id)}
                          title={`Delete ${learner.name}`}
                          aria-label={`Delete ${learner.name}`}
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
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                        <Search size={32} />
                      </div>
                      <p className="text-slate-800 font-bold">No learners found matching your filter criteria.</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Try a different name or admission number above.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. RegisterModal — Add / Edit Learner (Dynamic Grades & Streams) */}
      <RegisterModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        fullName={formData.name}
        setFullName={(v) => setFormData({ ...formData, name: v })}
        assessmentNo={formData.admNo}
        setAssessmentNo={(v) => setFormData({ ...formData, admNo: v })}
        birthCertificateNo={formData.birthCertificateNo}
        setBirthCertificateNo={(v) => setFormData({ ...formData, birthCertificateNo: v })}
        regGrade={formData.grade}
        setRegGrade={(v) => setFormData({ ...formData, grade: v })}
        regStream={formData.stream}
        setRegStream={(v) => setFormData({ ...formData, stream: v })}
        guardianName={formData.guardian}
        setGuardianName={(v) => setFormData({ ...formData, guardian: v })}
        phone={formData.phone}
        setPhone={(v) => setFormData({ ...formData, phone: v })}
        formError={formError}
        onRegister={validateAndSave}
      />

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

      {/* ────────────────────────────────────────────────────────────────
          ACTIVE-ROW DETAILS MODAL
          Renders the StudentProfile-style view for the row whose
          view icon was just clicked. Bound to the activeLearner state
          so each icon press correctly populates this modal with THAT
          row's unique ID, name, admission number, and fee balance.
          ──────────────────────────────────────────────────────────────── */}
      {activeLearner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={handleCloseDetails}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Learner Details</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {activeLearner.name} • {activeLearner.assessment}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseDetails}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info Header */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                  {activeLearner.name?.split(' ').map(n => n?.[0] || '').join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-black text-slate-900">{activeLearner.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
                    <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {activeLearner.assessment}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-slate-700">
                      Grade {activeLearner.grade}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-slate-700">
                      {activeLearner.stream} Stream
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary rows for quick reference */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Fee Balance
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-black",
                      activeLearner.feeBalance && activeLearner.feeBalance > 0
                        ? "text-rose-600"
                        : "text-emerald-600"
                    )}
                  >
                    KES {(activeLearner.feeBalance ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Stream
                  </p>
                  <p className="text-2xl font-black text-slate-900">{activeLearner.stream}</p>
                </div>
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Status
                  </p>
                  <p className="text-2xl font-black text-emerald-600">{activeLearner.status}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  className="rounded-xl font-bold border-slate-200"
                  onClick={handleCloseDetails}
                >
                  Close
                </Button>
                <Link
                  to={`/students/${activeLearner.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 h-10 text-sm transition-all"
                >
                  <ExternalLink size={16} /> Open Full Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}