import { useState, useEffect, useCallback, useRef } from "react";
import {
  cbcStudyContent,
  strandCategories,
  gradeLevels,
  type ContentItem,
  type StrandCategory,
} from "@/data/cbcStudyContent";
import {
  BookOpen,
  Search,
  Filter,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  X,
  ExternalLink,
  CheckCircle2,
  GraduationCap,
  Languages,
  FlaskConical,
  Globe,
  FileText,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  PlusCircle,
  Download,
  Printer,
  Paperclip,
  Image,
  FileSpreadsheet,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AddMaterialModal, { loadCustomMaterials } from "@/components/AddMaterialModal";
import {
  exportAssessment,
  printAssessment,
  exportAssessmentBulk,
} from "@/utils/exportAssessment";
import {
  openAttachment,
  downloadAttachment,
  formatBytes,
  attachmentIconKey,
  type Attachment,
} from "@/utils/attachmentHelpers";

// ─── localStorage keys ───────────────────────────────────────────────────────
const LS_BOOKMARKS = "studyCorner_bookmarks";
const LS_PROGRESS = "studyCorner_progress";

const loadBookmarks = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_BOOKMARKS) ?? "[]");
  } catch {
    return [];
  }
};

const loadProgress = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(LS_PROGRESS) ?? "{}");
  } catch {
    return {};
  }
};

// ─── Strand colour & icon map ────────────────────────────────────────────────
const strandMeta: Record<
  StrandCategory,
  { color: string; bg: string; icon: React.ReactNode }
> = {
  "CRE & Values": {
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    icon: <BookOpen size={16} />,
  },
  Languages: {
    color: "text-teal-700",
    bg: "bg-teal-50 border-teal-200",
    icon: <Languages size={16} />,
  },
  "STEM & Agriculture": {
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    icon: <FlaskConical size={16} />,
  },
  "Social Studies & Arts": {
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    icon: <Globe size={16} />,
  },
  "KICD Revision Bank": {
    color: "text-violet-700",
    bg: "bg-violet-50 border-violet-200",
    icon: <FileText size={16} />,
  },
};

const difficultyColour = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-700",
  advanced: "bg-red-100 text-red-700",
};

// ─── Reader Modal ────────────────────────────────────────────────────────────
function ReaderModal({
  item,
  onClose,
  onToggleBookmark,
  isBookmarked,
  onMarkComplete,
  isComplete,
  onDownload,
  onPrint,
  isDownloading,
  onOpenAttachment,
}: {
  item: ContentItem;
  onClose: () => void;
  onToggleBookmark: () => void;
  isBookmarked: boolean;
  onMarkComplete: () => void;
  isComplete: boolean;
  onDownload: () => void;
  onPrint: () => void;
  isDownloading?: boolean;
  onOpenAttachment?: (att: Attachment) => void;
}) {
  const meta = strandMeta[item.strand];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div
          className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${meta.bg}`}
        >
          <div className="flex items-center gap-2">
            <span className={meta.color}>{meta.icon}</span>
            <span className={`text-xs font-semibold uppercase tracking-wide ${meta.color}`}>
              {item.strand}
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-xs text-gray-500">Grade {item.grade}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                difficultyColour[item.difficulty]
              }`}
            >
              {item.difficulty}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/10 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6">
          {/* Sub-strand & topic */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              {item.subStrand}
            </p>
            <h2 className="text-xl font-bold text-gray-900 leading-snug">
              {item.topic}
            </h2>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              {item.summary}
            </p>
          </div>

          {/* Attachment */}
          {item.attachment && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
              <h3 className="text-sm font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                <Paperclip size={14} className="text-indigo-600" />
                Attached File
              </h3>
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-white flex items-center justify-center text-indigo-600 border border-indigo-200">
                  {attachmentIconKey(item.attachment) === "pdf" ? (
                    <FileText size={22} />
                  ) : attachmentIconKey(item.attachment) === "image" ? (
                    <Image size={22} />
                  ) : attachmentIconKey(item.attachment) === "doc" ? (
                    <FileText size={22} />
                  ) : attachmentIconKey(item.attachment) === "sheet" ? (
                    <FileSpreadsheet size={22} />
                  ) : (
                    <FileText size={22} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {item.attachment.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.attachment.type || "file"} · {formatBytes(item.attachment.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => onOpenAttachment?.(item.attachment!)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  <ExternalLink size={13} />
                  Open
                </button>
                <button
                  onClick={() => downloadAttachment(item.attachment!)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Download size={13} />
                  Download
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
          {item.notes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Key Notes
              </h3>
              <ul className="space-y-2">
                {item.notes.map((note, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Memory Verses */}
          {item.memoryVerses && item.memoryVerses.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <BookOpen size={14} className="text-amber-600" />
                Memory Verses
              </h3>
              {item.memoryVerses.map((verse, i) => (
                <div key={i} className="mb-2 last:mb-0">
                  <p className="text-xs font-semibold text-amber-700 italic mb-1">
                    {verse.reference}
                  </p>
                  <p className="text-sm text-amber-900 leading-relaxed italic">
                    &ldquo;{verse.text}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Revision Questions */}
          {item.revisionQuestions && item.revisionQuestions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FileText size={14} className="text-violet-500" />
                Revision Questions
              </h3>
              <div className="space-y-3">
                {item.revisionQuestions.map((rq, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-200 p-4 bg-gray-50"
                  >
                    <p className="text-sm font-medium text-gray-800 mb-1">
                      {i + 1}. {rq.question}
                    </p>
                    {rq.rubric && (
                      <p className="text-xs text-gray-400 mb-2">
                        [{rq.rubric}]
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <div className="flex-1 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-1.5">
                        <p className="text-xs text-emerald-700">{rq.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 z-10 flex items-center gap-2 flex-wrap px-6 py-4 border-t bg-white rounded-b-2xl">
          <button
            onClick={onToggleBookmark}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              isBookmarked
                ? "border-amber-400 bg-amber-50 text-amber-700"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            {isBookmarked ? (
              <BookmarkCheck size={15} className="text-amber-500" />
            ) : (
              <Bookmark size={15} />
            )}
            {isBookmarked ? "Bookmarked" : "Bookmark"}
          </button>
          <button
            onClick={onMarkComplete}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              isComplete
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            <CheckCircle2 size={15} className={isComplete ? "text-emerald-500" : ""} />
            {isComplete ? "Completed" : "Mark Complete"}
          </button>

          {/* Download as printable HTML */}
          <button
            onClick={onDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {isDownloading ? (
              <span className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
            ) : (
              <Download size={15} />
            )}
            Download
          </button>

          {/* Print / Save as PDF */}
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Printer size={15} />
            Print / PDF
          </button>

          <button
            onClick={onClose}
            className="ml-auto flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Content Card ─────────────────────────────────────────────────────────────
function ContentCard({
  item,
  isBookmarked,
  isComplete,
  progress,
  onOpen,
  onToggleBookmark,
  onDownload,
  onOpenAttachment,
}: {
  item: ContentItem;
  isBookmarked: boolean;
  isComplete: boolean;
  progress: number;
  onOpen: () => void;
  onToggleBookmark: () => void;
  onDownload?: () => void;
  onOpenAttachment?: (att: Attachment) => void;
}) {
  const meta = strandMeta[item.strand];

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
        isComplete ? "ring-2 ring-emerald-300" : "hover:border-gray-300"
      }`}
      onClick={onOpen}
    >
      {/* Progress bar */}
      {progress > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gray-100">
          <div
            className="h-full rounded-t-2xl bg-emerald-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${meta.bg}`}>
          <span className={meta.color}>{meta.icon}</span>
          <span className={`font-medium ${meta.color}`}>{item.strand}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              difficultyColour[item.difficulty]
            }`}
          >
            {item.difficulty}
          </span>
          <span className="text-xs text-gray-400 font-medium">G{item.grade}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-1">{item.subStrand}</p>
        <h3 className="font-semibold text-gray-900 mb-2 leading-snug group-hover:text-blue-700 transition-colors">
          {item.topic}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
          {item.summary}
        </p>

        {/* Attachment badge (only if a file is attached) */}
        {item.attachment && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenAttachment?.(item.attachment!);
            }}
            className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-left transition-colors"
            title="Open attached file"
          >
            <span className="shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 border border-indigo-200">
              {attachmentIconKey(item.attachment) === "pdf" ? (
                <FileText size={15} />
              ) : attachmentIconKey(item.attachment) === "image" ? (
                <Image size={15} />
              ) : attachmentIconKey(item.attachment) === "doc" ? (
                <FileText size={15} />
              ) : attachmentIconKey(item.attachment) === "sheet" ? (
                <FileSpreadsheet size={15} />
              ) : (
                <FileText size={15} />
              )}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-semibold text-indigo-700 truncate">
                <Paperclip size={11} className="inline -mt-0.5 mr-1" />
                Attached file
              </span>
              <span className="block text-[11px] text-gray-500 truncate">
                {item.attachment.name} · {formatBytes(item.attachment.size)}
              </span>
            </span>
            <Download size={14} className="shrink-0 text-indigo-500" />
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {isComplete && (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 size={12} /> Done
            </span>
          )}
          {item.revisionQuestions && (
            <span className="flex items-center gap-1">
              <FileText size={12} />
              {item.revisionQuestions.length} Qs
            </span>
          )}
          {item.memoryVerses && (
            <span className="flex items-center gap-1">
              <BookOpen size={12} />
              {item.memoryVerses.length} verses
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
              title="Download as printable HTML / PDF"
            >
              <Download size={13} />
              <span className="hidden sm:inline">
                {item.revisionQuestions && item.revisionQuestions.length > 0
                  ? "Download Assessment"
                  : "Download Notes"}
              </span>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark();
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isBookmarked ? (
              <BookmarkCheck size={15} className="text-amber-500" />
            ) : (
              <Bookmark size={15} className="text-gray-300 group-hover:text-amber-400 transition-colors" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Filter pills row ─────────────────────────────────────────────────────────
function FilterPills({
  categories,
  selected,
  onToggle,
}: {
  categories: StrandCategory[];
  selected: StrandCategory[];
  onToggle: (c: StrandCategory) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const active = selected.includes(cat);
        const meta = strandMeta[cat];
        return (
          <button
            key={cat}
            onClick={() => onToggle(cat)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              active
                ? `${meta.bg} ${meta.color} border-current`
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"
            }`}
          >
            {meta.icon}
            {cat}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudyCorner() {
  const { user } = useAuth();
  const isAdminOrTeacher =
    user?.role === "admin" ||
    user?.role === "head_teacher" ||
    user?.role === "teacher";

  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedStrands, setSelectedStrands] = useState<StrandCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>(loadBookmarks);
  const [completionMap, setCompletionMap] = useState<Record<string, boolean>>({});
  const [readProgress, setReadProgress] = useState<Record<string, number>>(loadProgress);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Custom materials loaded from localStorage
  const [customItems, setCustomItems] = useState<ContentItem[]>(() => loadCustomMaterials());

  // Full content: default + custom
  const allContent: ContentItem[] = [...cbcStudyContent, ...customItems];

  // Persist bookmarks
  useEffect(() => {
    localStorage.setItem(LS_BOOKMARKS, JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Persist progress
  useEffect(() => {
    localStorage.setItem(LS_PROGRESS, JSON.stringify(readProgress));
  }, [readProgress]);

  // ── Filtered & grouped data — declared BEFORE handlers ───────────────────
  const filtered = allContent.filter((item) => {
    if (selectedGrade !== null && item.grade !== selectedGrade) return false;
    if (selectedStrands.length > 0 && !selectedStrands.includes(item.strand))
      return false;
    if (showBookmarksOnly && !bookmarks.includes(item.id)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.topic.toLowerCase().includes(q) ||
        item.subStrand.toLowerCase().includes(q) ||
        item.strand.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Group by strand for display
  const grouped = filtered.reduce<Record<StrandCategory, ContentItem[]>>(
    (acc, item) => {
      if (!acc[item.strand]) acc[item.strand] = [];
      acc[item.strand].push(item);
      return acc;
    },
    {} as Record<StrandCategory, ContentItem[]>
  );

  // ── Ref so handleDownloadAllForGrade reads current filter state without ──
  //    needing `filtered` as a useCallback dependency (avoids stale closure).
  const filteredRef = useRef(filtered);
  filteredRef.current = filtered;

  // ── Handler callbacks ──────────────────────────────────────────────────
  const handleCustomSave = useCallback((item: ContentItem) => {
    setCustomItems((prev) => [item, ...prev]);
  }, []);

  const handleDownloadItem = useCallback(async (item: ContentItem) => {
    setIsDownloading(true);
    try {
      await exportAssessment({ item, format: "html" });
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const handlePrintItem = useCallback((item: ContentItem) => {
    printAssessment(item);
  }, []);

  const handleOpenAttachment = useCallback((att: Attachment) => {
    openAttachment(att);
  }, []);

  const handleDownloadAllForGrade = useCallback(async () => {
    if (selectedGrade === null) return;
    const subjectLabel =
      selectedStrands.length === 1 ? selectedStrands[0] : undefined;
    setIsDownloading(true);
    try {
      await exportAssessmentBulk({
        items: filteredRef.current, // read latest value from ref
        grade: selectedGrade,
        subject: subjectLabel,
        format: "html",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [selectedGrade, selectedStrands]); // no `filtered` dependency

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  }, []);

  const toggleStrand = useCallback((strand: StrandCategory) => {
    setSelectedStrands((prev) =>
      prev.includes(strand)
        ? prev.filter((s) => s !== strand)
        : [...prev, strand]
    );
  }, []);

  const markComplete = useCallback((id: string) => {
    setCompletionMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleOpenItem = useCallback((item: ContentItem) => {
    setActiveItem(item);
    // Record that user opened this item (50% progress)
    setReadProgress((prev) => ({
      ...prev,
      [item.id]: Math.max(prev[item.id] ?? 0, 50),
    }));
  }, []);

  const handleCloseItem = useCallback(() => {
    if (activeItem) {
      // Mark as fully read on close
      setReadProgress((prev) => ({ ...prev, [activeItem.id]: 100 }));
    }
    setActiveItem(null);
  }, [activeItem]);

  const bookmarkCount = bookmarks.length;
  const completedCount = Object.values(completionMap).filter(Boolean).length;
  const totalTopics = allContent.length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-blue-100">
              <GraduationCap size={22} className="text-blue-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Study Corner</h1>
              <p className="text-sm text-gray-500">
                CBC learning resources — Grades 1–9 · {totalTopics} topics
                {customItems.length > 0 && (
                  <span className="ml-1 text-indigo-500 font-medium">
                    ({customItems.length} custom)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Add Material — Admin / Teacher only */}
          {isAdminOrTeacher && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <PlusCircle size={16} />
              Add Learning Material
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between gap-4 mt-4">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Bookmark size={13} className="text-amber-500" />
              {bookmarkCount} bookmarked
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-500" />
              {completedCount} completed
            </span>
            <span className="flex items-center gap-1">
              <FileText size={13} />
              {filtered.length} showing
            </span>
          </div>

          {/* Download All for Grade — shown only when a specific grade is selected */}
          {selectedGrade !== null && filtered.length > 0 && (
            <button
              onClick={handleDownloadAllForGrade}
              disabled={isDownloading}
              className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isDownloading ? (
                <span className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <Download size={13} />
              )}
              Download All for Grade {selectedGrade}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Search & Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search topics, strands, or tags…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100"
              >
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>

          {/* Grade selector */}
          <div className="relative">
            <select
              value={selectedGrade ?? ""}
              onChange={(e) =>
                setSelectedGrade(e.target.value ? Number(e.target.value) : null)
              }
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Grades</option>
              {gradeLevels.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          {/* Bookmarks toggle */}
          <button
            onClick={() => setShowBookmarksOnly((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              showBookmarksOnly
                ? "border-amber-300 bg-amber-50 text-amber-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-amber-300"
            }`}
          >
            <BookmarkCheck
              size={15}
              className={showBookmarksOnly ? "text-amber-500" : ""}
            />
            Bookmarks
            {bookmarkCount > 0 && (
              <span className="bg-amber-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {bookmarkCount}
              </span>
            )}
          </button>

          {/* Filter toggle */}
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              filterOpen || selectedStrands.length > 0
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-blue-300"
            }`}
          >
            <Filter size={15} />
            Filter
            {selectedStrands.length > 0 && (
              <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {selectedStrands.length}
              </span>
            )}
          </button>

          {/* Reset */}
          {(searchQuery || selectedGrade !== null || selectedStrands.length > 0 || showBookmarksOnly) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedGrade(null);
                setSelectedStrands([]);
                setShowBookmarksOnly(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}
        </div>

        {/* Strand filter pills */}
        {filterOpen && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Filter by Strand
            </p>
            <FilterPills
              categories={strandCategories}
              selected={selectedStrands}
              onToggle={toggleStrand}
            />
          </div>
        )}

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 rounded-full bg-gray-100 mb-4">
              <Search size={28} className="text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">
              No topics found
            </h3>
            <p className="text-sm text-gray-400 max-w-xs">
              Try adjusting your search query or filters to find what you&apos;re
              looking for.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedGrade(null);
                setSelectedStrands([]);
                setShowBookmarksOnly(false);
              }}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Show all flat when searching or filtering */}
            {searchQuery ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((item) => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      isBookmarked={bookmarks.includes(item.id)}
                      isComplete={!!completionMap[item.id]}
                      progress={readProgress[item.id] ?? 0}
                      onOpen={() => handleOpenItem(item)}
                      onToggleBookmark={() => toggleBookmark(item.id)}
                      onDownload={() => handleDownloadItem(item)}
                      onOpenAttachment={handleOpenAttachment}
                    />
                  ))}
                </div>
              </div>
            ) : (
              // Grouped by strand
              Object.entries(grouped).map(([strand, items]) => {
                const meta = strandMeta[strand as StrandCategory];
                return (
                  <div key={strand}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className={meta.color}>{meta.icon}</span>
                      <h2 className={`text-sm font-bold ${meta.color} uppercase tracking-wide`}>
                        {strand}
                      </h2>
                      <span className="text-xs text-gray-400 font-medium">
                        ({items.length} {items.length === 1 ? "topic" : "topics"})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((item) => (
                        <ContentCard
                          key={item.id}
                          item={item}
                          isBookmarked={bookmarks.includes(item.id)}
                          isComplete={!!completionMap[item.id]}
                          progress={readProgress[item.id] ?? 0}
                          onOpen={() => handleOpenItem(item)}
                          onToggleBookmark={() => toggleBookmark(item.id)}
                          onDownload={() => handleDownloadItem(item)}
                          onOpenAttachment={handleOpenAttachment}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Reader Modal */}
      {activeItem && (
        <ReaderModal
          item={activeItem}
          onClose={handleCloseItem}
          isBookmarked={bookmarks.includes(activeItem.id)}
          onToggleBookmark={() => toggleBookmark(activeItem.id)}
          onMarkComplete={() => markComplete(activeItem.id)}
          isComplete={!!completionMap[activeItem.id]}
          onDownload={() => handleDownloadItem(activeItem)}
          onPrint={() => handlePrintItem(activeItem)}
          isDownloading={isDownloading}
          onOpenAttachment={handleOpenAttachment}
        />
      )}

      {/* Add Material Modal */}
      {showAddModal && (
        <AddMaterialModal
          onClose={() => setShowAddModal(false)}
          onSave={handleCustomSave}
        />
      )}
    </div>
  );
}
