"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Plus, Edit3, Trash2, X, UserPlus,
  Printer, Download, ChevronDown, FileText, Users,
  Loader2, ExternalLink, Eye, Archive, ArrowRightLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useAcademicCalendar } from '@/hooks/useAcademicCalendar';
import { INITIAL_SEED_DATA } from '@/data/initialSeedData';
import { useFileDownload } from '@/utils/fileDownloader';
import RegisterModal from '@/components/students/RegisterModal';
import AdminPinModal from '@/components/students/AdminPinModal';
import TransferWorkflow from '@/components/transfer/TransferWorkflow';
import TransferInModal from '@/components/students/TransferInModal';
import { StudentTransferInfo } from '@/types/transfer';
import { Learner } from '@/types/learners';
import { showSuccess } from '@/utils/toast';
import { logDeletionAudit } from '@/services/deletionAuditLog';
import { useAuth } from '@/context/AuthContext';
import { notifyDataChanged } from '@/utils/storage';
import {
  readGradesAndStreams,
  getStreamsForGrade,
  GradesStreamsConfig,
} from '@/services/gradesStreamsConfig';
import LearnerManagementMenu from '@/components/students/LearnerManagementMenu';
import {
  buildLearnerMenuFilters,
  applyLearnerFilter,
} from '@/data/mockLearnerMenu';
import type {
  LearnerMenuData,
  LearnerMenuItem,
} from '@/types/learnerMenu';

interface LearnerRowCompat {
  id: string;
  admNo: string;
  name: string;
  grade: string;
  stream: string;
  gender: 'Male' | 'Female' | 'Other';
  guardian: string;
  phone: string;
  birthCertificateNo?: string;
  status?: 'Active' | 'TRANSFERRED' | 'Graduated' | 'Suspended';
}

const DEFAULT_LEARNERS: LearnerRowCompat[] = INITIAL_SEED_DATA.students as LearnerRowCompat[];

// ── Dynamic Learner Management Menu ───────────────────────────────────────
// menuFilterId drives which category is selected in the side-rail menu.
// 'all' shows every learner; the sidebar filter row uses this to derive
// its active state and count badges dynamically from the live learners array.
const [menuFilterId, setMenuFilterId] = useState('all');

// Key for persisting filter state in localStorage
const FILTER_STATE_KEY = 'learners_filter_state';

// LocalStorage keys the Grades & Streams setter module writes to.
const GRADES_KEYS = [
  'munyaka_grades',
  'munyaka_grades_streams',
  'munyaka_grades_streams_data',
  'gradeStreamSettings',
  'school_grades_streams_data',
];

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
 */
const normalizeGradeName = (name: string): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

/**
 * Convert a grade name to a normalized comparison key (lowercase, digits-only suffix).
 */
const getGradeMatchKey = (name: string): string => {
  if (!name) return '';
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return '';
  if (trimmed === 'pp1' || trimmed === 'pp2') return trimmed;
  const m = trimmed.match(/(\d+)/);
  if (m) return `grade${m[1]}`;
  return trimmed.replace(/\s+/g, '');
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
      notifyDataChanged('school_learners_data');
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
    // All streams are sourced exclusively from the live Grades & Streams configuration
    // written by the GradesStreams.tsx setter module. No learner-table fallback.
    const availableStreams = useMemo((): string[] => {
      if (gradeFilter === 'All' || !gradeFilter) {
        // "All Grades" → show every unique stream across all grades.
        return gradesConfig.streams.slice().sort((a, b) => a.localeCompare(b));
      }
      // A specific grade is selected → use the grade-specific stream map.
      return getStreamsForGrade(gradeFilter, gradesConfig);
    }, [gradeFilter, gradesConfig]);

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
      // Normalise the filter values for comparison.  Accepted "all" values
      // (case-insensitive, with or without whitespace) all resolve to the
      // sentinel string 'ALL_GRADES' so we can test them in a single branch.
      const isAllGrades = !gradeFilter
        || gradeFilter === 'All'
        || gradeFilter === 'All Grades'
        || gradeFilter.trim().toLowerCase() === 'all';
  
      const isAllStreams = !streamFilter
        || streamFilter === 'All'
        || streamFilter === 'All Streams'
        || streamFilter.trim().toLowerCase() === 'all';
  
      return normalizedLearners.filter(s => {
        // ── Grade match ─────────────────────────────────────────────────────
        // Skip grade comparison entirely when "All Grades" is selected.
        // When a specific grade IS selected, accept:
        //   • exact case-insensitive match ("Grade 7" === "Grade 7")
        //   • bare numeric match ("7" in DB  vs  "Grade 7" selected)
        //   • "grade 7" in DB         vs  "Grade 7" selected)
        //   • "GRADE 7" in DB         vs  "Grade 7" selected)
        let matchesGrade = true;
        if (!isAllGrades) {
          const filterGrade = gradeFilter.trim().toLowerCase();
          const learnerGrade = (s.grade || '').trim().toLowerCase();
          matchesGrade =
            learnerGrade === filterGrade ||
            learnerGrade.replace(/\s+/g, '') === filterGrade.replace(/\s+/g, '') ||
            learnerGrade.replace(/[^0-9]/g, '') === filterGrade.replace(/[^0-9]/g, '');
        }
  
        // ── Stream match ────────────────────────────────────────────────────
        // Same pattern as grade: skip when "All Streams" is selected.
        let matchesStream = true;
        if (!isAllStreams) {
          const filterStream = (streamFilter || '').trim().toLowerCase();
          const learnerStream = (s.stream || '').trim().toLowerCase();
          matchesStream =
            learnerStream === filterStream ||
            learnerStream.replace(/\s+/g, '') === filterStream.replace(/\s+/g, '');
        }
  
        // ── Search match ────────────────────────────────────────────────────
        const q = (searchTerm || '').trim().toLowerCase();
        const matchesSearch = !q ||
          (s.name || '').toLowerCase().includes(q) ||
          (s.admNo || '').toLowerCase().includes(q) ||
          ((s as any).birthCertificateNo || '').toLowerCase().includes(q) ||
          (s.id || '').toLowerCase().includes(q);
  
        return matchesGrade && matchesStream && matchesSearch;
      })
      // Exclude transferred learners from the active roster. They live in the
      // dedicated Transferred Learners Archive (/learners/archive) instead.
      .filter((s) => s.status !== 'TRANSFERRED');
    }, [normalizedLearners, searchTerm, gradeFilter, streamFilter]);

  // === Unified file-download state ===
  // We track a single download state for the export menu's "all / current view"
  // buttons and a separate print state for the print action.
  const allLearnersExport = useFileDownload();
  const currentViewExport = useFileDownload();

  // Export CSV with options ("All Learners" vs "Current View")
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // ─── Transfer In Modal ───────────────────────────────────────────
  const [isTransferInOpen, setIsTransferInOpen] = useState(false);

  // ─── Official school letterhead ──────────────────────────────────────────
    // The exported CSV has 8 data columns (A through H). To make the school
    // header text appear visually centered above the table, each letterhead
    // row is padded with empty cells (rendered as leading commas) so that
    // the actual text lands around column D — the midpoint of an 8-column
    // table. Every letterhead row is forced to exactly 8 cells so the column
    // alignment carries over cleanly to the data rows below.
    const DATA_COLUMN_COUNT = 8;
    const LEADING_PADDING = 3; // 3 empty cells → text appears in column D (centered)
  
    const buildCsvForDataset = (datasetToExport: LearnerRowCompat[]): string => {
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
  
      // Helper — produce a centred letterhead row of exactly DATA_COLUMN_COUNT
      // cells, with `LEADING_PADDING` empty cells before the school text.
      const centeredRow = (text: string): string[] => {
        const row: string[] = Array(LEADING_PADDING).fill('');
        row.push(text);
        // Pad out to the full data-column width so the row spans A–H.
        while (row.length < DATA_COLUMN_COUNT) row.push('');
        return row;
      };
  
      // Combine every CSV line as a properly delimited row so column layout
      // is preserved when opened in a spreadsheet application.
      const allRows: string[][] = [
        centeredRow('MUNYAKA PRIMARY AND JUNIOR'),       // Row 1 — centred
        centeredRow('P.O. BOX 5239-30100, ELDORET'),      // Row 2 — centred
        centeredRow('MOTTO: KNOWLEDGE IS POWER'),         // Row 3 — centred
        Array(DATA_COLUMN_COUNT).fill(''),               // Row 4 — blank separator
        dataHeaders,                                     // Row 5 — column headers
        ...dataRows,                                     // Row 6+ — student data
      ];
      return allRows.map((row) => row.join(',')).join('\n');
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
  
    // Resolve the current admin user for audit logging. The Transfer In
    // workflow records `actorName` on every TRANSFERRED_IN event so the
    // academic-history log shows who performed the enrollment.
    const { user } = useAuth();

    // Admin-only flag: controls visibility of sensitive management actions.
    // NOTE: 'owner' is a BILLING-ONLY role — it must NOT be included here.
    // The owner has no operational access to learner management, transfers,
    // or archive.  Only admin (full admin) and head_teacher qualify.
    const isAdmin = user?.role === 'admin' || user?.role === 'head_teacher';

  // Ensure default grade is in the list only on initial mount when formData.grade is empty
  useEffect(() => {
    if (!formData.grade && GRADES_LIST.length > 0) {
      setFormData(prev => ({ ...prev, grade: GRADES_LIST[0] }));
    }
  }, [GRADES_LIST]);

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
  const handleOpenEdit = (learner: LearnerRowCompat) => {
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
  const handleViewProfile = (learner: LearnerRowCompat) => {
    navigate(`/students/${learner.id}`);
  };

  // Transfer Handler — opens the Transfer Workflow modal and passes
  // the ENTIRE active learner object (cast to StudentTransferInfo) so the
  // workflow can render real data without any hardcoded fallback.
  const handleTransfer = (learner: LearnerRowCompat) => {
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
      health: '',
      needs: '',
      examType: '',
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
      const newLearner: LearnerRowCompat = {
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
    
      // ─── Transfer In Handler ─────────────────────────────────────────────
      // Called after the TransferInModal persists the learner + roster updates.
      // The modal already shows the success toast; we only need to:
      //   1. Push the freshly-inserted learner into local React state so the
      //      table re-renders without a full page reload.
      //   2. Open the learner's profile (or scroll to the class list view).
      const handleTransferInComplete = (inserted: Learner) => {
        setLearners((prev) => {
          // Defensive de-dupe in case the row is already present.
          if (prev.some((l) => l.id === inserted.id)) return prev;
          return [inserted as unknown as LearnerRowCompat, ...prev];
        });
        setIsTransferInOpen(false);
    
        // Apply the grade & stream filters so the user lands on the updated
        // class list view immediately.
        setGradeFilter(inserted.grade);
        setStreamFilter(inserted.stream);
        setSearchTerm('');
    
        // Open the new learner's profile in the background for convenience.
        navigate(`/students/${inserted.id}`);
      };
    
      const handleCloseTransferIn = () => {
        setIsTransferInOpen(false);
      };

  // Handle Delete Confirmation — invoked by AdminPinModal when the entered
    // admin password is verified.
    const confirmDelete = (learner: LearnerRowCompat) => {
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

  // ── Dynamic Learner Management Menu data ─────────────────────────────────
  // Adapt the raw LearnerRowCompat[] (the existing learners state) into the
  // LearnerMenuItem[] shape that LearnerManagementMenu expects. Every field
  // is pulled from the live learners array so the menu never goes stale.
  const menuLearners = useMemo((): LearnerMenuItem[] => {
    return learners.map((l) => ({
      id: l.id,
      admNo: l.admNo,
      fullName: l.name,
      grade: l.grade,
      stream: l.stream,
      status: l.status ?? 'Active',
      // attendanceStatus is derived from the learner's most recent attendance
      // record in the application. Here we normalise a missing entry to
      // 'Unmarked' so the badge always renders deterministically.
      attendanceStatus:
        (l as any).attendanceStatus ?? 'Unmarked',
      avatarUrl: (l as any).avatarUrl ?? null,
      guardian: l.guardian,
      phone: l.phone,
      birthCertificateNo: l.birthCertificateNo,
    }));
  }, [learners]);

  // Filters are rebuilt from the live dataset on every change so all
  // counters (total, active, absent, etc.) are always accurate.
  const menuFilters = useMemo(
    () => buildLearnerMenuFilters(menuLearners, menuFilterId),
    [menuLearners, menuFilterId],
  );

  // Derive the LearnerMenuData shape consumed by LearnerManagementMenu.
  // Loading and error flags can be wired to a real fetch hook here; for
  // now the page always runs in its existing localStorage-driven mode.
  const menuData = useMemo((): LearnerMenuData => {
    return {
      learners: applyLearnerFilter(menuLearners, menuFilterId),
      filters: menuFilters,
      activeFilterId: menuFilterId,
      isLoading: false,
      error: null,
    };
  }, [menuLearners, menuFilters, menuFilterId]);

  // When the user clicks a learner in the side-rail menu, navigate to their
  // profile page — the same behaviour as clicking the name in the table.
  const handleMenuLearnerClick = (learner: LearnerMenuItem) => {
    navigate(`/students/${learner.id}`);
  };

  return (
    <div className="p-6 md:p-10 bg-[#FBFBFA] min-h-screen text-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-6">
        {/* Dynamic Learner Management Menu — left rail on wide screens */}
        <div className="xl:w-72 xl:shrink-0">
          <div className="xl:sticky xl:top-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs p-4">
            <LearnerManagementMenu
              data={menuData}
              rowLimit={5}
              searchTerm={searchTerm}
              onFilterChange={setMenuFilterId}
              onLearnerClick={handleMenuLearnerClick}
            />
          </div>
        </div>

        {/* Main content column — header, filters bar, table, modals */}
        <div className="flex-1 min-w-0">

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
            {filteredLearners.length} active learners
            {learners.length !== filteredLearners.length && ` (filtered from ${learners.length} total)`}
            {isAdmin && (
              <>
                {' · '}
                <Link
                  to="/learners/archive"
                  className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors"
                >
                  <Archive size={13} />
                  View Transferred Archive
                </Link>
              </>
            )}
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

          {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsTransferInOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-700 font-semibold text-sm rounded-xl shadow-2xs transition-all active:scale-95"
                        title="Transfer In a learner from another school"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        Transfer In Learner
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all active:scale-95"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        + Add Learner
                      </button>
                    </>
                  )}
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
                          {isAdmin && (
                            <>
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
                            </>
                          )}
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
        setFullName={(v) => setFormData(prev => ({ ...prev, name: v }))}
        assessmentNo={formData.admNo}
        setAssessmentNo={(v) => setFormData(prev => ({ ...prev, admNo: v }))}
        birthCertificateNo={formData.birthCertificateNo}
        setBirthCertificateNo={(v) => setFormData(prev => ({ ...prev, birthCertificateNo: v }))}
        regGrade={formData.grade}
        setRegGrade={(v) => setFormData(prev => ({ ...prev, grade: v }))}
        regStream={formData.stream}
        setRegStream={(v) => setFormData(prev => ({ ...prev, stream: v }))}
        guardianName={formData.guardian}
        setGuardianName={(v) => setFormData(prev => ({ ...prev, guardian: v }))}
        phone={formData.phone}
        setPhone={(v) => setFormData(prev => ({ ...prev, phone: v }))}
        formError={formError}
        onRegister={validateAndSave as unknown as (e?: React.FormEvent) => void}
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
            // Mark the student as TRANSFERRED in the active roster so they are
            // excluded from all active views (attendance, marks, fee rosters, etc.)
            setLearners(prev =>
              prev.map(l =>
                l.id === studentId
                  ? { ...l, status: 'TRANSFERRED' as const }
                  : l
              )
            );
            // Also persist the status update directly to localStorage
            // (the useEffect will also sync, but this avoids a stale-gap)
            try {
              const raw = localStorage.getItem('school_learners_data');
              if (raw) {
                const parsed: LearnerRowCompat[] = JSON.parse(raw);
                const updated = parsed.map(l =>
                  l.id === studentId
                    ? { ...l, status: 'TRANSFERRED' as const }
                    : l
                );
                localStorage.setItem('school_learners_data', JSON.stringify(updated));
              }
            } catch { /* localStorage unavailable */ }
            setIsTransferOpen(false);
            setTransferLearner(null);
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

            {/* Transfer In Modal — enroll an incoming learner and add them to the class roster. */}
                        <TransferInModal
                          isOpen={isTransferInOpen}
                          onClose={handleCloseTransferIn}
                          onTransferInComplete={handleTransferInComplete}
                          actorName={user?.name || user?.email}
                        />
        </div>
      </div>
    </div>
  );
}