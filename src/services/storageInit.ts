/**
 * Storage initialization service.
 *
 * DISABLED: No automatic seeding from initialSeedData. When storage is empty,
 * state stays strictly as [] (pure empty state).
 */

export const initializeApplicationStorage = (): void => {
  // Deliberately empty - no seeding from initialSeedData
};

export const StorageInitService = {
  init: () => {},
  ensureSeeded: () => {},
};

export default initializeApplicationStorage;