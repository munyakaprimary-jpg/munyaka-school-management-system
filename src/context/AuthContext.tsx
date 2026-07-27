"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export type UserRole = 'admin' | 'teacher' | 'staff';

export interface AuthorizedUser {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: UserProfile | null;
  authorizedUsers: AuthorizedUser[];
  loginWithCredentials: (email: string, pass: string) => { success: boolean; redirectUrl?: string; error?: string };
  signUp: (email: string, pass: string, role: UserRole) => { success: boolean; error?: string };
  logout: (reason?: string) => void;
  emergencyReset: () => void;
  addAuthorizedUser: (email: string, role: UserRole) => boolean;
  revokeAccess: (id: string) => void;
}

const MASTER_ADMIN_EMAIL = "admin@yourplatform.com";

const INITIAL_AUTHORIZED_USERS: AuthorizedUser[] = [
  { id: "auth-1", email: MASTER_ADMIN_EMAIL, role: "admin", created_at: "2024-01-01T00:00:00.000Z" },
  { id: "auth-2", email: "teacher@munyaka.sc.ke", role: "teacher", created_at: "2024-01-15T00:00:00.000Z" },
  { id: "auth-3", email: "staff@munyaka.sc.ke", role: "staff", created_at: "2024-02-01T00:00:00.000Z" },
];

const INITIAL_REGISTERED_USERS: Record<string, { pass: string; role: UserRole; id: string }> = {
  [MASTER_ADMIN_EMAIL]: { pass: "PASSWORD123", role: "admin", id: "user-admin-1" },
  "teacher@munyaka.sc.ke": { pass: "PASSWORD123", role: "teacher", id: "user-teacher-1" },
  "staff@munyaka.sc.ke": { pass: "PASSWORD123", role: "staff", id: "user-staff-1" },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>(() => {
    const saved = localStorage.getItem('munyaka_auth_authorized_users');
    return saved ? JSON.parse(saved) : INITIAL_AUTHORIZED_USERS;
  });

  const [registeredUsers, setRegisteredUsers] = useState<Record<string, { pass: string; role: UserRole; id: string }>>(() => {
    const saved = localStorage.getItem('munyaka_auth_registered_users');
    return saved ? JSON.parse(saved) : INITIAL_REGISTERED_USERS;
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('munyaka_auth_active_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('munyaka_auth_authorized_users', JSON.stringify(authorizedUsers));
  }, [authorizedUsers]);

  useEffect(() => {
    localStorage.setItem('munyaka_auth_registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('munyaka_auth_active_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('munyaka_auth_active_user');
    }
  }, [user]);

  const logout = (reason?: string) => {
    setUser(null);
    localStorage.removeItem('munyaka_auth_active_user');
    if (reason) {
      toast.error(reason);
    } else {
      toast.info("Logged out successfully");
    }
  };

  const emergencyReset = () => {
    localStorage.clear();
    setUser(null);
    setAuthorizedUsers(INITIAL_AUTHORIZED_USERS);
    setRegisteredUsers(INITIAL_REGISTERED_USERS);
    toast.success("Session & Storage completely reset. Redirecting to login.");
  };

  const getRoleRedirectPath = (role: UserRole): string => {
    switch (role) {
      case 'admin':
        return '/admin/staff-and-roles';
      case 'teacher':
        return '/dashboard/teacher';
      case 'staff':
        return '/dashboard/staff';
      default:
        return '/dashboard/staff';
    }
  };

  const loginWithCredentials = (email: string, pass: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    let registered = registeredUsers[normalizedEmail];
    const isMasterAdmin = normalizedEmail === MASTER_ADMIN_EMAIL;
    const authEntry = authorizedUsers.find(a => a.email.toLowerCase() === normalizedEmail);

    // Hardcoded bypass for admin@yourplatform.com & pre-authorized accounts
    if (isMasterAdmin || authEntry) {
      const assignedRole: UserRole = isMasterAdmin ? 'admin' : (authEntry?.role || 'staff');

      if (!registered) {
        registered = { pass: cleanPass || "PASSWORD123", role: assignedRole, id: `user-${Date.now()}` };
        setRegisteredUsers(prev => ({ ...prev, [normalizedEmail]: registered! }));
      }

      const isPasswordValid = 
        cleanPass.toUpperCase() === 'PASSWORD123' ||
        registered.pass.toLowerCase() === cleanPass.toLowerCase();

      if (isPasswordValid) {
        const authenticatedProfile: UserProfile = {
          id: registered.id,
          email: normalizedEmail,
          role: assignedRole
        };
        setUser(authenticatedProfile);
        return { success: true, redirectUrl: getRoleRedirectPath(assignedRole) };
      }
    }

    if (!registered) {
      return { success: false, error: "Invalid credentials or account not registered." };
    }

    const matchesPassword = 
      registered.pass.toLowerCase() === cleanPass.toLowerCase() ||
      cleanPass.toUpperCase() === 'PASSWORD123';

    if (!matchesPassword) {
      return { success: false, error: "Invalid password provided." };
    }

    const isAuthorized = isMasterAdmin || authorizedUsers.some(a => a.email.toLowerCase() === normalizedEmail);
    if (!isAuthorized) {
      return { success: false, error: "Access Denied: This account access has been revoked." };
    }

    const authenticatedProfile: UserProfile = {
      id: registered.id,
      email: normalizedEmail,
      role: registered.role
    };

    setUser(authenticatedProfile);
    return { success: true, redirectUrl: getRoleRedirectPath(registered.role) };
  };

  const signUp = (email: string, pass: string, role: UserRole) => {
    const normalizedEmail = email.trim().toLowerCase();
    const isMasterAdmin = normalizedEmail === MASTER_ADMIN_EMAIL;
    const authEntry = authorizedUsers.find(u => u.email.toLowerCase() === normalizedEmail);

    // CLOSED-LOOP REGISTRATION INTERCEPTOR
    if (!isMasterAdmin && !authEntry) {
      return {
        success: false,
        error: "Access Denied: This email address is not authorized. Please contact the administrator."
      };
    }

    if (registeredUsers[normalizedEmail]) {
      return { success: false, error: "Account already exists. Please proceed to log in." };
    }

    const assignedRole: UserRole = isMasterAdmin ? 'admin' : (authEntry?.role || role);

    const newUser = {
      pass,
      role: assignedRole,
      id: `user-${Date.now()}`
    };

    setRegisteredUsers(prev => ({ ...prev, [normalizedEmail]: newUser }));

    if (isMasterAdmin && !authEntry) {
      const adminAuth: AuthorizedUser = {
        id: `auth-${Date.now()}`,
        email: MASTER_ADMIN_EMAIL,
        role: "admin",
        created_at: new Date().toISOString()
      };
      setAuthorizedUsers(prev => [adminAuth, ...prev]);
    }

    return { success: true };
  };

  const addAuthorizedUser = (email: string, role: UserRole) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return false;

    if (authorizedUsers.some(u => u.email.toLowerCase() === normalized)) {
      toast.error("Email is already authorized");
      return false;
    }

    const newAuth: AuthorizedUser = {
      id: `auth-${Date.now()}`,
      email: normalized,
      role,
      created_at: new Date().toISOString()
    };

    setAuthorizedUsers(prev => [newAuth, ...prev]);
    toast.success("User successfully authorized!");
    return true;
  };

  const revokeAccess = (id: string) => {
    const target = authorizedUsers.find(u => u.id === id);
    if (!target) return;

    if (target.email.toLowerCase() === MASTER_ADMIN_EMAIL) {
      toast.error("Action Prohibited: Master Admin access cannot be revoked.");
      return;
    }

    setAuthorizedUsers(prev => prev.filter(u => u.id !== id));

    if (user && user.email.toLowerCase() === target.email.toLowerCase()) {
      logout("Your access permissions were revoked by an administrator.");
    } else {
      toast.success(`Revoked access for ${target.email}`);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      authorizedUsers,
      loginWithCredentials,
      signUp,
      logout,
      emergencyReset,
      addAuthorizedUser,
      revokeAccess
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};