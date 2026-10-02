/**
 * Master Data Exporter Utility (`exportMasterDatabase.ts`)
 * Aggregates all application keys and key domains (learners, attendance, fees, library, CBC records)
 * into a single clean JSON structure and supports Capacitor Filesystem caching & native Share.
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { showSuccess, showError } from '@/utils/toast';

export interface MasterExportResult {
  success: boolean;
  filePath?: string;
  fileName: string;
  size: number;
  message: string;
}

export interface MasterExportPackage {
  exportVersion: string;
  generatedAt: string;
  schoolName: string;
  data: {
    learners: any[];
    attendance: any[];
    fees: any[];
    library: any[];
    otherKeys: Record<string, any>;
  };
}

/**
 * Aggregates all application keys and standard Munyaka school datasets from localStorage
 */
export function aggregateMasterDatabase(): MasterExportPackage {
  let learners: any[] = [];
  let attendance: any[] = [];
  let fees: any[] = [];
  let library: any[] = [];
  const otherKeys: Record<string, any> = {};

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const rawVal = localStorage.getItem(key);
      let parsedVal: any = rawVal;
      try {
        if (rawVal) {
          parsedVal = JSON.parse(rawVal);
        }
      } catch {
        // Keep as raw string if not JSON
      }

      // Populate targeted categories
      if (
        key === 'school_learners_v1' ||
        key === 'munyaka_learners' ||
        key === 'learners' ||
        key.includes('learner')
      ) {
        if (Array.isArray(parsedVal) && learners.length === 0) {
          learners = parsedVal;
        }
      }

      if (
        key === 'roll_call_records' ||
        key === 'munyaka_attendance' ||
        key === 'attendance' ||
        key.includes('attendance') ||
        key.includes('roll_call')
      ) {
        if (Array.isArray(parsedVal) && attendance.length === 0) {
          attendance = parsedVal;
        }
      }

      if (
        key === 'fees_data' ||
        key === 'munyaka_fees' ||
        key === 'fees' ||
        key.includes('fee') ||
        key.includes('payment')
      ) {
        if (Array.isArray(parsedVal) && fees.length === 0) {
          fees = parsedVal;
        }
      }

      if (
        key === 'library_data' ||
        key === 'munyaka_library_books' ||
        key === 'library' ||
        key.includes('library') ||
        key.includes('book')
      ) {
        if (Array.isArray(parsedVal) && library.length === 0) {
          library = parsedVal;
        }
      }

      // Store in otherKeys
      otherKeys[key] = parsedVal;
    }
  } catch (err) {
    console.error('Error iterating localStorage for master export:', err);
  }

  // Fallbacks if specific keys were not found in localStorage loop
  if (learners.length === 0) {
    try {
      const fallback = localStorage.getItem('school_learners_v1') || localStorage.getItem('munyaka_learners');
      if (fallback) learners = JSON.parse(fallback);
    } catch {}
  }

  if (attendance.length === 0) {
    try {
      const fallback = localStorage.getItem('roll_call_records') || localStorage.getItem('munyaka_attendance');
      if (fallback) attendance = JSON.parse(fallback);
    } catch {}
  }

  if (fees.length === 0) {
    try {
      const fallback = localStorage.getItem('fees_data') || localStorage.getItem('munyaka_fees');
      if (fallback) fees = JSON.parse(fallback);
    } catch {}
  }

  if (library.length === 0) {
    try {
      const fallback = localStorage.getItem('library_data') || localStorage.getItem('munyaka_library_books');
      if (fallback) library = JSON.parse(fallback);
    } catch {}
  }

  return {
    exportVersion: '1.0',
    generatedAt: new Date().toISOString(),
    schoolName: 'Munyaka Primary School',
    data: {
      learners,
      attendance,
      fees,
      library,
      otherKeys,
    },
  };
}

/**
 * Generates the Master JSON Package, writes it to the device cache using Capacitor Filesystem,
 * and triggers `Share.share()` for native Android sharing (or web fallback download).
 */
export async function exportMasterDatabase(): Promise<MasterExportResult> {
  try {
    const payload = aggregateMasterDatabase();
    const jsonString = JSON.stringify(payload, null, 2);
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `munyaka_master_export_${dateStr}.json`;

    if (Capacitor.isNativePlatform()) {
      // Write to cache directory first
      const writeResult = await Filesystem.writeFile({
        path: fileName,
        data: jsonString,
        directory: Directory.Cache,
        encoding: undefined as any // binary or string
      });

      const fileUri = writeResult.uri;

      // Trigger native Share
      try {
        await Share.share({
          title: 'Munyaka Master Data Export',
          text: `Master Database Export package generated at ${new Date().toLocaleString()}`,
          url: fileUri,
          dialogTitle: 'Share Master Data Package',
        });
      } catch (shareErr: any) {
        // If user canceled share dialog, that's fine, but log it
        console.warn('Share dialog dismissed or failed:', shareErr);
      }

      showSuccess(`Master export cached & shared: ${fileName}`);
      return {
        success: true,
        filePath: fileUri,
        fileName,
        size: jsonString.length,
        message: `Successfully generated and shared ${fileName}`,
      };
    } else {
      // Web fallback: download JSON blob
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess(`Master Database Export downloaded: ${fileName}`);
      return {
        success: true,
        fileName,
        size: jsonString.length,
        message: `Downloaded ${fileName} in browser`,
      };
    }
  } catch (error: any) {
    console.error('Master database export failed:', error);
    showError(error?.message || 'Failed to export master database package');
    return {
      success: false,
      fileName: 'master_export_failed.json',
      size: 0,
      message: error?.message || 'Export failed',
    };
  }
}
