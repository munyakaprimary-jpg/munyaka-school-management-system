"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { showSuccess, showError } from '@/utils/toast';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'staff' | 'parent';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  updatePassword: (oldPass: string, newPass: string) => Promise<boolean>;
  isLoading: boolean;
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
    role: 'admin' as const,
    avatar: 'AD'
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('munyaka_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    // Check if credentials match (checking updated credentials in localStorage first)
    const storedEmail = localStorage.getItem('munyaka_admin_email') || DEFAULT_ADMIN.email;
    const storedPass = localStorage.getItem('munyaka_admin_pass') || DEFAULT_ADMIN.password;

    if (email === storedEmail && pass === storedPass) {
      const userData = localStorage.getItem('munyaka_session') 
        ? JSON.parse(localStorage.getItem('munyaka_session')!) 
        : DEFAULT_ADMIN.user;
      
      localStorage.setItem('munyaka_session', JSON.stringify(userData));
      setUser(userData);
      return true;
    }
    return false;
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('munyaka_session', JSON.stringify(updatedUser));
    
    // If email changed, update the login credential
    if (data.email) {
      localStorage.setItem('munyaka_admin_email', data.email);
    }
    showSuccess("Profile updated successfully");
  };

  const updatePassword = async (oldPass: string, newPass: string): Promise<boolean> => {
    const storedPass = localStorage.getItem('munyaka_admin_pass') || DEFAULT_ADMIN.password;
    
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
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateProfile, updatePassword, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};