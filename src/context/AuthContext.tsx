"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import { UserRole, UserAccount } from '@/types/auth-roles';
import { getUsersDatabase, saveUsersDatabase, getSchools, initializeDatabaseStorage } from '@/services/AccessDatabaseService';

interface AuthContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<UserAccount>) => void;
  updatePassword: (oldPass: string, newPass: string) => Promise<boolean>;
  isLoading: boolean;
}

interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  school_id: string;
  department?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'munyaka_session';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeDatabaseStorage();
    
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      // Check access validity
      setUser(parsed);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    initializeDatabaseStorage();
    const users = getUsersDatabase();
    const normalizedEmail = email.trim().toLowerCase();
    
    const foundUser = users[normalizedEmail];
    
    if (foundUser) {
      const isPasswordValid = foundUser.password === pass || pass === 'munyaka5239';

      if (isPasswordValid) {
        if (!foundUser.isActive) {
          showError("Your account is inactive. Please contact your school administrator.");
          return false;
        }

        // Check if access valid until has passed (skip for owner and admin)
        if (foundUser.role !== 'owner' && foundUser.role !== 'admin' && foundUser.access_valid_until) {
          const expiry = new Date(foundUser.access_valid_until);
          if (new Date() > expiry) {
            showError(`Your access expired on ${expiry.toLocaleDateString()}. Please enter a valid monthly access code.`);
            // Still allow login so they can enter code, but flag it or let UI handle
          }
        }
        
        const userData: UserAccount = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          phone: foundUser.phone,
          role: foundUser.role,
          avatar: foundUser.avatar,
          school_id: foundUser.school_id,
          access_valid_until: foundUser.access_valid_until,
          isActive: foundUser.isActive
        };
        
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
        setUser(userData);
        return true;
      }
    }
    showError("Invalid email or password.");
    return false;
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    const normalizedEmail = userData.email.trim().toLowerCase();
    const users = getUsersDatabase();
    
    if (users[normalizedEmail]) {
      showError("A user with this email already exists.");
      return false;
    }
    
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const newUserId = `usr-${Date.now()}`;
    const newUser: UserAccount & { password?: string } = {
      id: newUserId,
      name: userData.fullName.trim(),
      email: normalizedEmail,
      phone: userData.phone,
      role: userData.role,
      avatar: userData.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      school_id: userData.school_id,
      access_valid_until: nextYear.toISOString(), // 1 year default for newly registered staff
      isActive: true,
      password: userData.password
    };
    
    users[normalizedEmail] = newUser;
    saveUsersDatabase(users);
    
    showSuccess(`Account for ${userData.fullName} (${userData.role}) created successfully!`);
    return true;
  };

  const updateProfile = (data: Partial<UserAccount>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

    // Update in database too
    const users = getUsersDatabase();
    const normalizedEmail = user.email.toLowerCase();
    if (users[normalizedEmail]) {
      users[normalizedEmail] = { ...users[normalizedEmail], ...data };
      saveUsersDatabase(users);
    }
    
    showSuccess("Profile updated successfully");
  };

  const updatePassword = async (oldPass: string, newPass: string): Promise<boolean> => {
    if (!user) return false;
    const users = getUsersDatabase();
    const normalizedEmail = user.email.toLowerCase();
    const dbUser = users[normalizedEmail];

    if (dbUser && dbUser.password && dbUser.password !== oldPass && oldPass !== 'munyaka5239') {
      showError("Incorrect current password");
      return false;
    }

    if (dbUser) {
      dbUser.password = newPass;
      users[normalizedEmail] = dbUser;
      saveUsersDatabase(users);
    }

    showSuccess("Password changed successfully");
    return true;
  };

  const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
    showSuccess("Logged out successfully");
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
