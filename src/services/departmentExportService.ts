/**
 * Departmental & Staff Export Service (`departmentExportService.ts`)
 * Standardized data export utilities for Bursar, ICT, Librarian, Storekeeper,
 * Science Lab, and Teacher Class Packages.
 * 
 * Enforces mandatory sender metadata headers & class/stream assignments.
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { showSuccess, showError } from '@/utils/toast';

/**
 * Standardized Export Metadata Header Creator
 * Injects senderName, staffId, departmentOrStream, assignedClass, assignedStream, exportedAt, and appVersion.
 */
export function createStandardizedExportHeader(
  senderName: string = 'Staff Member',
  staffId: string = 'STF-001',
  departmentOrStream: string = 'General',
  packageType: string = 'CLASS_PACKAGE'
): Record<string, any> {
  let assignedClass = 'Grade 1';
  let assignedStream = departmentOrStream || 'Green';

  try {
    const overrideRaw = localStorage.getItem('munyaka_temp_export_override');
    if (overrideRaw) {
      const override = JSON.parse(overrideRaw);
      if (override.assignedClass) assignedClass = override.assignedClass;
      if (override.assignedStream) assignedStream = override.assignedStream;
    } else {
      const authRaw = localStorage.getItem('munyaka_auth');
      if (authRaw) {
        const user = JSON.parse(authRaw);
        assignedClass = user.assignedClass || user.class || user.grade || 'Grade 1';
        assignedStream = user.assignedStream || user.stream || departmentOrStream || 'Green';
      }
    }
  } catch {}

  return {
    metadata: {
      senderName,
      staffId,
      departmentOrStream,
      packageType,
      assignedClass,
      assignedStream,
      exportedAt: new Date().toISOString(),
      appVersion: '2.0.0'
    }
  };
}

/**
 * Helper to write and share or download JSON exports
 */
async function exportJsonFile(filename: string, payload: any, successTitle: string): Promise<void> {
  const jsonString = JSON.stringify(payload, null, 2);

  try {
    if (Capacitor.isNativePlatform()) {
      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: jsonString,
        directory: Directory.Cache,
        encoding: undefined as any
      });

      try {
        await Share.share({
          title: successTitle,
          text: `Export package generated at ${new Date().toLocaleString()}`,
          url: writeResult.uri,
          dialogTitle: successTitle,
        });
      } catch (shareErr: any) {
        console.warn('Share dismissed:', shareErr);
      }

      showSuccess(`${successTitle} cached & shared successfully!`);
    } else {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess(`${successTitle} downloaded successfully!`);
    }
  } catch (err: any) {
    console.error('Export failed:', err);
    showError(err?.message || 'Failed to export file');
  }
}

/**
 * 1. Bursar Financial Export
 */
export function exportBursarLedger(): void {
  const header = createStandardizedExportHeader('Bursar Department', 'BUR-001', 'Finance', 'BURSAR_LEDGER');
  const fees = JSON.parse(localStorage.getItem('munyaka_fees_records') || '[]');
  const payments = JSON.parse(localStorage.getItem('munyaka_payment_records') || '[]');
  
  const payload = {
    ...header,
    data: { fees, payments }
  };
  
  exportJsonFile(`bursar_ledger_export_${Date.now()}.json`, payload, 'Bursar Financial Ledger Export');
}

/**
 * 2. ICT Equipment Export
 */
export function exportICTInventory(): void {
  const header = createStandardizedExportHeader('ICT Department', 'ICT-001', 'ICT Lab', 'ICT_INVENTORY');
  const equipment = JSON.parse(localStorage.getItem('munyaka_ict_assets') || '[]');
  
  const payload = {
    ...header,
    data: { equipment }
  };
  
  exportJsonFile(`ict_inventory_export_${Date.now()}.json`, payload, 'ICT Equipment Inventory Export');
}

/**
 * 3. Librarian Circulation Export
 */
export function exportLibraryCirculation(): void {
  const header = createStandardizedExportHeader('School Librarian', 'LIB-001', 'Library', 'LIBRARY_CIRCULATION');
  const books = JSON.parse(localStorage.getItem('munyaka_library_books') || '[]');
  const history = JSON.parse(localStorage.getItem('munyaka_library_history') || '[]');
  
  const payload = {
    ...header,
    data: { books, history }
  };
  
  exportJsonFile(`library_circulation_export_${Date.now()}.json`, payload, 'Library Circulation Export');
}

/**
 * 4. Storekeeper Inventory Export
 */
export function exportStoreInventory(): void {
  const header = createStandardizedExportHeader('Storekeeper', 'STR-001', 'General Store', 'STORE_INVENTORY');
  const items = JSON.parse(localStorage.getItem('munyaka_store_items') || '[]');
  
  const payload = {
    ...header,
    data: { items }
  };
  
  exportJsonFile(`store_inventory_export_${Date.now()}.json`, payload, 'Store Inventory Export');
}

/**
 * 5. Science Lab Inventory Export
 */
export function exportScienceLabInventory(): void {
  const header = createStandardizedExportHeader('Science Lab Technician', 'SCI-001', 'Science Laboratory', 'SCIENCE_LAB_INVENTORY');
  const chemicals = JSON.parse(localStorage.getItem('munyaka_science_lab') || '[]');
  
  const payload = {
    ...header,
    data: { chemicals }
  };
  
  exportJsonFile(`science_lab_export_${Date.now()}.json`, payload, 'Science Lab Inventory Export');
}

/**
 * 6. Teacher Class Package Export
 */
export function exportClassPackage(streamName: string = "General", classData: any = {}): void {
  let senderName = 'Class Teacher';
  let staffId = 'TCH-001';
  let assignedClass = 'Grade 1';
  let assignedStream = streamName;

  try {
    const authRaw = localStorage.getItem('munyaka_auth');
    if (authRaw) {
      const user = JSON.parse(authRaw);
      senderName = user.name || senderName;
      staffId = user.staffId || user.id || staffId;
      assignedClass = user.assignedClass || user.class || user.grade || 'Grade 1';
      assignedStream = user.assignedStream || user.stream || streamName;
    }
  } catch {}

  const header = createStandardizedExportHeader(senderName, staffId, assignedStream, 'CLASS_PACKAGE', assignedClass, assignedStream);
  
  const attendance = JSON.parse(localStorage.getItem('munyaka_attendance_records') || '[]');
  const marks = JSON.parse(localStorage.getItem('marked_student_submissions') || '[]');
  const checkIns = JSON.parse(localStorage.getItem('munyaka_teacher_checkins') || '[]');

  const payload = {
    ...header,
    data: {
      attendance,
      marks,
      checkIns,
      ...classData
    }
  };

  exportJsonFile(`class_package_${assignedClass.replace(/\s+/g, '_')}_${assignedStream}_${Date.now()}.json`, payload, `Class Package Export (${assignedClass} - ${assignedStream})`);
}
