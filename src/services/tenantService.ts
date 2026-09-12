import React from 'react';

export interface Tenant {
  id: string;
  name: string;
  code: string;
  establishedYear: string;
  location: string;
  tier: 'Starter' | 'Enterprise';
  currentSeats: number;
  maxSeats: number;
  storageKey: string;
  licenseStatus: 'Active' | 'Grace Period' | 'Suspended';
  lastSync: string;
  adminName: string;
  adminEmail: string;
  isolationMethod: 'Isolated SQLite DB' | 'Local Namespace';
}

export const STORAGE_KEY_TENANTS = 'munyaka_platform_tenants';
export const STORAGE_KEY_ACTIVE_TENANT = 'munyaka_active_developer_tenant_code';

export const DEFAULT_TENANTS: Tenant[] = [
  {
    id: 't-1',
    name: 'Munyaka Primary & Junior Secondary',
    code: 'MUNYAKA-PRIMARY',
    establishedYear: '1998',
    location: 'Eldoret, Uasin Gishu',
    tier: 'Enterprise',
    currentSeats: 850,
    maxSeats: 1200,
    storageKey: 'tenant_db_munyaka',
    licenseStatus: 'Active',
    lastSync: '2 mins ago',
    adminName: 'Director Koech',
    adminEmail: 'koech@munyaka.ac.ke',
    isolationMethod: 'Isolated SQLite DB',
  },
  {
    id: 't-2',
    name: 'St. Teresa Academy',
    code: 'ST-TERESA',
    establishedYear: '1991',
    location: 'Nairobi, Westlands',
    tier: 'Enterprise',
    currentSeats: 1100,
    maxSeats: 1500,
    storageKey: 'tenant_db_st_teresa',
    licenseStatus: 'Active',
    lastSync: '15 mins ago',
    adminName: 'Principal Wanjiku',
    adminEmail: 'admin@stteresa.ac.ke',
    isolationMethod: 'Isolated SQLite DB',
  },
  {
    id: 't-3',
    name: 'Greenfields Junior School',
    code: 'GREENFIELDS',
    establishedYear: '2012',
    location: 'Nakuru, Milimani',
    tier: 'Starter',
    currentSeats: 350,
    maxSeats: 500,
    storageKey: 'tenant_db_greenfields',
    licenseStatus: 'Grace Period',
    lastSync: '3 hours ago',
    adminName: 'Manager Omondi',
    adminEmail: 'info@greenfields.ac.ke',
    isolationMethod: 'Local Namespace',
  },
  {
    id: 't-4',
    name: 'Bahati Integrated School',
    code: 'BAHATI-INT',
    establishedYear: '2015',
    location: 'Nakuru North',
    tier: 'Starter',
    currentSeats: 550,
    maxSeats: 600,
    storageKey: 'tenant_db_bahati',
    licenseStatus: 'Active',
    lastSync: 'Just now',
    adminName: 'Headteacher Chebet',
    adminEmail: 'chebet@bahati.ac.ke',
    isolationMethod: 'Local Namespace',
  },
];

export function getTenants(): Tenant[] {
  if (typeof window === 'undefined') return DEFAULT_TENANTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_TENANTS);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY_TENANTS, JSON.stringify(DEFAULT_TENANTS));
      return DEFAULT_TENANTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_TENANTS;
  }
}

export function saveTenants(tenants: Tenant[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY_TENANTS, JSON.stringify(tenants));
}

export function getActiveTenantCode(): string {
  if (typeof window === 'undefined') return 'MUNYAKA-PRIMARY';
  return window.localStorage.getItem(STORAGE_KEY_ACTIVE_TENANT) || 'MUNYAKA-PRIMARY';
}

export function setActiveTenantCode(code: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY_ACTIVE_TENANT, code);
}

export function getActiveTenant(): Tenant {
  const tenants = getTenants();
  const code = getActiveTenantCode();
  const found = tenants.find(t => t.code === code);
  return found || tenants[0] || DEFAULT_TENANTS[0];
}

export function getTenantStorageKey(baseKey: string): string {
  const active = getActiveTenant();
  return `tenant_data_${active.code.toLowerCase().replace(/-/g, '_')}_${baseKey}`;
}
