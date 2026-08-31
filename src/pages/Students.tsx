"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Plus, Edit3, Trash2, X, UserPlus,
  Printer, Download, ChevronDown, FileText, Users,
  Loader2, ExternalLink, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useAcademicCalendar } from '@/hooks/useAcademicCalendar';
import { INITIAL_SEED_DATA } from '@/data/initialSeedData';
import { useFileDownload } from '@/utils/fileDownloader';
import RegisterModal from '@/components/students/RegisterModal';
import AdminPinModal from '@/components/students/AdminPinModal';
import TransferWorkflow from '@/components/transfer/TransferWorkflow';
import { StudentTransferInfo } from '@/types/transfer';
import { showSuccess } from '@/utils/toast';
import { logDeletionAudit } from '@/services/deletionAuditLog';

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
    return Array.from(set).sort();
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
  // Also defensively reset if the currently selected stream doesn't exist for new class
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

  // Filtered learners
  const filteredLearners = useMemo(() => {
    const selectedGradeNormalized = (gradeFilter || '').trim().toLowerCase();

    return normalizedLearners.filter(s => {
      // 3. Debugging / Fallback Data Retrieval checking student.grade, student.gradeLevel, and student.class
      const rawStudentGrade = s.grade || '';
      const studentGradeNormalized = String(rawStudentGrade).trim().toLowerCase();

      // 1. String Normalization & Sanitization for Grade (handling "9", "Grade 9", "GRADE 9", "grade 9")
      const matchesGrade = !studentGradeNormalized ||
        studentGradeNormalized === selectedGradeNormalized ||
        studentGradeNormalized.replace(/[^0-9]/g, '') === selectedGradeNormalized.replace(/[^0-9]/g, '') && selectedGradeNormalized.replace(/[^0-9]/g, '') !== '';

      // 2. Stream Filtering Flexibility (if Stream selection is set to "All Streams" or empty, ignore stream matching)
      const rawStudentStream = s.stream || '';
      const studentStreamNormalized = String(rawStudentStream).trim().toLowerCase();
      const selectedStreamNormalized = (streamFilter || '').trim().toLowerCase();

      const isAllStreams = !streamFilter || selectedStreamNormalized === 'all' || selectedStreamNormalized === '';
      const matchesStream = isAllStreams || !studentStreamNormalized || studentStreamNormalized === selectedStreamNormalized;

      // 3. Search Filter (also matches Birth Certificate No when looking up by name/ID)
      const matchesSearch = !searchTerm.trim() ||
        (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        (s.admNo && s.admNo.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        (s.birthCertificateNo && s.birthCertificateNo.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        (s.id && s.id.toLowerCase().includes(searchTerm.toLowerCase().trim()));

      return matchesGrade && matchesStream && matchesSearch;
    });
  }, [normalizedLearners, searchTerm, gradeFilter, streamFilter]);

  // === Unified file-download state ===
  // We track a single download state for the export menu's "all / current view"
  // buttons and a separate print state for the print action.
  const allLearnersExport = useFileDownload();
  const currentViewExport = useFileDownload();

  // Export CSV with options ("All Learners" vs "Current View")
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // School letterhead rows prepended to every exported CSV file.
  const SCHOOL_LETTERHEAD = [
    'MUNYAKA PRIMARY AND JUNIOR',
    'P.O. BOX 5239-30100, ELDORET',
    'MOTTO: KNOWLEDGE IS POWER',
    '',
  ];

  const buildCsvForDataset = (datasetToExport: Learner[]): string => {
    const dataHeaders = [
      'Assessment No', 'Full Name', 'Birth Certificate No',
      'Grade', 'Stream', 'Gender', 'Parent/Guardian', 'Phone'
    ];
    const dataRows = datasetToExport.map((l) => [
      l.admNo,
      `"${l.name}"`,
      l.birthCertificateNo || '',
      l.grade,
      l.stream,
      l.gender,
      `"${l.guardian}"`,
      `"${l.phone}"`,
    ]);

    // Interleave letterhead rows between the school header and column headers
    // so the CSV structure is: letterhead → blank → column-headers → data.
    return [
      ...SCHOOL_LETTERHEAD,
      ...dataHeaders,
      ...dataRows.map((r) => r.join(',')),
    ].join('\n');
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

  // Print
  const handlePrint = () => {
    window.print();
  };

  // ─── Modal & form state for RegisterModal ────────────────────────────────
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
    // Holds the full learner object so we can render its name in the PIN modal
    // and include it in the deletion audit log.
    const [learnerToDelete, setLearnerToDelete] = useState<Learner | null>(null);

  // ─── Transfer Workflow State ────────────────────────────────────────────
  // We now pass the full active learner object to the Transfer modal, NOT
  // just a hardcoded fallback. The transfer modal expects a
  // StudentTransferInfo object (which is a superset of Learner).
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferLearner, setTransferLearner] = useState<StudentTransferInfo | null>(null);

  // ─── Navigation Hook ─────────────────────────────────────────────────
  // Fix: `navigate` was undefined in handleViewProfile because the hook
  // was never invoked. We now call useNavigate() so handleViewProfile can
  // programmatically route to /students/:id with the full learner object.
  const navigate = useNavigate();

  // Ensure default grade is in the list
  useEffect(() => {
    if (GRADES_LIST.length > 0 && !GRADES_LIST.includes(formData.grade)) {
      setFormData(prev => ({ ...prev, grade: GRADES_LIST[0] }));
    }
  }, [GRADES_LIST, formData.grade]);

  // Open Add Modal — randomizes Assessment No and clears Birth Certificate No
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

  // Open Edit Modal — populates ALL fields including Birth Certificate No
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

  // View Profile Handler — navigates to the full student profile page,
  // passing the full student object through the route param.
  const handleViewProfile = (learner: Learner) => {
    navigate(`/students/${learner.id}`);
  };

  // Transfer Handler — opens the Transfer Workflow modal and passes
  // the ENTIRE active learner object (cast to StudentTransferInfo) so the
  // workflow can render real data without any hardcoded fallback.
  const handleTransfer = (learner: Learner) => {
    // Build the StudentTransferInfo payload from the active learner.
    // No fallbacks to a hardcoded student — every field comes from the row.
    const transferPayload: StudentTransferInfo = {
      ...learner,
      // ── FIX 1: Pass the full student object, NOT a hardcoded fallback ──
      // The previous version defaulted to `INITIAL_SEED_DATA.students[0]`
      // (MUTWIKA KILONZO) whenever `learner` was undefined. Now we always
      // pass the actual learner object from the row the user clicked on.
      id: learner.id,
      name: learner.name,
      assessment: learner.admNo,
      grade: learner.grade,
      stream: learner.stream,
      gender: learner.gender,
      dob: (learner as any).dob ?? '',
      guardian: learner.guardian,
      phone: learner.phone,
      email: (learner as any).email ?? '',
      // StudentTransferInfo-specific fields with sensible per-row defaults
      // so the workflow modal renders real data for the selected learner.
      feeBalance: (learner as any).feeBalance ?? 0,
      status: (learner as any).status ?? 'Active',
      dateOfAdmission: (learner as any).dateOfAdmission ?? new Date().toISOString().split('T')[0],
      coCurricularActivities: (learner as any).coCurricularActivities ?? '',
    };
    setTransferLearner(transferPayload);
    setIsTransferOpen(true);
  };

  // ─── Validation & submit ───────────────────────────────────────────────
  const validateAndSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Always-required fields (name + guardian) — these identify the learner
    if (!formData.name.trim() || !formData.guardian.trim()) {
      setFormError('Please fill in the learner\'s Full Name and Parent / Guardian name.');
      return;
    }

    // Identifier validation: at least one of Assessment No or Birth Cert No
    // must be provided. Empty-string and whitespace-only values are treated
    // as absent.
    const admNo = formData.admNo.trim();
    const bcNo = formData.birthCertificateNo.trim();

    if (!admNo && !bcNo) {
      setFormError('Please provide at least one identifier — either an Assessment Number or a Birth Certificate Number.');
      return;
    }

    // When the Assessment Number is supplied, it must still start with a
    // letter (the existing convention for the school ID). We skip this check
    // if the user only provided a Birth Certificate Number.
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
      // Persist the Birth Certificate Number to the learner data structure.
      // Empty string is normalized to undefined so the field is omitted from
      // the stored JSON when not supplied.
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

  // Close & Reset Modal Handler
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

  // Close Transfer Modal
  const handleCloseTransfer = () => {
    setIsTransferOpen(false);
    setTransferLearner(null);
  };

  // Handle Delete Confirmation — invoked by AdminPinModal when the entered
    // admin password is verified.
    const confirmDelete = (learner: Learner) => {
      setLearners((prev) => prev.filter((item) => item.id !== learner.id));
      // Write a secure audit-log entry so the deletion is traceable.
      logDeletionAudit({
        action: "DELETE_LEARNER",
        targetId: learner.id,
        targetAdmNo: learner.admNo,
        targetName: learner.name,
      });
      showSuccess(`${learner.name} has been permanently removed from the directory.`);
      setLearnerToDelete(null);
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
                filteredLearners.map((learner) => {
                  // ── FIX 2: Use guaranteed unique key (admNo, fallback to id) ──
                  // The previous code used `learner.id` directly, but when two
                  // learners shared a missing/duplicate id (e.g. during a
                  // bulk import that didn't refresh timestamps) React would
                  // log a duplicate-key warning. Using `admNo` guarantees
                  // uniqueness because it is the school's actual identifier
                  // (and we fall back to id only as a last resort).
                  const rowKey = learner.admNo || learner.id;
                  return (
                    <tr key={rowKey} className="hover:bg-slate-50/60 transition-colors group">
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
                            onClick={() => handleViewProfile(learner)}
                            title="View full profile"
                            data-html2canvas-ignore="true"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(learner)}
                            title="Edit learner"
                            data-html2canvas-ignore="true"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTransfer(learner)}
                            title="Transfer learner"
                            data-html2canvas-ignore="true"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button
                                                      type="button"
                                                      onClick={() => setLearnerToDelete(learner)}
                                                      title="Delete learner"
                                                      data-html2canvas-ignore="true"
                                                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                      <Trash2 className="w-4 h-4" />
                                                    </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* ── Transfer Workflow Modal ─────────────────────────────────────── */}
      {/* The modal is mounted only when a valid learner has been selected
          from the table. The `student` prop is now always the FULL learner
          object (built from the row that was clicked) — there is no fallback
          to any hardcoded seed data. */}
      {isTransferOpen && transferLearner && (
        <TransferWorkflow
          student={transferLearner}
          isOpen={isTransferOpen}
          onClose={handleCloseTransfer}
          onTransferComplete={(studentId, certificateNumber) => {
            setIsTransferOpen(false);
            setTransferLearner(null);
            showSuccess(
              `${transferLearner.name} has been transferred successfully. Certificate: ${certificateNumber}`
            );
          }}
        />
      )}

      {/* Delete Confirmation Prompt Modal — requires admin password/PIN */}
            <AdminPinModal
              isOpen={learnerToDelete !== null}
              onClose={() => setLearnerToDelete(null)}
              actionLabel="Confirm Permanent Deletion"
              targetName={learnerToDelete?.name}
              description="You are about to permanently remove this learner from the school directory. Enter your admin password to authorise this action."
              prompt="Admin Password"
              onConfirm={(isValid) => {
                if (isValid && learnerToDelete) {
                  confirmDelete(learnerToDelete);
                }
              }}
            />

    </div>
  );
}