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
  existing.push(newStaff);
  localStorage.setItem('munyaka_staff', JSON.stringify(existing));
  window.dispatchEvent(new CustomEvent('staff-updated', { detail: existing }));
  window.dispatchEvent(new Event('storage'));
};
