import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
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
 * Unified file download helper.
 *
 * - Displays a "Downloading..." toast on initiation.
 * - On native platforms (Android/iOS), writes the file using
 *   @capacitor/filesystem and shares via the OS share sheet.
 * - On the web, triggers a standard HTML5 anchor blob download.
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

  const pendingToastId = showPendingToast(pendingMessage ?? `Downloading ${label} report...`);

  try {
    let nativeUri: string | undefined;

    if (isNative) {
      // ---- Native (Android / iOS) ----
      // Prefer a writable directory that ships with the app so users can save
      // or share the file via the OS share sheet. For "csv" and "json" we can
      // write as UTF-8 text; for everything else we fall back to base64.
      try {
        const useBase64 = isBase64 || mimeType.startsWith('application/') || mimeType.startsWith('image/');

        const writeResult = await Filesystem.writeFile({
          path: filename,
          data,
          directory: Directory.Documents,
          encoding: useBase64 ? undefined : Encoding.UTF8,
          recursive: false,
        });

        nativeUri = writeResult.uri;
      } catch (nativeError) {
        // Fall back to Cache directory if Documents fails (e.g. permission
        // errors on some Android builds).
        const useBase64 = isBase64 || mimeType.startsWith('application/') || mimeType.startsWith('image/');
        const fallbackResult = await Filesystem.writeFile({
          path: filename,
          data,
          directory: Directory.Cache,
          encoding: useBase64 ? undefined : Encoding.UTF8,
          recursive: false,
        });
        nativeUri = fallbackResult.uri;
      }

      // Best-effort: present the OS share sheet so the user can save or
      // forward the file. We intentionally wrap this in a try/catch so a
      // user cancelling the share sheet doesn't fail the whole download.
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
        // Swallow share errors – the file has still been written.
        console.warn('Native share dialog dismissed or unavailable:', shareErr);
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
    showSuccessToast(successMessage ?? `${label} report downloaded successfully.`);

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
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// ============================================
// Toast helpers (Sonner-backed, no direct imports
// in this file to avoid circular dependencies)
// ============================================

// We keep a tiny indirection so callers can show loading / success / error
// states. Sonner exposes `toast.loading` and `toast.success` / `toast.error`
// directly; the `useToast` helper from `@/components/ui/use-toast` is for
// shadcn toast. Munyaka School uses Sonner for live notifications, so we
// import dynamically inside each helper.

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