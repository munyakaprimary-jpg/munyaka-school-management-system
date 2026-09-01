/**
 * PDF download helper for the student transfer flow.
 *
 * The TransferWorkflow component renders a printable certificate DOM node
 * and converts it to a high-resolution PDF via html2canvas + jsPDF. Once
 * the transfer API confirms success, this helper:
 *
 *   1. Converts the jsPDF instance to a Blob (so it works the same way on
 *      web and on Capacitor/native shells).
 *   2. Creates an Object URL.
 *   3. Injects a hidden <a download> link and triggers a click.
 *   4. Revokes the URL after the browser has had time to start the
 *      download.
 *
 * If the browser blocks the automatic download (e.g. pop-up blockers), the
 * caller can re-trigger it via the success toast action button or via the
 * stored "Download Clearance Certificate" button on the student profile.
 */

import { jsPDF } from 'jspdf';

export interface DownloadPdfOptions {
  /** The jsPDF instance containing the rendered certificate. */
  pdf: jsPDF;
  /** Filename used for the download (e.g. "Clearance_TRF-2026-6479.pdf"). */
  filename: string;
}

export interface DownloadPdfResult {
  success: boolean;
  /** A blob URL that the caller can re-use if the auto-download was blocked. */
  objectUrl?: string;
  /** The raw Blob, kept so callers can re-download later. */
  blob?: Blob;
  error?: string;
}

/**
 * Convert a jsPDF document to a Blob using the correct MIME type.
 * Centralised so the web and native paths stay in sync.
 */
export function jsPdfToBlob(pdf: jsPDF): Blob {
  const arrayBuffer = pdf.output('arraybuffer');
  return new Blob([arrayBuffer], { type: 'application/pdf' });
}

/**
 * Trigger a browser download for a PDF blob. Returns the object URL so the
 * caller can stash it on a student record for re-downloads.
 */
export function downloadPdfBlob(blob: Blob, filename: string): DownloadPdfResult {
  try {
    // Defensive: re-wrap to make sure the MIME type is application/pdf
    const pdfBlob =
      blob.type === 'application/pdf'
        ? blob
        : new Blob([blob], { type: 'application/pdf' });

    const objectUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Defer revoke so the browser has time to start the download stream.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);

    return { success: true, objectUrl, blob: pdfBlob };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown PDF download error';
    console.error('[pdfDownloader] downloadPdfBlob failed:', err);
    return { success: false, error: message };
  }
}

/**
 * High-level helper: convert a jsPDF instance to a blob, then download it.
 */
export function downloadJsPdf(pdf: jsPDF, filename: string): DownloadPdfResult {
  const blob = jsPdfToBlob(pdf);
  return downloadPdfBlob(blob, filename);
}

/**
 * Stash a clearance certificate reference on a student record so the
 * "Download Clearance Certificate" button on the profile page can
 * re-generate the PDF on demand. The reference contains everything needed
 * to rebuild the PDF without re-prompting the user.
 */
export interface ClearanceCertificateRef {
  certificateNumber: string;
  filename: string;
  /** ISO timestamp when the certificate was generated. */
  issuedAt: string;
  /**
   * A base64-encoded copy of the PDF (data URL). Used as a fallback when
   * the original object URL has been revoked. The original PDF data is
   * also kept in localStorage so a re-download is always possible.
   */
  pdfDataUrl?: string;
}

const CERT_STORAGE_KEY = 'munyaka_clearance_certificates';

type CertLedger = Record<string, ClearanceCertificateRef>;

/**
 * Read the certificate ledger from localStorage. Returns an empty object if
 * nothing is stored yet.
 */
export function readCertLedger(): CertLedger {
  try {
    const raw = localStorage.getItem(CERT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? (parsed as CertLedger) : {};
  } catch {
    return {};
  }
}

function writeCertLedger(ledger: CertLedger): void {
  try {
    localStorage.setItem(CERT_STORAGE_KEY, JSON.stringify(ledger));
  } catch (err) {
    // localStorage may be full or unavailable (e.g. SSR or private mode).
    // We log but don't throw — the transfer itself has already succeeded.
    console.warn('[pdfDownloader] Could not persist certificate ledger:', err);
  }
}

/**
 * Persist a certificate reference for a specific student so the profile
 * page can offer a re-download button later.
 */
export function saveCertificateRef(
  studentId: string,
  ref: ClearanceCertificateRef
): void {
  const ledger = readCertLedger();
  ledger[studentId] = ref;
  writeCertLedger(ledger);
}

/**
 * Look up a stored certificate reference for a student, if one exists.
 */
export function getCertificateRef(
  studentId: string
): ClearanceCertificateRef | null {
  const ledger = readCertLedger();
  return ledger[studentId] ?? null;
}

/**
 * Re-download a previously-issued certificate from its persisted data URL.
 * Used by the "Download Clearance Certificate" button on the student
 * profile.
 */
export function redownloadCertificate(
  studentId: string,
  studentName?: string
): DownloadPdfResult {
  const ref = getCertificateRef(studentId);
  if (!ref) {
    return { success: false, error: 'No certificate on file for this student.' };
  }

  // Prefer the persisted data URL — this works even if the original
  // Object URL was revoked.
  if (ref.pdfDataUrl) {
    try {
      const byteString = atob(ref.pdfDataUrl.split(',')[1] ?? '');
      const mimeString = ref.pdfDataUrl.split(',')[0]?.split(':')[1]?.split(';')[0] ?? 'application/pdf';
      const buffer = new ArrayBuffer(byteString.length);
      const uint8 = new Uint8Array(buffer);
      for (let i = 0; i < byteString.length; i++) {
        uint8[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([buffer], { type: mimeString });
      const filename = ref.filename || buildCertificateFilename(studentName, ref.certificateNumber);
      return downloadPdfBlob(blob, filename);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not decode stored PDF.';
      return { success: false, error: message };
    }
  }

  return { success: false, error: 'Certificate is on file but its PDF payload is no longer available.' };
}

/**
 * Sanitise a string for use as a filename.
 */
export function sanitiseFilenamePart(input: string | undefined | null): string {
  if (!input) return 'Unknown';
  return input
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 60) || 'Unknown';
}

export function buildCertificateFilename(
  studentName: string | undefined | null,
  certificateNumber: string
): string {
  return `Munyaka_Clearance_${sanitiseFilenamePart(studentName)}_${certificateNumber}.pdf`;
}
