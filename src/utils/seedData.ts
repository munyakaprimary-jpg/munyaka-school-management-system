/**
 * Mock Data Initializer for Munyaka Portal local storage.
 * Seeds default staff accounts and personnel records if empty.
 */

export interface SeedStaffMember {
  id: string;
  staffId: string;
  name: string;
  email: string;
  registeredEmail: string;
  tscNo?: string;
  tscNumber?: string;
  accessCode: string;
  tempAccessCode: string;
  password: string;
  systemRole: string;
  role: string;
  phone?: string;
}

export const DEFAULT_SEED_STAFF: SeedStaffMember[] = [
  {
    id: 'STF-1001',
    staffId: 'MUNYAKA-1001',
    name: 'Grace Njeri',
    email: 'grace.njeri@munyaka.sc.ke',
    registeredEmail: 'grace.njeri@munyaka.sc.ke',
    tscNo: 'TSC1001',
    tscNumber: 'TSC1001',
    accessCode: 'MUNYAKA2026',
    tempAccessCode: 'MUNYAKA2026',
    password: 'MUNYAKA2026',
    systemRole: 'head_teacher',
    role: 'head_teacher',
    phone: '+254712345678'
  },
  {
    id: 'STF-5721',
    staffId: 'MUNYAKA-5721',
    name: 'Mary Wanjiku',
    email: 'mary.wanjiku@munyaka.sc.ke',
    registeredEmail: 'mary.wanjiku@munyaka.sc.ke',
    tscNo: 'TSC5721',
    tscNumber: 'TSC5721',
    accessCode: 'MUNYAKA2026',
    tempAccessCode: 'MUNYAKA2026',
    password: 'MUNYAKA2026',
    systemRole: 'teacher',
    role: 'teacher',
    phone: '+254722334455'
  },
  {
    id: 'STF-4005',
    staffId: 'MUNYAKA-4005',
    name: 'David Kiprotich',
    email: 'david.kiprotich@munyaka.sc.ke',
    registeredEmail: 'david.kiprotich@munyaka.sc.ke',
    accessCode: 'MUNYAKA2026',
    tempAccessCode: 'MUNYAKA2026',
    password: 'MUNYAKA2026',
    systemRole: 'support',
    role: 'support',
    phone: '+254733445566'
  },
  {
    id: 'STF-4006',
    staffId: 'MUNYAKA-4006',
    name: 'Mary Juma',
    email: 'maryjuma@munyaka.ac.ke',
    registeredEmail: 'maryjuma@munyaka.ac.ke',
    accessCode: 'MUNYAKA2026',
    tempAccessCode: 'MUNYAKA2026',
    password: 'MUNYAKA2026',
    systemRole: 'librarian',
    role: 'librarian',
    phone: '+254744556677'
  }
];

export function initializeSeedData(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const keysToInitialize = [
    'munyaka_staff',
    'munyaka_personnel',
    'munyaka_staff_directory',
    'munyaka_staff_prereg'
  ];

  for (const key of keysToInitialize) {
    try {
      const existing = localStorage.getItem(key);
      let parsed = [];
      if (existing) {
        try {
          parsed = JSON.parse(existing);
        } catch {
          parsed = [];
        }
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(key, JSON.stringify(DEFAULT_SEED_STAFF));
        console.info(`[seedData] Initialized ${key} with default Munyaka staff accounts.`);
      }
    } catch (err) {
      console.error(`[seedData] Failed to seed ${key}:`, err);
    }
  }
}
