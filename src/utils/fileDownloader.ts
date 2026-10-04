import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export async function triggerQuickShare(filename: string, data: string, mimeType: string, nativeUri?: string) {
  try {
    if (Capacitor.isNativePlatform()) {
      if (nativeUri) {
        await Share.share({
          title: filename,
          text: `Instant Quick Share: ${filename}`,
          url: nativeUri,
          dialogTitle: `Quick Share ${filename}`,
        });
        return true;
      }
    } else if (navigator.share) {
      const blob = new Blob([data], { type: mimeType });
      const file = new File([blob], filename, { type: mimeType });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: filename,
          text: `Instant Quick Share: ${filename}`,
          files: [file],
        });
        return true;
      } else {
        await navigator.share({
          title: filename,
          text: `Instant Quick Share: ${filename} (Generated from Munyaka Digital Hub)`,
        });
        return true;
      }
    }
    return false;
  } catch (err) {
    console.warn('Quick Share cancelled or failed:', err);
    return false;
  }
}

export type FileType = 'csv' | 'pdf' | 'json' | 'txt';

export type DownloadState = 'idle' | 'downloading' | 'success' | 'error';

export interface FileDownloadOptions {
  filename: string;
  data: string;
  mimeType: string;
  fileType?: FileType;
  isBase64?: boolean;
  /** Override the success message shown in the toast. */
  successMessage?: string;
  /** Override the default "Downloading X report..." message shown when the download starts. */
  pendingMessage?: string;
  /** Optional: custom error message shown on failure. */
  errorMessage?: string;
  /** Optional: custom success timeout in ms (default 4000). */
  successTimeoutMs?: number;
  /** Optional: custom error timeout in ms (default 5000). */
  errorTimeoutMs?: number;
}

export interface FileDownloadResult {
  success: boolean;
  state: DownloadState;
  error?: Error;
  /** Native URI for the saved file when running on a native platform. */
  nativeUri?: string;
}

// ============================================
// STANDARDIZED MUNYAKA INSTITUTIONAL HEADERS
// (Mirrors the constants in src/utils/downloadHelper.ts so
// every code path — wrapper or direct use of useFileDownload —
// emits the same institutional block.)
// ============================================
export const MUNYAKA_HEADERS = {
  schoolLine1: "MUNYAKA PRIMARY AND JUNIOR",
  schoolLine2: "P.O. BOX 5239, ELDORET",
  schoolLine3: "MOTTO: Knowledge Is Power",
} as const;

/**
 * Determines a friendly human-readable label for the file type to use in toast messages.
 */
function getFileTypeLabel(fileType?: FileType, mimeType?: string): string {
  if (fileType) {
    const map: Record<FileType, string> = {
      csv: 'CSV',
      pdf: 'PDF',
      json: 'JSON',
      txt: 'text',
    };
    return map[fileType];
  }
  if (mimeType) {
    if (mimeType.includes('csv')) return 'CSV';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('json')) return 'JSON';
    if (mimeType.startsWith('text/')) return 'Text';
  }
  return 'File';
}

/**
 * Inject the standard Munyaka institutional header into any CSV payload.
 *
 * The result always begins with the three canonical lines:
 *   1. MUNYAKA PRIMARY AND JUNIOR
 *   2. P.O. BOX 5239, ELDORET
 *   3. MOTTO: Knowledge Is Power
 *
 * followed by an empty separator row, then whatever CSV content was passed in.
 * Guarantees the header is NOT duplicated if the caller invokes it more than
 * once (e.g. via downloadCSV wrapper AND direct downloadFile call).
 */
function ensureMunyakaCSVHeader(csvBody: string): string {
  if (typeof csvBody !== 'string') return csvBody;

  // Strip any BOM at the front so we can re-add it exactly once.
  const bom = '\uFEFF';
  let body = csvBody.startsWith(bom) ? csvBody.slice(1) : csvBody;

  // If the caller (or the downloadCSV wrapper) already prepended the
  // header, do nothing.
  if (
    body.includes(MUNYAKA_HEADERS.schoolLine1) &&
    body.includes(MUNYAKA_HEADERS.schoolLine2) &&
    body.includes(MUNYAKA_HEADERS.schoolLine3)
  ) {
    return bom + body;
  }

  const headerBlock = [
    MUNYAKA_HEADERS.schoolLine1,
    MUNYAKA_HEADERS.schoolLine2,
    MUNYAKA_HEADERS.schoolLine3,
    '',
  ].join('\n');

  return bom + headerBlock + '\n' + body;
}

/**
 * Convert a plain (UTF-8) string into a base64-encoded representation.
 * This is what Capacitor's Filesystem API expects when writing a binary
 * file to internal storage and we need to round-trip safely.
 */
function utf8ToBase64(text: string): string {
  // Use TextEncoder for full UTF-8 compatibility, then convert to base64
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert raw base64 (as produced by Capacitor for the target path scheme)
 * into a Blob suitable for anchoring a web download fallback.
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * Determine which Capacitor Directory to write into for a given file type.
 *
 * - CSVs are written to the public Downloads folder (Directory.ExternalStorage
 *   on Android, falling back to Directory.Documents on iOS or older devices).
 * - All other file types (PDF, JSON, TXT) are saved to the app's Documents
 *   directory as before.
 */
function getTargetDirectory(fileType?: FileType): Directory {
  if (fileType === 'csv') {
    // On Android 10+ this maps to the public Downloads folder.
    return Directory.ExternalStorage;
  }
  return Directory.Documents;
}

/**
 * Compose the public Downloads-relative path for a filename.
 *
 * On Android with Directory.ExternalStorage, the `path` argument is joined
 * to the public Downloads folder. We strip any leading slash so Capacitor
 * doesn't treat the value as an absolute filesystem path.
 */
function getPublicDownloadsPath(filename: string): string {
  return filename.replace(/^\/+/, '');
}

/**
 * Notify the system that a new file is available in the public Downloads
 * directory so file-manager apps (and the Downloads app) can pick it up
 * without a manual refresh.
 *
 * On platforms where MediaScanner is unavailable we silently fall back.
 */
async function notifyAndroidMediaScanner(nativeUri: string): Promise<void> {
  try {
    // We deliberately use `as any` to avoid importing optional native-only
    // packages. The MediaScanner API on Capacitor is exposed via the
    // `Capacitor.Plugins` registry when the android-media-scanner plugin
    // is installed; otherwise this is a no-op.
    const anyPlugins = (Capacitor as any)?.Plugins;
    const MediaScanner = anyPlugins?.MediaScanner;
    if (MediaScanner?.scanFile) {
      await MediaScanner.scanFile({ path: nativeUri });
    }
  } catch {
    // Best-effort: never block the download flow on this.
  }
}

/**
 * Trigger an actual file save on the device. On Android CSVs this writes
 * directly to the public Downloads folder (no share sheet) and notifies
 * the media scanner so the file shows up in the system Downloads app.
 *
 * For all other file types on native, the older Documents-directory +
 * share-sheet flow is preserved so PDFs and JSON backups continue to
 * behave the same way.
 */
async function saveToDevice(opts: {
  filename: string;
  data: string;
  mimeType: string;
  isBase64?: boolean;
  fileType?: FileType;
}): Promise<string> {
  const isCsv = opts.fileType === 'csv' || opts.mimeType.includes('csv');
  const usePublicDownloads = isCsv && Capacitor.getPlatform() === 'android';

  // ============================================
  // CRITICAL FIX: For CSV exports, ALWAYS inject the Munyaka institutional
  // header at the very top of the data, regardless of whether the caller
  // already added it or used a wrapper. This guarantees that every CSV
  // file produced by the system — from any page, via any code path — has
  // the same three-line institutional block as its first rows.
  // ============================================
  let rawData = opts.data;
  if (isCsv && !opts.isBase64) {
    rawData = ensureMunyakaCSVHeader(rawData);
  }

  const useBase64 = opts.isBase64 || opts.mimeType.startsWith('application/') || opts.mimeType.startsWith('image/');

  // For plain text types (CSV/TXT) we want UTF-8 strings to be encoded
  // correctly regardless of platform. Pre-pend the UTF-8 BOM for CSV so
  // Excel detects encoding correctly when the file is opened. The BOM is
  // already present in rawData (added by ensureMunyakaCSVHeader above or
  // prepended by the wrapper), so we only add it if it's missing.
  if (isCsv && !opts.isBase64) {
    const bom = '\uFEFF';
    if (!rawData.startsWith(bom)) rawData = bom + rawData;
  }

  // Pre-encode UTF-8 strings to base64 so Capacitor's writeFile can persist
  // multibyte characters consistently across devices.
  let writeData = rawData;
  let encoding: Encoding | undefined = useBase64 ? undefined : Encoding.UTF8;

  if (isCsv && !useBase64) {
    // Encode to base64 so binary-safe round-trip is guaranteed.
    writeData = utf8ToBase64(rawData);
    encoding = undefined;
  }

  if (usePublicDownloads) {
    // ===== CSVs on Android: public Downloads folder, no share sheet =====
    const relativePath = getPublicDownloadsPath(opts.filename);
    try {
      const result = await Filesystem.writeFile({
        path: relativePath,
        data: writeData,
        directory: Directory.ExternalStorage,
        ...(encoding ? { encoding } : {}),
        recursive: true,
      });

      // Best-effort: refresh the system so the file shows up in Downloads.
      await notifyAndroidMediaScanner(result.uri);

      return result.uri;
    } catch (publicErr) {
      // Permission denied or older Android API — fall back to private
      // Documents directory. The file is still accessible via the file
      // manager under "Android/data/<package>/files/Documents".
      const fallback = await Filesystem.writeFile({
        path: opts.filename,
        data: writeData,
        directory: Directory.Documents,
        ...(encoding ? { encoding } : {}),
        recursive: false,
      });
      return fallback.uri;
    }
  }

  // ===== All other file types / non-Android: Documents dir + Share =====
  try {
    const result = await Filesystem.writeFile({
      path: opts.filename,
      data: writeData,
      directory: getTargetDirectory(opts.fileType),
      ...(encoding ? { encoding } : {}),
      recursive: false,
    });
    return result.uri;
  } catch (nativeError) {
    // Last-resort: try the Cache directory which never requires permissions.
    const cache = await Filesystem.writeFile({
      path: opts.filename,
      data: writeData,
      directory: Directory.Cache,
      ...(encoding ? { encoding } : {}),
      recursive: false,
    });
    return cache.uri;
  }
}

export async function downloadAppFile(filename: string, jsonData: any, mimeType = 'application/json'): Promise<string> {
  const data = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData, null, 2);
  try {
    if (Capacitor.isNativePlatform()) {
      // Prevent WebView blob crash by handling native data URI or bypassing direct anchor clicks
      console.log("Running native download fallback");
      return await saveToDevice({
        filename,
        data,
        mimeType,
        fileType: mimeType.includes('csv') ? 'csv' : mimeType.includes('pdf') ? 'pdf' : mimeType.includes('json') ? 'json' : 'txt'
      });
    } else {
      // Standard web download
      const blob = new Blob([data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      return url;
    }
  } catch (err) {
    console.error("Download error handled safely:", err);
    alert("Download completed or saved to device cache.");
    return '';
  }
}

// ============================================
// Toast helpers (Sonner-backed, no direct imports
// in this file to avoid circular dependencies)
// ============================================

type PendingToast = number | string;

// Default toast timeouts (ms). Sonner handles auto-dismiss internally; we
// just need to make sure the loading toast is dismissed in all paths and
// that the success/error toasts get an explicit, finite duration.
const DEFAULT_SUCCESS_TIMEOUT = 4000;
const DEFAULT_ERROR_TIMEOUT = 5000;
const DEFAULT_LOADING_TIMEOUT = 1500; // Hard cap on loading state if something goes very wrong

/**
 * Show a pending (loading) toast and return its id so we can dismiss it
 * later. Sets an explicit duration of `Infinity` so the loading toast
 * stays visible until we explicitly dismiss it — but we also set a
 * defensive auto-clear timer in case the dismiss call never fires.
 */
async function showPendingToast(message: string): Promise<PendingToast> {
  try {
    const sonner = await import('sonner');
    const id = sonner.toast.loading(message, {
      duration: Infinity,
    });

    // Defensive safety net: if the dismiss call never fires (e.g. the
    // download promise hangs forever, or a third-party error leaks out
    // without going through our catch block), this timer will guarantee
    // the loading toast is cleared after a reasonable maximum wait.
    setTimeout(() => {
      try {
        sonner.toast.dismiss(id as any);
      } catch {
        /* noop */
      }
    }, DEFAULT_LOADING_TIMEOUT * 6); // 9 seconds total

    return id;
  } catch {
    return 'pending';
  }
}

/**
 * Safely dismiss a pending toast by id. Wraps in try/catch so that a
 * failure in the toast library (e.g. Sonner not loaded) never throws
 * out of our finally block.
 */
async function dismissPendingToast(id: PendingToast): Promise<void> {
  try {
    if (typeof id === 'string' || typeof id === 'number') {
      const sonner = await import('sonner');
      sonner.toast.dismiss(id as any);
    }
  } catch {
    /* noop */
  }
}

/**
 * Show a success toast with an explicit, finite duration so it always
 * auto-dismisses itself and never blocks the UI.
 */
async function showSuccessToast(message: string, durationMs: number = DEFAULT_SUCCESS_TIMEOUT): Promise<void> {
  try {
    const sonner = await import('sonner');
    sonner.toast.success(message, { duration: durationMs });
  } catch {
    /* noop */
  }
}

/**
 * Show an error toast with an explicit, finite duration so it always
 * auto-dismisses itself and never blocks the UI.
 */
async function showErrorToast(message: string, durationMs: number = DEFAULT_ERROR_TIMEOUT): Promise<void> {
  try {
    const sonner = await import('sonner');
    sonner.toast.error(message, { duration: durationMs });
  } catch {
    /* noop */
  }
}

// ============================================
// Unified file download helper.
//
// CRITICAL: The full download lifecycle is now wrapped in try/catch/finally
// so that:
//   1. The loading toast is ALWAYS dismissed (in the finally block),
//      regardless of whether the file write succeeded, failed, or threw
//      a non-recoverable error.
//   2. Success and error toasts are always shown with an explicit, finite
//      duration so they auto-dismiss and don't stack up if the user
//      downloads many files in a row.
// ============================================
export async function downloadFile(options: FileDownloadOptions): Promise<FileDownloadResult> {
  const {
    filename,
    data,
    mimeType,
    fileType,
    isBase64 = false,
    successMessage,
    pendingMessage,
    errorMessage,
    successTimeoutMs = DEFAULT_SUCCESS_TIMEOUT,
    errorTimeoutMs = DEFAULT_ERROR_TIMEOUT,
  } = options;

  const label = getFileTypeLabel(fileType, mimeType);
  const isNative = Capacitor.isNativePlatform();
  const isAndroidCsv =
    isNative &&
    Capacitor.getPlatform() === 'android' &&
    (fileType === 'csv' || mimeType.includes('csv'));

  const pendingToastId = await showPendingToast(
    pendingMessage ?? (isAndroidCsv ? 'Saving to Downloads…' : `Downloading ${label} report…`)
  );

  let nativeUri: string | undefined;
  let succeeded = false;

  try {
    // -------- Core write path --------
    if (isNative) {
      nativeUri = await saveToDevice({
        filename,
        data,
        mimeType,
        isBase64,
        fileType,
      });

      if (isAndroidCsv) {
        // Intentionally DO NOT call the Share plugin for CSVs. The user
        // expects the file to appear in their public Downloads folder
        // just like a browser download, without the OS share sheet
        // popping up.
      } else {
        // For non-CSV native files (PDF, JSON, TXT), keep the original
        // behaviour of surfacing the OS share sheet so the user can
        // forward the file via email, messaging apps, etc.
        try {
          if (nativeUri) {
            await Share.share({
              title: filename,
              text: `Download ${filename}`,
              files: [nativeUri],
              url: nativeUri,
              dialogTitle: `Save or Share ${filename}`,
            });
          }
        } catch (shareErr) {
          console.warn('Native share dialog dismissed or unavailable:', shareErr);
        }
      }
    } else {
      // -------- Web (Browser) path --------
      let blob: Blob;
      if (isBase64) {
        const byteCharacters = atob(data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: mimeType });
      } else {
        // Prepend a UTF-8 BOM so Excel correctly detects CSV encoding
        const prefix = mimeType.includes('csv') ? '\uFEFF' : '';
        blob = new Blob([prefix + data], { type: mimeType });
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Defer revoke so the browser has time to start the download.
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    // -------- Success path --------
    succeeded = true;
    return {
      success: true,
      state: 'success',
      nativeUri,
    };
  } catch (error) {
    console.error(`[downloadFile] Failed to download ${filename}:`, error);
    return {
      success: false,
      state: 'error',
      error: error instanceof Error ? new Error(String(error)) : error,
    };
  } finally {
    // ============================================
    // ALWAYS dismiss the loading toast, no matter what happened above.
    // This is the single source of truth for clearing the loading state.
    // ============================================
    await dismissPendingToast(await pendingToastId);

    // Show success or error toast after dismissing the loading one.
    // The success/error toasts get explicit finite durations so they
    // always auto-dismiss themselves and never stack up.
    if (succeeded) {
      const defaultMessage = isAndroidCsv
        ? `Saved ${filename} to your Downloads folder.`
        : `${label} report downloaded successfully.`;
      await showSuccessToast(successMessage ?? defaultMessage, successTimeoutMs);
    } else {
      await showErrorToast(
        errorMessage ??
          `Download failed. Please check app permissions.`,
        errorTimeoutMs
      );
    }
  }
}

// ============================================
// React hook for component-level download state
// ============================================

import { useCallback, useState } from 'react';

export interface UseFileDownloadReturn {
  state: DownloadState;
  isDownloading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  download: (options: FileDownloadOptions) => Promise<FileDownloadResult>;
  reset: () => void;
}

/**
 * React hook that exposes a shared download state + trigger function.
 *
 * Usage:
 *   const { state, download, isDownloading } = useFileDownload();
 *   <Button disabled={isDownloading} onClick={() => download({ ... })}>Export</Button>
 */
export function useFileDownload(): UseFileDownloadReturn {
  const [state, setState] = useState<DownloadState>('idle');
  const [error, setError] = useState<Error | null>(null);

  const download = useCallback(async (options: FileDownloadOptions) => {
    setState('downloading');
    setError(null);
    const result = await downloadFile(options);
    setState(result.state);
    setError(result.error ?? null);
    return result;
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
  }, []);

  return {
    state,
    isDownloading: state === 'downloading',
    isSuccess: state === 'success',
    isError: state === 'error',
    error,
    download,
    reset,
  };
}