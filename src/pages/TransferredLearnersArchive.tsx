/**
 * Transferred Learners Archive
 * ─────────────────────────────
 *
 * Dedicated, read-mostly view of every learner that has been transferred
 * out of the active roster. The table shows certificate references,
 * transfer metadata, and provides three row actions:
 *
 *   1. Download Certificate — re-issues the clearance PDF
 *   2. View Exit Profile    — read-only academic + audit details
 *   3. Restore / Re-enroll  — pushes the learner back to the active roster
 *
 * Data is sourced from `munyaka_transferred_archive` (see
 * `utils/archiveStorage.ts`). The active roster (`school_learners_data`)
 * is updated by the restore action.
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Archive,
  Download,
  Eye,
  EyeOff,
  RotateCcw,
  X,
  Calendar,
  GraduationCap,
  Hash,
  FileText,
  Building2,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Printer,
  History,
  UserCheck,
  ClipboardList,
  Lock,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  getArchive,
  searchArchive,
  filterArchiveByYear,
  getArchiveYears,
  restoreLearnerToActiveRoster,
  type RestoredLearner,
} from '@/utils/archiveStorage';
import type {
  TransferredLearnerArchive,
} from '@/types/archive';
import {
  redownloadCertificate,
} from '@/utils/pdfDownloader';
import { showSuccess, showError } from '@/utils/toast';
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
} from '@/utils/archiveExport';
import { cn } from '@/lib/utils';
import { getActiveAdminPassword } from '@/services/adminCredentials';
import { readGradesAndStreams } from '@/services/gradesStreamsConfig';

type YearFilter = number | 'ALL';

const TransferredLearnersArchive: React.FC = () => {
  const navigate = useNavigate();

  const [records, setRecords] = useState<TransferredLearnerArchive[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<YearFilter>('ALL');
  const [selectedRecord, setSelectedRecord] =
    useState<TransferredLearnerArchive | null>(null);
  const [restoreTarget, setRestoreTarget] =
    useState<TransferredLearnerArchive | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Safe back handler: tries history.back() first (preserves scroll position
  // and prior filter state). Falls back to the active Learners page
  // (`/students`) if the history stack is empty (e.g. direct navigation
  // or page refresh).
  const handleBack = useCallback(() => {
    if (typeof window === 'undefined') {
      navigate('/students', { replace: true });
      return;
    }
    // window.history.length is unreliable in some embedded contexts (e.g.
    // when the app is hosted inside an iframe preview), so we also try
    // document.referrer as a secondary signal that the user arrived here
    // from another page on this site.
    const hasInternalHistory =
      window.history.length > 1 &&
      // If we know the referrer is on this app, treat as navigable
      (!document.referrer ||
        document.referrer.includes(window.location.host));

    if (hasInternalHistory) {
      navigate(-1);
    } else {
      navigate('/students', { replace: true });
    }
  }, [navigate]);

  // Available grades/streams for the restore target dropdown
  const gradesConfig = useMemo(() => {
    try {
      return readGradesAndStreams();
    } catch {
      return { grades: [], streams: [], gradeStreamMap: {} };
    }
  }, []);

  // ── Load records on mount and whenever localStorage changes ────────────
  useEffect(() => {
    const load = () => {
      // ── Roster visibility guard ───────────────────────────────────────
      // Defensive cross-check: a learner whose `id` is already present in
      // the active `school_learners_data` roster (regardless of how that
      // happened — restore, direct seed, etc.) must NEVER appear here.
      // The archive is historical; if the learner is back on the active
      // roster, they are no longer "transferred".
      let activeIds: Set<string>;
      try {
        const raw = window.localStorage.getItem('school_learners_data');
        const arr = raw ? JSON.parse(raw) : [];
        activeIds = new Set<string>(
          Array.isArray(arr) ? arr.map((l: { id?: string }) => l.id).filter(Boolean) : []
        );
      } catch {
        activeIds = new Set();
      }

      const all = getArchive().filter((r) => !activeIds.has(r.id));

      const filtered = filterArchiveByYear(
        yearFilter === 'ALL' ? null : yearFilter
      ).filter((r) => !activeIds.has(r.id));

      // Apply search as well
      const final = searchQuery.trim()
        ? filtered.filter((r) =>
            [
              r.name,
              r.admNo,
              r.certificateNumber,
              r.destinationSchool,
              r.guardian,
            ]
              .filter(Boolean)
              .some((f) =>
                f.toLowerCase().includes(searchQuery.trim().toLowerCase())
              )
          )
        : filtered;
      setRecords(final);
    };
    load();
    // Listen for cross-tab updates AND same-tab custom events so the
    // archive list reflects a restore performed in the same window.
    window.addEventListener('storage', load);
    window.addEventListener('learners_data_updated', load);
    return () => {
      window.removeEventListener('storage', load);
      window.removeEventListener('learners_data_updated', load);
    };
  }, [searchQuery, yearFilter]);

  const years = useMemo(() => getArchiveYears(), []);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleDownload = (record: TransferredLearnerArchive) => {
    const result = redownloadCertificate(record.id, record.name);
    if (result.success) {
      showSuccess(`Certificate ${record.certificateNumber} downloaded.`);
    } else {
      showError(result.error ?? 'Could not download certificate.');
    }
  };

  const handleRestore = async (
    targetGrade: string,
    targetStream: string,
    adminPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!restoreTarget) return { success: false, error: 'No target selected' };
    setIsRestoring(true);
    try {
      // 1. Re-verify the admin password on submit (in case it changed mid-modal)
      const storedPass = getActiveAdminPassword();
      if (adminPassword.trim() !== storedPass) {
        return {
          success: false,
          error: 'Admin password is incorrect. Authorization denied.',
        };
      }

      // 2. Execute the restore with the chosen target grade/stream.
      //    deleteArchiveEntry: true is the default — the archive row is
      //    permanently removed from localStorage so it cannot bounce back
      //    on a future load() call (page refresh, cross-tab sync, etc.).
      const restored = restoreLearnerToActiveRoster(
        restoreTarget.id,
        targetGrade,
        targetStream,
        { deleteArchiveEntry: true }
      );
      if (!restored) {
        return {
          success: false,
          error: 'Failed to restore learner to active roster.',
        };
      }

      // 3. Success feedback
      const streamNote = targetStream
        ? ` in Grade ${targetGrade} • ${targetStream}`
        : ` to Grade ${targetGrade}`;
      showSuccess(
        `${restored.name} restored to active roster${streamNote}. Reload the Learners page to see them.`
      );
      setRestoreTarget(null);
      setRecords((prev) => prev.filter((r) => r.id !== restoreTarget.id));
      return { success: true };
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // ── Export handlers (respect current filter/search) ─────────────────────
  // `records` is already the filtered list (see load() above), so we just
  // pass it straight to the export helpers.
  const handleExportExcel = () => {
    if (records.length === 0) {
      showError('No records to export.');
      return;
    }
    exportToExcel(records);
    showSuccess(`Exported ${records.length} record${records.length === 1 ? '' : 's'} to Excel.`);
    setExportMenuOpen(false);
  };

  const handleExportCSV = () => {
    if (records.length === 0) {
      showError('No records to export.');
      return;
    }
    exportToCSV(records);
    showSuccess(`Exported ${records.length} record${records.length === 1 ? '' : 's'} to CSV.`);
    setExportMenuOpen(false);
  };

  const handleExportPDF = () => {
    if (records.length === 0) {
      showError('No records to export.');
      return;
    }
    exportToPDF(records);
    showSuccess(`Generating PDF summary for ${records.length} record${records.length === 1 ? '' : 's'}.`);
    setExportMenuOpen(false);
  };

  // Close export dropdown when clicking outside
  const exportMenuRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!exportMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportMenuOpen]);

  const formatLongDate = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-10 bg-[#FBFBFA] min-h-screen text-slate-800">
      {/* Page Header — raised above AppUnlock's fixed z-50 license indicator */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Archive size={20} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Transferred Learners Archive
            </h1>
            <Badge className="bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs">
              {records.length} record{records.length === 1 ? '' : 's'}
            </Badge>
          </div>
          <p className="text-sm font-medium text-slate-500 ml-[52px]">
            Historical record of every learner transferred out of the active
            roster. Use this view to re-issue clearance certificates, audit
            exits, or restore a learner.
          </p>
        </div>

        {/* Isolated stacking island — guaranteed above the export dropdown's
            z-50 stacking context so AppUnlock / any overlay can never
            intercept this button. */}
        <div className="relative z-[80]">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back to Learners"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-5 h-11 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 active:scale-95"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Back
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by name, admission no., certificate, or destination…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none transition-all"
            />
          </div>

          <select
            value={yearFilter === 'ALL' ? 'ALL' : String(yearFilter)}
            onChange={(e) =>
              setYearFilter(
                e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)
              )
            }
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none min-w-[160px]"
          >
            <option value="ALL">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Export List — split button */}
          <div ref={exportMenuRef} className="relative inline-flex">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={records.length === 0}
              className="inline-flex items-center justify-center gap-2 px-4 h-[42px] rounded-l-xl border border-r-0 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              aria-label="Quick export to Excel"
              title="Quick export to Excel (.xlsx)"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Export Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>
            <button
              type="button"
              onClick={() => setExportMenuOpen((o) => !o)}
              disabled={records.length === 0}
              aria-label="More export options"
              aria-haspopup="menu"
              aria-expanded={exportMenuOpen}
              className="inline-flex items-center justify-center px-2 h-[42px] rounded-r-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <ChevronLeft
                size={14}
                className={cn(
                  'transition-transform rotate-180',
                  exportMenuOpen && 'rotate-0'
                )}
              />
            </button>

            {exportMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 p-1.5 z-50 animate-in slide-in-from-top-2"
              >
                <p className="px-3 pt-2 pb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Export List
                </p>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleExportExcel}
                  className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-emerald-50 text-left transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Download size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      Export Excel
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">
                      .xlsx with formatted columns
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleExportCSV}
                  className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-sky-50 text-left transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      Export CSV
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">
                      .csv — universal spreadsheet format
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleExportPDF}
                  className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-rose-50 text-left transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Printer size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      Print / PDF Summary
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">
                      Branded report with header &amp; footer
                    </p>
                  </div>
                </button>
                <div className="px-3 pt-2 pb-1.5 border-t border-slate-100 mt-1.5">
                  <p className="text-[10px] text-slate-500 font-medium leading-tight">
                    Exports respect the current search &amp; year filter. {records.length} record{records.length === 1 ? '' : 's'} will be included.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Archive Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm table-auto"
            style={{ minWidth: '1080px' }}
          >
            <colgroup>
              <col style={{ width: '260px' }} />   {/* Student */}
              <col style={{ width: '140px' }} />   {/* Adm. No / NEMIS */}
              <col style={{ width: '180px' }} />   {/* Last Grade */}
              <col style={{ width: '160px' }} />   {/* Transfer Ref # */}
              <col style={{ width: '220px' }} />   {/* Destination */}
              <col style={{ width: '120px' }} />   {/* Transfer Date */}
              <col style={{ width: '120px' }} />   {/* Actions */}
            </colgroup>
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left">
                <th className="px-5 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  Student
                </th>
                <th className="px-5 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  Adm. No / NEMIS
                </th>
                <th className="px-5 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  Last Grade
                </th>
                <th className="px-5 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  Transfer Ref #
                </th>
                <th className="px-5 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  Destination
                </th>
                <th className="px-5 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  Transfer Date
                </th>
                <th className="px-5 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center text-slate-400 whitespace-nowrap"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Archive size={40} className="text-slate-300" />
                      <p className="font-bold">No transferred learners yet</p>
                      <p className="text-xs font-medium">
                        Archive entries will appear here once a transfer is
                        executed from the Learners page.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap align-middle">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                          {r.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="font-bold text-slate-900 truncate"
                            style={{ maxWidth: '200px' }}
                            title={r.name}
                          >
                            {r.name}
                          </p>
                          <p
                            className="text-[11px] text-slate-500 font-medium truncate"
                            style={{ maxWidth: '200px' }}
                            title={`${r.gender} • ${r.guardian}`}
                          >
                            {r.gender} • {r.guardian}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-700 whitespace-nowrap align-middle">
                      {r.admNo}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap align-middle">
                      <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 font-bold text-[11px] px-2.5 py-1 rounded-lg whitespace-nowrap">
                        <span>Grade {r.grade}</span>
                        <span className="opacity-60">•</span>
                        <span>{r.stream}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap align-middle">
                      <code className="text-[11px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap inline-block">
                        {r.certificateNumber}
                      </code>
                    </td>
                    <td
                      className="px-5 py-4 text-slate-700 font-medium text-xs align-middle"
                      style={{ maxWidth: '220px' }}
                    >
                      <span
                        className="block truncate"
                        title={r.destinationSchool}
                      >
                        {r.destinationSchool}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium text-xs whitespace-nowrap align-middle">
                      {formatDate(r.transferDate)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDownload(r)}
                          title="Download Clearance Certificate"
                          className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(r)}
                          title="View Exit Profile"
                          className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRestoreTarget(r)}
                          title="Restore / Re-enroll"
                          className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Exit Profile Modal ──────────────────────────────────────── */}
      {selectedRecord && (
        <ExitProfileModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {/* ─── Restore Authorization Modal ──────────────────────────── */}
      {restoreTarget && (
        <RestoreAuthorizationModal
          record={restoreTarget}
          isLoading={isRestoring}
          gradesConfig={gradesConfig}
          onConfirm={handleRestore}
          onClose={() => setRestoreTarget(null)}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
//  Exit Profile Modal (read-only)
// ─────────────────────────────────────────────────────────────────────────

interface ExitProfileModalProps {
  record: TransferredLearnerArchive;
  onClose: () => void;
}

const ExitProfileModal: React.FC<ExitProfileModalProps> = ({
  record,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center">
              <UserCheck size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Exit Profile — {record.name}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Read-only academic and transfer record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {/* Academic Snapshot */}
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <GraduationCap size={14} /> Academic Snapshot
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <DetailItem icon={Hash} label="Admission / NEMIS" value={record.admNo} />
              <DetailItem icon={GraduationCap} label="Last Grade" value={`Grade ${record.grade} • ${record.stream}`} />
              <DetailItem icon={Calendar} label="Date of Admission" value={record.dateOfAdmission || '—'} />
              <DetailItem icon={Calendar} label="Date of Birth" value={record.dob || '—'} />
            </div>
          </section>

          {/* Transfer Metadata */}
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <FileText size={14} /> Transfer Metadata
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <DetailItem
                icon={Hash}
                label="Certificate Reference"
                value={record.certificateNumber}
                mono
              />
              <DetailItem
                icon={Calendar}
                label="Transfer Date"
                value={new Date(record.transferDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              />
              <DetailItem icon={Building2} label="Destination School" value={record.destinationSchool} />
              <DetailItem
                icon={FileText}
                label="Reason"
                value={record.reason}
              />
            </div>
          </section>

          {/* Headteacher Remarks */}
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <ClipboardList size={14} /> Headteacher Remarks / Character Reference
            </h3>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-700 font-medium whitespace-pre-wrap">
              {record.headteacherRemarks || 'No remarks recorded.'}
            </div>
          </section>

          {/* Co-curricular */}
          {record.coCurricularActivities && (
            <section>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <History size={14} /> Co-curricular Activities
              </h3>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-700 font-medium whitespace-pre-wrap">
                {record.coCurricularActivities}
              </div>
            </section>
          )}

          {/* Audit Trail */}
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <CheckCircle2 size={14} /> Transfer Audit Metadata
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <DetailItem
                icon={UserCheck}
                label="Executed By"
                value={record.audit?.executedBy || '—'}
              />
              <DetailItem
                icon={Calendar}
                label="Executed At"
                value={
                  record.audit?.executedAt
                    ? new Date(record.audit.executedAt).toLocaleString('en-GB')
                    : '—'
                }
              />
              <DetailItem
                icon={CheckCircle2}
                label="Authorisation"
                value={record.audit?.authorizedVia || '—'}
              />
              <DetailItem
                icon={AlertTriangle}
                label="Fee Status at Exit"
                value={
                  record.isFeeCleared
                    ? 'Cleared'
                    : `Outstanding: KES ${(record.feeBalanceAtExit ?? 0).toLocaleString()}`
                }
                status={record.isFeeCleared ? 'cleared' : 'pending'}
              />
            </div>
            {record.audit?.notes && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
                <strong>Audit Notes:</strong> {record.audit.notes}
              </div>
            )}
          </section>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-xl font-bold"
          >
            Close
          </Button>
          <Button
            onClick={() => {
              const result = redownloadCertificate(record.id, record.name);
              if (result.success) {
                showSuccess('Certificate downloaded.');
              } else {
                showError(result.error ?? 'Download failed.');
              }
            }}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold gap-2 text-white"
          >
            <Download size={16} />
            Download Certificate
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
//  Helper: small detail tile used in the modal
// ─────────────────────────────────────────────────────────────────────────

const DetailItem: React.FC<{
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
  status?: 'cleared' | 'pending';
}> = ({ icon: Icon, label, value, mono, status }) => (
  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
      <Icon size={12} />
      {label}
    </p>
    <p
      className={cn(
        'text-sm font-bold text-slate-800',
        mono && 'font-mono text-xs',
        status === 'cleared' && 'text-emerald-700',
        status === 'pending' && 'text-amber-700'
      )}
    >
      {value}
    </p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
//  Restore Authorization Modal
// ─────────────────────────────────────────────────────────────────────────
//
// Re-enrolling an archived learner is a privileged operation. This modal
// requires the admin to:
//   1. Confirm the learner's identity (read-only context card)
//   2. Choose the target grade/stream they will be restored to
//   3. Re-enter the system admin password
//
// Only after all three are valid does the parent restore action fire.

interface RestoreAuthorizationModalProps {
  record: TransferredLearnerArchive;
  isLoading: boolean;
  gradesConfig: {
    grades: string[];
    streams: string[];
    gradeStreamMap: Record<string, string[]>;
  };
  /**
   * Returns `{ success: false, error }` when validation or restore fails.
   * The modal renders the error inline.
   */
  onConfirm: (
    targetGrade: string,
    targetStream: string,
    adminPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

const RestoreAuthorizationModal: React.FC<RestoreAuthorizationModalProps> = ({
  record,
  isLoading,
  gradesConfig,
  onConfirm,
  onClose,
}) => {
  // ── Form state ──────────────────────────────────────────────────────
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [targetGrade, setTargetGrade] = useState<string>(record.grade);
  const [targetStream, setTargetStream] = useState<string>(record.stream);
  const [error, setError] = useState<string | null>(null);

  // Derive the available streams for the currently-selected grade
  const availableStreams = useMemo<string[]>(() => {
    if (targetGrade && gradesConfig.gradeStreamMap[targetGrade]) {
      return gradesConfig.gradeStreamMap[targetGrade];
    }
    if (targetGrade && gradesConfig.gradeStreamMap[targetGrade.toLowerCase()]) {
      return gradesConfig.gradeStreamMap[targetGrade.toLowerCase()];
    }
    return gradesConfig.streams;
  }, [targetGrade, gradesConfig]);

  const grades = gradesConfig.grades.length > 0 ? gradesConfig.grades : [record.grade];

  const isReady = adminPassword.trim().length > 0 && targetGrade && targetStream;

  // ── Handlers ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminPassword.trim()) {
      setError('Please enter the admin password to authorise this restore.');
      return;
    }
    if (!targetGrade) {
      setError('Please select a target grade.');
      return;
    }
    if (!targetStream) {
      setError('Please select a target stream.');
      return;
    }

    const result = await onConfirm(targetGrade, targetStream, adminPassword);
    if (!result.success) {
      setError(result.error ?? 'Restore failed. Please try again.');
    }
    // On success, the parent closes the modal — no further action here.
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"
      onClick={isLoading ? undefined : onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-amber-50 to-orange-50/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Admin Authorization Required
              </h2>
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">
                Restricted action · Re-enrolment
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-700 font-medium leading-relaxed">
            Restoring learner:{' '}
            <strong className="text-slate-900">{record.name}</strong> (
            <span className="font-mono text-xs">{record.admNo}</span>)
          </p>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <form
          id="restore-form"
          onSubmit={handleSubmit}
          className="p-6 space-y-5 max-h-[65vh] overflow-y-auto"
        >
          {/* Student context — read-only */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Last Grade (Exit)
              </p>
              <p className="font-bold text-slate-800 text-sm">
                Grade {record.grade} • {record.stream}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Certificate on File
              </p>
              <p className="font-mono font-bold text-slate-800 text-xs">
                {record.certificateNumber}
              </p>
            </div>
          </div>

          {/* Target grade + stream */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <GraduationCap size={12} />
              Select Grade / Class to restore to
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="restore-grade"
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                >
                  Grade
                </label>
                <select
                  id="restore-grade"
                  value={targetGrade}
                  onChange={(e) => {
                    const newGrade = e.target.value;
                    setTargetGrade(newGrade);
                    // If the previously selected stream is not in the new
                    // grade's available streams, reset it.
                    const newStreams =
                      gradesConfig.gradeStreamMap[newGrade] ?? gradesConfig.streams;
                    if (!newStreams.includes(targetStream)) {
                      setTargetStream(newStreams[0] ?? '');
                    }
                  }}
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-200 focus:border-amber-300 outline-none"
                >
                  {grades.map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="restore-stream"
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                >
                  Stream
                </label>
                <select
                  id="restore-stream"
                  value={targetStream}
                  onChange={(e) => setTargetStream(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-200 focus:border-amber-300 outline-none"
                >
                  {availableStreams.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Admin password */}
          <div className="space-y-1.5">
            <label
              htmlFor="restore-admin-password"
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"
            >
              <Lock size={12} />
              Admin Password
            </label>
            <div className="relative">
              <Input
                id="restore-admin-password"
                type={showPassword ? 'text' : 'password'}
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter your system admin password"
                disabled={isLoading}
                autoComplete="current-password"
                autoFocus
                className="h-12 pl-4 pr-12 rounded-xl bg-slate-50 border-slate-200 font-bold text-sm focus:bg-white focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Inline error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold animate-in slide-in-from-top-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Info note */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium leading-relaxed">
            The archive entry will be retained with an audit note. To fully
            remove the historical record, use the audit log delete action
            afterwards.
          </div>
        </form>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl font-bold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="restore-form"
            disabled={isLoading || !isReady}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 font-bold gap-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Authorising &amp; Restoring…
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                Confirm Restore
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransferredLearnersArchive;
