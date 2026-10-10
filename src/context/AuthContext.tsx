"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import { notifyDataChanged } from '@/utils/storage';
import { getActiveAdminPassword, DEFAULT_ADMIN_PASSWORD } from '@/services/adminCredentials';
import { startHeartbeatService, stopHeartbeatService } from '@/services/deviceHeartbeat';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
// Staff authentication now reads directly from localStorage to avoid service-layer indirection.
const STAFF_MASTER_STORAGE_KEY = 'munyaka_master_staff_list';
const readStaffMaster = (): any[] => {
  try {
    const raw = localStorage.getItem(STAFF_MASTER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const writeStaffMaster = (list: any[]) => {
  try {
    localStorage.setItem(STAFF_MASTER_STORAGE_KEY, JSON.stringify(list));
    notifyDataChanged(STAFF_MASTER_STORAGE_KEY);
  } catch {
    /* storage may be readonly */
  }
};

export type UserRole = 'admin' | 'teacher' | 'accountant' | 'staff' | 'librarian' | 'storekeeper' | 'lab_assistant' | 'ict_technician' | 'student' | 'non_teaching' | 'support' | 'driver' | 'owner' | 'parent' | 'support_staff';

// 'librarian' maps to the owner-level dashboard in Dashboard.tsx (the role
// formerly named 'owner' — kept as a separate role to preserve the hierarchy).
export const OWNER_LEVEL_ROLE: UserRole = 'librarian';

const CURRENT_AUTH_ROLE_KEY = 'munyaka_current_auth_role';
const MUNYAKA_ADMIN_PASSWORD = 'munyaka_admin_password';

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
  /** Access code (MUN-XXXX) for staff authentication */
  accessCode?: string;
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

const USERS_STORAGE_KEY = 'munyaka_users';

interface PreRegisteredStaff {
  id: string;
  staffId: string;
  fullName: string;
  nationalId?: string;
  tscNumber?: string;
  email: string;
  phone: string;
  systemRole: string;
  department: string;
  assignedGrade?: string;
  assignedStream?: string;
  assignedSubjects?: string[];
  tempAccessCode: string;
  status?: string;
  datePreRegistered?: string;
  activatedAt?: string;
  lastLogin?: string;
}
const mapSystemRoleToUserRole = (systemRole: string): UserRole => {
  const norm = String(systemRole || '').trim().toLowerCase();
  switch (norm) {
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

  // Ensure default Super Admin (Owner)
  const ownerEmailKey = normalizeEmail(DEFAULT_ADMIN.email);
  users[ownerEmailKey] = {
    ...DEFAULT_ADMIN.user,
    password: DEFAULT_ADMIN.password,
    alternativePasswords: [DEFAULT_ADMIN.password],
    isActive: true,
    emailConfirmed: true
  };

  // Ensure default System Administrator
  const sysAdminEmailKey = normalizeEmail(DEFAULT_SYSTEM_ADMIN.email);
  users[sysAdminEmailKey] = {
    ...DEFAULT_SYSTEM_ADMIN.user,
    password: DEFAULT_SYSTEM_ADMIN.password,
    alternativePasswords: [DEFAULT_SYSTEM_ADMIN.password],
    isActive: true,
    emailConfirmed: true
  };

  // Read staff master data directly from localStorage
  const staffMasterData = readStaffMaster();
  const staffLedger: PreRegisteredStaff[] = staffMasterData.length > 0
    ? staffMasterData.map(r => ({
        id: r.id,
        staffId: r.staffId,
        fullName: r.name,
        nationalId: r.nationalId,
        tscNumber: r.tscNumber,
        email: r.email,
        phone: r.phone,
        systemRole: r.systemRole,
        department: r.department,
        assignedGrade: r.assignedGrade,
        assignedStream: r.assignedStream,
        assignedSubjects: r.assignedSubjects ?? [],
        tempAccessCode: (r as any).accessCode || r.tempAccessCode,
        status: r.status,
        datePreRegistered: r.datePreRegistered,
        activatedAt: r.activatedAt,
        lastLogin: r.lastLogin,
      }))
    : [];

  staffLedger.forEach((staff) => {
    const emailKey = normalizeEmail(staff.email);
    
    users[emailKey] = {
      id: staff.id,
      name: staff.fullName,
      email: emailKey,
      phone: staff.phone,
      role: mapSystemRoleToUserRole(staff.systemRole),
      avatar: String(staff.fullName || '').split(' ').map(n => n[0] || '').join('').substring(0, 2).toUpperCase(),
      password: staff.tempAccessCode,
      alternativePasswords: [staff.nationalId || '', 'munyaka2026'].filter(Boolean),
      isActive: staff.status !== 'Suspended',
      emailConfirmed: true,
      staffId: staff.staffId,
      assignedClass: staff.assignedGrade || 'Grade 4',
      assignedStream: staff.assignedStream || 'Green',
      grade: staff.assignedGrade || 'Grade 4',
      stream: staff.assignedStream || 'Green',
      department: staff.department || 'Academics'
    };

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
      /* storage blocked */
    }

    try {
      const savedUser = localStorage.getItem('munyaka_session');
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as Partial<User> | null;
        if (parsed && typeof parsed === 'object' && parsed.role) {
          if ((parsed.role as string) === 'super_admin') parsed.role = 'admin' as UserRole;
          if (!cancelled) setUser(parsed as User);
          persistCurrentAuthRole(parsed.role as string);
        } else {
          if (!cancelled) setUser(null);
          persistCurrentAuthRole(null);
          try { localStorage.removeItem('munyaka_session'); } catch {}
        }
      } else {
        if (!cancelled) setUser(null);
        persistCurrentAuthRole(null);
      }
    } catch {
      if (!cancelled) setUser(null);
      persistCurrentAuthRole(null);
      try { localStorage.removeItem('munyaka_session'); } catch {}
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

    // 1. Direct Staff Master verification for MUN-XXXX access codes and @munyaka.sc.ke emails
    const liveStaffMaster = readStaffMaster();
    const matchedMasterStaff = liveStaffMaster.find(staff => {
      const staffEmail = String(staff.email || '').trim().toLowerCase();
      const staffId = String(staff.staffId || '').trim().toLowerCase();
      const staffName = String(staff.name || '').trim().toLowerCase();
      return (
        staffEmail === cleanInput ||
        staffId === cleanInput ||
        staffName === cleanInput ||
        staffEmail.split('@')[0] === cleanInput.split('@')[0] ||
        (cleanInput.endsWith('@munyaka.sc.ke') && staffEmail === cleanInput)
      );
    });

    if (matchedMasterStaff) {
      const staffAccessCode = String((matchedMasterStaff as any).accessCode || matchedMasterStaff.tempAccessCode || '').trim();
      const cleanPassUpper = cleanPass.toUpperCase();
      const staffAccessCodeUpper = staffAccessCode.toUpperCase();

      const isOwnerOrAdmin = String(matchedMasterStaff.systemRole || matchedMasterStaff.role || '').toLowerCase().includes('admin') ||
                             String(matchedMasterStaff.email || '').includes('munyakaprimary');
      const activeAdminPin = getActiveAdminPassword();

      const isAccessCodeValid =
        (staffAccessCode !== '' &&
         (cleanPassUpper === staffAccessCodeUpper || cleanPass === staffAccessCode)) ||
        (isOwnerOrAdmin && (cleanPass === activeAdminPin || cleanPass === DEFAULT_ADMIN_PASSWORD));

      if (isAccessCodeValid) {
        const userRole = mapSystemRoleToUserRole(matchedMasterStaff.systemRole || matchedMasterStaff.role);
        const userData: User = {
          id: matchedMasterStaff.id,
          name: matchedMasterStaff.name,
          email: matchedMasterStaff.email || `${matchedMasterStaff.staffId || 'staff'}@munyaka.sc.ke`,
          phone: matchedMasterStaff.phone,
          role: userRole,
          avatar: String(matchedMasterStaff.name || '').split(' ').map(n => n[0] || '').join('').substring(0, 2).toUpperCase(),
          staff_id: matchedMasterStaff.staffId,
          accessCode: staffAccessCode,
          assignedClass: matchedMasterStaff.assignedGrade,
          assignedStream: matchedMasterStaff.assignedStream,
          grade: matchedMasterStaff.assignedGrade,
          stream: matchedMasterStaff.assignedStream,
          department: matchedMasterStaff.department,
          is_active: matchedMasterStaff.status !== 'Suspended'
        };

        localStorage.setItem('munyaka_session', JSON.stringify(userData));
        persistCurrentAuthRole(userData.role);
        setUser(userData);
        try {
          const serverUrl = localStorage.getItem('lan_server_url') || 'http://10.53.221.196:5000';
          startHeartbeatService(serverUrl, userData);
        } catch {}
        showSuccess(`Welcome back, ${userData.name}! (Authenticated via staff access code)`);
        return true;
      } else {
        console.error('[AuthContext.login] Invalid access code for staff member:', matchedMasterStaff.name);
                showError('Invalid access code. Please check your assigned staff access code format (MUN-XXXX or MUNYAKA-XXXX) from the master staff ledger.');
        return false;
      }
    }

    // 2. Admin / Owner direct email login check
    const isOwnerOrAdminLogin = cleanInput.includes('munyakaprimary') || cleanInput === 'admin' || cleanInput === 'owner' || cleanInput === 'sysadmin@munyaka.sc.ke';
    const activeAdminPin = getActiveAdminPassword();

    if (isOwnerOrAdminLogin) {
      const isValidOwnerPass =
        cleanPass === activeAdminPin ||
        cleanPass === DEFAULT_ADMIN_PASSWORD;

      if (isValidOwnerPass) {
        const userData = {
          id: 'admin-001',
          name: cleanInput.includes('munyakaprimary') ? 'School Owner' : 'School Administrator',
          email: cleanInput.includes('munyakaprimary') ? 'munyakaprimary@gmail.com' : 'sysadmin@munyaka.sc.ke',
          phone: '+254 700 000 000',
          role: 'admin' as UserRole,
          avatar: 'SA'
        };

        localStorage.setItem('munyaka_session', JSON.stringify(userData));
        persistCurrentAuthRole(userData.role);
        setUser(userData);
        showSuccess(`Welcome back, ${userData.name}!`);
        return true;
      } else {
        showError('Invalid admin password.');
        return false;
      }
    }

    // 3. Fallback to munyaka_users localStorage check
    let users: Record<string, StoredUser> = {};
    try {
      const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
      users = usersJson ? (JSON.parse(usersJson) as Record<string, StoredUser>) : {};
    } catch {}

    const foundUser = users[cleanInput];
    if (foundUser) {
      const isPasswordValid =
        foundUser.password === cleanPass ||
        (foundUser.alternativePasswords?.includes(cleanPass)) ||
        cleanPass === activeAdminPin ||
        cleanPass === DEFAULT_ADMIN_PASSWORD;

      if (isPasswordValid) {
        if (foundUser.isActive === false) {
          showError("Your account is inactive. Please contact the administrator.");
          return false;
        }

        const userData: User = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          phone: foundUser.phone,
          role: foundUser.role,
          avatar: foundUser.avatar,
          staff_id: foundUser.staffId,
          assignedClass: foundUser.assignedClass,
          assignedStream: foundUser.assignedStream,
          department: foundUser.department
        };

        localStorage.setItem('munyaka_session', JSON.stringify(userData));
        persistCurrentAuthRole(userData.role);
        setUser(userData);
        showSuccess(`Welcome back, ${userData.name}!`);
        return true;
      }
    }

    showError('User not found or invalid access code format (MUN-XXXX or MUNYAKA-XXXX) / password.');
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
      isActive: true,
      emailConfirmed: true,
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
      const adminKey = Object.keys(users).find(k => {
        const u = users[k];
        return String(u.role || '').toLowerCase() === 'admin' || String(u.email || '').toLowerCase().includes('munyakaprimary');
      });
      if (adminKey) {
        foundUser = users[adminKey];
      }
    }

    if (!foundUser && isOwnerOrAdmin) {
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

    foundUser.password = newPass;
    if (!foundUser.alternativePasswords) {
      foundUser.alternativePasswords = [];
    }
    if (!foundUser.alternativePasswords?.includes(newPass)) {
      foundUser.alternativePasswords.push(newPass);
    }

    localStorage.setItem(MUNYAKA_ADMIN_PASSWORD, newPass);
    localStorage.setItem('munyaka_owner_pass', newPass);

    users[normalizeEmail(foundUser.email)] = foundUser;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    if (normalizedEmail === normalizeEmail(DEFAULT_ADMIN.email) || isOwnerOrAdmin) {
      localStorage.setItem('munyaka_owner_pass', newPass);
      localStorage.setItem(MUNYAKA_ADMIN_PASSWORD, newPass);
    }
    if (normalizedEmail === normalizeEmail(DEFAULT_SYSTEM_ADMIN.email)) {
      localStorage.setItem('munyaka_sysadmin_pass', newPass);
    }

    localStorage.removeItem('munyaka_session');
    persistCurrentAuthRole(null);
    setUser(null);

    showSuccess("Password changed successfully. Please log in with your new password.");
    return true;
  };

  const logout = () => {
    localStorage.removeItem('munyaka_session');
    persistCurrentAuthRole(null);
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    if (!user) return;

    const updatedUser = { ...user, role };
    setUser(updatedUser);
    localStorage.setItem('munyaka_session', JSON.stringify(updatedUser));
    persistCurrentAuthRole(role);
    showSuccess(`Switched to ${role.replace('_', ' ')} role`);
  };

  const setUserValue = (newUser: User | null) => {
    if (newUser) {
      localStorage.setItem('munyaka_session', JSON.stringify(newUser));
      persistCurrentAuthRole(newUser.role);
      try {
        const serverUrl = localStorage.getItem('lan_server_url') || 'http://10.53.221.196:5000';
        startHeartbeatService(serverUrl, newUser);
      } catch {}
    } else {
      localStorage.removeItem('munyaka_session');
      persistCurrentAuthRole(null);
      try {
        stopHeartbeatService();
      } catch {}
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