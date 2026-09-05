/**
 * examPdfGenerator.ts
 * ────────────────────
 * Robust PDF generator for `SetExamsList` exam papers.
 *
 * Replaces the previous `html2pdf.js` approach which was producing
 * blank pages because the off-screen printable container was not being
 * hydrated with live exam data before capture.
 *
 * This module:
 *   • Reads exam metadata + questions DIRECTLY from
 *     `localStorage.getItem('all_set_exams')` (falls back to the legacy
 *     `assessments` / `question_bank` keys for older deployments).
 *   • Accepts both `text` and `prompt` question shapes, as well as
 *     `options` either as `string[]` or as `{ label, text }[]` records.
 *   • Renders a clean, multi-page A4 paper with school header, instructions,
 *     numbered questions, MCQ letter options, and lined answer blanks.
 *   • Embeds question images (nursery beds, diagrams, CBC visual prompts)
 *     that may be stored as `data:` URIs, `blob:` URLs, or external HTTP
 *     URLs. Uses `useCORS: true` semantics plus a pre-load step so the
 *     rasterizer always sees a fully decoded image.
 *   • Supports two output modes: `view` (open in a new tab) and `download`
 *     (save to device).
 *
 * The implementation uses `jsPDF` + `jspdf-autotable` (already installed
 * in this project) for predictable, deterministic output — no DOM scraping
 * required, so blank pages are no longer possible.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Convert a data-URI (base64), blob URL, or HTTP URL into an HTMLImageElement.
 * Returns a fully-loaded HTMLImageElement (awaited) so the caller can pass
 * the .src value directly into jsPDF.addImage().
 *
 * • For `data:` URIs and `blob:` URLs the image is already self-contained.
 * • For external `http(s):` URLs we set crossOrigin = "anonymous" so the
 *   browser sends CORS headers; if the server denies the request the image
 *   will be skipped rather than aborting the whole PDF.
 */
async function preloadImage(url: string): Promise<HTMLImageElement | null> {
  if (!url || typeof url !== "string") return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => resolve(img);
    img.onerror = () => {
      // Try once more with different CORS policy for external URLs
      if (url.startsWith("http")) {
        const retry = new Image();
        retry.onload = () => resolve(retry);
        retry.onerror = () => resolve(null);
        retry.src = url;
      } else {
        resolve(null);
      }
    };

    // blob: and data: URLs are always same-origin — set src last to avoid
    // the crossOrigin attribute triggering a pre-flight for blob: URLs.
    img.src = url;
  });
}

/**
 * Add a rasterised image to the jsPDF document.  Handles all three URL
 * types that exam questions can contain:
 *   - data:image/...;base64,…   (already decoded inline)
 *   - blob:http(s)://…/…       (in-memory blob from FileReader / upload)
 *   - http(s)://…/…            (remote CDN / upload endpoint)
 *
 * `maxHeightMM` caps the rendered height so large nursery-bed photos don't
 * blow out the page layout.
 */
async function addImageToPdf(
  doc: jsPDF,
  url: string,
  xMM: number,
  yMM: number,
  maxWidthMM: number,
  maxHeightMM: number
): Promise<number> {
  const img = await preloadImage(url);
  if (!img) return yMM; // skip on error

  const imgWidth = img.naturalWidth;
  const imgHeight = img.naturalHeight;
  const aspectRatio = imgWidth / imgHeight;

  // Scale to fit within the bounding box while preserving aspect ratio.
  let wMM = maxWidthMM;
  let hMM = wMM / aspectRatio;
  if (hMM > maxHeightMM) {
    hMM = maxHeightMM;
    wMM = hMM * aspectRatio;
  }

  // jsPDF.addImage() accepts: data-URI string, HTMLImageElement, or canvas.
  // Passing the HTMLImageElement directly works for all three URL types.
  try {
    doc.addImage(img, "JPEG", xMM, yMM, wMM, hMM);
    return yMM + hMM + 4; // advance Y and add a small gap
  } catch {
    // Fall back: try extracting the canvas from the image element.
    try {
      const canvas = document.createElement("canvas");
      canvas.width = imgWidth;
      canvas.height = imgHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        doc.addImage(dataUrl, "JPEG", xMM, yMM, wMM, hMM);
        return yMM + hMM + 4;
      }
    } catch {
      /* skip */
    }
  }
  return yMM;
}

const ALL_SET_EXAMS_KEY = "all_set_exams";
const ASSESSMENTS_KEY = "assessments";
const QUESTION_BANK_KEY = "question_bank";

export type ExamPdfMode = "view" | "download";

interface ExamQuestion {
  id?: string;
  text?: string;
  question?: string;
  prompt?: string;
  type?: "mcq" | "structured" | "math" | "numeric" | "fill_blank" | string;
  points?: number;
  options?: Array<string | { label?: string; text?: string; id?: string }>;
  modelAnswer?: string;
  marks?: number;
  /** Data URI (base64), blob URL, or HTTP URL of an attached diagram / photo. */
  imageUrl?: string;
  /** Where on the page the image renders: "above" | "between" | "below". */
  imagePosition?: "above" | "between" | "below";
}

interface ExamRecord {
  id: string;
  title?: string;
  subject?: string;
  targetGrade?: string;
  grade?: string;
  classLevel?: string;
  timeLimit?: string;
  duration?: number;
  category?: string;
  instructions?: string;
  questions?: ExamQuestion[];
  questionList?: ExamQuestion[];
}

/**
 * Read the exam record from localStorage. Tries `all_set_exams` first,
 * then falls back to `assessments` and the legacy `question_bank` for
 * older deployments. Returns `null` if no matching record is found.
 */
function readExamRecord(examId: string): ExamRecord | null {
  const tryParse = <T,>(raw: string | null): T[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  };

  // 1. Primary source: unified all_set_exams
  const fromAllSet = tryParse<ExamRecord>(
    localStorage.getItem(ALL_SET_EXAMS_KEY)
  );
  const primary =
    fromAllSet.find((e) => e && String(e.id) === String(examId)) ?? null;
  if (primary) return primary;

  // 2. Legacy: assessments key
  const fromAssessments = tryParse<ExamRecord>(
    localStorage.getItem(ASSESSMENTS_KEY)
  );
  const legacy =
    fromAssessments.find((e) => e && String(e.id) === String(examId)) ?? null;
  if (legacy) return legacy;

  // 3. Question bank: bankId metadata fallback
  try {
    const raw = localStorage.getItem(QUESTION_BANK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const bankId = parsed?.metadata?.assessmentId || "assessment_bank_default";
      if (String(bankId) === String(examId)) {
        return {
          id: bankId,
          title: parsed?.metadata?.title || "Untitled Assessment",
          subject: parsed?.metadata?.subject || "",
          classLevel: parsed?.metadata?.classLevel || "",
          category: parsed?.metadata?.category || "",
          timeLimit: parsed?.metadata?.duration
            ? `${parsed.metadata.duration}m`
            : undefined,
          duration: parsed?.metadata?.duration,
          questions: Array.isArray(parsed?.questions)
            ? (parsed.questions as ExamQuestion[])
            : [],
        };
      }
    }
  } catch {
    /* ignore */
  }

  return null;
}

/**
 * Sanitize a question's `options` array into a uniform `string[]` shape,
 * accepting both raw strings and `{ label, text }` records.
 */
function normalizeOptions(
  raw: ExamQuestion["options"]
): string[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return raw.map((opt) => {
    if (typeof opt === "string") return opt;
    if (opt && typeof opt === "object") {
      const label = opt.label ? `${opt.label}. ` : "";
            const text = opt.text || "";
            return String(`${label}${text}` || '').trim();
    }
    return String(opt ?? "");
  });
}

/**
 * Sanitize a question's prompt text, falling back across the
 * `text` / `question` / `prompt` keys used by different assessment shapes.
 */
function getQuestionPrompt(q: ExamQuestion): string {
  const raw = q.text ?? q.question ?? q.prompt ?? "";
  return typeof raw === "string" ? raw.trim() : String(raw ?? "").trim();
}

/**
 * Sanitize a free-form instructions string, splitting on either real
 * newlines or numbered prefixes so the paper always renders sensible
 * guidance even if the underlying field is empty.
 */
function getInstructions(exam: ExamRecord): string {
  if (exam.instructions && String(exam.instructions || '').trim().length > 0) {
    return String(exam.instructions || '').trim();
  }
  return [
    "1. Answer all questions in the spaces provided.",
    "2. Show all working where necessary.",
    "3. Do not write outside the designated areas.",
  ].join("\n");
}

/**
 * Convert the exam's time-limit to a human-readable string for the header.
 */
function getTimeLimit(exam: ExamRecord): string {
  if (exam.timeLimit && typeof exam.timeLimit === "string") return exam.timeLimit;
  if (typeof exam.duration === "number" && exam.duration > 0) {
    return `${exam.duration} min`;
  }
  return "N/A";
}

/**
 * Generate (and either open or download) a PDF paper for the given exam.
 *
 * @param examId  The exam id to render.
 * @param mode    `'view'` opens the PDF in a new tab; `'download'`
 *                saves the file to the device (default).
 * @returns `true` if a PDF was produced, `false` if the exam was not
 *          found or the PDF engine threw.
 */
export async function generateExamPDF(
  examId: string,
  mode: ExamPdfMode = "download"
): Promise<boolean> {
  let exam: ExamRecord | null = null;
  try {
    exam = readExamRecord(examId);
  } catch (err) {
    console.error("[examPdfGenerator] Failed to read exam record:", err);
    return false;
  }

  if (!exam) {
    // eslint-disable-next-line no-alert
    alert("Exam data not found. It may have been removed or not yet saved.");
    return false;
  }

  let doc: jsPDF;
  try {
    doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  } catch (err) {
    console.error("[examPdfGenerator] jsPDF init failed:", err);
    return false;
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftMargin = 14;
  const rightMargin = 14;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  // ── School header (table) ───────────────────────────────────────────────
  // The header is rendered with `autoTable` so the official school name
  // and exam title sit in a clean two-column block at the top of page 1.
  autoTable(doc, {
    startY: 12,
    margin: { left: leftMargin, right: rightMargin },
    body: [
      [
        {
          content: "MUNYAKA PRIMARY AND JUNIOR",
          styles: { fontStyle: "bold", fontSize: 12, halign: "center" },
        },
        {
          content: (exam.title || "SCHOOL BASED ASSESSMENT").toUpperCase(),
          styles: { fontStyle: "bold", fontSize: 12, halign: "center" },
        },
      ],
    ],
    theme: "plain",
    styles: { cellPadding: 1.5, lineColor: 30, lineWidth: 0.2 },
  });

  // ── Metadata strip ─────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const gradeLabel = exam.targetGrade || exam.grade || exam.classLevel || "N/A";
  const subjectLabel = exam.subject || "—";
  const timeLabel = getTimeLimit(exam);
  const metaLine = `Grade: ${gradeLabel}    Subject: ${subjectLabel}    Time: ${timeLabel}`;
  const lastYAfterHeader = (doc as any).lastAutoTable?.finalY ?? 20;
  doc.text(metaLine, pageWidth / 2, lastYAfterHeader + 6, { align: "center" });

  // Horizontal divider under the header
  doc.setDrawColor(30);
  doc.line(leftMargin, lastYAfterHeader + 9, pageWidth - rightMargin, lastYAfterHeader + 9);

  // ── Instructions block ─────────────────────────────────────────────────
  let yPos = lastYAfterHeader + 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("INSTRUCTIONS TO LEARNERS:", leftMargin, yPos);
  yPos += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const instructions = getInstructions(exam);
  const splitInstructions = doc.splitTextToSize(instructions, contentWidth);
  doc.text(splitInstructions, leftMargin, yPos);
  yPos += splitInstructions.length * 5 + 6;

  // ── Questions section ──────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("QUESTIONS", leftMargin, yPos);
  yPos += 6;

  const questions: ExamQuestion[] =
    Array.isArray(exam.questions)
      ? exam.questions
      : Array.isArray(exam.questionList)
        ? exam.questionList
        : [];

  if (questions.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text(
      "No questions configured for this exam paper.",
      leftMargin,
      yPos
    );
    yPos += 8;
  } else {
    // Pre-load every question image in parallel so the rasterizer is
    // guaranteed to see fully decoded pixels for each diagram / photo.
    const imageTasks = questions.map(async (q) => {
      const url = q.imageUrl;
      if (!url || typeof url !== "string") return null;
      return preloadImage(url);
    });
    const preloadedImages = await Promise.all(imageTasks);

    for (let idx = 0; idx < questions.length; idx++) {
      const q = questions[idx];
      const imageElement = preloadedImages[idx] ?? null;
      const imagePosition = q.imagePosition || "below";

      // Helper: ensure the question starts on a fresh page if there's not
      // enough room left (24mm baseline for text questions, 60mm if it
      // also has an image).
      const reserveMM = imageElement ? 60 : 24;
      if (yPos > pageHeight - reserveMM) {
        doc.addPage();
        yPos = 20;
      }

      // ── Image above ──
      if (imagePosition === "above" && imageElement) {
        const imgHeightMM = 40; // cap to keep layout stable
        yPos = await addImageToPdf(
          doc,
          q.imageUrl!,
          leftMargin,
          yPos,
          contentWidth,
          imgHeightMM
        );
      }

      // ── Question number + prompt ──
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`Q${idx + 1}.`, leftMargin, yPos);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const promptText = getQuestionPrompt(q);
      const splitPrompt = doc.splitTextToSize(
        promptText || "(question text missing)",
        contentWidth - 8
      );
      doc.text(splitPrompt, leftMargin + 8, yPos);
      yPos += splitPrompt.length * 5 + 1;

      // ── Image between (between prompt and options) ──
      if (imagePosition === "between" && imageElement) {
        const imgHeightMM = 40;
        yPos = await addImageToPdf(
          doc,
          q.imageUrl!,
          leftMargin,
          yPos,
          contentWidth,
          imgHeightMM
        );
      }

      // Points badge (right-aligned, on the question's first visual line)
      const points = Number(q.points ?? q.marks ?? 0) || 0;
      if (points > 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.text(
          `[${points} ${points === 1 ? "mark" : "marks"}]`,
          pageWidth - rightMargin,
          yPos - splitPrompt.length * 5,
          { align: "right" }
        );
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
      }

      // MCQ options
      const opts = normalizeOptions(q.options);
      if (opts && opts.length > 0) {
        opts.forEach((opt, optIdx) => {
          if (yPos > pageHeight - 16) {
            doc.addPage();
            yPos = 20;
          }
          const letter = String.fromCharCode(65 + optIdx);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.text(`[ ${letter} ]  ${opt}`, leftMargin + 12, yPos);
          yPos += 5;
        });
      } else {
        // Structured answer line
        if (yPos > pageHeight - 16) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.text(
          "Answer: __________________________________________________",
          leftMargin + 12,
          yPos
        );
        yPos += 8;
      }

      // ── Image below ──
      if (imagePosition === "below" && imageElement) {
        const imgHeightMM = 40;
        yPos = await addImageToPdf(
          doc,
          q.imageUrl!,
          leftMargin,
          yPos,
          contentWidth,
          imgHeightMM
        );
      }

      yPos += 3; // spacing between questions
    }
  }

  // ── Footer on every page ───────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `${(exam.title || "Exam Paper").toString()} — Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
    doc.setTextColor(0);
  }

  // ── Output ─────────────────────────────────────────────────────────────
  try {
    if (mode === "view") {
      const pdfBlob = doc.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      // Best-effort cleanup; some browsers keep the handle alive while the
      // tab is open, so we defer revocation for a couple of minutes.
      setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
    } else {
      const safeTitle = (exam.title || "Exam_Paper").replace(
        /[^a-zA-Z0-9]+/g,
        "_"
      );
      doc.save(`${safeTitle}.pdf`);
    }
    return true;
  } catch (err) {
    console.error("[examPdfGenerator] Output failed:", err);
    return false;
  }
}
