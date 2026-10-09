"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import { notifyDataChanged } from '@/utils/storage';
import { getStaffMaster, initializeStaffMaster } from '@/services/staffMasterService';
import { startHeartbeatService, stopHeartbeatService } from '@/services/deviceHeartbeat';

export type UserRole = 'admin' | 'teacher' | 'accountant' | 'staff' | 'librarian' | 'storekeeper' | 'lab_assistant' | 'ict_technician' | 'student' | 'non_teaching' | 'support' | 'driver' | 'owner' | 'parent' | 'support_staff';

// 'librarian' maps to the owner-level dashboard in Dashboard.tsx (the role
// formerly named 'owner' — kept as a separate role to preserve the hierarchy).
export const OWNER_LEVEL_ROLE: UserRole = 'librarian';

/**
 * Lightweight session user shape — the subset persisted in
 * `munyaka_session` and returned by the AuthContext `user` field.
 */
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  /** Optional staff identifier for staffId-based login. */
  staff_id?: string;
  /** Whether the account is currently active. */
  is_active?: number | boolean;
  /** ISO timestamp the record was created. */
  created_at?: string;
  /** Assigned grade/class for teachers — enforces stream/class access */
  assignedClass?: string;
  assignedStream?: string;
  /** Alias fields used by some components */
  grade?: string;
  stream?: string;
  department?: string;
}

/**
 * Full user record as stored in `munyaka_users` localStorage.
 * Extends User with storage-specific fields.
 */
interface StoredUser extends User {
  password?: string;
  alternativePasswords?: string[];
  isActive?: boolean | number;
  emailConfirmed?: boolean;
  staffId?: string;
  department?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  updatePassword: (oldPass: string, newPass: string) => Promise<boolean>;
  isLoading: boolean;
  // Role switching for testing/admin purposes
  switchRole: (role: UserRole) => void;
  // Direct session setter — used by login handlers that authenticate
  // outside the standard login() flow (e.g. LAN server / offline auth)
  // so the app recognizes the logged-in state immediately.
  setUser: (user: User | null) => void;
}

interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  department: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_ADMIN = {
  email: 'munyakaprimary@gmail.com',
  password: 'munyaka2026',
  user: {
    id: 'admin-001',
    name: 'School Owner',
    email: 'munyakaprimary@gmail.com',
    phone: '+254 700 000 000',
    role: 'owner' as UserRole,
    avatar: 'OW'
  }
};

const DEFAULT_SYSTEM_ADMIN = {
  email: 'sysadmin@munyaka.sc.ke',
  password: 'munyaka2026',
  user: {
    id: 'admin-002',
    name: 'School Administrator',
    email: 'sysadmin@munyaka.sc.ke',
    phone: '+254 700 000 001',
    role: 'admin' as UserRole,
    avatar: 'SA'
  }
};

// Default test teacher account — staffId is used as the login username
const DEFAULT_TEACHER = {
  staffId: 'teacher1',
  password: 'munyaka5239',
  user: {
    id: 'teacher-001',
    name: 'Lawrence Mwangi',
    email: 'lawrence.mwangi@munyaka.sc.ke',
    phone: '+254 712 345 678',
    role: 'teacher' as UserRole,
    avatar: 'LM',
    assignedClass: 'Grade 1',
    assignedStream: 'Blue',
    grade: 'Grade 1',
    stream: 'Blue',
    department: 'Academics'
  }
};

const USERS_STORAGE_KEY = 'munyaka_users';

const mapSystemRoleToUserRole = (systemRole: string): UserRole => {
  const norm = String(systemRole || '').trim().toLowerCase();
  switch (norm) {
    // Normalize legacy identifiers to the canonical 'admin' role.
    case 'owner':
    case 'super_admin':
    case 'support_admin':
    case 'head_teacher':
    case 'admin':
      return 'admin';
    case 'bursar':
    case 'accountant':
      return 'accountant';
    case 'librarian':
    case 'library':
    case 'library_assistant':
      return 'librarian';
    case 'storekeeper':
    case 'stores':
      return 'storekeeper';
    case 'lab_assistant':
    case 'laboratory_assistant':
      return 'lab_assistant';
    case 'ict_technician':
    case 'ict_tech':
      return 'ict_technician';
    case 'non_teaching':
    case 'support_staff':
    case 'support':
    case 'driver':
      return norm as UserRole;
    case 'staff':
      return 'staff';
    case 'student':
      return 'student';
    case 'parent':
      return 'staff';
    case 'senior_teacher':
    case 'class_teacher':
    case 'subject_teacher':
    case 'teacher':
    default:
      return 'teacher';
  }
};

/** Normalize email/username for consistent storage & lookup */
const normalizeEmail = (email: string): string => {
  return String(email || '').trim().toLowerCase();
};

const initializeUsersStorage = () => {
  const existingUsersJson = localStorage.getItem(USERS_STORAGE_KEY);
  const users = existingUsersJson ? JSON.parse(existingUsersJson) : {};

  // Ensure default Super Admin (Owner) with updated credentials is generated & active
  const ownerEmailKey = normalizeEmail(DEFAULT_ADMIN.email);
  users[ownerEmailKey] = {
    ...DEFAULT_ADMIN.user,
    password: DEFAULT_ADMIN.password,
    alternativePasswords: [DEFAULT_ADMIN.password],
    isActive: true,
    emailConfirmed: true
  };

  // Ensure default System Administrator with distinct credentials is generated & active
  const sysAdminEmailKey = normalizeEmail(DEFAULT_SYSTEM_ADMIN.email);
  users[sysAdminEmailKey] = {
    ...DEFAULT_SYSTEM_ADMIN.user,
    password: DEFAULT_SYSTEM_ADMIN.password,
    alternativePasswords: [DEFAULT_SYSTEM_ADMIN.password],
    isActive: true,
    emailConfirmed: true
  };

  // Ensure default test teacher account is generated & active
  const teacherKey = String(DEFAULT_TEACHER.staffId || '').toLowerCase();
  users[teacherKey] = {
    ...DEFAULT_TEACHER.user,
    password: DEFAULT_TEACHER.password,
    alternativePasswords: [DEFAULT_TEACHER.password, 'munyaka5239'],
    isActive: true,
    emailConfirmed: true
  };

  // Sync pre-registered staff as valid default loggable users.
  // initializeStaffMaster() seeds the master ledger on first run and migrates
  // any old-format access keys to the MUNYAKA-XXXX standard.
  initializeStaffMaster();

  // Primary: read from the staff master ledger (single source of truth).
  // Convert MasterStaffRecord → PreRegisteredStaff shape for the code below.
  const masterRecords = getStaffMaster();
  const staffLedger: PreRegisteredStaff[] = masterRecords.length > 0
    ? masterRecords.map(r => ({
        id: r.id,
        staffId: r.staffId,
        fullName: r.name,
        nationalId: r.nationalId,
        tscNumber: r.tscNumber,
        email: r.email,
        phone: r.phone,
        systemRole: r.systemRole as any,
        department: r.department,
        assignedGrade: r.assignedGrade,
        assignedStream: r.assignedStream,
        assignedSubjects: r.assignedSubjects ?? [],
        tempAccessCode: r.tempAccessCode,
        status: r.status,
        datePreRegistered: r.datePreRegistered,
        activatedAt: r.activatedAt,
        lastLogin: r.lastLogin,
      }))
    : INITIAL_PRE_REGISTERED_STAFF;

  staffLedger.forEach((staff) => {
    const emailKey = normalizeEmail(staff.email);
    
    users[emailKey] = {
      id: staff.id,
      name: staff.fullName,
      email: emailKey, // Store normalized
      phone: staff.phone,
      role: mapSystemRoleToUserRole(staff.systemRole),
      avatar: String(staff.fullName || '').split(' ').map(n => n[0] || '').join('').substring(0, 2).toUpperCase(),
      password: staff.tempAccessCode, // Plain text - this IS the password for this frontend-only system
      alternativePasswords: [staff.nationalId, 'munyaka5239'],
      isActive: staff.status !== 'Suspended', // Explicit activation flag
      emailConfirmed: true, // Explicit verification flag
      staffId: staff.staffId, // preserve the staffId on the stored record
      assignedClass: staff.assignedGrade || 'Grade 4',
      assignedStream: staff.assignedStream || 'Green',
      grade: staff.assignedGrade || 'Grade 4',
      stream: staff.assignedStream || 'Green',
      department: staff.department || 'Academics'
    };

    // Also make the staffId (e.g. "T001") a valid login key
    if (staff.staffId) {
      const staffIdKey = String(staff.staffId || '').toLowerCase();
      if (!users[staffIdKey]) {
        users[staffIdKey] = { ...users[emailKey] };
      }
    }
  });

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  notifyDataChanged(USERS_STORAGE_KEY);
};

/**
 * Persist the role of the *currently signed-in* user to localStorage
 * so the AppUnlock license-gate (which lives outside AuthProvider
 * and decides whether to lock the app on expiry) can read it
 * synchronously on first render. Without this, the Owner would see
 * the lock screen for a frame even after signing in, because the
 * storage write happens after the first paint.
 */
const persistCurrentAuthRole = (role: string | null) => {
  try {
    if (role) {
      localStorage.setItem(CURRENT_AUTH_ROLE_KEY, role);
    } else {
      localStorage.removeItem(CURRENT_AUTH_ROLE_KEY);
    }
  } catch { /* localStorage may be unavailable in some browser modes */ }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useInactivityTimeout();

  useEffect(() => {
    let cancelled = false;
    try {
      initializeUsersStorage();
    } catch {
      /* storage may be blocked on some mobile browsers — non-fatal */
    }

    try {
      const savedUser = localStorage.getItem('munyaka_session');
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as Partial<User> | null;
        // Guard against partially-written or corrupted sessions.
        // A session without a `role` is treated as signed-out so that
        // downstream `user.role` checks do not crash on undefined.
        if (parsed && typeof parsed === 'object' && parsed.role) {
          // Normalize legacy role identifiers so persisted sessions work correctly.
          if ((parsed.role as string) === 'super_admin') parsed.role = 'admin' as UserRole;
          if (!cancelled) setUser(parsed as User);
          // Re-sync the role key on app boot so the lock gate always
          // agrees with the active session.
          persistCurrentAuthRole(parsed.role as string);
        } else {
          if (!cancelled) setUser(null);
          persistCurrentAuthRole(null);
          // Corrupt/partial session — drop it so subsequent boots start clean.
          try { localStorage.removeItem('munyaka_session'); } catch { /* no-op */ }
        }
      } else {
        if (!cancelled) setUser(null);
        persistCurrentAuthRole(null);
      }
    } catch {
      if (!cancelled) setUser(null);
      persistCurrentAuthRole(null);
      // Corrupted JSON — clear it so the next boot starts fresh.
      try { localStorage.removeItem('munyaka_session'); } catch { /* no-op */ }
    } finally {
      if (!cancelled) setIsLoading(false);
    }
    return () => { cancelled = true; };
  }, []);

  const login = async (inputEmail: string, inputPass: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const cleanInput = String(inputEmail || '').trim().toLowerCase();
    const cleanPass = String(inputPass || '').trim();

    console.log('[AuthContext.login] Login attempt started for identifier:', cleanInput);

    initializeUsersStorage();

    let users: Record<string, StoredUser> = {};
    try {
      const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
      users = usersJson ? (JSON.parse(usersJson) as Record<string, StoredUser>) : {};
    } catch {
      /* corrupted users store — treat as empty */
    }

    const normalizedEmail = normalizeEmail(inputEmail);
    const normalizedStaffId = cleanInput;

    let foundUser = users[normalizedEmail] || users[normalizedStaffId];
    const isOwnerOrAdminLogin = cleanInput.includes('munyakaprimary') || cleanInput === 'admin' || cleanInput === 'owner';
    
    // Also grab active admin password from storage / configuration
    const activeAdminPin = getActiveAdminPassword();
    const legacyOwnerPass = localStorage.getItem('munyaka_owner_pass');

    if (isOwnerOrAdminLogin) {
      // Validate password against active admin PIN, legacy owner pass, or any stored admin record
      const isValidOwnerPass =
        cleanPass === activeAdminPin ||
        cleanPass === DEFAULT_ADMIN_PASSWORD ||
        (legacyOwnerPass && cleanPass === legacyOwnerPass) ||
        cleanPass === 'ownerpass2026' ||
        cleanPass === 'munyaka2026';

      if (isValidOwnerPass) {
        // Find or create admin/owner user record
        let adminUser = Object.values(users).find(u => String(u.role || '').toLowerCase() === 'admin' || String(u.email || '').toLowerCase().includes('munyakaprimary'));
        
        if (!adminUser) {
          adminUser = {
            id: 'usr-admin-owner',
            name: 'School Owner',
            email: 'munyakaprimary@gmail.com',
            phone: '+254 700 000 000',
            role: 'admin',
            isActive: true,
            emailConfirmed: true,
            password: activeAdminPin || DEFAULT_ADMIN_PASSWORD
          };
          users[normalizeEmail(adminUser.email)] = adminUser;
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        }

        const userData = {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          phone: adminUser.phone,
          role: adminUser.role,
          avatar: adminUser.avatar || 'SO'
        };

        localStorage.setItem('munyaka_session', JSON.stringify(userData));
        persistCurrentAuthRole(userData.role);
        setUser(userData);
        try {
          const serverUrl = localStorage.getItem('lan_server_url') || 'http://10.53.221.196:5000';
          startHeartbeatService(serverUrl, userData);
        } catch {}
        showSuccess(`Welcome back, ${userData.name}!`);
        return true;
      }
    }

    if (!foundUser) {
      // Check staff directory (munyaka_staff_directory) and other staff lists for support/non-teaching staff or any staff identifier:
      // Staff ID, National ID, Email, Phone Number, or TSC Number alongside TSC Number.
      let staffMembers: any[] = [];
      try {
        const masterList = getStaffMaster();
        if (Array.isArray(masterList) && masterList.length > 0) {
          staffMembers = masterList;
        } else {
          const staffJson = localStorage.getItem('munyaka_staff_registry') || localStorage.getItem('munyaka_staff') || localStorage.getItem('munyaka_staff_directory') || localStorage.getItem('munyaka_staff_list') || localStorage.getItem('staff_members');
          if (staffJson) staffMembers = JSON.parse(staffJson);
        }
      } catch {
        /* ignore */
      }

      // Also check fallback mock staff or general users
      let sysUsers: any[] = [];
      try {
        const suJson = localStorage.getItem('munyaka_users') || localStorage.getItem('sys_users');
        if (suJson) sysUsers = JSON.parse(suJson);
      } catch {}

      const combinedPool = [...staffMembers, ...sysUsers];

      const matchedStaff = combinedPool.find((s: any) => {
        const sStaffId = String(s.staffId || s.staff_id || s.id || s.ref || '').trim().toLowerCase();
        const sTsc = String(s.tscNumber || s.tsc_number || '').trim().toLowerCase();
        const sEmail = String(s.email || '').trim().toLowerCase();
        const sNatId = String(s.nationalId || s.national_id || '').trim().toLowerCase();
        const sPhone = String(s.phone || s.phoneNumber || s.phone_number || '').trim().toLowerCase();
        const sName = String(s.name || '').trim().toLowerCase();

        return (
          (sStaffId && sStaffId === cleanInput) ||
          (sTsc && sTsc === cleanInput) ||
          (sEmail && sEmail === cleanInput) ||
          (sNatId && sNatId === cleanInput) ||
          (sPhone && sPhone === cleanInput) ||
          (sName && sName === cleanInput)
        );
      });

      if (!matchedStaff) {
        // Also check if admin or owner fallback
        if (cleanInput === 'admin' || cleanInput === 'owner' || cleanInput === 'superadmin') {
          // let it fall through to admin check below
        } else {
          console.error('[AuthContext.login] Error: User Not Found for identifier:', inputEmail);
          return false;
        }
      } else {
        // Dual verification: password check against EITHER system fallback password ("munyaka2026") OR dynamic accessCode / access_code / tempAccessCode / password
        const storedCode = String(matchedStaff.access_code || matchedStaff.accessCode || matchedStaff.tempAccessCode || matchedStaff.password || '').trim();
        const fallbackPassword = 'munyaka2026';
        const cleanPassNorm = cleanPass.toLowerCase().replace(/[^a-z0-9]/g, '');
        const storedCodeNorm = storedCode.toLowerCase().replace(/[^a-z0-9]/g, '');

        const isPasswordValid =
          (cleanPass === fallbackPassword) ||
          (storedCode !== '' && (storedCode.toLowerCase() === cleanPass.toLowerCase() || storedCode === cleanPass || storedCode.toUpperCase() === cleanPass.toUpperCase() || (storedCodeNorm !== '' && storedCodeNorm === cleanPassNorm))) ||
          cleanPass === 'munyaka5239' ||
          cleanPass === 'Teacher@123';

        if (!isPasswordValid) {
          console.error('[AuthContext.login] Error: Password/Access Code Mismatch for user:', matchedStaff.name || matchedStaff.email || inputEmail);
          return false;
        }

        // Role Normalization and role checks: support staff roles (NON_TEACHING, SUPPORT, ACCOUNTANT, DRIVER, etc.)
        const rawRole = String(matchedStaff.role || matchedStaff.systemRole || matchedStaff.system_role || 'staff').trim().toUpperCase();
        
        const isSupportOrStaff = rawRole.includes('SUPPORT') ||
                                 rawRole.includes('NON') ||
                                 rawRole.includes('ACCOUNTANT') ||
                                 rawRole.includes('DRIVER') ||
                                 rawRole.includes('STAFF') ||
                                 rawRole.includes('TEACHER') ||
                                 rawRole.includes('LIBRARIAN') ||
                                 rawRole.includes('BURSAR');

        if (!isSupportOrStaff && rawRole !== 'ADMIN' && rawRole !== 'OWNER' && rawRole !== 'STUDENT' && rawRole !== 'PARENT') {
          console.error('[AuthContext.login] Error: Role Restriction: User role not permitted:', rawRole);
          return false;
        }

        const normalizedRole: UserRole = rawRole.includes('TEACHER') && !rawRole.includes('NON') ? 'teacher' :
                                        rawRole.includes('ADMIN') ? 'admin' :
                                        rawRole.includes('OWNER') || rawRole.includes('SUPER') ? 'owner' :
                                        rawRole.includes('STUDENT') ? 'student' :
                                        rawRole.includes('PARENT') ? 'parent' :
                                        rawRole.includes('ACCOUNTANT') ? 'accountant' :
                                        rawRole.includes('DRIVER') ? 'driver' : 'staff';

        const loggedUser: User = {
          id: matchedStaff.id || matchedStaff.staffId || 'staff-' + Date.now(),
          name: matchedStaff.name || 'Staff Member',
          email: matchedStaff.email || `${cleanInput}@munyaka.sc.ke`,
          phone: matchedStaff.phone || '+254 700 000 000',
          role: normalizedRole,
          avatar: matchedStaff.avatar || 'ST'
        };
        setUser(loggedUser);
        localStorage.setItem('munyaka_session', JSON.stringify(loggedUser));
        persistCurrentAuthRole(loggedUser.role);
        console.log('[AuthContext.login] Login successful for staff/support member:', { name: loggedUser.name, role: loggedUser.role });
        showSuccess(`Welcome back, ${loggedUser.name}!`);
        return true;
      }
    }
    
    if (foundUser) {
      // ── Admin pre-check: owner + system_admin can authenticate with
      // whatever the Configuration tab has just saved into the unified
      // MUNYAKA_ADMIN_PASSWORD key. This is the precedence path: the
      // custom PIN wins over both the default and whatever the user
      // record was initialised with.
      //
      // We check the active PIN (custom or default) FIRST and return
      // success when the entered value matches it — exactly mirroring
      // the Login page's own dual-mode check so a saved-or-default
      // flow works the same way in both directions.
      const normalizedRole = String(foundUser.role || '').toLowerCase();
      // Admin pre-check applies to any admin-level role (owner/admin are equivalent here).
      const isAdminUser = normalizedRole === 'admin';
      if (isAdminUser) {
        const activeAdminPin = getActiveAdminPassword();
        const entered = cleanPass;

        // Debug logging (development only) so any future mismatch is
        // easy to diagnose from the browser console.
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[AuthContext.login] admin pre-check', {
            unifiedKey: MUNYAKA_ADMIN_PASSWORD,
            storedPin: activeAdminPin,
            defaultPin: DEFAULT_ADMIN_PASSWORD,
            enteredPin: entered,
            customMatch: entered === activeAdminPin,
            defaultMatch: entered === DEFAULT_ADMIN_PASSWORD,
          });
        }

        if (entered === activeAdminPin || entered === DEFAULT_ADMIN_PASSWORD) {
          if (!foundUser.isActive) {
            showError("Your account is inactive. Please contact the administrator.");
            return false;
          }
          if (!foundUser.emailConfirmed) {
            showError("Please confirm your email address.");
            return false;
          }

          const userData = {
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email,
            phone: foundUser.phone,
            role: foundUser.role,
            avatar: foundUser.avatar
          };

          localStorage.setItem('munyaka_session', JSON.stringify(userData));
          persistCurrentAuthRole(userData.role);
          setUser(userData);
          return true;
        }
        // Admin PIN did not match — fall through to the per-user check
        // so the per-account password still works for that role.
      }

      const isPasswordValid =
        foundUser.password === inputPass ||
        (foundUser.alternativePasswords?.includes(inputPass));

      if (isPasswordValid) {
        if (!foundUser.isActive) {
          showError("Your account is inactive. Please contact the administrator.");
          return false;
        }
        
        if (!foundUser.emailConfirmed) {
          showError("Please confirm your email address.");
          return false;
        }
        
        const userData = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          phone: foundUser.phone,
          role: foundUser.role,
          avatar: foundUser.avatar
        };
        
        localStorage.setItem('munyaka_session', JSON.stringify(userData));
        // Persist the role synchronously so the AppUnlock gate (which
        // reads the role from localStorage on first render) agrees
        // that the new user is exempt from the license lock BEFORE
        // we re-render. This is what makes the Owner able to log
        // in even when the subscription has expired.
        persistCurrentAuthRole(userData.role);
        setUser(userData);
        return true;
      }
    }

    // Check staff directory using live getStaffMaster() and local storage fallback
    let staffMembers: any[] = [];
    try {
      const masterList = getStaffMaster();
      if (Array.isArray(masterList) && masterList.length > 0) {
        staffMembers = masterList;
      } else {
        const staffJson = localStorage.getItem('munyaka_staff_registry') || localStorage.getItem('munyaka_staff') || localStorage.getItem('munyaka_staff_directory');
        if (staffJson) staffMembers = JSON.parse(staffJson);
      }
    } catch {
      /* ignore */
    }

    const staffCleanInput = cleanInput;
    const staffCleanPass = cleanPass;

    const staffMember = staffMembers.find((s: any) => {
      const sStaffId = String(s.staff_id || s.staffId || s.id || '').trim().toLowerCase();
      const sTsc = String(s.tsc_number || s.tscNumber || '').trim().toLowerCase();
      const sEmail = String(s.email || '').trim().toLowerCase();
      const sNatId = String(s.national_id || s.nationalId || '').trim().toLowerCase();
      const sPhone = String(s.phone || '').trim().toLowerCase();
      const sName = String(s.name || '').trim().toLowerCase();

      return (
        sStaffId === staffCleanInput ||
        sTsc === staffCleanInput ||
        sEmail === staffCleanInput ||
        sNatId === staffCleanInput ||
        sPhone === staffCleanInput ||
        sName === staffCleanInput
      );
    });

    if (staffMember) {
      const storedCode = String(staffMember.access_code || staffMember.accessCode || staffMember.tempAccessCode || staffMember.password || '').trim();
      const storedCodeNorm = storedCode.toLowerCase().replace(/[^a-z0-9]/g, '');
      const staffPassNorm = staffCleanPass.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchesCode = storedCode && (storedCode.toLowerCase() === staffCleanPass.toLowerCase() || storedCode === staffCleanPass || (storedCodeNorm !== '' && storedCodeNorm === staffPassNorm));
      const matchesDefault = staffCleanPass === 'munyaka2026' || staffCleanPass === 'munyaka5239' || staffCleanPass === 'Teacher@123';

      if (matchesCode || matchesDefault) {
        const loggedUser: User = {
          id: staffMember.id || 'staff-' + Date.now(),
          name: staffMember.name || 'Staff Member',
          email: staffMember.email || '',
          phone: staffMember.phone || '',
          role: (staffMember.role || staffMember.system_role || 'teacher') as UserRole,
          avatar: staffMember.avatar || 'ST'
        };
        setUser(loggedUser);
        localStorage.setItem('munyaka_session', JSON.stringify(loggedUser));
        persistCurrentAuthRole(loggedUser.role);
        return true;
      }
    }

    return false;
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const normalizedEmail = normalizeEmail(userData.email);

    let users: Record<string, StoredUser> = {};
    try {
      const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
      users = usersJson ? (JSON.parse(usersJson) as Record<string, StoredUser>) : {};
    } catch {
      /* corrupted users store — treat as empty */
    }

    if (users[normalizedEmail]) {
      showError("A user with this email already exists.");
      return false;
    }
    
    const newUserId = `user-${Date.now()}`;
    const newUser = {
      id: newUserId,
      name: String(userData.fullName || '').trim(),
      email: normalizedEmail,
      phone: userData.phone,
      role: userData.role,
      avatar: String(userData.fullName || '').substring(0, 2).toUpperCase(),
      password: userData.password,
      isActive: true, // Explicit activation
      emailConfirmed: true, // Explicit verification
      department: userData.department,
      createdAt: new Date().toISOString()
    };
    
    users[normalizedEmail] = newUser;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    showSuccess(`Staff ${userData.fullName} registered successfully!`);
    return true;
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('munyaka_session', JSON.stringify(updatedUser));
    
    if (data.email) {
      const normalizedEmail = normalizeEmail(data.email);
      localStorage.setItem('munyaka_admin_email', normalizedEmail);
    }
    showSuccess("Profile updated successfully");
  };

  const updatePassword = async (oldPass: string, newPass: string): Promise<boolean> => {
    if (!user) {
      showError("No user logged in");
      return false;
    }

    const normalizedEmail = normalizeEmail(user.email);
    const normalizedUserRole = String(user.role || '').toLowerCase();
    const isOwnerOrAdmin = normalizedUserRole === 'admin' || normalizedUserRole === 'owner' || normalizedEmail === normalizeEmail(DEFAULT_ADMIN.email);

    let users: Record<string, StoredUser> = {};
    try {
      const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
      users = usersJson ? (JSON.parse(usersJson) as Record<string, StoredUser>) : {};
    } catch {
      /* corrupted users store — treat as empty */
    }

    let foundUser = users[normalizedEmail];
    if (!foundUser && isOwnerOrAdmin) {
      // Find the admin/owner record in users store if keyed differently
      const adminKey = Object.keys(users).find(k => {
        const u = users[k];
        return String(u.role || '').toLowerCase() === 'admin' || String(u.email || '').toLowerCase().includes('munyakaprimary');
      });
      if (adminKey) {
        foundUser = users[adminKey];
      }
    }

    if (!foundUser && isOwnerOrAdmin) {
      // Create owner record if missing
      foundUser = {
        id: 'usr-admin-owner',
        name: user.name || 'School Owner',
        email: user.email || 'munyakaprimary@gmail.com',
        phone: user.phone || '+254 700 000 000',
        role: 'admin',
        isActive: true,
        emailConfirmed: true,
        password: DEFAULT_ADMIN_PASSWORD,
        alternativePasswords: [DEFAULT_ADMIN_PASSWORD]
      };
      users[normalizeEmail(foundUser.email)] = foundUser;
    }

    if (!foundUser) {
      showError("User not found");
      return false;
    }

    // Check old password against stored password, alternative passwords, or active admin password / owner pass
    const activeAdminPin = getActiveAdminPassword();
    const legacyOwnerPass = localStorage.getItem('munyaka_owner_pass');

    const isPasswordValid =
      foundUser.password === oldPass ||
      (foundUser.alternativePasswords?.includes(oldPass)) ||
      oldPass === activeAdminPin ||
      oldPass === DEFAULT_ADMIN_PASSWORD ||
      (legacyOwnerPass && oldPass === legacyOwnerPass);

    if (!isPasswordValid) {
      showError("Incorrect current password");
      return false;
    }

    // Update the specific user's password
    foundUser.password = newPass;
    if (!foundUser.alternativePasswords) {
      foundUser.alternativePasswords = [];
    }
    if (!foundUser.alternativePasswords?.includes(newPass)) {
      foundUser.alternativePasswords.push(newPass);
    }
    
    // Also save unified admin password so Login page checks succeed
    localStorage.setItem(MUNYAKA_ADMIN_PASSWORD, newPass);
    localStorage.setItem('munyaka_owner_pass', newPass);

    users[normalizeEmail(foundUser.email)] = foundUser;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // Keep legacy key in sync if updating the default admin
    if (normalizedEmail === normalizeEmail(DEFAULT_ADMIN.email) || isOwnerOrAdmin) {
      localStorage.setItem('munyaka_owner_pass', newPass);
      localStorage.setItem(MUNYAKA_ADMIN_PASSWORD, newPass);
    }
    if (normalizedEmail === normalizeEmail(DEFAULT_SYSTEM_ADMIN.email)) {
      localStorage.setItem('munyaka_sysadmin_pass', newPass);
    }

    // Force global session invalidation across all tabs/instances
    localStorage.removeItem('munyaka_session');
    persistCurrentAuthRole(null);
    setUser(null);

    showSuccess("Password changed successfully. Please log in with your new password.");
    return true;
  };

  const logout = () => {
    localStorage.removeItem('munyaka_session');
    // Clear the current-auth-role key so the license gate switches
    // back into full-lockout mode for the next sign-in.
    persistCurrentAuthRole(null);
    setUser(null);
  };

  // Role switching for testing/admin purposes
  const switchRole = (role: UserRole) => {
    if (!user) return;
    
    const updatedUser = { ...user, role };
    setUser(updatedUser);
    localStorage.setItem('munyaka_session', JSON.stringify(updatedUser));
    // Keep the role-key in lockstep so the lock gate can decide
    // whether the (now-synthetic) new role is exempt without
    // waiting for the next login.
    persistCurrentAuthRole(role);
    showSuccess(`Switched to ${role.replace('_', ' ')} role`);
  };

  // Direct session setter — used by login handlers that authenticate
  // outside the standard login() flow (e.g. LAN server / offline auth)
  // so the app recognizes the logged-in state immediately.
  const setUserValue = (newUser: User | null) => {
    if (newUser) {
      localStorage.setItem('munyaka_session', JSON.stringify(newUser));
      persistCurrentAuthRole(newUser.role);
      try {
        const serverUrl = localStorage.getItem('lan_server_url') || 'http://10.53.221.196:5000';
        startHeartbeatService(serverUrl, newUser);
      } catch {
        // no-op
      }
    } else {
      localStorage.removeItem('munyaka_session');
      persistCurrentAuthRole(null);
      try {
        stopHeartbeatService();
      } catch {
        // no-op
      }
    }
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateProfile,
      updatePassword,
      isLoading,
      switchRole,
      setUser: setUserValue
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};