/**
 * PDF Assessment Parser Utility
 *
 * Extracts structured questions from PDF assessment papers (e.g., KNEC exam papers).
 * Supports multiple numbering patterns, sub-questions, and image-only content.
 *
 * Supported patterns:
 *  - Main questions: 1., 1), Q1., Q1., Question 1:, (1), 1.
 *  - Sub-questions:  a), b), i), ii), (a), (b)
 *  - Sub-sub-questions: (i), (ii), A., B., etc.
 */

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.js?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CSVRow {
  question_text: string;
  type: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  points: string;
}

export interface PDFParseResult {
  rows: CSVRow[];
  isScanned: boolean;
  rawText: string;
  skippedLines: string[];
}

// ─── Header / Metadata Patterns ──────────────────────────────────────────────

/**
 * Patterns that match common cover-page / header / metadata lines found in
 * KNEC exam papers and similar assessment documents.
 */
const HEADER_PATTERNS: RegExp[] = [
  // Document metadata fields
  /^(?:subject|class|topic|module|unit|lesson|chapter)[\s:]+/i,
  /^(?:instruction[s]?[\s:]*|note[\s:]*|memo[\s:]?)/i,
  /^(?:duration|time)[\s:]+[\d\s]+(?:minutes?|mins?|hours?)/i,
  /^(?:total\s+marks?|marks?\s*[:\-=]?\s*\d+)/i,
  /^(?:name[\s:]+|date[\s:]+|roll\s*no[\s:]+|reg\.?\s*no[\s:]+|student[\s:]+|candidate[\s:]+)/i,
  /^(?:attempt\s+all\s+questions?)/i,
  /^(?:please\s+(?:read|answer|attempt|complete))/i,
  /^(?:this\s+(?:paper|exam|quiz)\s+consists?)/i,
  // Dividers and page labels
  /^[-_=]{3,}$/i,
  /^(?:page\s*\d+\s+of\s+\d+)/i,
  /^(?:fig\.?\s*\d+)/i,
  // KNEC / exam board specific
  /^(?:knec|kcse|kple|kcpe)/i,
  /^(?:write\s+(?:your|your\s+name|answers))\b/i,
  // Score / mark summary tables (single short lines like "5 mks")
  /^\d+\s*(?:mks?|marks?)$/i,
  // Blank or very short noise
  /^\s*$/,
];

/**
 * Returns true when the given line looks like a header / instruction rather
 * than an actual question or question content.
 */
function isHeaderOrInstruction(line: string): boolean {
  const trimmed = (line ?? '').trim();
  if (trimmed.length < 3) return true;
  return HEADER_PATTERNS.some((p) => p.test(trimmed));
}

// ─── Question Pattern Definitions ─────────────────────────────────────────────

/**
 * Main question number patterns.
 * Order matters: more specific patterns are listed first.
 */
const MAIN_QUESTION_PATTERNS: RegExp[] = [
  // 1. (a) ... or 1. (i) ...
  /^(?:\d+)\.\s*\(([a-z])\)\s*(.+)/i,
  // 1. Question text
  /^(?:\d+)\.\s+(.+)/,
  // 1) Question text
  /^(?:\d+)\)\s+(.+)/,
  // Q1. / Q1) / Q1: / Q 1.
  /^Q\s*(\d+)\s*[.):]\s*(.+)/i,
  // Question 1: / Question 1. / Question 1 -
  /^[Qq]uestion\s+(\d+)\s*[:.\-]\s*(.+)/,
  // QUESTION 1. / QUESTION 1:
  /^QUESTION\s+(\d+)\s*[:.\-]\s*(.+)/,
  // (1) Question text
  /^\((\d+)\)\s*(.+)/,
  // a) b) within a question (standalone, not sub-parts) — only when starting a line
  /^[a-z]\)\s+(.+)/i,
  // i) ii) roman numeral standalone
  /^(i{1,3}|iv|v+|x+)\)\s+(.+)/i,
];

/**
 * Sub-question / sub-item patterns.
 * These attach to the current question rather than starting a new one.
 */
const SUB_QUESTION_PATTERNS: RegExp[] = [
  // (a), (b), (c), (d)
  /^\(([a-d])\)\s*(.+)/i,
  // a), b), c), d)
  /^([a-d])\)\s+(.+)/i,
  // i), ii), iii), iv)
  /^\((i{1,3}|iv|v+)\)\s*(.+)/i,
  // i), ii) without parentheses
  /^(i{1,3}|iv|v+)\)\s+(.+)/i,
  // A., B., C., D.
  /^([A-D])\.\s+(.+)/i,
  // 1., 2., 3. for sub-numbered items within a question
  /^(?:^|\s)(\d+)\.\s+(.+)/,
];

/**
 * Roman numeral patterns for sub-question detection.
 */
const ROMAN_NUMERALS = [
  "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x",
  "xi", "xii", "xiii", "xiv", "xv", "xvi", "xvii", "xviii", "xix", "xx",
];

/**
 * Attempts to extract a question identifier from a line.
 * Returns the full question text (group 2 or group 1 depending on pattern)
 * or null if the line doesn't match any main question pattern.
 */
function matchMainQuestion(raw: string): string | null {
  for (const pattern of MAIN_QUESTION_PATTERNS) {
    const match = raw.match(pattern);
    if (match) {
      return (match[match.length - 1] ?? match[1])?.trim?.() ?? null;
    }
  }
  return null;
}

/**
 * Attempts to match a sub-question / sub-item pattern.
 * Returns an object with the sub-question identifier and text, or null.
 */
function matchSubQuestion(raw: string): { id: string; text: string } | null {
  for (const pattern of SUB_QUESTION_PATTERNS) {
    const match = raw.match(pattern);
    if (match) {
      // Group 1 = identifier (a, b, i, etc.), Group 2 = text
      return { id: match[1], text: match[2]?.trim?.() ?? '' };
    }
  }
  return null;
}

// ─── Option & Metadata Patterns ───────────────────────────────────────────────

const OPTION_PATTERN = /^([A-D])[.)]\s*(.+)/i;
const ANSWER_PATTERN = /^(?:answer|correct|answer\s+is|right\s+answer)[:\s]+([A-D])\b/i;
const POINTS_PATTERN  = /^(?:points|marks?)[:\s]+(\d+)/i;
const MARKS_PATTERN  = /^\((\d+)\s*(?:mks?|marks?)\)$/i;

// ─── PDF Text Extraction ─────────────────────────────────────────────────────

/**
 * Extracts raw text from a PDF using pdfjs-dist.
 * Returns all page texts joined, plus per-page arrays for line-level analysis.
 */
async function extractRawText(file: File): Promise<{
  rawText: string;
  isScanned: boolean;
  pageTexts: string[];
}> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? (item as { str: string }).str : ""))
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .trim();
    pageTexts.push(pageText);
  }

  const rawText = pageTexts.join("\n\n--- Page Break ---\n\n").trim();
  const hasTextLayer = pageTexts.some((t) => t && t.replace(/\s/g, "").length > 0);
  const isScanned = !hasTextLayer;

  return { rawText, isScanned, pageTexts };
}

// ─── Line Normalization ───────────────────────────────────────────────────────

/**
 * KNEC papers often place question numbers on their own line followed by
 * the question text on the next line.
 * e.g. "4.\nA resource person..."
 *
 * This function joins such orphaned number lines back to the following text.
 */
function normalizeOrphanedNumbers(lines: string[]): string[] {
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = (lines[i] ?? '').trim();

    // Check if this line is ONLY a question number (e.g. "4." or "4)" or "(4)")
    const orphanedMatch = line.match(/^(?:\d+)[.)]$|^\(\d+\)$|^[a-z]\)$|^Q\s*\d+$|^QUESTION\s+\d+$/i);
    if (orphanedMatch && i + 1 < lines.length) {
      const nextLine = (lines[i + 1] ?? '').trim();
      // Only join if the next line isn't also a number
      if (!nextLine.match(/^(?:\d+)[.)]$|^\(\d+\)$/)) {
        result.push(`${line} ${nextLine}`);
        i += 2;
        continue;
      }
    }

    result.push(line);
    i++;
  }

  return result;
}

// ─── Core Parser ─────────────────────────────────────────────────────────────

/**
 * Main parsing entry point.
 *
 * @param file - The PDF File to parse
 * @returns PDFParseResult with extracted rows, scanned flag, raw text, and skipped lines
 */
export async function parseAssessmentPDF(file: File): Promise<PDFParseResult> {
  const { rawText, isScanned, pageTexts } = await extractRawText(file);

  // ── Log extraction results ──────────────────────────────────────────────
  console.group(`📄 PDF Text Extraction: ${file.name}`);
  console.log(`Pages found: ${pageTexts.length}`);
  console.log(`Text layer detected: ${isScanned ? "No (scanned PDF)" : "Yes"}`);
  console.log("─".repeat(60));
  console.log("RAW TEXT LAYER:");
  console.log(rawText || "(No text detected)");
  console.log("─".repeat(60));
  console.groupEnd();

  // Return empty for scanned PDFs
  if (isScanned) {
    return { rows: [], isScanned: true, rawText, skippedLines: [] };
  }

  // ── Build flat line list ─────────────────────────────────────────────────
  const allLines: string[] = [];
  for (const pageText of pageTexts) {
    if (pageText) {
      // Split on paragraph breaks and 4+ spaces (column separators in KNEC papers)
      const paragraphBlocks = pageText
        .split(/\n{2,}|\s{4,}/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      for (const block of paragraphBlocks) {
        // Also split long blocks on double newlines within the block
        const blockLines = block.split(/\n/).map((l) => (l ?? '').trim()).filter(Boolean);
        allLines.push(...blockLines);
      }
    }
  }

  // ── Normalize orphaned number lines ──────────────────────────────────────
  const normalizedLines = normalizeOrphanedNumbers(allLines);

  // ── Parse lines into rows ────────────────────────────────────────────────
  const rows: CSVRow[] = [];
  let current: Partial<CSVRow> = {};
  let startedQuestions = false;
  const skippedLines: string[] = [];

  for (let i = 0; i < normalizedLines.length; i++) {
    const raw = normalizedLines[i];

    // Skip headers until we encounter the first question
    if (!startedQuestions) {
      if (isHeaderOrInstruction(raw)) {
        skippedLines.push(raw);
        console.log(`⏭️  Skipping header: "${raw.substring(0, 60)}${raw.length > 60 ? "..." : ""}"`);
        continue;
      }
      // If it's not a header and not a question, still skip (unrecognised metadata)
      if (!matchMainQuestion(raw)) {
        skippedLines.push(raw);
        continue;
      }
    }

    // ── Main question detection ─────────────────────────────────────────────
    const mainQuestionText = matchMainQuestion(raw);
    if (mainQuestionText) {
      if (current.question_text) {
        rows.push(current as CSVRow);
      }
      current = {
        question_text: mainQuestionText,
        type: "mcq",
      };
      startedQuestions = true;
      continue;
    }

    // ── Sub-question detection (appends to current question) ────────────────
    if (current.question_text) {
      const sub = matchSubQuestion(raw);
      if (sub) {
        current.question_text = `${current.question_text} (${sub.id}) ${sub.text}`;
        continue;
      }
    }

    // ── Options (A., B., C., D.) ────────────────────────────────────────────
    if (current.question_text) {
      const optionMatch = raw.match(OPTION_PATTERN);
      if (optionMatch) {
        const key = `option_${optionMatch[1].toLowerCase()}` as keyof CSVRow;
        (current as Record<string, string>)[key] = optionMatch[2];
        continue;
      }

      // Marks indicator e.g. "(5 mks)"
      const marksMatch = raw.match(MARKS_PATTERN);
      if (marksMatch) {
        current.points = marksMatch[1];
        continue;
      }

      // Answer key e.g. "Answer: C"
      const answerMatch = raw.match(ANSWER_PATTERN);
      if (answerMatch) {
        current.correct_answer = answerMatch[1].toUpperCase();
        continue;
      }

      // Points / marks line
      const pointsMatch = raw.match(POINTS_PATTERN);
      if (pointsMatch) {
        current.points = pointsMatch[1];
        continue;
      }

      // Generic continuation — append to question text
      current.question_text = `${current.question_text} ${raw}`;
    }
  }

  if (current.question_text) {
    rows.push(current as CSVRow);
  }

  console.log(`📋 Parsed ${rows.length} question row(s) from PDF`);
  console.log("─".repeat(60));

  return { rows, isScanned: false, rawText, skippedLines };
}

/**
 * Processes an image-only question by extracting available text and adding
 * a placeholder note for missing figures.
 *
 * Call this when a PDF page has no text content but may have images.
 */
export function processImageOnlyQuestion(
  availableText: string,
  pageIndex: number
): Partial<CSVRow> {
  if (availableText && (availableText ?? '').trim().length > 0) {
    // There is some readable text — treat as a normal question with a figure note
    return {
      question_text: `${(availableText ?? '').trim()} [Figure reference on page ${pageIndex + 1} — image content not extracted]`,
      type: "structured",
    };
  }

  // No text at all — return a placeholder row
  return {
    question_text: `[Image/Figure content on page ${pageIndex + 1} — no text layer detected. Please enter question manually or use the CSV template.]`,
    type: "structured",
  };
}
