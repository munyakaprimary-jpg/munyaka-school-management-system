"use client";

import { showSuccess } from '@/utils/toast';
import { Capacitor } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';
import { Browser } from '@capacitor/browser';
import { Directory } from '@capacitor/filesystem';

export const SCHOOL_HEADERS = [
  "MUNYAKA PRIMARY & JUNIOR SCHOOL",
  "P.O. BOX 45-30100, ELDORET",
  "EMAIL: info@munyakaschool.ac.ke | TEL: 0712345678",
  "CBC COMPETENCY-BASED CURRICULUM ASSESSMENT REPORT",
  ""
];

export const MUNYAKA_HEADERS = Object.assign(
  [...SCHOOL_HEADERS],
  {
    schoolLine1: "MUNYAKA PRIMARY AND JUNIOR",
    schoolLine2: "P.O. BOX 5239, ELDORET",
    schoolLine3: "MOTTO: Knowledge Is Power"
  }
);

export function generateCSVHeader(title: string, subtitle?: string): string[] {
  return [
    "MUNYAKA PRIMARY & JUNIOR SCHOOL",
    title,
    subtitle || `Generated: ${new Date().toLocaleString()}`,
    "",
    ""
  ];
}

export interface DownloadOptions {
  url?: string;      // Remote file URL
  base64?: string;  // Base64 encoded data
  blob?: Blob;       // Direct blob data
  filename: string;  // Desired filename
  mimeType?: string; // MIME type
}

export interface DownloadResult {
  success: boolean;
  message: string;
  path?: string;
}

/**
 * Centralized document download utility that works across all platforms
 * (native Android/iOS and web browsers)
 */
export async function downloadDocument(options: DownloadOptions): Promise<DownloadResult> {
  const { url, base64, blob, filename, mimeType = 'application/octet-stream' } = options;
  
  try {
    if (!filename) {
      throw new Error('Filename is required');
    }
    
    if (!url && !base64 && !blob) {
      throw new Error('Either url, base64, or blob must be provided');
    }
    
    let fileData: string | Uint8Array;
    let contentType = mimeType;
    
    if (url) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      const arrayBuf = await response.arrayBuffer();
      fileData = new Uint8Array(arrayBuf);
      contentType = response.headers.get('content-type') || mimeType;
    } else if (base64) {
      fileData = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    } else if (blob) {
      const arrayBuf = await blob.arrayBuffer();
      fileData = new Uint8Array(arrayBuf);
      contentType = blob.type || mimeType;
    } else {
      throw new Error('Invalid input parameters');
    }
    
    if (Capacitor.isNativePlatform()) {
      return await downloadNative(fileData, filename, contentType);
    } else {
      return await downloadWeb(fileData, filename, contentType);
    }
  } catch (error) {
    console.error('Download failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Download failed'
    };
  }
}

async function downloadNative(
  fileData: string | Uint8Array, 
  filename: string, 
  contentType: string
): Promise<DownloadResult> {
  try {
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${Directory.Documents}/${safeFilename}`;
    
    // Convert to base64 if it's ArrayBuffer/Uint8Array
    let base64Data: string;
    if (fileData instanceof Uint8Array) {
      let binary = '';
      const len = fileData.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(fileData[i]);
      }
      base64Data = btoa(binary);
    } else {
      base64Data = btoa(fileData);
    }

    await Filesystem.writeFile({
      path: filePath,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true
    });
    
    try {
      await Browser.open({ url: `file://${filePath}` });
    } catch (openError) {
      console.warn('Could not open file with system app:', openError);
    }
    
    showSuccess(`Downloaded ${safeFilename} successfully!`);
    
    return {
      success: true,
      message: `File saved to ${safeFilename}`, 
      path: filePath
    };
  } catch (error) {
    console.error('Native download failed:', error);
    throw error;
  }
}

async function downloadWeb(
  fileData: string | Uint8Array,
  filename: string,
  contentType: string
): Promise<DownloadResult> {
  try {
    const blob = new Blob([fileData], { type: contentType || 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    
    try {
      link.click();
    } catch (clickErr) {
      console.warn('Programmatic click blocked or failed, attempting direct window.open fallback', clickErr);
      window.open(url, '_blank');
    }
    
    document.body.removeChild(link);
    
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
    
    showSuccess(`Downloaded ${filename} successfully!`);
    
    return {
      success: true,
      message: `File downloaded as ${filename}`
    };
  } catch (error) {
    console.error('Web download failed:', error);
    throw error;
  }
}

export async function downloadFromUrl(url: string, filename: string, mimeType?: string): Promise<DownloadResult> {
  return downloadDocument({ url, filename, mimeType });
}

export async function downloadFromBase64(
  base64Data: string, 
  filename: string, 
  mimeType?: string
): Promise<DownloadResult> {
  return downloadDocument({ base64: base64Data, filename, mimeType });
}

export async function downloadFromBlob(
  blob: Blob, 
  filename: string
): Promise<DownloadResult> {
  return downloadDocument({ blob, filename });
}

export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFromBlob(blob, filename);
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  downloadFromBlob(blob, filename);
}
