/**
 * Assessment / study material export helper for Study Corner.
 *
 * Produces a printable, self-contained HTML document for each study material
 * and triggers a download that works on:
 *   - Standard web browsers (Blob + <a download>)
 *   - Capacitor Android / iOS native shells (via `downloadFile` from
 *     `fileDownloader.ts` — which writes to the Documents directory on iOS
 *     and to the public Downloads folder on Android)
 *   - Legacy / restricted environments (fallback: `window.print()`)
 *
 * If `jspdf` is installed at runtime, the HTML can be auto-printed to PDF
 * via the browser's native print dialog (user picks "Save as PDF"). We
 * deliberately avoid hard-bundling `jspdf` here to keep the build slim;
 * the printable HTML is high-quality on its own and most users will
 * choose "Save as PDF" from their browser's print dialog anyway.
 *
 * Document layout:
 *   - Header block: school name, grade, subject, strand, sub-strand.
 *   - Body: instructions, key notes, memory verses, revision questions
 *     (with answer lines / rubric space).
 *   - Footer: generation timestamp and "Offline CBC Study Resource".
 */

import type { ContentItem } from "@/data/cbcStudyContent";

export const SCHOOL_NAME = "Munyaka Primary and Junior School";
export const SCHOOL_BRANCH_LINE = "P.O. BOX 5239, ELDORET";
export const SCHOOL_MOTTO = "Knowledge Is Power";

export type ExportFormat = "html" | "txt" | "print";

export interface ExportAssessmentOptions {
  /** The material to export. */
  item: ContentItem;
  /** Force a specific format. If omitted, the format is auto-detected. */
  format?: ExportFormat;
  /** Override the default filename (without extension). */
  filename?: string;
  /** Optional toast message for the pending state. */
  pendingMessage?: string;
  /** Optional toast message for the success state. */
  successMessage?: string;
}

export interface ExportAssessmentResult {
  success: boolean;
  format: ExportFormat;
  filename: string;
  /** True if the user was shown the print dialog (and we didn't auto-save). */
  printOnly?: boolean;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Escape user-supplied text before inlining into HTML. */
function escapeHtml(input: string): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitiseFilenamePart(input: string | undefined | null): string {
  if (!input) return "Unknown";
  return input
    .replace(/[^a-zA-Z0-9_\- ]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 60) || "Unknown";
}

/** Capitalise the first letter of a string (used for the Subject/Strand labels). */
function capitalise(input: string): string {
  if (!input) return "";
  return input.charAt(0).toUpperCase() + input.slice(1);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatTimestamp(d: Date = new Date()): string {
  return (
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ` +
    `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  );
}

// ─── Document builders ───────────────────────────────────────────────────────

/**
 * Build the printable HTML document for a single material.
 * Exposed for callers that want to embed the document in an iframe
 * before triggering the print dialog.
 */
export function buildAssessmentHtml(item: ContentItem): string {
  const subject = capitalise(item.strand);
  const subStrand = item.subStrand?.trim() || item.strand;
  const timestamp = formatTimestamp();

  const notesArr = Array.isArray(item.notes) ? item.notes : (item.notes ? [item.notes] : []);
  const notesList = notesArr
    .map((n) => `<li>${escapeHtml(n)}</li>`)
    .join("\n");

  const verses = (item.memoryVerses ?? [])
    .map(
      (v) => `
        <div class="verse">
          <p class="verse-ref">${escapeHtml(v.reference)}</p>
          <p class="verse-text">"${escapeHtml(v.text)}"</p>
        </div>`
    )
    .join("\n");

  const questions = (item.revisionQuestions ?? [])
    .map(
      (rq, i) => `
        <div class="question">
          <p class="q-text"><strong>Q${i + 1}.</strong> ${escapeHtml(rq.question)}</p>
          ${rq.rubric ? `<p class="q-rubric">[${escapeHtml(rq.rubric)}]</p>` : ""}
          <div class="q-answer-space"></div>
          <details class="q-answer">
            <summary>Show Answer</summary>
            <p>${escapeHtml(rq.answer)}</p>
          </details>
        </div>`
    )
    .join("\n");

  const tags = (item.tags ?? [])
    .map((t) => `<span class="tag">#${escapeHtml(t)}</span>`)
    .join(" ");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(item.topic)} — Grade ${item.grade} ${escapeHtml(subject)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    color: #1a1a1a;
    background: #ffffff;
    margin: 0;
    padding: 32px;
    line-height: 1.55;
  }
  .sheet {
    max-width: 780px;
    margin: 0 auto;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 36px 40px;
    background: #ffffff;
  }
  .header {
    border-bottom: 2px solid #4f46e5;
    padding-bottom: 18px;
    margin-bottom: 24px;
  }
  .school-name {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 0.4px;
    color: #1e1b4b;
    margin: 0 0 4px 0;
  }
  .school-line {
    font-size: 11px;
    color: #6b7280;
    margin: 0;
  }
  .meta {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px 24px;
    margin-top: 14px;
    font-size: 13px;
  }
  .meta dt { color: #6b7280; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.6px; }
  .meta dd { margin: 0 0 4px 0; color: #111827; font-weight: 600; }
  .title {
    font-size: 24px;
    font-weight: 800;
    color: #111827;
    margin: 24px 0 6px 0;
  }
  .summary {
    color: #374151;
    font-size: 14px;
    margin: 0 0 18px 0;
  }
  .instructions {
    background: #eef2ff;
    border-left: 4px solid #4f46e5;
    padding: 12px 14px;
    border-radius: 6px;
    color: #1e1b4b;
    font-size: 13px;
    margin-bottom: 20px;
  }
  h2 {
    font-size: 15px;
    color: #1e1b4b;
    margin: 22px 0 10px 0;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 4px;
  }
  ul.notes { padding-left: 22px; margin: 8px 0; }
  ul.notes li { margin: 4px 0; font-size: 13.5px; }
  .verse {
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: 8px;
    padding: 8px 12px;
    margin: 8px 0;
  }
  .verse-ref { font-size: 12px; font-weight: 700; color: #92400e; margin: 0 0 2px 0; }
  .verse-text { font-size: 13.5px; font-style: italic; color: #78350f; margin: 0; }
  .question {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px 14px;
    margin: 10px 0;
  }
  .q-text { font-size: 13.5px; margin: 0 0 2px 0; }
  .q-rubric { font-size: 11px; color: #6b7280; margin: 0 0 6px 0; }
  .q-answer-space {
    border: 1px dashed #cbd5e1;
    height: 60px;
    border-radius: 4px;
    margin: 6px 0;
    background: repeating-linear-gradient(
      to bottom,
      #ffffff,
      #ffffff 23px,
      #f1f5f9 23px,
      #f1f5f9 24px
    );
  }
  details.q-answer summary {
    cursor: pointer;
    font-size: 12px;
    color: #4f46e5;
    font-weight: 600;
  }
  details.q-answer p { font-size: 13px; color: #065f46; margin: 6px 0 0 0; }
  .tags { margin-top: 18px; }
  .tag {
    display: inline-block;
    background: #f1f5f9;
    color: #475569;
    border-radius: 999px;
    padding: 2px 10px;
    font-size: 11px;
    margin: 2px 4px 2px 0;
  }
  .footer {
    margin-top: 32px;
    padding-top: 14px;
    border-top: 1px solid #e5e7eb;
    color: #6b7280;
    font-size: 11px;
    text-align: center;
  }
  @media print {
    body { padding: 0; background: #ffffff; }
    .sheet { border: 0; padding: 0; max-width: none; }
    details.q-answer { display: none; }
    @page { margin: 18mm; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <header class="header">
      <h1 class="school-name">${escapeHtml(SCHOOL_NAME)}</h1>
      <p class="school-line">${escapeHtml(SCHOOL_BRANCH_LINE)}</p>
      <p class="school-line"><em>Motto: ${escapeHtml(SCHOOL_MOTTO)}</em></p>
      <dl class="meta">
        <div><dt>Grade</dt><dd>Grade ${item.grade}</dd></div>
        <div><dt>Subject / Learning Area</dt><dd>${escapeHtml(subject)}</dd></div>
        <div><dt>Strand</dt><dd>${escapeHtml(item.strand)}</dd></div>
        <div><dt>Sub-Strand</dt><dd>${escapeHtml(subStrand)}</dd></div>
      </dl>
    </header>

    <h1 class="title">${escapeHtml(item.topic)}</h1>
    <p class="summary">${escapeHtml(item.summary)}</p>

    <div class="instructions">
      <strong>Instructions:</strong> Read the notes and verses below carefully.
      Answer the revision questions in the space provided, then reveal the
      suggested answers to self-mark. This is an offline CBC study resource.
    </div>

    ${
      notesList
        ? `<h2>Key Learning Notes</h2><ul class="notes">${notesList}</ul>`
        : ""
    }

    ${
      verses
        ? `<h2>Memory Verses</h2>${verses}`
        : ""
    }

    ${
      questions
        ? `<h2>Revision Questions</h2>${questions}`
        : ""
    }

    ${
      tags
        ? `<div class="tags"><strong style="font-size:12px;color:#475569;">Tags:</strong> ${tags}</div>`
        : ""
    }

    <footer class="footer">
      <div>Generated: ${escapeHtml(timestamp)}</div>
      <div>Offline CBC Study Resource · ${escapeHtml(SCHOOL_NAME)}</div>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Plain-text export fallback (used when HTML printing is impossible —
 * e.g. some native WebView versions, or when the user prefers text).
 */
export function buildAssessmentText(item: ContentItem): string {
  const subject = capitalise(item.strand);
  const subStrand = item.subStrand?.trim() || item.strand;
  const lines: string[] = [];

  lines.push("=".repeat(72));
  lines.push(SCHOOL_NAME.toUpperCase());
  lines.push(SCHOOL_BRANCH_LINE);
  lines.push(`Motto: ${SCHOOL_MOTTO}`);
  lines.push("=".repeat(72));
  lines.push("");
  lines.push(`Grade:            Grade ${item.grade}`);
  lines.push(`Subject:          ${subject}`);
  lines.push(`Strand:           ${item.strand}`);
  lines.push(`Sub-Strand:       ${subStrand}`);
  lines.push(`Difficulty:       ${item.difficulty}`);
  lines.push("");
  lines.push(`Title: ${item.topic}`);
  lines.push(`Summary: ${item.summary}`);
  lines.push("");
  lines.push("-".repeat(72));
  lines.push("INSTRUCTIONS");
  lines.push("-".repeat(72));
  lines.push(
    "Read the notes and memory verses below carefully. Answer the revision"
  );
  lines.push(
    "questions in the space provided, then check your work against the"
  );
  lines.push("suggested answers. This is an offline CBC study resource.");
  lines.push("");

  const notesArr = Array.isArray(item.notes) ? item.notes : (item.notes ? [item.notes] : []);
  if (notesArr.length) {
    lines.push("-".repeat(72));
    lines.push("KEY LEARNING NOTES");
    lines.push("-".repeat(72));
    notesArr.forEach((n, i) => lines.push(`  ${i + 1}. ${n}`));
    lines.push("");
  }

  if (item.memoryVerses?.length) {
    lines.push("-".repeat(72));
    lines.push("MEMORY VERSES");
    lines.push("-".repeat(72));
    item.memoryVerses.forEach((v) => {
      lines.push(`  ${v.reference}`);
      lines.push(`    "${v.text}"`);
      lines.push("");
    });
  }

  if (item.revisionQuestions?.length) {
    lines.push("-".repeat(72));
    lines.push("REVISION QUESTIONS");
    lines.push("-".repeat(72));
    item.revisionQuestions.forEach((q, i) => {
      lines.push(`Q${i + 1}. ${q.question}`);
      if (q.rubric) lines.push(`    [${q.rubric}]`);
      lines.push("    Answer: ____________________________");
      lines.push("            ____________________________");
      lines.push("            ____________________________");
      lines.push(`    Suggested: ${q.answer}`);
      lines.push("");
    });
  }

  if (item.tags?.length) {
    lines.push("-".repeat(72));
    lines.push("TAGS");
    lines.push("-".repeat(72));
    lines.push(item.tags.map((t) => `#${t}`).join("  "));
    lines.push("");
  }

  lines.push("=".repeat(72));
  lines.push(`Generated: ${formatTimestamp()}`);
  lines.push(`Offline CBC Study Resource · ${SCHOOL_NAME}`);
  lines.push("=".repeat(72));

  return lines.join("\n");
}

export function buildAssessmentFilename(
  item: ContentItem,
  extension: "html" | "txt"
): string {
  const gradePart = `Grade_${item.grade}`;
  const strandPart = sanitiseFilenamePart(item.strand);
  const topicPart = sanitiseFilenamePart(item.topic);
  return `StudyCorner_${gradePart}_${strandPart}_${topicPart}.${extension}`;
}

// ─── Browser print fallback ──────────────────────────────────────────────────

/**
 * Open a print dialog so the user can choose "Save as PDF" (or actually
 * print on a physical printer). This is the most universally supported
 * way to generate a PDF without bundling a library.
 */
function openPrintDialog(html: string, title: string): void {
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) {
    // Pop-up blocked — fall back to injecting an iframe and calling print.
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const iframeWin = iframe.contentWindow;
    const doc = iframeWin?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    iframeWin?.focus();
    setTimeout(() => {
      try {
        iframeWin?.print();
      } catch {
        /* noop */
      }
      setTimeout(() => document.body.removeChild(iframe), 1500);
    }, 250);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.document.title = title;
  win.focus();
  setTimeout(() => {
    try {
      win.print();
    } catch {
      /* noop */
    }
  }, 300);
}

// ─── Native / Capacitor path ─────────────────────────────────────────────────

/**
 * We deliberately route native downloads through the existing
 * `downloadFile` helper so the resulting .html file lands in the system
 * Downloads folder on Android, the Documents directory on iOS, and the
 * user is offered a Share dialog (just like PDFs and CSVs).
 */
async function triggerNativeDownload(
  filename: string,
  data: string,
  mimeType: string
): Promise<void> {
  const { downloadFile } = await import("@/utils/fileDownloader");
  await downloadFile({
    filename,
    data,
    mimeType,
    fileType: "txt", // re-use TXT path which writes to Documents + Share on native
    successMessage: `Saved ${filename}`,
    pendingMessage: `Saving ${filename}…`,
  });
}

// ─── Web / browser path ──────────────────────────────────────────────────────

function triggerWebDownload(
  filename: string,
  data: string,
  mimeType: string
): void {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// ─── Auto-detection ───────────────────────────────────────────────────────────

async function isNativeShell(): Promise<boolean> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

// ─── Public entry points ─────────────────────────────────────────────────────

/**
 * Export a single study material.
 */
export async function exportAssessment(
  options: ExportAssessmentOptions
): Promise<ExportAssessmentResult> {
  const { item, filename, format } = options;
  const wantHtml = format === "html";
  const wantTxt = format === "txt";
  const wantPrint = format === "print";

  try {
    // ── Print path: open a print dialog so the user can "Save as PDF" ──
    if (wantPrint) {
      const html = buildAssessmentHtml(item);
      const title = `${item.topic} — Grade ${item.grade}`;
      openPrintDialog(html, title);
      return {
        success: true,
        format: "print",
        filename: filename ?? buildAssessmentFilename(item, "html"),
        printOnly: true,
      };
    }

    // ── Plain-text path: deliver as .txt via native Share / web download ──
    if (wantTxt) {
      const text = buildAssessmentText(item);
      const fname =
        filename ?? buildAssessmentFilename(item, "txt");
      if (await isNativeShell()) {
        await triggerNativeDownload(fname, text, "text/plain;charset=utf-8");
      } else {
        triggerWebDownload(fname, text, "text/plain;charset=utf-8");
      }
      return { success: true, format: "txt", filename: fname };
    }

    // ── Default: HTML path ──
    const html = buildAssessmentHtml(item);
    const fname =
      filename ?? buildAssessmentFilename(item, "html");

    if (await isNativeShell()) {
      // Native shells get the HTML file written + shared.
      await triggerNativeDownload(fname, html, "text/html;charset=utf-8");
    } else {
      triggerWebDownload(fname, html, "text/html;charset=utf-8");
    }

    return { success: true, format: "html", filename: fname };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown export error";
    console.error("[exportAssessment] failed:", err);
    return {
      success: false,
      format: wantTxt ? "txt" : wantPrint ? "print" : "html",
      filename: filename ?? "",
      error: message,
    };
  }
}

/**
 * Print a single material using the browser's native print dialog.
 * Convenience wrapper used by the reader modal "Print" button.
 */
export function printAssessment(item: ContentItem): void {
  const html = buildAssessmentHtml(item);
  const title = `${item.topic} — Grade ${item.grade}`;
  openPrintDialog(html, title);
}

// ─── Bulk export for "Download All for Grade" ────────────────────────────────

export interface BulkExportOptions {
  items: ContentItem[];
  grade: number;
  subject?: string;
  /** HTML or text — defaults to HTML. */
  format?: "html" | "txt";
}

export interface BulkExportResult {
  success: boolean;
  filename: string;
  itemCount: number;
  error?: string;
}

export function buildBulkFilename(
  grade: number,
  subject: string | undefined,
  extension: "html" | "txt"
): string {
  const subj = subject ? sanitiseFilenamePart(subject) : "All_Subjects";
  return `StudyCorner_Grade_${grade}_${subj}_Bundle.${extension}`;
}

/**
 * Build a single combined HTML / text document containing every supplied
 * material, separated by a page break. This is what "Download All for
 * Grade" delivers.
 */
export function buildBulkAssessmentHtml(
  items: ContentItem[],
  grade: number
): string {
  const subjectLine = items.length
    ? Array.from(new Set(items.map((i) => i.strand))).join(" · ")
    : "All Subjects";
  const timestamp = formatTimestamp();

  const body = items
    .map((item, i) => {
      const inner = buildAssessmentHtml(item);
      // Strip the outer <html><head>…</head><body>…</body></html> wrapper
      // so we can stitch multiple documents together.
      const match = inner.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const innerBody = match ? match[1] : inner;
      const pageBreak =
        i < items.length - 1
          ? '<div style="page-break-after: always;"></div>'
          : "";
      return `${innerBody}\n${pageBreak}`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Study Corner · Grade ${grade} Bundle</title>
<style>
  body { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; background:#fff; margin:0; padding:24px; color:#1a1a1a; }
  .bundle-header { max-width: 780px; margin: 0 auto 24px auto; padding: 18px 24px; border: 1px solid #e5e7eb; border-radius: 14px; background: #eef2ff; }
  .bundle-header h1 { margin: 0 0 4px 0; color: #1e1b4b; font-size: 20px; }
  .bundle-header p { margin: 2px 0; color: #4338ca; font-size: 13px; }
  .sheet { max-width: 780px; margin: 0 auto; }
  @media print { body { padding: 0; } .bundle-header { display: none; } @page { margin: 16mm; } }
</style>
</head>
<body>
  <div class="bundle-header">
    <h1>${escapeHtml(SCHOOL_NAME)}</h1>
    <p><strong>Grade ${grade} Bundle</strong> — ${escapeHtml(subjectLine)}</p>
    <p>${items.length} material${items.length === 1 ? "" : "s"} · Generated ${escapeHtml(
    timestamp
  )}</p>
    <p>Offline CBC Study Resource</p>
  </div>
  <div class="sheet">${body}</div>
</body>
</html>`;
}

export function buildBulkAssessmentText(
  items: ContentItem[],
  grade: number
): string {
  const banner = [
    "=".repeat(72),
    SCHOOL_NAME.toUpperCase(),
    `GRADE ${grade} BUNDLE — ${items.length} material${
      items.length === 1 ? "" : "s"
    }`,
    `Generated: ${formatTimestamp()}`,
    "Offline CBC Study Resource",
    "=".repeat(72),
    "",
  ].join("\n");
  const bodies = items.map((i) => buildAssessmentText(i)).join("\n\n");
  return `${banner}\n${bodies}`;
}

export async function exportAssessmentBulk(
  options: BulkExportOptions
): Promise<BulkExportResult> {
  const { items, grade, subject, format = "html" } = options;

  if (!items.length) {
    return {
      success: false,
      filename: "",
      itemCount: 0,
      error: "No materials selected for export.",
    };
  }

  const filename = buildBulkFilename(grade, subject, format);
  const data =
    format === "txt"
      ? buildBulkAssessmentText(items, grade)
      : buildBulkAssessmentHtml(items, grade);
  const mimeType =
    format === "txt"
      ? "text/plain;charset=utf-8"
      : "text/html;charset=utf-8";

  try {
    if (await isNativeShell()) {
      await triggerNativeDownload(filename, data, mimeType);
    } else {
      triggerWebDownload(filename, data, mimeType);
    }
    return { success: true, filename, itemCount: items.length };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown bulk export error";
    console.error("[exportAssessmentBulk] failed:", err);
    return {
      success: false,
      filename,
      itemCount: items.length,
      error: message,
    };
  }
}
