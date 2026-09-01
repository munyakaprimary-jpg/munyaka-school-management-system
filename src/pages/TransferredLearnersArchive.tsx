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

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Archive,
  Download,
  Eye,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getArchive,
  searchArchive,
  filterArchiveByYear,
  getArchiveYears,
  restoreLearnerToActiveRoster,
} from '@/utils/archiveStorage';
import type {
  TransferredLearnerArchive,
} from '@/types/archive';
import {
  redownloadCertificate,
} from '@/utils/pdfDownloader';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

type YearFilter = number | 'ALL';

const TransferredLearnersArchive: React.FC = () => {
  const [records, setRecords] = useState<TransferredLearnerArchive[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<YearFilter>('ALL');
  const [selectedRecord, setSelectedRecord] =
    useState<TransferredLearnerArchive | null>(null);
  const [restoreTarget, setRestoreTarget] =
    useState<TransferredLearnerArchive | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // ── Load records on mount and whenever localStorage changes ────────────
  useEffect(() => {
    const load = () => {
      const all = getArchive();
      const filtered = filterArchiveByYear(
        yearFilter === 'ALL' ? null : yearFilter
      );
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
    // Listen for cross-tab updates
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
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

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setIsRestoring(true);
    try {
      const restored = restoreLearnerToActiveRoster(restoreTarget.id);
      if (!restored) {
        showError('Failed to restore learner to active roster.');
        return;
      }
      showSuccess(
        `${restored.name} restored to active roster. Reload the Learners page to see them.`
      );
      setRestoreTarget(null);
      // Refresh local list
      setRecords((prev) => prev.filter((r) => r.id !== restoreTarget.id));
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
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
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

        <Button
          variant="outline"
          className="rounded-xl gap-2 border-slate-200"
          onClick={() => window.history.back()}
        >
          <ChevronLeft size={16} />
          Back
        </Button>
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

      {/* ─── Restore Confirmation Modal ─────────────────────────────── */}
      {restoreTarget && (
        <RestoreConfirmModal
          record={restoreTarget}
          isLoading={isRestoring}
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
//  Restore Confirmation Modal
// ─────────────────────────────────────────────────────────────────────────

interface RestoreConfirmModalProps {
  record: TransferredLearnerArchive;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const RestoreConfirmModal: React.FC<RestoreConfirmModalProps> = ({
  record,
  isLoading,
  onConfirm,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Restore Learner
            </h2>
          </div>
          <p className="text-sm text-slate-600 font-medium">
            Are you sure you want to restore{' '}
            <strong className="text-slate-900">{record.name}</strong> to the
            active roster? They will reappear in attendance, marks, and fee
            rosters.
          </p>
        </div>

        <div className="p-6 space-y-3 text-sm">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Last Grade
            </p>
            <p className="font-bold text-slate-800">
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
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            The archive entry will be retained with an audit note. Use the
            delete action in the audit log to fully remove the historical
            record.
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl font-bold"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 font-bold gap-2 text-white"
          >
            {isLoading ? (
              <RotateCcw size={16} className="animate-spin" />
            ) : (
              <RotateCcw size={16} />
            )}
            {isLoading ? 'Restoring…' : 'Confirm Restore'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransferredLearnersArchive;
