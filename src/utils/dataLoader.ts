export const getNormalizedLearners = () => {
  try {
    const raw = localStorage.getItem('munyaka_learners_v2');
    let learners = [];
    if (raw) {
      learners = JSON.parse(raw);
    }
    
    if (!Array.isArray(learners) || learners.length === 0) {
      // Fallback to central data service / seed data or legacy keys if empty
      const legacyRaw = localStorage.getItem('school_learners_data') || localStorage.getItem('munyaka_students');
      if (legacyRaw) {
        try {
          const parsedLegacy = JSON.parse(legacyRaw);
          if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
            learners = parsedLegacy;
          }
        } catch {}
      }
    }

    const rawDeleted = localStorage.getItem('deleted_learner_ids');
    const deletedIds: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];

    // Deduplicate by ID / admissionNo / admission_number
    const uniqueLearnersMap = new Map();
    learners.forEach((l: any) => {
      if (!l) return;
      const key = String(l.id || l.admissionNo || l.admission_number || l.admNo || '').trim();
      if (key && !deletedIds.includes(key)) {
        uniqueLearnersMap.set(key, l);
      } else if (!key && l.name) {
        uniqueLearnersMap.set(String(l.name).trim().toLowerCase(), l);
      }
    });
    
    return Array.from(uniqueLearnersMap.values());
  } catch (e) {
    console.error("Error reading learners:", e);
    return [];
  }
};

export const getActiveStaff = () => {
  try {
    const keys = ['munyaka_staff_db', 'munyaka_staff_master_v1', 'munyaka_staff_directory', 'munyaka_master_staff_list', 'munyaka_staff', 'staff_members', 'staff'];
    let users: any[] = [];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          users = parsed;
          break;
        }
      }
    }
    if (users.length === 0) {
      // Fallback to initial seed staff if localStorage is empty
      // We can import or read from initialSeedData if available, or return empty array
    }
    return users;
  } catch {
    return [];
  }
};
