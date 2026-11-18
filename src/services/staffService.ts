import { getCanonicalStaffId, toFlatStaffSchema, deduplicateStaffRecords } from '@/utils/staffCanonicalUtils';

export const deduplicateStaff = (list: any[]) => {
  const seen = new Set();
  const result: any[] = [];
  const sorted = [...(list || [])].sort((a, b) => {
    const aIsFlat = a && !a.rawPayload ? 1 : 0;
    const bIsFlat = b && !b.rawPayload ? 1 : 0;
    if (aIsFlat !== bIsFlat) return bIsFlat - aIsFlat;
    const aKey = (a?.email || a?.fullName || a?.name || '').trim().toLowerCase();
    const bKey = (b?.email || b?.fullName || b?.name || '').trim().toLowerCase();
    return String(aKey).localeCompare(String(bKey));
  });
  for (const staff of sorted) {
    if (!staff) continue;
    const key = (staff.email || staff.fullName || staff.name || '').trim().toLowerCase();
    if (!key) {
      result.push(staff);
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(staff);
  }
  return result;
};

export const getStoredStaff = () => {
  try {
    const raw = localStorage.getItem('munyaka_staff');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const clean = deduplicateStaff(Array.isArray(parsed) ? parsed : []);
    localStorage.setItem('munyaka_staff', JSON.stringify(clean));
    return clean;
  } catch {
    return [];
  }
};

export const saveStaffMember = (newStaff: any) => {
  const existing = getStoredStaff();
  const newKey = (newStaff.email || newStaff.fullName || newStaff.name || '').trim().toLowerCase();
  const idx = existing.findIndex((s: any) => {
    const sKey = (s.email || s.fullName || s.name || '').trim().toLowerCase();
    return (s.id && newStaff.id && s.id === newStaff.id) ||
           (s.accessCode && newStaff.accessCode && s.accessCode === newStaff.accessCode) ||
           (newKey && sKey === newKey);
  });
  if (idx >= 0) {
    existing[idx] = { ...existing[idx], ...newStaff };
  } else {
    existing.push(newStaff);
  }
  const clean = deduplicateStaff(existing);
  localStorage.setItem('munyaka_staff', JSON.stringify(clean));
  localStorage.setItem('munyaka_staff_backup', JSON.stringify(clean));
  window.dispatchEvent(new CustomEvent('staff-updated', { detail: clean }));
  window.dispatchEvent(new Event('storage'));
};
