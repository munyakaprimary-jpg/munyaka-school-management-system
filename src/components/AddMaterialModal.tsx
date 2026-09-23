import { useState, useEffect, useRef } from "react";
import {
  saveStudyMaterialIdb,
} from "@/services/studyMaterialsIdb";
import {
  X,
  BookOpen,
  FileText,
  ListChecks,
  Link2,
  Star,
  AlertCircle,
  CheckCircle2,
  UploadCloud,
  Paperclip,
  Trash2,
  FileSpreadsheet,
  Image,
  Clock,
  Award,
  FileKey,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  strandCategories,
  gradeLevels,
  assessmentTypeOptions,
  ContentItem,
  StrandCategory,
  MemoryVerse,
  RevisionQuestion,
  Attachment,
  AssessmentType,
} from "@/data/cbcStudyContent";
import { useAuth } from "@/context/AuthContext";
import {
  fileToAttachment,
  formatBytes,
  attachmentIconKey,
} from "@/utils/attachmentHelpers";

const LS_KEY = "custom_study_materials";
export const STUDY_MATERIALS_DB_KEY = "custom_study_materials";
export const CENTRAL_DB_KEY = "munyaka_central_db";

export type ContentType = "notes" | "memory_verse" | "practice_questions" | "pdf_link" | "assessment";

export interface NewMaterialForm {
  title: string;
  strand: StrandCategory | "";
  grade: number | "";
  subStrand: string;
  contentType: ContentType;
  body: string;
  attachment?: Attachment;
  /** Assessment-specific fields */
  assessmentType?: AssessmentType;
  totalMarks?: number | "";
  durationMinutes?: number | "";
  markingScheme?: Attachment;
}

const CONTENT_TYPES: { value: ContentType; label: string; icon: React.ReactNode }[] = [
  { value: "notes", label: "Notes / Summary", icon: <BookOpen size={14} /> },
  { value: "memory_verse", label: "Memory Verse", icon: <Star size={14} /> },
  { value: "practice_questions", label: "Practice Questions", icon: <ListChecks size={14} /> },
  { value: "pdf_link", label: "Resource PDF Link", icon: <Link2 size={14} /> },
  { value: "assessment", label: "Assessment / Quiz", icon: <Award size={14} /> },
];

export function loadCustomMaterials(): ContentItem[] {
  try {
    let items: ContentItem[] = [];
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) items = parsed;
    }

    // Also check munyaka_central_db central database
    const centralRaw = localStorage.getItem(CENTRAL_DB_KEY);
    if (centralRaw) {
      try {
        const centralDb = JSON.parse(centralRaw);
        const centralMaterials = centralDb.studyMaterials || centralDb.materials || [];
        if (Array.isArray(centralMaterials) && centralMaterials.length > 0) {
          const existingIds = new Set(items.map(i => i.id));
          for (const m of centralMaterials) {
            if (m && m.id && !existingIds.has(m.id)) {
              items.push(m);
              existingIds.add(m.id);
            }
          }
        }
      } catch {
        /* ignore */
      }
    }

    return items;
  } catch {
    return [];
  }
}

export function saveCustomMaterial(item: ContentItem): void {
  const existing = loadCustomMaterials();
  const enriched = {
    ...item,
    category: (item as any).category ?? item.strand,
  };
  const updated = [enriched, ...existing.filter(i => i.id !== enriched.id)];
  localStorage.setItem(LS_KEY, JSON.stringify(updated));

  // Save to IndexedDB for robust offline persistence
  saveStudyMaterialIdb(enriched).catch(err => {
    console.error("[AddMaterialModal] Failed to save to IndexedDB:", err);
  });

  // Sync to munyaka_central_db central database
  try {
    const centralRaw = localStorage.getItem(CENTRAL_DB_KEY);
    const centralDb = centralRaw ? JSON.parse(centralRaw) : {};
    centralDb.studyMaterials = updated;
    localStorage.setItem(CENTRAL_DB_KEY, JSON.stringify(centralDb));
  } catch {
    /* ignore */
  }

  window.dispatchEvent(new CustomEvent("custom_study_materials_updated"));
}

/** Read a single stored custom material by id (helper for assessment view). */
export function getCustomMaterialById(id: string): ContentItem | null {
  return loadCustomMaterials().find((m) => m.id === id) ?? null;
}

/** Filter stored custom materials by category/strand. */
export function getCustomMaterialsByCategory(category: string): ContentItem[] {
  return loadCustomMaterials().filter(
    (m) => m.strand === category || (m as any).category === category
  );
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface AddMaterialModalProps {
  onClose: () => void;
  onSave: (item: ContentItem) => void;
  /** When provided, pre-selects this strand and sets content type to "assessment". */
  preSelectedStrand?: StrandCategory;
}

export default function AddMaterialModal({ onClose, onSave, preSelectedStrand }: AddMaterialModalProps) {
  const { user } = useAuth();
  const isAdminOrTeacher =
    user?.role === "admin" || user?.role === "teacher";

  const [form, setForm] = useState<NewMaterialForm>({
    title: "",
    strand: preSelectedStrand ?? "",
    grade: "",
    subStrand: "",
    contentType: preSelectedStrand ? "assessment" : "notes",
    body: "",
    attachment: undefined,
    assessmentType: undefined,
    totalMarks: "",
    durationMinutes: "",
    markingScheme: undefined,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof NewMaterialForm | "attachment", string>>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);
  const [isDragOverScheme, setIsDragOverScheme] = useState<boolean>(false);
  const [isReadingScheme, setIsReadingScheme] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const schemeInputRef = useRef<HTMLInputElement | null>(null);

  const isAssessment = form.strand === "Assessments & Quizzes" || form.contentType === "assessment";
  const effectiveContentType =
    form.strand === "Assessments & Quizzes" ? "assessment" : form.contentType;

  // Trap focus inside modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const set = (field: keyof NewMaterialForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /** Setter for numeric assessment fields. Empty string stays empty; otherwise parse to number. */
  const setNumber = (
    field: "totalMarks" | "durationMinutes",
    raw: string
  ) => {
    const trimmed = raw.trim();
    setForm((prev) => ({
      ...prev,
      [field]: trimmed === "" ? "" : Number(trimmed),
    }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /** Process a file (from input or drag-and-drop) into an Attachment. */
  const processFile = async (file: File) => {
    setErrors((prev) => ({ ...prev, attachment: undefined }));
    setIsReadingFile(true);
    try {
      const attachment = await fileToAttachment(file);
      setForm((prev) => ({ ...prev, attachment }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to read file.";
      setErrors((prev) => ({ ...prev, attachment: message }));
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset so the same file can be re-selected after removal
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const removeAttachment = () => {
    setForm((prev) => ({ ...prev, attachment: undefined }));
    setErrors((prev) => ({ ...prev, attachment: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /** Process a marking-scheme file. */
  const processSchemeFile = async (file: File) => {
    setErrors((prev) => ({ ...prev, markingScheme: undefined }));
    setIsReadingScheme(true);
    try {
      const attachment = await fileToAttachment(file);
      setForm((prev) => ({ ...prev, markingScheme: attachment }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to read file.";
      setErrors((prev) => ({ ...prev, markingScheme: message }));
    } finally {
      setIsReadingScheme(false);
    }
  };

  const handleSchemeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processSchemeFile(file);
    e.target.value = "";
  };

  const handleSchemeDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOverScheme(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processSchemeFile(file);
  };

  const removeMarkingScheme = () => {
    setForm((prev) => ({ ...prev, markingScheme: undefined }));
    setErrors((prev) => ({ ...prev, markingScheme: undefined }));
    if (schemeInputRef.current) schemeInputRef.current.value = "";
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof NewMaterialForm, string>> = {};
    if (!form.title.trim()) next.title = "Title is required";
    if (!form.strand) next.strand = "Please select a Learning Area";
    if (!form.grade) next.grade = "Please select a Grade Level";
    // Body is required only when no attachment is present
    // For assessments with a document file, body is always optional
    const needsBody = !form.attachment && !(isAssessment || effectiveContentType === "assessment");
    if (!form.body.trim() && needsBody) {
      next.body = "Body / Lesson Notes are required (or upload an attachment instead)";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);

    // If a file is uploaded but body is empty, auto-fill with a friendly
    // placeholder so the material has a meaningful summary / notes.
    const isAssessmentStrand = form.strand === "Assessments & Quizzes" || form.contentType === "assessment";
    const effectiveBody =
      form.body.trim() ||
      (form.attachment
        ? isAssessmentStrand
          ? `Attached assessment document: ${form.attachment.name}`
          : `Document file attached: ${form.attachment.name}`
        : "");

    const gradeNum = form.grade as number;
    const timestamp = Date.now();
    const id = `custom-${slugify(form.title)}-${timestamp}`;

    // Determine difficulty from grade
    const difficulty: ContentItem["difficulty"] =
      gradeNum <= 3 ? "Easy" : gradeNum <= 6 ? "Medium" : "Hard";

    // Parse body based on content type
    let notes: string | string[] = "";
    let memoryVerses: MemoryVerse[] | undefined;
    let revisionQuestions: RevisionQuestion[] | undefined;

    switch (form.contentType) {
      case "notes":
        // Split by newlines into bullet notes; if body is empty (file-only)
        // this produces an empty notes array — that's fine, the summary carries context.
        notes = effectiveBody
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        break;

      case "memory_verse": {
        // Format: "Reference | Verse text" per line
        memoryVerses = effectiveBody
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0)
          .map((l, idx) => {
            const parts = l.split("|").map((p) => p.trim());
            const textVal = parts.slice(1).join(" | ") || parts[0] || "";
            return {
              id: `mv-${timestamp}-${idx}`,
              reference: parts[0] || "Scripture",
              verse: textVal,
              text: textVal,
            };
          });
        break;
      }

      case "practice_questions": {
        // Format: "Question | Answer | Rubric(optional)" per line
        revisionQuestions = effectiveBody
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0)
          .map((l, idx) => {
            const parts = l.split("|").map((p) => p.trim());
            return {
              id: `rq-${timestamp}-${idx}`,
              question: parts[0] || "",
              answer: parts[1] || "",
              rubric: parts[2] || undefined,
            };
          });
        break;
      }

      case "pdf_link":
        // Treat body as a URL or descriptive note
        notes = effectiveBody;
        break;
    }

    const item: ContentItem = {
      id,
      title: form.title.trim(),
      description: effectiveBody.substring(0, 200),
      grade: gradeNum,
      strand: form.strand as StrandCategory,
      subStrand: form.subStrand.trim() || (form.strand as StrandCategory),
      topic: form.title.trim(),
      summary: effectiveBody.substring(0, 200),
      notes: Array.isArray(notes) ? notes.join(', ') : (notes || ''),
      memoryVerses,
      revisionQuestions,
      difficulty,
      tags: [
        form.strand as StrandCategory,
        `Grade ${gradeNum}`,
        effectiveContentType,
        "custom",
        ...(effectiveContentType === "assessment" && form.assessmentType
          ? [form.assessmentType]
          : []),
      ],
      ...(form.attachment ? { attachment: form.attachment } : {}),
      ...(effectiveContentType === "assessment"
        ? {
            ...(form.assessmentType ? { assessmentType: form.assessmentType } : {}),
            ...(form.totalMarks !== "" ? { totalMarks: Number(form.totalMarks) } : {}),
            ...(form.durationMinutes !== ""
              ? { durationMinutes: Number(form.durationMinutes) }
              : {}),
            ...(form.markingScheme ? { markingScheme: form.markingScheme } : {}),
          }
        : {}),
    };

    // Persist to localStorage. When the user picks the "Assessments &
    // Quizzes" strand, the item's `strand` field already carries that exact
    // value. The `category` field is also explicitly set to mirror `strand`
    // so the "Assessments & Quizzes" tab can filter by it strictly.
    // When the modal is opened from the assessments tab, `category` is
    // forcefully set to "Assessments & Quizzes" regardless of any other
    // user changes.
    const forcedCategory: StrandCategory =
      preSelectedStrand === "Assessments & Quizzes"
        ? "Assessments & Quizzes"
        : item.strand;
    const lsPayload: ContentItem = {
      ...item,
      strand: forcedCategory,
      category: forcedCategory,
    };
    saveCustomMaterial(lsPayload);
    setIsSaving(false);
    setSaved(true);
    onSave(lsPayload);

    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 rounded-t-2xl shrink-0 ${
          preSelectedStrand === "Assessments & Quizzes"
            ? "bg-rose-600"
            : "bg-indigo-600"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/20">
              {preSelectedStrand === "Assessments & Quizzes" ? (
                <Award size={18} className="text-white" />
              ) : (
                <BookOpen size={18} className="text-white" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {preSelectedStrand === "Assessments & Quizzes"
                  ? "Upload Assessment / Quiz Document"
                  : "Add Study Material"}
              </h2>
              <p className="text-xs text-white/80">
                {isAdminOrTeacher ? "Administrator" : "Teacher"} · Study Corner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        {saved ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Material Saved!</h3>
            <p className="text-sm text-gray-500">Your study material is now live in Study Corner.</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5 overflow-y-auto">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder='e.g. "Grade 4 CRE: David and Goliath"'
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow ${
                  errors.title ? "border-red-400 bg-red-50" : "border-gray-200"
                }`}
              />
              {errors.title && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle size={12} /> {errors.title}
                </p>
              )}
            </div>

            {/* Learning Area + Grade Level */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Learning Area / Subject <span className="text-red-500">*</span>
                  {preSelectedStrand === "Assessments & Quizzes" && (
                    <span className="ml-1.5 inline-flex items-center gap-1 normal-case font-normal text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                      🔒 Locked
                    </span>
                  )}
                </label>
                {preSelectedStrand === "Assessments & Quizzes" ? (
                  // ── Locked read-only display when opened from Assessments tab ──
                  <div className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50/60 text-sm text-rose-800 font-semibold flex items-center gap-2">
                    <Award size={14} className="text-rose-600" />
                    Assessments & Quizzes
                    <input type="hidden" value={form.strand} readOnly />
                  </div>
                ) : (
                  <select
                    value={form.strand}
                    onChange={(e) => set("strand", e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                      errors.strand ? "border-red-400 bg-red-50" : "border-gray-200"
                    }`}
                  >
                    <option value="">Select subject…</option>
                    {strandCategories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                )}
                {errors.strand && (
                  <p className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle size={12} /> {errors.strand}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Grade Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.grade}
                  onChange={(e) => set("grade", e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                    errors.grade ? "border-red-400 bg-red-50" : "border-gray-200"
                  }`}
                >
                  <option value="" disabled>Select grade…</option>
                  <optgroup label="Pre-Primary (PP1–PP2)">
                    <option value="PP1">PP1</option>
                    <option value="PP2">PP2</option>
                  </optgroup>
                  <optgroup label="Lower Primary (Grades 1–3)">
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                  </optgroup>
                  <optgroup label="Upper Primary (Grades 4–6)">
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                  </optgroup>
                  <optgroup label="Junior Secondary (Grades 7–9)">
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                  </optgroup>
                </select>
                {errors.grade && (
                  <p className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle size={12} /> {errors.grade}
                  </p>
                )}
              </div>
            </div>

            {/* Strand / Sub-Strand */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Strand / Sub-Strand
                <span className="ml-1 text-gray-400 normal-case font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.subStrand}
                onChange={(e) => set("subStrand", e.target.value)}
                placeholder='e.g. "Strand 2: Christian Living"'
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>

            {/* File / Attachment Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Upload File / Attachment
                <span className="ml-1 text-gray-400 normal-case font-normal">
                  (PDF, DOCX, TXT, Images — optional)
                </span>
              </label>

              {form.attachment ? (
                // ── Preview badge when a file is selected ──
                <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-indigo-200 bg-indigo-50/60">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-white flex items-center justify-center text-indigo-600 border border-indigo-200">
                    {attachmentIconKey(form.attachment) === "pdf" ? (
                      <FileText size={18} />
                    ) : attachmentIconKey(form.attachment) === "image" ? (
                      <Image size={18} />
                    ) : attachmentIconKey(form.attachment) === "doc" ? (
                      <FileText size={18} />
                    ) : attachmentIconKey(form.attachment) === "sheet" ? (
                      <FileSpreadsheet size={18} />
                    ) : (
                      <FileText size={18} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {form.attachment.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {form.attachment.type || "file"} · {formatBytes(form.attachment.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const event = new CustomEvent("open_document_preview", { detail: form.attachment });
                      window.dispatchEvent(event);
                    }}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50 transition-colors font-semibold shadow-xs"
                  >
                    <span>👁 Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                    Remove
                  </button>
                </div>
              ) : (
                // ── Drag-and-drop zone + button ──
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed text-center transition-colors ${
                    isDragOver
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-200 bg-gray-50/60 hover:border-indigo-300 hover:bg-indigo-50/40"
                  } ${isReadingFile ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    {isReadingFile ? (
                      <span className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    ) : (
                      <UploadCloud size={22} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      {isReadingFile
                        ? "Reading file…"
                        : "Drag & drop a file here, or"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Stored offline in your browser (Base64)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isReadingFile}
                    className="flex items-center gap-1.5 mt-1 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <Paperclip size={13} />
                    Upload File
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,.svg,.csv,.xls,.xlsx,application/pdf,image/*,text/plain"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              )}

              {errors.attachment && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle size={12} /> {errors.attachment}
                </p>
              )}
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Content Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CONTENT_TYPES.map((ct) => (
                  <button
                    key={ct.value}
                    type="button"
                    onClick={() => set("contentType", ct.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      form.contentType === ct.value
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span className={form.contentType === ct.value ? "text-indigo-500" : "text-gray-400"}>
                      {ct.icon}
                    </span>
                    {ct.label}
                  </button>
                ))}
              </div>

              {/* Content type hint */}
              <p className="text-xs text-gray-400 italic">
                {form.contentType === "notes" && "Enter one bullet point per line. Each line becomes a note."}
                {form.contentType === "memory_verse" && "Enter one verse per line: Reference | Verse text"}
                {form.contentType === "practice_questions" && "Enter one question per line: Question | Answer | Rubric (optional)"}
                {form.contentType === "pdf_link" && "Enter the full URL or a brief description of the resource."}
                {form.contentType === "assessment" && "Select Assessment details below; upload the question paper (PDF/Doc) and an optional marking scheme."}
              </p>
            </div>

            {/* Assessment-specific fields — shown when this is an assessment material */}
            {(isAssessment || effectiveContentType === "assessment") && (
              <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Award size={14} className="text-violet-600" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                    Assessment Details
                  </h3>
                </div>

                {/* Assessment type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">
                    Assessment Type
                  </label>
                  <select
                    value={form.assessmentType ?? ""}
                    onChange={(e) =>
                      set("assessmentType", e.target.value as string)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    <option value="">Select assessment type…</option>
                    {assessmentTypeOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Total marks + duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <Award size={11} className="text-violet-500" />
                      Total Marks <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.totalMarks === "" ? "" : form.totalMarks}
                      onChange={(e) => setNumber("totalMarks", e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <Clock size={11} className="text-violet-500" />
                      Duration <span className="text-gray-400 font-normal">(minutes, optional)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.durationMinutes === "" ? "" : form.durationMinutes}
                      onChange={(e) => setNumber("durationMinutes", e.target.value)}
                      placeholder="e.g. 90"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                {/* Marking scheme / answer key upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <FileKey size={11} className="text-violet-500" />
                    Marking Scheme / Answer Key
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>

                  {form.markingScheme ? (
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-violet-200 bg-white">
                      <div className="shrink-0 w-8 h-8 rounded-md bg-violet-50 flex items-center justify-center text-violet-600">
                        <FileKey size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {form.markingScheme.name}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {formatBytes(form.markingScheme.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeMarkingScheme}
                        className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded-md border border-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOverScheme(true);
                      }}
                      onDragLeave={() => setIsDragOverScheme(false)}
                      onDrop={handleSchemeDrop}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 border-dashed text-sm transition-colors ${
                        isDragOverScheme
                          ? "border-violet-400 bg-violet-50"
                          : "border-gray-200 bg-white/60 hover:border-violet-300"
                      } ${isReadingScheme ? "opacity-60 pointer-events-none" : ""}`}
                    >
                      <FileKey
                        size={16}
                        className="text-violet-500 shrink-0"
                      />
                      <span className="flex-1 text-xs text-gray-600">
                        {isReadingScheme
                          ? "Reading…"
                          : "Drop answer key file or:"}
                      </span>
                      <button
                        type="button"
                        onClick={() => schemeInputRef.current?.click()}
                        disabled={isReadingScheme}
                        className="text-xs px-2.5 py-1 rounded-md bg-violet-600 hover:bg-violet-700 text-white font-semibold disabled:opacity-50"
                      >
                        Browse
                      </button>
                      <input
                        ref={schemeInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.md,application/pdf,text/plain"
                        onChange={handleSchemeInputChange}
                        className="hidden"
                      />
                    </div>
                  )}

                  {errors.markingScheme && (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle size={12} /> {errors.markingScheme}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Body / Lesson Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Body / Lesson Notes
                {!form.attachment && (
                  <span className="text-red-500"> *</span>
                )}
                {form.attachment && (
                  <span className="ml-1 text-gray-400 normal-case font-normal">
                    (optional — file attached)
                  </span>
                )}
              </label>
              <textarea
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
                placeholder={
                  form.attachment
                    ? `Optional — notes for "${form.attachment.name}"…`
                    : form.contentType === "memory_verse"
                    ? "Genesis 1:1 | In the beginning God created the heavens and the earth.\nJohn 3:16 | For God so loved the world…"
                    : form.contentType === "practice_questions"
                    ? "What is photosynthesis? | Photosynthesis is the process by which plants make food using sunlight. | 3 marks\nWho discovered penicillin? | Alexander Fleming discovered penicillin in 1928. | 2 marks"
                    : form.contentType === "pdf_link"
                    ? "https://example.com/grade-4-science-notes.pdf\nOr enter a brief description of the PDF resource…"
                    : form.contentType === "assessment"
                    ? "Enter questions here (or upload the question paper above):\n\nQ1. What is…? | Answer: … | 5 marks\nQ2. Calculate…? | Answer: … | 5 marks\n…"
                    : "Enter key bullet points, one per line:\n• God created light on Day 1\n• God created the sky on Day 2\n• God rested on Day 7"
                }
                rows={7}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow resize-none font-mono leading-relaxed ${
                  errors.body ? "border-red-400 bg-red-50" : "border-gray-200"
                }`}
              />
              {errors.body && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle size={12} /> {errors.body}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        {!saved && (
          <div className="sticky bottom-0 z-10 flex items-center gap-3 px-6 py-4 border-t bg-white rounded-b-2xl shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className={`ml-auto flex items-center gap-2 font-semibold rounded-xl px-5 py-2.5 text-sm shadow-sm ${
                preSelectedStrand === "Assessments & Quizzes"
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  {preSelectedStrand === "Assessments & Quizzes"
                    ? "Save Assessment"
                    : "Save Material"}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
