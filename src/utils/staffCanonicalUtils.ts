/**
 * Canonical Staff ID and Schema Standardization Utility
 * ====================================================
 */

/**
 * Generates a deterministic canonical document ID for a staff record in Firestore.
 * Prefers TSC number, falling back to staffId, email, or name.
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
    const cleanEmail = email.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `staff_email_${cleanEmail}`;
  }

  const name = String(staffRecord.name || staffRecord.fullName || staffRecord.id || 'unnamed').trim().toLowerCase();
  const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `staff_name_${cleanName}`;
}

/**
 * Standardizes a staff record into a flat root schema for Firestore writes.
 * Avoids any nested rawPayload wrapping.
 */
export function toFlatStaffSchema(staff: any): Record<string, any> {
  const canonicalId = getCanonicalStaffId(staff);
  const exactRole = staff.role || staff.category || staff.designation || staff.assignedRole || 'Subject Teacher';
  const accessCode = staff.accessCode || staff.code || staff.pin || staff.tempAccessCode || staff.password || `MUN-${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    id: staff.id || canonicalId,
    canonicalId,
    name: staff.name || staff.fullName || 'Staff Member',
    email: staff.email || '',
    phone: staff.phone || staff.phoneNumber || '',
    category: staff.category || 'Subject Teacher',
    designation: staff.designation || staff.title || staff.category || 'Subject Teacher',
    accessCode,
    code: accessCode,
    password: staff.password || staff.tempAccessCode || accessCode,
    assignedRole: staff.assignedRole || staff.role || staff.rbacRole || 'subject_teacher',
    systemRole: staff.systemRole || staff.rbacRole || 'subject_teacher',
    tscNumber: staff.tscNumber || staff.tsc_number || '',
    nationalId: staff.nationalId || staff.id_no || '',
    allocations: Array.isArray(staff.allocations) ? staff.allocations : [],
    assignedClasses: Array.isArray(staff.assignedClasses) ? staff.assignedClasses : (staff.assignedGrade ? [staff.assignedGrade] : []),
    assignedStreams: Array.isArray(staff.assignedStreams) ? staff.assignedStreams : (staff.assignedStream ? [staff.assignedStream] : []),
    homeroomGrade: staff.homeroomGrade || staff.assignedGrade || '',
    homeroomStream: staff.homeroomStream || staff.assignedStream || '',
    status: staff.status || 'Active',
    loginEnabled: staff.loginEnabled !== false,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Deduplicates a list of staff records by email or tscNumber,
 * preferring canonical/flat records over legacy prefixed records.
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

    const primaryKey = emailKey || tscKey || idKey;
    if (!primaryKey) return;

    if (!map.has(primaryKey)) {
      map.set(primaryKey, staff);
    } else {
      // Merge properties if duplicate exists
      const existing = map.get(primaryKey);
      map.set(primaryKey, {
        ...existing,
        ...staff,
        assignedClasses: staff.assignedClasses?.length ? staff.assignedClasses : existing.assignedClasses,
        assignedStreams: staff.assignedStreams?.length ? staff.assignedStreams : existing.assignedStreams,
        allocations: staff.allocations?.length ? staff.allocations : existing.allocations,
      });
    }
  });

  return Array.from(map.values());
}
