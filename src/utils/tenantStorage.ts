/**
 * Utility to isolate localStorage keys based on the currently active tenant.
 */

// Generates an isolated key string: e.g., "tenant_MUNYAKA_learners"
export const getTenantStorageKey = (key: string): string => {
  try {
    const activeTenant = JSON.parse(localStorage.getItem('munyaka_active_tenant') || '{}');
    const tenantCode = activeTenant.code || 'DEFAULT';
    return `tenant_${tenantCode}_${key}`;
  } catch (error) {
    console.error('Failed to resolve active tenant from localStorage:', error);
    return `tenant_DEFAULT_${key}`;
  }
};

// Gets isolated item from localStorage
export const getTenantItem = <T>(key: string, defaultValue: T): T => {
  try {
    const tenantKey = getTenantStorageKey(key);
    const item = localStorage.getItem(tenantKey);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading tenant key "${key}":`, error);
    return defaultValue;
  }
};

// Sets isolated item in localStorage
export const setTenantItem = <T>(key: string, value: T): void => {
  try {
    const tenantKey = getTenantStorageKey(key);
    localStorage.setItem(tenantKey, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing tenant key "${key}":`, error);
  }
};

// Removes isolated item from localStorage
export const removeTenantItem = (key: string): void => {
  try {
    const tenantKey = getTenantStorageKey(key);
    localStorage.removeItem(tenantKey);
  } catch (error) {
    console.error(`Error removing tenant key "${key}":`, error);
  }
};