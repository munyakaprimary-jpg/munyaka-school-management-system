import { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Standardized School Header Constants
export const SCHOOL_HEADERS = {
  name: "MUNYAKA PRIMARY AND JUNIOR SCHOOL",
  motto: "MOTTO: KNOWLEDGE IS POWER",
  address: "P.O. BOX 5239-30100, ELDORET",
  phone: "+254 712 345 678",
  email: "info@munyaka.sc.ke"
};

// CSV Header Generator - Returns array of header lines
export const generateCSVHeader = (reportTitle: string, extraInfo?: string[]) => {
  const lines = [
    SCHOOL_HEADERS.name,
    SCHOOL_HEADERS.motto,
    SCHOOL_HEADERS.address,
    SCHOOL_HEADERS.phone,
    SCHOOL_HEADERS.email,
    "",
    reportTitle,
    ...(extraInfo || []),
    ""
  ];
  return lines;
};

/**
 * Backward-compatible wrapper that builds a CSV string and routes it through
 * the unified file download pipeline. Prepends a UTF-8 BOM for Excel
 * compatibility, and resolves with a `FileDownloadResult` so callers can
 * update their UI state in response to success/failure.
 */
export async function downloadCSV(csvContent: string, fileName: string) {
  const { downloadFile } = await import('./fileDownloader');
  return downloadFile({
    filename: fileName,
    data: csvContent,
    mimeType: 'text/csv;charset=utf-8;',
    fileType: 'csv',
  });
}

/**
 * Backward-compatible wrapper for downloading text/JSON content via the
 * unified file downloader.
 */
export async function downloadText(textContent: string, fileName: string) {
  const { downloadFile } = await import('./fileDownloader');
  return downloadFile({
    filename: fileName,
    data: textContent,
    mimeType: 'text/plain;charset=utf-8',
    fileType: 'txt',
  });
}

/**
 * Backward-compatible wrapper for downloading from a URL by triggering
 * a standard anchor element. (Used for blob: or http(s) URLs that have
 * already been produced elsewhere.)
 */
export async function downloadFromUrl(url: string, fileName: string, _mimeType: string = 'application/octet-stream') {
  const { downloadFile } = await import('./fileDownloader');
  // We don't have raw data for arbitrary URLs, so we fetch and re-route
  // through the unified pipeline so the user gets a consistent toast.
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
    const blob = await response.blob();
    const mimeType = blob.type || 'application/octet-stream';
    const reader = new FileReader();
    const data: string = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    const base64 = data.split(',')[1] || data;
    return downloadFile({
      filename: fileName,
      data: base64,
      mimeType,
      isBase64: true,
    });
  } catch (err) {
    const { downloadFile: df } = await import('./fileDownloader');
    return df({
      filename: fileName,
      data: '',
      mimeType: 'text/plain',
      errorMessage: 'Download failed. Please check app permissions.',
    });
  }
}

/**
 * Backward-compatible wrapper for downloading JSON content via the
 * unified file downloader.
 */
export async function downloadFile(content: string, fileName: string, mimeType: string = 'application/json') {
  const { downloadFile: df } = await import('./fileDownloader');
  return df({
    filename: fileName,
    data: content,
    mimeType,
    isBase64: false,
  });
}