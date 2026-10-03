import { showSuccess, showError } from '@/utils/toast';

export interface MasterImportResult {
  success: boolean;
  message: string;
  updatedKeys: string[];
}

export function validateMasterPackage(pkg: any): boolean {
  if (!pkg || typeof pkg !== 'object') return false;
  if (!pkg.packageType || pkg.packageType !== 'munyaka_master_sync') {
    // Also accept generic packages or v1 exports
    if (!pkg.data && !pkg.exportVersion) return false;
  }
  return true;
}

export async function importMasterSyncPackage(file: File): Promise<MasterImportResult> {
  try {
    const text = await file.text();
    let pkg: any;
    
    try {
      pkg = JSON.parse(text);
    } catch (parseError) {
      return {
        success: false,
        message: 'Invalid JSON file. Please ensure you are uploading a valid Munyaka Master Sync Package.',
        updatedKeys: []
      };
    }
    
    const data = pkg.data || pkg;
    const updatedKeys: string[] = [];

    // 1. If allStorageSnapshot is present, unpack every harvested key directly into localStorage with quota protection
    if (data.allStorageSnapshot && typeof data.allStorageSnapshot === 'object') {
      // Remove obsolete or redundant temporary keys first to reclaim space
      try {
        localStorage.removeItem('munyaka_temp_export_override');
      } catch {}

      for (const [key, val] of Object.entries(data.allStorageSnapshot)) {
        if (key && val !== undefined) {
          try {
            const stringVal = typeof val === 'string' ? val : JSON.stringify(val);
            localStorage.setItem(key, stringVal);
            if (!updatedKeys.includes(key)) updatedKeys.push(key);
          } catch (err: any) {
            console.warn(`[importMasterSyncPackage] Quota check triggered for snapshot key ${key}:`, err);
            // If quota exceeded, clear non-critical caches and retry once
            if (err?.name === 'QuotaExceededError' || err?.code === 22) {
              try {
                localStorage.removeItem('munyaka_attendance_cache');
                localStorage.removeItem('munyaka_temp_export_override');
                const stringVal = typeof val === 'string' ? val : JSON.stringify(val);
                localStorage.setItem(key, stringVal);
                if (!updatedKeys.includes(key)) updatedKeys.push(key);
              } catch (retryErr) {
                console.error(`[importMasterSyncPackage] Failed to set ${key} even after quota reclaim:`, retryErr);
              }
            }
          }
        }
      }
    }

    // 2. Deep merge / replace learners (ensuring school-wide master keys are updated 100%)
    const incomingLearners = data.learners || data.students || data.school_learners_master;
    if (Array.isArray(incomingLearners) && incomingLearners.length > 0) {
      try {
        const existingRaw = localStorage.getItem('school_learners_master') || localStorage.getItem('munyaka_learners') || '[]';
        const existing = JSON.parse(existingRaw);
        const map = new Map();
        if (Array.isArray(existing)) {
          existing.forEach((l: any) => {
            const id = l.id || l.admissionNumber || l.upi;
            if (id) map.set(id, l);
          });
        }
        incomingLearners.forEach((l: any) => {
          const id = l.id || l.admissionNumber || l.upi;
          if (id) {
            map.set(id, { ...(map.get(id) || {}), ...l });
          } else {
            map.set(Math.random().toString(), l);
          }
        });
        const mergedLearners = Array.from(map.values());
        localStorage.setItem('school_learners_master', JSON.stringify(mergedLearners));
        localStorage.setItem('munyaka_learners', JSON.stringify(mergedLearners));
        localStorage.setItem('school_learners_v1', JSON.stringify(mergedLearners));
        if (!updatedKeys.includes('school_learners_master')) updatedKeys.push('school_learners_master');
        if (!updatedKeys.includes('munyaka_learners')) updatedKeys.push('munyaka_learners');
      } catch (err) {
        console.error('Failed to merge learners:', err);
      }
    }

    // 3. Deep merge / replace staff (ensuring staff_members and directory are updated 100%)
    const incomingStaff = data.staff || data.teachers || data.staff_members;
    if (Array.isArray(incomingStaff) && incomingStaff.length > 0) {
      try {
        const existingRaw = localStorage.getItem('staff_members') || localStorage.getItem('munyaka_staff_directory') || localStorage.getItem('munyaka_staff') || '[]';
        const existing = JSON.parse(existingRaw);
        const map = new Map();
        if (Array.isArray(existing)) {
          existing.forEach((s: any) => {
            const id = s.id || s.staffId || s.email;
            if (id) map.set(id, s);
          });
        }
        incomingStaff.forEach((s: any) => {
          const id = s.id || s.staffId || s.email;
          if (id) {
            map.set(id, { ...(map.get(id) || {}), ...s });
          } else {
            map.set(Math.random().toString(), s);
          }
        });
        const mergedStaff = Array.from(map.values());
        localStorage.setItem('staff_members', JSON.stringify(mergedStaff));
        localStorage.setItem('munyaka_staff_directory', JSON.stringify(mergedStaff));
        localStorage.setItem('munyaka_staff', JSON.stringify(mergedStaff));
        if (!updatedKeys.includes('staff_members')) updatedKeys.push('staff_members');
        if (!updatedKeys.includes('munyaka_staff_directory')) updatedKeys.push('munyaka_staff_directory');
        if (!updatedKeys.includes('munyaka_staff')) updatedKeys.push('munyaka_staff');
      } catch (err) {
        console.error('Failed to merge staff:', err);
      }
    }

    // 4. Map and deep merge other standard data categories
    const categoryMap: Record<string, string> = {
      attendance: 'munyaka_attendance_records',
      fees: 'munyaka_fees_records',
      studentPayments: 'student_payments',
      feeLedgers: 'fee_ledgers',
      library: 'munyaka_library_books',
      marks: 'marked_student_submissions',
      exams: 'all_set_exams',
      streams: 'munyaka_streams',
      classAssignments: 'munyaka_class_assignments',
      learningAreas: 'munyaka_learning_areas',
      examTypes: 'munyaka_exam_types',
      feeStructures: 'munyaka_fee_structures',
      notices: 'munyaka_notices',
      events: 'munyaka_events',
      ictEquipment: 'munyaka_ict_assets',
      scienceInventory: 'munyaka_science_lab',
      storeInventory: 'munyaka_store_items',
      timetable: 'munyaka_timetable',
    };

    for (const [category, storageKey] of Object.entries(categoryMap)) {
      if (data[category] && Array.isArray(data[category])) {
        try {
          const existingRaw = localStorage.getItem(storageKey) || '[]';
          let existing: any[] = [];
          try { existing = JSON.parse(existingRaw); } catch {}
          
          if (Array.isArray(existing) && existing.length > 0) {
            const map = new Map();
            existing.forEach((item: any) => {
              const id = item.id || item.code || item.admissionNumber || JSON.stringify(item);
              map.set(id, item);
            });
            data[category].forEach((item: any) => {
              const id = item.id || item.code || item.admissionNumber || JSON.stringify(item);
              map.set(id, { ...(map.get(id) || {}), ...item });
            });
            const merged = Array.from(map.values());
            localStorage.setItem(storageKey, JSON.stringify(merged));
          } else {
            localStorage.setItem(storageKey, JSON.stringify(data[category]));
          }
          if (!updatedKeys.includes(storageKey)) updatedKeys.push(storageKey);
        } catch (storageError) {
          console.error(`Failed to update ${storageKey}:`, storageError);
        }
      }
    }

    if (data.settings && typeof data.settings === 'object') {
      try {
        localStorage.setItem('munyaka_system_settings_v3', JSON.stringify(data.settings));
        if (!updatedKeys.includes('munyaka_system_settings_v3')) updatedKeys.push('munyaka_system_settings_v3');
      } catch {}
    }

    // Update central database store
    if (incomingLearners && Array.isArray(incomingLearners)) {
      try {
        const central = JSON.parse(localStorage.getItem('munyaka_central_db') || '{}');
        central.students = incomingLearners;
        localStorage.setItem('munyaka_central_db', JSON.stringify(central));
        if (!updatedKeys.includes('munyaka_central_db')) updatedKeys.push('munyaka_central_db');
      } catch {}
    }

    // Trigger refresh events to notify subscribers
    try {
      window.dispatchEvent(new Event('students-updated'));
      window.dispatchEvent(new Event('munyaka:data-changed'));
      window.dispatchEvent(new CustomEvent('munyaka:master-sync-imported', { 
        detail: { 
          schoolName: pkg.schoolName || pkg.generatedBy?.senderName || 'School Hub',
          generatedAt: pkg.generatedAt || new Date().toISOString(),
          updatedKeys 
        } 
      }));
    } catch (dispatchError) {
      console.warn('Failed to dispatch refresh events:', dispatchError);
    }

    return {
      success: true,
      message: `Master sync package imported successfully! Merged ${updatedKeys.length} categories across learners, staff, and records.`,
      updatedKeys
    };

  } catch (error: any) {
    console.error('Master sync package import failed:', error);
    return {
      success: false,
      message: error?.message || 'An unexpected error occurred during import.',
      updatedKeys: []
    };
  }
}
