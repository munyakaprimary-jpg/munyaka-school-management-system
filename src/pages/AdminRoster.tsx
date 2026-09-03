"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Trash2, Loader2, ExternalLink, Archive, Users, FileText, Download, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import LearnerManagementMenu from "@/components/students/LearnerManagementMenu";
import AdminPinModal from "@/components/students/AdminPinModal";
import {
  buildLearnerMenuFilters,
  applyLearnerFilter,
} from "@/data/mockLearnerMenu";
import type {
  LearnerMenuData,
  LearnerMenuItem,
} from "@/types/learnerMenu";
import {
  readGradesAndStreams,
  getStreamsForGrade,
  GradesStreamsConfig,
} from "@/services/gradesStreamsConfig";
import { logDeletionAudit } from "@/services/deletionAuditLog";
import { showSuccess } from "@/utils/toast";
import { useFileDownload } from "@/utils/fileDownloader";
import { notifyDataChanged } from "@/utils/storage";
import { INITIAL_SEED_DATA } from "@/data/initialSeedData";
import { Learner } from "@/types/learners";

interface LearnerRowCompat {
  id: string;
  admNo: string;
  name: string;
  grade: string;
  stream: string;
  gender: "Male" | "Female" | "Other";
  guardian: string;
  phone: string;
  birthCertificateNo?: string;
  status?: "Active" | "TRANSFERRED" | "Graduated" | "Suspended";
}

const DEFAULT_LEARNERS: LearnerRowCompat[] = INITIAL_SEED_DATA.students as LearnerRowCompat[];

// Keys the Grades & Streams setter writes to
const GRADES_KEYS = [
  "munyaka_grades",
  "munyaka_grades_streams",
  "munyaka_grades_streams_data",
  "gradeStreamSettings",
  "school_grades_streams_data",
];

const normalizeStreamName = (name: string): string => {
  if (!name) return "";
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

const normalizeGradeName = (name: string): string => {
  if (!name) return "";
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

export default function AdminRoster() {
  // ── Learner state ─────────────────────────────────────────────────────────
  const [learners, setLearners] = useState<Learner[]>(() => {
    try {
      const saved = localStorage.getItem("school_learners_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    localStorage.setItem("school_learners_data", JSON.stringify(DEFAULT_LEARNERS));
    return DEFAULT_LEARNERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("school_learners_data", JSON.stringify(learners));
      notifyDataChanged("school_learners_data");
    } catch {}
  }, [learners]);

  // ── Grades & streams config ────────────────────────────────────────────────
  const [gradesConfig, setGradesConfig] = useState(() => readGradesAndStreams());

  useEffect(() => {
    const refresh = () => setGradesConfig(readGradesAndStreams());
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || GRADES_KEYS.includes(e.key)) refresh();
    };
    const handleCustom = () => refresh();
    const handleFocus = () => refresh();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("munyaka_grades_updated", handleCustom);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("munyaka_grades_updated", handleCustom);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const GRADES_LIST = gradesConfig.grades;

  // ── Grade & Stream filter state (wired to admin data scope) ──────────────
  const [gradeFilter, setGradeFilter] = useState("All");
  const [streamFilter, setStreamFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const availableStreams = useMemo((): string[] => {
    if (gradeFilter === "All" || !gradeFilter) {
      return gradesConfig.streams.slice().sort((a, b) => a.localeCompare(b));
    }
    return getStreamsForGrade(gradeFilter, gradesConfig);
  }, [gradeFilter, gradesConfig]);

  useEffect(() => {
    if (streamFilter !== "All" && !availableStreams.includes(streamFilter)) {
      setStreamFilter("All");
    }
  }, [availableStreams, streamFilter]);

  const handleGradeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGradeFilter(e.target.value);
    setStreamFilter("All");
  };

  // ── Normalized learners ────────────────────────────────────────────────────
  const normalizedLearners = useMemo(
    () => learners.map((l) => ({ ...l, stream: normalizeStreamName(l.stream) })),
    [learners]
  );

  // ── Filtered learners (matches the main Students table logic) ─────────────
  const filteredLearners = useMemo(() => {
    const isAllGrades = !gradeFilter || gradeFilter === "All" || gradeFilter.trim().toLowerCase() === "all";
    const isAllStreams = !streamFilter || streamFilter === "All" || streamFilter.trim().toLowerCase() === "all";

    return normalizedLearners.filter((s) => {
      let matchesGrade = true;
      if (!isAllGrades) {
        const filterGrade = gradeFilter.trim().toLowerCase();
        const learnerGrade = (s.grade || "").trim().toLowerCase();
        matchesGrade =
          learnerGrade === filterGrade ||
          learnerGrade.replace(/\s+/g, "") === filterGrade.replace(/\s+/g, "") ||
          learnerGrade.replace(/[^0-9]/g, "") === filterGrade.replace(/[^0-9]/g, "");
      }

      let matchesStream = true;
      if (!isAllStreams) {
        const filterStream = (streamFilter || "").trim().toLowerCase();
        const learnerStream = (s.stream || "").trim().toLowerCase();
        matchesStream =
          learnerStream === filterStream ||
          learnerStream.replace(/\s+/g, "") === filterStream.replace(/\s+/g, "");
      }

      const q = (searchTerm || "").trim().toLowerCase();
      const matchesSearch =
        !q ||
        (s.name || "").toLowerCase().includes(q) ||
        (s.admNo || "").toLowerCase().includes(q) ||
        ((s as any).birthCertificateNo || "").toLowerCase().includes(q) ||
        (s.id || "").toLowerCase().includes(q);

      return matchesGrade && matchesStream && matchesSearch;
    }).filter((s) => s.status !== "TRANSFERRED");
  }, [normalizedLearners, searchTerm, gradeFilter, streamFilter]);

  // ── Menu state for LearnerManagementMenu ───────────────────────────────────
  const [menuFilterId, setMenuFilterId] = useState("all");

  const menuLearners = useMemo((): LearnerMenuItem[] => {
    return learners.map((l) => ({
      id: l.id,
      admNo: l.admNo,
      fullName: l.name,
      grade: l.grade,
      stream: l.stream,
      status: l.status ?? "Active",
      attendanceStatus: (l as any).attendanceStatus ?? "Unmarked",
      avatarUrl: (l as any).avatarUrl ?? null,
      guardian: l.guardian,
      phone: l.phone,
      birthCertificateNo: l.birthCertificateNo,
    }));
  }, [learners]);

  const menuFilters = useMemo(
    () => buildLearnerMenuFilters(menuLearners, menuFilterId),
    [menuLearners, menuFilterId]
  );

  const menuData = useMemo((): LearnerMenuData => {
    return {
      learners: applyLearnerFilter(menuLearners, menuFilterId),
      filters: menuFilters,
      activeFilterId: menuFilterId,
      isLoading: false,
      error: null,
    };
  }, [menuLearners, menuFilters, menuFilterId]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigate = useNavigate();

  const handleMenuLearnerClick = (learner: LearnerMenuItem) => {
    navigate(`/students/${learner.id}`);
  };

  const handleViewProfile = (learner: LearnerRowCompat) => {
    navigate(`/students/${learner.id}`);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const [learnerToDelete, setLearnerToDelete] = useState<LearnerRowCompat | null>(null);

  const confirmDelete = (learner: LearnerRowCompat) => {
    setLearners((prev) => prev.filter((item) => item.id !== learner.id));
    logDeletionAudit({
      action: "DELETE_LEARNER",
      targetId: learner.id,
      targetAdmNo: learner.admNo,
      targetName: learner.name,
    });
    showSuccess(`${learner.name} has been removed from the directory.`);
    setLearnerToDelete(null);
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const allExport = useFileDownload();
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const DATA_COLUMN_COUNT = 8;
  const LEADING_PADDING = 3;

  const buildCsv = (dataset: LearnerRowCompat[]): string => {
    const headers = [
      "Assessment No", "Full Name", "Birth Certificate No",
      "Grade", "Stream", "Gender", "Parent/Guardian", "Phone",
    ];
    const centeredRow = (text: string): string[] => {
      const row: string[] = Array(LEADING_PADDING).fill("");
      row.push(text);
      while (row.length < DATA_COLUMN_COUNT) row.push("");
      return row;
    };
    const dataRows = dataset.map((l) => [
      l.admNo,
      `"${l.name}"`,
      l.birthCertificateNo || "",
      l.grade,
      l.stream,
      l.gender,
      `"${l.guardian}"`,
      `"${l.phone}"`,
    ]);
    const allRows = [
      centeredRow("MUNYAKA PRIMARY AND JUNIOR"),
      centeredRow("P.O. BOX 5239-30100, ELDORET"),
      centeredRow("MOTTO: KNOWLEDGE IS POWER"),
      Array(DATA_COLUMN_COUNT).fill(""),
      headers,
      ...dataRows,
    ];
    return allRows.map((r) => r.join(",")).join("\n");
  };

  const handleExportAll = async () => {
    setIsExportMenuOpen(false);
    setIsExporting(true);
    let target = learners;
    try {
      const raw = localStorage.getItem("school_learners_data");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) target = parsed;
      }
    } catch {}
    const csv = buildCsv(target);
    await allExport.download({
      filename: `roster_${new Date().toISOString().slice(0, 10)}.csv`,
      data: csv,
      mimeType: "text/csv;charset=utf-8;",
      fileType: "csv",
    });
    setIsExporting(false);
  };

  const handleExportCurrentView = async () => {
    setIsExportMenuOpen(false);
    setIsExporting(true);
    const csv = buildCsv(filteredLearners);
    await allExport.download({
      filename: `roster_view_${new Date().toISOString().slice(0, 10)}.csv`,
      data: csv,
      mimeType: "text/csv;charset=utf-8;",
      fileType: "csv",
    });
    setIsExporting(false);
  };

  return (
    <div className="p-6 md:p-10 bg-[#FBFBFA] min-h-screen text-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-6">
        {/* ── Left: LearnerManagementMenu in admin mode ── */}
        <div className="xl:w-80 xl:shrink-0">
          <div className="xl:sticky xl:top-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs p-4">
            <LearnerManagementMenu
              data={menuData}
              rowLimit={10}
              searchTerm={searchTerm}
              onFilterChange={setMenuFilterId}
              onLearnerClick={handleMenuLearnerClick}
              adminMode={true}
              gradeFilter={gradeFilter}
              streamFilter={streamFilter}
            />
          </div>
        </div>

        {/* ── Right: full roster table ── */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                School Roster
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                {filteredLearners.length} active learner{filteredLearners.length !== 1 ? "s" : ""}
                {learners.length !== filteredLearners.length && ` (filtered from ${learners.length} total)`}
                {" · "}
                <Link
                  to="/learners/archive"
                  className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors"
                >
                  <Archive size={13} />
                  View Archive
                </Link>
              </p>
            </div>

            {/* Export button */}
            <div className="flex items-center gap-3 relative">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  disabled={isExporting || allExport.isDownloading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl shadow-2xs transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isExporting || allExport.isDownloading ? (
                    <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-slate-500" />
                  )}
                  Export CSV
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </button>
                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50">
                    <button
                      type="button"
                      onClick={handleExportAll}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                    >
                      <Users className="w-3.5 h-3.5" />
                      All Learners
                    </button>
                    <button
                      type="button"
                      onClick={handleExportCurrentView}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 border-t border-slate-100 flex items-center gap-2"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Current View ({filteredLearners.length})
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filters bar */}
          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, Assessment No, or Birth Certificate No…"
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
                  {GRADES_LIST.map((g) => (
                    <option key={g} value={g}>{g}</option>
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
                    <option value="__none__" disabled>No streams</option>
                  ) : (
                    availableStreams.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
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
                          <td className="py-4 px-6 text-slate-600 font-medium">{learner.stream}</td>
                          <td className="py-4 px-6">
                            {learner.gender === "Female" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200">
                                Female
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                {learner.gender}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-slate-700 font-medium">{learner.guardian}</td>
                          <td className="py-4 px-6 text-slate-600 font-mono text-xs">{learner.phone}</td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleViewProfile(learner)}
                                title="View profile"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setLearnerToDelete(learner)}
                                title="Delete learner"
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
                          <p className="text-slate-800 font-bold">No learners found.</p>
                          <p className="text-xs text-slate-400 max-w-sm">
                            Try adjusting the grade, stream, or search term.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
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
