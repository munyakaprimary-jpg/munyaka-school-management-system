import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Smartphone,
  Globe,
  Wifi,
  Activity,
  CheckCircle2,
  Trash2,
  Search,
  UserCheck,
  ShieldAlert,
  HardDrive,
  Laptop
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { showSuccess, showError } from '@/utils/toast';

export interface ActiveSession {
  sessionId: string;
  deviceId: string;
  name: string;
  role: string; // 'admin' | 'staff' | 'teacher' | 'student' | 'jamlyan_analytics'
  deviceType: string; // 'Desktop Browser' | 'Android APK' | 'Tablet'
  connectionType: 'LAN' | 'Firestore' | 'Local';
  currentScreen: string;
  lastSeenAt: number; // timestamp
}

export function useSessionHeartbeat() {
  useEffect(() => {
    const updateHeartbeat = () => {
      try {
        const storedUser = localStorage.getItem('munyaka_user') || localStorage.getItem('munyaka_current_user') || localStorage.getItem('munyaka_admin_session');
        let userName = 'Jamlyan Operator';
        let userRole = 'jamlyan_analytics';
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            userName = parsed.name || parsed.username || parsed.email || 'Active Operator';
            userRole = parsed.role || 'jamlyan_analytics';
          } catch {
            userName = storedUser;
          }
        }

        const sessionId = localStorage.getItem('munyaka_active_session_id') || `sess_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem('munyaka_active_session_id', sessionId);

        const deviceId = localStorage.getItem('munyaka_device_id') || `dev_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem('munyaka_device_id', deviceId);

        const currentSession: ActiveSession = {
          sessionId,
          deviceId,
          name: userName,
          role: userRole,
          deviceType: navigator.userAgent.includes('Mobile') ? 'Mobile / Tablet' : 'Desktop Browser',
          connectionType: localStorage.getItem('munyaka_lan_server_url') ? 'LAN' : 'Firestore',
          currentScreen: window.location.hash || window.location.pathname,
          lastSeenAt: Date.now()
        };

        // Read existing active sessions from localStorage
        const rawSessions = localStorage.getItem('munyaka_active_sessions');
        let sessions: ActiveSession[] = [];
        if (rawSessions) {
          try {
            sessions = JSON.parse(rawSessions);
            if (!Array.isArray(sessions)) sessions = [];
          } catch {
            sessions = [];
          }
        }

        // Filter out stale sessions (> 3 mins old) and update/add current session
        const now = Date.now();
        sessions = sessions.filter(s => now - s.lastSeenAt < 180000 && s.sessionId !== sessionId);
        sessions.unshift(currentSession);

        localStorage.setItem('munyaka_active_sessions', JSON.stringify(sessions));

        // Also sync to custom event for multi-tab updates
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.error('Error updating heartbeat:', err);
      }
    };

    updateHeartbeat();
    const interval = setInterval(updateHeartbeat, 15000); // every 15 seconds
    return () => clearInterval(interval);
  }, []);
}
