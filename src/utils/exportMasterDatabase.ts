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

export interface MasterSyncPackage {
  packageVersion: string;
  packageType: string;
  generatedAt: string;
  generatedBy: {
    senderName: string;
    staffId: string;
    departmentOrStream: string;
    role: string;
  };
  appVersion: string;
  data: {
    learners: any[];
    staff: any[];
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
  };
}

export function generateMasterSyncPackage(senderInfo?: {
  senderName?: string;
  staffId?: string;
  departmentOrStream?: string;
  role?: string;
}): MasterSyncPackage {
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

  const learners = (() => {
    try {
      const map = new Map();
      const candidateKeys = [
        'school_learners_master',
        'munyaka_learners',
        'learners',
        'students',
        'school_learners_v1',
        'munyaka_central_db',
        'school_students_v1',
        'enrolled_learners'
      ];
      for (const key of candidateKeys) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach((l: any) => {
                const id = l?.id || l?.admissionNumber || l?.upi || JSON.stringify(l);
                if (id) map.set(id, l);
              });
            } else if (parsed && typeof parsed === 'object') {
              if (Array.isArray(parsed.students)) {
                parsed.students.forEach((l: any) => {
                  const id = l?.id || l?.admissionNumber || l?.upi || JSON.stringify(l);
                  if (id) map.set(id, l);
                });
              } else if (Array.isArray(parsed.learners)) {
                parsed.learners.forEach((l: any) => {
                  const id = l?.id || l?.admissionNumber || l?.upi || JSON.stringify(l);
                  if (id) map.set(id, l);
                });
              }
            }
          }
        } catch {}
        
        const val = allKeys[key];
        if (Array.isArray(val)) {
          val.forEach((l: any) => {
            const id = l?.id || l?.admissionNumber || l?.upi || JSON.stringify(l);
            if (id) map.set(id, l);
          });
        } else if (val && typeof val === 'object' && Array.isArray(val.students)) {
          val.students.forEach((l: any) => {
            const id = l?.id || l?.admissionNumber || l?.upi || JSON.stringify(l);
            if (id) map.set(id, l);
          });
        }
      }
      const storeLearners = getStoredLearners();
      if (Array.isArray(storeLearners)) {
        storeLearners.forEach((l: any) => {
          const id = l?.id || l?.admissionNumber || l?.upi || JSON.stringify(l);
          if (id) map.set(id, l);
        });
      }
      return Array.from(map.values());
    } catch {
      return [];
    }
  })();

  const staff = (() => {
    try {
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
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach((s: any) => {
                const id = s?.id || s?.staffId || s?.email || JSON.stringify(s);
                if (id) map.set(id, s);
              });
            }
          }
        } catch {}
        const val = allKeys[key];
        if (Array.isArray(val)) {
          val.forEach((s: any) => {
            const id = s?.id || s?.staffId || s?.email || JSON.stringify(s);
            if (id) map.set(id, s);
          });
        }
      }
      return Array.from(map.values());
    } catch {
      return [];
    }
  })();

  const attendance = (() => {
    try {
      const keys = ['munyaka_attendance_records', 'munyaka_attendance', 'roll_call_records', 'attendance', 'attendance_logs'];
      for (const k of keys) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        } catch {}
        if (Array.isArray(allKeys[k]) && allKeys[k].length > 0) return allKeys[k];
      }
      return [];
    } catch {
      return [];
    }
  })();

  const fees = (() => {
    try {
      const keys = [
        'fee_records',
        'fees',
        'munyaka_fees',
        'munyaka_fees_records',
        'fees_data',
        'student_payments',
        'fee_ledgers',
        'transactions',
        'munyaka_fee_ledgers',
        'munyaka_student_payments'
      ];
      for (const k of keys) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) return parsed;
          }
        } catch {}
        const val = allKeys[k];
        if (Array.isArray(val) && val.length > 0) return val;
        if (val && typeof val === 'object' && Object.keys(val).length > 0) return val;
      }
      return [];
    } catch {
      return [];
    }
  })();

  const library = (() => {
    try {
      const keys = ['munyaka_library_books', 'school_library_inventory_v1', 'library_data', 'library', 'books'];
      for (const k of keys) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        } catch {}
        const val = allKeys[k];
        if (Array.isArray(val) && val.length > 0) return val;
      }
      return [];
    } catch {
      return [];
    }
  })();

  const marks = (() => {
    try {
      const keys = ['munyaka_marks_records', 'marked_student_submissions', 'marks'];
      for (const k of keys) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        } catch {}
        if (Array.isArray(allKeys[k]) && allKeys[k].length > 0) return allKeys[k];
      }
      return [];
    } catch {
      return [];
    }
  })();

  const exams = (() => {
    try {
      const keys = ['all_set_exams', 'munyaka_exams', 'exams'];
      for (const k of keys) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        } catch {}
        if (Array.isArray(allKeys[k]) && allKeys[k].length > 0) return allKeys[k];
      }
      return [];
    } catch {
      return [];
    }
  })();

  const streams = (() => {
    try {
      const keys = ['munyaka_streams', 'streams', 'grades_and_streams_config'];
      for (const k of keys) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed) return parsed;
          }
        } catch {}
        if (allKeys[k]) return allKeys[k];
      }
      return [];
    } catch {
      return [];
    }
  })();

  const classAssignments = (() => {
    try {
      return allKeys['munyaka_class_assignments'] || allKeys['classAssignments'] || JSON.parse(localStorage.getItem('munyaka_class_assignments') || '[]');
    } catch {
      return [];
    }
  })();

  const learningAreas = (() => {
    try {
      return allKeys['munyaka_learning_areas'] || allKeys['learningAreas'] || JSON.parse(localStorage.getItem('munyaka_learning_areas') || '[]');
    } catch {
      return [];
    }
  })();

  const examTypes = (() => {
    try {
      return allKeys['munyaka_exam_types'] || allKeys['examTypes'] || JSON.parse(localStorage.getItem('munyaka_exam_types') || '[]');
    } catch {
      return [];
    }
  })();

  const feeStructures = (() => {
    try {
      return allKeys['munyaka_fee_structures'] || allKeys['feeStructures'] || JSON.parse(localStorage.getItem('munyaka_fee_structures') || '[]');
    } catch {
      return [];
    }
  })();

  const notices = (() => {
    try {
      return allKeys['munyaka_notices_board'] || allKeys['munyaka_notices'] || JSON.parse(localStorage.getItem('munyaka_notices_board') || '[]');
    } catch {
      return [];
    }
  })();

  const events = (() => {
    try {
      return allKeys['munyaka_events'] || JSON.parse(localStorage.getItem('munyaka_events') || '[]');
    } catch {
      return [];
    }
  })();

  const ictEquipment = (() => {
    try {
      return allKeys['munyaka_ict_assets'] || allKeys['ictEquipment'] || JSON.parse(localStorage.getItem('munyaka_ict_assets') || '[]');
    } catch {
      return [];
    }
  })();

  const scienceInventory = (() => {
    try {
      return allKeys['munyaka_science_lab'] || allKeys['scienceInventory'] || JSON.parse(localStorage.getItem('munyaka_science_lab') || '[]');
    } catch {
      return [];
    }
  })();

  const storeInventory = (() => {
    try {
      return allKeys['munyaka_store_items'] || allKeys['storeInventory'] || JSON.parse(localStorage.getItem('munyaka_store_items') || '[]');
    } catch {
      return [];
    }
  })();

  const timetable = (() => {
    try {
      return allKeys['munyaka_timetable'] || allKeys['school-timetable-data'] || JSON.parse(localStorage.getItem('munyaka_timetable') || '[]');
    } catch {
      return [];
    }
  })();

  const settings = (() => {
    try {
      return allKeys['munyaka_system_settings_v3'] || allKeys['munyaka_system_settings'] || JSON.parse(localStorage.getItem('munyaka_system_settings_v3') || '{}');
    } catch {
      return {};
    }
  })();

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
      learners: Array.isArray(learners) ? learners : [],
      staff: Array.isArray(staff) ? staff : [],
      attendance: Array.isArray(attendance) ? attendance : [],
      fees: fees || [],
      library: Array.isArray(library) ? library : [],
      marks: Array.isArray(marks) ? marks : [],
      exams: Array.isArray(exams) ? exams : [],
      streams: streams || [],
      classAssignments: classAssignments || [],
      learningAreas: learningAreas || [],
      examTypes: examTypes || [],
      feeStructures: feeStructures || [],
      notices: notices || [],
      events: events || [],
      ictEquipment: ictEquipment || [],
      scienceInventory: scienceInventory || [],
      storeInventory: storeInventory || [],
      timetable: timetable || [],
      settings: settings || {},
    },
  };
}

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
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess(`Master Sync Package downloaded successfully: ${fileName}`);
      return {
        success: true,
        fileName,
        size: jsonString.length,
        message: `Successfully downloaded ${fileName}`,
      };
    }
  } catch (err: any) {
    console.error('Error exporting master sync package:', err);
    showError(err?.message || 'Failed to export master sync package.');
    return {
      success: false,
      fileName: 'munyaka_master_sync_v1.json',
      size: 0,
      message: err?.message || 'Failed to export master sync package.',
    };
  }
}
