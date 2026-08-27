import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding, ReaddirResult } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

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
}

export interface FileDownloadResult {
  success: boolean;
  state: DownloadState;
  error?: Error;
  /** Native URI for the saved file when running on a native platform. */
  nativeUri?: string;
}

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

  const useBase64 = opts.isBase64 || opts.mimeType.startsWith('application/') || opts.mimeType.startsWith('image/');

  // For plain text types (CSV/TXT) we want UTF-8 strings to be encoded
  // correctly regardless of platform. Pre-pend the UTF-8 BOM for CSV so
  // Excel detects encoding correctly when the file is opened.
  let rawData = opts.data;
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

/**
 * Unified file download helper.
 *
 * - Displays a "Downloading..." toast on initiation.
 * - On native Android for CSVs: writes directly to the public Downloads
 *   folder using the Capacitor Filesystem plugin and notifies the system
 *   media scanner. The share sheet is intentionally NOT shown for this
 *   path so the file lands in the system Downloads app like a normal
 *   download.
 * - On native for other file types: writes to Documents and shows the
 *   share sheet (existing behaviour).
 * - On the web: triggers a standard HTML5 anchor blob download.
 * - Updates the toast to a success or error message when complete.
 *
 * Returns a result describing the final state so callers can update local
 * state (e.g. disabled flags) once the download finishes.
 */
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
  } = options;

  const label = getFileTypeLabel(fileType, mimeType);
  const isNative = Capacitor.isNativePlatform();
  const isAndroidCsv =
    isNative &&
    Capacitor.getPlatform() === 'android' &&
    (fileType === 'csv' || mimeType.includes('csv'));

  const pendingToastId = showPendingToast(
    pendingMessage ?? (isAndroidCsv ? 'Saving to Downloads…' : `Downloading ${label} report…`)
  );

  try {
    let nativeUri: string | undefined;

    if (isNative) {
      // ---- Native (Android / iOS) ----
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
              url: nativeUri,
              dialogTitle: `Save or Share ${filename}`,
            });
          }
        } catch (shareErr) {
          console.warn('Native share dialog dismissed or unavailable:', shareErr);
        }
      }
    } else {
      // ---- Web (Browser) ----
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

    // ---- Success toast ----
    dismissPendingToast(pendingToastId);
    const defaultMessage = isAndroidCsv
      ? `Saved ${filename} to your Downloads folder.`
      : `${label} report downloaded successfully.`;
    showSuccessToast(successMessage ?? defaultMessage);

    return {
      success: true,
      state: 'success',
      nativeUri,
    };
  } catch (error) {
    console.error(`[downloadFile] Failed to download ${filename}:`, error);
    dismissPendingToast(pendingToastId);
    showErrorToast(
      errorMessage ??
        `Download failed. Please check app permissions.`
    );
    return {
      success: false,
      state: 'error',
      error: error instanceof Error ? new Error(String(error)) : error,
    };
  }
}

// ============================================
// Toast helpers (Sonner-backed, no direct imports
// in this file to avoid circular dependencies)
// ============================================

type PendingToast = number | string;

async function showPendingToast(message: string): Promise<PendingToast> {
  try {
    const sonner = await import('sonner');
    return sonner.toast.loading(message, { duration: Infinity });
  } catch {
    return 'pending';
  }
}

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

async function showSuccessToast(message: string): Promise<void> {
  try {
    const sonner = await import('sonner');
    sonner.toast.success(message);
  } catch {
    /* noop */
  }
}

async function showErrorToast(message: string): Promise<void> {
  try {
    const sonner = await import('sonner');
    sonner.toast.error(message);
  } catch {
    /* noop */
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