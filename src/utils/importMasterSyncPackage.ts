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
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const payloadData = parsed.data || parsed; // support both formats
        
        const updatedKeys: string[] = [];
        
        // Iterate and save every table directly to localStorage
        Object.keys(payloadData).forEach(key => {
          const val = payloadData[key];
          if (Array.isArray(val) || (val && typeof val === 'object')) {
            try {
              localStorage.setItem(key, JSON.stringify(val));
              updatedKeys.push(key);
            } catch (err) {
              console.error(`Failed to store key ${key}:`, err);
            }
          }
        });

        // Also map standard keys to ensure compatibility with all views
        if (Array.isArray(payloadData.learners)) {
          localStorage.setItem('school_learners_master', JSON.stringify(payloadData.learners));
          localStorage.setItem('munyaka_learners', JSON.stringify(payloadData.learners));
        }
        if (Array.isArray(payloadData.staff)) {
          localStorage.setItem('staff_members', JSON.stringify(payloadData.staff));
          localStorage.setItem('munyaka_staff_directory', JSON.stringify(payloadData.staff));
        }
        if (Array.isArray(payloadData.fees)) {
          localStorage.setItem('fee_records', JSON.stringify(payloadData.fees));
        }
        if (Array.isArray(payloadData.attendance)) {
          localStorage.setItem('munyaka_attendance_records', JSON.stringify(payloadData.attendance));
        }
        if (Array.isArray(payloadData.marks)) {
          localStorage.setItem('munyaka_marks_records', JSON.stringify(payloadData.marks));
        }
        if (Array.isArray(payloadData.exams)) {
          localStorage.setItem('all_set_exams', JSON.stringify(payloadData.exams));
        }
        if (Array.isArray(payloadData.library)) {
          localStorage.setItem('munyaka_library_books', JSON.stringify(payloadData.library));
        }
        if (Array.isArray(payloadData.inventory)) {
          localStorage.setItem('munyaka_store_items', JSON.stringify(payloadData.inventory));
        }
        if (Array.isArray(payloadData.streams)) {
          localStorage.setItem('munyaka_streams', JSON.stringify(payloadData.streams));
        }
        if (payloadData.settings && typeof payloadData.settings === 'object') {
          localStorage.setItem('munyaka_system_settings', JSON.stringify(payloadData.settings));
        }

        showSuccess('Master sync package imported successfully! Refreshing app...');
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);

        resolve({
          success: true,
          message: 'Master sync package imported successfully!',
          updatedKeys
        });
      } catch (err: any) {
        console.error('Failed to parse master sync package:', err);
        showError('Error importing package. Invalid JSON file format.');
        resolve({
          success: false,
          message: 'Error importing package. Invalid JSON file format.',
          updatedKeys: []
        });
      }
    };
    reader.onerror = () => {
      showError('Failed to read the uploaded file.');
      resolve({
        success: false,
        message: 'Failed to read the uploaded file.',
        updatedKeys: []
      });
    };
    reader.readAsText(file);
  });
}
