import { initializeApplicationStorage } from './storageInit';

export const StorageInitService = {
  init: () => {
    initializeApplicationStorage();
  },
  ensureSeeded: () => {
    initializeApplicationStorage();
  }
};

export default StorageInitService;