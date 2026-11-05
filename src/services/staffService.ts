export const getStoredStaff = () => {
  try {
    const keys = ['munyaka_staff', 'munyaka_staff_backup', 'munyaka_staff_directory', 'munyaka_staff_db', 'staff_list', 'staff'];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error('Error in getStoredStaff:', e);
  }
  return [];
};

export const saveStaffMember = (newStaff: any) => {
  const existing = getStoredStaff();
  // Avoid duplicates if ID already exists
  const idx = existing.findIndex((s: any) => s.id === newStaff.id || (s.accessCode && s.accessCode === newStaff.accessCode));
  if (idx >= 0) {
    existing[idx] = { ...existing[idx], ...newStaff };
  } else {
    existing.push(newStaff);
  }

  localStorage.setItem('munyaka_staff', JSON.stringify(existing));
  localStorage.setItem('munyaka_staff_backup', JSON.stringify(existing));
  localStorage.setItem('munyaka_staff_directory', JSON.stringify(existing));
  
  window.dispatchEvent(new CustomEvent('staff-updated', { detail: existing }));
  window.dispatchEvent(new Event('storage'));
};
