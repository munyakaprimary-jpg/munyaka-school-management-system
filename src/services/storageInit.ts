import { initialSeedData } from '../data/initialSeedData';

export const initializeApplicationStorage = (): void => {
  const seedMappings = [
    { key: 'munyaka_learners', data: initialSeedData.students },
    { key: 'munyaka_students', data: initialSeedData.students },
    { key: 'munyaka_exams', data: initialSeedData.exams || [] },
    { key: 'munyaka_library', data: initialSeedData.libraryBooks || [] },
    { key: 'munyaka_finances', data: initialSeedData.transactions || [] }
  ];

  seedMappings.forEach(({ key, data }) => {
    const existing = localStorage.getItem(key);
    if (!existing) {
      localStorage.setItem(key, JSON.stringify(data));
      return;
    }
    try {
      const parsed = JSON.parse(existing);
      // Re-seed ONLY if storage was cleared or set to an empty array
      if (Array.isArray(parsed) && parsed.length === 0 && data.length > 0) {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch {
      localStorage.setItem(key, JSON.stringify(data));
    }
  });
};

export default initializeApplicationStorage;