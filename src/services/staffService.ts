export const getStoredStaff = () => {
  try {
    const raw = localStorage.getItem('munyaka_staff');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveStaffMember = (newStaff: any) => {
  const existing = getStoredStaff();
  const idx = existing.findIndex((s: any) => s.id === newStaff.id || (s.accessCode && s.accessCode === newStaff.accessCode));
  if (idx >= 0) {
    existing[idx] = { ...existing[idx], ...newStaff };
  } else {
    existing.push(newStaff);
  }
  localStorage.setItem('munyaka_staff', JSON.stringify(existing));
  localStorage.setItem('munyaka_staff_backup', JSON.stringify(existing));
  window.dispatchEvent(new CustomEvent('staff-updated', { detail: existing }));
  window.dispatchEvent(new Event('storage'));
};
