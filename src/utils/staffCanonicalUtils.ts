/**
 * Canonical Staff ID and Schema Standardization Utility
 * ====================================================
 * 
 * This module provides:
 * 1. getCanonicalStaffId() - deterministic document ID generation
 * 2. toFlatStaffSchema() - flat root schema for Firestore writes
 * 3. deduplicateStaffRecords() - backward-compatible dedup with legacy support
 */

/**
 * Generates a deterministic canonical document ID for a staff record in Firestore.
 * Prefers TSC number, falling back to staffId, email, or name.
 * Always returns format: staff_tsc_XXX, staff_id_XXX, staff_email_XXX, or staff_name_XXX
 */
export function getCanonicalStaffId(staffRecord: {
  tscNumber?: string;
  tsc_number?: string;
  staffId?: string;
  staff_id?: string;
  email?: string;
  name?: string;
  fullName?: string;
  id?: string;
}): string {
  const tsc = String(staffRecord.tscNumber || staffRecord.tsc_number || '').trim().toUpperCase();
  if (tsc && tsc !== 'N/A' && tsc !== 'PENDING') {
    const cleanTsc = tsc.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `staff_tsc_${cleanTsc}`;
  }

  const staffId = String(staffRecord.staffId || staffRecord.staff_id || '').trim().toUpperCase();
  if (staffId && staffId !== 'N/A') {
    const cleanId = staffId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `staff_id_${cleanId}`;
  }

  const email = String(staffRecord.email || '').trim().toLowerCase();
  if (email) {
    const cleanEmail = email.replace(/[^a-zA-Z0-9_.-]/g, '_');
    return `staff_email_${cleanEmail}`;
  }

  const name = String(staffRecord.name || staffRecord.fullName || staffRecord.id || 'unnamed').trim().toLowerCase();
  const cleanName = name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  return `staff_name_${cleanName}`;
}

/**
 * Standardizes a staff record into a flat root schema for Firestore writes.
 * All core fields are written directly at the root level - NO nested rawPayload wrapping.
 * Uses merge: true to preserve existing data.
 */
export function toFlatStaffSchema(staff: any): Record<string, any> {
  const canonicalId = getCanonicalStaffId(staff);
  const exactRole = staff.role || staff.category || staff.designation || staff.assignedRole || 'Subject Teacher';
  const accessCode = staff.accessCode || staff.code || staff.pin || staff.tempAccessCode || `MUN-${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    // Core canonical ID
    id: staff.id || canonicalId,
    canonicalId,

    // Root-level flat schema fields (NO rawPayload wrapper)
    name: staff.name || staff.fullName || 'Staff Member',
    email: staff.email || '',
    phone: staff.phone || staff.phoneNumber || '',
    category: staff.category || 'Subject Teacher',
    designation: staff.designation || staff.title || staff.category || 'Subject Teacher',
    accessCode,
    code: accessCode,
    password: staff.password || staff.tempAccessCode || accessCode,

    // Role & system fields
    assignedRole: staff.assignedRole || staff.role || staff.rbacRole || 'subject_teacher',
    systemRole: staff.systemRole || staff.rbacRole || 'subject_teacher',
    tscNumber: staff.tscNumber || staff.tsc_number || '',
    nationalId: staff.nationalId || staff.id_no || '',

    // Assignment data (flat arrays, no nesting)
    allocations: Array.isArray(staff.allocations) ? staff.allocations : [],
    assignedClasses: Array.isArray(staff.assignedClasses) ? staff.assignedClasses : (staff.assignedGrade ? [staff.assignedGrade] : []),
    assignedStreams: Array.isArray(staff.assignedStreams) ? staff.assignedStreams : (staff.assignedStream ? [staff.assignedStream] : []),

    // Homeroom data
    homeroomGrade: staff.homeroomGrade || staff.assignedGrade || '',
    homeroomStream: staff.homeroomStream || staff.assignedStream || '',

    // Status & metadata
    status: staff.status || 'Active',
    loginEnabled: staff.loginEnabled !== false,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Deduplicates a list of staff records by email or tscNumber,
 * preferring canonical/flat records over legacy prefixed documents.
 * Merges properties when duplicates are found.
 */
export function deduplicateStaffRecords(list: any[]): any[] {
  const map = new Map<string, any>();

  // Sort to prioritize flat records over legacy rawPayload-wrapped or duplicate prefixed docs
  const sorted = [...list].sort((a, b) => {
    const aIsFlat = a && !a.rawPayload ? 1 : 0;
    const bIsFlat = b && !b.rawPayload ? 1 : 0;
    return bIsFlat - aIsFlat;
  });

  sorted.forEach(staff => {
    if (!staff) return;

    const emailKey = String(staff.email || '').trim().toLowerCase();
    const tscKey = String(staff.tscNumber || staff.tsc_number || '').trim().toUpperCase();
    const idKey = String(staff.id || staff.staffId || staff.staff_id || '').trim();

    // Use the first available canonical key
    const primaryKey = emailKey || tscKey || idKey;
    if (!primaryKey) return;

    if (!map.has(primaryKey)) {
      map.set(primaryKey, staff);
    } else {
      // Merge properties if duplicate exists, preferring flat record data
      const existing = map.get(primaryKey);
      map.set(primaryKey, {
        ...existing,
        ...staff,
        assignedClasses: staff.assignedClasses?.length ? staff.assignedClasses : existing.assignedClasses,
        assignedStreams: staff.assignedStreams?.length ? staff.assignedStreams : existing.assignedStreams,
        allocations: staff.allocations?.length ? staff.allocations : existing.allocations,
        category: staff.category || existing.category,
        role: staff.role || existing.role,
        systemRole: staff.systemRole || existing.systemRole,
      });
    }
  });

  return Array.from(map.values());
}