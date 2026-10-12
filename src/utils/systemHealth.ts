/**
 * System Integrity Diagnostic Utility
 * Calculates real-time system health score based on localStorage state
 */

export const calculateSystemIntegrity = (): { score: number; statusText: string; isSecure: boolean } => {
  let score = 0;

  // Check 1: Master Database Existence (25 Points)
  const masterData = localStorage.getItem('munyaka_central_db');
  if (masterData) {
    score += 25;
  }

  // Check 2: Legacy Cache Purge Status (25 Points)
  const legacyKeys = ['munyaka_master_staff_list', 'munyaka_staff', 'munyaka_backup_staff'];
  const hasLegacyKeys = legacyKeys.some(key => localStorage.getItem(key) !== null);
  if (!hasLegacyKeys) {
    score += 25;
  }

  // Check 3: Staff Record Validity & Schema Integrity (25 Points)
  if (masterData) {
    try {
      const parsed = JSON.parse(masterData);
      const staff = parsed.staff || [];
      if (staff.length > 0) {
        const validStaff = staff.filter((s: any) => s.id && s.email && s.name);
        if (validStaff.length === staff.length) {
          score += 25;
        }
      } else {
        score += 25; // Clean empty state is valid
      }
    } catch {
      // JSON parse error fails this check
    }
  }

  // Check 4: Storage Quota Availability (25 Points)
  if (masterData && masterData.length < 4500000) { // Under 4.5MB threshold
    score += 25;
  }

  // Format Status Messages
  let statusText = "Offline Master DB Synced";
  if (hasLegacyKeys) {
    statusText = "Legacy Cache Detected";
  } else if (score < 100) {
    statusText = "Sync Optimization Needed";
  }

  return {
    score,
    statusText,
    isSecure: score === 100
  };
};