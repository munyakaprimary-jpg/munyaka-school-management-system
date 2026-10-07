import { showSuccess, showError } from '@/utils/toast';

export interface MasterImportResult {
  success: boolean;
  message: string;
  updatedKeys: string[];
}

export function validateMasterPackage(pkg: any): boolean {
  if (!pkg || typeof pkg !== 'object') return false;
  if (!pkg.packageType && !pkg.data && !pkg.version && !pkg.exportVersion) return false;
  return true;
}

export async function importMasterSyncPackage(file: File): Promise<MasterImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        
        // Extract payload data supporting multiple nesting styles: parsed.data, parsed.munyaka_learners_db, or root level
        const payloadData = parsed.data || parsed;
        const updatedKeys: string[] = [];

        // 1. Precise extraction of learners array from any possible location in master JSON package
        let extractedLearners: any[] = [];
        if (Array.isArray(payloadData.learners)) {
          extractedLearners = payloadData.learners;
        } else if (Array.isArray(payloadData.munyaka_learners_db)) {
          extractedLearners = payloadData.munyaka_learners_db;
        } else if (Array.isArray(payloadData.school_learners_master)) {
          extractedLearners = payloadData.school_learners_master;
        } else if (Array.isArray(payloadData.school_learners_data)) {
          extractedLearners = payloadData.school_learners_data;
        } else if (Array.isArray(payloadData.munyaka_students)) {
          extractedLearners = payloadData.munyaka_students;
        } else if (Array.isArray(payloadData.students)) {
          extractedLearners = payloadData.students;
        } else if (Array.isArray(parsed.learners)) {
          extractedLearners = parsed.learners;
        } else if (Array.isArray(parsed.munyaka_learners_db)) {
          extractedLearners = parsed.munyaka_learners_db;
        } else {
          // Search any key in payloadData or parsed that is an array containing learner-like items (e.g. has admNo, admissionNo, or name)
          const allCandidateObjects = [payloadData, parsed];
          for (const container of allCandidateObjects) {
            if (container && typeof container === 'object') {
              for (const k of Object.keys(container)) {
                const val = container[k];
                if (Array.isArray(val) && val.length > 0) {
                  // Check if items look like learners
                  const sample = val[0];
                  if (sample && typeof sample === 'object' && (sample.admNo || sample.admissionNo || sample.grade || sample.guardian || (sample.name && sample.id))) {
                    extractedLearners = val;
                    break;
                  }
                }
              }
            }
            if (extractedLearners.length > 0) break;
          }
        }

        console.log(`[MasterImport] Extracted learners count: ${extractedLearners.length}`);

        // 2. Write the full array directly into munyaka_learners_db and all synchronized learner keys
        if (extractedLearners.length > 0) {
          const learnersJson = JSON.stringify(extractedLearners);
          localStorage.setItem('munyaka_learners_db', learnersJson);
          localStorage.setItem('munyaka_central_db', learnersJson);
          localStorage.setItem('school_learners_master', learnersJson);
          localStorage.setItem('school_learners_data', learnersJson);
          localStorage.setItem('munyaka_students', learnersJson);
          localStorage.setItem('students', learnersJson);
          updatedKeys.push('munyaka_learners_db', 'school_learners_master', 'school_learners_data');
        }

        // 3. Iterate and save every other table / key found in the master package
        const recordsToSave = payloadData.data || payloadData;
        if (recordsToSave && typeof recordsToSave === 'object') {
          Object.keys(recordsToSave).forEach(key => {
            if (key === 'learners' || key === 'munyaka_learners_db' || key === 'school_learners_master') return; // already handled
            const val = recordsToSave[key];
            if (val !== undefined && val !== null) {
              try {
                localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
                updatedKeys.push(key);
              } catch (err) {
                console.error(`Failed to store master key ${key}:`, err);
              }
            }
          });
        }

        // Also check root parsed keys if different
        if (parsed && typeof parsed === 'object') {
          Object.keys(parsed).forEach(key => {
            if (key === 'data' || key === 'learners' || key === 'munyaka_learners_db') return;
            const val = parsed[key];
            if (val !== undefined && val !== null && typeof val !== 'function') {
              try {
                localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
                if (!updatedKeys.includes(key)) updatedKeys.push(key);
              } catch (err) {
                console.error(`Failed to store root key ${key}:`, err);
              }
            }
          });
        }

        showSuccess(`Master sync package imported successfully! (${extractedLearners.length} learners loaded). Refreshing dashboard...`);

        // 4. Immediately trigger window.location.reload() upon successful import so dashboard re-initializes from scratch
        setTimeout(() => {
          window.location.reload();
        }, 800);

        resolve({
          success: true,
          message: `Master sync package imported successfully! ${extractedLearners.length} learners synchronized.`,
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
