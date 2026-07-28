"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'parent';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock Users Database
const MOCK_ADMIN: User = {
  id: 'admin-001',
  name: 'System Admin',
  email: 'admin@munyaka.sc.ke',
  role: 'admin',
  avatar: 'AD'
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for persistent session on mount
    const savedUser = localStorage.getItem('munyaka_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    // Simulating API call
    await new Promise(resolve => setTimeout(resolve, 800));

    // Admin Credentials Bypass / Seed
    if (email === 'admin@munyaka.sc.ke' && pass === 'admin123') {
      localStorage.setItem('munyaka_session', JSON.stringify(MOCK_ADMIN));
      setUser(MOCK_ADMIN);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('munyaka_session');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};