"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  UserPlus,
  UserCheck,
  History,
  UserX,
  Edit,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Users,
  GraduationCap,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { showSuccess, showError } from '@/utils/toast';
import { INITIAL_SEED_DATA } from '@/data/initialSeedData';
import { cn } from "@/lib/utils";
import StudentFilters from '@/components/students/StudentFilters';
import LearnerActionButtons from '@/components/students/LearnerActionButtons';
import RegisterModal from '@/components/students/RegisterModal';
import { StudentTransferInfo } from '@/types/transfer';
import { sortGrades } from '@/utils/gradeSort';
import { formatGradeName } from '@/utils/gradeSort';

// Stable learner shape that combines ID, name, assessment number,
// grade, stream, gender, and fee balance.  Each row in the table
// produces one of these and passes it down to any action button / modal
// so the modal always shows the *clicked* learner, never a hardcoded
// default.
interface LearnerRow {
  id: string;
  name: string;
  assessment: string;
  grade: string;
  stream: string;
  gender: 'M' | 'F' | 'Other';
  feeBalance: number;
  birthCertificateNo?: string;
  guardian?: string;
  phone?: string;
  email?: string;
  status: 'Active' | 'Pre-Registered' | 'Suspended';
  admissionDate?: string;
}

const Students = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterStream, setFilterStream] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [learners, setLearners] = useState<LearnerRow[]>([]);

  // Read the live learners directory from localStorage.  This is the
  // single source of truth for the directory table — registration
  // and import flows write to the same key, so the list updates as
  // soon as the user adds a new learner.
  const refreshLearners = useCallback(() => {
    try {
      const stored = localStorage.getItem('school_learners_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setLearners(
            parsed.map((l: any): LearnerRow => ({
              id: String(l.id ?? l.admNo ?? Math.random()),
              name: l.name ?? 'Unknown Learner',
              assessment: l.admNo ?? l.assessment ?? '',
              grade: l.grade ?? '',
              stream: l.stream ?? '',
              gender: (l.gender as 'M' | 'F' | 'Other') ?? 'Other',
              feeBalance:
                typeof l.feeBalance === 'number'
                  ? l.feeBalance
                  : typeof l.balance === 'number'
                  ? l.balance
                  : 0,
              birthCertificateNo: l.birthCertificateNo,
              guardian: l.guardian,
              phone: l.phone,
              email: l.email,
              status: (l.status as LearnerRow['status']) ?? 'Active',
              admissionDate: l.admissionDate,
            }))
          );
          return;
        }
      }
    } catch (e) {
      console.error('Failed to read learners from localStorage:', e);
    }

    // Fallback: seed data so the table isn't empty on first load.
    setLearners(
      INITIAL_SEED_DATA.students.map((s): LearnerRow => ({
        id: String(s.id),
        name: s.name,
        assessment: s.admNo ?? '',
        grade: s.grade ?? '',
        stream: s.stream ?? '',
        gender: (s.gender as 'M' | 'F' | 'Other') ?? 'Other',
        feeBalance: 0,
        birthCertificateNo: undefined,
        status: 'Active',
      }))
    );
  }, []);

  useEffect(() => {
    refreshLearners();
  }, [refreshLearners]);

  // Cross-tab / same-tab updates
  useEffect(() => {
    const onUpdate = () => refreshLearners();
    window.addEventListener('storage', onUpdate);
    window.addEventListener('learners_data_updated', onUpdate);
    return () => {
      window.removeEventListener('storage', onUpdate);
      window.removeEventListener('learners_data_updated', onUpdate);
    };
  }, [refreshLearners]);

  // Apply text/grade/stream/search filters to the learner list.
  // The `student` argument passed to LearnerActionButtons is the
  // specific iterated row, NOT a hardcoded default — that was the
  // root cause of the "always shows MUTWIKA KILONZO" bug.
  const filteredLearners = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return learners.filter((l) => {
      const matchesSearch =
        !term ||
        l.name.toLowerCase().includes(term) ||
        l.assessment.toLowerCase().includes(term) ||
        (l.birthCertificateNo?.toLowerCase().includes(term) ?? false) ||
        (l.guardian?.toLowerCase().includes(term) ?? false) ||
        (l.phone?.toLowerCase().includes(term) ?? false);
      const matchesGrade = filterGrade === 'all' || l.grade === filterGrade;
      const matchesStream = filterStream === 'all' || l.stream === filterStream;
      const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
      return matchesSearch && matchesGrade && matchesStream && matchesStatus;
    });
  }, [learners, searchTerm, filterGrade, filterStream, filterStatus]);

  // Sort: ascending grade number, then by name.  This gives a predictable
  // order regardless of which filter the user is currently on.
  const sortedLearners = useMemo(() => {
    return [...filteredLearners].sort((a, b) => {
      const aNum = parseInt(String(a.grade).replace(/[^0-9]/g, ''), 10) || 0;
      const bNum = parseInt(String(b.grade).replace(/[^0-9]/g, ''), 10) || 0;
      if (aNum !== bNum) return aNum - bNum;
      return a.name.localeCompare(b.name);
    });
  }, [filteredLearners]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedLearners.length / pageSize));
  const paginatedLearners = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLearners.slice(start, start + pageSize);
  }, [sortedLearners, currentPage, pageSize]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchTerm, filterGrade, filterStream, filterStatus, pageSize]);

  // Aggregate stats for the summary card
  const totalCount = learners.length;
  const activeCount = learners.filter((l) => l.status === 'Active').length;
  const maleCount = learners.filter((l) => l.gender === 'M').length;
  const femaleCount = learners.filter((l) => l.gender === 'F').length;
  const totalFeesOwed = learners.reduce((sum, l) => sum + (l.feeBalance ?? 0), 0);

  // Convert a LearnerRow into the StudentTransferInfo shape required by
  // LearnerActionButtons / TransferWorkflow.
  const toTransferInfo = (l: LearnerRow): StudentTransferInfo => ({
    id: l.id,
    name: l.name,
    assessment: l.assessment,
    grade: l.grade,
    stream: l.stream,
    gender: l.gender,
    dob: l.admissionDate ?? '',
    guardian: l.guardian ?? '',
    phone: l.phone ?? '',
    email: l.email ?? '',
    status: l.status,
    dateOfAdmission: l.admissionDate ?? new Date().toISOString().slice(0, 10),
    coCurricularActivities: '',
    feeBalance: l.feeBalance,
  });

  // ────────────────────────────────────────────
  // Row-level handlers — each receives the *specific* iterated learner.
  // We no longer hardcode a fallback to a single student; the delete
  // dialog explicitly confirms against the clicked row.
  // ────────────────────────────────────────────
  const handleViewLearner = (learner: LearnerRow) => {
    navigate(`/students/${encodeURIComponent(learner.id)}`);
  };

  const handleEditLearner = (learner: LearnerRow) => {
    // The edit flow lives in the same page as the register modal —
    // open it with the learner prefilled.  Implementation: navigate
    // to a dedicated edit route, or open a future EditLearnerModal.
    showSuccess(`Edit flow for ${learner.name} (${learner.assessment}) — coming soon.`);
  };

  const handleDeleteLearner = (learner: LearnerRow) => {
    if (!window.confirm(`Delete ${learner.name} (${learner.assessment})? This cannot be undone.`)) {
      return;
    }

    try {
      const stored = localStorage.getItem('school_learners_data');
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return;
      const next = parsed.filter((l: any) => String(l.id) !== String(learner.id));
      localStorage.setItem('school_learners_data', JSON.stringify(next));
      // Also clear any fee override so stale balances don't haunt the UI
      localStorage.removeItem(`munyaka_fee_${learner.id}`);
      setLearners((prev) => prev.filter((l) => l.id !== learner.id));
      window.dispatchEvent(new Event('learners_data_updated'));
      showSuccess(`${learner.name} has been removed from the directory.`);
    } catch (e) {
      console.error('Failed to delete learner:', e);
      showError('Failed to delete learner. Please try again.');
    }
  };

  // Compute grade/stream options dynamically from the current roster
  // so the filter dropdowns always reflect what's actually in the table.
  const gradeOptions = useMemo(() => {
    const set = new Set<string>();
    learners.forEach((l) => l.grade && set.add(formatGradeName(l.grade)));
    return sortGrades(Array.from(set).map((g) => ({ id: g, name: g }))).map((g) => g.name);
  }, [learners]);

  const streamOptions = useMemo(() => {
    const set = new Set<string>();
    learners.forEach((l) => l.stream && set.add(l.stream));
    return Array.from(set).sort();
  }, [learners]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 action-bar">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Learners Directory</h1>
          <p className="text-sm text-slate-500 font-medium">
            {totalCount} enrolled • {activeCount} active • {maleCount} boys • {femaleCount} girls
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 bg-white text-slate-700 font-bold h-11 px-4 gap-2"
            onClick={refreshLearners}
          >
            <Users size={16} /> Refresh
          </Button>
          <Button
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-5 gap-2 shadow-lg shadow-indigo-100"
            onClick={() => setIsRegisterOpen(true)}
          >
            <UserPlus size={16} /> Register Learner
          </Button>
        </div>
      </div>

      {/* Filters */}
      <StudentFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterGrade={filterGrade}
        setFilterGrade={setFilterGrade}
        filterStream={filterStream}
        setFilterStream={setFilterStream}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onClearFilters={() => {
          setSearchTerm('');
          setFilterGrade('all');
          setFilterStream('all');
          setFilterStatus('all');
        }}
      />

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm rounded-2xl bg-white p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Enrolled</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{totalCount}</h3>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-emerald-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Active</p>
          <h3 className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</h3>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-blue-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Boys / Girls</p>
          <h3 className="text-2xl font-black text-blue-700 mt-1">
            {maleCount} / {femaleCount}
          </h3>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-rose-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Fees Outstanding</p>
          <h3 className="text-2xl font-black text-rose-700 mt-1">KES {totalFeesOwed.toLocaleString()}</h3>
        </Card>
      </div>

      {/* Directory table */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[900px]">
            <thead className="text-slate-500 bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 min-w-[220px]">Learner</th>
                <th className="px-4 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 min-w-[140px]">Assessment / UPI</th>
                <th className="px-4 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 min-w-[120px]">Grade / Stream</th>
                <th className="px-4 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 min-w-[100px] text-center">Gender</th>
                <th className="px-4 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 min-w-[120px] text-center">Fee Balance</th>
                <th className="px-4 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 min-w-[110px] text-center">Status</th>
                <th className="px-4 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 min-w-[120px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLearners.length > 0 ? (
                paginatedLearners.map((learner) => (
                  <tr key={learner.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-6 py-4 min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          {learner.name
                            .split(' ')
                            .map((n) => n?.[0] || '')
                            .slice(0, 2)
                            .join('')
                            .toUpperCase() || 'NA'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-900 truncate">{learner.name}</span>
                          {learner.guardian && (
                            <span className="text-[10px] text-slate-400 font-medium truncate">
                              Guardian: {learner.guardian}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono font-bold text-slate-700 text-xs">
                        {learner.assessment || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-700 font-bold text-xs">
                          {learner.grade || '—'}
                        </Badge>
                        <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-500 text-[10px]">
                          {learner.stream || '—'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-md font-bold text-[10px] uppercase',
                          learner.gender === 'M'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-pink-50 text-pink-700 border-pink-200'
                        )}
                      >
                        {learner.gender === 'M' ? 'Male' : learner.gender === 'F' ? 'Female' : 'Other'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={cn(
                          'font-black text-sm',
                          learner.feeBalance > 0 ? 'text-rose-600' : 'text-slate-400'
                        )}
                      >
                        KES {(learner.feeBalance ?? 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge
                        className={cn(
                          'border-none font-bold text-[10px] gap-1',
                          learner.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : learner.status === 'Suspended'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        )}
                      >
                        {learner.status === 'Active' ? (
                          <UserCheck size={10} />
                        ) : learner.status === 'Suspended' ? (
                          <UserX size={10} />
                        ) : (
                          <History size={10} />
                        )}
                        {learner.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right min-w-[120px]">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl text-slate-400 hover:text-slate-600 h-9 w-9"
                            aria-label={`Open actions for ${learner.name}`}
                          >
                            <ChevronRight size={18} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px] shadow-xl border-slate-100">
                          {/* View Profile — navigates to the dynamic student profile */}
                          <DropdownMenuItem
                            onClick={() => handleViewLearner(learner)}
                            className="rounded-xl gap-2 font-bold cursor-pointer text-slate-700"
                          >
                            <Eye size={15} /> View Profile
                          </DropdownMenuItem>

                          {/* Edit Profile — bound to the iterated row */}
                          <DropdownMenuItem
                            onClick={() => handleEditLearner(learner)}
                            className="rounded-xl gap-2 font-bold cursor-pointer text-slate-700"
                          >
                            <Edit size={15} /> Edit Details
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="my-1" />

                          {/* View Academic History — bound to the iterated row */}
                          <LearnerActionButtons student={toTransferInfo(learner)} />

                          <DropdownMenuSeparator className="my-1" />

                          {/* Delete — bound to the iterated row */}
                          <DropdownMenuItem
                            onClick={() => handleDeleteLearner(learner)}
                            className="rounded-xl gap-2 font-bold cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                          >
                            <Trash2 size={15} /> Delete Learner
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center">
                        <GraduationCap size={28} />
                      </div>
                      <p className="text-slate-800 font-bold text-base">No learners match the current filters</p>
                      <p className="text-xs text-slate-400 font-medium max-w-sm">
                        Try clearing your search or selecting a different grade and stream above.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {sortedLearners.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <p className="font-medium">
              Showing{' '}
              <span className="font-black text-slate-900">
                {Math.min((currentPage - 1) * pageSize + 1, sortedLearners.length)}–
                {Math.min(currentPage * pageSize, sortedLearners.length)}
              </span>{' '}
              of <span className="font-black text-slate-900">{sortedLearners.length}</span> learners
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="px-3 font-black text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Register modal */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegisterSuccess={() => {
          refreshLearners();
          showSuccess('Learner registered successfully!');
        }}
      />
    </div>
  );
};

export default Students;