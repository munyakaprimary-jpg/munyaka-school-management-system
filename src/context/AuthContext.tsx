"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import { INITIAL_PRE_REGISTERED_STAFF } from '@/lib/mock-staff-access';
import { PreRegisteredStaff } from '@/types/staff-access';

export type UserRole = 'super_admin' | 'head_teacher' | 'teacher' | 'bursar' | 'parent' | 'student';

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

// Mock Users Database (Simulating a DB)
const DEFAULT_ADMIN = {
  email: 'admin@munyaka.sc.ke',
  password: 'admin123',
  user: {
    id: 'admin-001',
    name: 'System Admin',
    email: 'admin@munyaka.sc.ke',
    phone: '+254 700 000 000',
    role: 'super_admin' as UserRole,
    avatar: 'AD'
  }
};

// Simulated user storage (in a real app, this would be a database)
const USERS_STORAGE_KEY = 'munyaka_users';

// Helper to map staff systemRole to auth UserRole
const mapSystemRoleToUserRole = (systemRole: string): UserRole => {
  switch (systemRole) {
    case 'head_teacher':
      return 'head_teacher';
    case 'bursar':
      return 'bursar';
    case 'support_admin':
      return 'super_admin';
    case 'senior_teacher':
    case 'class_teacher':
    case 'subject_teacher':
    default:
      return 'teacher';
  }
};

// Initialize users storage with default admin and sync with pre-registered staff ledger
const initializeUsersStorage = () => {
  const existingUsersJson = localStorage.getItem(USERS_STORAGE_KEY);
  const users = existingUsersJson ? JSON.parse(existingUsersJson) : {};

  // 1. Ensure default admin is present
  const adminEmailKey = DEFAULT_ADMIN.email.toLowerCase();
  if (!users[adminEmailKey]) {
    users[adminEmailKey] = {
      ...DEFAULT_ADMIN.user,
      password: DEFAULT_ADMIN.password,
      isActive: true,
      emailConfirmed: true
    };
  }

  // 2. Fetch the current pre-registered staff ledger (from localStorage or mock database fallback)
  const savedLedgerJson = localStorage.getItem('munyaka_staff_prereg');
  const staffLedger: PreRegisteredStaff[] = savedLedgerJson 
    ? JSON.parse(savedLedgerJson) 
    : INITIAL_PRE_REGISTERED_STAFF;

  // 3. Sync all pre-registered staff as valid default loggable users
  staffLedger.forEach((staff) => {
    const emailKey = staff.email.toLowerCase();
    
    // We update or insert the credentials
    users[emailKey] = {
      id: staff.id,
      name: staff.fullName,
      email: staff.email.toLowerCase(),
      phone: staff.phone,
      role: mapSystemRoleToUserRole(staff.systemRole),
      avatar: staff.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      // Pre-registered staff can log in using either their temporary access key OR their national ID, or default admin123
      password: staff.tempAccessCode, 
      alternativePasswords: [staff.nationalId, 'admin123'],
      isActive: staff.status !== 'Suspended', // Active if not suspended
      emailConfirmed: true
    };
  });

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize users storage on mount
  useEffect(() => {
    initializeUsersStorage();
    
    const savedUser = localStorage.getItem('munyaka_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    // Normalize email input
    const normalizedEmail = email.trim().toLowerCase();
    
    // Always sync with the latest ledger on every login attempt to capture newly pre-registered staff dynamically
    initializeUsersStorage();

    // Get users from storage
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    const users = usersJson ? JSON.parse(usersJson) : {};
    
    // Check if user exists and credentials match
    const foundUser = users[normalizedEmail];
    
    if (foundUser) {
      const isPasswordValid = 
        foundUser.password === pass || 
        (foundUser.alternativePasswords && foundUser.alternativePasswords.includes(pass));

      if (isPasswordValid) {
        // Check if user is active
        if (!foundUser.isActive) {
          showError("Your account is inactive. Please contact the administrator.");
          return false;
        }
        
        // Check if email is confirmed
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
        setUser(userData);
        return true;
      }
    }
    return false;
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    // Normalize email
    const normalizedEmail = userData.email.trim().toLowerCase();
    
    // Get users from storage
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    const users = usersJson ? JSON.parse(usersJson) : {};
    
    // Check if user already exists
    if (users[normalizedEmail]) {
      showError("A user with this email already exists.");
      return false;
    }
    
    // Create new user
    const newUserId = `user-${Date.now()}`;
    const newUser = {
      id: newUserId,
      name: userData.fullName.trim(),
      email: normalizedEmail,
      phone: userData.phone,
      role: userData.role,
      avatar: userData.fullName.substring(0, 2).toUpperCase(),
      password: userData.password,
      isActive: true,
      emailConfirmed: true,
      department: userData.department,
      createdAt: new Date().toISOString()
    };
    
    // Save user to storage
    users[normalizedEmail] = newUser;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    showSuccess(`Teacher ${userData.fullName} registered successfully!`);
    return true;
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('munyaka_session', JSON.stringify(updatedUser));
    
    // If email changed, update the login credential
    if (data.email) {
      const normalizedEmail = data.email.trim().toLowerCase();
      localStorage.setItem('munyaka_admin_email', normalizedEmail);
    }
    showSuccess("Profile updated successfully");
  };

  const updatePassword = async (oldPass: string, newPass: string): Promise<boolean> => {
    const storedPass = localStorage.getItem('munyaka_admin_pass') || 'admin123';
    
    if (oldPass !== storedPass) {
      showError("Incorrect current password");
      return false;
    }

    localStorage.setItem('munyaka_admin_pass', newPass);
    showSuccess("Password changed successfully");
    return true;
  };

  const logout = () => {
    localStorage.removeItem('munyaka_session');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, updateProfile, updatePassword, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};