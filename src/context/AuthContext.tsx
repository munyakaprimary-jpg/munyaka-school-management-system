import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────
// Unified Role Type — 'owner' is deprecated. All legacy records
// are migrated to 'super_admin' by mapSystemRoleToUserRole().
// ─────────────────────────────────────────────────────────────
export type UserRole =
  | 'super_admin'   // Unified Super Admin (formerly Owner + Super Admin combined)
  | 'head_teacher'
  | 'teacher'
  | 'bursar'
  | 'parent'
  | 'student';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tscNo?: string;
  idNo?: string;
  phone?: string;
  subjects?: string[];
  department?: string;
  status?: string;
  joined?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; needs2FA?: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'munyaka_users';
const SESSION_STORAGE_KEY = 'munyaka_session';

// ─────────────────────────────────────────────────────────────
// DEPRECATED: 'owner' → migrate all records to 'super_admin'.
// This function should be run on any legacy record that still
// carries 'owner' so the entire codebase can stop branching
// on that old value.
// ─────────────────────────────────────────────────────────────
const mapSystemRoleToUserRole = (systemRole: string): UserRole => {
  switch (systemRole) {
    case 'owner':           // legacy Owner → unified Super Admin
      return 'super_admin';
    case 'super_admin':     // already unified
      return 'super_admin';
    case 'head_teacher':
      return 'head_teacher';
    case 'bursar':
      return 'bursar';
    case 'support_admin':
      return 'super_admin';
    case 'senior_teacher':
    case 'class_teacher':
    case 'subject_teacher':
      return 'teacher';
    default:
      return 'teacher';
  }
};

const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

const initializeUsersStorage = () => {
  const existingUsersJson = localStorage.getItem(USERS_STORAGE_KEY);
  const users = existingUsersJson ? JSON.parse(existingUsersJson) : {};

  // Migration: upgrade any legacy 'owner' records to 'super_admin'
  let needsMigration = false;
  Object.keys(users).forEach(email => {
    const user = users[email];
    if (user && user.role === 'owner') {
      user.role = 'super_admin';
      needsMigration = true;
    }
  });
  if (needsMigration) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    console.log('[AuthContext] Migrated legacy OWNER role(s) to SUPER_ADMIN');
  }

  // Seed default super_admin if no users exist at all
  if (Object.keys(users).length === 0) {
    users['munyakaprimary@gmail.com'] = {
      id: 'admin-001',
      name: 'Admin',
      email: 'munyakaprimary@gmail.com',
      password: 'admin123',
      role: 'super_admin',
      status: 'Active',
    };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }
};

const saveSession = (user: User) => {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeUsersStorage();
    const sessionUser = localStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionUser) {
      try {
        const parsed = JSON.parse(sessionUser);
        // Ensure no legacy owner role survives a page reload
        if (parsed?.role === 'owner') {
          parsed.role = 'super_admin';
          saveSession(parsed);
        }
        setUser(parsed);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Session parse error', e);
        clearSession();
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    if (!usersJson) {
      return { success: false, error: 'User store not initialized' };
    }

    const users = JSON.parse(usersJson);
    const foundUser = users[normalizedEmail];

    if (!foundUser) {
      return { success: false, error: 'User not found' };
    }

    if (foundUser.password !== password) {
      return { success: false, error: 'Incorrect password' };
    }

    if (foundUser.status === 'Disabled') {
      return { success: false, error: 'Account is disabled. Contact administrator.' };
    }

    // Ensure no legacy owner role survives login
    const userData: User = {
      id: foundUser.id || foundUser.email,
      name: foundUser.name,
      email: foundUser.email,
      password: foundUser.password,
      role: foundUser.role === 'owner' ? 'super_admin' : mapSystemRoleToUserRole(foundUser.role),
      tscNo: foundUser.tscNo,
      idNo: foundUser.idNo,
      phone: foundUser.phone,
      subjects: foundUser.subjects || [],
      department: foundUser.department,
      status: foundUser.status || 'Active',
      joined: foundUser.joined,
    };

    setUser(userData);
    saveSession(userData);
    setIsAuthenticated(true);

    localStorage.setItem('munyaka_current_auth_role', userData.role);

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    clearSession();
    localStorage.removeItem('munyaka_current_auth_role');
    navigate('/login');
  }, [navigate]);

  const switchRole = useCallback((role: UserRole) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, role };
      saveSession(updated);
      localStorage.setItem('munyaka_current_auth_role', role);
      return updated;
    });
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      saveSession(updated);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, switchRole, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
