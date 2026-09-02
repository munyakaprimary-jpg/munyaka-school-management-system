"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import { notifyDataChanged } from '@/utils/storage';
import { INITIAL_PRE_REGISTERED_STAFF } from '@/lib/mock-staff-access';
import { PreRegisteredStaff } from '@/types/staff-access';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import { CURRENT_AUTH_ROLE_KEY } from '@/services/licenseService';
import {
  MUNYAKA_ADMIN_PASSWORD,
  DEFAULT_ADMIN_PASSWORD,
  getActiveAdminPassword,
} from '@/services/adminCredentials';

export type UserRole = 'owner' | 'super_admin' | 'admin' | 'head_teacher' | 'teacher' | 'bursar' | 'parent' | 'student';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
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
  password: 'ownerpass2026',
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
  password: 'sysadmin2026',
  user: {
    id: 'admin-002',
    name: 'System Administrator',
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
    name: 'Jane Mwangi',
    email: 'jane.mwangi@munyaka.sc.ke',
    phone: '+254 712 345 678',
    role: 'teacher' as UserRole,
    avatar: 'JM'
  }
};

const USERS_STORAGE_KEY = 'munyaka_users';

const mapSystemRoleToUserRole = (systemRole: string): UserRole => {
  switch (systemRole) {
    case 'owner':
      return 'owner';
    case 'super_admin':
      return 'super_admin';
    case 'admin':
    case 'support_admin':
      return 'admin';
    case 'head_teacher':
      return 'head_teacher';
    case 'bursar':
      return 'bursar';
    case 'senior_teacher':
    case 'class_teacher':
    case 'subject_teacher':
    default:
      return 'teacher';
  }
};

/** Normalize email/username for consistent storage & lookup */
const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
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
  const teacherKey = DEFAULT_TEACHER.staffId.toLowerCase();
  users[teacherKey] = {
    ...DEFAULT_TEACHER.user,
    password: DEFAULT_TEACHER.password,
    alternativePasswords: [DEFAULT_TEACHER.password, 'munyaka5239'],
    isActive: true,
    emailConfirmed: true
  };

  // Sync pre-registered staff as valid default loggable users
  const savedLedgerJson = localStorage.getItem('munyaka_staff_prereg');
  const staffLedger: PreRegisteredStaff[] = savedLedgerJson 
    ? JSON.parse(savedLedgerJson) 
    : INITIAL_PRE_REGISTERED_STAFF;

  staffLedger.forEach((staff) => {
    const emailKey = normalizeEmail(staff.email);
    
    users[emailKey] = {
      id: staff.id,
      name: staff.fullName,
      email: emailKey, // Store normalized
      phone: staff.phone,
      role: mapSystemRoleToUserRole(staff.systemRole),
      avatar: staff.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      password: staff.tempAccessCode, // Plain text - this IS the password for this frontend-only system
      alternativePasswords: [staff.nationalId, 'munyaka5239'],
      isActive: staff.status !== 'Suspended', // Explicit activation flag
      emailConfirmed: true, // Explicit verification flag
      staffId: staff.staffId // preserve the staffId on the stored record
    };

    // Also make the staffId (e.g. "T001") a valid login key
    if (staff.staffId) {
      const staffIdKey = staff.staffId.toLowerCase();
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
    initializeUsersStorage();
    
    const savedUser = localStorage.getItem('munyaka_session');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as User;
        setUser(parsed);
        // Re-sync the role key on app boot so the lock gate always
        // agrees with the active session.
        persistCurrentAuthRole(parsed.role);
      } catch {
        persistCurrentAuthRole(null);
      }
    } else {
      persistCurrentAuthRole(null);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    // Accept email OR staffId as the username field; normalise for lookup
    const normalizedEmail = normalizeEmail(email);
    const normalizedStaffId = email.trim().toLowerCase();
    
    initializeUsersStorage();

    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    const users = usersJson ? JSON.parse(usersJson) : {};
    
    // Look up by email first, then fall back to staffId (case-insensitive)
    const foundUser = users[normalizedEmail] || users[normalizedStaffId];
    
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
      const isAdminUser = foundUser.role === 'owner' || foundUser.role === 'super_admin';
      if (isAdminUser) {
        const activeAdminPin = getActiveAdminPassword();
        const entered = pass.trim();

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
        foundUser.password === pass ||
        (foundUser.alternativePasswords && foundUser.alternativePasswords.includes(pass));

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
    return false;
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const normalizedEmail = normalizeEmail(userData.email);
    
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    const users = usersJson ? JSON.parse(usersJson) : {};
    
    if (users[normalizedEmail]) {
      showError("A user with this email already exists.");
      return false;
    }
    
    const newUserId = `user-${Date.now()}`;
    const newUser = {
      id: newUserId,
      name: userData.fullName.trim(),
      email: normalizedEmail,
      phone: userData.phone,
      role: userData.role,
      avatar: userData.fullName.substring(0, 2).toUpperCase(),
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
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    const users = usersJson ? JSON.parse(usersJson) : {};
    const foundUser = users[normalizedEmail];

    if (!foundUser) {
      showError("User not found");
      return false;
    }

    const isPasswordValid =
      foundUser.password === oldPass ||
      (foundUser.alternativePasswords && foundUser.alternativePasswords.includes(oldPass));

    if (!isPasswordValid) {
      showError("Incorrect current password");
      return false;
    }

    // Update the specific user's password
    foundUser.password = newPass;
    if (!foundUser.alternativePasswords) {
      foundUser.alternativePasswords = [];
    }
    if (!foundUser.alternativePasswords.includes(newPass)) {
      foundUser.alternativePasswords.push(newPass);
    }
    users[normalizedEmail] = foundUser;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // Keep legacy key in sync if updating the default admin
    if (normalizedEmail === normalizeEmail(DEFAULT_ADMIN.email)) {
      localStorage.setItem('munyaka_owner_pass', newPass);
    }
    if (normalizedEmail === normalizeEmail(DEFAULT_SYSTEM_ADMIN.email)) {
      localStorage.setItem('munyaka_sysadmin_pass', newPass);
    }

    showSuccess("Password changed successfully");
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
      switchRole
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