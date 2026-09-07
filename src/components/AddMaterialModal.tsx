import { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  FileText,
  ListChecks,
  Link2,
  Star,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  strandCategories,
  gradeLevels,
  type ContentItem,
  type StrandCategory,
  type MemoryVerse,
  type RevisionQuestion,
} from "@/data/cbcStudyContent";
import { useAuth } from "@/context/AuthContext";

const LS_KEY = "custom_study_materials";

export type ContentType = "notes" | "memory_verse" | "practice_questions" | "pdf_link";

export interface NewMaterialForm {
  title: string;
  strand: StrandCategory | "";
  grade: number | "";
  subStrand: string;
  contentType: ContentType;
  body: string;
}

const CONTENT_TYPES: { value: ContentType; label: string; icon: React.ReactNode }[] = [
  { value: "notes", label: "Notes / Summary", icon: <BookOpen size={14} /> },
  { value: "memory_verse", label: "Memory Verse", icon: <Star size={14} /> },
  { value: "practice_questions", label: "Practice Questions", icon: <ListChecks size={14} /> },
  { value: "pdf_link", label: "Resource PDF Link", icon: <Link2 size={14} /> },
];

export function loadCustomMaterials(): ContentItem[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveCustomMaterial(item: ContentItem): void {
  const existing = loadCustomMaterials();
  localStorage.setItem(LS_KEY, JSON.stringify([item, ...existing]));
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
}

export default function AddMaterialModal({ onClose, onSave }: AddMaterialModalProps) {
  const { user } = useAuth();
  const isAdminOrTeacher =
    user?.role === "admin" || user?.role === "head_teacher" || user?.role === "teacher";

  const [form, setForm] = useState<NewMaterialForm>({
    title: "",
    strand: "",
    grade: "",
    subStrand: "",
    contentType: "notes",
    body: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof NewMaterialForm, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const validate = (): boolean => {
    const next: Partial<Record<keyof NewMaterialForm, string>> = {};
    if (!form.title.trim()) next.title = "Title is required";
    if (!form.strand) next.strand = "Please select a Learning Area";
    if (!form.grade) next.grade = "Please select a Grade Level";
    if (!form.body.trim()) next.body = "Body / Lesson Notes are required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);

    const gradeNum = form.grade as number;
    const timestamp = Date.now();
    const id = `custom-${slugify(form.title)}-${timestamp}`;

    // Determine difficulty from grade
    const difficulty: ContentItem["difficulty"] =
      gradeNum <= 3 ? "beginner" : gradeNum <= 6 ? "intermediate" : "advanced";

    // Parse body based on content type
    let notes: string[] = [];
    let memoryVerses: MemoryVerse[] | undefined;
    let revisionQuestions: RevisionQuestion[] | undefined;

    switch (form.contentType) {
      case "notes":
        // Split by newlines into bullet notes
        notes = form.body
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        break;

      case "memory_verse": {
        // Format: "Reference | Verse text" per line
        memoryVerses = form.body
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0)
          .map((l) => {
            const parts = l.split("|").map((p) => p.trim());
            return {
              reference: parts[0] || "Scripture",
              text: parts.slice(1).join(" | ") || parts[0] || "",
            };
          });
        break;
      }

      case "practice_questions": {
        // Format: "Question | Answer | Rubric(optional)" per line
        revisionQuestions = form.body
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0)
          .map((l) => {
            const parts = l.split("|").map((p) => p.trim());
            return {
              question: parts[0] || "",
              answer: parts[1] || "",
              rubric: parts[2] || undefined,
            };
          });
        break;
      }

      case "pdf_link":
        // Treat body as a URL or descriptive note
        notes = [form.body.trim()];
        break;
    }

    const item: ContentItem = {
      id,
      grade: gradeNum,
      strand: form.strand as StrandCategory,
      subStrand: form.subStrand.trim() || (form.strand as StrandCategory),
      topic: form.title.trim(),
      summary: form.body.trim().substring(0, 200),
      notes,
      memoryVerses,
      revisionQuestions,
      difficulty,
      tags: [
        form.strand as StrandCategory,
        `Grade ${gradeNum}`,
        form.contentType,
        "custom",
      ],
    };

    saveCustomMaterial(item);
    setIsSaving(false);
    setSaved(true);
    onSave(item);

    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-indigo-600 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/20">
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add Study Material</h2>
              <p className="text-xs text-indigo-200">
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
                </label>
                <select
                  value={form.strand}
                  onChange={(e) => set("strand", e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                    errors.strand ? "border-red-400 bg-red-50" : "border-gray-200"
                  }`}
                >
                  <option value="">Select subject…</option>
                  {strandCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
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
                  <option value="">Select grade…</option>
                  {gradeLevels.map((g) => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
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
              </p>
            </div>

            {/* Body / Lesson Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Body / Lesson Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
                placeholder={
                  form.contentType === "memory_verse"
                    ? "Genesis 1:1 | In the beginning God created the heavens and the earth.\nJohn 3:16 | For God so loved the world…"
                    : form.contentType === "practice_questions"
                    ? "What is photosynthesis? | Photosynthesis is the process by which plants make food using sunlight. | 3 marks\nWho discovered penicillin? | Alexander Fleming discovered penicillin in 1928. | 2 marks"
                    : form.contentType === "pdf_link"
                    ? "https://example.com/grade-4-science-notes.pdf\nOr enter a brief description of the PDF resource…"
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
              className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-5 py-2.5 text-sm shadow-sm"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  Save Material
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
