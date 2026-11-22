import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useSessionPresence() {
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Generate or get unique device identifier
    let deviceId = localStorage.getItem('munyaka_device_id');
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('munyaka_device_id', deviceId);
    }

    const getDeviceType = () => {
      const ua = navigator.userAgent || '';
      if (/android/i.test(ua)) return 'Android APK / Mobile';
      if (/iphone|ipad|ipod/i.test(ua)) return 'iOS Device';
      if (/windows|macintosh|linux/i.test(ua)) return 'Desktop Browser';
      return 'Web Browser';
    };

    const sendHeartbeat = async (status = 'online') => {
      try {
        const lanUrl = localStorage.getItem('munyaka_lan_server_url') || localStorage.getItem('lan_server_url');
        const isLanConnected = localStorage.getItem('munyaka_lan_connected') === 'true' || !!lanUrl;
        
        const payload = {
          deviceId,
          userId: user.id || user.email || 'unknown',
          name: user.name || user.email || 'User',
          role: user.role || 'staff',
          deviceType: getDeviceType(),
          userAgent: navigator.userAgent.substring(0, 100),
          connectionSource: isLanConnected ? 'LAN Server' : 'Firestore Cloud',
          currentRoute: window.location.hash || window.location.pathname || '/dashboard',
          lastSeenAt: new Date().toISOString(),
          status,
        };

        // 1. Send to Local LAN Server if configured
        if (lanUrl) {
          fetch(`${lanUrl}/api/presence/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(3000),
          }).catch(() => {});
        }

        // 2. Also save to localStorage for local analytics sync
        const activeSessions = JSON.parse(localStorage.getItem('munyaka_active_sessions_store') || '{}');
        activeSessions[deviceId] = payload;
        localStorage.setItem('munyaka_active_sessions_store', JSON.stringify(activeSessions));

        // 3. Check for remote force-logout signal
        const forceLogoutFlag = localStorage.getItem('munyaka_force_logout_' + deviceId);
        if (forceLogoutFlag === 'true') {
          localStorage.removeItem('munyaka_force_logout_' + deviceId);
          logout();
          window.location.href = '/#/login';
        }
      } catch {
        // Silent catch for background presence
      }
    };

    // Send initial heartbeat
    sendHeartbeat('online');

    // Interval every 30 seconds
    const interval = setInterval(() => {
      sendHeartbeat('online');
    }, 30000);

    const handleVisibility = () => {
      if (document.hidden) {
        sendHeartbeat('idle');
      } else {
        sendHeartbeat('online');
      }
    };

    const handleBeforeUnload = () => {
      sendHeartbeat('offline');
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      sendHeartbeat('offline');
    };
  }, [isAuthenticated, user, logout]);
}
