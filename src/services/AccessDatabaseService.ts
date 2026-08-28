import { School, MonthlyCode, UserAccount, UserRole } from '@/types/auth-roles';

const SCHOOLS_KEY = 'munyaka_db_schools';
const CODES_KEY = 'munyaka_db_monthly_codes';
const USERS_KEY = 'munyaka_db_users';
const CURRENT_USER_KEY = 'munyaka_session';

// Helper to compute expiration at 11:59:59 PM on the last day of a month (MM-YYYY)
export const computeMonthExpiration = (monthYear: string): string => {
  // monthYear format: "MM-YYYY" e.g., "08-2026"
  const [mm, yyyy] = monthYear.split('-');
  const month = parseInt(mm, 10);
  const year = parseInt(yyyy, 10);
  
  // Last day of month is day 0 of next month
  const lastDayDate = new Date(year, month, 0, 23, 59, 59, 999);
  return lastDayDate.toISOString();
};

export const generateMonthlyCodeString = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  let randomPart2 = '';
  for (let i = 0; i < 4; i++) {
    randomPart2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MUNY-${randomPart}-${randomPart2}`;
};

export const initializeDatabaseStorage = () => {
  // 1. Schools
  if (!localStorage.getItem(SCHOOLS_KEY)) {
    const defaultSchools: School[] = [
      {
        id: 'school-main-01',
        school_name: 'Munyaka Primary & Junior Secondary School',
        contact_email: 'munyakaprimary@gmail.com',
        subscription_status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'school-west-02',
        school_name: 'Eldoret West Academy',
        contact_email: 'westacademy@gmail.com',
        subscription_status: 'unpaid',
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(SCHOOLS_KEY, JSON.stringify(defaultSchools));
  }

  // 2. Monthly Codes
  if (!localStorage.getItem(CODES_KEY)) {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = now.getFullYear();
    const monthYear = `${currentMonth}-${currentYear}`;
    const expires = computeMonthExpiration(monthYear);

    const defaultCodes: MonthlyCode[] = [
      {
        id: `code-${Date.now()}-1`,
        school_id: 'school-main-01',
        code: 'MUNY-89X2-7A9B',
        month_year: monthYear,
        created_at: new Date().toISOString(),
        expires_at: expires
      },
      {
        id: `code-${Date.now()}-2`,
        school_id: 'school-west-02',
        code: 'MUNY-WST2-4K9L',
        month_year: monthYear,
        created_at: new Date().toISOString(),
        expires_at: expires
      }
    ];
    localStorage.setItem(CODES_KEY, JSON.stringify(defaultCodes));
  }

  // 3. Users
  if (!localStorage.getItem(USERS_KEY)) {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const defaultUsers: Record<string, UserAccount & { password?: string }> = {
      'owner@munyaka.ac.ke': {
        id: 'usr-owner',
        name: 'Super Owner Admin',
        email: 'owner@munyaka.ac.ke',
        phone: '+254 700 000 001',
        role: 'owner',
        avatar: 'SO',
        school_id: 'school-main-01',
        access_valid_until: nextYear.toISOString(),
        isActive: true,
        password: 'munyaka5239'
      },
      'munyakaprimary@gmail.com': {
        id: 'admin-001',
        name: 'School Administrator',
        email: 'munyakaprimary@gmail.com',
        phone: '+254 700 000 000',
        role: 'admin',
        avatar: 'AD',
        school_id: 'school-main-01',
        access_valid_until: nextYear.toISOString(),
        isActive: true,
        password: 'munyaka5239'
      },
      'teacher@munyaka.ac.ke': {
        id: 'usr-teacher',
        name: 'Jane Teacher',
        email: 'teacher@munyaka.ac.ke',
        phone: '+254 711 222 333',
        role: 'teacher',
        avatar: 'JT',
        school_id: 'school-main-01',
        access_valid_until: nextYear.toISOString(),
        isActive: true,
        password: 'password123'
      },
      'bursar@munyaka.ac.ke': {
        id: 'usr-bursar',
        name: 'David Bursar',
        email: 'bursar@munyaka.ac.ke',
        phone: '+254 722 333 444',
        role: 'bursar',
        avatar: 'DB',
        school_id: 'school-main-01',
        access_valid_until: nextYear.toISOString(),
        isActive: true,
        password: 'password123'
      },
      'librarian@munyaka.ac.ke': {
        id: 'usr-lib',
        name: 'Grace Librarian',
        email: 'librarian@munyaka.ac.ke',
        phone: '+254 733 444 555',
        role: 'librarian',
        avatar: 'GL',
        school_id: 'school-main-01',
        access_valid_until: nextYear.toISOString(),
        isActive: true,
        password: 'password123'
      },
      'storekeeper@munyaka.ac.ke': {
        id: 'usr-store',
        name: 'Peter Storekeeper',
        email: 'storekeeper@munyaka.ac.ke',
        phone: '+254 744 555 666',
        role: 'storekeeper',
        avatar: 'PS',
        school_id: 'school-main-01',
        access_valid_until: nextYear.toISOString(),
        isActive: true,
        password: 'password123'
      }
    };
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }
};

// CRUD functions
export const getSchools = (): School[] => {
  initializeDatabaseStorage();
  return JSON.parse(localStorage.getItem(SCHOOLS_KEY) || '[]');
};

export const saveSchool = (school: School) => {
  const schools = getSchools();
  const idx = schools.findIndex(s => s.id === school.id);
  if (idx >= 0) {
    schools[idx] = school;
  } else {
    schools.push(school);
  }
  localStorage.setItem(SCHOOLS_KEY, JSON.stringify(schools));
};

export const deleteSchool = (schoolId: string) => {
  const schools = getSchools().filter(s => s.id !== schoolId);
  localStorage.setItem(SCHOOLS_KEY, JSON.stringify(schools));
};

export const getMonthlyCodes = (): MonthlyCode[] => {
  initializeDatabaseStorage();
  return JSON.parse(localStorage.getItem(CODES_KEY) || '[]');
};

export const createMonthlyCode = (schoolId: string, monthYear: string, customCode?: string): MonthlyCode => {
  const codes = getMonthlyCodes();
  const codeStr = customCode || generateMonthlyCodeString();
  const expiresAt = computeMonthExpiration(monthYear);

  const newCode: MonthlyCode = {
    id: `code-${Date.now()}`,
    school_id: schoolId,
    code: codeStr,
    month_year: monthYear,
    created_at: new Date().toISOString(),
    expires_at: expiresAt
  };

  codes.push(newCode);
  localStorage.setItem(CODES_KEY, JSON.stringify(codes));
  return newCode;
};

export const deleteMonthlyCode = (codeId: string) => {
  const codes = getMonthlyCodes().filter(c => c.id !== codeId);
  localStorage.setItem(CODES_KEY, JSON.stringify(codes));
};

export const getUsersDatabase = (): Record<string, UserAccount & { password?: string }> => {
  initializeDatabaseStorage();
  return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
};

export const saveUsersDatabase = (users: Record<string, UserAccount & { password?: string }>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const validateMonthlyCodeAndActivate = (codeStr: string, email: string): { success: boolean; message: string; validUntil?: string } => {
  initializeDatabaseStorage();
  const codes = getMonthlyCodes();
  const foundCode = codes.find(c => c.code.trim().toUpperCase() === codeStr.trim().toUpperCase());

  if (!foundCode) {
    return { success: false, message: 'Invalid monthly access code.' };
  }

  // Check if expired
  const now = new Date();
  const expiryDate = new Date(foundCode.expires_at);
  if (now > expiryDate) {
    return { success: false, message: `This monthly code expired on ${expiryDate.toLocaleString()}.` };
  }

  const users = getUsersDatabase();
  const normalizedEmail = email.trim().toLowerCase();
  const user = users[normalizedEmail];

  if (!user) {
    return { success: false, message: 'User account not found for this email.' };
  }

  // Update user school and access valid until
  user.school_id = foundCode.school_id;
  user.access_valid_until = foundCode.expires_at;
  users[normalizedEmail] = user;
  saveUsersDatabase(users);

  // Also update session if current user
  const sessionStr = localStorage.getItem(CURRENT_USER_KEY);
  if (sessionStr) {
    const sessionUser = JSON.parse(sessionStr);
    if (sessionUser.email.toLowerCase() === normalizedEmail) {
      sessionUser.school_id = foundCode.school_id;
      sessionUser.access_valid_until = foundCode.expires_at;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
    }
  }

  return { 
    success: true, 
    message: `Access successfully activated until ${expiryDate.toLocaleDateString()} at 11:59 PM!`,
    validUntil: foundCode.expires_at
  };
};
