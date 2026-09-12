/**
 * Attachment helpers for the Study Corner file upload feature.
 *
 * These utilities intentionally keep things simple and offline-first:
 *   - All files are read as Base64 Data URLs via `FileReader` and stored
 *     directly on the material object in localStorage.
 *   - No server upload, no third-party storage — the entire file lives
 *     in the user's browser.
 *
 * The trade-off is localStorage size limits (~5 MB on most browsers), so
 * the helpers enforce a soft cap (configurable) and surface a friendly
 * error rather than silently truncating.
 */

import type { Attachment } from "@/data/cbcStudyContent";

/** Default soft cap per attachment: 4 MB. */
export const DEFAULT_MAX_BYTES = 4 * 1024 * 1024;

/** Human-friendly byte formatter. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Read a File into a Base64 Data URL via FileReader. */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("FileReader did not return a string."));
      }
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Build an `Attachment` object from a `File`. Throws if the file exceeds
 * the size cap. The MIME type is taken from `file.type` (or guessed
 * from the extension if missing — e.g. some Android pickers omit it).
 */
export async function fileToAttachment(
  file: File,
  maxBytes: number = DEFAULT_MAX_BYTES
): Promise<Attachment> {
  if (file.size > maxBytes) {
    throw new Error(
      `File is too large (${formatBytes(file.size)}). ` +
        `Maximum allowed is ${formatBytes(maxBytes)}.`
    );
  }

  const dataUrl = await readFileAsDataUrl(file);
  const type = file.type || guessMimeFromName(file.name);

  return {
    name: file.name,
    type,
    size: file.size,
    dataUrl,
  };
}

/**
 * Best-effort MIME type guess from filename extension for browsers
 * (or file pickers) that don't populate `file.type`.
 */
export function guessMimeFromName(name: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
    md: "text/markdown",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    csv: "text/csv",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return map[ext] ?? "application/octet-stream";
}

/** Open an attachment in a new tab — works fully offline. */
export function openAttachment(att: Attachment): void {
  try {
    const win = window.open(att.dataUrl, "_blank", "noopener,noreferrer");
    if (!win) {
      // Pop-up blocked — fall back to an anchor click.
      const link = document.createElement("a");
      link.href = att.dataUrl;
      link.download = att.name;
      link.target = "_blank";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    console.error("[attachmentHelpers] openAttachment failed:", err);
  }
}

/** Trigger a Save As for an attachment via an anchor click. */
export function downloadAttachment(att: Attachment): void {
  try {
    const link = document.createElement("a");
    link.href = att.dataUrl;
    link.download = att.name;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("[attachmentHelpers] downloadAttachment failed:", err);
  }
}

/** Human-friendly description of a file (used in badges / previews). */
export function describeAttachment(att: Attachment): string {
  return `${att.name} · ${att.type || "file"} · ${formatBytes(att.size)}`;
}

/** Pick a lucide icon name for the attachment based on MIME type. */
export function attachmentIconKey(
  att: Attachment
): "pdf" | "image" | "doc" | "sheet" | "file" {
  const t = (att.type || "").toLowerCase();
  if (t.includes("pdf")) return "pdf";
  if (t.startsWith("image/")) return "image";
  if (t.includes("word") || t.includes("msword") || t.includes("officedocument"))
    return "doc";
  if (t.includes("sheet") || t.includes("excel") || t.includes("csv"))
    return "sheet";
  return "file";
}
