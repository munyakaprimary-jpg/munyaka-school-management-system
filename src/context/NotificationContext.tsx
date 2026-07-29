import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { showSuccess, showError } from '@/utils/toast';

export type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;          // ISO string
  read: boolean;
  link?: string;              // optional URL to navigate to
};

type NotificationContextProps = {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismiss: () => void;
};

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Load notifications from Supabase on mount / when user changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, payload => {
        // In a real app you could push updates here; for demo we just refetch
        refreshNotifications();
      })
      .subscribe();

    refreshNotifications();
    return () => channel.unsubscribe();
  }, [user]);

  const refreshNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .then(res => {
        if (error) throw error;
        return res;
      }) as Promise<Notification[]>;

    if (error) {
      console.error('Supabase error:', error);
      return;
    }

    setNotifications(res);
    setUnreadCount(res.filter(n => !n.read).length);
  }, [user]);

  const addNotification = (n: Omit<Notification, 'read'>) => {
    const newNotification: Notification = { ...n, read: false };
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => prev - 1);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const dismiss = () => setIsOpen(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (event.target instanceof HTMLElement && !event.target.closest('#notification-popover')) {
        dismiss();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismiss,
    isOpen,
    setIsOpen,
  };
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  return (
    <NotificationContext.Provider value={{ ...useNotification(), isOpen }}>
      {children}
    </NotificationContext.Provider>
  );
};