/**
 * Departmental Export Utility (`departmentExportService.ts`)
 * Generates scoped JSON export packages for Bursar, ICT Lab, Storekeeper, and Science Lab portals,
 * complete with mandatory metadata headers for Admin Harmonization Hub ingestion.
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { showSuccess, showError } from '@/utils/toast';

export type DepartmentType = 'BURSAR' | 'ICT' | 'STOREKEEPER' | 'SCIENCE_LAB';

export interface DepartmentExportMetadata {
  department: DepartmentType;
  staffId: string;
  staffName: string;
  packageType: string;
  timestamp: string;
  schoolName: string;
}

export interface DepartmentExportPackage {
  metadata: DepartmentExportMetadata;
  records: any[];
  summary: {
    totalRecords: number;
    exportDate: string;
  };
}

export interface DepartmentExportResult {
  success: boolean;
  filePath?: string;
  fileName: string;
  size: number;
  message: string;
}

/**
 * Scopes and aggregates department-specific records from localStorage with safe error handling,
 * wrapping them with metadata headers for the Admin Harmonization Hub.
 */
export async function exportDepartmentPackage(
  department: DepartmentType,
  staffInfo?: { id?: string; name?: string }
): Promise<DepartmentExportResult> {
  const safeStaffId = String(staffInfo?.id || localStorage.getItem('current_user_id') || 'STAFF-001');
  const safeStaffName = String(staffInfo?.name || localStorage.getItem('current_user_name') || 'Staff Member');

  try {
    let records: any[] = [];
    let packageType = 'DEPARTMENT_EXPORT';
    let filePrefix = 'department';

    switch (department) {
      case 'BURSAR': {
        packageType = 'BURSAR_FINANCES';
        filePrefix = 'bursar_finances';
        try {
          const feesRaw = localStorage.getItem('fees_data') || localStorage.getItem('munyaka_fees') || '[]';
          const paymentsRaw = localStorage.getItem('munyaka_payments') || localStorage.getItem('fee_payments') || '[]';
          const transRaw = localStorage.getItem('munyaka_transactions') || '[]';
          
          records = [
            { domain: 'fees', items: JSON.parse(feesRaw) },
            { domain: 'payments', items: JSON.parse(paymentsRaw) },
            { domain: 'transactions', items: JSON.parse(transRaw) },
          ];
        } catch {
          records = [];
        }
        break;
      }

      case 'ICT': {
        packageType = 'ICT_INVENTORY';
        filePrefix = 'ict_devices';
        try {
          const devRaw = localStorage.getItem('ict_devices_v1') || localStorage.getItem('munyaka_ict_assets') || '[]';
          const issuesRaw = localStorage.getItem('ict_issues_v1') || '[]';
          
          records = [
            { domain: 'devices', items: JSON.parse(devRaw) },
            { domain: 'issues', items: JSON.parse(issuesRaw) },
          ];
        } catch {
          records = [];
        }
        break;
      }

      case 'STOREKEEPER': {
        packageType = 'STORE_SUPPLIES';
        filePrefix = 'store_inventory';
        try {
          const invRaw = localStorage.getItem('store_inventory_v1') || localStorage.getItem('munyaka_store_items') || '[]';
          const logsRaw = localStorage.getItem('store_issue_logs_v1') || '[]';
          
          records = [
            { domain: 'inventory', items: JSON.parse(invRaw) },
            { domain: 'issueLogs', items: JSON.parse(logsRaw) },
          ];
        } catch {
          records = [];
        }
        break;
      }

      case 'SCIENCE_LAB': {
        packageType = 'SCIENCE_LAB_RECORDS';
        filePrefix = 'science_lab';
        try {
          const appRaw = localStorage.getItem('science_lab_v1') || localStorage.getItem('munyaka_science_apparatus') || '[]';
          const checkRaw = localStorage.getItem('science_lab_checkouts_v1') || '[]';
          
          records = [
            { domain: 'apparatus', items: JSON.parse(appRaw) },
            { domain: 'checkouts', items: JSON.parse(checkRaw) },
          ];
        } catch {
          records = [];
        }
        break;
      }
    }

    const payload: DepartmentExportPackage = {
      metadata: {
        department,
        staffId: safeStaffId,
        staffName: safeStaffName,
        packageType,
        timestamp: new Date().toISOString(),
        schoolName: 'Munyaka Primary School',
      },
      records,
      summary: {
        totalRecords: records.reduce((acc, r) => acc + (Array.isArray(r.items) ? r.items.length : 1), 0),
        exportDate: new Date().toLocaleString(),
      },
    };

    const jsonString = JSON.stringify(payload, null, 2);
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `munyaka_${filePrefix}_${safeStaffId}_${dateStr}.json`;

    if (Capacitor.isNativePlatform()) {
      const writeResult = await Filesystem.writeFile({
        path: fileName,
        data: jsonString,
        directory: Directory.Cache,
      });

      const fileUri = writeResult.uri;

      try {
        await Share.share({
          title: `Munyaka ${department} Export`,
          text: `Departmental export package for ${department} generated by ${safeStaffName}`,
          url: fileUri,
          dialogTitle: `Share ${department} Package`,
        });
      } catch (shareErr) {
        console.warn('Share dialog dismissed:', shareErr);
      }

      showSuccess(`${department} export package cached & shared successfully!`);
      return {
        success: true,
        filePath: fileUri,
        fileName,
        size: jsonString.length,
        message: `Successfully generated ${fileName}`,
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

      showSuccess(`${department} export downloaded: ${fileName}`);
      return {
        success: true,
        fileName,
        size: jsonString.length,
        message: `Downloaded ${fileName} in browser`,
      };
    }
  } catch (err: any) {
    console.error(`Department export failed for ${department}:`, err);
    showError(err?.message || `Failed to export ${department} package`);
    return {
      success: false,
      fileName: 'export_failed.json',
      size: 0,
      message: err?.message || 'Export failed',
    };
  }
}
