"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  avatar?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  createUser: (userData: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_ADMIN: User = {
  id: 'admin-01',
  name: 'System Admin',
  email: 'admin@munyaka.sc.ke',
  role: 'admin',
  createdAt: new Date().toISOString()
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // Load current session
      const savedUser = localStorage.getItem('munyaka_auth_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      // Load user database from localStorage
      const savedUsers = localStorage.getItem('munyaka_user_db');
      if (savedUsers) {
        const parsedUsers: User[] = JSON.parse(savedUsers);
        // Data Migration: Ensure all users have a createdAt field to prevent formatting crashes
        const migratedUsers = parsedUsers.map(u => ({
          ...u,
          createdAt: u.createdAt || new Date().toISOString()
        }));
        setUsers(migratedUsers);
      } else {
        const initialUsers = [DEFAULT_ADMIN];
        setUsers(initialUsers);
        localStorage.setItem('munyaka_user_db', JSON.stringify(initialUsers));
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      // Fallback to defaults on corruption
      setUsers([DEFAULT_ADMIN]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Persist user DB changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('munyaka_user_db', JSON.stringify(users));
    }
  }, [users, isLoading]);

  const login = async (email: string, password: string): Promise<boolean> => {
    const foundUser = users.find(u => u.email === email);
    if (foundUser && (password === 'admin123' || password === email.split('@')[0] + '123')) {
      setUser(foundUser);
      localStorage.setItem('munyaka_auth_user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    if (users.some(u => u.email === email)) return false;

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      role: 'staff',
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, newUser]);
    setUser(newUser);
    localStorage.setItem('munyaka_auth_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('munyaka_auth_user');
  };

  const createUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    if (user?.id === id) {
      const updated = { ...user, ...updates } as User;
      setUser(updated);
      localStorage.setItem('munyaka_auth_user', JSON.stringify(updated));
    }
  };

  const deleteUser = (id: string) => {
    if (id === 'admin-01') return;
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      users, 
      login, 
      signup, 
      logout, 
      createUser, 
      updateUser, 
      deleteUser, 
      isLoading 
    }}>
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