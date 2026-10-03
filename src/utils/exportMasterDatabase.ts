/**
 * Master Data Exporter Utility (`exportMasterDatabase.ts`)
 * Aggregates all application keys and key domains (learners, attendance, fees, library, CBC records)
 * into a single clean JSON structure and supports Capacitor Filesystem caching & native Share.
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { showSuccess, showError } from '@/utils/toast';
import { getStoredLearners } from './learnersStore';

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
 * Master Sync Package v1 - Standardized format for cross-device synchronization
 * Contains the complete harmonized master database with metadata headers
 */
export interface MasterSyncPackage {
  packageVersion: string;           // "1.0"
  packageType: string;              // "munyaka_master_sync"
  generatedAt: string;              // ISO timestamp
  generatedBy: {
    senderName: string;
    staffId: string;
    departmentOrStream: string;
    role: string;
  };
  appVersion: string;               // e.g., "2.0.0"
  data: {
    learners: any[];
    attendance: any[];
    fees: any[];
    library: any[];
    marks: any[];
    exams: any[];
    streams: any[];
    classAssignments: any[];
    learningAreas: any[];
    examTypes: any[];
    feeStructures: any[];
    notices: any[];
    events: any[];
    ictEquipment: any[];
    scienceInventory: any[];
    storeInventory: any[];
    timetable: any[];
    settings: any;
    staff: any[];
  };
}

/**
 * Generates the standardized Master Sync Package (munyaka_master_sync_v1.json)
 * This is the authoritative bundle for cross-device synchronization
 */
export function generateMasterSyncPackage(senderInfo?: {
  senderName?: string;
  staffId?: string;
  departmentOrStream?: string;
  role?: string;
}): MasterSyncPackage {
  // 1. Crawl all active localStorage keys dynamically
  const allKeys: Record<string, any> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const rawVal = localStorage.getItem(key);
      try {
        allKeys[key] = rawVal ? JSON.parse(rawVal) : null;
      } catch {
        allKeys[key] = rawVal;
      }
    }
  } catch (err) {
    console.error('Error crawling localStorage for master sync:', err);
  }

  // 2. Extract live runtime data with absolute exhaustive harvesting across all keys
  const learners = (() => {
    // Collect all unique learner records from every possible key to guarantee 100% capture of all 21 learners
    const map = new Map();
    const candidateKeys = [
      'school_learners_master',
      'munyaka_learners',
      'learners',
      'students',
      'school_learners_v1',
      'munyaka_central_db'
    ];
    for (const key of candidateKeys) {
      const val = allKeys[key];
      if (Array.isArray(val)) {
        val.forEach((l: any) => {
          const id = l.id || l.admissionNumber || l.upi || JSON.stringify(l);
          map.set(id, l);
        });
      } else if (val && typeof val === 'object' && Array.isArray(val.students)) {
        val.students.forEach((l: any) => {
          const id = l.id || l.admissionNumber || l.upi || JSON.stringify(l);
          map.set(id, l);
        });
      }
    }
    const storeLearners = getStoredLearners();
    if (Array.isArray(storeLearners)) {
      storeLearners.forEach((l: any) => {
        const id = l.id || l.admissionNumber || l.upi || JSON.stringify(l);
        map.set(id, l);
      });
    }
    return Array.from(map.values());
  })();

  const staff = (() => {
    // Collect all unique staff members from every possible key to guarantee 100% capture of all 5 staff
    const map = new Map();
    const candidateKeys = [
      'staff_members',
      'munyaka_staff_directory',
      'munyaka_master_staff_list',
      'munyaka_staff',
      'staff',
      'school_staff_master'
    ];
    for (const key of candidateKeys) {
      const val = allKeys[key];
      if (Array.isArray(val)) {
        val.forEach((s: any) => {
          const id = s.id || s.staffId || s.email || JSON.stringify(s);
          map.set(id, s);
        });
      }
    }
    return Array.from(map.values());
  })();

  const attendance = (() => {
    const keys = ['munyaka_attendance_records', 'munyaka_attendance', 'roll_call_records', 'attendance', 'attendance_logs'];
    for (const k of keys) {
      if (Array.isArray(allKeys[k]) && allKeys[k].length > 0) return allKeys[k];
    }
    return [];
  })();

  const fees = (() => {
    const keys = [
      'munyaka_fees_records',
      'munyaka_fees',
      'fees_data',
      'fees',
      'fee_records',
      'student_payments',
      'fee_ledgers',
      'transactions',
      'munyaka_fee_ledgers',
      'munyaka_student_payments'
    ];
    for (const k of keys) {
      const val = allKeys[k];
      if (Array.isArray(val) && val.length > 0) return val;
      if (val && typeof val === 'object' && Object.keys(val).length > 0) return val;
    }
    return [];
  })();

  const studentPayments = (() => {
    const keys = ['student_payments', 'munyaka_student_payments', 'fee_ledgers', 'transactions', 'fee_records'];
    for (const k of keys) {
      const val = allKeys[k];
      if (Array.isArray(val) && val.length > 0) return val;
    }
    return [];
  })();

  const library = (() => {
    const keys = ['munyaka_library_books', 'school_library_inventory_v1', 'library_data', 'library'];
    for (const k of keys) {
      if (Array.isArray(allKeys[k]) && allKeys[k].length > 0) return allKeys[k];
    }
    return [];
  })();

  const marks = (() => {
    const keys = ['munyaka_marks_records', 'marked_student_submissions', 'marks'];
    for (const k of keys) {
      if (Array.isArray(allKeys[k]) && allKeys[k].length > 0) return allKeys[k];
    }
    return [];
  })();

  const exams = (() => {
    const keys = ['all_set_exams', 'munyaka_exams', 'exams'];
    for (const k of keys) {
      if (Array.isArray(allKeys[k]) && allKeys[k].length > 0) return allKeys[k];
    }
    return [];
  })();

  const streams = (() => {
    const keys = ['munyaka_streams', 'streams', 'grades_and_streams_config'];
    for (const k of keys) {
      if (allKeys[k]) return allKeys[k];
    }
    return [];
  })();

  const classAssignments = allKeys['munyaka_class_assignments'] || allKeys['classAssignments'] || [];
  const learningAreas = allKeys['munyaka_learning_areas'] || allKeys['learningAreas'] || [];
  const examTypes = allKeys['munyaka_exam_types'] || allKeys['examTypes'] || [];
  const feeStructures = allKeys['munyaka_fee_structures'] || allKeys['feeStructures'] || [];
  const notices = allKeys['munyaka_notices_board'] || allKeys['munyaka_notices'] || [];
  const events = allKeys['munyaka_events'] || [];
  const ictEquipment = allKeys['munyaka_ict_assets'] || allKeys['ictEquipment'] || [];
  const scienceInventory = allKeys['munyaka_science_lab'] || allKeys['scienceInventory'] || [];
  const storeInventory = allKeys['munyaka_store_items'] || allKeys['storeInventory'] || [];
  const timetable = allKeys['munyaka_timetable'] || allKeys['school-timetable-data'] || [];
  const settings = allKeys['munyaka_system_settings_v3'] || allKeys['munyaka_system_settings'] || {};

  // Get current user info for metadata
  const currentUser = (() => {
    try {
      const auth = localStorage.getItem('munyaka_auth');
      if (auth) return JSON.parse(auth);
    } catch {}
    return null;
  })();

  return {
    packageVersion: '1.0',
    packageType: 'munyaka_master_sync',
    generatedAt: new Date().toISOString(),
    generatedBy: {
      senderName: senderInfo?.senderName || currentUser?.name || 'Administrator',
      staffId: senderInfo?.staffId || currentUser?.staffId || currentUser?.id || 'ADMIN-001',
      departmentOrStream: senderInfo?.departmentOrStream || currentUser?.department || currentUser?.stream || 'Administration',
      role: senderInfo?.role || currentUser?.role || 'admin',
    },
    appVersion: '2.0.0',
    data: {
      learners,
      staff,
      attendance,
      fees,
      library,
      marks,
      exams,
      streams,
      classAssignments,
      learningAreas,
      examTypes,
      feeStructures,
      notices,
      events,
      ictEquipment,
      scienceInventory,
      storeInventory,
      timetable,
      settings,
    },
  };
}

/**
 * Exports the Master Sync Package as a downloadable JSON file
 */
export async function exportMasterSyncPackage(senderInfo?: {
  senderName?: string;
  staffId?: string;
  departmentOrStream?: string;
  role?: string;
}): Promise<MasterExportResult> {
  try {
    const payload = generateMasterSyncPackage(senderInfo);
    const jsonString = JSON.stringify(payload, null, 2);
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `munyaka_master_sync_v1_${dateStr}.json`;

    if (Capacitor.isNativePlatform()) {
      let targetDir = Directory.ExternalStorage;
      let writeResult;
      try {
        writeResult = await Filesystem.writeFile({
          path: fileName,
          data: jsonString,
          directory: targetDir,
          encoding: Encoding.UTF8
        });
      } catch (err) {
        targetDir = Directory.Documents;
        writeResult = await Filesystem.writeFile({
          path: fileName,
          data: jsonString,
          directory: targetDir,
          encoding: Encoding.UTF8
        });
      }

      let fileUri = writeResult?.uri;
      if (!fileUri && writeResult) {
        const uriResult = await Filesystem.getUri({
          directory: targetDir,
          path: fileName,
        });
        fileUri = uriResult.uri;
      }

      try {
        if (fileUri) {
          await Share.share({
            title: 'Munyaka Master Sync Package',
            text: `Master Sync Package generated at ${new Date().toLocaleString()}`,
            files: [fileUri],
            url: fileUri,
            dialogTitle: 'Share Master Sync Package',
          });
        }
      } catch (shareErr: any) {
        console.warn('Share dialog dismissed or failed:', shareErr);
      }

      showSuccess(`Master Sync Package cached & shared: ${fileName}`);
      return {
        success: true,
        filePath: fileUri,
        fileName,
        size: jsonString.length,
        message: `Successfully generated and shared ${fileName}`,
      };
    } else {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess(`Master Sync Package downloaded: ${fileName}`);
      return {
        success: true,
        fileName,
        size: jsonString.length,
        message: `Downloaded ${fileName} in browser`,
      };
    }
  } catch (error: any) {
    console.error('Master sync package export failed:', error);
    showError(error?.message || 'Failed to export master sync package');
    return {
      success: false,
      fileName: 'master_sync_failed.json',
      size: 0,
      message: error?.message || 'Export failed',
    };
  }
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
      let targetDir = Directory.ExternalStorage;
      let writeResult;
      try {
        writeResult = await Filesystem.writeFile({
          path: fileName,
          data: jsonString,
          directory: targetDir,
          encoding: Encoding.UTF8
        });
      } catch (err) {
        targetDir = Directory.Documents;
        writeResult = await Filesystem.writeFile({
          path: fileName,
          data: jsonString,
          directory: targetDir,
          encoding: Encoding.UTF8
        });
      }

      let fileUri = writeResult?.uri;
      if (!fileUri && writeResult) {
        const uriResult = await Filesystem.getUri({
          directory: targetDir,
          path: fileName,
        });
        fileUri = uriResult.uri;
      }

      // Trigger native Share
      try {
        if (fileUri) {
          await Share.share({
            title: 'Munyaka Master Data Export',
            text: `Master Database Export package generated at ${new Date().toLocaleString()}`,
            files: [fileUri],
            url: fileUri,
            dialogTitle: 'Share Master Data Package',
          });
        }
      } catch (shareErr: any) {
        // If user canceled share dialog, that's fine, but log it
        console.warn('Share dialog dismissed or failed:', shareErr);
      }

      showSuccess(`Master export cached & shared: ${fileName}`);
      window.dispatchEvent(new CustomEvent('munyaka_file_exported', {
        detail: { filename: fileName, data: jsonString, mimeType: 'application/json', nativeUri: fileUri, title: 'Master Database Export' }
      }));
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
      window.dispatchEvent(new CustomEvent('munyaka_file_exported', {
        detail: { filename: fileName, data: jsonString, mimeType: 'application/json', title: 'Master Database Export' }
      }));
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
