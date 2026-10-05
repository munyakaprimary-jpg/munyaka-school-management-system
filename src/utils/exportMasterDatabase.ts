import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { showSuccess, showError } from '@/utils/toast';

export interface MasterExportResult {
  success: boolean;
  filePath?: string;
  fileName: string;
  size: number;
  message: string;
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
  // 1. Guaranteed variable scoping for all requested tables
  let learners: any[] = [];
  let staff: any[] = [];
  let attendance: any[] = [];
  let fees: any[] = [];
  let library: any[] = [];
  let marks: any[] = [];
  let exams: any[] = [];
  let streams: any[] = [];
  let classAssignments: any[] = [];
  let learningAreas: any[] = [];
  let examTypes: any[] = [];
  let feeStructures: any[] = [];
  let notices: any[] = [];
  let events: any[] = [];
  let ictEquipment: any[] = [];
  let scienceInventory: any[] = [];
  let storeInventory: any[] = [];
  let timetable: any[] = [];
  let settings: Record<string, any> = {};

  try {
    // 2. Pure live localStorage queries without any hardcoded fallback templates or fake mock objects
    const getStorageArray = (...keys: string[]): any[] => {
      for (const key of keys) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            if (parsed && typeof parsed === 'object' && Array.isArray(parsed.students)) return parsed.students;
            if (parsed && typeof parsed === 'object' && Array.isArray(parsed.learners)) return parsed.learners;
            if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
              // If it's a map or single object container, wrap in array if needed or return
              return [parsed];
            }
          }
        } catch {}
      }
      return [];
    };

    const getStorageObjectOrArray = (...keys: string[]): any => {
      for (const key of keys) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed !== null && parsed !== undefined) return parsed;
          }
        } catch {}
      }
      return [];
    };

    learners = getStorageArray('school_learners_master', 'munyaka_learners', 'learners', 'students', 'school_learners_v1', 'munyaka_central_db', 'school_students_v1');
    staff = getStorageArray('staff_members', 'munyaka_staff_directory', 'munyaka_master_staff_list', 'munyaka_staff', 'staff', 'school_staff_master');
    attendance = getStorageArray('munyaka_attendance_records', 'munyaka_attendance', 'roll_call_records', 'attendance', 'attendance_logs');
    fees = getStorageArray('fee_records', 'fees', 'munyaka_fees', 'munyaka_fees_records', 'fees_data', 'student_payments', 'fee_ledgers', 'transactions');
    library = getStorageArray('munyaka_library_books', 'school_library_inventory_v1', 'library_data', 'library', 'books');
    marks = getStorageArray('munyaka_marks_records', 'marked_student_submissions', 'marks');
    exams = getStorageArray('all_set_exams', 'munyaka_exams', 'exams');
    streams = getStorageArray('munyaka_streams', 'streams', 'grades_and_streams_config');
    classAssignments = getStorageArray('munyaka_class_assignments', 'classAssignments');
    learningAreas = getStorageArray('munyaka_learning_areas', 'learningAreas');
    examTypes = getStorageArray('munyaka_exam_types', 'examTypes');
    feeStructures = getStorageArray('munyaka_fee_structures', 'feeStructures');
    notices = getStorageArray('munyaka_notices_board', 'munyaka_notices');
    events = getStorageArray('munyaka_events');
    ictEquipment = getStorageArray('munyaka_ict_assets', 'ictEquipment');
    scienceInventory = getStorageArray('munyaka_science_lab', 'scienceInventory');
    storeInventory = getStorageArray('munyaka_store_items', 'storeInventory');
    timetable = getStorageArray('munyaka_timetable', 'school-timetable-data');
    settings = getStorageObjectOrArray('munyaka_system_settings_v3', 'munyaka_system_settings');
  } catch (err) {
    console.error('Error reading localStorage for master sync package:', err);
  }

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
      fees: Array.isArray(fees) ? fees : (fees ? [fees] : []),
      library: Array.isArray(library) ? library : [],
      marks: Array.isArray(marks) ? marks : [],
      exams: Array.isArray(exams) ? exams : [],
      streams: Array.isArray(streams) ? streams : (streams ? [streams] : []),
      classAssignments: Array.isArray(classAssignments) ? classAssignments : [],
      learningAreas: Array.isArray(learningAreas) ? learningAreas : [],
      examTypes: Array.isArray(examTypes) ? examTypes : [],
      feeStructures: Array.isArray(feeStructures) ? feeStructures : [],
      notices: Array.isArray(notices) ? notices : [],
      events: Array.isArray(events) ? events : [],
      ictEquipment: Array.isArray(ictEquipment) ? ictEquipment : [],
      scienceInventory: Array.isArray(scienceInventory) ? scienceInventory : [],
      storeInventory: Array.isArray(storeInventory) ? storeInventory : [],
      timetable: Array.isArray(timetable) ? timetable : [],
      settings: settings && typeof settings === 'object' ? settings : {},
    },
  };
}

export const exportMasterSyncPackage = () => {
  try {
    const allData: Record<string, any> = {};
    
    // Loop through all keys present in browser/device storage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const rawValue = localStorage.getItem(key);
        try {
          // Parse JSON if valid, otherwise store as raw string
          allData[key] = rawValue ? JSON.parse(rawValue) : null;
        } catch {
          allData[key] = rawValue;
        }
      }
    }

    const masterPayload = {
      version: "3.0",
      timestamp: new Date().toISOString(),
      school: "Munyaka Primary and Junior School",
      institution: "Munyaka Primary and Junior School",
      totalKeysCaptured: Object.keys(allData).length,
      data: allData
    };

    console.log("Master Sync Bundled Records:", Object.keys(masterPayload.data).reduce((acc, key) => {
      const val = masterPayload.data[key];
      acc[key] = Array.isArray(val) ? val.length : (val && typeof val === 'object' ? Object.keys(val).length : 1);
      return acc;
    }, {} as Record<string, number>));

    const blob = new Blob([JSON.stringify(masterPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Munyaka_Master_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Full export failed:", error);
    alert("Failed to export complete database.");
  }
};

export const exportMasterDatabase = exportMasterSyncPackage;
