"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Seed Admin User for lockout prevention
const DEFAULT_ADMIN: User = {
  id: 'admin-01',
  name: 'System Admin',
  email: 'admin@munyaka.sc.ke',
  role: 'admin'
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('munyaka_auth_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
    
    // Log default credentials for developer awareness
    console.log("--- SYSTEM AUTH INITIALIZED ---");
    console.log("Default Admin Email: admin@munyaka.sc.ke");
    console.log("Default Admin Pass: admin123");
    console.log("-------------------------------");
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication logic
    if (email === 'admin@munyaka.sc.ke' && password === 'admin123') {
      setUser(DEFAULT_ADMIN);
      localStorage.setItem('munyaka_auth_user', JSON.stringify(DEFAULT_ADMIN));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('munyaka_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};